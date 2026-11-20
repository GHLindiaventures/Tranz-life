import asyncio, json, urllib.request, subprocess, time, base64

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

async def test_difference_section():
    proc = subprocess.Popen([
        CHROME_PATH, '--headless', '--remote-debugging-port=9298', '--disable-gpu',
        '--window-size=1500,1050', 'http://localhost:5173/index.html'
    ])
    await asyncio.sleep(3)
    try:
        import websockets
        resp = urllib.request.urlopen('http://localhost:9298/json').read().decode()
        targets = json.loads(resp)
        pages = [t for t in targets if t.get('type') == 'page']
        if not pages:
            print("No page found")
            return
        ws_url = pages[0]['webSocketDebuggerUrl']
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
            await asyncio.sleep(4.0)

            # Hide intro/preloader and scroll directly to #difference
            expr_scroll = """(() => {
                const loader = document.getElementById('loader') || document.querySelector('.loader') || document.querySelector('.intro');
                if (loader) loader.style.display = 'none';
                const el = document.querySelector('#difference');
                if (el) el.scrollIntoView({behavior: 'instant'});
            })()"""
            await send('Runtime.evaluate', {'expression': expr_scroll})
            await asyncio.sleep(2.5)

            # Capture screenshot
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
