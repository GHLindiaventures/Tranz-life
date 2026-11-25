import asyncio, json, urllib.request, subprocess, time, base64

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

async def main():
    cmd = [
        CHROME_PATH,
        '--headless',
        '--remote-debugging-port=9222',
        '--disable-gpu',
        '--window-size=1440,900',
        '--user-data-dir=C:\\Users\\LENOVO\\AppData\\Local\\Temp\\chrome-inspect'
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2)
    try:
        import websockets
        req = urllib.request.Request("http://127.0.0.1:9222/json/new?http://localhost:5173/", method="PUT")
        with urllib.request.urlopen(req) as resp:
            tab = json.loads(resp.read().decode())
        ws_url = tab["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url) as ws:
            msg_id = 0
            async def send(method, params=None):
                nonlocal msg_id
                msg_id += 1
                payload = {"id": msg_id, "method": method, "params": params or {}}
                await ws.send(json.dumps(payload))
                while True:
                    res = json.loads(await ws.recv())
                    if res.get("id") == msg_id:
                        return res.get("result", {})

            await send("Page.enable")
            await send("DOM.enable")
            await asyncio.sleep(2)

            await send("Runtime.evaluate", {
                "expression": """
                (() => {
                    const seq = document.getElementById('seq');
                    const seqFinal = document.getElementById('seqFinal');
                    if (seq) {
                        const top = seq.getBoundingClientRect().top + window.scrollY;
                        window.scrollTo(0, top + seq.offsetHeight * 0.88);
                    }
                    if (seqFinal) {
                        seqFinal.classList.add('play');
                    }
                    const hb0 = document.querySelector('.seq-hitbox[data-idx="0"]');
                    if (hb0) hb0.classList.add('is-active');
                    const hb2 = document.querySelector('.seq-hitbox[data-idx="2"]');
                    if (hb2) hb2.classList.add('is-active');
                })()
                """
            })
            # Wait for CSS transitions to finish!
            await asyncio.sleep(1)

            check = await send("Runtime.evaluate", {
                "expression": """
                (() => {
                    const card0 = document.querySelector('#shc-gummies');
                    const card2 = document.querySelector('#shc-rollon');
                    const cta = document.querySelector('.seq-cta');
                    const title = document.querySelector('#seqTitle');
                    const p0 = document.querySelectorAll('.sp')[0];
                    const p2 = document.querySelectorAll('.sp')[2];
                    return {
                        card0: card0.getBoundingClientRect(),
                        card2: card2.getBoundingClientRect(),
                        cta: cta ? cta.getBoundingClientRect() : null,
                        title: title ? title.getBoundingClientRect() : null,
                        p0: p0.getBoundingClientRect(),
                        p2: p2.getBoundingClientRect(),
                        card0_style: {
                            opacity: window.getComputedStyle(card0).opacity,
                            visibility: window.getComputedStyle(card0).visibility
                        }
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Layout Geometry:", json.dumps(check.get("result", {}).get("value"), indent=2))

            ss = await send("Page.captureScreenshot", {"format": "png"})
            with open("scripts/lineup_hover_preview.png", "wb") as f:
                f.write(base64.b64decode(ss["data"]))
            print("Screenshot saved!")

    finally:
        proc.terminate()

asyncio.run(main())
