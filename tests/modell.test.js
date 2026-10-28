import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  neuerKunde, kundeAktualisieren, pruefeKunde, neuerTermin, terminAktualisieren, pruefeTermin,
  sortiereKunden, sucheKunden, teileTermine, terminUebersicht, termineVon, bekannteLeistungen,
  exportFaellig, telefonZiffern,
} from '../app/js/modell.js';

const jetzt = new Date('2026-10-28T10:00:00Z');

// Erfundene Testdaten
const anna = neuerKunde({ vorname: 'Anna', nachname: 'Muster', telefon: '+41 79 123 45 67', mail: 'anna@example.ch' }, jetzt, 'k1');
const zoe = neuerKunde({ vorname: 'Zoé', nachname: 'Ägerter', telefon: '061 222 33 44' }, jetzt, 'k2');
const bea = neuerKunde({ vorname: 'Bea', nachname: 'muster' }, jetzt, 'k3');
const ohneNach = neuerKunde({ vorname: 'Lou' }, jetzt, 'k4');

test('Kunde anlegen: Felder getrimmt, Notizen mehrzeilig', () => {
  const k = neuerKunde({ vorname: '  Eva ', nachname: 'Probe', notizen: 'Farbe 7/1\nAllergie: PPD\n\n' }, jetzt, 'x');
  assert.equal(k.vorname, 'Eva');
  assert.equal(k.notizen, 'Farbe 7/1\nAllergie: PPD');
  assert.equal(k.erstelltAm, jetzt.toISOString());
  assert.equal(k.telefon, '');
});

test('Kunde prüfen', () => {
  assert.equal(pruefeKunde({ vorname: '', nachname: ' ' }).length, 1);
  assert.equal(pruefeKunde({ nachname: 'X' }).length, 0);
  assert.equal(pruefeKunde({ nachname: 'X', mail: 'kein-mail' }).length, 1);
});

test('Kunde bearbeiten behält erstelltAm und ID', () => {
  const spaeter = new Date('2026-11-01T10:00:00Z');
  const k = kundeAktualisieren(anna, { vorname: 'Anna', nachname: 'Neu' }, spaeter);
  assert.equal(k.id, 'k1');
  assert.equal(k.erstelltAm, anna.erstelltAm);
  assert.equal(k.geaendertAm, spaeter.toISOString());
  assert.equal(k.nachname, 'Neu');
});

test('Sortierung nach Nachname, Umlaute und Gross/Klein', () => {
  const namen = sortiereKunden([anna, zoe, bea, ohneNach]).map((k) => k.vorname);
  assert.deepEqual(namen, ['Zoé', 'Lou', 'Anna', 'Bea']);
});

test('Suche nach Name, ohne Akzente', () => {
  assert.deepEqual(sucheKunden([anna, zoe, bea], 'zoe').map((k) => k.id), ['k2']);
  assert.deepEqual(sucheKunden([anna, zoe, bea], 'aeg').map((k) => k.id), []);
  assert.deepEqual(sucheKunden([anna, zoe, bea], 'ager').map((k) => k.id), ['k2']);
  assert.deepEqual(sucheKunden([anna, zoe, bea], 'muster').map((k) => k.id), ['k1', 'k3']);
  assert.deepEqual(sucheKunden([anna, zoe, bea], 'anna muster').map((k) => k.id), ['k1']);
  assert.equal(sucheKunden([anna, zoe, bea], '').length, 3);
});

test('Suche nach Mail', () => {
  assert.deepEqual(sucheKunden([anna, zoe], 'example.ch').map((k) => k.id), ['k1']);
});

test('Suche nach Telefon, mit und ohne Vorwahl', () => {
  assert.deepEqual(sucheKunden([anna, zoe], '079').map((k) => k.id), ['k1']);
  assert.deepEqual(sucheKunden([anna, zoe], '0791234567').map((k) => k.id), ['k1']);
  assert.deepEqual(sucheKunden([anna, zoe], '+41791234567').map((k) => k.id), ['k1']);
  assert.deepEqual(sucheKunden([anna, zoe], '079 123').map((k) => k.id), ['k1']);
  assert.deepEqual(sucheKunden([anna, zoe], '2223344').map((k) => k.id), ['k2']);
  assert.equal(telefonZiffern('0041 79 1'), '0791');
});

test('Termin prüfen', () => {
  assert.equal(pruefeTermin({ datum: '2026-11-03', zeit: '14:30', dauerMinuten: 60 }).length, 0);
  assert.equal(pruefeTermin({ datum: '', zeit: '14:30', dauerMinuten: 60 }).length, 1);
  assert.equal(pruefeTermin({ datum: '2026-11-03', zeit: '14:30', dauerMinuten: 0 }).length, 1);
  assert.equal(pruefeTermin({ datum: '2026-11-03', zeit: '14:30', dauerMinuten: '45' }).length, 0);
  assert.equal(pruefeTermin({ datum: '2026-03-29', zeit: '02:30', dauerMinuten: 60 }).length, 1);
});

test('Termin anlegen und ändern', () => {
  const t = neuerTermin('k1', { datum: '2026-11-03', zeit: '14:30', dauerMinuten: '90', leistung: ' Schnitt ' }, jetzt, 't1');
  assert.equal(t.beginn, '2026-11-03T14:30:00+01:00');
  assert.equal(t.dauerMinuten, 90);
  assert.equal(t.leistung, 'Schnitt');
  const t2 = terminAktualisieren(t, { datum: '2026-11-04', zeit: '09:00', dauerMinuten: 30, leistung: 'Föhnen' });
  assert.equal(t2.id, 't1');
  assert.equal(t2.erstelltAm, t.erstelltAm);
  assert.equal(t2.beginn, '2026-11-04T09:00:00+01:00');
});

const termine = [
  neuerTermin('k1', { datum: '2026-09-01', zeit: '10:00', dauerMinuten: 60, leistung: 'Schnitt' }, jetzt, 'a'),
  neuerTermin('k1', { datum: '2026-10-01', zeit: '10:00', dauerMinuten: 60, leistung: 'Farbe' }, jetzt, 'b'),
  neuerTermin('k1', { datum: '2026-11-10', zeit: '10:00', dauerMinuten: 60, leistung: 'Schnitt' }, jetzt, 'c'),
  neuerTermin('k1', { datum: '2026-12-10', zeit: '10:00', dauerMinuten: 60, leistung: '' }, jetzt, 'd'),
  // läuft gerade (28.10. 10:30 bis 11:30 Zürich, jetzt = 11:00 Zürich)
  neuerTermin('k1', { datum: '2026-10-28', zeit: '10:30', dauerMinuten: 60 }, jetzt, 'e'),
  neuerTermin('k2', { datum: '2026-08-01', zeit: '10:00', dauerMinuten: 60, leistung: 'Dauerwelle' }, jetzt, 'f'),
];

test('Kommende und vergangene, neueste zuerst', () => {
  const { kommende, vergangene } = teileTermine(termineVon(termine, 'k1'), jetzt);
  assert.deepEqual(kommende.map((t) => t.id), ['d', 'c', 'e']);
  assert.deepEqual(vergangene.map((t) => t.id), ['b', 'a']);
});

test('Übersicht: letzter und nächster Termin je Kunde', () => {
  const u = terminUebersicht(termine, jetzt);
  assert.equal(u.get('k1').letzter.id, 'b');
  assert.equal(u.get('k1').naechster.id, 'e');
  assert.equal(u.get('k2').letzter.id, 'f');
  assert.equal(u.get('k2').naechster, null);
  assert.equal(u.get('k3'), undefined);
});

test('Bekannte Leistungen, eindeutig und sortiert', () => {
  assert.deepEqual(bekannteLeistungen(termine), ['Dauerwelle', 'Farbe', 'Schnitt']);
});

test('Export-Hinweis nach 30 Tagen', () => {
  assert.equal(exportFaellig(null, false, jetzt), false);
  assert.equal(exportFaellig(null, true, jetzt), true);
  assert.equal(exportFaellig('2026-10-01T10:00:00Z', true, jetzt), false);
  assert.equal(exportFaellig('2026-09-27T10:00:00Z', true, jetzt), true);
});
