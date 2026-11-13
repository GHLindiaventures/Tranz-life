from playwright.sync_api import sync_playwright
from PIL import Image

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge')
    page = browser.new_page(viewport={'width': 1500, 'height': 900})
    page.goto('http://localhost:5173/render_glb_split.html')
    page.wait_for_function('window.__READY__ === true', timeout=20000)
    page.wait_for_timeout(600)
    full_path = 'C:/Users/Dhinakaran/.gemini/antigravity/brain/67be8f38-6e63-4cd9-b157-c6125eee9dbc/final_liver_separated_parts.png'
    page.screenshot(path=full_path)
    browser.close()
    print('Full render saved to:', full_path)

# Macro close-up of the bottle neck with threads
img = Image.open(full_path)
w, h = img.size
neck_crop = img.crop((int(w * 0.28), int(h * 0.12), int(w * 0.52), int(h * 0.55)))
macro_path = 'C:/Users/Dhinakaran/.gemini/antigravity/brain/67be8f38-6e63-4cd9-b157-c6125eee9dbc/final_liver_threads_macro.png'
neck_crop.save(macro_path)
print('Macro crop saved to:', macro_path)

