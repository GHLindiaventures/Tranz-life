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
        "--remote-debugging-port=9315",
        "--disable-gpu",
        "--window-size=1280,900",
        "http://localhost:5174/products.html?id=gummies"
    ])
    time.sleep(3.5)
    try:
        import websockets
        targets = json.loads(urllib.request.urlopen("http://localhost:9315/json").read().decode())
        ws_url = targets[0]["webSocketDebuggerUrl"]
        async with websockets.connect(ws_url) as ws:
            # Check overlay state
            await ws.send(json.dumps({
                "id": 1,
                "method": "Runtime.evaluate",
                "params": {
                    "expression": """
                    (function() {
                        const ov = document.querySelector('#showcaseOverlay');
                        return {
                            ovExists: Boolean(ov),
                            ovClasses: ov ? ov.className : null,
                            ingLayer: Boolean(document.querySelector('#ingLayer')),
                            scrollY: window.scrollY
                        };
                    })()
                    """,
                    "returnByValue": True
                }
            }))
            res = json.loads(await ws.recv())
            print("Status:", res.get("result", {}).get("result", {}).get("value"))
    finally:
        proc.terminate()

asyncio.run(check())
