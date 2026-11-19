import os
from PIL import Image, ImageFilter
import numpy as np

src_dir = r"C:\Users\LENOVO\.gemini\antigravity\brain\6f09ac93-78bb-4130-93d0-ad7882b05545"
dst_dir = r"src/assets/process"
os.makedirs(dst_dir, exist_ok=True)

files = [
    ("damask_rose_botanical_1794980975300.jpg", "ingredient-rose.webp", "white"),
    ("krishna_tulsi_botanical_1794980996387.jpg", "ingredient-tulsi.webp", "white"),
    ("eucalyptus_botanical_1794981016365.jpg", "ingredient-eucalyptus.webp", "white"),
    ("ashwagandha_roots_botanical_1794981037884.jpg", "ingredient-ashwagandha.webp", "white"),
    ("amla_fruit_botanical_1794981055638.jpg", "ingredient-amla.webp", "white")
]

for src_name, dst_name, bg_type in files:
    src_path = os.path.join(src_dir, src_name)
    dst_path = os.path.join(dst_dir, dst_name)
    
    if not os.path.exists(src_path):
        print("Missing:", src_path)
        continue
        
    im = Image.open(src_path).convert("RGBA")
    arr = np.array(im, dtype=np.float32)
    
    r, g, b, _ = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    
    if bg_type == "white":
        # Distance from pure white background
        diff_r = 255.0 - r
        diff_g = 255.0 - g
        diff_b = 255.0 - b
        color_dist = np.sqrt(diff_r**2 + diff_g**2 + diff_b**2)
        
        # Saturation
        max_c = np.maximum(np.maximum(r, g), b)
        min_c = np.minimum(np.minimum(r, g), b)
        sat = (max_c - min_c) / (max_c + 1e-5)
        
        # Crisp alpha transition
        # If color_dist > 28 or sat > 0.08, it's foreground
        mask_val = np.clip((color_dist - 22.0) / 18.0 + (sat * 0.8), 0.0, 1.0)
    else:
        brightness = 0.299 * r + 0.587 * g + 0.114 * b
        mask_val = np.clip((brightness - 14.0) / 22.0, 0.0, 1.0)
    
    alpha = (mask_val * 255.0).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, mode="L")
    alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=1.0))
    
    im.putalpha(alpha_img)
    # Autocrop transparent borders
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
        
    im.save(dst_path, "WEBP", quality=95)
    print(f"Created cutout {dst_name}: {os.path.getsize(dst_path)} bytes, size {im.size}")
