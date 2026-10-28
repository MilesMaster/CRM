// Prüft den Ordner app/ als Ganzes: was veröffentlicht wird, muss offline
// vollständig sein und darf nichts Fremdes laden oder Daten enthalten.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const APP = new URL('../app/', import.meta.url).pathname;

function alleDateien(ordner) {
  return readdirSync(ordner).flatMap((name) => {
    const pfad = join(ordner, name);
    return statSync(pfad).isDirectory() ? alleDateien(pfad) : [relative(APP, pfad)];
  });
}

const dateien = alleDateien(APP).filter((d) => !d.endsWith('.DS_Store'));
const textDateien = dateien.filter((d) => /\.(html|css|js|webmanifest)$/.test(d));
const lies = (d) => readFileSync(join(APP, d), 'utf8');

test('Service Worker lädt jede Datei aus app/ vor', () => {
  const sw = lies('sw.js');
  const liste = [...sw.match(/const DATEIEN = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const erwartet = dateien.filter((d) => d !== 'sw.js').sort();
  assert.deepEqual(liste.filter((d) => d !== './').sort(), erwartet);
  for (const d of liste) assert.ok(d === './' || dateien.includes(d), `fehlt auf Platte: ${d}`);
});

test('Keine fremden Adressen ausser dem Google-Kalender-Link', () => {
  for (const d of textDateien) {
    for (const [url] of lies(d).matchAll(/https?:\/\/[^\s'"`)<>]+/g)) {
      assert.ok(url.startsWith('https://calendar.google.com/calendar/render'), `${d}: ${url}`);
    }
  }
});

test('Keine Netzwerkaufrufe im App-Code', () => {
  for (const d of textDateien.filter((x) => x.startsWith('js/'))) {
    const text = lies(d);
    for (const verboten of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'EventSource', 'import(']) {
      assert.ok(!text.includes(verboten), `${d} enthält ${verboten}`);
    }
  }
});

test('Alle Modul-Importe zeigen auf vorhandene Dateien', () => {
  for (const d of textDateien.filter((x) => x.startsWith('js/'))) {
    for (const [, ziel] of lies(d).matchAll(/from '(\.[^']+)'/g)) {
      assert.ok(dateien.includes(join('js', ziel)), `${d} importiert ${ziel}`);
    }
  }
});

test('Seite hält die Sicherheitsregel ein: kein Inline-Skript, kein style-Attribut', () => {
  const html = lies('index.html');
  assert.match(html, /Content-Security-Policy/);
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(html), 'Inline-Skript');
  assert.ok(!/\sstyle="/.test(html), 'style-Attribut');
  assert.ok(!/\son[a-z]+="/.test(html), 'Inline-Ereignis');
});

test('Keine Exporte oder Datendateien in app/', () => {
  for (const d of dateien) {
    assert.ok(!/\.(json|csv|ics)$/.test(d), `Datendatei in app/: ${d}`);
  }
});
