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
        "--remote-debugging-port=9280",
        "--disable-gpu",
        "--window-size=1280,850",
        "http://localhost:5174/products.html?id=inhaler"
    ])
    time.sleep(3.5)
    try:
        import websockets
        targets = json.loads(urllib.request.urlopen("http://localhost:9280/json").read().decode())
        ws_url = targets[0]["webSocketDebuggerUrl"]
        async with websockets.connect(ws_url) as ws:
            await ws.send(json.dumps({
                "id": 1,
                "method": "Runtime.evaluate",
                "params": {"expression": "Boolean(document.querySelector('.sc-overlay.open'))"}
            }))
            res = json.loads(await ws.recv())
            print("Overlay open:", res.get("result", {}).get("result", {}).get("value"))

            await ws.send(json.dumps({
                "id": 2,
                "method": "Runtime.evaluate",
                "params": {"expression": "document.querySelector('#scLeadHead')?.textContent"}
            }))
            res2 = json.loads(await ws.recv())
            print("Lead Head:", res2.get("result", {}).get("result", {}).get("value"))

            await ws.send(json.dumps({
                "id": 3,
                "method": "Runtime.evaluate",
                "params": {"expression": "document.querySelector('#scLeadTag')?.textContent"}
            }))
            res3 = json.loads(await ws.recv())
            print("Lead Tag:", res3.get("result", {}).get("result", {}).get("value"))
    finally:
        proc.terminate()

asyncio.run(capture())
