import asyncio, json, urllib.request, subprocess, time

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

async def test_science():
    proc = subprocess.Popen([
        CHROME_PATH, '--headless', '--remote-debugging-port=9285', '--disable-gpu',
        '--window-size=1280,800', 'http://localhost:5174/index.html#science'
    ])
    await asyncio.sleep(3.5)
    try:
        import websockets
        targets = json.loads(urllib.request.urlopen('http://localhost:9285/json').read().decode())
        ws_url = targets[0]['webSocketDebuggerUrl']
        async with websockets.connect(ws_url) as ws:
            expr = """(() => {
                const title = document.querySelector('#sciHerbTitle')?.textContent;
                const latin = document.querySelector('#sciHerbLatin')?.textContent;
                const photo = document.querySelector('#sciHerbPhoto')?.src;
                const chips = Array.from(document.querySelectorAll('#herbs button')).map(b => b.textContent.trim());
                const facts = Array.from(document.querySelectorAll('.herb-callout-note')).map(n => n.textContent.trim());
                return { title, latin, hasPhoto: !!photo, photoSrc: photo ? photo.slice(-30) : '', chipsCount: chips.length, chips, facts };
            })()"""
            await ws.send(json.dumps({'id': 1, 'method': 'Runtime.evaluate', 'params': {'expression': expr, 'returnByValue': True}}))
            res = json.loads(await ws.recv())
            print("Science section check:", json.dumps(res.get('result', {}).get('result', {}).get('value'), indent=2))
    finally:
        proc.terminate()

asyncio.run(test_science())
