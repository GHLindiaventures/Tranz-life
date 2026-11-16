// Benefits: one product at a time, laid straight on the page (no card): its photo, name and "What goes in" table.
// Click the product (or an arrow, or press left/right) to see the next one: the current product rushes towards you
// and fades, while the next one zooms in from further off, photo first, then its words and rows one after another.
import { PRODUCTS } from '../../data/products.js';
import { BENEFITS } from '../../data/benefits.js';
import { thumbs } from '../../app/state.js';
import { gsap } from '../../lib/gsap.js';
import { $, $$ } from '../../utils/dom.js';
import { reduce } from '../../utils/media.js';

const pad = n => String(n).padStart(2, '0');

function initBenefits(){
  const stage = $('#benStage');
  if (!stage) return null;
  const N = PRODUCTS.length, now = $('#benNow'), steps = $$('[data-ben-step]');
  $('#benAll').textContent = pad(N);
  stage.innerHTML = PRODUCTS.map((p, i) => `<article class="bi" aria-label="${p.name}, ${i + 1} of ${N}">
      <figure class="bi-img"><img src="${thumbs[p.id]}" alt="${p.name}" width="960" height="960" loading="lazy" decoding="async" draggable="false">
        <figcaption class="bs-cap"><span>${p.no} / ${pad(N)}</span>${p.short}</figcaption></figure>
      <div class="bi-body">
        <p class="bi-tag">${p.tag} · ${p.size}</p>
        <h3 class="bi-name">${p.name}</h3>
        <div class="tbl" role="table" aria-label="What goes into ${p.name}">
          <div class="tr th" role="row"><span class="td" role="columnheader">What goes in</span><span class="td" role="columnheader"><span class="brandmark">TranzLife</span></span><span class="td" role="columnheader">Typical brand</span></div>
          <div class="tbl-rows" role="rowgroup">${(BENEFITS[p.id] || []).map(b =>
            `<div class="tr" role="row"><span class="td" role="cell">${b}</span><span class="td" role="cell"><span class="ok" aria-label="Yes">✓</span></span><span class="td" role="cell"><span class="no" aria-label="Not always">–</span></span></div>`).join('')}</div>
        </div>
        <p class="bi-next" aria-hidden="true">Next: ${PRODUCTS[(i + 1) % N].short} <i>→</i></p>
      </div>
    </article>`).join('');
  const items = $$('.bi', stage);
  // the parts of a product that zoom in one after another
  const parts = el => [$('.bi-img', el), $('.bi-tag', el), $('.bi-name', el), $('.th', el), ...$$('.tbl-rows .tr', el), $('.bi-next', el)];

  let sel = -1, tl = null;
  const mark = i => {
    now.textContent = pad(i + 1);
    items.forEach((el, j) => { el.classList.toggle('on', j === i); el.setAttribute('aria-hidden', j === i ? 'false' : 'true'); });
  };
  const show = (i, first) => {
    i = (i + N) % N;
    if (i === sel) return;
    const prev = items[sel], next = items[i];
    sel = i; mark(i);
    if (tl) tl.progress(1).kill();
    items.forEach(el => { if (el !== prev && el !== next) gsap.set(el, { autoAlpha:0 }); });
    if (first || reduce){
      if (prev) gsap.set(prev, { autoAlpha:0 });
      gsap.set(next, { autoAlpha:1, scale:1, filter:'none' }); gsap.set(parts(next), { clearProps:'all' });
      return;
    }
    tl = gsap.timeline({ onComplete:() => { tl = null; } });
    // the current product rushes past the camera and fades
    if (prev) tl.to(prev, { scale:1.14, autoAlpha:0, filter:'blur(10px)', duration:.5, ease:'power2.in' }, 0)
                .set(prev, { scale:1, filter:'none' });
    // the next one zooms in from further off, layer by layer
    tl.set(next, { autoAlpha:1, scale:1, filter:'none' }, .22)
      .fromTo(parts(next), { autoAlpha:0, scale:.7, filter:'blur(12px)' },
        { autoAlpha:1, scale:1, filter:'blur(0px)', duration:.75, ease:'power3.out', stagger:.045, clearProps:'filter,transform' }, .22);
  };

  stage.addEventListener('click', () => show(sel + 1));
  steps.forEach(b => b.addEventListener('click', () => show(sel + +b.dataset.benStep)));
  stage.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft'){ e.preventDefault(); show(sel + (e.key === 'ArrowRight' ? 1 : -1)); }
    else if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); show(sel + 1); }
  });

  show(0, true);
  return { go:show };
}

export { initBenefits };
