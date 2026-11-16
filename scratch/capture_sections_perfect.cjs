const { spawn } = require('child_process');
const fs = require('fs');

const OUT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/022a0390-51ef-428a-b718-88319017d6c9';

async function capture() {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--remote-debugging-port=9340',
    '--headless=new',
    '--enable-gpu',
    '--window-size=1440,900',
    'http://localhost:5173/about.html'
  ]);

  try {
    let list = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 400));
      try {
        const res = await fetch('http://127.0.0.1:9340/json/list');
        list = await res.json();
        if (list && list.some(t => t.type === 'page' && t.url.includes('about'))) break;
      } catch (e) {}
    }
    const target = list.find(t => t.url.includes('about') && t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const msgId = id++;
      const handler = (evt) => {
        const d = JSON.parse(evt.data);
        if (d.id === msgId) {
          ws.removeEventListener('message', handler);
          if (d.error) reject(d.error);
          else resolve(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await new Promise(r => setTimeout(r, 2000));

    async function snap(selector, filename) {
      await send('Runtime.evaluate', {
        expression: `(() => {
          const el = document.querySelector('${selector}');
          if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY;
            window.scrollTo(0, y - 60);
          }
        })()`
      });
      await new Promise(r => setTimeout(r, 700));
      const shot = await send('Page.captureScreenshot');
      fs.writeFileSync(`${OUT_DIR}/${filename}`, Buffer.from(shot.data, 'base64'));
      console.log(`Saved ${filename}`);
    }

    await snap('#chapter-1', 'snap_chapter1.png');
    await snap('#chapter-2', 'snap_chapter2.png');
    await snap('#chapter-3', 'snap_chapter3.png');
    await snap('#chapter-4', 'snap_chapter4.png');

    ws.close();
  } finally {
    edge.kill();
  }
}

capture().catch(console.error);
