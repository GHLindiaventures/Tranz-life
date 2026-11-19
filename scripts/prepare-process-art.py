import os
from PIL import Image, ImageDraw, ImageFilter

base_dir = r"c:\Users\LENOVO\Desktop\New folder (2)\src\assets\process"
files = [
    ("stage-01-sprout.png", "gen-step-01.webp"),
    ("stage-02-distillation.png", "gen-step-02.webp"),
    ("stage-03-droplet.png", "gen-step-03.webp"),
    ("stage-04-testing.png", "gen-step-04.webp"),
    ("stage-05-stability.png", "gen-step-05.webp"),
    ("stage-06-jar.png", "gen-step-06.webp"),
]

for src_name, dst_name in files:
    src_path = os.path.join(base_dir, src_name)
    dst_path = os.path.join(base_dir, dst_name)
    if os.path.exists(src_path):
        im = Image.open(src_path).convert("RGBA")
        w, h = im.size
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        sq = im.crop((left, top, left + side, top + side))
        sq = sq.resize((600, 600), Image.Resampling.LANCZOS)
        
        # Circular soft feathered mask
        mask = Image.new("L", (600, 600), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((10, 10, 590, 590), fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(4))
        
        sq.putalpha(mask)
        sq.save(dst_path, "WEBP", quality=95)
        print(f"Processed: {dst_name}")
    else:
        print(f"Waiting for: {src_name}")

