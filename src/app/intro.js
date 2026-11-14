// Hides the loader and plays the MotionSites Layered Depth entrance timeline.
import { setLoad } from './loader.js';
import { state } from './state.js';
import { gsap, hasGsap } from '../lib/gsap.js';
import { $ } from '../utils/dom.js';
import { reduce } from '../utils/media.js';

function intro(){
  const loader = $('#loader'); setLoad(100);
  try { sessionStorage.setItem('tl-intro-seen', '1'); } catch (e) {}   // later visits to Home this session skip the loader (see index.html)
  setTimeout(() => {
    loader.classList.add('done');
    state.heroApi && state.heroApi.start && state.heroApi.start();
    state.layeredDepth && state.layeredDepth.start && state.layeredDepth.start();
    if (hasGsap && !reduce){
      const tl = gsap.timeline({ defaults:{ ease:'power4.out' } });
      tl.fromTo('.hero__brand > *', { opacity:0, y:40 }, { opacity:1, y:0, duration:1.4, stagger:.15, ease:'power3.out' }, 0.2)
        .fromTo('.hero__slab', { opacity:0, y:60, scale:0.96 }, { opacity:1, y:0, scale:1, duration:1.8, ease:'power3.out' }, 0.1)
        .fromTo('.hero__offer > *', { opacity:0, y:26 }, { opacity:1, y:0, duration:1.1, stagger:.12, ease:'power3.out', clearProps:'transform' }, .6)
        .fromTo('.nav > *', { y:-18, opacity:0 }, { y:0, opacity:1, duration:.8, stagger:.06, clearProps:'all' }, .3)
        .fromTo('.dock', { x:-90, opacity:0 }, { x:0, opacity:1, duration:1.1, ease:'expo.out', clearProps:'all' }, .5);
    }
  }, 300);
}

export { intro };
