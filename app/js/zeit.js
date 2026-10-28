// Datum und Uhrzeit, immer in der Zeitzone des Salons (Europe/Zurich).
// Ohne DOM, getestet mit node --test.

export const ZONE = 'Europe/Zurich';

const DATUM_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ZEIT_RE = /^(\d{2}):(\d{2})$/;

const teileFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function zwei(n) {
  return String(n).padStart(2, '0');
}

// Wanduhr-Teile in Zürich für einen Zeitpunkt.
export function zuerichTeile(date) {
  const t = {};
  for (const p of teileFormat.formatToParts(date)) t[p.type] = p.value;
  return {
    jahr: Number(t.year),
    monat: Number(t.month),
    tag: Number(t.day),
    stunde: Number(t.hour),
    minute: Number(t.minute),
    sekunde: Number(t.second),
  };
}

// Versatz von Zürich zu UTC in Minuten (+60 im Winter, +120 im Sommer).
export function versatzMinuten(date) {
  const ms = Math.floor(date.getTime() / 1000) * 1000;
  const t = zuerichTeile(new Date(ms));
  const alsUtc = Date.UTC(t.jahr, t.monat - 1, t.tag, t.stunde, t.minute, t.sekunde);
  return Math.round((alsUtc - ms) / 60000);
}

export function gueltigesDatum(datum) {
  const m = DATUM_RE.exec(datum ?? '');
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

export function gueltigeZeit(zeit) {
  const m = ZEIT_RE.exec(zeit ?? '');
  return Boolean(m) && +m[1] < 24 && +m[2] < 60;
}

// Datum 'JJJJ-MM-TT' und Zeit 'HH:MM' in Zürich als Zeitpunkt.
export function lokalZuDate(datum, zeit) {
  if (!gueltigesDatum(datum)) throw new Error('Ungültiges Datum');
  if (!gueltigeZeit(zeit)) throw new Error('Ungültige Uhrzeit');
  const [j, mo, t] = datum.split('-').map(Number);
  const [h, mi] = zeit.split(':').map(Number);
  const naiv = Date.UTC(j, mo - 1, t, h, mi);
  let ts = naiv - versatzMinuten(new Date(naiv)) * 60000;
  ts = naiv - versatzMinuten(new Date(ts)) * 60000;
  const ergebnis = new Date(ts);
  const zurueck = isoTeile(ergebnis.toISOString());
  if (zurueck.datum !== datum || zurueck.zeit !== zeit) {
    // Kommt nur in der Stunde der Sommerzeit-Umstellung vor.
    throw new Error('Diese Uhrzeit gibt es an diesem Tag nicht (Zeitumstellung)');
  }
  return ergebnis;
}

// ISO-Text mit Zürcher Versatz, z. B. 2026-11-03T14:30:00+01:00
export function zuIso(date) {
  const t = zuerichTeile(date);
  const v = versatzMinuten(date);
  const vz = v >= 0 ? '+' : '-';
  const va = Math.abs(v);
  return `${t.jahr}-${zwei(t.monat)}-${zwei(t.tag)}T${zwei(t.stunde)}:${zwei(t.minute)}:${zwei(t.sekunde)}${vz}${zwei(Math.floor(va / 60))}:${zwei(va % 60)}`;
}

export function lokalZuIso(datum, zeit) {
  return zuIso(lokalZuDate(datum, zeit));
}

// Zurück in Formularwerte: { datum: 'JJJJ-MM-TT', zeit: 'HH:MM' } in Zürich.
export function isoTeile(iso) {
  const t = zuerichTeile(new Date(iso));
  return {
    datum: `${t.jahr}-${zwei(t.monat)}-${zwei(t.tag)}`,
    zeit: `${zwei(t.stunde)}:${zwei(t.minute)}`,
  };
}

const datumFormat = new Intl.DateTimeFormat('de-CH', {
  timeZone: ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const kurzFormat = new Intl.DateTimeFormat('de-CH', {
  timeZone: ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const zeitFormat = new Intl.DateTimeFormat('de-CH', {
  timeZone: ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatDatum(iso) {
  return datumFormat.format(new Date(iso));
}

export function formatDatumKurz(iso) {
  return kurzFormat.format(new Date(iso));
}

export function formatZeit(iso) {
  return zeitFormat.format(new Date(iso));
}

export function formatDauer(minuten) {
  const h = Math.floor(minuten / 60);
  const m = minuten % 60;
  if (h === 0) return `${m} Min.`;
  if (m === 0) return `${h} Std.`;
  return `${h} Std. ${m} Min.`;
}

// Heutiges Datum in Zürich als 'JJJJ-MM-TT'.
export function heute(jetzt = new Date()) {
  return isoTeile(jetzt.toISOString()).datum;
}
