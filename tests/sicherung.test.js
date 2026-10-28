import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exportJson, importJson, kundenCsv, termineCsv, csvZelle, dateiname } from '../app/js/sicherung.js';
import { neuerKunde, neuerTermin } from '../app/js/modell.js';

const jetzt = new Date('2026-10-28T10:00:00Z');
const kunden = [
  neuerKunde({ vorname: 'Anna', nachname: 'Muster', telefon: '+41 79 123 45 67', notizen: 'Farbe 7/1; "warm"\nAllergie' }, jetzt, 'k1'),
  neuerKunde({ vorname: 'Lou', nachname: 'Beispiel' }, jetzt, 'k2'),
];
const termine = [neuerTermin('k1', { datum: '2026-11-03', zeit: '14:30', dauerMinuten: 60, leistung: 'Schnitt' }, jetzt, 't1')];

test('JSON hin und zurück ergibt dieselben Daten', () => {
  const text = exportJson({ kunden, termine }, jetzt);
  assert.deepEqual(importJson(text), { kunden, termine });
});

test('Import lehnt fremde und kaputte Dateien ab', () => {
  assert.throws(() => importJson('nicht json'), /keine gültige JSON/);
  assert.throws(() => importJson('{"app":"andere"}'), /keine Sicherung dieser App/);
  const gut = JSON.parse(exportJson({ kunden, termine }, jetzt));
  const variante = (aendern) => { const d = structuredClone(gut); aendern(d); return JSON.stringify(d); };
  assert.throws(() => importJson(variante((d) => { d.schemaVersion = 99; })), /neueren Version/);
  assert.throws(() => importJson(variante((d) => { delete d.termine; })), /fehlen/);
  assert.throws(() => importJson(variante((d) => { d.termine[0].kundeId = 'weg'; })), /keinem Kunden/);
  assert.throws(() => importJson(variante((d) => { d.kunden[1].id = 'k1'; })), /doppelt/);
  assert.throws(() => importJson(variante((d) => { d.kunden[0].vorname = ''; d.kunden[0].nachname = ''; })), /keinen Namen/);
  assert.throws(() => importJson(variante((d) => { d.termine[0].beginn = 'gestern'; })), /Beginn/);
  assert.throws(() => importJson(variante((d) => { d.termine[0].dauerMinuten = -5; })), /Dauer/);
  assert.throws(() => importJson(variante((d) => { d.kunden[0].notizen = 42; })), /kein Text/);
});

test('Import verwirft unbekannte Felder', () => {
  const d = JSON.parse(exportJson({ kunden, termine }, jetzt));
  d.kunden[0].fremd = 'x';
  assert.equal(importJson(JSON.stringify(d)).kunden[0].fremd, undefined);
});

test('CSV-Zellen: Semikolon, Anführungszeichen, Formeln', () => {
  assert.equal(csvZelle('a;b'), '"a;b"');
  assert.equal(csvZelle('sagt "hallo"'), '"sagt ""hallo"""');
  assert.equal(csvZelle('=SUMME(A1)'), "'=SUMME(A1)");
  assert.equal(csvZelle('@x'), "'@x");
  assert.equal(csvZelle('+41 79 123 45 67'), '+41 79 123 45 67');
  assert.equal(csvZelle(3), '3');
  assert.equal(csvZelle(null), '');
});

test('Kunden-CSV: BOM, Kopfzeile, sortiert', () => {
  const text = kundenCsv({ kunden, termine });
  assert.ok(text.startsWith('﻿Nachname;Vorname;'));
  const zeilen = text.slice(1).split('\r\n');
  assert.ok(zeilen[1].startsWith('Beispiel;Lou;'));
  assert.ok(zeilen[2].startsWith('Muster;Anna;+41 79 123 45 67;;"Farbe 7/1; ""warm""\nAllergie";2026-10-28;1'));
});

test('Termine-CSV', () => {
  const text = termineCsv({ kunden, termine });
  assert.equal(text.slice(1).split('\r\n')[1], '2026-11-03;14:30;60;Anna Muster;+41 79 123 45 67;Schnitt;');
});

test('Dateiname', () => {
  assert.equal(dateiname('sicherung', 'json', jetzt), 'kundenkartei-sicherung-2026-10-28.json');
});
