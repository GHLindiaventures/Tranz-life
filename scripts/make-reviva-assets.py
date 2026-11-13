"""Reviva product images from the client's packshot (white roll-on bottle with the orange/white label, 2048 x 2048).

  src/assets/products/reviva.webp        studio shot (960 x 960) for the product page, cards, bag and Products page
  src/assets/products/decal-reviva.webp  label wrapped around the 3D bottle (352 x 872, the size the model expects):
                                         the label's front panel, cut from the photo, fitted to the width and padded
                                         above (white, like the label top) and below (the label's gold band colour)

Usage: python scripts/make-reviva-assets.py <packshot.png>
"""
import sys
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent / "src" / "assets" / "products"
LABEL = (742, 756, 1308, 1866)        # front panel of the label in the 2048 px packshot (between the green side strips)
DECAL = (352, 872)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = Image.open(sys.argv[1]).convert("RGB")
    if src.size != (2048, 2048):
        src = src.resize((2048, 2048), Image.LANCZOS)

    shot = src.resize((960, 960), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.2, percent=40, threshold=2))
    shot.save(ROOT / "reviva.webp", "WEBP", quality=88, method=6)

    panel = src.crop(LABEL)
    h = round(panel.height * DECAL[0] / panel.width)
    panel = panel.resize((DECAL[0], h), Image.LANCZOS)
    decal = Image.new("RGB", DECAL, (246, 246, 244))
    top = (DECAL[1] - h) // 2
    bottom_colour = panel.getpixel((DECAL[0] // 2, h - 3))
    decal.paste(Image.new("RGB", (DECAL[0], DECAL[1] - top - h), bottom_colour), (0, top + h))
    decal.paste(panel, (0, top))
    decal.convert("RGBA").save(ROOT / "decal-reviva.webp", "WEBP", quality=90, method=6)
    for n in ("reviva.webp", "decal-reviva.webp"):
        print(n, (ROOT / n).stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
