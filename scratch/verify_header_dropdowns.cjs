const { spawn } = require('child_process');
const fs = require('fs');

const OUT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/022a0390-51ef-428a-b718-88319017d6c9';

async function verifyDropdowns() {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--remote-debugging-port=9310',
    '--headless=new',
    '--enable-gpu',
    '--window-size=1440,900',
    'http://localhost:5173/index.html'
  ]);

  try {
    let list = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 400));
      try {
        const res = await fetch('http://127.0.0.1:9310/json/list');
        list = await res.json();
        if (list && list.length) break;
      } catch (e) {}
    }
    const target = list.find(t => t.url.includes('5173')) || list[0];
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

    console.log('--- TESTING HOME PAGE HEADER NAV ---');
    await new Promise(r => setTimeout(r, 2000));

    const navCheck = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `({
        pillsCount: document.querySelectorAll('.nav-pills > *').length,
        dropdownsCount: document.querySelectorAll('.nav-drop').length,
        dropdownLabels: Array.from(document.querySelectorAll('.nav-drop-btn')).map(b => b.textContent.trim()),
        productLinks: Array.from(document.querySelectorAll('.nav-drop:nth-of-type(2) .nav-drop-item strong')).map(s => s.textContent.trim())
      })`
    });
    console.log('Header Structure Verification:', navCheck.result.value);

    // Open Products Dropdown by clicking on its button
    console.log('\n--- OPENING PRODUCTS DROPDOWN ---');
    await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('.nav-drop-btn')[1].click()`
    });
    await new Promise(r => setTimeout(r, 500));

    const shotProducts = await send('Page.captureScreenshot', {
      clip: { x: 0, y: 0, width: 1440, height: 600, scale: 1 }
    });
    fs.writeFileSync(`${OUT_DIR}/header_dropdown_products.png`, Buffer.from(shotProducts.data, 'base64'));
    console.log('Saved header_dropdown_products.png');

    // Open Company Dropdown by clicking on its button
    console.log('\n--- OPENING COMPANY DROPDOWN ---');
    await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('.nav-drop-btn')[0].click()`
    });
    await new Promise(r => setTimeout(r, 500));

    const shotCompany = await send('Page.captureScreenshot', {
      clip: { x: 0, y: 0, width: 1440, height: 500, scale: 1 }
    });
    fs.writeFileSync(`${OUT_DIR}/header_dropdown_company.png`, Buffer.from(shotCompany.data, 'base64'));
    console.log('Saved header_dropdown_company.png');

    // Navigate to Products page and verify active highlight state
    console.log('\n--- NAVIGATING TO PRODUCTS PAGE ---');
    await send('Page.navigate', { url: 'http://localhost:5173/products.html' });
    await new Promise(r => setTimeout(r, 2000));

    const activeStateCheck = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `({
        title: document.title,
        activeDropBtn: document.querySelector('.nav-drop-btn.on')?.textContent?.trim(),
        activeDropItem: document.querySelector('.nav-drop-item.on strong')?.textContent?.trim()
      })`
    });
    console.log('Products Page Active Header State:', activeStateCheck.result.value);

    const shotActivePage = await send('Page.captureScreenshot', {
      clip: { x: 0, y: 0, width: 1440, height: 400, scale: 1 }
    });
    fs.writeFileSync(`${OUT_DIR}/header_active_products_page.png`, Buffer.from(shotActivePage.data, 'base64'));
    console.log('Saved header_active_products_page.png');

    // Navigate to About page and verify active highlight state
    console.log('\n--- NAVIGATING TO ABOUT PAGE ---');
    await send('Page.navigate', { url: 'http://localhost:5173/about.html' });
    await new Promise(r => setTimeout(r, 2000));

    const aboutStateCheck = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `({
        title: document.title,
        activeDropBtn: document.querySelector('.nav-drop-btn.on')?.textContent?.trim(),
        activeDropItem: document.querySelector('.nav-drop-item.on strong')?.textContent?.trim()
      })`
    });
    console.log('About Page Active Header State:', aboutStateCheck.result.value);

    console.log('\nAll Header Dropdown Verifications Completed Successfully!');
    ws.close();
  } finally {
    edge.kill();
  }
}

verifyDropdowns().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
