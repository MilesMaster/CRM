// Google-Kalender-Link und .ics-Datei für einen Termin. Ohne DOM.

import { ZONE, isoTeile } from './zeit.js';
import { vollerName, terminEnde } from './modell.js';

export const GOOGLE_BASIS = 'https://calendar.google.com/calendar/render';

export function titel(termin, kunde) {
  return `${termin.leistung || 'Termin'} · ${vollerName(kunde)}`;
}

export function beschreibung(termin, kunde) {
  const zeilen = [];
  if (kunde.telefon) zeilen.push(`Telefon: ${kunde.telefon}`);
  if (termin.notiz) zeilen.push(`Notiz: ${termin.notiz}`);
  return zeilen.join('\n');
}

// 20261103T133000Z
function utcStempel(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// 20261103T143000 (Wanduhr Zürich)
function lokalStempel(date) {
  const { datum, zeit } = isoTeile(date.toISOString());
  return `${datum.replace(/-/g, '')}T${zeit.replace(':', '')}00`;
}

export function googleLink(termin, kunde) {
  const beginn = new Date(termin.beginn);
  const ende = terminEnde(termin);
  const teile = [
    ['action', 'TEMPLATE'],
    ['text', titel(termin, kunde)],
    ['dates', `${utcStempel(beginn)}/${utcStempel(ende)}`],
    ['ctz', ZONE],
  ];
  const details = beschreibung(termin, kunde);
  if (details) teile.push(['details', details]);
  const query = teile.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return `${GOOGLE_BASIS}?${query}`;
}

// ---------- ICS (RFC 5545) ----------

export function icsText(s) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

const kodierer = new TextEncoder();

// Zeilen über 75 Byte falten, ohne ein Zeichen zu zerschneiden.
export function falten(zeile) {
  const teile = [];
  let aktuell = '';
  let bytes = 0;
  for (const zeichen of zeile) {
    const n = kodierer.encode(zeichen).length;
    const grenze = teile.length === 0 ? 75 : 74; // Folgezeilen beginnen mit Leerzeichen
    if (bytes + n > grenze) {
      teile.push(aktuell);
      aktuell = '';
      bytes = 0;
    }
    aktuell += zeichen;
    bytes += n;
  }
  teile.push(aktuell);
  return teile.join('\r\n ');
}

const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${ZONE}`,
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19810329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19961027T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

export function ics(termin, kunde, jetzt = new Date()) {
  const zeilen = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lumiere Kunden//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...VTIMEZONE,
    'BEGIN:VEVENT',
    `UID:${termin.id}@lumiere-kunden`,
    `DTSTAMP:${utcStempel(jetzt)}`,
    `DTSTART;TZID=${ZONE}:${lokalStempel(new Date(termin.beginn))}`,
    `DTEND;TZID=${ZONE}:${lokalStempel(terminEnde(termin))}`,
    `SUMMARY:${icsText(titel(termin, kunde))}`,
  ];
  const details = beschreibung(termin, kunde);
  if (details) zeilen.push(`DESCRIPTION:${icsText(details)}`);
  zeilen.push('END:VEVENT', 'END:VCALENDAR');
  return zeilen.map(falten).join('\r\n') + '\r\n';
}

export function icsDateiname(termin) {
  return `termin-${isoTeile(termin.beginn).datum}.ics`;
}
