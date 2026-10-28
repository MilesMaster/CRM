import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  plusTage, wochentag, wochenStart, tageDerWoche, plusMonate, monatsRaster, kalenderwoche,
  termineJeTag, monatsTitel, wochenTitel, tagKopf, tagesZahl,
} from '../app/js/kalender.js';
import { neuerTermin } from '../app/js/modell.js';

test('Tage rechnen über Monats-, Jahres- und Zeitumstellungsgrenzen', () => {
  assert.equal(plusTage('2026-10-24', 2), '2026-10-26'); // über die Umstellung am 25.10.
  assert.equal(plusTage('2026-03-28', 2), '2026-03-30');
  assert.equal(plusTage('2026-12-31', 1), '2027-01-01');
  assert.equal(plusTage('2028-03-01', -1), '2028-02-29');
});

test('Woche beginnt am Montag', () => {
  assert.equal(wochentag('2026-10-26'), 0); // Montag
  assert.equal(wochentag('2026-11-01'), 6); // Sonntag
  assert.equal(wochenStart('2026-11-01'), '2026-10-26');
  assert.equal(wochenStart('2026-10-26'), '2026-10-26');
  assert.deepEqual(tageDerWoche('2026-10-28'), [
    '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01',
  ]);
});

test('Monate blättern, Monatsende gekürzt', () => {
  assert.equal(plusMonate('2026-01-31', 1), '2026-02-28');
  assert.equal(plusMonate('2026-12-15', 1), '2027-01-15');
  assert.equal(plusMonate('2026-03-31', -1), '2026-02-28');
});

test('Monatsraster deckt den ganzen Monat in ganzen Wochen ab', () => {
  const okt = monatsRaster('2026-10-28');
  assert.equal(okt.length, 5);
  assert.equal(okt[0][0], '2026-09-28');
  assert.equal(okt[4][6], '2026-11-01');
  assert.ok(okt.every((w) => w.length === 7));
  assert.equal(monatsRaster('2027-02-10').length, 4); // Februar 2027 beginnt am Montag
  assert.equal(monatsRaster('2026-02-10')[0][6], '2026-02-01'); // Februar 2026 beginnt am Sonntag
  assert.equal(monatsRaster('2026-08-01').length, 6); // August 2026 beginnt am Samstag
});

test('ISO-Kalenderwoche', () => {
  assert.equal(kalenderwoche('2026-10-28'), 44);
  assert.equal(kalenderwoche('2026-01-01'), 1);
  assert.equal(kalenderwoche('2027-01-01'), 53); // gehört zur KW 53 von 2026
  assert.equal(kalenderwoche('2024-12-30'), 1);
});

test('Termine je Tag, nach Zürcher Datum und Uhrzeit', () => {
  const jetzt = new Date('2026-10-28T10:00:00Z');
  const termine = [
    neuerTermin('k1', { datum: '2026-10-28', zeit: '14:00', dauerMinuten: 60 }, jetzt, 'b'),
    neuerTermin('k2', { datum: '2026-10-28', zeit: '09:00', dauerMinuten: 60 }, jetzt, 'a'),
    // 00:30 Zürich ist noch am Vortag in UTC: muss trotzdem am 29. stehen
    neuerTermin('k1', { datum: '2026-10-29', zeit: '00:30', dauerMinuten: 30 }, jetzt, 'c'),
    neuerTermin('k1', { datum: '2026-11-05', zeit: '10:00', dauerMinuten: 60 }, jetzt, 'ausserhalb'),
  ];
  const karte = termineJeTag(termine, '2026-10-26', '2026-11-01');
  assert.deepEqual(karte.get('2026-10-28').map((t) => t.id), ['a', 'b']);
  assert.deepEqual(karte.get('2026-10-29').map((t) => t.id), ['c']);
  assert.equal(karte.has('2026-11-05'), false);
});

test('Titel', () => {
  assert.equal(monatsTitel('2026-10-28'), 'Oktober 2026');
  assert.equal(wochenTitel('2026-10-28'), 'KW 44 · 26. Okt. bis 1. Nov. 2026');
  assert.match(tagKopf('2026-10-26'), /^Mo/);
  assert.equal(tagesZahl('2026-10-05'), 5);
});
