import { test } from 'node:test';
import assert from 'node:assert/strict';
import { googleLink, ics, falten, icsText, titel, icsDateiname } from '../app/js/kalender.js';
import { neuerKunde, neuerTermin } from '../app/js/modell.js';

const jetzt = new Date('2026-10-28T10:00:00Z');
const kunde = neuerKunde({ vorname: 'Anna', nachname: 'Muster', telefon: '+41 79 123 45 67' }, jetzt, 'k1');
const termin = neuerTermin('k1', { datum: '2026-11-03', zeit: '14:30', dauerMinuten: 90, leistung: 'Farbe & Schnitt', notiz: 'Ton 7/1; danach föhnen' }, jetzt, 't1');

test('Google-Link enthält alle Teile', () => {
  const url = new URL(googleLink(termin, kunde));
  assert.equal(url.origin + url.pathname, 'https://calendar.google.com/calendar/render');
  assert.equal(url.searchParams.get('action'), 'TEMPLATE');
  assert.equal(url.searchParams.get('text'), 'Farbe & Schnitt · Anna Muster');
  assert.equal(url.searchParams.get('dates'), '20261103T133000Z/20261103T150000Z');
  assert.equal(url.searchParams.get('ctz'), 'Europe/Zurich');
  assert.equal(url.searchParams.get('details'), 'Telefon: +41 79 123 45 67\nNotiz: Ton 7/1; danach föhnen');
});

test('Google-Link ohne Details, Titel ohne Leistung', () => {
  const k = neuerKunde({ vorname: 'Lou' }, jetzt, 'k2');
  const t = neuerTermin('k2', { datum: '2026-07-01', zeit: '09:00', dauerMinuten: 30 }, jetzt, 't2');
  const url = new URL(googleLink(t, k));
  assert.equal(url.searchParams.get('details'), null);
  assert.equal(titel(t, k), 'Termin · Lou');
  assert.equal(url.searchParams.get('dates'), '20260701T070000Z/20260701T073000Z');
});

test('ICS: Aufbau, Zeitzone, Zeilenenden', () => {
  const text = ics(termin, kunde, jetzt);
  assert.ok(text.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(text.endsWith('END:VCALENDAR\r\n'));
  assert.ok(!/[^\r]\n/.test(text), 'nur CRLF');
  const entfaltet = text.replace(/\r\n /g, '');
  assert.match(entfaltet, /\r\nDTSTART;TZID=Europe\/Zurich:20261103T143000\r\n/);
  assert.match(entfaltet, /\r\nDTEND;TZID=Europe\/Zurich:20261103T160000\r\n/);
  assert.match(entfaltet, /\r\nUID:t1@lumiere-kunden\r\n/);
  assert.match(entfaltet, /\r\nDTSTAMP:20261028T100000Z\r\n/);
  assert.match(entfaltet, /\r\nSUMMARY:Farbe & Schnitt · Anna Muster\r\n/);
  assert.match(entfaltet, /\r\nDESCRIPTION:Telefon: \+41 79 123 45 67\\nNotiz: Ton 7\/1\\; danach föhnen\r\n/);
  assert.match(entfaltet, /BEGIN:VTIMEZONE\r\nTZID:Europe\/Zurich/);
  for (const z of text.split('\r\n')) assert.ok(new TextEncoder().encode(z).length <= 75, z);
});

test('ICS-Text maskiert', () => {
  assert.equal(icsText('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
});

test('Falten trennt keine Umlaute', () => {
  const lang = 'DESCRIPTION:' + 'ä'.repeat(100);
  const gefaltet = falten(lang);
  for (const z of gefaltet.split('\r\n')) {
    assert.ok(new TextEncoder().encode(z).length <= 75);
    assert.ok(!z.includes('�'));
  }
  assert.equal(gefaltet.replace(/\r\n /g, ''), lang);
});

test('ICS-Dateiname', () => {
  assert.equal(icsDateiname(termin), 'termin-2026-11-03.ics');
});
