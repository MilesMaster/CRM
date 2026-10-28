// Oberfläche: verbindet Speicher, Logik und Seite.

import * as M from './modell.js';
import { googleLink, ics, icsDateiname } from './kalender.js';
import { exportJson, importJson, kundenCsv, termineCsv, dateiname } from './sicherung.js';
import { oeffne } from './speicher.js';
import { formatDatum, formatDatumKurz, formatZeit, formatDauer, isoTeile, heute } from './zeit.js';

const zustand = {
  kunden: [],
  termine: [],
  gewaehltId: null,
  suche: '',
  letzterExport: null,
  persistent: null,
};
let speicher;

const $ = (sel) => document.querySelector(sel);

// Kleiner Baukasten für Elemente. Texte immer als Text, nie als HTML.
function h(tag, attrs = {}, ...kinder) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kind of kinder.flat()) {
    if (kind === null || kind === undefined || kind === false) continue;
    el.append(kind instanceof Node ? kind : String(kind));
  }
  return el;
}

function mehrzahl(n, eins, viele) {
  return `${n} ${n === 1 ? eins : viele}`;
}

function gewaehlterKunde() {
  return zustand.kunden.find((k) => k.id === zustand.gewaehltId) ?? null;
}

// ---------- Meldungen und Rückfragen ----------

let meldungTimer;
function meldung(text) {
  const el = $('#meldung');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(meldungTimer);
  meldungTimer = setTimeout(() => (el.hidden = true), 3500);
}

function frage(titel, text, jaText = 'Ja', nurInfo = false) {
  const dlg = $('#frage-dialog');
  $('#frage-titel').textContent = titel;
  $('#frage-text').textContent = text;
  $('#frage-ja').textContent = jaText;
  $('#frage-ja').className = nurInfo ? 'knopf haupt' : 'knopf gefahr-voll';
  $('#frage-nein').hidden = nurInfo;
  return new Promise((resolve) => {
    const fertig = (wert) => {
      $('#frage-ja').onclick = null;
      $('#frage-nein').onclick = null;
      dlg.onclose = null;
      if (dlg.open) dlg.close();
      resolve(wert);
    };
    $('#frage-ja').onclick = () => fertig(true);
    $('#frage-nein').onclick = () => fertig(false);
    dlg.onclose = () => fertig(false);
    dlg.showModal();
  });
}

// ---------- Hinweise oben ----------

function istHomeBildschirmApp() {
  return navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
}

function sitzungsWert(schluessel) {
  try {
    return sessionStorage.getItem(schluessel);
  } catch {
    return null;
  }
}

function setzeSitzungsWert(schluessel, wert) {
  try {
    sessionStorage.setItem(schluessel, wert);
  } catch {
    // ohne Speicher kommt der Hinweis eben wieder
  }
}

function renderHinweise() {
  const box = $('#hinweise');
  const teile = [];

  if (!istHomeBildschirmApp() && !sitzungsWert('installHinweisWeg')) {
    teile.push(
      h('div', { class: 'hinweis' },
        h('p', {},
          h('strong', {}, 'Als App installieren: '),
          'in Safari auf «Teilen» tippen (Viereck mit Pfeil), dann «Zum Home-Bildschirm». ',
          'Erst als Home-Bildschirm-App bleiben die Daten dauerhaft auf dem iPad.'),
        h('button', {
          type: 'button',
          class: 'knopf leise',
          onclick: () => {
            setzeSitzungsWert('installHinweisWeg', '1');
            renderHinweise();
          },
        }, 'Ausblenden'),
      ),
    );
  }

  if (M.exportFaellig(zustand.letzterExport, zustand.kunden.length > 0)) {
    const seit = zustand.letzterExport
      ? `Die letzte Sicherung ist vom ${formatDatumKurz(zustand.letzterExport)}.`
      : 'Es gibt noch keine Sicherung.';
    teile.push(
      h('div', { class: 'hinweis' },
        h('p', {}, h('strong', {}, 'Bitte sichern. '), seit, ' Empfohlen: einmal im Monat.'),
        h('button', { type: 'button', class: 'knopf haupt', onclick: oeffneSicherung }, 'Jetzt sichern'),
      ),
    );
  }

  box.replaceChildren(...teile);
}

// ---------- Liste ----------

function renderListe() {
  const treffer = M.sucheKunden(zustand.kunden, zustand.suche);
  const uebersicht = M.terminUebersicht(zustand.termine);
  const ul = $('#kundenliste');

  if (zustand.kunden.length === 0) {
    ul.replaceChildren(h('li', { class: 'leer' }, 'Noch keine Kunden. Oben rechts «+ Neuer Kunde» tippen.'));
  } else if (treffer.length === 0) {
    ul.replaceChildren(h('li', { class: 'leer' }, 'Keine Treffer.'));
  } else {
    ul.replaceChildren(
      ...treffer.map((k) => {
        const u = uebersicht.get(k.id);
        let unter = 'Noch kein Termin';
        if (u?.letzter) {
          unter = `Zuletzt ${formatDatumKurz(u.letzter.beginn)}${u.letzter.leistung ? ' · ' + u.letzter.leistung : ''}`;
        } else if (u?.naechster) {
          unter = `Nächster ${formatDatumKurz(u.naechster.beginn)}`;
        }
        return h('li', {},
          h('button', {
            type: 'button',
            'aria-current': k.id === zustand.gewaehltId ? 'true' : null,
            onclick: () => waehle(k.id),
          },
            h('span', { class: 'kunde-name' },
              k.vorname ? k.vorname + ' ' : '',
              h('span', { class: 'nach' }, k.nachname)),
            h('span', { class: 'kunde-unter' }, unter),
          ),
        );
      }),
    );
  }

  $('#liste-zahl').textContent = zustand.suche.trim()
    ? `${treffer.length} von ${mehrzahl(zustand.kunden.length, 'Kunde', 'Kunden')}`
    : zustand.kunden.length ? mehrzahl(zustand.kunden.length, 'Kunde', 'Kunden') : '';
}

function waehle(id) {
  zustand.gewaehltId = id;
  document.body.classList.toggle('zeigt-detail', Boolean(id));
  renderListe();
  renderDetail();
  $('#detail').scrollTop = 0;
}

// ---------- Kundenkarte ----------

function telefonHref(nr) {
  return 'tel:' + nr.replace(/[^\d+]/g, '');
}

function terminZeile(t, kunde, vergangen) {
  return h('li', { class: 'termin' + (vergangen ? ' vergangen' : '') },
    h('div', { class: 'termin-text' },
      h('span', { class: 'termin-zeit' }, `${formatDatum(t.beginn)}, ${formatZeit(t.beginn)}`),
      ` · ${formatDauer(t.dauerMinuten)}`,
      h('span', { class: 'termin-leistung' }, t.leistung || 'Ohne Leistung'),
      t.notiz ? h('span', { class: 'termin-notiz' }, t.notiz) : null,
    ),
    vergangen ? null : h('button', {
      type: 'button',
      class: 'knopf leise',
      onclick: () => oeffneKalender(t, kunde, false),
    }, 'Kalender'),
    h('button', {
      type: 'button',
      class: 'knopf leise',
      onclick: () => oeffneTerminDialog(kunde, t),
    }, 'Bearbeiten'),
  );
}

function renderDetail() {
  const box = $('#detail');
  const k = gewaehlterKunde();
  if (!k) {
    box.replaceChildren(
      h('div', { class: 'detail-leer' },
        h('p', {}, zustand.kunden.length ? 'Kunde in der Liste antippen.' : 'Willkommen. Erfassen Sie den ersten Kunden.'),
        zustand.kunden.length ? null
          : h('button', { type: 'button', class: 'knopf haupt', onclick: () => oeffneKundeDialog(null) }, '+ Neuer Kunde'),
      ),
    );
    return;
  }

  const { kommende, vergangene } = M.teileTermine(M.termineVon(zustand.termine, k.id));

  box.replaceChildren(
    h('button', { type: 'button', class: 'knopf leise zurueck', onclick: () => waehle(null) }, '‹ Liste'),
    h('div', { class: 'karte-kopf' },
      h('div', {},
        h('h2', {}, M.vollerName(k)),
        h('p', { class: 'erfasst' }, `Erfasst am ${formatDatum(k.erstelltAm)}`),
      ),
      h('div', { class: 'reihe' },
        h('button', { type: 'button', class: 'knopf leise', onclick: () => oeffneKundeDialog(k) }, 'Bearbeiten'),
        h('button', { type: 'button', class: 'knopf haupt', onclick: () => oeffneTerminDialog(k, null) }, '+ Neuer Termin'),
      ),
    ),
    h('div', { class: 'kontakt' },
      k.telefon
        ? h('a', { href: telefonHref(k.telefon) }, h('small', {}, 'Telefon'), k.telefon)
        : h('div', { class: 'fehlt' }, h('small', {}, 'Telefon'), 'nicht erfasst'),
      k.mail
        ? h('a', { href: 'mailto:' + k.mail }, h('small', {}, 'Mail'), k.mail)
        : h('div', { class: 'fehlt' }, h('small', {}, 'Mail'), 'nicht erfasst'),
    ),
    h('div', { class: 'abschnitt' },
      h('div', { class: 'abschnitt-kopf' }, h('h3', {}, 'Notizen')),
      h('div', { class: 'notizen' + (k.notizen ? '' : ' leer-text') }, k.notizen || 'Keine Notizen.'),
    ),
    h('div', { class: 'abschnitt' },
      h('div', { class: 'abschnitt-kopf' }, h('h3', {}, 'Termine')),
      kommende.length === 0 && vergangene.length === 0 ? h('p', { class: 'klein' }, 'Noch keine Termine.') : null,
      kommende.length ? [h('h4', {}, `Kommende (${kommende.length})`),
        h('ul', { class: 'termine' }, kommende.map((t) => terminZeile(t, k, false)))] : null,
      vergangene.length ? [h('h4', {}, `Vergangene (${vergangene.length})`),
        h('ul', { class: 'termine' }, vergangene.map((t) => terminZeile(t, k, true)))] : null,
    ),
  );
}

// ---------- Kunde erfassen, bearbeiten, löschen ----------

let kundeInArbeit = null;

function oeffneKundeDialog(kunde) {
  kundeInArbeit = kunde;
  const form = $('#kunde-form');
  form.reset();
  $('#kunde-dialog-titel').textContent = kunde ? 'Kunde bearbeiten' : 'Neuer Kunde';
  $('#kunde-loeschen').hidden = !kunde;
  form.querySelector('.fehler').textContent = '';
  if (kunde) {
    for (const feld of ['vorname', 'nachname', 'telefon', 'mail', 'notizen']) form.elements[feld].value = kunde[feld];
  }
  $('#kunde-dialog').showModal();
}

async function speichereKunde(ereignis) {
  ereignis.preventDefault();
  const form = ereignis.target;
  const eingabe = Object.fromEntries(new FormData(form));
  const fehler = M.pruefeKunde(eingabe);
  if (fehler.length) {
    form.querySelector('.fehler').textContent = fehler.join('\n');
    return;
  }
  const kunde = kundeInArbeit ? M.kundeAktualisieren(kundeInArbeit, eingabe) : M.neuerKunde(eingabe);
  try {
    await speicher.speichere('kunden', kunde);
  } catch (e) {
    form.querySelector('.fehler').textContent = 'Speichern fehlgeschlagen: ' + e.message;
    return;
  }
  zustand.kunden = zustand.kunden.filter((k) => k.id !== kunde.id).concat(kunde);
  $('#kunde-dialog').close();
  if (!kundeInArbeit) {
    zustand.suche = '';
    $('#suche').value = '';
  }
  waehle(kunde.id);
  renderHinweise();
  meldung('Kunde gespeichert.');
}

async function loescheKunde() {
  const k = kundeInArbeit;
  if (!k) return;
  const n = M.termineVon(zustand.termine, k.id).length;
  const text = (n
    ? `Damit ${n === 1 ? 'wird auch 1 Termin' : `werden auch ${n} Termine`} gelöscht. `
    : '') + 'Das lässt sich nicht rückgängig machen.';
  if (!(await frage(`${M.vollerName(k)} löschen?`, text, 'Löschen'))) return;
  await speicher.loescheKunde(k.id);
  zustand.kunden = zustand.kunden.filter((x) => x.id !== k.id);
  zustand.termine = zustand.termine.filter((t) => t.kundeId !== k.id);
  $('#kunde-dialog').close();
  waehle(null);
  renderHinweise();
  meldung('Kunde gelöscht.');
}

// ---------- Termin erfassen, bearbeiten, löschen ----------

let terminInArbeit = null;
let terminKunde = null;

function naechsteHalbeStunde() {
  const schritt = 30 * 60000;
  return isoTeile(new Date(Math.ceil(Date.now() / schritt) * schritt).toISOString()).zeit;
}

function oeffneTerminDialog(kunde, termin) {
  terminKunde = kunde;
  terminInArbeit = termin;
  const form = $('#termin-form');
  form.reset();
  form.querySelector('.fehler').textContent = '';
  $('#termin-dialog-titel').textContent = termin ? 'Termin bearbeiten' : 'Neuer Termin';
  $('#termin-dialog-kunde').textContent = M.vollerName(kunde);
  $('#termin-loeschen').hidden = !termin;
  $('#leistungen').replaceChildren(...M.bekannteLeistungen(zustand.termine).map((l) => h('option', { value: l })));

  const dauer = form.elements.dauerMinuten;
  dauer.querySelectorAll('option[data-extra]').forEach((o) => o.remove());
  if (termin) {
    const { datum, zeit } = isoTeile(termin.beginn);
    form.elements.datum.value = datum;
    form.elements.zeit.value = zeit;
    if (![...dauer.options].some((o) => Number(o.value) === termin.dauerMinuten)) {
      dauer.append(h('option', { value: termin.dauerMinuten, 'data-extra': true }, formatDauer(termin.dauerMinuten)));
    }
    dauer.value = String(termin.dauerMinuten);
    form.elements.leistung.value = termin.leistung;
    form.elements.notiz.value = termin.notiz;
  } else {
    form.elements.datum.value = heute();
    form.elements.zeit.value = naechsteHalbeStunde();
    dauer.value = '60';
  }
  $('#termin-dialog').showModal();
}

async function speichereTermin(ereignis) {
  ereignis.preventDefault();
  const form = ereignis.target;
  const eingabe = Object.fromEntries(new FormData(form));
  const fehler = M.pruefeTermin(eingabe);
  if (fehler.length) {
    form.querySelector('.fehler').textContent = fehler.join('\n');
    return;
  }
  const geaendert = Boolean(terminInArbeit);
  const termin = geaendert
    ? M.terminAktualisieren(terminInArbeit, eingabe)
    : M.neuerTermin(terminKunde.id, eingabe);
  try {
    await speicher.speichere('termine', termin);
  } catch (e) {
    form.querySelector('.fehler').textContent = 'Speichern fehlgeschlagen: ' + e.message;
    return;
  }
  zustand.termine = zustand.termine.filter((t) => t.id !== termin.id).concat(termin);
  $('#termin-dialog').close();
  renderListe();
  renderDetail();
  oeffneKalender(termin, terminKunde, geaendert, geaendert ? 'Termin geändert' : 'Termin gespeichert');
}

async function loescheTermin() {
  const t = terminInArbeit;
  if (!t) return;
  const ok = await frage(
    'Termin löschen?',
    `${formatDatum(t.beginn)}, ${formatZeit(t.beginn)}. Ein Eintrag im Kalender bleibt bestehen und muss dort selbst gelöscht werden.`,
    'Löschen',
  );
  if (!ok) return;
  await speicher.loescheTermin(t.id);
  zustand.termine = zustand.termine.filter((x) => x.id !== t.id);
  $('#termin-dialog').close();
  renderListe();
  renderDetail();
  meldung('Termin gelöscht.');
}

// ---------- Kalender ----------

let kalenderTermin = null;
let kalenderKunde = null;

function oeffneKalender(termin, kunde, geaendert, titel = 'In den Kalender eintragen') {
  kalenderTermin = termin;
  kalenderKunde = kunde;
  $('#kalender-titel').textContent = titel;
  $('#kalender-zusammenfassung').textContent =
    `${M.vollerName(kunde)}: ${formatDatum(termin.beginn)}, ${formatZeit(termin.beginn)}, ` +
    `${formatDauer(termin.dauerMinuten)}${termin.leistung ? ', ' + termin.leistung : ''}.`;
  $('#kalender-aenderung').hidden = !geaendert;
  $('#kalender-google').href = googleLink(termin, kunde);
  $('#kalender-dialog').showModal();
}

function icsHerunterladen() {
  const datei = new File([ics(kalenderTermin, kalenderKunde)], icsDateiname(kalenderTermin), {
    type: 'text/calendar',
  });
  herunterladen(datei);
}

// ---------- Dateien teilen oder herunterladen ----------

function herunterladen(datei) {
  const url = URL.createObjectURL(datei);
  const a = h('a', { href: url, download: datei.name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// Muss direkt aus dem Tippen heraus laufen, sonst blockiert Safari das Teilen.
async function dateienAnbieten(dateien) {
  if (navigator.canShare?.({ files: dateien })) {
    try {
      await navigator.share({ files: dateien });
      return 'geteilt';
    } catch (e) {
      if (e.name === 'AbortError') return 'abgebrochen';
      // anderer Fehler: auf Herunterladen ausweichen
    }
  }
  dateien.forEach(herunterladen);
  return 'heruntergeladen';
}

// ---------- Sicherung ----------

function renderSicherungStand() {
  const stand = zustand.letzterExport ? formatDatum(zustand.letzterExport) : 'noch nie';
  $('#sicherung-stand').textContent =
    `Auf diesem iPad: ${mehrzahl(zustand.kunden.length, 'Kunde', 'Kunden')}, ` +
    `${mehrzahl(zustand.termine.length, 'Termin', 'Termine')}. Letzte Sicherung: ${stand}.`;
  $('#speicher-status').textContent =
    zustand.persistent === true
      ? 'Der Browser hat dauerhaften Speicher zugesagt.'
      : 'Dauerhafter Speicher ist nicht bestätigt. Die App vom Home-Bildschirm aus verwenden und regelmässig sichern.';
}

function oeffneSicherung() {
  renderSicherungStand();
  $('#sicherung-dialog').showModal();
}

async function exportiereJson() {
  const jetzt = new Date();
  const datei = new File(
    [exportJson({ kunden: zustand.kunden, termine: zustand.termine }, jetzt)],
    dateiname('sicherung', 'json', jetzt),
    { type: 'application/json' },
  );
  const ergebnis = await dateienAnbieten([datei]);
  if (ergebnis === 'abgebrochen') return;
  zustand.letzterExport = jetzt.toISOString();
  await speicher.setzeMeta('letzterExport', zustand.letzterExport);
  renderSicherungStand();
  renderHinweise();
  meldung('Sicherung erstellt.');
}

async function exportiereCsv() {
  const daten = { kunden: zustand.kunden, termine: zustand.termine };
  const typ = { type: 'text/csv' };
  await dateienAnbieten([
    new File([kundenCsv(daten)], dateiname('kunden', 'csv'), typ),
    new File([termineCsv(daten)], dateiname('termine', 'csv'), typ),
  ]);
}

async function importiere(ereignis) {
  const eingabe = ereignis.target;
  const datei = eingabe.files?.[0];
  eingabe.value = '';
  if (!datei) return;
  let daten;
  try {
    daten = importJson(await datei.text());
  } catch (e) {
    await frage('Einlesen nicht möglich', e.message, 'OK', true);
    return;
  }
  const ok = await frage(
    'Alle Daten ersetzen?',
    `Auf diesem iPad: ${mehrzahl(zustand.kunden.length, 'Kunde', 'Kunden')}, ` +
      `${mehrzahl(zustand.termine.length, 'Termin', 'Termine')}. ` +
      `In der Sicherung: ${mehrzahl(daten.kunden.length, 'Kunde', 'Kunden')}, ` +
      `${mehrzahl(daten.termine.length, 'Termin', 'Termine')}. ` +
      'Die Daten auf dem iPad werden dabei gelöscht.',
    'Ersetzen',
  );
  if (!ok) return;
  await speicher.ersetzeAlles(daten);
  zustand.kunden = daten.kunden;
  zustand.termine = daten.termine;
  $('#sicherung-dialog').close();
  waehle(null);
  renderHinweise();
  meldung(`Eingelesen: ${mehrzahl(daten.kunden.length, 'Kunde', 'Kunden')}.`);
}

// ---------- Start ----------

function verdrahte() {
  $('#suche').addEventListener('input', (e) => {
    zustand.suche = e.target.value;
    renderListe();
  });
  $('#knopf-neuer-kunde').addEventListener('click', () => oeffneKundeDialog(null));
  $('#knopf-sicherung').addEventListener('click', oeffneSicherung);
  $('#kunde-form').addEventListener('submit', speichereKunde);
  $('#kunde-loeschen').addEventListener('click', loescheKunde);
  $('#termin-form').addEventListener('submit', speichereTermin);
  $('#termin-loeschen').addEventListener('click', loescheTermin);
  $('#kalender-ics').addEventListener('click', icsHerunterladen);
  $('#kalender-google').addEventListener('click', () => setTimeout(() => $('#kalender-dialog').close(), 300));
  $('#export-json').addEventListener('click', exportiereJson);
  $('#export-csv').addEventListener('click', exportiereCsv);
  $('#import-datei').addEventListener('change', importiere);
  for (const knopf of document.querySelectorAll('[data-schliessen]')) {
    knopf.addEventListener('click', () => knopf.closest('dialog').close());
  }
  matchMedia('(display-mode: standalone)').addEventListener?.('change', renderHinweise);
}

async function dauerhafterSpeicher() {
  if (!navigator.storage?.persist) return null;
  try {
    return (await navigator.storage.persisted()) || (await navigator.storage.persist());
  } catch {
    return null;
  }
}

async function start() {
  verdrahte();
  try {
    speicher = await oeffne();
    [zustand.kunden, zustand.termine, zustand.letzterExport] = await Promise.all([
      speicher.alle('kunden'),
      speicher.alle('termine'),
      speicher.meta('letzterExport'),
    ]);
  } catch (e) {
    $('#detail').replaceChildren(
      h('div', { class: 'detail-leer' },
        h('p', {}, 'Der Speicher dieses Browsers ist nicht verfügbar.'),
        h('p', { class: 'klein' }, String(e?.message ?? e))),
    );
    return;
  }
  renderHinweise();
  renderListe();
  renderDetail();

  zustand.persistent = await dauerhafterSpeicher();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // ohne Service Worker läuft die App, nur nicht offline
    });
  }
}

start();
