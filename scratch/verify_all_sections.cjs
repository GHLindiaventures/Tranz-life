const { spawn } = require('child_process');
const fs = require('fs');

const OUT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/022a0390-51ef-428a-b718-88319017d6c9';

async function verifyAll() {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--remote-debugging-port=9377',
    '--headless=new',
    '--window-size=1440,900',
    'http://localhost:5173/about.html'
  ]);

  try {
    let list = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 300));
      try {
        const res = await fetch('http://127.0.0.1:9377/json/list');
        list = await res.json();
        if (list && list.some(t => t.url.includes('about.html') && t.type === 'page')) break;
      } catch (e) {}
    }
    const target = list.find(t => t.url.includes('about.html') && t.type === 'page');
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

    await send('Runtime.enable');
    await send('Page.enable');
    await new Promise(r => setTimeout(r, 1500));

    const sections = ['chapter-1', 'chapter-2', 'chapter-3', 'chapter-5', 'cta'];
    for (const sec of sections) {
      await send('Runtime.evaluate', {
        expression: `window.scrollTo(0, document.getElementById('${sec}').getBoundingClientRect().top + window.scrollY)`
      });
      await new Promise(r => setTimeout(r, 800));
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`${OUT_DIR}/anim_${sec}.png`, Buffer.from(shot.data, 'base64'));
      console.log(`Captured anim_${sec}.png`);
    }

    ws.close();
  } finally {
    edge.kill();
  }
}

verifyAll().catch(console.error);

