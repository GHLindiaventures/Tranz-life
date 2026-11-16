const { spawn } = require('child_process');
const fs = require('fs');

const OUT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/022a0390-51ef-428a-b718-88319017d6c9';

async function captureBadges() {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--remote-debugging-port=9350',
    '--headless=new',
    '--enable-gpu',
    '--window-size=1440,900',
    'http://localhost:5173/certifications.html'
  ]);

  try {
    let list = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 400));
      try {
        const res = await fetch('http://127.0.0.1:9350/json/list');
        list = await res.json();
        if (list && list.some(t => t.type === 'page' && t.url.includes('certifications'))) break;
      } catch (e) {}
    }
    const target = list.find(t => t.url.includes('certifications') && t.type === 'page');
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

    // Scroll to cert-gov-strip
    await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('.cert-gov-strip');
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY;
          window.scrollTo(0, y - 100);
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 700));

    const shot1 = await send('Page.captureScreenshot');
    fs.writeFileSync(`${OUT_DIR}/certifications_official_badges_preview.png`, Buffer.from(shot1.data, 'base64'));
    console.log('Saved certifications_official_badges_preview.png');

    // Now test index.html trust strip
    await send('Page.navigate', { url: 'http://localhost:5173/index.html' });
    await new Promise(r => setTimeout(r, 2000));

    await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('#gov-trust');
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY;
          window.scrollTo(0, y - 60);
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 700));

    const shot2 = await send('Page.captureScreenshot');
    fs.writeFileSync(`${OUT_DIR}/index_official_badges_preview.png`, Buffer.from(shot2.data, 'base64'));
    console.log('Saved index_official_badges_preview.png');

    ws.close();
  } finally {
    edge.kill();
  }
}

captureBadges().catch(console.error);
