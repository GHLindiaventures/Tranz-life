import asyncio, json, urllib.request, subprocess, time, base64

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 5173

async def run():
    proc = subprocess.Popen([
        CHROME_PATH, '--headless', '--remote-debugging-port=9298', '--disable-gpu',
        '--window-size=1560,1050', f'http://localhost:{PORT}/index.html'
    ])
    await asyncio.sleep(3.0)
    try:
        import websockets
        resp = urllib.request.urlopen('http://localhost:9298/json').read().decode()
        targets = json.loads(resp)
        pages = [t for t in targets if t.get('type') == 'page']
        ws_url = pages[0]['webSocketDebuggerUrl']
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

            # Positions: u=0.0 (start of step 6), u=0.5 (mid), u=0.98 (end of step 6)
            points = [
                ('start', 5.08 / 6.0),
                ('mid', 5.50 / 6.0),
                ('end', 5.98 / 6.0)
            ]
            for name, progress in points:
                expr = """(() => {
                    const loader = document.getElementById('loader') || document.querySelector('.loader') || document.querySelector('.intro');
                    if (loader) loader.style.display = 'none';
                    const el = document.querySelector('#process');
                    const top = el.offsetTop;
                    const totalH = el.offsetHeight - window.innerHeight;
                    window.scrollTo(0, top + totalH * """ + str(progress) + """);
                    const vid = document.querySelector('.process-step-video[data-step="5"]');
                    return {
                        scrollY: window.scrollY,
                        vidTime: vid ? vid.currentTime : null,
                        vidReady: vid ? vid.readyState : null,
                        vidDur: vid ? vid.duration : null
                    };
                })()"""
                info = await send('Runtime.evaluate', {'expression': expr, 'returnByValue': True})
                print(f"{name} info (initial):", info.get('result', {}).get('value', {}))
                await asyncio.sleep(3.0)
                check_expr = """(() => {
                    const vid = document.querySelector('.process-step-video[data-step="5"]');
                    return { vidTime: vid ? vid.currentTime : null };
                })()"""
                info_after = await send('Runtime.evaluate', {'expression': check_expr, 'returnByValue': True})
                print(f"{name} info (after settle):", info_after.get('result', {}).get('value', {}))
                
                res = await send('Page.captureScreenshot', {'format': 'png'})
                out_path = fr'C:\Users\LENOVO\.gemini\antigravity\brain\6f09ac93-78bb-4130-93d0-ad7882b05545\process_step6_{name}_final6.png'
                with open(out_path, 'wb') as f:
                    f.write(base64.b64decode(res['data']))
                print(f"Captured {name} to {out_path}")

    finally:
        try:
            proc.terminate()
        except:
            pass

if __name__ == '__main__':
    asyncio.run(run())
