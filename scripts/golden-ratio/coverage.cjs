const open = require('./lib.cjs');
const pages = ['index.html', 'product-details.html?id=gummies', 'about.html', 'products.html', 'product-details.html?id=rollon', 'science.html', 'ingredients.html', 'quality.html', 'certifications.html', 'sustainability.html', 'contact.html', 'privacy.html', 'terms.html'];
(async () => {
  const b = await open({ port: 9575, headless: true, dir: require('os').tmpdir() + '/golden-cov-' + Date.now() });
  await b.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  let T = { text: 0, on: 0, head: 0, headOn: 0, sec: 0, secOn: 0 };
  console.log('page'.padEnd(30), 'text on scale   headings on scale   section spacing on scale');
  for (const u of pages){
    await b.send('Page.navigate', { url: 'http://localhost:5199/' + u }); await b.wait(5500);
    await b.ev(`(async () => { document.querySelectorAll('.nav-drop').forEach(d => d.classList.add('open')); const m = document.querySelector('.menu'); if (m) m.classList.add('open'); const fab = document.querySelector('.ch-fab'); if (fab) fab.click(); await new Promise(r => setTimeout(r, 1300)); return 1; })()`);
    const r = JSON.parse(await b.ev(`JSON.stringify((() => {
      const SCALE = [11.9, 13.4, 15.1, 17, 19.1, 21.6, 27.5, 44.5, 72, 116.5], GAP = [8, 13, 21, 34, 55, 89, 144];
      const on = (v, s) => s.some(x => Math.abs(v - x) <= 0.6);
      let text = 0, tOn = 0, head = 0, hOn = 0;
      document.querySelectorAll('body *:not(script):not(style):not(svg *)').forEach(el => {
        const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 2); if (!own) return;
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el); if (!r.width || cs.visibility === 'hidden' || cs.display === 'none') return;
        const f = parseFloat(cs.fontSize);
        if (/^H[1-3]$/.test(el.tagName) || el.closest('h1,h2,h3')){ head++; if (on(f, SCALE)) hOn++; } else { text++; if (on(f, SCALE)) tOn++; }
      });
      let sec = 0, sOn = 0;
      document.querySelectorAll('main section, body > section, footer, [class*="-sec"], .band').forEach(s => { const cs = getComputedStyle(s); [cs.paddingTop, cs.paddingBottom].forEach(p => { const v = parseFloat(p); if (v > 20){ sec++; if (on(v, GAP)) sOn++; } }); });
      return { text, tOn, head, hOn, sec, sOn };
    })())`));
    T.text += r.text; T.on += r.tOn; T.head += r.head; T.headOn += r.hOn; T.sec += r.sec; T.secOn += r.sOn;
    const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '-';
    console.log(u.padEnd(30), (pct(r.tOn, r.text) + ' of ' + r.text).padEnd(16), (pct(r.hOn, r.head) + ' of ' + r.head).padEnd(20), pct(r.sOn, r.sec) + ' of ' + r.sec);
  }
  const pct = (a, b) => Math.round(a / b * 100) + '%';
  console.log('ALL PAGES'.padEnd(30), (pct(T.on, T.text) + ' of ' + T.text).padEnd(16), (pct(T.headOn, T.head) + ' of ' + T.head).padEnd(20), pct(T.secOn, T.sec) + ' of ' + T.sec);
  b.close(); process.exit(0);
})();
