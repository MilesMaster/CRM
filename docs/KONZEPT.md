# Lumière CRM · Konzept v1 (Web-App)

Stand 28.10.2026. Auftraggeber: Coiffeur Lumière. Gerät: ein iPad im Salon.

## Ziel

Kundenpflege ohne Server: Kunden finden, Kontaktdaten und Notizen sehen, sehen,
wann sie zuletzt da waren und was gemacht wurde, und Termine im eigenen
Kalender der App planen.

## Umfang v1

1. **Kundenliste** mit Suche (Name, Telefon, Mail), sortiert nach Nachname;
   Anzeige des letzten Termins.
2. **Kundenkarte:** Vorname, Nachname, Telefon (Link `tel:`), Mail (Link
   `mailto:`), Notizen (frei, mehrzeilig, z. B. Farbrezept, Vorlieben,
   Allergien), Erfassungsdatum. Bearbeiten und Löschen (mit Rückfrage).
3. **Terminhistorie je Kunde:** alle Termine, getrennt in «Kommende» und
   «Vergangene», neueste zuerst. Je Termin: Datum, Uhrzeit, Dauer, Leistung,
   Notiz.
4. **Neuer Termin:** aus der Kundenkarte oder im Kalender über «+» an einem Tag
   (Kunde suchen oder neu erfassen); Datum, Uhrzeit, Dauer, Leistung, Notiz.
   Speichert nur lokal.
4a. **Kalender** (Entscheid des Gründers 28.10.2026, ersetzt Google-Link und
   `.ics`): Reiter «Kalender» mit Wochen- und Monatsansicht, Blättern und
   «Heute». Woche: sieben Tage mit allen Terminen (Zeit, Kunde, Leistung), im
   Querformat als Spalten, hochkant als Zeilen. Monat: Raster Montag bis
   Sonntag, je Tag bis drei Termine. Termin antippen öffnet ihn zum Bearbeiten,
   Tag im Monat antippen öffnet seine Woche. Keine Erinnerungen (eine Web-App
   ohne Server kann keine senden), Termine nur auf diesem iPad.
5. **Sicherung:** Export aller Daten als JSON (wieder einlesbar) und CSV (für
   Excel), über das Teilen-Menü (`navigator.share` mit Datei) oder als
   Download. Import nur aus dem eigenen JSON, mit Bestätigung, ersetzt alles.
   Hinweis in der App, wenn der letzte Export älter als 30 Tage ist.
6. **Installationshinweis:** Läuft die Seite nicht als Home-Bildschirm-App,
   zeigt sie kurz, wie man sie hinzufügt.

Nicht in v1: Google-Kalender, Erinnerungen, Online-Buchung, Erinnerungs-SMS, Kasse, mehrere Geräte, Fotos,
Passwort in der App (Schutz über den Gerätecode).

## Datenmodell (IndexedDB)

- `kunden`: id (UUID), vorname, nachname, telefon, mail, notizen, erstelltAm,
  geaendertAm.
- `termine`: id (UUID), kundeId, beginn (ISO mit Zeitzone), dauerMinuten,
  leistung, notiz, erstelltAm.
- `meta`: schemaVersion, letzterExport.
- Kunde löschen löscht seine Termine mit (Rückfrage nennt die Anzahl).

## Offline und Dauerbetrieb

- Service Worker lädt alle Dateien vor; die App startet ohne Internet.
- `navigator.storage.persist()` beim Start anfragen. Als Home-Bildschirm-App
  löscht iPadOS die Daten nicht nach Inaktivität; wird die App vom
  Home-Bildschirm entfernt, sind die Daten weg: darum Export.
- Keine Abhängigkeit von fremden Dateien (Schriften, Bibliotheken) zur Laufzeit.

## Datenschutz

- Daten verlassen das iPad nur beim Export durch den Nutzer.
- Gerätecode am iPad ist Pflicht (Hinweis im Übergabeblatt).
- Öffentlich sind nur die Programmdateien (leere App). Kundendaten liegen nie im
  Repo, nie auf GitHub Pages, nie auf einem Server. Vor jeder Veröffentlichung
  prüfen, dass `app/` keine Daten, Exporte oder echten Namen enthält.
- Adresse neutral benennen (z. B. `kundenkartei`), nicht nach dem Salon.

## Veröffentlichung und Übergabe

1. Dateien aus `app/` statisch veröffentlichen (Empfehlung GitHub Pages, eigenes
   Repo nur mit `app/`, ohne Kundendaten). Nur mit Freigabe des Gründers.
2. Auf dem iPad in Safari öffnen, «Teilen › Zum Home-Bildschirm».
3. Übergabeblatt (1 Seite): Installation, Gerätecode, iCloud-Backup, monatlicher
   Export, Kalender.

## Offene Punkte (mit Empfehlung)

1. **Adresse:** Empfehlung GitHub Pages unter einem neutralen Namen; Gründer
   bestätigt Konto und Name.
2. **Mindestversion:** entschieden 28.10.2026 nach Empfehlung: iPadOS 16.4
   oder höher. Vor der Übergabe iPad-Modell und Version beim Kunden prüfen
   (Einstellungen › Allgemein › Info).
3. **Gestaltung:** entschieden 28.10.2026 nach Empfehlung: hell, warmes Weiss
   mit Akzent in Kupferbraun, Systemschrift, Fingerziele mindestens 52 px.
   Name «Lumière Kunden», Beschriftung auf dem Home-Bildschirm «Kunden».
   Symbol: heller Ring mit Lichtpunkt auf Kupferbraun (`tools/symbole.py`).
