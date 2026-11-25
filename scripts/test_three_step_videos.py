import asyncio, json, urllib.request, subprocess, time, base64

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 5173

async def test_three_steps():
    proc = subprocess.Popen([
        CHROME_PATH, '--headless', '--remote-debugging-port=9298', '--disable-gpu',
        '--window-size=1560,1050', f'http://localhost:{PORT}/index.html'
    ])
    await asyncio.sleep(3.5)
    try:
        import websockets
        resp = urllib.request.urlopen('http://localhost:9298/json').read().decode()
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

            # Test Step 1
            expr_step1 = """(() => {
                const loader = document.getElementById('loader') || document.querySelector('.loader') || document.querySelector('.intro');
                if (loader) loader.style.display = 'none';
                const el = document.querySelector('#process');
                if (!el) return { found: false };
                const top = el.offsetTop;
                window.scrollTo(0, top + 100);
                const vids = Array.from(document.querySelectorAll('.process-step-video')).map(v => ({
                    step: v.dataset.step,
                    src: v.currentSrc || v.src,
                    ready: v.readyState,
                    time: v.currentTime
                }));
                return { found: true, top: top, vids: vids };
            })()"""
            info1 = await send('Runtime.evaluate', {'expression': expr_step1, 'returnByValue': True})
            print("Step 1 info:", json.dumps(info1.get('result', {}).get('value', {}), indent=2))
            await asyncio.sleep(2.0)
            res1 = await send('Page.captureScreenshot', {'format': 'png'})
            out1 = r'C:\Users\LENOVO\.gemini\antigravity\brain\6f09ac93-78bb-4130-93d0-ad7882b05545\process_step1_video_render.png'
            with open(out1, 'wb') as f:
                f.write(base64.b64decode(res1['data']))
            print("Captured step 1 to:", out1)

            # Test Step 2
            expr_step2 = """(() => {
                const el = document.querySelector('#process');
                const top = el.offsetTop;
                const totalH = el.offsetHeight - window.innerHeight;
                // stage 1 is roughly progress 1/6 = 0.166
                window.scrollTo(0, top + totalH * (1.3 / 6));
                const vids = Array.from(document.querySelectorAll('.process-step-video')).map(v => ({
                    step: v.dataset.step,
                    src: v.currentSrc || v.src,
                    ready: v.readyState,
                    time: v.currentTime
                }));
                return { scrollY: window.scrollY, vids: vids };
            })()"""
            info2 = await send('Runtime.evaluate', {'expression': expr_step2, 'returnByValue': True})
            print("Step 2 info:", json.dumps(info2.get('result', {}).get('value', {}), indent=2))
            await asyncio.sleep(2.0)
            res2 = await send('Page.captureScreenshot', {'format': 'png'})
            out2 = r'C:\Users\LENOVO\.gemini\antigravity\brain\6f09ac93-78bb-4130-93d0-ad7882b05545\process_step2_video_render.png'
            with open(out2, 'wb') as f:
                f.write(base64.b64decode(res2['data']))
            print("Captured step 2 to:", out2)

            # Test Step 3
            expr_step3 = """(() => {
                const el = document.querySelector('#process');
                const top = el.offsetTop;
                const totalH = el.offsetHeight - window.innerHeight;
                // stage 2 is roughly progress 2/6 = 0.333
                window.scrollTo(0, top + totalH * (2.3 / 6));
                const vids = Array.from(document.querySelectorAll('.process-step-video')).map(v => ({
                    step: v.dataset.step,
                    src: v.currentSrc || v.src,
                    ready: v.readyState,
                    time: v.currentTime
                }));
                return { scrollY: window.scrollY, vids: vids };
            })()"""
            info3 = await send('Runtime.evaluate', {'expression': expr_step3, 'returnByValue': True})
            print("Step 3 info:", json.dumps(info3.get('result', {}).get('value', {}), indent=2))
            await asyncio.sleep(2.0)
            res3 = await send('Page.captureScreenshot', {'format': 'png'})
            out3 = r'C:\Users\LENOVO\.gemini\antigravity\brain\6f09ac93-78bb-4130-93d0-ad7882b05545\process_step3_video_render.png'
            with open(out3, 'wb') as f:
                f.write(base64.b64decode(res3['data']))
            print("Captured step 3 to:", out3)

    finally:
        try:
            proc.terminate()
        except:
            pass

if __name__ == '__main__':
    asyncio.run(test_three_steps())
