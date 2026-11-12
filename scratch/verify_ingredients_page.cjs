const { spawn } = require('child_process');
const fs = require('fs');

const OUT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/022a0390-51ef-428a-b718-88319017d6c9';

async function verify() {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--remote-debugging-port=9388',
    '--headless=new',
    '--window-size=1440,1100',
    'http://localhost:5173/ingredients.html'
  ]);

  try {
    let list = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 300));
      try {
        const res = await fetch('http://127.0.0.1:9388/json/list');
        list = await res.json();
        if (list && list.some(t => t.url.includes('ingredients.html') && t.type === 'page')) break;
      } catch (e) {}
    }
    const target = list.find(t => t.url.includes('ingredients.html') && t.type === 'page');
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

    await new Promise(r => setTimeout(r, 1500));

    // Evaluate cards rendered
    const cardData = await send('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.ing-card'));
        return {
          totalCards: cards.length,
          items: cards.map(c => ({
            name: c.querySelector('h3')?.textContent,
            latin: c.querySelector('.ing-card-latin')?.textContent,
            compound: c.querySelector('.ing-card-badge')?.textContent,
            product: c.querySelector('.ing-prod-pill')?.textContent.trim()
          }))
        };
      })()`,
      returnByValue: true
    });

    console.log('Ingredients Cards Rendered:', JSON.stringify(cardData.result.value, null, 2));

    // Scroll to ingredients directory
    await send('Runtime.evaluate', {
      expression: `window.scrollTo(0, document.getElementById('directory').getBoundingClientRect().top + window.scrollY - 80)`
    });
    await new Promise(r => setTimeout(r, 600));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${OUT_DIR}/ingredients_grid_verified.png`, Buffer.from(shot.data, 'base64'));
    console.log('Captured ingredients_grid_verified.png');

    console.log('Console Logs count:', consoleLogs.length);
    console.log(JSON.stringify(consoleLogs, null, 2));

    ws.close();
  } finally {
    edge.kill();
  }
}

verify().catch(console.error);

