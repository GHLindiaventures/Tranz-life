// Benefits: one product at a time, laid straight on the page: its photo, name and "What goes in" table.
// Navigating between products triggers a cinematic flight: the next product descends gracefully from its
// lineup position on the line above into the benefit photo slot, echoing the hero jar trajectory.
import { PRODUCTS } from '../../data/products.js';
import { BENEFITS } from '../../data/benefits.js';
import { state, thumbs } from '../../app/state.js';
import { CUTS } from '../products/product-images.js';
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
      <figure class="bi-img"><img src="${CUTS[p.id] || thumbs[p.id]}" alt="${p.name}" width="960" height="960" loading="lazy" decoding="async" draggable="false">
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

  // flyer container: carries any product cut-out descending from the line above into the photo card
  const flyer = document.createElement('div');
  flyer.className = 'ben-flyer';
  flyer.setAttribute('aria-hidden', 'true');
  flyer.innerHTML = `<img class="bf-img" alt="" decoding="async"><i class="bf-shadow" aria-hidden="true"></i>`;
  stage.appendChild(flyer);
  const flyerImg = $('.bf-img', flyer);
  const flyerShadow = $('.bf-shadow', flyer);

  const items = $$('.bi', stage);
  const parts = el => [$('.bi-img', el), $('.bi-tag', el), $('.bi-name', el), $('.th', el), ...$$('.tbl-rows .tr', el), $('.bi-next', el)];

  let sel = -1, tl = null;
  const mark = i => {
    now.textContent = pad(i + 1);
    items.forEach((el, j) => {
      el.classList.toggle('on', j === i);
      el.setAttribute('aria-hidden', j === i ? 'false' : 'true');
    });
  };

  const show = (i, first) => {
    i = (i + N) % N;
    if (i === sel) return;
    const prevIdx = sel;
    const prev = prevIdx >= 0 ? items[prevIdx] : null;
    const next = items[i];
    sel = i;
    state.benefitIdx = i;
    mark(i);

    if (tl){
      tl.kill();
      tl = null;
    }
    if (flyer) gsap.set(flyer, { autoAlpha: 0, visibility: 'hidden' });
    document.documentElement.classList.remove('ben-flying');

    items.forEach((el, j) => {
      if (j !== i){
        gsap.set(el, { autoAlpha: 0 });
        const img = $('.bi-img img', el);
        if (img) gsap.set(img, { clearProps: 'transform' });
      }
    });

    if (first || reduce){
      gsap.set(next, { autoAlpha: 1, scale: 1, filter: 'none' });
      gsap.set(parts(next), { clearProps: 'all' });
      const nextImg = $('.bi-img img', next);
      if (nextImg) gsap.set(nextImg, { autoAlpha: 1, clearProps: 'transform' });
      return;
    }

    // Geometry: match the horizontal lineup positions from the Product Story directly above
    const W = stage.clientWidth || window.innerWidth;
    const mobile = W < 760;
    const gap = Math.min(W * (mobile ? 0.19 : 0.16), mobile ? 120 : 270);
    const col = mobile ? (i < 3 ? i - 1 : (i - 3) - 0.5) : i - 2;
    const xLineupScreen = W * 0.5 + col * (mobile ? W * 0.3 : gap);

    const stageRect = stage.getBoundingClientRect();
    const nextSlot = $('.bi-img', next);
    const slotRect = nextSlot ? nextSlot.getBoundingClientRect() : null;

    // Target center coordinates within stage
    const xTarget = slotRect ? (slotRect.left - stageRect.left + slotRect.width / 2) : (W * 0.25);
    const yTarget = slotRect ? (slotRect.top - stageRect.top + slotRect.height / 2) : 200;

    // Start position: directly aligned with that product's column on the line above
    const xStart = xLineupScreen - stageRect.left;
    const yStart = -Math.max(160, stageRect.top + 100);

    // Sizing
    const slotH = slotRect ? slotRect.height : 360;
    const prodH = Math.min(slotH * 0.86, 340);
    const prodW = Math.min(slotRect ? slotRect.width * 0.86 : 280, 280);

    // Natural banking tilt into the flight curve
    const dx = xStart - xTarget;
    const rotStart = Math.max(-14, Math.min(14, -(dx / W) * 24));

    document.documentElement.classList.add('ben-flying');

    const nextImg = $('.bi-img img', next);
    const prevImg = prev ? $('.bi-img img', prev) : null;
    const nextBodyParts = [$('.bi-tag', next), $('.bi-name', next), $('.th', next), ...$$('.tbl-rows .tr', next), $('.bi-next', next)];
    const nextCap = $('.bs-cap', next);

    tl = gsap.timeline({
      onComplete: () => {
        tl = null;
        if (flyer) gsap.set(flyer, { autoAlpha: 0, visibility: 'hidden' });
        if (nextImg) gsap.set(nextImg, { autoAlpha: 1 });
        document.documentElement.classList.remove('ben-flying');
        document.documentElement.classList.add('ben-docked');
      }
    });

    // 1. Outgoing product drops out smoothly
    if (prev){
      const prevBody = [$('.bi-tag', prev), $('.bi-name', prev), ...$$('.tbl-rows .tr', prev), $('.bi-next', prev)];
      tl.to(prevImg, { y: 65, scale: 0.94, autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, 0)
        .to(prevBody, { autoAlpha: 0, y: -8, duration: 0.22, stagger: 0.012, ease: 'power2.in' }, 0)
        .set(prev, { autoAlpha: 0 });
    }

    // 2. Prepare incoming slide
    tl.set(next, { autoAlpha: 1, scale: 1, filter: 'none' }, 0.08)
      .set(nextImg, { autoAlpha: 0 }, 0.08)
      .set(nextBodyParts, { autoAlpha: 0, y: 16 }, 0.08);
    if (nextCap) tl.set(nextCap, { autoAlpha: 0, y: 12 }, 0.08);

    // 3. Configure flyer image
    if (flyerImg){
      flyerImg.src = CUTS[PRODUCTS[i].id] || thumbs[PRODUCTS[i].id];
    }
    flyer.style.width = prodW.toFixed(0) + 'px';
    flyer.style.height = prodH.toFixed(0) + 'px';

    tl.set(flyer, {
      x: xStart,
      y: yStart,
      scale: 0.56,
      rotation: rotStart,
      autoAlpha: 0,
      visibility: 'visible'
    }, 0.06);

    // 4. Parabolic swoop: y decelerates into slot while x glides across from lineup column
    tl.to(flyer, { y: yTarget, duration: 0.82, ease: 'power3.out' }, 0.08)
      .to(flyer, { x: xTarget, duration: 0.82, ease: 'power2.out' }, 0.08)
      .to(flyer, { scale: 1, duration: 0.82, ease: 'power2.out' }, 0.08)
      .to(flyer, { rotation: 0, duration: 0.82, ease: 'power2.out' }, 0.08)
      .to(flyer, { autoAlpha: 1, duration: 0.2, ease: 'power1.out' }, 0.08);

    if (flyerShadow){
      tl.fromTo(flyerShadow, { opacity: 0 }, { opacity: 0.65, duration: 0.45, ease: 'power2.out' }, 0.38);
    }

    // 5. Docking settle
    tl.to(flyer, { y: yTarget - 4, scale: 1.02, duration: 0.12, ease: 'power1.out', yoyo: true, repeat: 1 }, 0.82);

    // 6. Badge and table rows stagger into place as the product arrives
    if (nextCap){
      tl.to(nextCap, { autoAlpha: 1, y: 0, duration: 0.36, ease: 'power2.out' }, 0.42);
    }
    tl.to(nextBodyParts, {
      autoAlpha: 1,
      y: 0,
      duration: 0.42,
      stagger: 0.035,
      ease: 'power3.out',
      clearProps: 'transform'
    }, 0.42);
  };

  stage.addEventListener('click', () => show(sel + 1));
  steps.forEach(b => b.addEventListener('click', () => show(sel + +b.dataset.benStep)));
  stage.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft'){ e.preventDefault(); show(sel + (e.key === 'ArrowRight' ? 1 : -1)); }
    else if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); show(sel + 1); }
  });

  show(0, true);
  return { go: show };
}

export { initBenefits };