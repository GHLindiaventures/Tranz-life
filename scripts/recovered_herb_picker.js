// Botanical chips and details in the Science section.
import { state } from '../../app/state.js';
import { HERBS } from '../../data/herbs.js';
import { PRODUCTS } from '../../data/products.js';
import { gsap, hasGsap } from '../../lib/gsap.js';
import { $, $$ } from '../../utils/dom.js';

let tiltInitialized = false;

function initHerbTilt() {
  if (tiltInitialized) return;
  const stage = $('#sciStage');
  const img = $('#sciHerbPhoto');
  if (!stage || !img) return;
  tiltInitialized = true;

  let rafId = null;
  let targetRx = 0, targetRy = 0;
  let currentRx = 0, currentRy = 0;
  let isHovered = false;

  function updateTilt() {
    if (!isHovered && Math.abs(currentRx) < 0.05 && Math.abs(currentRy) < 0.05) {
      img.style.transform = '';
      rafId = null;
      return;
    }
    currentRx += (targetRx - currentRx) * 0.12;
    currentRy += (targetRy - currentRy) * 0.12;
    img.style.transform = `perspective(900px) rotateX(${currentRx}deg) rotateY(${currentRy}deg) scale(1.02)`;
    rafId = requestAnimationFrame(updateTilt);
  }

  stage.addEventListener('pointermove', (e) => {
    isHovered = true;
    const r = stage.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    targetRy = nx * 18;
    targetRx = -ny * 18;
    if (!rafId) rafId = requestAnimationFrame(updateTilt);
  });

  stage.addEventListener('pointerleave', () => {
    isHovered = false;
    targetRx = 0;
    targetRy = 0;
    if (!rafId) rafId = requestAnimationFrame(updateTilt);
  });
}

function buildHerbs(){
  $('#herbs').innerHTML = HERBS.map((h, i) =>
    `<button data-i="${i}" class="${i === 0 ? 'on' : ''}">
      <img class="herb-chip-thumb" src="${h.img}" alt="" width="22" height="22" loading="lazy">
      <span class="herb-chip-num">0${i + 1}</span>
      <span class="herb-chip-name">${h.n}</span>
    </button>`
  ).join('');
  $$('#herbs button').forEach(b => b.addEventListener('click', () => selectHerb(+b.dataset.i)));
  selectHerb(0, true);
  initHerbTilt();
}

function selectHerb(i, first){
  const h = HERBS[i], found = h.p == null ? 'R&D botanical library' : PRODUCTS[h.p].name;

  // Active chip
  $$('#herbs button').forEach((b, k) => b.classList.toggle('on', k === i));

  // Caption
  const nameEl = $('#molName');
  if (nameEl) nameEl.textContent = h.n;
  const compEl = $('#molCompound');
  if (compEl) compEl.textContent = `${h.cmp} (${h.part})`;

  // Ingredient photo
  const photoImg = $('#sciHerbPhoto');
  if (photoImg && h.img) {
    if (!first && hasGsap) {
      gsap.to(photoImg, {
        opacity: 0, scale: .92, y: 10, duration: .18, ease: 'power2.in',
        onComplete() {
          photoImg.src = h.img;
          photoImg.alt = h.n;
          photoImg.onload = () => {
            gsap.fromTo(photoImg,
              { opacity: 0, scale: .92, y: 10 },
              { opacity: 1, scale: 1, y: 0, duration: .4, ease: 'power3.out' }
            );
          };
        }
      });
    } else {
      photoImg.src = h.img;
      photoImg.alt = h.n;
    }
  }

  // Halo colour
  const halo = $('#sciHerbHalo');
  if (halo) {
    const c = '#' + h.color.toString(16).padStart(6, '0');
    halo.style.background = `radial-gradient(circle, ${c}22 0%, transparent 68%)`;
  }

  // Info panel with luxury micro-icons
  const col = h.color.toString(16).padStart(6, '0');
  $('#herbInfo').innerHTML = `
    <div class="herb-header">
      <h3>${h.n}</h3>
      <span class="herb-latin-badge">${h.latin}</span>
    </div>
    <p class="herb-desc">${h.txt}</p>
    <div class="herb-facts">
      <div class="herb-fact-card">
        <span class="herb-fact-accent" style="background-color:#${col}"></span>
        <div class="herb-fact-head">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 4 13C4 8 11 3 11 3s7 5 7 10a7 7 0 0 1-7 7Z"/><path d="M11 13a3 3 0 0 0 3-3"/></svg>
          <small>Part used</small>
        </div>
        <b>${h.part}</b>
      </div>
      <div class="herb-fact-card">
        <span class="herb-fact-accent" style="background-color:#${col}"></span>
        <div class="herb-fact-head">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><path d="M14 10l3.5-2.5M6.5 16.5L10 14"/></svg>
          <small>Key compound</small>
        </div>
        <b>${h.cmp}</b>
      </div>
      <div class="herb-fact-card">
        <span class="herb-fact-accent" style="background-color:#${col}"></span>
        <div class="herb-fact-head">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          <small>Standardized in</small>
        </div>
        <b>${found}</b>
      </div>
    </div>`;

  if (!first && hasGsap) gsap.from('#herbInfo > *', { y: 14, opacity: 0, stagger: .06, duration: .4, ease: 'power3.out' });
  if (state.mol) state.mol.show(h);
}

export { buildHerbs };
