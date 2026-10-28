// Export als JSON (wieder einlesbar) und CSV (für Excel), Import aus JSON. Ohne DOM.

import { SCHEMA_VERSION, sortiereKunden, termineVon, vollerName } from './modell.js';
import { heute, isoTeile } from './zeit.js';

export const APP_KENNUNG = 'lumiere-kunden';

export function dateiname(art, endung, jetzt = new Date()) {
  return `kundenkartei-${art}-${heute(jetzt)}.${endung}`;
}

export function exportJson({ kunden, termine }, jetzt = new Date()) {
  return JSON.stringify(
    {
      app: APP_KENNUNG,
      schemaVersion: SCHEMA_VERSION,
      exportiertAm: jetzt.toISOString(),
      kunden,
      termine,
    },
    null,
    2,
  );
}

// ---------- Import ----------

function fehler(meldung) {
  return new Error(`Die Datei kann nicht eingelesen werden: ${meldung}`);
}

function istText(v) {
  return typeof v === 'string';
}

function istZeitpunkt(v) {
  return istText(v) && v.length > 0 && !Number.isNaN(new Date(v).getTime());
}

function optionalerText(v, feld, wo) {
  if (v === undefined || v === null) return '';
  if (!istText(v)) throw fehler(`${wo}: Feld «${feld}» ist kein Text.`);
  return v;
}

// Prüft die ganze Datei, bevor etwas ersetzt wird. Liefert bereinigte Daten.
export function importJson(inhalt) {
  let daten;
  try {
    daten = JSON.parse(inhalt);
  } catch {
    throw fehler('keine gültige JSON-Datei.');
  }
  if (!daten || typeof daten !== 'object' || daten.app !== APP_KENNUNG) {
    throw fehler('es ist keine Sicherung dieser App.');
  }
  if (!Number.isInteger(daten.schemaVersion) || daten.schemaVersion > SCHEMA_VERSION) {
    throw fehler('die Sicherung stammt aus einer neueren Version der App.');
  }
  if (!Array.isArray(daten.kunden) || !Array.isArray(daten.termine)) {
    throw fehler('Kunden oder Termine fehlen.');
  }

  const kundenIds = new Set();
  const kunden = daten.kunden.map((k, i) => {
    const wo = `Kunde ${i + 1}`;
    if (!k || typeof k !== 'object') throw fehler(`${wo} ist ungültig.`);
    if (!istText(k.id) || !k.id) throw fehler(`${wo} hat keine ID.`);
    if (kundenIds.has(k.id)) throw fehler(`${wo}: ID kommt doppelt vor.`);
    kundenIds.add(k.id);
    const vorname = optionalerText(k.vorname, 'vorname', wo);
    const nachname = optionalerText(k.nachname, 'nachname', wo);
    if (!vorname.trim() && !nachname.trim()) throw fehler(`${wo} hat keinen Namen.`);
    if (!istZeitpunkt(k.erstelltAm)) throw fehler(`${wo}: Erfassungsdatum fehlt.`);
    return {
      id: k.id,
      vorname,
      nachname,
      telefon: optionalerText(k.telefon, 'telefon', wo),
      mail: optionalerText(k.mail, 'mail', wo),
      notizen: optionalerText(k.notizen, 'notizen', wo),
      erstelltAm: k.erstelltAm,
      geaendertAm: istZeitpunkt(k.geaendertAm) ? k.geaendertAm : k.erstelltAm,
    };
  });

  const terminIds = new Set();
  const termine = daten.termine.map((t, i) => {
    const wo = `Termin ${i + 1}`;
    if (!t || typeof t !== 'object') throw fehler(`${wo} ist ungültig.`);
    if (!istText(t.id) || !t.id) throw fehler(`${wo} hat keine ID.`);
    if (terminIds.has(t.id)) throw fehler(`${wo}: ID kommt doppelt vor.`);
    terminIds.add(t.id);
    if (!kundenIds.has(t.kundeId)) throw fehler(`${wo} gehört zu keinem Kunden.`);
    if (!istZeitpunkt(t.beginn)) throw fehler(`${wo}: Beginn fehlt oder ist ungültig.`);
    if (!Number.isInteger(t.dauerMinuten) || t.dauerMinuten <= 0) {
      throw fehler(`${wo}: Dauer ist ungültig.`);
    }
    return {
      id: t.id,
      kundeId: t.kundeId,
      beginn: t.beginn,
      dauerMinuten: t.dauerMinuten,
      leistung: optionalerText(t.leistung, 'leistung', wo),
      notiz: optionalerText(t.notiz, 'notiz', wo),
      erstelltAm: istZeitpunkt(t.erstelltAm) ? t.erstelltAm : t.beginn,
    };
  });

  return { kunden, termine };
}

// ---------- CSV für Excel (Schweiz: Semikolon, UTF-8 mit BOM) ----------

const TELEFON = /^\+?[\d\s/().-]+$/;

export function csvZelle(wert) {
  let s = wert === undefined || wert === null ? '' : String(wert);
  // Schutz gegen Formeln in Excel, Telefonnummern wie +41 79 … bleiben unverändert.
  if (/^[=+\-@\t\r]/.test(s) && !TELEFON.test(s)) s = `'${s}`;
  if (/[";\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csv(zeilen) {
  return '﻿' + zeilen.map((z) => z.map(csvZelle).join(';')).join('\r\n') + '\r\n';
}

export function kundenCsv({ kunden, termine }) {
  const zeilen = [['Nachname', 'Vorname', 'Telefon', 'Mail', 'Notizen', 'Erfasst am', 'Anzahl Termine']];
  for (const k of sortiereKunden(kunden)) {
    zeilen.push([
      k.nachname,
      k.vorname,
      k.telefon,
      k.mail,
      k.notizen,
      isoTeile(k.erstelltAm).datum,
      termineVon(termine, k.id).length,
    ]);
  }
  return csv(zeilen);
}

export function termineCsv({ kunden, termine }) {
  const nachId = new Map(kunden.map((k) => [k.id, k]));
  const sortiert = [...termine].sort((a, b) => new Date(a.beginn) - new Date(b.beginn));
  const zeilen = [['Datum', 'Uhrzeit', 'Dauer (Min.)', 'Kunde', 'Telefon', 'Leistung', 'Notiz']];
  for (const t of sortiert) {
    const k = nachId.get(t.kundeId);
    const { datum, zeit } = isoTeile(t.beginn);
    zeilen.push([datum, zeit, t.dauerMinuten, k ? vollerName(k) : '', k?.telefon ?? '', t.leistung, t.notiz]);
  }
  return csv(zeilen);
}
