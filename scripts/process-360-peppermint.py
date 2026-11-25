import os, sys
from PIL import Image, ImageFilter
import numpy as np

def process_peppermint_turn(image_paths, out_dir="src/assets/process"):
    os.makedirs(out_dir, exist_ok=True)
    frames = []
    
    # Process each of the 4 generated angles
    for idx, path in enumerate(image_paths):
        if not os.path.exists(path):
            print(f"File not found: {path}")
            continue
            
        im = Image.open(path).convert("RGB")
        arr = np.array(im, dtype=np.float32)
        
        # Isolate from solid black studio background
        brightness = 0.299 * arr[:,:,0] + 0.587 * arr[:,:,1] + 0.114 * arr[:,:,2]
        r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
        
        # Green booster: ensures green leaves stay 100% opaque
        is_green = (g > r) & (g > b)
        green_boost = np.where(is_green, (g - np.maximum(r, b)) * 1.5, 0.0)
        
        alpha_val = np.clip((brightness - 10.0) / 16.0 + (green_boost / 40.0), 0.0, 1.0) * 255.0
        alpha_img = Image.fromarray(alpha_val.astype(np.uint8), mode="L")
        alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=0.8))
        
        im_rgba = im.convert("RGBA")
        im_rgba.putalpha(alpha_img)
        
        # Crop tight to bounding box
        bbox = im_rgba.getbbox()
        if bbox:
            cropped = im_rgba.crop(bbox)
        else:
            cropped = im_rgba
            
        frames.append(cropped)
        print(f"Processed angle {idx}: size {cropped.size}")
        
    if not frames:
        print("No frames processed!")
        return
        
    # Standardize to 512x1024 canvas with stem centered at x=256
    W, H = 512, 1024
    std_frames = []
    
    for idx, f in enumerate(frames):
        # Scale to fit height 88% of H
        scale = (H * 0.88) / f.height
        new_w = max(1, int(f.width * scale))
        new_h = max(1, int(f.height * scale))
        scaled = f.resize((new_w, new_h), Image.LANCZOS)
        
        # Find stem base center in bottom 10%
        arr_s = np.array(scaled)
        btm_alpha = arr_s[int(new_h * 0.85):, :, 3]
        y_idx, x_idx = np.where(btm_alpha > 120)
        if len(x_idx) > 0:
            stem_x = int(np.median(x_idx))
        else:
            stem_x = new_w // 2
            
        canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        paste_x = (W // 2) - stem_x
        paste_y = int(H * 0.06)
        canvas.paste(scaled, (paste_x, paste_y), scaled)
        std_frames.append(canvas)
        
    # Construct 8 full 360° rotation frames
    if len(std_frames) == 4:
        all_8 = [
            std_frames[0],                                       # 0°
            std_frames[1],                                       # 45°
            std_frames[2],                                       # 90°
            std_frames[3],                                       # 135°
            std_frames[0].transpose(Image.FLIP_LEFT_RIGHT),      # 180°
            std_frames[3].transpose(Image.FLIP_LEFT_RIGHT),      # 225°
            std_frames[2].transpose(Image.FLIP_LEFT_RIGHT),      # 270°
            std_frames[1].transpose(Image.FLIP_LEFT_RIGHT)       # 315°
        ]
    else:
        all_8 = std_frames
        
    for i, fr in enumerate(all_8):
        out_path = os.path.join(out_dir, f"peppermint_real_360_{i}.webp")
        fr.save(out_path, "WEBP", quality=95)
        print(f"Saved {out_path}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        process_peppermint_turn(sys.argv[1:])
    else:
        print("Usage: python process-360-peppermint.py path1 path2 path3 path4")
