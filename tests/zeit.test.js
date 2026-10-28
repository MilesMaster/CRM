import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  lokalZuIso, lokalZuDate, isoTeile, versatzMinuten, gueltigesDatum, gueltigeZeit,
  formatDauer, formatZeit, heute,
} from '../app/js/zeit.js';

test('Winterzeit: +01:00', () => {
  assert.equal(lokalZuIso('2026-11-03', '14:30'), '2026-11-03T14:30:00+01:00');
  assert.equal(lokalZuDate('2026-11-03', '14:30').toISOString(), '2026-11-03T13:30:00.000Z');
});

test('Sommerzeit: +02:00', () => {
  assert.equal(lokalZuIso('2026-07-01', '09:00'), '2026-07-01T09:00:00+02:00');
  assert.equal(lokalZuDate('2026-07-01', '09:00').toISOString(), '2026-07-01T07:00:00.000Z');
});

test('Tage der Zeitumstellung', () => {
  // 29.03.2026: 02:00 springt auf 03:00
  assert.equal(lokalZuIso('2026-03-29', '01:30'), '2026-03-29T01:30:00+01:00');
  assert.equal(lokalZuIso('2026-03-29', '03:30'), '2026-03-29T03:30:00+02:00');
  assert.throws(() => lokalZuDate('2026-03-29', '02:30'), /Zeitumstellung/);
  // 25.10.2026: zurück auf Winterzeit
  assert.equal(lokalZuIso('2026-10-25', '12:00'), '2026-10-25T12:00:00+01:00');
});

test('Hin und zurück über isoTeile', () => {
  for (const [d, z] of [['2026-01-01', '00:00'], ['2026-06-15', '23:59'], ['2027-12-31', '08:05']]) {
    assert.deepEqual(isoTeile(lokalZuIso(d, z)), { datum: d, zeit: z });
  }
});

test('Versatz', () => {
  assert.equal(versatzMinuten(new Date('2026-01-15T12:00:00Z')), 60);
  assert.equal(versatzMinuten(new Date('2026-08-15T12:00:00Z')), 120);
});

test('Ungültige Eingaben', () => {
  assert.equal(gueltigesDatum('2026-02-30'), false);
  assert.equal(gueltigesDatum('2028-02-29'), true);
  assert.equal(gueltigesDatum(''), false);
  assert.equal(gueltigeZeit('24:00'), false);
  assert.equal(gueltigeZeit('9:00'), false);
  assert.equal(gueltigeZeit('09:00'), true);
  assert.throws(() => lokalZuIso('2026-13-01', '10:00'), /Datum/);
});

test('Anzeige', () => {
  assert.equal(formatDauer(45), '45 Min.');
  assert.equal(formatDauer(60), '1 Std.');
  assert.equal(formatDauer(90), '1 Std. 30 Min.');
  assert.equal(formatZeit('2026-11-03T13:30:00Z'), '14:30');
  assert.equal(heute(new Date('2026-10-28T23:30:00Z')), '2026-10-29');
});
