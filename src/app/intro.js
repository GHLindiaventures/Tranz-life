// Hides the loader and plays the MotionSites Layered Depth entrance timeline.
import { setLoad } from './loader.js';
import { state } from './state.js';
import { gsap, hasGsap } from '../lib/gsap.js';
import { $ } from '../utils/dom.js';
import { reduce } from '../utils/media.js';
import { prepareHeroIntro } from '../features/hero/hero-intro.js';

function intro(){
  const loader = $('#loader'); setLoad(100);
  const hero = prepareHeroIntro();                     // split the headline and set the opening's start state under the loader
  setTimeout(() => {
    loader.classList.add('done');
    // the product drops onto the plinth once it has risen, and the bird comes last (hero-intro.js has the sequence)
    state.heroApi && state.heroApi.start && state.heroApi.start(hero.productDelay);
    state.layeredDepth && state.layeredDepth.start && state.layeredDepth.start(hero.birdDelay);
    hero.play();
    if (hasGsap && !reduce){
      const tl = gsap.timeline({ defaults:{ ease:'power4.out' } });
      tl.fromTo('.fact', { scale:0, opacity:0 }, { scale:1, opacity:1, duration:.9, stagger:.12, ease:'back.out(2)', clearProps:'transform' }, 1.75)
        .from('.nav > *', { y:-18, opacity:0, duration:.8, stagger:.06 }, .3)
        .from('.dock', { x:-90, opacity:0, duration:1.1, ease:'expo.out' }, .5);
    }
  }, 300);
}

export { intro };
