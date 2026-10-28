# Lumière CRM · Regeln für jede Session

Kleines Kunden-CRM für den Coiffeur Lumière, als **Web-App** für das iPad
(«Zum Home-Bildschirm»). Eigenständiges Projekt, **unabhängig von SOPOS /
Gastro-Plattform**. Konzept: `docs/KONZEPT.md`.

## Abgrenzung zu SOPOS (nicht verhandelbar)

- Nie etwas in `~/gastro-plattform`, `~/gastro-*`, `~/sopos-cockpit` oder
  `~/brain/30-projekte/gastro/` lesen oder ändern. Die Gastro-Regeln, Rollen,
  Runden und Skills gelten hier nicht.
- Keine festen Ports belegen, die SOPOS nutzt (3000, 5173, 8081, 8787, 5432).
  Lokaler Testserver auf Port 4710. Kein Docker, keine Datenbank-Server.

## Feste Entscheide des Gründers (28.10.2026)

1. **Web-App statt App Store.** Installation über Safari «Teilen › Zum
   Home-Bildschirm». Kein App Store, kein TestFlight.
2. **Kein Server, alles lokal.** Die Daten liegen nur im Browser-Speicher des
   iPads (IndexedDB). Die Dateien der App liegen einmal statisch im Netz
   (GitHub Pages o. ä.), danach läuft die App offline über einen Service Worker.
   Keine Analyse, kein Tracking, keine Aufrufe an fremde Dienste ausser dem
   Öffnen eines Google-Kalender-Links durch den Nutzer.
3. **Termine über einen vorausgefüllten Google-Kalender-Link** (der Coiffeur
   tippt dort «Speichern»), dazu als Rückfall eine `.ics`-Datei für den
   iPad-Kalender. Kein Google-API, kein OAuth.

## Technik

- Reines HTML, CSS und JavaScript (ES-Module), **kein Build-Schritt, keine
  Fremdbibliotheken, kein CDN**: die App muss in Jahren noch ohne Pflege laufen.
- `manifest.webmanifest`, App-Symbole, Service Worker (alle Dateien
  vorgeladen, offline-fähig), `navigator.storage.persist()` anfragen.
- Logik (Datenmodell, Suche, Export/Import, Kalender-Link, ICS) in eigenen
  Modulen ohne DOM, getestet mit `node --test`.
- Lokal starten: `python3 -m http.server 4710` im Ordner `app/`.

## Arbeitsweise

- Vor dem ersten Code: `docs/KONZEPT.md` lesen.
- Ein Test, der nie rot war, beweist nichts: wichtige Prüfungen einmal umdrehen,
  Test muss rot werden, zurückbauen.
- Browser- und iPad-Tests macht der Gründer. Du baust, testest per
  Kommandozeile und sagst ihm genau, was er prüfen soll.
- Commit erlaubt nach grünen Tests, nur `git add` und `git commit`, ohne
  Claude-Trailer (kein Co-Authored-By, keine Session-Zeile). Nie push, reset,
  rebase, checkout, stash. Veröffentlichen (GitHub Pages) nur mit Freigabe des
  Gründers.
- Keine Secrets im Repo. Echte Kundendaten nie ins Repo oder in Testdaten;
  Testdaten sind erfunden.

## Sprache

Deutsch, Schweizer Schreibweise: kein Eszett, immer ss. Umlaute normal. Keine
Gedankenstriche. App-Oberfläche auf Deutsch.
