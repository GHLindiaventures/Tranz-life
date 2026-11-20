import asyncio
import json
import urllib.request
import subprocess
import time

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

async def check():
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless",
        "--remote-debugging-port=9310",
        "--disable-gpu",
        "--window-size=1280,900",
        "http://localhost:5174/products.html?id=gummies"
    ])
    time.sleep(3.5)
    try:
        import websockets
        targets = json.loads(urllib.request.urlopen("http://localhost:9310/json").read().decode())
        ws_url = targets[0]["webSocketDebuggerUrl"]
        async with websockets.connect(ws_url) as ws:
            # Scroll overlay down to trigger ingredients animation
            await ws.send(json.dumps({
                "id": 1,
                "method": "Runtime.evaluate",
                "params": {
                    "expression": """
                    (function() {
                        const ov = document.querySelector('#showcaseOverlay');
                        if (ov) {
                            ov.scrollTop = 1200;
                            ov.dispatchEvent(new Event('scroll'));
                        }
                        return Boolean(document.querySelector('#ingLayer'));
                    })()
                    """
                }
            }))
            res = json.loads(await ws.recv())
            print("ingLayer created:", res.get("result", {}).get("result", {}).get("value"))

            await asyncio.sleep(1)

            await ws.send(json.dumps({
                "id": 2,
                "method": "Runtime.evaluate",
                "params": {
                    "expression": "document.querySelectorAll('#ingLayer .ing-label').length"
                }
            }))
            res2 = json.loads(await ws.recv())
            print("Ingredient callout labels count:", res2.get("result", {}).get("result", {}).get("value"))
    finally:
        proc.terminate()

asyncio.run(check())
