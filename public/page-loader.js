/* TranzLife page loader: a DNA double helix on a cream screen between pages.
 *
 * Loaded (not as a module) at the top of every page's <head>, so it runs before the first paint:
 *  - leaving: a click on a link to another page of the site shows the screen and starts navigating almost at once
 *    (LEAVE_MS), so the next page loads while the helix plays instead of after it
 *  - arriving: if we came from a site link, the screen is up from the very first frame and fades out when the page's
 *    scripts have run (DOMContentLoaded), held at least MIN_MS and at most MAX_MS
 * The helix is made of plain elements animated with CSS transforms only, which the browser runs on the compositor:
 * it stays smooth even while the new page's scripts keep the main thread busy.
 * Off for visitors who prefer reduced motion. Coming back with the Back button never leaves it stuck. */
(function () {
  var LEAVE_MS = 90, MIN_MS = 180, MAX_MS = 900, KEY = 'tl-pt';
  var root = document.documentElement;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };

  /* ---------- styles ---------- */
  var N = 12, DUR = 1.8;            // beads per strand, seconds per full twist
  var outSine = 'cubic-bezier(.61,1,.88,1)', inSine = 'cubic-bezier(.12,0,.39,0)';
  var css = ''
    + '#tl-pt{position:fixed;inset:0;z-index:2147483000;display:grid;place-content:center;justify-items:center;gap:20px;'
    + 'background:radial-gradient(60% 60% at 50% 45%,#fbfaf2 0%,#eef2e6 60%,#e2eada 100%);'
    + 'opacity:0;visibility:hidden;pointer-events:none;transition:opacity .32s ease,visibility 0s linear .32s}'
    + 'html.pt-show #tl-pt{opacity:1;visibility:visible;pointer-events:auto;transition:opacity .18s ease,visibility 0s}'
    + '#tl-pt .dna{display:flex;gap:clamp(8px,1vw,12px);height:68px}'
    + '#tl-pt .c{position:relative;width:9px;height:68px}'
    + '#tl-pt .a,#tl-pt .b{position:absolute;left:0;top:30px;width:9px;height:9px;border-radius:50%;'
    + 'animation:tlpt-bead ' + DUR + 's infinite both;will-change:transform}'
    + '#tl-pt .a{background:#24502a}#tl-pt .b{background:#c99a3a}'
    + '#tl-pt .r{position:absolute;left:3.5px;top:13px;width:2px;height:42px;border-radius:2px;background:#8cb86a;opacity:.6;'
    + 'animation:tlpt-rung ' + DUR + 's infinite both;will-change:transform}'
    // a bead: up and down a sine (y), larger when it swings to the front, smaller at the back
    + '@keyframes tlpt-bead{'
    + '0%{transform:translateY(0) scale(1.3);animation-timing-function:' + outSine + '}'
    + '25%{transform:translateY(-21px) scale(.85);animation-timing-function:' + inSine + '}'
    + '50%{transform:translateY(0) scale(.45);animation-timing-function:' + outSine + '}'
    + '75%{transform:translateY(21px) scale(.85);animation-timing-function:' + inSine + '}'
    + '100%{transform:translateY(0) scale(1.3)}}'
    // a rung joins the two beads of a column: its length follows |sin|
    + '@keyframes tlpt-rung{'
    + '0%,50%,100%{transform:scaleY(0);animation-timing-function:' + outSine + '}'
    + '25%,75%{transform:scaleY(1);animation-timing-function:' + inSine + '}}'
    + '#tl-pt .t{font:700 11px/1 Arial,Helvetica,sans-serif;letter-spacing:.42em;padding-left:.42em;color:#4c6648}';
  var style = document.createElement('style');
  style.id = 'tl-page-loader';
  style.textContent = css;
  (document.head || root).appendChild(style);

  /* ---------- the screen (added to <html> right away, so it can show before <body> exists) ---------- */
  var cols = '';
  for (var i = 0; i < N; i++) {
    var d = (-i * DUR / N).toFixed(3);   // each column a step further along the twist
    cols += '<div class="c"><i class="r" style="animation-delay:' + d + 's"></i>'
      + '<b class="a" style="animation-delay:' + d + 's"></b>'
      + '<b class="b" style="animation-delay:' + (d - DUR / 2).toFixed(3) + 's"></b></div>';
  }
  var screen = document.createElement('div');
  screen.id = 'tl-pt';
  screen.setAttribute('aria-hidden', 'true');
  screen.innerHTML = '<div class="dna">' + cols + '</div><span class="t">TRANZLIFE</span>';
  root.appendChild(screen);

  /* ---------- arriving ---------- */
  if (store.get(KEY) === '1') {
    store.del(KEY);
    root.classList.add('pt-show');
    var t0 = Date.now(), done = false;
    var hide = function () {
      if (done) return; done = true;
      setTimeout(function () { root.classList.remove('pt-show'); }, Math.max(0, MIN_MS - (Date.now() - t0)));
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hide); else hide();
    setTimeout(hide, MAX_MS);
  }

  /* ---------- leaving ---------- */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.hasAttribute('download') || (a.target && a.target !== '_self')) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
    if (url.pathname === location.pathname && url.search === location.search) return;   // same page / #anchor
    if (!/(\.html|\/)$/.test(url.pathname)) return;                                       // files, images, etc.
    e.preventDefault();
    store.set(KEY, '1');
    store.set('tl-intro-seen', '1');    // arriving at Home from another page: no "GROWING" loader on top
    root.classList.add('pt-show');
    setTimeout(function () { location.href = url.href; }, LEAVE_MS);
  });

  // Back / Forward restores a page from memory with the screen still up: take it down
  window.addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('pt-show'); });
})();
