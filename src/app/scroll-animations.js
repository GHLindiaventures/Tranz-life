// Scroll-triggered reveals, word splits, parallax and marquee skew.
import { ScrollTrigger, gsap, hasGsap } from '../lib/gsap.js';
import { MOTION } from './motion-tokens.js';
import { $, $$ } from '../utils/dom.js';
import { clamp } from '../utils/math.js';
import { reduce } from '../utils/media.js';

function splitWords(el){
  const walk = node => { [...node.childNodes].forEach(ch => {
    if (ch.nodeType === 3){ const frag = document.createDocumentFragment(); ch.textContent.split(/(\s+)/).forEach(w => { if (!w) return; if (!w.trim()) frag.appendChild(document.createTextNode(w)); else { const o = document.createElement('span'); o.className = 'wl'; const i = document.createElement('span'); i.className = 'w'; i.textContent = w; o.appendChild(i); frag.appendChild(o); } }); ch.replaceWith(frag); }
    else if (ch.nodeType === 1 && !ch.classList.contains('wl')) walk(ch); }); };
  walk(el);
}

function initScroll(){
  if (!hasGsap || !ScrollTrigger) return;
  if (reduce) {
    $$('.reveal').forEach(el => gsap.fromTo(el, { opacity:0 }, { opacity:1, duration: MOTION.dur.base }));
    return;
  }

  $$('.rv-words').forEach(el => {
    splitWords(el);
    gsap.from($$('.w', el), {
      yPercent: 110,
      duration: MOTION.dur.slow,
      stagger: MOTION.stagger.fast,
      ease: MOTION.ease.entrance,
      scrollTrigger: { trigger: el, start: 'top 86%', once: true }
    });
  });

  $$('.reveal').forEach(el => gsap.from(el, {
    opacity: 0,
    y: MOTION.dist.md,
    duration: MOTION.dur.base,
    ease: MOTION.ease.entrance,
    scrollTrigger: { trigger: el, start: 'top 90%', once: true }
  }));

  // tilted studio cards drift and turn as you pass
  $$('.in-card').forEach((c, k) => gsap.fromTo(c,
    { y: 60 + k*30 },
    { y: -50 - k*20, rotation: [-4, 7, -6][k], ease: 'none', scrollTrigger: { trigger: '#insider', start: 'top bottom', end: 'bottom top', scrub: true } }
  ));

  // handwritten arrows draw themselves
  $$('.in-why .draw').forEach(p => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    gsap.fromTo(p,
      { strokeDashoffset: len },
      { strokeDashoffset: 0, duration: 1.4, ease: MOTION.ease.smooth, scrollTrigger: { trigger: p, start: 'top 85%', once: true } }
    );
  });

  // the hero copy lifts away; the DNA in science floats
  gsap.fromTo('#sciDna', { y: 60, rotation: -2 }, { y: -60, rotation: 2, ease: 'none', scrollTrigger: { trigger: '#science', start: 'top bottom', end: 'bottom top', scrub: true } });

  // lab bars fill in
  $$('.b-bar i').forEach(i => i.style.setProperty('--s', 0));
  ScrollTrigger.create({ trigger: '#board', start: 'top 80%', once: true, onEnter: () => $$('.b-bar i').forEach((i, k) => setTimeout(() => i.style.setProperty('--s', 1), k*140)) });

  // marquee leans with scroll speed
  const mq = $('#mq'); let skew = 0;
  ScrollTrigger.create({ onUpdate: self => { skew = clamp(self.getVelocity()/-300, -7, 7); } });
  gsap.ticker.add(() => { skew *= .9; mq.style.transform = `skewX(${skew.toFixed(2)}deg)`; });
}

export { initScroll };
