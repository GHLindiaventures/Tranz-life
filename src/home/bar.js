// The home page's bottom bar (#bar), always on screen: the TranzLife emblem, "Find your ritual" and the menu.
// "Find your ritual" goes to A Day with TranzLife (closing the film first if it is still playing).
// The menu grows the bar open upwards into the site's pages; Esc or a click outside closes it.
// The bar follows the light or dark of whatever is behind it (data-theme, set from the film's stage or the page).
import { state } from '../app/state.js';

function initBar(){
  const bar = document.getElementById('bar');
  if (!bar) return;
  const burger = document.getElementById('barBurger'), menu = document.getElementById('barMenu'), ritual = document.getElementById('barRitual');
  const replay = document.getElementById('barReplay');

  const toDay = () => {
    const day = document.getElementById('day');
    const go = () => { const y = day ? day.getBoundingClientRect().top + window.scrollY : 0; state.lenis ? state.lenis.scrollTo(y, { duration: 1.4 }) : window.scrollTo({ top: y, behavior: 'smooth' }); };
    if (state.xp && state.xp.open){ state.xp.close(); setTimeout(go, 50); } else go();
  };
  ritual && ritual.addEventListener('click', toDay);
  replay && replay.addEventListener('click', () => { setOpen(false); state.xp && state.xp.reopen(1); });

  const setOpen = on => {
    bar.classList.toggle('is-open', on);
    burger.setAttribute('aria-expanded', String(on));
    burger.setAttribute('aria-label', on ? 'Close menu' : 'Open menu');
    menu.hidden = !on;
    if (on) setTimeout(() => menu.querySelector('a, button')?.focus({ preventScroll: true }), 250);
  };
  menu.hidden = true;
  burger.addEventListener('click', () => setOpen(!bar.classList.contains('is-open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && bar.classList.contains('is-open')){ setOpen(false); burger.focus(); } });
  document.addEventListener('pointerdown', e => { if (bar.classList.contains('is-open') && !bar.contains(e.target)) setOpen(false); });

  // light or dark: from the film while it plays, from the page beneath once it has closed
  const theme = () => {
    if (state.xp && state.xp.open){ bar.dataset.theme = document.body.dataset.xpTheme || 'dark'; return; }
    const foot = document.getElementById('siteFooter');
    const dark = foot && foot.getBoundingClientRect().top < innerHeight - 60;
    bar.dataset.theme = dark ? 'dark' : 'light';
    if (replay) replay.hidden = false;
  };
  theme();
  addEventListener('scroll', theme, { passive: true });
  new MutationObserver(theme).observe(document.body, { attributes: true, attributeFilter: ['data-xp-theme'] });
  document.addEventListener('tl:film-closed', theme);
}

export { initBar };
