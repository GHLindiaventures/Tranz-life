const { spawn } = require('child_process');
const fs = require('fs');

const OUT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/022a0390-51ef-428a-b718-88319017d6c9';

async function verify() {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--remote-debugging-port=9360',
    '--headless=new',
    '--window-size=1440,900',
    'http://localhost:5173/about.html'
  ]);

  try {
    let list = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 300));
      try {
        const res = await fetch('http://127.0.0.1:9360/json/list');
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

    // Listen for console errors
    await send('Console.enable');
    await send('Runtime.enable');
    const errors = [];
    ws.addEventListener('message', evt => {
      const d = JSON.parse(evt.data);
      if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') {
        errors.push(d.params.args.map(a => a.value || a.description).join(' '));
      }
    });

    await new Promise(r => setTimeout(r, 1500));

    // 1. Hero
    const shotHero = await send('Page.captureScreenshot');
    fs.writeFileSync(`${OUT_DIR}/phase0_snap_hero.png`, Buffer.from(shotHero.data, 'base64'));

    // 2. Chapter 2 What We Do
    await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('.what-we-do-block');
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 80);
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    const shotWwd = await send('Page.captureScreenshot');
    fs.writeFileSync(`${OUT_DIR}/phase0_snap_whatwedo.png`, Buffer.from(shotWwd.data, 'base64'));

    // 3. Chapter 3 Milestones
    await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('#milestones');
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 80);
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    const shotMilestones = await send('Page.captureScreenshot');
    fs.writeFileSync(`${OUT_DIR}/phase0_snap_milestones.png`, Buffer.from(shotMilestones.data, 'base64'));

    // 4. Chapter 5 Strengths
    await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('.core-strengths-block');
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 80);
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    const shotStrengths = await send('Page.captureScreenshot');
    fs.writeFileSync(`${OUT_DIR}/phase0_snap_strengths.png`, Buffer.from(shotStrengths.data, 'base64'));

    // 5. Chapter 6 The Next Frontier
    await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('#chapter-6');
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 40);
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    const shotChap6 = await send('Page.captureScreenshot');
    fs.writeFileSync(`${OUT_DIR}/phase0_snap_chapter6.png`, Buffer.from(shotChap6.data, 'base64'));

    console.log('Errors reported in console:', errors.length ? errors : 'None! Zero console errors.');
    ws.close();
  } finally {
    edge.kill();
  }
}

verify().catch(console.error);

