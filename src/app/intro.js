// Hides the loader and plays the MotionSites Layered Depth entrance timeline.
import { setLoad } from './loader.js';
import { state } from './state.js';
import { gsap, hasGsap } from '../lib/gsap.js';
import { $ } from '../utils/dom.js';
import { reduce } from '../utils/media.js';

function intro(){
  const loader = $('#loader'); setLoad(100);
  setTimeout(() => {
    loader.classList.add('done');
    state.heroApi && state.heroApi.start && state.heroApi.start();
    state.layeredDepth && state.layeredDepth.start && state.layeredDepth.start();
    if (hasGsap && !reduce){
      const tl = gsap.timeline({ defaults:{ ease:'power4.out' } });
      tl.fromTo('.hero__brand span', { opacity:0, y:40, scale:0.95 }, { opacity:0.92, y:0, scale:1, duration:1.6, ease:'power3.out' }, 0.2)
        .fromTo('.hero__slab', { opacity:0, y:60, scale:0.96 }, { opacity:1, y:0, scale:1, duration:1.8, ease:'power3.out' }, 0.1)
        .fromTo('.panel-left', { opacity:0, y:28 }, { opacity:1, y:0, duration:1.2, ease:'power3.out' }, 0.5)
        .fromTo('.panel-right', { opacity:0, y:28 }, { opacity:1, y:0, duration:1.2, ease:'power3.out' }, 0.6)
        .fromTo('.fact', { y:16, opacity:0 }, { y:0, opacity:1, duration:0.9, stagger:0.1, ease:'power3.out' }, .7)
        .from('.nav > *', { y:-18, opacity:0, duration:.8, stagger:.06 }, .3)
        .from('.dock', { x:-90, opacity:0, duration:1.1, ease:'expo.out' }, .5);
    }
  }, 300);
}

export { intro };
