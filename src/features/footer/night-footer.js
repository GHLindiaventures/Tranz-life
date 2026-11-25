// "After Dark" site footer: the last page of the day.
// - The TRANZLIFE wordmark sinks into the bottom edge like a horizon. It is still (no animation).
// - "Back to dawn" turns the night sky to sunrise while the page scrolls back to the top.
// - The online store link: a "coming soon" note until VITE_STORE_URL is set (src/app/store.js).
// Runs on every page (imported by each page's entry script). Reduced motion: plain jump to the top.
import { $ } from '../../utils/dom.js';
import { reduce } from '../../utils/media.js';
import { storeLive, storeUrl } from '../../app/store.js';

function initNightFooter(){
  const foot = $('#siteFooter');
  if (!foot || foot.dataset.ready) return null;
  foot.dataset.ready = '1';
  const dawn = $('#nfDawn', foot);

  // the online store: a link once it is live, a "coming soon" note until then
  const store = $('#nfStore', foot);
  if (store && storeLive) store.outerHTML = `<a class="nf-store nf-mail" href="${storeUrl()}" target="_blank" rel="noopener">Online store ↗</a>`;

  // back to dawn
  if (dawn) dawn.addEventListener('click', () => {
    foot.classList.add('is-dawn');
    const lenis = window.state && window.state.lenis;
    if (lenis) lenis.scrollTo(0, { duration: reduce ? 0 : 1.8 });
    else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    setTimeout(() => foot.classList.remove('is-dawn'), 2600);
  });
  return null;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNightFooter);
else initNightFooter();

export { initNightFooter };
