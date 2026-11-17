// Hides the loader, opens the hero's four films (four-windows.js) and brings in the nav and dock.
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
    state.hero && state.hero.start && state.hero.start();
    if (hasGsap && !reduce){
      const tl = gsap.timeline({ defaults:{ ease:'power4.out' } });
      tl.fromTo('.nav > *', { y:-18, opacity:0 }, { y:0, opacity:1, duration:.8, stagger:.06, clearProps:'all' }, .3)
        .fromTo('.dock', { x:-90, opacity:0 }, { x:0, opacity:1, duration:1.1, ease:'expo.out', clearProps:'all' }, .5);
    }
  }, 300);
}

export { intro };
