import os
from PIL import Image, ImageFilter
import numpy as np

src_dir = r"C:\Users\LENOVO\.gemini\antigravity\brain\6f09ac93-78bb-4130-93d0-ad7882b05545"
dst_dir = r"src/assets/process"
os.makedirs(dst_dir, exist_ok=True)

files = [
    ("station_01_sourcing_1794813793046.jpg", "station-01-sourcing.webp"),
    ("station_02_extraction_1794813820319.jpg", "station-02-extraction.webp"),
    ("station_03_formulation_1794813857033.jpg", "station-03-formulation.webp"),
    ("station_04_testing_1794813883806.jpg", "station-04-testing.webp"),
    ("station_05_stability_1794813915208.jpg", "station-05-stability.webp"),
    ("station_06_sealed_1794813945848.jpg", "station-06-sealed.webp")
]

for src_name, dst_name in files:
    src_path = os.path.join(src_dir, src_name)
    dst_path = os.path.join(dst_dir, dst_name)
    im = Image.open(src_path).convert("RGBA")
    w, h = im.size
    
    # Create a smooth elliptical / vignette alpha mask that keeps the vessel completely opaque
    # but smoothly fades the outer 15% edges to 0 alpha so there are NEVER any hard square borders!
    mask = Image.new("L", (w, h), 0)
    arr = np.zeros((h, w), dtype=np.float32)
    
    cy, cx = h * 0.48, w * 0.50
    rx, ry = w * 0.44, h * 0.46
    
    y_coords, x_coords = np.ogrid[:h, :w]
    dist = np.sqrt(((x_coords - cx) / rx) ** 2 + ((y_coords - cy) / ry) ** 2)
    
    # 0 inside dist < 0.75, smoothly fades to 1 at dist >= 1.0
    alpha = np.clip((1.0 - dist) / 0.25, 0.0, 1.0)
    arr = (alpha * 255).astype(np.uint8)
    
    mask = Image.fromarray(arr, mode="L")
    # Soft gaussian blur on mask boundary
    mask = mask.filter(ImageFilter.GaussianBlur(radius=8))
    
    im.putalpha(mask)
    im.save(dst_path, "WEBP", quality=95, method=6)
    print(f"Processed {dst_name}: size={im.size}, alpha applied.")
