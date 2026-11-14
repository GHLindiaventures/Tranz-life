// Hero exit: as the hero scrolls away the headline stretches wide (Archivo's variable width axis, 64% to 125%)
// and fades, and the offer and facts lift away. Parents are faded (not the elements the intro animates), so the two
// timelines never fight over the same property.
import { gsap, ScrollTrigger, hasGsap } from '../../lib/gsap.js';
import { $ } from '../../utils/dom.js';
import { reduce } from '../../utils/media.js';

function initHeroScroll(){
  if (!hasGsap || !ScrollTrigger || reduce) return;
  const home = $('#home'), title = $('.hero__title'), brand = $('.hero__brand');
  if (!home || !title) return;
  const st = { trigger: home, start: 'top top', end: 'bottom top', scrub: .4 };
  gsap.fromTo(title, { fontStretch: '64%' }, { fontStretch: '125%', ease: 'none', scrollTrigger: st });
  if (brand) gsap.to(brand, { opacity: 0, ease: 'power1.in', scrollTrigger: { ...st, end: '70% top' } });
  gsap.to(['.hero__offer', '.hero__facts', '.hero__cue'], { y: -50, opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '35% top' } });
}

export { initHeroScroll };
