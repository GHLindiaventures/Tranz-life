import asyncio, json, urllib.request, subprocess, time

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
products = ['gummies', 'inhaler', 'rollon', 'reviva', 'liver']

async def test_product(prod, port):
    proc = subprocess.Popen([
        CHROME_PATH, '--headless', f'--remote-debugging-port={port}', '--disable-gpu',
        '--window-size=1280,800', f'http://localhost:5174/products.html?id={prod}'
    ])
    await asyncio.sleep(3.5)
    try:
        import websockets
        targets = json.loads(urllib.request.urlopen(f'http://localhost:{port}/json').read().decode())
        ws_url = targets[0]['webSocketDebuggerUrl']
        async with websockets.connect(ws_url) as ws:
            expr = "JSON.stringify({id: '" + prod + "', hasOv: !!document.querySelector('.sc-overlay'), ovOpen: document.querySelector('.sc-overlay')?.classList.contains('open'), heroName: document.querySelector('.sc-heroname')?.textContent})"
            await ws.send(json.dumps({'id': 1, 'method': 'Runtime.evaluate', 'params': {'expression': expr}}))
            res = json.loads(await ws.recv())
            print(res.get('result', {}).get('result', {}).get('value'))
    finally:
        proc.terminate()
        await asyncio.sleep(0.5)

async def main():
    for idx, prod in enumerate(products):
        await test_product(prod, 9270 + idx)

asyncio.run(main())
