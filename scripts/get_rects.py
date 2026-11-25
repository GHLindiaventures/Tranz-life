import asyncio, json, urllib.request, subprocess, time

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
cmd = [CHROME_PATH, '--headless', '--remote-debugging-port=9222', '--disable-gpu', '--window-size=1440,900', '--user-data-dir=C:\\Users\\LENOVO\\AppData\\Local\\Temp\\chrome-inspect']
proc = subprocess.Popen(cmd)
time.sleep(2)
try:
    import websockets
    req = urllib.request.Request('http://127.0.0.1:9222/json/new?http://localhost:5173/', method='PUT')
    with urllib.request.urlopen(req) as resp:
        tab = json.loads(resp.read().decode())
    ws_url = tab['webSocketDebuggerUrl']

    async def run():
        async with websockets.connect(ws_url) as ws:
            msg_id = 0
            async def send(method, params=None):
                nonlocal msg_id
                msg_id += 1
                payload = {'id': msg_id, 'method': method, 'params': params or {}}
                await ws.send(json.dumps(payload))
                while True:
                    res = json.loads(await ws.recv())
                    if res.get('id') == msg_id:
                        return res.get('result', {})

            await send('Page.enable')
            await asyncio.sleep(2)
            await send('Runtime.evaluate', {
                'expression': """
                    (() => {
                        const seq = document.getElementById('seq');
                        const top = seq.getBoundingClientRect().top + window.scrollY;
                        window.scrollTo(0, top + seq.offsetHeight * 0.9);
                        document.getElementById('seqFinal').classList.add('play');
                        document.querySelector('.seq-hitbox[data-idx="0"]').classList.add('is-active');
                        document.querySelector('.seq-hitbox[data-idx="2"]').classList.add('is-active');
                        document.querySelector('.seq-hitbox[data-idx="4"]').classList.add('is-active');
                    })()
                """
            })
            await asyncio.sleep(1)
            rects = await send('Runtime.evaluate', {
                'expression': """
                    (() => {
                        const toObj = r => ({ top: r.top, left: r.left, bottom: r.bottom, right: r.right, width: r.width, height: r.height });
                        return {
                            card0: toObj(document.querySelector('#shc-gummies').getBoundingClientRect()),
                            card2: toObj(document.querySelector('#shc-rollon').getBoundingClientRect()),
                            card4: toObj(document.querySelector('#shc-liver').getBoundingClientRect()),
                            cta: toObj(document.querySelector('.seq-cta').getBoundingClientRect()),
                            product0: toObj(document.querySelectorAll('.sp')[0].getBoundingClientRect()),
                            product2: toObj(document.querySelectorAll('.sp')[2].getBoundingClientRect()),
                            product4: toObj(document.querySelectorAll('.sp')[4].getBoundingClientRect())
                        };
                    })()
                """,
                'returnByValue': True
            })
            print('EXACT RECTS:', json.dumps(rects['result']['value'], indent=2))
    asyncio.run(run())
finally:
    proc.terminate()
