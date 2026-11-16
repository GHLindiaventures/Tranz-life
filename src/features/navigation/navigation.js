// Left dock (folds open on hover/tap) and the full-screen menu.
import { state, thumbs } from '../../app/state.js';
import { PRODUCTS } from '../../data/products.js';
import { SECTIONS } from '../../data/sections.js';
import { SEC_IC, svgI } from './nav-icons.js';
import { $, $$ } from '../../utils/dom.js';
import { reduce } from '../../utils/media.js';
import { initNavDropdowns } from './dropdown.js';

function initNav(){
  const nav = $('#nav'), dock = $('#dock'), btn = $('#dockMenu'), menu = $('#menu'), ind = $('#dockInd');
  const pad = n => String(n).padStart(2, '0');
  const SITE_PAGES = [
    { no: '01', name: 'Home', sub: 'Nature meets science', href: 'index.html#home' },
    { no: '02', name: 'About Us', sub: 'Our mission & innovation', href: 'about.html' },
    { no: '03', name: 'Our Products', sub: 'All six formulations', href: 'products.html' },
    { no: '04', name: 'Science & Innovation', sub: 'Molecular delivery & 3D lab', href: 'science.html' },
    { no: '05', name: 'Our Ingredients', sub: 'Botanical pharmacopeia', href: 'ingredients.html' },
    { no: '06', name: 'Quality & Manufacturing', sub: 'Cleanrooms & batch audit', href: 'quality.html' },
    { no: '07', name: 'Sustainability', sub: 'Regeneration & zero-plastic', href: 'sustainability.html' },
    { no: '08', name: 'Certifications & Compliance', sub: 'Regulatory accreditations', href: 'certifications.html' },
    { no: '09', name: 'Contact', sub: 'Say hello', href: 'contact.html' }
  ];

  $('#dockList').innerHTML = SECTIONS.map((s, i) => `<li style="--i:${i}"><a href="#${s.id}" data-sec="${s.id}" aria-label="${s.name}" tabindex="-1">${svgI(SEC_IC[s.id])}<b>${s.name}</b></a></li>`).join('');
  $('#menuList').innerHTML = SITE_PAGES.map((p, i) => `<li style="--i:${i}"><a href="${p.href}"><span class="mi-no">${p.no}</span><span class="mi-name">${p.name}</span><span class="mi-sub">${p.sub}</span></a></li>`).join('');
  const links = $$('#dockList a');

  // featured product card inside the menu
  const fImg = $('#mfImg'); let fi = 1, ft = null;
  const showFeat = i => { fi = i; const p = PRODUCTS[i]; $$('img', fImg).forEach((im, k) => im.classList.toggle('on', k === i)); $('#mfName').textContent = p.name; $('#mfNo').textContent = `Product ${p.no} · ${p.tag}`; $('#mfAdd').dataset.id = p.id; };
  const startFeat = () => { if (!fImg.children.length && thumbs.gummies) fImg.innerHTML = PRODUCTS.map(p => `<img src="${thumbs[p.id]}" alt="${p.name}">`).join(''); showFeat(fi); clearInterval(ft); if (!reduce) ft = setInterval(() => showFeat((fi + 1) % PRODUCTS.length), 2800); };

  const setOpen = open => {
    const r = btn.getBoundingClientRect(); menu.style.setProperty('--ox', (r.left + r.width/2).toFixed(0) + 'px'); menu.style.setProperty('--oy', (r.top + r.height/2).toFixed(0) + 'px');
    menu.classList.toggle('open', open); menu.setAttribute('aria-hidden', !open);
    btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.documentElement.classList.toggle('menu-open', open);
    if (state.lenis) open ? state.lenis.stop() : state.lenis.start();
    if (open) startFeat(); else clearInterval(ft);
  };
  // the dock rests as a single symbol; hover (or a first tap on touch) unfolds the bar
  const touch = !matchMedia('(hover:hover) and (pointer:fine)').matches; dock.classList.toggle('touch', touch);
  let foldT = 0, setT = 0;
  const unfold = open => {
    clearTimeout(foldT);
    if (open === dock.classList.contains('open')) return;
    clearTimeout(setT);
    dock.classList.toggle('open', open); dock.classList.remove('settled', 'peek');
    links.forEach(a => a.tabIndex = open ? 0 : -1);
    if (open){ setT = setTimeout(() => { dock.classList.add('settled'); place(); }, 560); requestAnimationFrame(place); }
  };
  if (!touch){
    dock.addEventListener('mouseenter', () => unfold(true));
    dock.addEventListener('mouseleave', () => { foldT = setTimeout(() => unfold(false), 380); });
  }
  dock.addEventListener('focusin', () => unfold(true));
  dock.addEventListener('focusout', e => { if (!dock.contains(e.relatedTarget)) foldT = setTimeout(() => unfold(false), 200); });
  document.addEventListener('pointerdown', e => { if (dock.classList.contains('open') && !dock.contains(e.target)) unfold(false); });
  $('#dockList').addEventListener('click', () => setTimeout(() => unfold(false), touch ? 250 : 600));
  // remember the fold state before focus unfolds it, so a first tap only opens the bar
  let wasOpen = false; btn.addEventListener('pointerdown', () => { wasOpen = dock.classList.contains('open'); });
  btn.addEventListener('click', () => {
    if (touch && !wasOpen && !menu.classList.contains('open')){ wasOpen = true; unfold(true); return; }
    unfold(false); setOpen(!menu.classList.contains('open'));
  });
  $('#menuX').addEventListener('click', () => setOpen(false));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });

  // the dock follows the page: a sliding dot marks the current section, its label peeks out
  let cur = 'home', peekT = 0;
  const place = () => { const a = links.find(x => x.dataset.sec === cur); if (a) ind.style.transform = `translateY(${a.parentElement.offsetTop}px)`; };
  const setOn = id => {
    const changed = id !== cur; cur = id;
    links.forEach(a => a.classList.toggle('on', a.dataset.sec === id));
    $$('#menuList li').forEach(li => li.classList.toggle('on', li.dataset.sec === id));
    $$('.nav-pills > a').forEach(a => a.classList.toggle('on', a.dataset.sec === id));
    const si = Math.max(0, SECTIONS.findIndex(s => s.id === id)), cl = $('#dockCur');
    cl.textContent = SECTIONS[si].name; cl.dataset.no = pad(si + 1);
    place();
    if (changed && !menu.classList.contains('open')){ dock.classList.add('peek'); clearTimeout(peekT); peekT = setTimeout(() => dock.classList.remove('peek'), 1600); }
  };
  setOn('home'); window.addEventListener('resize', place);
  initNavDropdowns();
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 20);
  }, { passive: true });
  // the dark footer counts as a green page for the dock and nav
  let pageDark = false, footDark = false;
  const foot = $('footer');
  const updateTone = () => {
    const dark = pageDark || footDark;
    nav.classList.toggle('t-green', dark);
    dock.classList.toggle('t-green', dark);
  };
  if (foot && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      footDark = entry.isIntersecting;
      updateTone();
    }, { rootMargin: '0px 0px -50% 0px' }).observe(foot);
  }
  window.addEventListener('tl:page', e => { setOn(e.detail.id); pageDark = e.detail.theme === 'green'; updateTone(); });
}

export { initNav };
