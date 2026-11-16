const { spawn } = require('child_process');
const fs = require('fs');

const OUT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/022a0390-51ef-428a-b718-88319017d6c9';

async function captureAboutStory() {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--remote-debugging-port=9335',
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
        const res = await fetch('http://127.0.0.1:9335/json/list');
        list = await res.json();
        if (list && list.some(t => t.type === 'page' && t.url.includes('about'))) break;
      } catch (e) {}
    }
    const target = list.find(t => t.url.includes('about') && t.type === 'page') || list[0];
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

    console.log('--- TESTING ABOUT STORY PAGE ---');
    await new Promise(r => setTimeout(r, 2000));

    async function snapSection(selector, filename, offset = 0) {
      await send('Runtime.evaluate', {
        expression: `
          const el = document.querySelector('${selector}');
          if (el) {
            window.scrollTo(0, el.offsetTop + ${offset});
          }
        `
      });
      await new Promise(r => setTimeout(r, 600));
      const shot = await send('Page.captureScreenshot');
      fs.writeFileSync(`${OUT_DIR}/${filename}`, Buffer.from(shot.data, 'base64'));
      console.log(`Saved ${filename}`);
    }

    // 1. Chapter 1 (Botanical Roots)
    await snapSection('#chapter-1', 'about_chapter1_roots.png', -20);

    // 2. Chapter 2 (Cleanroom Biotech)
    await snapSection('#chapter-2', 'about_chapter2_cleanroom.png', -20);

    // 3. Chapter 3 (NRDC Government Technology Transfer)
    await snapSection('#chapter-3', 'about_chapter3_nrdc.png', -20);

    // 4. Chapter 4 (Chennai Innovation Hub & R&D)
    await snapSection('#chapter-4', 'about_chapter4_innovation_hub.png', -20);

    console.log('\nAll 4 About Story Chapters Captured Successfully!');
    ws.close();
  } finally {
    edge.kill();
  }
}

captureAboutStory().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
