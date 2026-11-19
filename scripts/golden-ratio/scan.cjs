// Scan every page (with nav dropdowns, the full menu and the chat panel opened) for off-scale font sizes and section
// paddings; write a JSON of selector keys -> current values (per page) for the generator.
const open = require('./lib.cjs'); const fs = require('fs');
const pages = ['index.html', 'about.html', 'products.html', 'product-details.html?id=rollon', 'product-details.html?id=gummies', 'science.html', 'ingredients.html', 'quality.html', 'certifications.html', 'sustainability.html', 'contact.html', 'privacy.html', 'terms.html'];
(async () => {
  const b = await open({ port: 9576, headless: true, dir: require('os').tmpdir() + '/golden-scan-' + Date.now() });
  await b.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const fonts = {}, pads = {};
  for (const u of pages){
    await b.send('Page.navigate', { url: 'http://localhost:5199/' + u }); await b.wait(6000);
    await b.ev(`(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600){ scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } scrollTo(0, 0); return 1; })()`);
    for (const phase of ['page', 'chrome']){
      if (phase === 'chrome') await b.ev(`(async () => {
        document.querySelectorAll('.nav-drop').forEach(d => d.classList.add('open'));
        const m = document.querySelector('.menu'); if (m) m.classList.add('open');
        const fab = document.querySelector('.ch-fab'); if (fab && !document.querySelector('#chat.open')) fab.click();
        await new Promise(r => setTimeout(r, 1300)); return 1; })()`);
      const r = JSON.parse(await b.ev(`JSON.stringify((() => {
        const STATE = /^(is-|on$|in$|open$|active$|show|shown$|drawn$|done$|typed$|teasing$|min$|instant$|visible$|hidden$|selected$|current$|lt$|rv-|reveal)/;
        const cls = el => [...el.classList].filter(c => !STATE.test(c));
        const key = el => {
          const own = cls(el);
          if (own.length) return el.tagName.toLowerCase() + '.' + own.slice(0, 2).join('.');
          let a = el.parentElement, hop = 0; while (a && !cls(a).length && hop < 6){ a = a.parentElement; hop++; }
          return a ? '.' + cls(a).slice(0, 2).join('.') + ' ' + el.tagName.toLowerCase() : el.tagName.toLowerCase();
        };
        const f = {}, p = {};
        document.querySelectorAll('body *:not(script):not(style)').forEach(el => {
          if (el.closest('svg') && el.tagName !== 'svg') return;
          const cs = getComputedStyle(el), r = el.getBoundingClientRect();
          if (cs.display === 'none' || cs.visibility === 'hidden' || r.width < 2 || r.height < 2) return;
          const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
          if (own){ const k = key(el); (f[k] = f[k] || []).push(+parseFloat(cs.fontSize).toFixed(2)); }
          if (el.matches('section, footer, header.page, .band, main > div, [class*="-sec"], [class*="band"]')){
            const k = key(el); ['paddingTop', 'paddingBottom'].forEach(s => { const v = parseFloat(cs[s]); if (v > 20) (p[k] = p[k] || {})[s] = v; });
          }
        });
        return { f, p };
      })())`));
      for (const [k, v] of Object.entries(r.f)) (fonts[k] = fonts[k] || []).push(...v.map(x => [x, u]));
      for (const [k, v] of Object.entries(r.p)) pads[k] = Object.assign(pads[k] || {}, v);
    }
  }
  fs.writeFileSync(__dirname + '/scan.json', JSON.stringify({ fonts, pads }));
  console.log('selector keys with text:', Object.keys(fonts).length, '  section keys:', Object.keys(pads).length);
  b.close(); process.exit(0);
})();
