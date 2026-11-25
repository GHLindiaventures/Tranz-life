import os
from PIL import Image, ImageFilter
import numpy as npm

src_dir = r"C:\Users\LENOVO\.gemini\antigravity\brain\6f09ac93-78bb-4130-93d0-ad7882b05545"
dst_dir = r"src/assets/process"
os.makedirs(dst_dir, exist_ok=True)

files = [
    ("botanical_tea_leaf_1794980064209.jpg", "ingredient-tea-leaf.webp"),
    ("botanical_peppermint_sprig_1794980081279.jpg", "ingredient-peppermint.webp"),
    ("botanical_rosemary_stem_1794980102243.jpg", "ingredient-rosemary.webp"),
    ("botanical_chamomile_flower_1794980122306.jpg", "ingredient-chamomile.webp")
]

for src_name, dst_name in files:
    src_path = os.path.join(src_dir, src_name)
    dst_path = os.path.join(dst_dir, dst_name)
    
    if not os.path.exists(src_path):
        print("Missing:", src_path)
        continue
        
    im = Image.open(src_path).convert("RGBA")
    arr = np.array(im, dtype=np.float32)
    
    r, g, b, _ = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    brightness = 0.299 * r + 0.587 * g + 0.114 * b
    
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    sat = (max_c - min_c) / (max_c + 1e-5)
    
    # Smooth alpha cutout based on luminosity and saturation
    mask_val = np.clip((brightness - 14.0) / 22.0 + (sat * 0.45), 0.0, 1.0)
    
    alpha = (mask_val * 255.0).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, mode="L")
    alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=1.2))
    
    im.putalpha(alpha_img)
    im.save(dst_path, "WEBP", quality=95)
    print(f"Created cutout {dst_name}: {os.path.getsize(dst_path)} bytes")
