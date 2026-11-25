import asyncio, json, urllib.request, subprocess, time, base64

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 5173

async def test_step6_start_end():
    proc = subprocess.Popen([
        CHROME_PATH, '--headless', '--remote-debugging-port=9295', '--disable-gpu',
        '--window-size=1560,1050', f'http://localhost:{PORT}/index.html'
    ])
    await asyncio.sleep(3.5)
    try:
        import websockets
        resp = urllib.request.urlopen('http://localhost:9295/json').read().decode()
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

            # Scroll to start of Step 6: stage index 5, progress roughly 5.08 / 6
            expr_start = """(() => {
                const loader = document.getElementById('loader') || document.querySelector('.loader') || document.querySelector('.intro');
                if (loader) loader.style.display = 'none';
                const el = document.querySelector('#process');
                const top = el.offsetTop;
                const totalH = el.offsetHeight - window.innerHeight;
                window.scrollTo(0, top + totalH * (5.10 / 6));
                const vid = document.querySelector('.process-step-video[data-step="5"]');
                return {
                    scrollY: window.scrollY,
                    step6_time: vid ? vid.currentTime : null,
                    step6_ready: vid ? vid.readyState : null,
                    step6_dur: vid ? vid.duration : null
                };
            })()"""
            info_start = await send('Runtime.evaluate', {'expression': expr_start, 'returnByValue': True})
            print("Step 6 Start info:", json.dumps(info_start.get('result', {}).get('value', {}), indent=2))
            await asyncio.sleep(2.5)
            res_start = await send('Page.captureScreenshot', {'format': 'png'})
            out_start = r'C:\Users\LENOVO\.gemini\antigravity\brain\6f09ac93-78bb-4130-93d0-ad7882b05545\process_step6_start.png'
            with open(out_start, 'wb') as f:
                f.write(base64.b64decode(res_start['data']))
            print("Captured Step 6 start to:", out_start)

            # Scroll to end of Step 6: progress roughly 5.95 / 6
            expr_end = """(() => {
                const el = document.querySelector('#process');
                const top = el.offsetTop;
                const totalH = el.offsetHeight - window.innerHeight;
                window.scrollTo(0, top + totalH * (5.95 / 6));
                const vid = document.querySelector('.process-step-video[data-step="5"]');
                return {
                    scrollY: window.scrollY,
                    step6_time: vid ? vid.currentTime : null,
                    step6_ready: vid ? vid.readyState : null
                };
            })()"""
            info_end = await send('Runtime.evaluate', {'expression': expr_end, 'returnByValue': True})
            print("Step 6 End info:", json.dumps(info_end.get('result', {}).get('value', {}), indent=2))
            await asyncio.sleep(2.5)
            res_end = await send('Page.captureScreenshot', {'format': 'png'})
            out_end = r'C:\Users\LENOVO\.gemini\antigravity\brain\6f09ac93-78bb-4130-93d0-ad7882b05545\process_step6_end.png'
            with open(out_end, 'wb') as f:
                f.write(base64.b64decode(res_end['data']))
            print("Captured Step 6 end to:", out_end)

    finally:
        try:
            proc.terminate()
        except:
            pass

if __name__ == '__main__':
    asyncio.run(test_step6_start_end())
