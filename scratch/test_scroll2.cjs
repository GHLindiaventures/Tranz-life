const { spawn } = require('child_process');

async function test() {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--remote-debugging-port=9330',
    '--headless=new',
    '--window-size=1440,900',
    'http://localhost:5173/about.html'
  ]);
  try {
    let list = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 300));
      try {
        const res = await fetch('http://127.0.0.1:9330/json/list');
        list = await res.json();
        if (list && list.length) break;
      } catch (e) {}
    }
    const target = list.find(t => t.url.includes('about') && t.type === 'page') || list[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
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

    await new Promise(r => setTimeout(r, 1500));

    const res = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const ch2 = document.querySelector('#chapter-2');
        const ch3 = document.querySelector('#chapter-3');
        const ch4 = document.querySelector('#chapter-4');
        return {
          ch2_exists: !!ch2,
          ch2_top: ch2 ? ch2.offsetTop : null,
          ch3_top: ch3 ? ch3.offsetTop : null,
          ch4_top: ch4 ? ch4.offsetTop : null,
          body_height: document.body.scrollHeight
        };
      })()`
    });
    console.log('DOM check:', res.result.value);

    // Now test scrolling
    await send('Runtime.evaluate', {
      expression: `window.scrollTo(0, 1500)`
    });
    await new Promise(r => setTimeout(r, 500));

    const scrollCheck = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `window.scrollY`
    });
    console.log('ScrollY after scrollTo(0, 1500):', scrollCheck.result.value);

    ws.close();
  } finally {
    edge.kill();
  }
}
test().catch(console.error);
