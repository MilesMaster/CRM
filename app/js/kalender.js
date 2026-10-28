// Kalender-Logik für Wochen- und Monatsansicht. Ohne DOM.
// Tage sind Texte 'JJJJ-MM-TT' (Zürcher Kalendertag); gerechnet wird in UTC,
// damit die Sommerzeit keine Tage verschiebt.

import { isoTeile } from './zeit.js';

const TAG_MS = 86400000;

function zuMs(tag) {
  const [j, m, t] = tag.split('-').map(Number);
  return Date.UTC(j, m - 1, t);
}

function zuTag(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function plusTage(tag, n) {
  return zuTag(zuMs(tag) + n * TAG_MS);
}

// 0 = Montag … 6 = Sonntag
export function wochentag(tag) {
  return (new Date(zuMs(tag)).getUTCDay() + 6) % 7;
}

export function wochenStart(tag) {
  return plusTage(tag, -wochentag(tag));
}

export function tageDerWoche(tag) {
  const start = wochenStart(tag);
  return Array.from({ length: 7 }, (_, i) => plusTage(start, i));
}

// Gleicher Tag im Nachbarmonat, am Monatsende gekürzt (31.01. plus 1 Monat = 28.02.)
export function plusMonate(tag, n) {
  const [j, m, t] = tag.split('-').map(Number);
  const ziel = new Date(Date.UTC(j, m - 1 + n, 1));
  const letzter = new Date(Date.UTC(ziel.getUTCFullYear(), ziel.getUTCMonth() + 1, 0)).getUTCDate();
  ziel.setUTCDate(Math.min(t, letzter));
  return zuTag(ziel.getTime());
}

export function monatVon(tag) {
  return tag.slice(0, 7);
}

// Wochen (Montag bis Sonntag), die den Monat abdecken: 4 bis 6 Zeilen zu 7 Tagen.
export function monatsRaster(tag) {
  const erster = `${monatVon(tag)}-01`;
  const letzter = plusTage(plusMonate(erster, 1), -1);
  const wochen = [];
  for (let start = wochenStart(erster); start <= letzter; start = plusTage(start, 7)) {
    wochen.push(Array.from({ length: 7 }, (_, i) => plusTage(start, i)));
  }
  return wochen;
}

// ISO-Kalenderwoche
export function kalenderwoche(tag) {
  const donnerstag = plusTage(tag, 3 - wochentag(tag));
  const jahresAnfang = Date.UTC(Number(donnerstag.slice(0, 4)), 0, 1);
  return Math.floor((zuMs(donnerstag) - jahresAnfang) / TAG_MS / 7) + 1;
}

// Termine je Zürcher Kalendertag, im Tag nach Uhrzeit sortiert.
export function termineJeTag(termine, vonTag, bisTag) {
  const karte = new Map();
  for (const t of termine) {
    const tag = isoTeile(t.beginn).datum;
    if (tag < vonTag || tag > bisTag) continue;
    if (!karte.has(tag)) karte.set(tag, []);
    karte.get(tag).push(t);
  }
  for (const liste of karte.values()) liste.sort((a, b) => new Date(a.beginn) - new Date(b.beginn));
  return karte;
}

const monatsFormat = new Intl.DateTimeFormat('de-CH', { timeZone: 'UTC', month: 'long', year: 'numeric' });
const tagMonatFormat = new Intl.DateTimeFormat('de-CH', { timeZone: 'UTC', day: 'numeric', month: 'short' });
const tagKopfFormat = new Intl.DateTimeFormat('de-CH', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'numeric' });

export const WOCHENTAGE_KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function monatsTitel(tag) {
  return monatsFormat.format(new Date(zuMs(tag)));
}

export function wochenTitel(tag) {
  const tage = tageDerWoche(tag);
  const von = new Date(zuMs(tage[0]));
  const bis = new Date(zuMs(tage[6]));
  return `KW ${kalenderwoche(tag)} · ${tagMonatFormat.format(von)} bis ${tagMonatFormat.format(bis)} ${bis.getUTCFullYear()}`;
}

export function tagKopf(tag) {
  return tagKopfFormat.format(new Date(zuMs(tag)));
}

export function tagesZahl(tag) {
  return Number(tag.slice(8, 10));
}
