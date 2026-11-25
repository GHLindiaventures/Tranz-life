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

            # Scroll to #seq and make finale active
            eval_res = await send("Runtime.evaluate", {
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
                    return {
                        scrollY: window.scrollY,
                        hitboxes: document.querySelectorAll('.seq-hitbox').length,
                        cards: document.querySelectorAll('.seq-hover-card').length,
                        playClass: seqFinal ? seqFinal.classList.contains('play') : false
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Eval 1:", eval_res.get("result", {}).get("value"))
            await asyncio.sleep(1)

            # Now trigger hover on the first hitbox
            hover_res = await send("Runtime.evaluate", {
                "expression": """
                (() => {
                    const hb0 = document.querySelector('.seq-hitbox[data-idx="0"]');
                    const card0 = document.querySelector('#shc-gummies');
                    if (hb0) {
                        hb0.classList.add('is-active');
                    }
                    if (card0) {
                        const rect = card0.getBoundingClientRect();
                        const comp = window.getComputedStyle(card0);
                        return {
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height,
                            opacity: comp.opacity,
                            visibility: comp.visibility,
                            display: comp.display,
                            zIndex: comp.zIndex,
                            bottom: comp.bottom
                        };
                    }
                    return null;
                })()
                """,
                "returnByValue": True
            })
            print("Card 0 Computed:", hover_res.get("result", {}).get("value"))

            # Capture screenshot
            ss = await send("Page.captureScreenshot", {"format": "png"})
            with open("scripts/lineup_hover_preview.png", "wb") as f:
                f.write(base64.b64decode(ss["data"]))
            print("Screenshot saved to scripts/lineup_hover_preview.png")

    finally:
        proc.terminate()

asyncio.run(main())
