import asyncio, json, urllib.request, subprocess, time, base64

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

async def test_difference_section():
    proc = subprocess.Popen([
        CHROME_PATH, '--headless=new', '--remote-debugging-port=9298', '--disable-gpu',
        '--window-size=1440,1000', 'http://localhost:5174/index.html'
    ])
    await asyncio.sleep(3)
    try:
        import websockets
        targets = json.loads(urllib.request.urlopen('http://localhost:9298/json').read().decode())
        ws_url = targets[0]['webSocketDebuggerUrl']
        async with websockets.connect(ws_url, max_size=25*1024*1024) as ws:
            # Wait for intro animation to pass
            await asyncio.sleep(4.5)
            # Remove any loader if present and scroll to #difference
            expr_scroll = """(() => {
                const loader = document.getElementById('loader') || document.querySelector('.loader') || document.querySelector('.intro');
                if (loader) loader.style.display = 'none';
                const el = document.querySelector('#difference');
                if (el) el.scrollIntoView({behavior: 'instant'});
            })()"""
            await ws.send(json.dumps({'id': 1, 'method': 'Runtime.evaluate', 'params': {'expression': expr_scroll}}))
            await ws.recv()
            await asyncio.sleep(2)
            
            # Check cards and images status
            expr = """(() => {
                const sec = document.querySelector('#difference');
                const cards = Array.from(sec.querySelectorAll('.diff-glass-card'));
                return {
                    sectionFound: !!sec,
                    cardCount: cards.length,
                    cards: cards.map(c => {
                        const img = c.querySelector('img');
                        const title = c.querySelector('.diff-card-title')?.innerText;
                        return {
                            title,
                            imgSrc: img?.src,
                            imgComplete: img ? img.complete : false,
                            imgNaturalW: img ? img.naturalWidth : 0,
                            imgNaturalH: img ? img.naturalHeight : 0,
                            visible: c.getBoundingClientRect().width > 0 && c.getBoundingClientRect().height > 0
                        };
                    })
                };
            })()"""
            await ws.send(json.dumps({'id': 2, 'method': 'Runtime.evaluate', 'params': {'expression': expr, 'returnByValue': True}}))
            res = json.loads(await ws.recv())
            print("Difference section verification:", json.dumps(res.get('result', {}).get('result', {}).get('value'), indent=2))
            
            # Take screenshot of element #difference
            clip_expr = """(() => {
                const r = document.querySelector('#difference').getBoundingClientRect();
                return { x: r.x, y: r.y, width: r.width, height: r.height, scale: 1 };
            })()"""
            await ws.send(json.dumps({'id': 3, 'method': 'Runtime.evaluate', 'params': {'expression': clip_expr, 'returnByValue': True}}))
            clip_res = json.loads(await ws.recv())
            clip = clip_res.get('result', {}).get('result', {}).get('value')
            
            if clip:
                print("Clip:", clip)
                # Take viewport screenshot
                await ws.send(json.dumps({
                    'id': 4,
                    'method': 'Page.captureScreenshot',
                    'params': {'format': 'jpeg', 'quality': 85}
                }))
                shot_res = json.loads(await ws.recv())
                data = shot_res.get('result', {}).get('data')
                if data:
                    out_path = r'C:\Users\LENOVO\.gemini\antigravity\brain\6f09ac93-78bb-4130-93d0-ad7882b05545\difference_section_render.png'
                    with open(out_path, 'wb') as f:
                        f.write(base64.b64decode(data))
                    print(f"Screenshot saved to {out_path}")
    finally:
        proc.terminate()

asyncio.run(test_difference_section())
