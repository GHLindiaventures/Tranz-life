/**
 * TranzLife Biosciences – About Page Animation System
 * Phase 1-6: Cinematic scroll-driven storytelling
 * Uses: GSAP (free tier) + ScrollTrigger + Lenis
 * Fully degrades if WebGL / GSAP unavailable
 * Respects prefers-reduced-motion
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────
   MOTION PREFERENCE
───────────────────────────────────────────── */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function getMotionEnabled() {
  try {
    const saved = localStorage.getItem('tl-motion');
    if (saved !== null) return saved === '1';
  } catch (_) {}
  return !prefersReduced;
}

let motionEnabled = getMotionEnabled();

/* ─────────────────────────────────────────────
   PAUSE BUTTON
───────────────────────────────────────────── */
function buildPauseBtn() {
  const btn = document.createElement('button');
  btn.id = 'tlPauseMotion';
  btn.className = 'tl-pause-btn';
  btn.setAttribute('aria-label', motionEnabled ? 'Pause animations' : 'Enable animations');
  btn.setAttribute('aria-pressed', String(!motionEnabled));
  btn.innerHTML = motionEnabled
    ? `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
  btn.title = motionEnabled ? 'Pause animations' : 'Resume animations';

  btn.addEventListener('click', () => {
    motionEnabled = !motionEnabled;
    try { localStorage.setItem('tl-motion', motionEnabled ? '1' : '0'); } catch (_) {}
    btn.setAttribute('aria-pressed', String(!motionEnabled));
    btn.setAttribute('aria-label', motionEnabled ? 'Pause animations' : 'Enable animations');
    btn.innerHTML = motionEnabled
      ? `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
    btn.title = motionEnabled ? 'Pause animations' : 'Resume animations';

    if (motionEnabled) {
      gsap.globalTimeline.resume();
      ScrollTrigger.refresh();
    } else {
      gsap.globalTimeline.pause();
    }
  });

  document.body.appendChild(btn);
}

/* ─────────────────────────────────────────────
   LENIS SMOOTH SCROLL
───────────────────────────────────────────── */
function initLenis() {
  if (prefersReduced || !motionEnabled) return null;

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    touchMultiplier: 1.5,
    infinite: false,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

/* ─────────────────────────────────────────────
   PROGRESS RAIL  (slim right-side chapter dots)
───────────────────────────────────────────── */
function buildProgressRail() {
  const sections = ['hero','chapter-1','chapter-2','chapter-3','chapter-4','chapter-5','chapter-6','cta'];
  const labels   = ['Story','Botanicals','Science','Validation','Research','Vision','Future','Journey'];

  const rail = document.createElement('nav');
  rail.className = 'tl-rail';
  rail.setAttribute('aria-label', 'Page sections');

  sections.forEach((id, i) => {
    const dot = document.createElement('a');
    dot.href = `#${id}`;
    dot.className = 'tl-rail-dot';
    dot.setAttribute('aria-label', labels[i]);
    dot.dataset.section = id;

    const tip = document.createElement('span');
    tip.className = 'tl-rail-tip';
    tip.textContent = labels[i];
    dot.appendChild(tip);

    rail.appendChild(dot);
  });

  document.body.appendChild(rail);

  // Activate dot on scroll
  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => setActiveDot(id),
      onEnterBack: () => setActiveDot(id),
    });
  });
}

function setActiveDot(id) {
  document.querySelectorAll('.tl-rail-dot').forEach(d => {
    d.classList.toggle('active', d.dataset.section === id);
  });
}

/* ─────────────────────────────────────────────
   HERO PHASE 2 – Title word-by-word reveal +
   badge float-in + scroll-driven parallax bg
───────────────────────────────────────────── */
function animateHero() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  if (!motionEnabled) return;

  // Split title into word spans
  const title = hero.querySelector('.about-hero-title');
  if (title) {
    const html = title.innerHTML;
    // Wrap each word (preserve <em>)
    title.innerHTML = html.replace(/(<em>.*?<\/em>|[^\s<]+)/g, (m) => {
      return `<span class="tl-word" style="display:inline-block;overflow:hidden"><span class="tl-word-in" style="display:inline-block;transform:translateY(110%)">${m}</span></span>`;
    });

    gsap.to(title.querySelectorAll('.tl-word-in'), {
      y: '0%',
      duration: 1,
      ease: 'expo.out',
      stagger: 0.08,
      delay: 0.3,
    });
  }

  // Subtitle fade-up
  const sub = hero.querySelector('.about-hero-sub');
  if (sub) {
    gsap.fromTo(sub, { opacity: 0, y: 30 }, {
      opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', delay: 0.9,
    });
  }

  // Badges stagger float-in
  const badges = hero.querySelectorAll('.about-tag-badge');
  if (badges.length) {
    gsap.fromTo(badges, { opacity: 0, y: 20, scale: 0.9 }, {
      opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.4)',
      stagger: 0.12, delay: 1.2,
    });
  }

  // Scroll: hero content fades + scales slightly as you scroll away
  gsap.to('.about-hero-in', {
    y: -60,
    opacity: 0.6,
    ease: 'none',
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: 1.2,
    },
  });

  // Glow orbs parallax
  gsap.to('.about-hero-glow-1', {
    y: -80,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 2 },
  });
  gsap.to('.about-hero-glow-2', {
    y: -50,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1.5 },
  });
}

/* ─────────────────────────────────────────────
   GENERIC SECTION REVEAL  (all chapters)
   Each section gets a colour-grade + heading
   reveal as it enters viewport
───────────────────────────────────────────── */
function animateSectionEntries() {
  if (!motionEnabled) return;

  // Chapter headings slide in
  document.querySelectorAll('.h2, .h3').forEach(el => {
    // Skip hero title (handled separately)
    if (el.closest('#hero')) return;
    gsap.fromTo(el, { opacity: 0, y: 50 }, {
      opacity: 1, y: 0, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
    });
  });

  // Body text paragraphs
  document.querySelectorAll('.about-body-text, .about-lead-text').forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 25 }, {
      opacity: 1, y: 0, duration: 0.9, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
    });
  });

  // Story chapter tags
  document.querySelectorAll('.story-chapter-tag').forEach(el => {
    gsap.fromTo(el, { opacity: 0, x: -20 }, {
      opacity: 1, x: 0, duration: 0.7, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
    });
  });
}

/* ─────────────────────────────────────────────
   CHAPTER 01 – BOTANICAL HERITAGE
   Phase 3A: Parallax image + tag-pill seeds
───────────────────────────────────────────── */
function animateChapter1() {
  if (!motionEnabled) return;
  const ch = document.getElementById('chapter-1');
  if (!ch) return;

  // Image parallax (floats upward as you scroll through)
  const img = ch.querySelector('.chapter-img-wrap, .chapter-visual, img');
  if (img) {
    gsap.fromTo(img, { y: 60 }, {
      y: -60, ease: 'none',
      scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: 1.5 },
    });
  }

  // Tag pills float in like seeds
  const pills = ch.querySelectorAll('.chapter-tag, .tag-pill, .about-tag-badge');
  if (pills.length) {
    gsap.fromTo(pills, { opacity: 0, y: 20, scale: 0.85 }, {
      opacity: 1, y: 0, scale: 1,
      duration: 0.65, ease: 'back.out(1.6)',
      stagger: { each: 0.1, from: 'start' },
      scrollTrigger: { trigger: pills[0], start: 'top 90%', toggleActions: 'play none none none' },
    });
  }

  // Cards fade-in with slight tilt
  const cards = ch.querySelectorAll('.chapter-card, .info-card');
  cards.forEach((card, i) => {
    gsap.fromTo(card, { opacity: 0, y: 40, rotateX: 8 }, {
      opacity: 1, y: 0, rotateX: 0,
      duration: 0.9, ease: 'expo.out', delay: i * 0.08,
      scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' },
    });
  });
}

/* ─────────────────────────────────────────────
   CHAPTER 02 – PRECISION SCIENCE
   Phase 3B: Stats count-up + What We Do cards
───────────────────────────────────────────── */
function animateChapter2() {
  if (!motionEnabled) return;
  const ch = document.getElementById('chapter-2');
  if (!ch) return;

  // Count-up for stat numbers (.num inside .about-metric-card)
  document.querySelectorAll('.about-metric-card .num').forEach(el => {
    const target = parseInt(el.textContent.trim(), 10);
    if (isNaN(target)) return;
    const original = el.textContent.trim();
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 1.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 90%',
        toggleActions: 'play none none none',
        onEnter: () => { el.textContent = '0'; }
      },
      onUpdate() { el.textContent = Math.round(obj.val); },
      onComplete() { el.textContent = original; },
    });
  });

  // "What We Do" cards cascade
  const doCards = ch.querySelectorAll('.do-card');
  if (doCards.length) {
    gsap.fromTo(doCards, { opacity: 0, y: 50, scale: 0.95 }, {
      opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'expo.out',
      stagger: 0.12,
      scrollTrigger: { trigger: doCards[0].parentElement, start: 'top 82%', toggleActions: 'play none none none' },
    });
  }
}

/* ─────────────────────────────────────────────
   CHAPTER 03 – INSTITUTIONAL VALIDATION
   Phase 4A: NRDC card stamp + milestones
───────────────────────────────────────────── */
function animateChapter3() {
  if (!motionEnabled) return;
  const ch = document.getElementById('chapter-3');
  if (!ch) return;

  // NRDC card dramatic entrance
  const card = ch.querySelector('.nrdc-card, .collab-card, .chapter-card');
  if (card) {
    gsap.fromTo(card, { opacity: 0, scale: 0.9, y: 60 }, {
      opacity: 1, scale: 1, y: 0, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: card, start: 'top 82%', toggleActions: 'play none none none' },
    });
  }

  // Milestone items: stagger left-to-right like tree rings
  const milestoneItems = ch.querySelectorAll('.milestone-item');
  if (milestoneItems.length) {
    gsap.fromTo(milestoneItems, { opacity: 0, x: -40 }, {
      opacity: 1, x: 0, duration: 0.75, ease: 'expo.out',
      stagger: 0.14,
      scrollTrigger: { trigger: milestoneItems[0].parentElement || ch, start: 'top 80%', toggleActions: 'play none none none' },
    });
  }

  // Photo parallax
  const photo = ch.querySelector('.chapter-photo, .nrdc-photo, .chapter-img-wrap');
  if (photo) {
    gsap.fromTo(photo, { y: 40 }, {
      y: -40, ease: 'none',
      scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: 1.5 },
    });
  }
}

/* ─────────────────────────────────────────────
   CHAPTER 04 – FRONTIER RESEARCH
   Phase 4B: Soft cell-pulse cards
───────────────────────────────────────────── */
function animateChapter4() {
  if (!motionEnabled) return;
  const ch = document.getElementById('chapter-4');
  if (!ch) return;

  const cards = ch.querySelectorAll('.research-card, .why-card, .future-card, .chapter-card');
  cards.forEach((card, i) => {
    // Entrance
    gsap.fromTo(card, { opacity: 0, y: 45 }, {
      opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', delay: i * 0.1,
      scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' },
    });

    // Subtle ambient pulse on hover using CSS class toggle
    card.addEventListener('mouseenter', () => {
      gsap.to(card, { scale: 1.025, duration: 0.35, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { scale: 1, duration: 0.4, ease: 'expo.out' });
    });
  });

  // Disclaimer note fade-in
  const note = ch.querySelector('.research-note, .research-disclaimer');
  if (note) {
    gsap.fromTo(note, { opacity: 0 }, {
      opacity: 1, duration: 1,
      scrollTrigger: { trigger: note, start: 'top 92%', toggleActions: 'play none none none' },
    });
  }
}

/* ─────────────────────────────────────────────
   CHAPTER 05 – VISION, MISSION & VALUES
   Phase 5A: Value cards magnetic stagger
───────────────────────────────────────────── */
function animateChapter5() {
  if (!motionEnabled) return;
  const ch = document.getElementById('chapter-5');
  if (!ch) return;

  // Vision/Mission cards flip-in
  const vmCards = ch.querySelectorAll('.vis-mis-card, .vm-card');
  vmCards.forEach((card, i) => {
    gsap.fromTo(card, { opacity: 0, rotateY: -15, y: 40 }, {
      opacity: 1, rotateY: 0, y: 0,
      duration: 1, ease: 'expo.out', delay: i * 0.15,
      scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none none' },
    });
  });

  // Value cards cascade with alternating directions
  const valCards = ch.querySelectorAll('.value-card');
  valCards.forEach((card, i) => {
    const fromX = i % 2 === 0 ? -30 : 30;
    gsap.fromTo(card, { opacity: 0, x: fromX, y: 20 }, {
      opacity: 1, x: 0, y: 0,
      duration: 0.8, ease: 'expo.out', delay: i * 0.08,
      scrollTrigger: { trigger: card.closest('.values-grid') || card, start: 'top 85%', toggleActions: 'play none none none' },
    });
    // Hover lift
    card.addEventListener('mouseenter', () => gsap.to(card, { y: -6, duration: 0.3, ease: 'power2.out' }));
    card.addEventListener('mouseleave', () => gsap.to(card, { y: 0, duration: 0.4, ease: 'expo.out' }));
  });

  // Strength cards fan-in
  const strengthCards = ch.querySelectorAll('.strength-card');
  if (strengthCards.length) {
    gsap.fromTo(strengthCards, { opacity: 0, scale: 0.88, y: 30 }, {
      opacity: 1, scale: 1, y: 0, duration: 0.75, ease: 'back.out(1.4)',
      stagger: 0.1,
      scrollTrigger: { trigger: strengthCards[0].parentElement || ch, start: 'top 82%', toggleActions: 'play none none none' },
    });
  }
}

/* ─────────────────────────────────────────────
   CHAPTER 06 – THE FUTURE OF LIFE SCIENCES
   Phase 5B: Dark scene, frontier cards laser-reveal
───────────────────────────────────────────── */
function animateChapter6() {
  if (!motionEnabled) return;
  const ch = document.getElementById('chapter-6');
  if (!ch) return;

  // Section heading split
  const heading = ch.querySelector('h2, .h2, .chapter-heading');
  if (heading) {
    gsap.fromTo(heading, { opacity: 0, y: 60, letterSpacing: '0.08em' }, {
      opacity: 1, y: 0, letterSpacing: '-0.02em', duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: heading, start: 'top 82%', toggleActions: 'play none none none' },
    });
  }

  // Lead line
  const lead = ch.querySelector('.chapter-lead, p.lead');
  if (lead) {
    gsap.fromTo(lead, { opacity: 0, y: 25 }, {
      opacity: 1, y: 0, duration: 1, ease: 'expo.out', delay: 0.2,
      scrollTrigger: { trigger: lead, start: 'top 85%', toggleActions: 'play none none none' },
    });
  }

  // Frontier cards: stagger + subtle glow pulse
  const cards = ch.querySelectorAll('.future-card, .frontier-card, .chapter-card');
  if (cards.length) {
    gsap.fromTo(cards, {
      opacity: 0,
      y: 60,
      scale: 0.92,
    }, {
      opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'expo.out',
      stagger: { each: 0.12, from: 'start' },
      scrollTrigger: { trigger: cards[0].parentElement || ch, start: 'top 80%', toggleActions: 'play none none none' },
    });

    // Add glow hover
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => gsap.to(card, { y: -8, scale: 1.03, duration: 0.3, ease: 'power2.out' }));
      card.addEventListener('mouseleave', () => gsap.to(card, { y: 0, scale: 1, duration: 0.4, ease: 'expo.out' }));
    });
  }

  // Closing line letter-by-letter decode (CSS animation)
  const closing = ch.querySelector('.chapter-closing, .future-closing');
  if (closing) {
    gsap.fromTo(closing, { opacity: 0, letterSpacing: '0.3em' }, {
      opacity: 1, letterSpacing: '0.08em', duration: 1.5, ease: 'expo.out',
      scrollTrigger: { trigger: closing, start: 'top 90%', toggleActions: 'play none none none' },
    });
  }
}

/* ─────────────────────────────────────────────
   CTA SECTION – Phase 6
   "Plant Your Seed" button interaction
───────────────────────────────────────────── */
function animateCTA() {
  if (!motionEnabled) return;
  const cta = document.getElementById('cta');
  if (!cta) return;

  const heading = cta.querySelector('h2, .h2, .cta-title');
  const btns = cta.querySelectorAll('.btn, a[class*="btn"], .pill');

  if (heading) {
    gsap.fromTo(heading, { opacity: 0, y: 50, scale: 0.95 }, {
      opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: cta, start: 'top 75%', toggleActions: 'play none none none' },
    });
  }

  if (btns.length) {
    gsap.fromTo(btns, { opacity: 0, y: 25, scale: 0.9 }, {
      opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.5)',
      stagger: 0.1, delay: 0.4,
      scrollTrigger: { trigger: cta, start: 'top 75%', toggleActions: 'play none none none' },
    });

    btns.forEach(btn => {
      btn.addEventListener('mouseenter', () => gsap.to(btn, { scale: 1.06, duration: 0.25, ease: 'power2.out' }));
      btn.addEventListener('mouseleave', () => gsap.to(btn, { scale: 1, duration: 0.3, ease: 'expo.out' }));
    });
  }
}

/* ─────────────────────────────────────────────
   COLOUR GRADE  – scroll-driven CSS var updates
   Forest green → lab teal → night blue
───────────────────────────────────────────── */
function initColorGrade() {
  if (!motionEnabled) return;
  // Animate the hero background hue gradually toward teal as user scrolls into ch05/06
  const ch5 = document.getElementById('chapter-5');
  const ch6 = document.getElementById('chapter-6');

  if (ch5) {
    ScrollTrigger.create({
      trigger: ch5,
      start: 'top 60%',
      end: 'bottom top',
      onUpdate(self) {
        const p = self.progress;
        // Interpolate body background tint
        document.documentElement.style.setProperty('--scroll-tint', p.toFixed(3));
      },
    });
  }

  if (ch6) {
    ScrollTrigger.create({
      trigger: ch6,
      start: 'top 60%',
      end: 'bottom 20%',
      onUpdate(self) {
        document.documentElement.style.setProperty('--ch6-progress', self.progress.toFixed(3));
      },
    });
  }
}

/* ─────────────────────────────────────────────
   EYEBROW LINE DRAW  (enhanced)
───────────────────────────────────────────── */
function animateEyebrows() {
  if (!motionEnabled) return;
  document.querySelectorAll('.eyebrow:not(.drawn)').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      onEnter() {
        el.classList.add('drawn');
        gsap.fromTo(el, { opacity: 0, x: -15 }, {
          opacity: 1, x: 0, duration: 0.6, ease: 'expo.out',
        });
      },
      once: true,
    });
  });
}

/* ─────────────────────────────────────────────
   CANVAS PARTICLE LAYER (decorative)
   Lightweight floating pollen/spore dots
   Three.js NOT required — pure Canvas 2D
───────────────────────────────────────────── */
function initParticleCanvas() {
  if (!motionEnabled || prefersReduced) return;

  // Only attach to hero area
  const hero = document.getElementById('hero');
  if (!hero) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'tl-particle-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;opacity:0.55;';
  hero.style.position = 'relative';
  hero.insertBefore(canvas, hero.firstChild);

  const ctx = canvas.getContext('2d');
  const particles = [];
  const COUNT = window.innerWidth < 768 ? 25 : 50;

  function resize() {
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Colour palette: greens and golds
  const palette = ['rgba(141,184,107,', 'rgba(111,158,76,', 'rgba(227,162,26,', 'rgba(140,184,106,'];

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3.5 + 1.2,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.18 - 0.12,
      alpha: Math.random() * 0.5 + 0.2,
      col: palette[Math.floor(Math.random() * palette.length)],
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.008 + 0.004,
    });
  }

  let raf;
  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const time = t * 0.001;

    particles.forEach(p => {
      p.x += p.vx + Math.sin(time * p.speed + p.phase) * 0.3;
      p.y += p.vy;

      // Wrap
      if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;

      const pulse = 0.7 + 0.3 * Math.sin(time * 1.5 + p.phase);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `${p.col}${(p.alpha * pulse).toFixed(2)})`;
      ctx.fill();
    });

    raf = requestAnimationFrame(draw);
  }

  raf = requestAnimationFrame(draw);

  // Pause when not in viewport
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      raf = raf || requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(raf);
      raf = null;
    }
  });
  obs.observe(hero);
}

/* ─────────────────────────────────────────────
   DNA PARTICLE LAYER for Chapter 06
   Floating helix-pattern dots
───────────────────────────────────────────── */
function initDNACanvas() {
  if (!motionEnabled || prefersReduced) return;
  const ch6 = document.getElementById('chapter-6');
  if (!ch6) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'tl-dna-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.35;';
  ch6.style.position = 'relative';
  ch6.style.overflow = 'hidden';
  ch6.insertBefore(canvas, ch6.firstChild);

  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = ch6.offsetWidth;
    canvas.height = ch6.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  let raf;
  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const time = t * 0.001;
    const cx = canvas.width * 0.5;
    const spread = canvas.width * 0.28;

    // Draw two sinusoidal strands
    for (let strand = 0; strand < 2; strand++) {
      const offset = strand * Math.PI;
      for (let y = 0; y < canvas.height; y += 14) {
        const x = cx + Math.sin(y * 0.018 + time * 0.5 + offset) * spread;
        const alpha = 0.15 + 0.1 * Math.sin(y * 0.025 + time);
        const r = 2.5 + Math.sin(y * 0.03 + time) * 1;

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = strand === 0 ? `rgba(94,230,208,${alpha})` : `rgba(78,186,224,${alpha})`;
        ctx.fill();
      }
    }

    // Cross-links
    for (let y = 30; y < canvas.height; y += 42) {
      const x1 = cx + Math.sin(y * 0.018 + time * 0.5) * spread;
      const x2 = cx + Math.sin(y * 0.018 + time * 0.5 + Math.PI) * spread;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.strokeStyle = `rgba(94,230,208,0.08)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    raf = requestAnimationFrame(draw);
  }

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      if (!raf) raf = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(raf);
      raf = null;
    }
  });
  obs.observe(ch6);
}

/* ─────────────────────────────────────────────
   MAIN BOOT
───────────────────────────────────────────── */
export function initAnimations() {
  buildPauseBtn();

  if (!motionEnabled) {
    // Ensure all hidden elements become visible immediately
    document.querySelectorAll('.eyebrow').forEach(el => el.classList.add('drawn'));
    return;
  }

  const lenis = initLenis();

  buildProgressRail();
  animateHero();
  animateSectionEntries();
  animateChapter1();
  animateChapter2();
  animateChapter3();
  animateChapter4();
  animateChapter5();
  animateChapter6();
  animateCTA();
  initColorGrade();
  animateEyebrows();
  initParticleCanvas();
  initDNACanvas();

  // Refresh ScrollTrigger after fonts/images load
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });

  // Pause when tab is hidden (save GPU)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      gsap.globalTimeline.pause();
      lenis && lenis.stop();
    } else {
      if (motionEnabled) {
        gsap.globalTimeline.resume();
        lenis && lenis.start();
      }
    }
  });
}
