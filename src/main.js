// Entry point for the Home page ("Root to Ritual"): boots the hero films, the Root Map (Our Roots), A Day
// with TranzLife, Your Ritual and the trust band, in order. The vision tagline now lives on About, the Ayurveda frames
// on Ingredients.
import './features/footer/night-footer.js';
import { intro } from './app/intro.js';
import { setLoad } from './app/loader.js';
import { initPages } from './app/page-sections.js';
import { initScroll } from './app/scroll-animations.js';
import { initTransitions } from './app/section-transitions.js';
import { initSmooth } from './app/smooth-scroll.js';
import { state, thumbs } from './app/state.js';
import './features/navigation/dropdown.js';
import './components/page-scrollbar.js';
import { initFourWindows } from './features/hero/four-windows.js';
import { initNav } from './features/navigation/navigation.js';
import { SHOTS } from './features/products/product-images.js';
import { initLightbox } from './components/lightbox.js';
import { initRootMap } from './features/story/root-map.js';
import { initDay } from './features/story/day-story.js';
import { initRitual } from './features/story/ritual-lineup.js';
import { initPremiumFx } from './features/ui/premium-fx.js';
import { $ } from './utils/dom.js';

// Boot order matters: static UI first, then the hero films, then scroll wiring.
async function boot(){
  setLoad(8);
  initNav();
  setLoad(20);
  try { if (document.fonts) await Promise.race([Promise.all(['850 40px Archivo','600 20px Archivo','600 24px Caveat'].map(f => document.fonts.load(f))).then(() => document.fonts.ready), new Promise(r => setTimeout(r, 1500))]); } catch(e){}
  setLoad(36);
  try { state.hero = initFourWindows(); } catch(err){ console.warn('hero films unavailable', err); }
  Object.assign(thumbs, SHOTS); initLightbox();
  setLoad(88);
  try { state.roots = initRootMap(); } catch(err){ console.warn('roots unavailable', err); }
  try { state.day = initDay(); } catch(err){ console.warn('day story unavailable', err); }
  try { state.ritual = initRitual(); } catch(err){ console.warn('ritual lineup unavailable', err); }
  try { initPages(); } catch(err){ console.warn('page tracking unavailable', err); }
  setLoad(96);
  initSmooth();
  initScroll();
  initTransitions();
  window.state = state;
  intro();
  try { initPremiumFx(); } catch(err){ console.warn('premium fx unavailable', err); }
}

// never hold visitors on the loading screen for long, even if a scene is slow or fails
const failSafe = setTimeout(() => $('#loader').classList.add('done'), 5000);

boot().catch(err => { console.error(err); $('#loader').classList.add('done'); }).finally(() => clearTimeout(failSafe));
