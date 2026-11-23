import asyncio, json, urllib.request, subprocess, time

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

async def test_flight():
    proc = subprocess.Popen([
        CHROME_PATH, '--headless', '--remote-debugging-port=9290', '--disable-gpu',
        '--window-size=1280,800', 'http://localhost:5174/index.html'
    ])
    await asyncio.sleep(3.5)
    try:
        import websockets
        targets = json.loads(urllib.request.urlopen('http://localhost:9290/json').read().decode())
        ws_url = targets[0]['webSocketDebuggerUrl']
        async with websockets.connect(ws_url) as ws:
            # Check initial state
            expr1 = "JSON.stringify({ flightOn: document.documentElement.classList.contains('flight-on'), hasFlight: !!document.querySelector('#flight') })"
            await ws.send(json.dumps({'id': 1, 'method': 'Runtime.evaluate', 'params': {'expression': expr1}}))
            res1 = json.loads(await ws.recv())
            print("Before scroll:", res1.get('result', {}).get('result', {}).get('value'))

            # Scroll down 600px
            await ws.send(json.dumps({'id': 2, 'method': 'Runtime.evaluate', 'params': {'expression': 'window.scrollTo(0, 600);'}}))
            await ws.recv()
            await asyncio.sleep(1)

            # Check scrolled state
            expr2 = "JSON.stringify({ scrollY: window.scrollY, flightOn: document.documentElement.classList.contains('flight-on'), hasFlight: !!document.querySelector('#flight'), flightVisible: document.querySelector('#flight')?.style.visibility, imgParent: document.querySelector('#flight img')?.parentElement?.id })"
            await ws.send(json.dumps({'id': 3, 'method': 'Runtime.evaluate', 'params': {'expression': expr2}}))
            res2 = json.loads(await ws.recv())
            print("After scroll 600px:", res2.get('result', {}).get('result', {}).get('value'))

            # Scroll down to 1400px (insider section)
            await ws.send(json.dumps({'id': 4, 'method': 'Runtime.evaluate', 'params': {'expression': 'window.scrollTo(0, 1400);'}}))
            await ws.recv()
            await asyncio.sleep(1)

            expr3 = "JSON.stringify({ scrollY: window.scrollY, flightOn: document.documentElement.classList.contains('flight-on'), flightVisible: document.querySelector('#flight')?.style.visibility, imgTransform: document.querySelector('#flight img')?.style.transform })"
            await ws.send(json.dumps({'id': 5, 'method': 'Runtime.evaluate', 'params': {'expression': expr3}}))
            res3 = json.loads(await ws.recv())
            print("After scroll 1400px:", res3.get('result', {}).get('result', {}).get('value'))
    finally:
        proc.terminate()

asyncio.run(test_flight())
