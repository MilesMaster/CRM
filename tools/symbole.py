"""Erzeugt die App-Symbole in app/icons/ aus dem Logo app/icons/logo.png
(Lumière Hair Studio, transparent, dunkelbraun). Nur zum Entwickeln (braucht
Pillow), die fertigen PNG-Dateien liegen im Repo. Aufruf: python3 tools/symbole.py"""

from pathlib import Path
from PIL import Image

ZIEL = Path(__file__).resolve().parent.parent / "app" / "icons"
GRUND = (207, 196, 185)    # Taupe aus der Website des Salons
LOGO_FARBE = (255, 255, 255)


def symbol(logo, groesse, breite):
    """Logo in Weiss, zentriert auf Taupe; breite = Anteil der Symbolbreite."""
    bild = Image.new("RGB", (groesse, groesse), GRUND)
    w = round(groesse * breite)
    h = round(logo.height * w / logo.width)
    maske = logo.split()[3].resize((w, h), Image.LANCZOS)
    farbe = Image.new("RGB", (w, h), LOGO_FARBE)
    bild.paste(farbe, ((groesse - w) // 2, (groesse - h) // 2), maske)
    return bild


logo = Image.open(ZIEL / "logo.png").convert("RGBA")
symbol(logo, 180, 0.78).save(ZIEL / "apple-touch-icon.png", optimize=True)
symbol(logo, 192, 0.78).save(ZIEL / "icon-192.png", optimize=True)
symbol(logo, 512, 0.78).save(ZIEL / "icon-512.png", optimize=True)
# maskable: Android schneidet bis zu 20 % am Rand weg
symbol(logo, 512, 0.6).save(ZIEL / "icon-maskable-512.png", optimize=True)
print("Symbole geschrieben:", ", ".join(sorted(p.name for p in ZIEL.glob("*.png"))))
