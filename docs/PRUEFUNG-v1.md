# Prüfliste v1 für den Gründer

Lokal: `cd app && python3 -m http.server 4710`, dann http://localhost:4710
im Browser. Für das iPad braucht es HTTPS (Service Worker, Teilen), also erst
nach Veröffentlichung oder über eine Testadresse.

Nur erfundene Daten verwenden.

## Am Mac im Browser (localhost:4710)

1. Leere App: Willkommenstext, Installationshinweis oben, kein Sicherungshinweis.
2. **+ Neuer Kunde** ohne Namen speichern: Fehlermeldung. Mit «Anna Muster»,
   «+41 79 123 45 67», Mail, mehrzeiliger Notiz: Kunde erscheint, Karte offen.
   Jetzt erscheint der Hinweis «Bitte sichern».
3. Drei weitere Kunden, einer mit Umlaut im Nachnamen (z. B. «Ägerter»).
   Liste nach Nachname sortiert. Suche: «ager», «079 123», «+4179», Teil der
   Mail. Jeweils richtige Treffer.
4. Termin anlegen (morgen 14:30, 1 Std. 30 Min., «Farbe», Notiz mit Semikolon).
   Dialog «Termin gespeichert» erscheint.
   - **In Google Kalender eintragen**: Google zeigt Titel «Farbe · Anna Muster»,
     richtige Zeit (14:30 bis 16:00), Beschreibung mit Telefon und Notiz.
     NICHT speichern, oder danach wieder löschen.
   - **In iPad-Kalender (Datei)**: `.ics`-Datei wird geladen; in Kalender
     (Mac) öffnen zeigt dieselben Angaben und Zeit.
5. Einen vergangenen Termin anlegen (letzten Monat). Karte: «Kommende» und
   «Vergangene» getrennt; Liste zeigt «Zuletzt …».
6. Termin bearbeiten: Dialog zeigt den gelben Hinweis, alten Eintrag selbst zu
   löschen.
7. Termin löschen, Kunde löschen: Rückfrage nennt die Anzahl Termine.
8. **Sicherung › JSON** und **CSV**: Dateien laden; CSV in Excel öffnen
   (Umlaute, Spalten, Notiz mit Zeilenumbruch in einer Zelle).
9. Einen Kunden löschen, dann die JSON einlesen: Rückfrage mit Zahlen, danach
   ist alles wieder da. Eine fremde JSON-Datei einlesen: klare Fehlermeldung.
10. Seite neu laden: Daten bleiben. Server stoppen, Seite neu laden: App startet
    trotzdem (Service Worker).

## Am iPad (nach Veröffentlichung)

11. Safari: Installationshinweis sichtbar. «Teilen › Zum Home-Bildschirm».
    Symbol und Name «Kunden» prüfen.
12. Von dort starten: kein Installationshinweis, Vollbild, hoch und quer
    bedienbar, Tastatur verdeckt keine Knöpfe.
13. Flugmodus an, App starten: läuft.
14. Telefon- und Mail-Kachel antippen: öffnet Anruf bzw. Mail.
15. Google-Kalender-Link: öffnet Google (App oder Safari), Termin mit
    «Speichern» sichern, erscheint im iPad-Kalender (wenn das Google-Konto dort
    eingerichtet ist).
16. **iPad-Kalender (Datei)**: wichtigster Prüfpunkt für den Rückfall. Prüfen,
    ob iPadOS «Zum Kalender hinzufügen» anbietet. Falls nicht: melden, dann
    stelle ich auf das Teilen-Menü um.
17. Sicherung exportieren: Teilen-Menü erscheint, «In Dateien sichern» geht.
    Einlesen aus «Dateien» geht.
18. Sicherung › Hinweis zum dauerhaften Speicher lesen und melden, was dort steht.
