import asyncio, json, urllib.request, subprocess, time

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

async def main():
    cmd = [
        CHROME_PATH,
        "--headless",
        "--remote-debugging-port=9246",
        "--disable-gpu",
        "--window-size=1440,900",
        "http://localhost:5173/product-details.html?id=gummies"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(3)

    import websockets

    resp = urllib.request.urlopen("http://localhost:9246/json").read()
    tabs = json.loads(resp)
    ws_url = tabs[0]["webSocketDebuggerUrl"]

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

        res = await send("Runtime.evaluate", {
            "expression": """
                JSON.stringify({
                    title: document.title,
                    h1: document.querySelector('.pdp-title')?.textContent,
                    copy: document.querySelector('.pdp-copy')?.innerHTML.slice(0, 300),
                    copyRect: document.querySelector('.pdp-copy')?.getBoundingClientRect(),
                    gridRect: document.querySelector('.pdp-grid')?.getBoundingClientRect()
                })
            """
        })
        print(res.get("result", {}).get("value"))

    proc.terminate()

if __name__ == "__main__":
    asyncio.run(main())
