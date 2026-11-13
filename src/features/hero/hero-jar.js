// Hero product lineup: all five TranzLife products (cut out of the client's designs),
// arranged in a balanced composition standing on the hill.
import { PRODUCTS } from '../../data/products.js';
import { CUTS } from '../products/product-images.js';
import { $ } from '../../utils/dom.js';

const LINEUP = [
  { id: 'liver',   dx: -0.184, hRel: 0.90, yOff: 0.07, zi: 2, del: 0.26 },
  { id: 'inhaler', dx: -0.105, hRel: 0.56, yOff: 0.02, zi: 3, del: 0.14 },
  { id: 'gummies', dx:  0.000, hRel: 1.00, yOff: 0.00, zi: 5, del: 0.04 },
  { id: 'rollon',  dx:  0.115, hRel: 0.62, yOff: 0.02, zi: 3, del: 0.16 },
  { id: 'reviva',  dx:  0.200, hRel: 0.88, yOff: 0.08, zi: 2, del: 0.30 },
];

function initHeroJar(){
  const box = $('#heroProd'), stage = $('#home'); if (!box || !stage) return null;
  const prodMap = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

  box.innerHTML = LINEUP.map(item => {
    const p = prodMap[item.id] || PRODUCTS[0];
    return `<img class="st-cut st-cut-${item.id}" src="${CUTS[item.id]}" alt="${p.name}" decoding="async" style="--del:${item.del}s;z-index:${item.zi}">`;
  }).join('');

  const imgs = Array.from(box.querySelectorAll('img'));

  function layout(){
    const W = stage.clientWidth, H = stage.clientHeight;
    const mobile = W < 760 || (W < 980 && W < H);
    const sp = $('.stage-space');

    const cx = mobile ? W * 0.5 : W * 0.38;
    const cy = mobile && sp ? sp.offsetTop + sp.offsetHeight * 0.48 : H * 0.64;

    const baseH = mobile
      ? Math.min(sp ? sp.offsetHeight * 0.48 : H * 0.32, H * 0.32, W * 0.44)
      : Math.min(H * 0.48, 480);

    const scale = mobile ? Math.min(1.0, Math.max(0.72, W / 500)) : 1.0;
    const spread = (mobile ? W * 0.74 : W) * scale;

    LINEUP.forEach((item, idx) => {
      const img = imgs[idx];
      if (!img) return;
      const ar = (img.naturalWidth || 1) / (img.naturalHeight || 1);
      const h = baseH * item.hRel * (mobile ? 0.9 : 1.0);
      const w = h * ar;
      const x = cx + item.dx * spread;
      const y = cy + item.yOff * baseH;

      img.style.height = h.toFixed(1) + 'px';
      img.style.width = w.toFixed(1) + 'px';
      img.style.left = x.toFixed(1) + 'px';
      img.style.top = y.toFixed(1) + 'px';
    });
  }

  imgs.forEach(img => img.addEventListener('load', layout));
  window.addEventListener('resize', layout);
  layout();

  return {
    start(){
      box.classList.add('in');
    }
  };
}

export { initHeroJar };
