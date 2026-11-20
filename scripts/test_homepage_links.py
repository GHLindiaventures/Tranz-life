import asyncio, json, urllib.request, subprocess, time

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

async def test_homepage_links():
    proc = subprocess.Popen([
        CHROME_PATH, '--headless', '--remote-debugging-port=9280', '--disable-gpu',
        '--window-size=1280,800', 'http://localhost:5174/index.html'
    ])
    await asyncio.sleep(3.5)
    try:
        import websockets
        targets = json.loads(urllib.request.urlopen('http://localhost:9280/json').read().decode())
        ws_url = targets[0]['webSocketDebuggerUrl']
        async with websockets.connect(ws_url) as ws:
            expr = """(() => {
                const labels = Array.from(document.querySelectorAll('.sl')).map(el => ({
                    tag: el.tagName,
                    href: el.getAttribute('href'),
                    text: el.textContent.trim()
                }));
                const cards = Array.from(document.querySelectorAll('.sc')).map(el => ({
                    dataId: el.getAttribute('data-id'),
                    hasClick: typeof el.onclick,
                    role: el.getAttribute('role')
                }));
                const prods = Array.from(document.querySelectorAll('.sp')).map(el => ({
                    dataId: el.getAttribute('data-id'),
                    cursor: window.getComputedStyle(el).cursor,
                    pointerEvents: window.getComputedStyle(el).pointerEvents
                }));
                return { labels, cards, prods };
            })()"""
            await ws.send(json.dumps({'id': 1, 'method': 'Runtime.evaluate', 'params': {'expression': expr, 'returnByValue': True}}))
            res = json.loads(await ws.recv())
            print("Homepage elements check:", json.dumps(res.get('result', {}).get('result', {}).get('value'), indent=2))
    finally:
        proc.terminate()

asyncio.run(test_homepage_links())
