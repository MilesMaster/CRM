// IndexedDB im Browser des iPads. Dünne Schicht, die Logik liegt in modell.js.

import { SCHEMA_VERSION } from './modell.js';

const DB_NAME = 'kundenkartei';

function anfrage(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function fertig(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('Speichern abgebrochen'));
  });
}

export async function oeffne() {
  const req = indexedDB.open(DB_NAME, SCHEMA_VERSION);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains('kunden')) db.createObjectStore('kunden', { keyPath: 'id' });
    if (!db.objectStoreNames.contains('termine')) {
      db.createObjectStore('termine', { keyPath: 'id' }).createIndex('kundeId', 'kundeId');
    }
    if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
  };
  const db = await anfrage(req);
  const tx = db.transaction('meta', 'readwrite');
  tx.objectStore('meta').put(SCHEMA_VERSION, 'schemaVersion');
  await fertig(tx);
  return new Speicher(db);
}

class Speicher {
  constructor(db) {
    this.db = db;
  }

  async alle(store) {
    return anfrage(this.db.transaction(store).objectStore(store).getAll());
  }

  async speichere(store, wert) {
    const tx = this.db.transaction(store, 'readwrite');
    tx.objectStore(store).put(wert);
    await fertig(tx);
  }

  async loescheTermin(id) {
    const tx = this.db.transaction('termine', 'readwrite');
    tx.objectStore('termine').delete(id);
    await fertig(tx);
  }

  // Kunde und alle seine Termine in einem Zug.
  async loescheKunde(id) {
    const tx = this.db.transaction(['kunden', 'termine'], 'readwrite');
    tx.objectStore('kunden').delete(id);
    const termine = tx.objectStore('termine');
    const req = termine.index('kundeId').getAllKeys(id);
    req.onsuccess = () => {
      for (const k of req.result) termine.delete(k);
    };
    await fertig(tx);
  }

  // Import: alles ersetzen, ganz oder gar nicht.
  async ersetzeAlles({ kunden, termine }) {
    const tx = this.db.transaction(['kunden', 'termine'], 'readwrite');
    const ks = tx.objectStore('kunden');
    const ts = tx.objectStore('termine');
    ks.clear();
    ts.clear();
    for (const k of kunden) ks.put(k);
    for (const t of termine) ts.put(t);
    await fertig(tx);
  }

  async meta(schluessel) {
    return anfrage(this.db.transaction('meta').objectStore('meta').get(schluessel));
  }

  async setzeMeta(schluessel, wert) {
    const tx = this.db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put(wert, schluessel);
    await fertig(tx);
  }
}
