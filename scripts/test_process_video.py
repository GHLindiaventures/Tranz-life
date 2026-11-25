import asyncio, json, urllib.request, subprocess, time, base64

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

async def test_process_video():
    proc = subprocess.Popen([
        CHROME_PATH, '--headless', '--remote-debugging-port=9299', '--disable-gpu',
        '--window-size=1560,1050', 'http://localhost:5174/index.html'
    ])
    await asyncio.sleep(3.5)
    try:
        import websockets
        resp = urllib.request.urlopen('http://localhost:9299/json').read().decode()
        targets = json.loads(resp)
        pages = [t for t in targets if t.get('type') == 'page']
        target_page = [p for p in pages if 'localhost:5174' in p.get('url', '')]
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

            # Scroll to #process and set stage 0
            expr_scroll = """(() => {
                const loader = document.getElementById('loader') || document.querySelector('.loader') || document.querySelector('.intro');
                if (loader) loader.style.display = 'none';
                const el = document.querySelector('#process');
                if (el) {
                    el.scrollIntoView({behavior: 'instant', block: 'start'});
                    window.scrollBy(0, 200); // trigger into process section
                    const vid = document.querySelector('.process-step-video');
                    return {
                        found: true,
                        rect: el.getBoundingClientRect(),
                        videoFound: !!vid,
                        videoSrc: vid ? vid.src : null,
                        videoReady: vid ? vid.readyState : null
                    };
                }
                return { found: false };
            })()"""
            info = await send('Runtime.evaluate', {'expression': expr_scroll, 'returnByValue': True})
            print("Process check:", json.dumps(info.get('result', {}).get('value', {}), indent=2))
            await asyncio.sleep(2.5)

            # Capture screenshot
            res = await send('Page.captureScreenshot', {'format': 'png'})
            out_path = r'C:\Users\LENOVO\.gemini\antigravity\brain\6f09ac93-78bb-4130-93d0-ad7882b05545\process_step1_video_render.png'
            with open(out_path, 'wb') as f:
                f.write(base64.b64decode(res['data']))
            print("Successfully captured screenshot to:", out_path)
    finally:
        try:
            proc.terminate()
        except:
            pass

if __name__ == '__main__':
    asyncio.run(test_process_video())
