// Datenmodell, Prüfung, Suche und Sortierung. Ohne DOM.

import { lokalZuIso, gueltigesDatum, gueltigeZeit } from './zeit.js';

export const SCHEMA_VERSION = 1;
export const EXPORT_HINWEIS_TAGE = 30;
export const DAUER_MIN = 5;
export const DAUER_MAX = 720;

const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(wert) {
  return typeof wert === 'string' ? wert.trim() : '';
}

function neueId() {
  return crypto.randomUUID();
}

// ---------- Kunden ----------

export function pruefeKunde(eingabe) {
  const fehler = [];
  if (!text(eingabe.vorname) && !text(eingabe.nachname)) {
    fehler.push('Bitte Vorname oder Nachname angeben.');
  }
  const mail = text(eingabe.mail);
  if (mail && !MAIL_RE.test(mail)) fehler.push('Die Mail-Adresse sieht nicht gültig aus.');
  return fehler;
}

function kundenFelder(eingabe) {
  return {
    vorname: text(eingabe.vorname),
    nachname: text(eingabe.nachname),
    telefon: text(eingabe.telefon),
    mail: text(eingabe.mail),
    // Notizen nur am Ende kürzen, Zeilenumbrüche bleiben.
    notizen: typeof eingabe.notizen === 'string' ? eingabe.notizen.replace(/\s+$/, '') : '',
  };
}

export function neuerKunde(eingabe, jetzt = new Date(), id = neueId()) {
  const zeit = jetzt.toISOString();
  return { id, ...kundenFelder(eingabe), erstelltAm: zeit, geaendertAm: zeit };
}

export function kundeAktualisieren(kunde, eingabe, jetzt = new Date()) {
  return { ...kunde, ...kundenFelder(eingabe), geaendertAm: jetzt.toISOString() };
}

export function vollerName(kunde) {
  return [kunde.vorname, kunde.nachname].filter(Boolean).join(' ');
}

// ---------- Termine ----------

export function pruefeTermin(eingabe) {
  const fehler = [];
  if (!gueltigesDatum(eingabe.datum)) fehler.push('Bitte ein gültiges Datum wählen.');
  if (!gueltigeZeit(eingabe.zeit)) fehler.push('Bitte eine gültige Uhrzeit wählen.');
  const dauer = Number(eingabe.dauerMinuten);
  if (!Number.isInteger(dauer) || dauer < DAUER_MIN || dauer > DAUER_MAX) {
    fehler.push(`Die Dauer muss zwischen ${DAUER_MIN} und ${DAUER_MAX} Minuten liegen.`);
  }
  if (fehler.length === 0) {
    try {
      lokalZuIso(eingabe.datum, eingabe.zeit);
    } catch (e) {
      fehler.push(e.message + '.');
    }
  }
  return fehler;
}

function terminFelder(eingabe) {
  return {
    beginn: lokalZuIso(eingabe.datum, eingabe.zeit),
    dauerMinuten: Number(eingabe.dauerMinuten),
    leistung: text(eingabe.leistung),
    notiz: typeof eingabe.notiz === 'string' ? eingabe.notiz.replace(/\s+$/, '') : '',
  };
}

export function neuerTermin(kundeId, eingabe, jetzt = new Date(), id = neueId()) {
  return { id, kundeId, ...terminFelder(eingabe), erstelltAm: jetzt.toISOString() };
}

export function terminAktualisieren(termin, eingabe) {
  return { ...termin, ...terminFelder(eingabe) };
}

export function terminEnde(termin) {
  return new Date(new Date(termin.beginn).getTime() + termin.dauerMinuten * 60000);
}

export function termineVon(termine, kundeId) {
  return termine.filter((t) => t.kundeId === kundeId);
}

function neuesteZuerst(a, b) {
  return new Date(b.beginn) - new Date(a.beginn);
}

// Kommend ist, was noch nicht zu Ende ist. Beide Listen neueste zuerst.
export function teileTermine(termine, jetzt = new Date()) {
  const kommende = [];
  const vergangene = [];
  for (const t of termine) {
    (terminEnde(t) > jetzt ? kommende : vergangene).push(t);
  }
  kommende.sort(neuesteZuerst);
  vergangene.sort(neuesteZuerst);
  return { kommende, vergangene };
}

// Letzter vergangener und nächster kommender Termin je Kunde, für die Liste.
export function terminUebersicht(termine, jetzt = new Date()) {
  const karte = new Map();
  for (const t of termine) {
    let e = karte.get(t.kundeId);
    if (!e) karte.set(t.kundeId, (e = { letzter: null, naechster: null }));
    if (terminEnde(t) > jetzt) {
      if (!e.naechster || new Date(t.beginn) < new Date(e.naechster.beginn)) e.naechster = t;
    } else if (!e.letzter || new Date(t.beginn) > new Date(e.letzter.beginn)) {
      e.letzter = t;
    }
  }
  return karte;
}

export function bekannteLeistungen(termine) {
  const s = new Set(termine.map((t) => t.leistung).filter(Boolean));
  return [...s].sort((a, b) => a.localeCompare(b, 'de-CH'));
}

// ---------- Sortieren und Suchen ----------

const vergleich = new Intl.Collator('de-CH', { sensitivity: 'base', numeric: true });

export function sortiereKunden(kunden) {
  return [...kunden].sort(
    (a, b) =>
      vergleich.compare(a.nachname || a.vorname, b.nachname || b.vorname) ||
      vergleich.compare(a.vorname, b.vorname),
  );
}

export function normalisiere(s) {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// Nur Ziffern, Schweizer Vorwahl auf 0 vereinheitlicht: +41 79 … wird 079 …
export function telefonZiffern(s) {
  let z = (s ?? '').replace(/\D/g, '');
  if (z.startsWith('0041')) z = '0' + z.slice(4);
  else if (z.startsWith('41') && z.length === 11) z = '0' + z.slice(2);
  return z;
}

// Ein Suchwort aus Telefon-Zeichen, z. B. 079, +4179 oder (079)123
const TELEFON_WORT = /^[+\d()/.-]*\d[+\d()/.-]*$/;

export function passtZuSuche(kunde, suchtext) {
  const woerter = normalisiere(suchtext).split(/\s+/).filter(Boolean);
  if (woerter.length === 0) return true;
  const textteil = normalisiere([kunde.vorname, kunde.nachname, kunde.mail, kunde.telefon].join(' '));
  const telefon = telefonZiffern(kunde.telefon);
  return woerter.every(
    (w) => textteil.includes(w) || (TELEFON_WORT.test(w) && telefon.includes(telefonZiffern(w))),
  );
}

export function sucheKunden(kunden, suchtext) {
  return sortiereKunden(kunden.filter((k) => passtZuSuche(k, suchtext)));
}

// ---------- Sicherung ----------

export function exportFaellig(letzterExport, hatDaten, jetzt = new Date()) {
  if (!hatDaten) return false;
  if (!letzterExport) return true;
  const tage = (jetzt - new Date(letzterExport)) / 86400000;
  return tage > EXPORT_HINWEIS_TAGE;
}
