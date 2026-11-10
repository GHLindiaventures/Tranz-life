// Full-screen product sheet: the product's design board, and (when there is one) its full write-up beside it.
// Any element with data-design="<product id>" opens it.
import { DESIGNS } from '../features/products/product-images.js';
import { PRODUCTS } from '../data/products.js';
import { DETAILS, BRAND } from '../data/product-details.js';
import { state } from '../app/state.js';
import { $ } from '../utils/dom.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const pairs = (title, items) => items && items.length ? `<h4 class="lbi-h">${esc(title)}</h4><ul class="lbi-list">${items.map(([t, d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('')}</ul>` : '';

function sheet(d){
  return `<p class="lbi-eyebrow">${esc(d.eyebrow)}</p>
    <h3 class="lbi-title">${esc(d.title)}</h3>
    <p class="lbi-tagline">${esc(d.tagline)}</p>
    ${d.intro.map(p => `<p class="lbi-p">${esc(p)}</p>`).join('')}
    ${pairs(d.highlightsTitle, d.highlights)}
    ${pairs(d.listTitle, d.list)}
    ${d.closing ? `<h4 class="lbi-h">${esc(d.closingTitle)}</h4><p class="lbi-p">${esc(d.closing)}</p>` : ''}
    <p class="lbi-note">${esc(d.note)}</p>
    <p class="lbi-brand"><b>${esc(BRAND.name)}</b> · ${esc(BRAND.tagline)}<br>${esc(BRAND.line)}</p>`;
}

function initLightbox(){
  const box = document.createElement('div');
  box.className = 'lb'; box.id = 'lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Product details'); box.hidden = true;
  box.innerHTML = `<div class="lb-scrim" data-close></div><figure class="lb-fig" data-lenis-prevent><img alt=""><aside class="lb-info" data-lenis-prevent></aside><figcaption><span class="lb-name"></span><button class="lb-x" type="button" data-close>Close <i aria-hidden="true">×</i></button></figcaption></figure>`;
  document.body.appendChild(box);
  const img = $('img', box), name = $('.lb-name', box), info = $('.lb-info', box), fig = $('.lb-fig', box); let lastFocus = null;
  const open = id => {
    const p = PRODUCTS.find(x => x.id === id); if (!p || !DESIGNS[id]) return;
    img.src = DESIGNS[id]; img.alt = `${p.name} packaging design`; name.textContent = `${p.no} · ${p.name}`;
    const d = DETAILS[id];
    info.innerHTML = d ? sheet(d) : ''; info.hidden = !d; fig.classList.toggle('has-info', !!d); info.scrollTop = 0;
    lastFocus = document.activeElement; box.hidden = false; requestAnimationFrame(() => box.classList.add('open'));
    if (state.lenis) state.lenis.stop(); $('.lb-x', box).focus();
  };
  const close = () => { if (box.hidden) return; box.classList.remove('open'); setTimeout(() => { box.hidden = true; }, 350); if (state.lenis) state.lenis.start(); if (lastFocus) lastFocus.focus(); };
  document.addEventListener('click', e => { const t = e.target.closest('[data-design]'); if (t){ e.preventDefault(); open(t.dataset.design); } else if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

export { initLightbox };
