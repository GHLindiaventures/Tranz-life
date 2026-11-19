// Entry point for the Home page: the TranzLife film (src/home/experience.js), played over the page, then the page
// itself: A Day with TranzLife and the footer. The bottom bar (src/home/bar.js) stays on screen throughout.
import './features/footer/night-footer.js';
import './features/navigation/dropdown.js';
import './components/chat-loader.js';
import { initSmooth } from './app/smooth-scroll.js';
import { state } from './app/state.js';
import { initScore } from './features/cinema/score.js';
import { initExperience } from './home/experience.js';
import { initBar } from './home/bar.js';
import { initCollide } from './home/collide.js';
import { initDay } from './features/story/day-story.js';

const breathe = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));

async function boot(){
  try { initScore(); } catch (err) { console.warn('score unavailable', err); }
  try { state.xp = initExperience(); } catch (err) { console.warn('film unavailable', err); document.documentElement.classList.remove('xp-on'); }
  initBar();
  initSmooth();
  if (state.xp && state.xp.open && state.lenis) state.lenis.stop();     // the page stays still under the film
  await breathe();
  try { state.collide = initCollide(); } catch (err) { console.warn('four films unavailable', err); }
  try { state.day = initDay(); } catch (err) { console.warn('day story unavailable', err); }
  window.state = state;
}

boot().catch(err => { console.error(err); document.documentElement.classList.remove('xp-on'); });
