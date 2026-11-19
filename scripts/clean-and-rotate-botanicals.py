import os
import cv2
import numpy as np
from PIL import Image, ImageFilter

brain_dir = r"C:\Users\LENOVO\.gemini\antigravity\brain\6f09ac93-78bb-4130-93d0-ad7882b05545"
dst_dir = r"src/assets/process"
os.makedirs(dst_dir, exist_ok=True)

# -------------------------------------------------------------
# 1. PEPPERMINT: Clean dark background, remove all noise, rotate horizontally
# -------------------------------------------------------------
pepp_src = os.path.join(brain_dir, "botanical_peppermint_sprig_1794980081279.jpg")
if os.path.exists(pepp_src):
    img = cv2.imread(pepp_src)
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    r, g, b = rgb[:,:,0].astype(float), rgb[:,:,1].astype(float), rgb[:,:,2].astype(float)
    
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    sat = (max_c - min_c) / (max_c + 1e-5)
    brightness = 0.299 * r + 0.587 * g + 0.114 * b
    
    # Foreground mask: plant has good brightness and green/yellow saturation
    alpha = np.clip((brightness - 24.0) / 18.0 + (sat * 0.6), 0.0, 1.0)
    alpha = (alpha * 255.0).astype(np.uint8)
    # Strictly zero out any low-alpha film
    alpha[alpha < 50] = 0
    
    # Component filter
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats((alpha > 0).astype(np.uint8))
    main_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    clean_mask = (labels == main_label).astype(np.uint8) * 255
    
    clean_pil = Image.fromarray(clean_mask).filter(ImageFilter.GaussianBlur(radius=0.8))
    alpha_final = np.minimum(alpha, np.array(clean_pil))
    
    im_out = Image.fromarray(rgb)
    im_out.putalpha(Image.fromarray(alpha_final))
    
    bbox = im_out.getbbox()
    cropped = im_out.crop(bbox)
    
    # Add transparent border padding before rotating
    pad = Image.new("RGBA", (cropped.width + 48, cropped.height + 48), (0, 0, 0, 0))
    pad.paste(cropped, (24, 24))
    
    # Rotate horizontally: 90 degrees clockwise so stem is on left, leafy tip extends right
    pepp_horiz = pad.rotate(-90, expand=True, resample=Image.BICUBIC)
    h_bbox = pepp_horiz.getbbox()
    pepp_horiz = pepp_horiz.crop(h_bbox)
    
    # Add comfortable breathing room
    final_pepp = Image.new("RGBA", (pepp_horiz.width + 40, pepp_horiz.height + 40), (0, 0, 0, 0))
    final_pepp.paste(pepp_horiz, (20, 20))
    
    dst_pepp = os.path.join(dst_dir, "ingredient-peppermint.webp")
    final_pepp.save(dst_pepp, "WEBP", quality=95)
    print(f"Saved horizontal clean peppermint -> {dst_pepp} (size={final_pepp.size})")

# -------------------------------------------------------------
# 2. ROSEMARY: Clean dark background and eliminate olive corner artifact
# -------------------------------------------------------------
rose_src = os.path.join(brain_dir, "botanical_rosemary_stem_1794980102243.jpg")
if os.path.exists(rose_src):
    img = cv2.imread(rose_src)
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    r, g, b = rgb[:,:,0].astype(float), rgb[:,:,1].astype(float), rgb[:,:,2].astype(float)
    
    is_needle = (g > r + 3) & (g > b + 3) & (g > 32)
    is_woody = (r > 38) & (r > b + 8) & (g > 26) & (b < 85)
    is_needle_light = (g > 60) & (g >= r) & (g >= b)
    
    fg = is_needle | is_woody | is_needle_light
    # Exclude bottom-left corner artifact specifically
    fg[850:, :220] = is_woody[850:, :220]
    
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(fg.astype(np.uint8))
    clean_fg = np.zeros_like(fg, dtype=np.uint8)
    for i in range(1, num_labels):
        if stats[i, cv2.CC_STAT_AREA] > 80:
            cx, cy = centroids[i]
            if cx < 100 and cy > 900 and stats[i, cv2.CC_STAT_AREA] < 1000:
                continue
            clean_fg[labels == i] = 255
            
    mask = np.zeros(img.shape[:2], dtype=np.uint8) + cv2.GC_BGD
    mask[clean_fg == 255] = cv2.GC_FGD
    dilated = cv2.dilate(clean_fg, np.ones((5,5), np.uint8), iterations=1)
    mask[(dilated == 255) & (mask != cv2.GC_FGD)] = cv2.GC_PR_FGD
    
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    cv2.grabCut(img, mask, None, bgdModel, fgdModel, 3, cv2.GC_INIT_WITH_MASK)
    
    alpha = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    # Zero out outer borders and bottom-left corner to be 100% sure
    alpha[:20, :] = 0
    alpha[:, -20:] = 0
    alpha[-30:, :50] = 0
    alpha[alpha < 40] = 0
    
    alpha_pil = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(radius=0.8))
    
    im_out = Image.fromarray(rgb)
    im_out.putalpha(alpha_pil)
    bbox = im_out.getbbox()
    cropped = im_out.crop(bbox)
    
    final_rose = Image.new("RGBA", (cropped.width + 40, cropped.height + 40), (0, 0, 0, 0))
    final_rose.paste(cropped, (20, 20))
    
    dst_rose = os.path.join(dst_dir, "ingredient-rosemary.webp")
    final_rose.save(dst_rose, "WEBP", quality=95)
    print(f"Saved clean rosemary -> {dst_rose} (size={final_rose.size})")

# -------------------------------------------------------------
# 3. DAMASK ROSE: Clean light gray background
# -------------------------------------------------------------
damask_src = os.path.join(brain_dir, "damask_rose_botanical_1794980975300.jpg")
if os.path.exists(damask_src):
    im = Image.open(damask_src).convert("RGBA")
    arr = np.array(im, dtype=np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    
    diff_r = 255.0 - r
    diff_g = 255.0 - g
    diff_b = 255.0 - b
    color_dist = np.sqrt(diff_r**2 + diff_g**2 + diff_b**2)
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    sat = (max_c - min_c) / (max_c + 1e-5)
    
    is_bg = (color_dist < 48) & (sat < 0.10)
    alpha = np.where(is_bg, 0, 255).astype(np.uint8)
    alpha[alpha < 40] = 0
    
    alpha_pil = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(radius=0.8))
    im.putalpha(alpha_pil)
    bbox = im.getbbox()
    cropped = im.crop(bbox)
    
    final_damask = Image.new("RGBA", (cropped.width + 40, cropped.height + 40), (0, 0, 0, 0))
    final_damask.paste(cropped, (20, 20))
    
    dst_damask = os.path.join(dst_dir, "ingredient-rose.webp")
    final_damask.save(dst_damask, "WEBP", quality=95)
    print(f"Saved clean rose -> {dst_damask} (size={final_damask.size})")

# -------------------------------------------------------------
# 4. CHAMOMILE: Clean dark background film
# -------------------------------------------------------------
cham_src = os.path.join(brain_dir, "botanical_chamomile_flower_1794980122306.jpg")
if os.path.exists(cham_src):
    img = cv2.imread(cham_src)
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    r, g, b = rgb[:,:,0].astype(float), rgb[:,:,1].astype(float), rgb[:,:,2].astype(float)
    
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    sat = (max_c - min_c) / (max_c + 1e-5)
    brightness = 0.299 * r + 0.587 * g + 0.114 * b
    
    alpha = np.clip((brightness - 22.0) / 18.0 + (sat * 0.5), 0.0, 1.0)
    alpha = (alpha * 255.0).astype(np.uint8)
    alpha[alpha < 50] = 0
    
    alpha_pil = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(radius=0.8))
    im_out = Image.fromarray(rgb)
    im_out.putalpha(alpha_pil)
    bbox = im_out.getbbox()
    cropped = im_out.crop(bbox)
    
    final_cham = Image.new("RGBA", (cropped.width + 40, cropped.height + 40), (0, 0, 0, 0))
    final_cham.paste(cropped, (20, 20))
    
    dst_cham = os.path.join(dst_dir, "ingredient-chamomile.webp")
    final_cham.save(dst_cham, "WEBP", quality=95)
    print(f"Saved clean chamomile -> {dst_cham} (size={final_cham.size})")
