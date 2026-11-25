import asyncio, json, urllib.request, subprocess, time, base64

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

async def main():
    cmd = [
        CHROME_PATH,
        "--headless",
        "--remote-debugging-port=9250",
        "--disable-gpu",
        "--window-size=1440,900",
        "http://localhost:5173/products.html"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(3)

    import websockets

    resp = urllib.request.urlopen("http://localhost:9250/json").read()
    tabs = json.loads(resp)
    page_tab = [t for t in tabs if t.get("type") == "page"][0]
    ws_url = page_tab["webSocketDebuggerUrl"]

    async with websockets.connect(ws_url, max_size=25*1024*1024) as ws:
        async def send(method, params=None):
            msg_id = int(time.time() * 1000) % 1000000
            await ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
            while True:
                r = await ws.recv()
                d = json.loads(r)
                if d.get("id") == msg_id:
                    return d.get("result", {})

        await send("Page.enable")
        await asyncio.sleep(3.0)

        # 1. Top of products.html (hero showcase)
        res = await send("Page.captureScreenshot", {"format": "png"})
        with open("scripts/products_showcase_live.png", "wb") as f:
            f.write(base64.b64decode(res["data"]))

        # 2. Scroll into showcase details
        await send("Runtime.evaluate", {"expression": "window.scrollTo(0, 1000);"})
        await asyncio.sleep(1.5)
        res = await send("Page.captureScreenshot", {"format": "png"})
        with open("scripts/products_showcase_scrolled.png", "wb") as f:
            f.write(base64.b64decode(res["data"]))

        # 3. Scroll into lineup grid
        await send("Runtime.evaluate", {"expression": "document.querySelector('#lineup').scrollIntoView();"})
        await asyncio.sleep(1.5)
        res = await send("Page.captureScreenshot", {"format": "png"})
        with open("scripts/products_lineup_live.png", "wb") as f:
            f.write(base64.b64decode(res["data"]))

    proc.terminate()
    print("Screenshots taken!")

if __name__ == "__main__":
    asyncio.run(main())
