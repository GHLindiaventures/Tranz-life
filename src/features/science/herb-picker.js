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
      const cards = stage.querySelectorAll('.herb-callout-note');
      cards.forEach(c => { if (!c.classList.contains('active-focus')) c.style.transform = ''; });
      rafId = null;
      return;
    }
    currentRx += (targetRx - currentRx) * 0.12;
    currentRy += (targetRy - currentRy) * 0.12;
    img.style.transform = `perspective(900px) rotateX(${currentRx}deg) rotateY(${currentRy}deg) scale(1.02)`;
    const cards = stage.querySelectorAll('.herb-callout-note');
    cards.forEach((c, idx) => {
      if (!c.classList.contains('active-focus')) {
        const factor = (idx === 1) ? 0.35 : -0.35;
        c.style.transform = `translate3d(${currentRy * factor}px, ${-currentRx * factor}px, 0)`;
      }
    });
    rafId = requestAnimationFrame(updateTilt);
  }

  stage.addEventListener('pointermove', (e) => {
    isHovered = true;
    const r = stage.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    targetRy = nx * 16;
    targetRx = -ny * 16;
    if (!rafId) rafId = requestAnimationFrame(updateTilt);
  });

  stage.addEventListener('pointerleave', () => {
    isHovered = false;
    targetRx = 0;
    targetRy = 0;
    if (!rafId) rafId = requestAnimationFrame(updateTilt);
  });
}

function buildHerbs() {
  $('#herbs').innerHTML = HERBS.map((h, i) =>
    `<button data-i="${i}" class="${i === 0 ? 'on' : ''}">
      <span class="herb-chip-num">0${i + 1}</span>
      <span class="herb-chip-name">${h.n}</span>
    </button>`
  ).join('');
  $$('#herbs button').forEach(b => b.addEventListener('click', () => selectHerb(+b.dataset.i)));
  selectHerb(0, true);
  initHerbTilt();
}

function selectHerb(i, first) {
  const h = HERBS[i], found = (h.notes && h.notes.found) || (h.p == null ? 'R&D botanical library' : PRODUCTS[h.p].name);
  const col = h.color.toString(16).padStart(6, '0');

  // Active chip
  $$('#herbs button').forEach((b, k) => b.classList.toggle('on', k === i));

  // Specimen header
  const idxEl = $('#sciHerbIndex');
  if (idxEl) idxEl.textContent = `SPECIMEN 0${i + 1}`;
  const titleEl = $('#sciHerbTitle');
  if (titleEl) titleEl.textContent = h.n;
  const latinEl = $('#sciHerbLatin');
  if (latinEl) latinEl.textContent = h.latin;

  // Description
  const descEl = $('#sciHerbDesc');
  if (descEl) descEl.textContent = h.txt;

  // Handwritten styling notes in whitespace
  const factsEl = $('#sciHerbFacts');
  if (factsEl) {
    factsEl.innerHTML = `
      <div class="herb-callout-note note-part" role="button" tabindex="0" data-arrow="arrowPart" aria-label="Part used: ${h.part}">
        <div class="herb-fact-head">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 4 13C4 8 11 3 11 3s7 5 7 10a7 7 0 0 1-7 7Z"/><path d="M11 13a3 3 0 0 0 3-3"/></svg>
          <span class="herb-fact-label">Part used</span>
        </div>
        <span class="herb-fact-val">${h.part}</span>
      </div>
      <div class="herb-callout-note note-cmp" role="button" tabindex="0" data-arrow="arrowCmp" aria-label="Key compound: ${h.cmp}">
        <div class="herb-fact-head">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><path d="M14 10l3.5-2.5M6.5 16.5L10 14"/></svg>
          <span class="herb-fact-label">Key compound</span>
        </div>
        <span class="herb-fact-val">${h.cmp}</span>
      </div>
      <div class="herb-callout-note note-found" role="button" tabindex="0" data-arrow="arrowFound" aria-label="Standardized in: ${found}">
        <div class="herb-fact-head">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          <span class="herb-fact-label">Standardized in</span>
        </div>
        <span class="herb-fact-val">${found}</span>
      </div>`;

    // Interactive hover focus on each note and linked arrow highlight
    factsEl.querySelectorAll('.herb-callout-note').forEach(card => {
      const arrowId = card.dataset.arrow;
      const arrowEl = arrowId ? $(`#${arrowId}`) : null;
      card.addEventListener('pointerenter', () => {
        card.classList.add('active-focus');
        if (arrowEl) arrowEl.classList.add('highlighted');
        const halo = $('#sciHerbHalo');
        if (halo) halo.style.transform = 'scale(1.18)';
        const photo = $('#sciHerbPhoto');
        if (photo) photo.style.filter = 'drop-shadow(0 26px 48px rgba(28, 48, 20, .24)) scale(1.03)';
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('active-focus');
        if (arrowEl) arrowEl.classList.remove('highlighted');
        const halo = $('#sciHerbHalo');
        if (halo) halo.style.transform = '';
        const photo = $('#sciHerbPhoto');
        if (photo) photo.style.filter = '';
      });
    });
  }

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
    halo.style.background = `radial-gradient(circle, #${col}22 0%, transparent 68%)`;
  }

  if (!first && hasGsap) {
    gsap.from('#sciHerbTitle, #sciHerbLatin, #sciHerbIndex', { opacity: 0, y: -6, duration: .3, stagger: .04, ease: 'power2.out' });
    gsap.from('#sciHerbDesc, #sciHerbFacts > *', { opacity: 0, y: 10, duration: .35, stagger: .04, ease: 'power2.out' });
    gsap.fromTo('.sci-arrow-path', { strokeDasharray: 200, strokeDashoffset: 200 }, { strokeDashoffset: 0, duration: .85, ease: 'power2.out', stagger: .08 });
  }

  if (state.mol) state.mol.show(h);
}

export { buildHerbs };
