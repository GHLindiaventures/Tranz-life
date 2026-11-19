import asyncio, json, urllib.request, subprocess, time, base64

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

async def main():
    cmd = [
        CHROME_PATH,
        "--headless",
        "--remote-debugging-port=9229",
        "--disable-gpu",
        "--window-size=1440,900",
        "about:blank"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2)

    import websockets

    resp = urllib.request.urlopen("http://localhost:9229/json").read()
    tabs = json.loads(resp)
    ws_url = tabs[0]["webSocketDebuggerUrl"]

    async with websockets.connect(ws_url) as ws:
        async def send(method, params=None):
            msg_id = int(time.time() * 1000) % 1000000
            await ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
            while True:
                r = await ws.recv()
                d = json.loads(r)
                if d.get("id") == msg_id:
                    return d.get("result", {})

        await send("Page.enable")
        await send("Page.navigate", {"url": "http://localhost:5173/#home"})

        for _ in range(40):
            res = await send("Runtime.evaluate", {
                "expression": "document.querySelector('#loader') && document.querySelector('#loader').classList.contains('done')"
            })
            val = res.get("result", {}).get("value")
            if val is True:
                break
            await asyncio.sleep(0.5)

        await asyncio.sleep(1.0)
        # Scroll down 400px
        await send("Runtime.evaluate", {"expression": "window.scrollTo(0, 450);"})
        await asyncio.sleep(1.0)

        res = await send("Page.captureScreenshot", {"format": "png"})
        with open("scripts/curve_band_live.png", "wb") as f:
            f.write(base64.b64decode(res["data"]))

    proc.terminate()
    print("Curve band captured!")

if __name__ == "__main__":
    asyncio.run(main())
