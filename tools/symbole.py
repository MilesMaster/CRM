"""Erzeugt die App-Symbole in app/icons/. Nur zum Entwickeln (braucht Pillow),
die fertigen PNG-Dateien liegen im Repo. Aufruf: python3 tools/symbole.py"""

from pathlib import Path
from PIL import Image, ImageDraw

ZIEL = Path(__file__).resolve().parent.parent / "app" / "icons"
GRUND = (122, 75, 52)      # Akzent der App
HELL = (250, 248, 245)     # Grundfarbe der App
FAKTOR = 4                 # Überabtastung für glatte Kanten


def symbol(groesse, innen=1.0):
    g = groesse * FAKTOR
    bild = Image.new("RGB", (g, g), GRUND)
    zeichnung = ImageDraw.Draw(bild)
    mitte = g / 2
    r = g * 0.26 * innen        # Ring
    staerke = g * 0.045 * innen
    zeichnung.ellipse([mitte - r, mitte - r, mitte + r, mitte + r], outline=HELL, width=round(staerke))
    p = g * 0.075 * innen       # Lichtpunkt in der Mitte
    zeichnung.ellipse([mitte - p, mitte - p, mitte + p, mitte + p], fill=HELL)
    return bild.resize((groesse, groesse), Image.LANCZOS)


ZIEL.mkdir(parents=True, exist_ok=True)
symbol(180).save(ZIEL / "apple-touch-icon.png", optimize=True)
symbol(192).save(ZIEL / "icon-192.png", optimize=True)
symbol(512).save(ZIEL / "icon-512.png", optimize=True)
symbol(512, innen=0.8).save(ZIEL / "icon-maskable-512.png", optimize=True)
print("Symbole geschrieben:", ", ".join(sorted(p.name for p in ZIEL.glob("*.png"))))
