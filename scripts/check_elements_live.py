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
        "--remote-debugging-port=9320",
        "--disable-gpu",
        "--window-size=1280,900",
        "http://localhost:5174/products.html?id=gummies"
    ])
    time.sleep(3.5)
    try:
        import websockets
        targets = json.loads(urllib.request.urlopen("http://localhost:9320/json").read().decode())
        ws_url = targets[0]["webSocketDebuggerUrl"]
        async with websockets.connect(ws_url) as ws:
            # Check console errors
            await ws.send(json.dumps({
                "id": 1,
                "method": "Runtime.evaluate",
                "params": {
                    "expression": """
                    (function() {
                        return {
                            flightCanvas: Boolean(document.querySelector('#flightCanvas')),
                            lineup: Boolean(document.querySelector('#lineup')),
                            lineupPin: Boolean(document.querySelector('#lineupPin')),
                            showcase: Boolean(document.querySelector('#showcase')),
                            hasJourneyApi: Boolean(window.state && window.state.journeyApi),
                            ovExists: Boolean(document.querySelector('#showcaseOverlay'))
                        };
                    })()
                    """,
                    "returnByValue": True
                }
            }))
            res = json.loads(await ws.recv())
            print("DOM check:", res.get("result", {}).get("result", {}).get("value"))
    finally:
        proc.terminate()

asyncio.run(check())
