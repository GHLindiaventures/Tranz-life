const { spawn } = require('child_process');
const fs = require('fs');

const OUT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/022a0390-51ef-428a-b718-88319017d6c9';

async function verify() {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--remote-debugging-port=9399',
    '--headless=new',
    '--window-size=1440,900',
    'http://localhost:5173/about.html'
  ]);

  try {
    let list = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 300));
      try {
        const res = await fetch('http://127.0.0.1:9399/json/list');
        list = await res.json();
        if (list && list.some(t => t.url.includes('about.html') && t.type === 'page')) break;
      } catch (e) {}
    }
    const target = list.find(t => t.url.includes('about.html') && t.type === 'page');
    if (!target) {
      console.error('Target not found in Edge headless');
      return;
    }
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

    const consoleLogs = [];
    ws.addEventListener('message', (evt) => {
      const d = JSON.parse(evt.data);
      if (d.method === 'Runtime.consoleAPICalled') {
        consoleLogs.push({ type: d.params.type, args: d.params.args.map(a => a.value || a.description) });
      }
      if (d.method === 'Runtime.exceptionThrown') {
        consoleLogs.push({ type: 'EXCEPTION', details: d.params.exceptionDetails });
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');

    await new Promise(r => setTimeout(r, 1200));

    // Verify static state
    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        return {
          hasPauseBtn: !!document.getElementById('tlPauseMotion'),
          hasRail: !!document.querySelector('.tl-rail'),
          hasParticleCanvas: !!document.querySelector('.tl-particle-canvas'),
          hasDnaCanvas: !!document.querySelector('.tl-dna-canvas'),
          hasJsLoadedClass: document.body.classList.contains('js-loaded'),
          heroTitleText: document.querySelector('.about-hero-title')?.textContent.trim(),
          statNums: Array.from(document.querySelectorAll('.about-metric-card .num')).map(el => el.textContent.trim()),
          chapter6Present: !!document.getElementById('chapter-6'),
          chapter6Title: document.querySelector('#chapter-6 h2')?.textContent.trim()
        };
      })()`,
      returnByValue: true
    });

    console.log('Static Check Results:', JSON.stringify(evalRes.result.value, null, 2));

    // Screenshot Hero
    const heroShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${OUT_DIR}/static_about_hero.png`, Buffer.from(heroShot.data, 'base64'));
    console.log('Saved static_about_hero.png');

    // Scroll to Chapter 6
    await send('Runtime.evaluate', {
      expression: `window.scrollTo(0, document.getElementById('chapter-6').getBoundingClientRect().top + window.scrollY)`
    });
    await new Promise(r => setTimeout(r, 500));

    const ch6Shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${OUT_DIR}/static_about_chapter6.png`, Buffer.from(ch6Shot.data, 'base64'));
    console.log('Saved static_about_chapter6.png');

    console.log('Console Logs count:', consoleLogs.length);
    console.log(JSON.stringify(consoleLogs, null, 2));

    ws.close();
  } finally {
    edge.kill();
  }
}

verify().catch(console.error);

