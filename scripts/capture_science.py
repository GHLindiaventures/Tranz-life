import asyncio, json, urllib.request, subprocess, time, base64

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

async def main():
    cmd = [
        CHROME_PATH,
        "--headless",
        "--remote-debugging-port=9226",
        "--disable-gpu",
        "--window-size=1440,900",
        "--user-data-dir=C:\\Users\\LENOVO\\AppData\\Local\\Temp\\chrome-sci-check"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2)
    try:
        import websockets
        req = urllib.request.Request("http://127.0.0.1:9226/json/new?http://localhost:5173/#science", method="PUT")
        with urllib.request.urlopen(req) as resp:
            tab = json.loads(resp.read().decode())
        ws_url = tab["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url) as ws:
            msg_id = 0
            async def send(method, params=None):
                nonlocal msg_id
                msg_id += 1
                await ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
                while True:
                    res = json.loads(await ws.recv())
                    if res.get("id") == msg_id:
                        return res.get("result", {})

            await send("Page.enable")
            await asyncio.sleep(2)
            await send("Runtime.evaluate", {"expression": "document.querySelector('#science').scrollIntoView()"})
            await asyncio.sleep(1)
            snap = await send("Page.captureScreenshot", {"format": "png"})
            with open("scripts/science_section_live.png", "wb") as f:
                f.write(base64.b64decode(snap["data"]))
            print("Captured scripts/science_section_live.png successfully!")
    finally:
        proc.terminate()

asyncio.run(main())
