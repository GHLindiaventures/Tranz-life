import asyncio, json, urllib.request, subprocess, time, base64

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

async def test_prod(pid):
    cmd = [
        CHROME_PATH,
        "--headless",
        "--remote-debugging-port=9247",
        "--disable-gpu",
        "--window-size=1440,900",
        f"http://localhost:5173/product-details.html?id={pid}"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(3)

    import websockets

    resp = urllib.request.urlopen("http://localhost:9247/json").read()
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
        await asyncio.sleep(2.0)

        res = await send("Page.captureScreenshot", {"format": "png"})
        with open(f"scripts/pdp_{pid}_dedicated.png", "wb") as f:
            f.write(base64.b64decode(res["data"]))

    proc.terminate()
    print(f"Captured {pid}!")

if __name__ == "__main__":
    asyncio.run(test_prod("inhaler"))
