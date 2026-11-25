import asyncio
import json
import urllib.request
import subprocess
import time
import base64

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

async def capture():
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless",
        "--remote-debugging-port=9258",
        "--disable-gpu",
        "--window-size=1280,950",
        "http://localhost:5173/product-details.html?id=inhaler"
    ])
    time.sleep(3.5)
    try:
        import websockets
        targets = json.loads(urllib.request.urlopen("http://localhost:9258/json").read().decode())
        ws_url = targets[0]["webSocketDebuggerUrl"]
        async with websockets.connect(ws_url) as ws:
            await ws.send(json.dumps({
                "id": 1,
                "method": "Runtime.evaluate",
                "params": {"expression": "document.querySelector('.pdp-super-title')?.textContent"}
            }))
            res = json.loads(await ws.recv())
            print("Super Title:", res.get("result", {}).get("result", {}).get("value"))

            await ws.send(json.dumps({
                "id": 2,
                "method": "Runtime.evaluate",
                "params": {"expression": "document.querySelector('.pdp-counter')?.textContent"}
            }))
            res2 = json.loads(await ws.recv())
            print("Counter:", res2.get("result", {}).get("result", {}).get("value"))

            await ws.send(json.dumps({
                "id": 3,
                "method": "Runtime.evaluate",
                "params": {"expression": "document.querySelector('.pdp-tagline')?.textContent"}
            }))
            res3 = json.loads(await ws.recv())
            print("Tagline:", res3.get("result", {}).get("result", {}).get("value"))

            await ws.send(json.dumps({
                "id": 4,
                "method": "Runtime.evaluate",
                "params": {"expression": "document.querySelectorAll('.pdp-switch-pill').length"}
            }))
            res4 = json.loads(await ws.recv())
            print("Switcher count:", res4.get("result", {}).get("result", {}).get("value"))

            await ws.send(json.dumps({"id": 5, "method": "Page.captureScreenshot"}))
            res5 = json.loads(await ws.recv())
            data = res5["result"]["data"]
            with open("scripts/pdp_live_test.png", "wb") as f:
                f.write(base64.b64decode(data))
            print("Saved scripts/pdp_live_test.png")
    finally:
        proc.terminate()

asyncio.run(capture())
