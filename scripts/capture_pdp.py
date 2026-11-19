import asyncio, json, urllib.request, subprocess, time, base64

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
cmd = [CHROME_PATH, '--headless', '--remote-debugging-port=9222', '--disable-gpu', '--window-size=1440,900', '--user-data-dir=C:\\Users\\LENOVO\\AppData\\Local\\Temp\\chrome-inspect']
proc = subprocess.Popen(cmd)
time.sleep(2)
try:
    import websockets
    req = urllib.request.Request('http://127.0.0.1:9222/json/new?http://localhost:5173/product-details.html?id=gummies', method='PUT')
    with urllib.request.urlopen(req) as resp:
        tab = json.loads(resp.read().decode())
    ws_url = tab['webSocketDebuggerUrl']

    async def run():
        async with websockets.connect(ws_url) as ws:
            msg_id = 0
            async def send(method, params=None):
                nonlocal msg_id
                msg_id += 1
                payload = {'id': msg_id, 'method': method, 'params': params or {}}
                await ws.send(json.dumps(payload))
                while True:
                    res = json.loads(await ws.recv())
                    if res.get('id') == msg_id:
                        return res.get('result', {})

            await send('Page.enable')
            await asyncio.sleep(2)
            ss = await send('Page.captureScreenshot', {'format': 'png'})
            with open('scripts/pdp_clean_preview.png', 'wb') as f:
                f.write(base64.b64decode(ss['data']))
            print('Saved pdp_clean_preview.png!')

    asyncio.run(run())
finally:
    proc.terminate()
