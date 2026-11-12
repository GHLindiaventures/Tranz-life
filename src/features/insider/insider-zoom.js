// "You deserve the best" section. As it scrolls in, the headline grows in from small and blurred, then the
// product photos push forward and settle, then the story card zooms in and its text fades up. Everything is
// tied to the scroll, so scrolling back reverses it. (The cards' drift and tilt live in app/scroll-animations.js.)
import { gsap, hasGsap } from '../../lib/gsap.js';
import { $, $$ } from '../../utils/dom.js';
import { reduce } from '../../utils/media.js';

function initInsiderZoom(){
  const sec = $('#insider'), h = $('.in-h', sec), copy = $('.in-copy', sec);
  if (!hasGsap || !sec || !h || reduce) return;
  const phone = matchMedia('(max-width: 760px)').matches;
  const from = phone ? .85 : .62;
  const scrub = (trigger, start, end) => ({ trigger, start, end, scrub:.6 });
  gsap.fromTo(h, { scale:from, opacity:.15, filter:'blur(8px)' }, { scale:1, opacity:1, filter:'blur(0px)', ease:'power2.out', scrollTrigger:scrub(sec, 'top 90%', 'top 25%') });
  gsap.fromTo($$('.in-card', sec), { scale:phone ? .92 : .82, opacity:0 }, { scale:1, opacity:1, stagger:.12, ease:'power2.out', scrollTrigger:scrub('.in-grid', 'top 95%', 'top 40%') });
  if (copy) gsap.fromTo(copy, { scale:phone ? .94 : .86, opacity:0 }, { scale:1, opacity:1, ease:'power2.out', scrollTrigger:scrub(copy, 'top 95%', 'top 55%') });
}

export { initInsiderZoom };
