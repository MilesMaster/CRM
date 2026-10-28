// Service Worker: lädt alle Dateien vor, danach startet die App ohne Internet.
// Bei jeder Änderung an einer Datei VERSION erhöhen, sonst bleibt die alte Fassung.

const VERSION = 'v4';
const CACHE = `kundenkartei-${VERSION}`;

const DATEIEN = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'js/app.js',
  'js/kalender.js',
  'js/modell.js',
  'js/sicherung.js',
  'js/speicher.js',
  'js/zeit.js',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/logo.png',
];

self.addEventListener('install', (ereignis) => {
  ereignis.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(DATEIEN.map((d) => new Request(d, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (ereignis) => {
  ereignis.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (ereignis) => {
  const anfrage = ereignis.request;
  if (anfrage.method !== 'GET' || new URL(anfrage.url).origin !== self.location.origin) return;
  ereignis.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const treffer = await cache.match(anfrage, { ignoreSearch: true });
      if (treffer) return treffer;
      if (anfrage.mode === 'navigate') {
        const start = await cache.match('index.html');
        if (start) return start;
      }
      return fetch(anfrage);
    }),
  );
});
