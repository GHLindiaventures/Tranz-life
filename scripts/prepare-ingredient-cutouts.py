import os
import sys
from PIL import Image, ImageFilter
import numpy as np

def extract_cutout(src_path, dst_path):
    if not os.path.exists(src_path):
        print(f"File not found: {src_path}")
        return False
    
    im = Image.open(src_path).convert("RGBA")
    arr = np.array(im, dtype=np.float32)
    
    # Calculate luminance / brightness to segment from dark background
    # Since prompt asked for pure dark black studio background with bright rim lighting
    r, g, b, _ = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    brightness = 0.299 * r + 0.587 * g + 0.114 * b
    
    # Also detect green/yellow/botanical color saturation
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    sat = (max_c - min_c) / (max_c + 1e-5)
    
    # Soft thresholding: background is near black (< 20 brightness and low saturation)
    # Botanicals are either bright or green/yellow saturated
    mask_val = np.clip((brightness - 12.0) / 24.0 + (sat * 0.4), 0.0, 1.0)
    
    # Clean up alpha
    alpha = (mask_val * 255.0).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, mode="L")
    alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=1.5))
    
    im.putalpha(alpha_img)
    im.save(dst_path, "WEBP", quality=95)
    print(f"Extracted transparent cutout -> {dst_path} (size={im.size})")
    return True

if __name__ == "__main__":
    artifact_dir = r"C:\Users\LENOVO\.gemini\antigravity\brain\6f09ac93-78bb-4130-93d0-ad7882b05545"
    dst_dir = r"src/assets/process"
    os.makedirs(dst_dir, exist_ok=True)
    
    # Scan for botanical ingredient files in artifact directory or subagent directory
    for root, dirs, files in os.walk(r"C:\Users\LENOVO\.gemini\antigravity\brain"):
        for f in files:
            if f.startswith("botanical-") and f.endswith(".jpg"):
                src = os.path.join(root, f)
                dst_name = f.replace(".jpg", ".webp")
                dst = os.path.join(dst_dir, dst_name)
                extract_cutout(src, dst)
