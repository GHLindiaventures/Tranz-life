import asyncio, json, urllib.request, subprocess, time, base64

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 5173

async def test_step6():
    proc = subprocess.Popen([
        CHROME_PATH, '--headless', '--remote-debugging-port=9296', '--disable-gpu',
        '--window-size=1560,1050', f'http://localhost:{PORT}/index.html'
    ])
    await asyncio.sleep(3.5)
    try:
        import websockets
        resp = urllib.request.urlopen('http://localhost:9296/json').read().decode()
        targets = json.loads(resp)
        pages = [t for t in targets if t.get('type') == 'page']
        target_page = [p for p in pages if f'localhost:{PORT}' in p.get('url', '')]
        ws_url = (target_page[0] if target_page else pages[0])['webSocketDebuggerUrl']
        async with websockets.connect(ws_url, max_size=25*1024*1024, ping_interval=None) as ws:
            async def send(method, params=None):
                msg_id = int(time.time() * 1000) % 1000000
                await ws.send(json.dumps({'id': msg_id, 'method': method, 'params': params or {}}))
                while True:
                    r = await ws.recv()
                    d = json.loads(r)
                    if d.get('id') == msg_id:
                        return d.get('result', {})

            await send('Page.enable')
            await asyncio.sleep(2.0)

            # Check all mounted videos
            expr_check = """(() => {
                const loader = document.getElementById('loader') || document.querySelector('.loader') || document.querySelector('.intro');
                if (loader) loader.style.display = 'none';
                const vids = Array.from(document.querySelectorAll('.process-step-video')).map(v => ({
                    step: v.dataset.step,
                    src: v.currentSrc || v.src,
                    ready: v.readyState,
                    time: v.currentTime
                }));
                return { count: vids.length, vids: vids };
            })()"""
            info = await send('Runtime.evaluate', {'expression': expr_check, 'returnByValue': True})
            print("Mounted videos count:", json.dumps(info.get('result', {}).get('value', {}), indent=2))

            # Test Step 6 (k = 5): scroll to stage 5
            expr_step6 = """(() => {
                const el = document.querySelector('#process');
                const top = el.offsetTop;
                const totalH = el.offsetHeight - window.innerHeight;
                // Stage 5 is progress roughly 5.3 / 6
                window.scrollTo(0, top + totalH * (5.3 / 6));
                return { scrollY: window.scrollY };
            })()"""
            await send('Runtime.evaluate', {'expression': expr_step6, 'returnByValue': True})
            await asyncio.sleep(2.5)
            res6 = await send('Page.captureScreenshot', {'format': 'png'})
            out6 = r'C:\Users\LENOVO\.gemini\antigravity\brain\6f09ac93-78bb-4130-93d0-ad7882b05545\process_step6_video_render.png'
            with open(out6, 'wb') as f:
                f.write(base64.b64decode(res6['data']))
            print("Captured step 6 to:", out6)

    finally:
        try:
            proc.terminate()
        except:
            pass

if __name__ == '__main__':
    asyncio.run(test_step6())
