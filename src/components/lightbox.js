// Full-screen viewer for the product design boards. Any element with data-design="<product id>" opens it.
import { DESIGNS } from '../features/products/product-images.js';
import { PRODUCTS } from '../data/products.js';
import { state } from '../app/state.js';
import { $ } from '../utils/dom.js';
import { createZoomPan } from '../utils/zoom-pan.js';

function initLightbox(){
  const box = document.createElement('div');
  box.className = 'lb'; box.id = 'lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Product design'); box.hidden = true;
  box.innerHTML = `<div class="lb-scrim" data-close></div><figure class="lb-fig"><div class="lb-stage"><img alt=""><span class="lb-hint" aria-hidden="true">Drag to move</span></div><figcaption><span class="lb-name"></span><div class="lb-actions"><div class="lb-zoom" role="group" aria-label="Zoom controls"><button class="lb-zbtn" type="button" data-zoom="out" aria-label="Zoom out" title="Zoom out (-)">−</button><button class="lb-zlvl" type="button" data-zoom="reset" aria-label="Reset zoom" title="Reset zoom (0)">100%</button><button class="lb-zbtn" type="button" data-zoom="in" aria-label="Zoom in" title="Zoom in (+)">+</button></div><button class="lb-x" type="button" data-close>Close <i aria-hidden="true">×</i></button></div></figcaption></figure>`;
  document.body.appendChild(box);
  const stage = $('.lb-stage', box), img = $('img', box), name = $('.lb-name', box), controls = $('.lb-zoom', box);
  const zoomer = createZoomPan({ stage, img, controls, wheel: true });
  let lastFocus = null;
  const open = id => {
    const p = PRODUCTS.find(x => x.id === id); if (!p || !DESIGNS[id]) return;
    zoomer.reset();
    img.src = DESIGNS[id]; img.alt = `${p.name} packaging design`; name.textContent = `${p.no} · ${p.name}`;
    lastFocus = document.activeElement; box.hidden = false; requestAnimationFrame(() => box.classList.add('open'));
    if (state.lenis) state.lenis.stop(); $('.lb-x', box).focus();
  };
  const close = () => { if (box.hidden) return; box.classList.remove('open'); setTimeout(() => { box.hidden = true; zoomer.reset(); }, 350); if (state.lenis) state.lenis.start(); if (lastFocus) lastFocus.focus(); };
  document.addEventListener('click', e => { const t = e.target.closest('[data-design]'); if (t){ e.preventDefault(); open(t.dataset.design); } else if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', e => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomer.zoomIn(); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomer.zoomOut(); }
    else if (e.key === '0') { e.preventDefault(); zoomer.reset(); }
    else if (e.key === 'ArrowLeft') zoomer.panBy(60, 0);
    else if (e.key === 'ArrowRight') zoomer.panBy(-60, 0);
    else if (e.key === 'ArrowUp') zoomer.panBy(0, 60);
    else if (e.key === 'ArrowDown') zoomer.panBy(0, -60);
  });
}

export { initLightbox };
