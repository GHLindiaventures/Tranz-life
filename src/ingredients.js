// TranzLife Biosciences - Our Ingredients page
// Showcase: a 3D card carousel over the forest stage; below it the full, searchable list of all ingredients.
// The benefit filter is shared by both; "View Details" (or any tile) opens a details dialog.
import { initCart } from './features/cart/cart.js';
import { $ } from './utils/dom.js';
import { BOTANICAL_INGREDIENTS, INGREDIENT_CATEGORIES } from './data/ingredients.js';

export { BOTANICAL_INGREDIENTS };

const PHOTOS = new Set(['haritaki']);              // full photographs (no cut-out): shown framed
const VISIBLE = 2;                                 // cards shown on each side of the centre card
const CAT_LABEL = Object.fromEntries(INGREDIENT_CATEGORIES.map(c => [c.id, c.label]));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const imgSrc = item => `assets/ingredients/cutout/${item.id}.webp`;
const LEAF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19C6 10 12 5 20 4c-.5 9-6 14-15 15z"/><path d="M5 19 14 10"/></svg>';
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

function initSiteChrome() {
  try { initCart(); } catch (e) { console.warn('Cart initialization deferred:', e); }

  const nav = $('#nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const btn = $('#dockMenu'), menu = $('#menu'), menuX = $('#menuX');
  const setMenuOpen = open => {
    if (!menu) return;
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', !open);
    if (btn) { btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
    document.documentElement.classList.toggle('menu-open', open);
  };
  if (btn) btn.addEventListener('click', () => setMenuOpen(!menu.classList.contains('open')));
  if (menuX) menuX.addEventListener('click', () => setMenuOpen(false));
  if (menu) menu.addEventListener('click', e => { if (e.target.closest('a')) setMenuOpen(false); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && menu && menu.classList.contains('open')) setMenuOpen(false); });

  const bagBtn = $('#bagBtn'), drawer = $('#drawer'), scrim = $('#scrim'), closeBag = $('#closeBag');
  const setDrawerOpen = open => {
    if (!drawer || !scrim) return;
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', !open);
    scrim.classList.toggle('open', open);
    document.documentElement.classList.toggle('bag-open', open);
  };
  if (bagBtn) bagBtn.addEventListener('click', () => setDrawerOpen(true));
  if (closeBag) closeBag.addEventListener('click', () => setDrawerOpen(false));
  if (scrim) scrim.addEventListener('click', () => setDrawerOpen(false));
}

function initIngredients() {
  const track = $('#ixTrack'), stage = $('#ixStage'), live = $('#ixLive');
  const grid = $('#ixGrid'), search = $('#ixSearch'), count = $('#ixCount');
  const moreBtn = $('#ixMoreBtn'), moreMenu = $('#ixMoreMenu'), moreLabel = $('#ixMoreLabel');
  const dialog = $('#ixDialog'), dialogBody = $('#ixDialogBody');
  if (!track || !grid) return;

  const total = BOTANICAL_INGREDIENTS.length;
  document.querySelectorAll('[data-count]').forEach(el => { el.textContent = `(${total})`; });
  document.querySelectorAll('[data-count-plain]').forEach(el => { el.textContent = total; });

  // start on the second ingredient, so the first one shows on its left (Wintergreen | Peppermint | Ginger)
  let cat = 'all', query = '', deck = [...BOTANICAL_INGREDIENTS], active = Math.min(1, BOTANICAL_INGREDIENTS.length - 1);
  const inCat = item => cat === 'all' || item.category.includes(cat);

  /* ---------- carousel ---------- */
  const cardHTML = (item, i) => `
    <article class="ix-card" data-i="${i}">
      <div class="ix-card-media${PHOTOS.has(item.id) ? ' is-photo' : ''}">
        <span class="ix-halo" aria-hidden="true"></span>
        <img src="${imgSrc(item)}" alt="" loading="${i < 3 || i > deck.length - 3 ? 'eager' : 'lazy'}" decoding="async">
      </div>
      <span class="ix-badge">${LEAF}${esc(item.tradition)}</span>
      <h3 class="ix-name">${esc(item.name)}</h3>
      <p class="ix-latin">${esc(item.latin)}</p>
      <p class="ix-desc">${esc(item.desc)}</p>
      <button class="ix-details" type="button" data-open="${item.id}">View Details ${ARROW}</button>
    </article>`;

  function renderDeck() {
    track.innerHTML = deck.map(cardHTML).join('');
    layout();
  }

  function layout() {
    const n = deck.length;
    track.querySelectorAll('.ix-card').forEach(card => {
      const i = +card.dataset.i;
      let d = i - active;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
      const ad = Math.abs(d);
      card.style.setProperty('--d', d);
      card.style.setProperty('--ad', ad);
      card.classList.toggle('is-center', d === 0);
      card.classList.toggle('is-off', ad > VISIBLE);
      card.toggleAttribute('inert', d !== 0);
      card.setAttribute('aria-hidden', d !== 0);
    });
    const item = deck[active];
    stage.classList.toggle('is-single', n < 2);
    if (live && item) live.textContent = `${item.name}, ${active + 1} of ${n}`;
  }

  const go = step => {
    if (deck.length < 2) return;
    active = (active + step + deck.length) % deck.length;
    layout();
  };

  $('#ixPrev').addEventListener('click', () => go(-1));
  $('#ixNext').addEventListener('click', () => go(1));
  stage.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  });
  // side cards are inert, so find them by position: a click on a card that is not the centre brings it forward
  stage.addEventListener('click', e => {
    const open = e.target.closest('[data-open]');
    if (open) { openDialog(open.dataset.open, open); return; }
    if (e.target.closest('.ix-arrow') || moved) return;
    const hit = document.elementsFromPoint(e.clientX, e.clientY).find(el => el.classList && el.classList.contains('ix-card'));
    if (hit && !hit.classList.contains('is-center')) { active = +hit.dataset.i; layout(); }
  });
  // swipe
  let downX = null, moved = false;
  stage.addEventListener('pointerdown', e => { downX = e.clientX; moved = false; }, { passive: true });
  stage.addEventListener('pointerup', e => {
    if (downX === null) return;
    const dx = e.clientX - downX; downX = null;
    if (Math.abs(dx) > 45) { moved = true; go(dx < 0 ? 1 : -1); }
  }, { passive: true });

  /* ---------- filters (shared by carousel and list) ---------- */
  const pills = [...document.querySelectorAll('.ix-filters [data-cat]')];
  const setMore = open => {
    moreMenu.hidden = !open;
    moreBtn.setAttribute('aria-expanded', open);
  };
  function setCat(next) {
    cat = next;
    pills.forEach(p => {
      const on = p.dataset.cat === cat;
      p.classList.toggle('is-on', on);
      p.setAttribute('aria-pressed', on);
    });
    const inMore = !!moreMenu.querySelector(`[data-cat="${cat}"]`);
    moreBtn.classList.toggle('is-on', inMore);
    moreLabel.textContent = inMore ? CAT_LABEL[cat] : 'More';
    const current = deck[active];
    deck = BOTANICAL_INGREDIENTS.filter(inCat);
    const keep = current ? deck.findIndex(x => x.id === current.id) : -1;
    active = keep >= 0 ? keep : 0;
    renderDeck();
    renderGrid();
  }
  pills.forEach(p => p.addEventListener('click', () => {
    const fromMenu = !!p.closest('.ix-more-menu');
    setCat(p.dataset.cat);
    setMore(false);
    if (fromMenu) moreBtn.focus();
  }));
  moreBtn.addEventListener('click', e => {
    e.stopPropagation();
    setMore(moreMenu.hidden);
    if (!moreMenu.hidden) moreMenu.querySelector('button').focus();
  });
  document.addEventListener('click', e => { if (!e.target.closest('.ix-more')) setMore(false); });
  moreMenu.addEventListener('keydown', e => {
    const items = [...moreMenu.querySelectorAll('button')], at = items.indexOf(document.activeElement);
    if (e.key === 'Escape') { setMore(false); moreBtn.focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); items[(at + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(at - 1 + items.length) % items.length].focus(); }
  });

  /* ---------- full list ---------- */
  const tileHTML = item => `
    <li class="ix-tile">
      <button class="ix-tile-btn" type="button" data-open="${item.id}">
        <span class="ix-tile-media${PHOTOS.has(item.id) ? ' is-photo' : ''}"><img src="${imgSrc(item)}" alt="" loading="lazy" decoding="async"></span>
        <span class="ix-tile-body">
          <span class="ix-tile-trad">${esc(item.tradition)}</span>
          <span class="ix-tile-name">${esc(item.name)}</span>
          <span class="ix-tile-latin">${esc(item.latin)}</span>
          <span class="ix-tile-meta">${esc(item.products.map(p => p.label).join(' · '))}${item.dose ? ` <em>${esc(item.dose)}</em>` : ''}</span>
        </span>
      </button>
    </li>`;

  function renderGrid() {
    const q = query.toLowerCase().trim();
    const list = BOTANICAL_INGREDIENTS.filter(item => inCat(item) && (!q || [
      item.name, item.latin, item.compound, item.target, item.tradition, item.part, item.dose,
      ...item.products.map(p => p.label)
    ].join(' ').toLowerCase().includes(q)));
    grid.innerHTML = list.length ? list.map(tileHTML).join('')
      : `<li class="ix-empty">No ingredients match &ldquo;${esc(query)}&rdquo;${cat !== 'all' ? ` in ${esc(CAT_LABEL[cat])}` : ''}.</li>`;
    count.innerHTML = `Showing ${list.length} of ${total}` +
      (cat !== 'all' ? ` &middot; ${esc(CAT_LABEL[cat])} <button type="button" class="ix-clear" data-clear>Show all</button>` : '');
  }
  search.addEventListener('input', () => { query = search.value; renderGrid(); });
  count.addEventListener('click', e => { if (e.target.closest('[data-clear]')) setCat('all'); });
  grid.addEventListener('click', e => { const t = e.target.closest('[data-open]'); if (t) openDialog(t.dataset.open, t); });

  /* ---------- details dialog ---------- */
  let returnTo = null;
  function openDialog(id, from) {
    const item = BOTANICAL_INGREDIENTS.find(x => x.id === id);
    if (!item || !dialog) return;
    returnTo = from || document.activeElement;
    const spec = (k, v) => v ? `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>` : '';
    dialogBody.innerHTML = `
      <div class="ix-dlg-media${PHOTOS.has(item.id) ? ' is-photo' : ''}"><img src="${imgSrc(item)}" alt="${esc(item.name)}"></div>
      <div class="ix-dlg-text">
        <span class="ix-badge">${LEAF}${esc(item.tradition)}</span>
        <h2 id="ixDlgName">${esc(item.name)}</h2>
        <p class="ix-latin">${esc(item.latin)}</p>
        <p class="ix-dlg-desc">${esc(item.desc)}</p>
        <dl class="ix-dlg-specs">
          ${spec('Part used', item.part)}${spec('Key compound', item.compound)}${spec('Dose', item.dose)}${spec('Supports', item.target)}
        </dl>
        <p class="ix-dlg-cats">${item.category.map(c => `<span>${esc(CAT_LABEL[c] || c)}</span>`).join('')}</p>
        <h3>Found in</h3>
        <p class="ix-dlg-products">${item.products.map(p => `<a href="product-details.html?id=${p.id}">${esc(p.label)} ${ARROW}</a>`).join('')}</p>
      </div>`;
    dialog.showModal();
    document.documentElement.classList.add('ix-dialog-open');
  }
  if (dialog) {
    $('#ixDialogX').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });   // backdrop
    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('ix-dialog-open');
      if (returnTo && document.contains(returnTo)) returnTo.focus();
    });
  }

  renderDeck();
  renderGrid();
}

function init() {
  initSiteChrome();
  initIngredients();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

export { init as initIngredientsPage };
