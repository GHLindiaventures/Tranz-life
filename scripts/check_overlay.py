import asyncio, json, urllib.request, subprocess, time

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
proc = subprocess.Popen([
    CHROME_PATH, '--headless', '--remote-debugging-port=9262', '--disable-gpu',
    '--window-size=1280,800', 'http://localhost:5174/products.html?id=gummies'
])
time.sleep(3)
try:
    import websockets
    async def run():
        targets = json.loads(urllib.request.urlopen('http://localhost:9262/json').read().decode())
        ws_url = targets[0]['webSocketDebuggerUrl']
        async with websockets.connect(ws_url) as ws:
            expr = "JSON.stringify({hasOverlay: !!document.querySelector('.sc-overlay'), ovOpen: document.querySelector('.sc-overlay')?.classList.contains('open'), bodyClass: document.body.className})"
            await ws.send(json.dumps({'id': 1, 'method': 'Runtime.evaluate', 'params': {'expression': expr}}))
            res = json.loads(await ws.recv())
            val = res.get('result', {}).get('result', {}).get('value')
            print('Evaluate res value:', val)
    asyncio.run(run())
finally:
    proc.terminate()
