import asyncio, json, urllib.request, subprocess, time, base64

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

async def test_difference_section():
    proc = subprocess.Popen([
        CHROME_PATH, '--headless', '--remote-debugging-port=9298', '--disable-gpu',
        '--window-size=1560,1050', 'http://localhost:5174/index.html'
    ])
    await asyncio.sleep(3)
    try:
        import websockets
        resp = urllib.request.urlopen('http://localhost:9298/json').read().decode()
        targets = json.loads(resp)
        pages = [t for t in targets if t.get('type') == 'page']
        print("Pages found:", [(p.get('title'), p.get('url')) for p in pages])
        target_page = [p for p in pages if 'localhost:5174' in p.get('url', '')]
        ws_url = (target_page[0] if target_page else pages[0])['webSocketDebuggerUrl']
        async with websockets.connect(ws_url, max_size=25*1024*1024) as ws:
            async def send(method, params=None):
                msg_id = int(time.time() * 1000) % 1000000
                await ws.send(json.dumps({'id': msg_id, 'method': method, 'params': params or {}}))
                while True:
                    r = await ws.recv()
                    d = json.loads(r)
                    if d.get('id') == msg_id:
                        return d.get('result', {})

            await send('Page.enable')
            await asyncio.sleep(3.5)

            # Scroll directly to #difference
            expr_scroll = """(() => {
                const loader = document.getElementById('loader') || document.querySelector('.loader') || document.querySelector('.intro');
                if (loader) loader.style.display = 'none';
                const el = document.querySelector('#difference');
                if (el) {
                    el.scrollIntoView({behavior: 'instant', block: 'start'});
                    return { found: true, rect: el.getBoundingClientRect() };
                }
                return { found: false };
            })()"""
            scroll_info = await send('Runtime.evaluate', {'expression': expr_scroll, 'returnByValue': True})
            print("Scroll info:", json.dumps(scroll_info.get('result', {}).get('value', {}), indent=2))
            await asyncio.sleep(2.0)
            await send('Runtime.evaluate', {'expression': expr_scroll})
            await asyncio.sleep(2.0)

            # Check geometry of cards and right edge
            expr_geom = """(() => {
                const wrap = document.querySelector('.diff-wrap').getBoundingClientRect();
                const track = document.querySelector('.diff-cards-track').getBoundingClientRect();
                const cards = Array.from(document.querySelectorAll('.diff-glass-card')).map(c => c.getBoundingClientRect());
                const lastCard = cards[cards.length - 1];
                return {
                    winWidth: window.innerWidth,
                    wrap: { right: wrap.right, width: wrap.width },
                    track: { right: track.right, width: track.width },
                    lastCard: { right: lastCard.right, width: lastCard.width, spaceToWinRight: window.innerWidth - lastCard.right }
                };
            })()"""
            geom = await send('Runtime.evaluate', {'expression': expr_geom, 'returnByValue': True})
            print("Geometry:", json.dumps(geom.get('result', {}).get('value', {}), indent=2))

            # Capture screenshot of viewport
            res = await send('Page.captureScreenshot', {'format': 'png'})
            out_path = r'C:\Users\LENOVO\.gemini\antigravity\brain\6f09ac93-78bb-4130-93d0-ad7882b05545\difference_section_render.png'
            with open(out_path, 'wb') as f:
                f.write(base64.b64decode(res['data']))
            print("Successfully captured to:", out_path)
    finally:
        try:
            proc.terminate()
        except:
            pass

if __name__ == '__main__':
    asyncio.run(test_difference_section())
