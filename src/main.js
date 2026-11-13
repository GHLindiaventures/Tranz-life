// Entry point for the Home page: loads styles and boots the hero, lineup, tagline, nature video and explore band in order.
// Sections that used to live here now boot from their own pages (products.js, science.js, about.html).
import { intro } from './app/intro.js';
import { setLoad } from './app/loader.js';
import { initPages } from './app/page-sections.js';
import { initScroll } from './app/scroll-animations.js';
import { initTransitions } from './app/section-transitions.js';
import { initSmooth } from './app/smooth-scroll.js';
import { state, thumbs } from './app/state.js';
import { initCart, renderCart } from './features/cart/cart.js';
import { initHeroJar } from './features/hero/hero-jar.js';
import { initProductHandOff } from './features/hero/product-hand-off.js';
import { initLayeredDepth } from './features/hero/layered-depth.js';
import { initMossReveal } from './features/hero/moss-reveal.js';
import { buildMarquee } from './features/hero/marquee.js';
import { initNav } from './features/navigation/navigation.js';
import { SHOTS } from './features/products/product-images.js';
import { initLightbox } from './components/lightbox.js';
import { initAyurveda } from './features/ayurveda/ayurveda-video.js';
import { initTaglineMotion } from './features/tagline/tagline-motion.js';
import { initPremiumFx } from './features/ui/premium-fx.js';
import { $ } from './utils/dom.js';

// Boot order matters: static UI first, then the 3D hero, then scroll wiring.
async function boot(){
  setLoad(8);
  initCart();
  buildMarquee(); renderCart(); initNav();
  setLoad(20);
  try { if (document.fonts) await Promise.race([Promise.all(['850 40px Archivo','600 20px Archivo','600 24px Caveat'].map(f => document.fonts.load(f))).then(() => document.fonts.ready), new Promise(r => setTimeout(r, 2500))]); } catch(e){}
  setLoad(36);
  try { state.heroApi = initHeroJar(); } catch(err){ console.warn('hero jar unavailable', err); }
  try { state.layeredDepth = initLayeredDepth(); } catch(err){ console.warn('layered depth unavailable', err); }
  try { initMossReveal(); } catch(err){ console.warn('moss reveal unavailable', err); }
  Object.assign(thumbs, SHOTS); initLightbox();
  setLoad(88);
  try { state.ayurApi = initAyurveda(); } catch(err){ console.warn('ayurveda video unavailable', err); }
  try { initPages(); } catch(err){ console.warn('page tracking unavailable', err); }
  setLoad(96);
  initSmooth();
  initScroll();
  initTransitions();
  try { state.handOffApi = initProductHandOff(); } catch(err){ console.warn('product hand-off unavailable', err); }
  try { state.taglineMotion = initTaglineMotion(); } catch(err){ console.warn('tagline motion unavailable', err); }
  window.state = state;
  intro();
  try { initPremiumFx(); } catch(err){ console.warn('premium fx unavailable', err); }
}

// never leave the loading screen up, even if a 3D scene fails
const failSafe = setTimeout(() => $('#loader').classList.add('done'), 25000);

boot().catch(err => { console.error(err); $('#loader').classList.add('done'); }).finally(() => clearTimeout(failSafe));
