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
4. Termin anlegen (morgen 14:30, 1 Std. 30 Min., «Farbe»). Kein
   Kalender-Dialog mehr, nur die Meldung «Termin gespeichert».
5. Einen vergangenen Termin anlegen (letzten Monat). Karte: «Kommende» und
   «Vergangene» getrennt; Liste zeigt «Zuletzt …».
6. **Kalender › Woche:** heute ist umrandet, Termine mit Zeit von bis, Name,
   Leistung. ‹ › blättert wochenweise, «Heute» springt zurück. Beim Tag auf
   «+»: Kunde suchen, antippen, Datum ist vorausgefüllt. «+ Neuer Kunde» im
   Auswahlfenster: nach dem Speichern des Kunden geht es direkt zum Termin.
   Termin antippen: Bearbeiten-Dialog mit «Kundenkarte».
6a. **Kalender › Monat:** Raster Mo bis So, Tage anderer Monate blass,
   vier Termine an einem Tag: drei sichtbar, «+1 weitere». Tag antippen:
   springt in seine Woche.
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
15. Kalender quer und hochkant: quer sieben Spalten, hochkant sieben Zeilen;
    Monat passt ohne seitliches Scrollen.
16. Neuer Termin: Datum, Uhrzeit, Dauer stehen sauber nebeneinander, kein
    roter Löschknopf. Beim Bearbeiten ist «Termin löschen» da.
17. Sicherung exportieren: Teilen-Menü erscheint, «In Dateien sichern» geht.
    Einlesen aus «Dateien» geht.
18. Sicherung › Hinweis zum dauerhaften Speicher lesen und melden, was dort steht.
