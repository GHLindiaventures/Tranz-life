// Entry point for the Home page ("Root to Ritual"): boots the Genesis opening film, the hero films, the Root Map (Our Roots), A Day
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
import './components/chat-loader.js';
import { initFourWindows } from './features/hero/four-windows.js';
import { initGenesis } from './features/genesis/genesis.js';
import { initNav } from './features/navigation/navigation.js';
import { SHOTS } from './features/products/product-images.js';
import { initLightbox } from './components/lightbox.js';
import { initRootMap } from './features/story/root-map.js';
import { initDay } from './features/story/day-story.js';
import { initRitual } from './features/story/ritual-lineup.js';
import { initPremiumFx } from './features/ui/premium-fx.js';
import { warmAll } from './features/products/jar-layer.js';
import { initOneShotPlunge } from './features/plunge/one-shot-plunge.js';
import { $ } from './utils/dom.js';

// Boot order matters: static UI first, then the hero films, then scroll wiring.
// Between the heavier sections the boot lets the browser draw a frame, so the hero film and its title keep moving
// while the rest of the page sets itself up (measured: one 0.5 s block otherwise).
const breathe = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
async function boot(){
  setLoad(8);
  // Initialize the One-Shot Plunge (Roots -> Dewdrop/DNA -> Product Altar)
  try { state.plunge = initOneShotPlunge(); } catch(err){ console.warn('one-shot plunge unavailable', err); }
  $('#loader').classList.add('done');
  initNav();
  setLoad(20);
  try { if (document.fonts) await Promise.race([Promise.all(['850 40px Archivo','600 20px Archivo','600 24px Caveat'].map(f => document.fonts.load(f))).then(() => document.fonts.ready), new Promise(r => setTimeout(r, 1500))]); } catch(e){}
  setLoad(36);
  Object.assign(thumbs, SHOTS); initLightbox();
  setLoad(88);
  await breathe();
  try { state.roots = initRootMap(); } catch(err){ console.warn('roots unavailable', err); }
  await breathe();
  try { state.day = initDay(); } catch(err){ console.warn('day story unavailable', err); }
  await breathe();
  try { state.ritual = initRitual(); } catch(err){ console.warn('ritual lineup unavailable', err); }
  state.warmed = warmAll();      // the 3D products' shaders, compiled before the hero film starts (genesis.js)
  await breathe();
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
