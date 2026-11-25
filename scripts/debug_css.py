import asyncio, json, urllib.request, subprocess, time

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
            await send("CSS.enable")
            await asyncio.sleep(2)

            res = await send("Runtime.evaluate", {
                "expression": """
                (() => {
                    const card = document.querySelector('#shc-gummies');
                    const hb = document.querySelector('.seq-hitbox[data-idx="0"]');
                    hb.classList.add('is-active');
                    
                    // check all stylesheet rules matching seq-hover-card
                    const matches = [];
                    for (const sheet of document.styleSheets) {
                        try {
                            for (const rule of sheet.cssRules) {
                                if (rule.selectorText && rule.selectorText.includes('seq-hover-card')) {
                                    matches.push({ selector: rule.selectorText, cssText: rule.cssText });
                                }
                            }
                        } catch(e) {}
                    }
                    return {
                        hbClasses: hb.className,
                        cardClasses: card.className,
                        rules: matches
                    };
                })()
                """,
                "returnByValue": True
            })
            print("CSS Rules matching seq-hover-card:", json.dumps(res.get("result", {}).get("value"), indent=2))

    finally:
        proc.terminate()

asyncio.run(main())
