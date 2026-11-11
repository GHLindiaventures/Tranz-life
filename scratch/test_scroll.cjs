const { spawn } = require('child_process');

async function test() {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--remote-debugging-port=9325',
    '--headless=new',
    '--window-size=1440,900',
    'http://localhost:5173/about.html'
  ]);
  try {
    let list = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 300));
      try {
        const res = await fetch('http://127.0.0.1:9325/json/list');
        list = await res.json();
        if (list && list.length) break;
      } catch (e) {}
    }
    console.log('Targets:', list.map(t => ({ url: t.url, type: t.type })));
    const target = list.find(t => t.url.includes('about') && t.type === 'page') || list[0];
    console.log('Selected target:', target.url);
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    await new Promise(r => setTimeout(r, 1500));
    let id = 1;
    const send = (m, p = {}) => new Promise((resolve, reject) => {
      const mi = id++;
      const h = e => {
        const d = JSON.parse(e.data);
        if (d.id === mi) {
          ws.removeEventListener('message', h);
          if (d.error) reject(d.error); else resolve(d.result);
        }
      };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: mi, method: m, params: p }));
    });

    const check = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(['#hero', '#chapter-1', '#chapter-2', '#chapter-3', '#chapter-4', '#chapter-5'].map(s => {
        const el = document.querySelector(s);
        return { sel: s, top: el ? el.offsetTop : null, rectTop: el ? el.getBoundingClientRect().top : null };
      }))`
    });
    console.log(check.result.value);
    ws.close();
  } finally {
    edge.kill();
  }
}
test().catch(console.error);
