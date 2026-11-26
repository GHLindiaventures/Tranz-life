// The person icon in the top bar, on every page. Logged out, it opens the login window. Logged in, it shows the
// customer's initial and opens a menu: their name and number, My Orders, My Profile, Saved addresses and Log out.
import { toast } from '../../components/toast.js';
import { $ } from '../../utils/dom.js';
import { currentUser, loginMode, logout, onUser, ready } from './account-state.js';
import { openLogin } from './login-dialog.js';

const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONS = {
  person:svg('<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4"/>'),
  orders:svg('<path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>'),
  profile:svg('<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16.2c.7-1.5 1.8-2.2 3.2-2.2s2.5.7 3.2 2.2M14.5 10h3.5M14.5 13.5h3.5"/>'),
  pin:svg('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
  out:svg('<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M10 16.5 5.5 12 10 7.5M5.5 12H15"/>')
};
const PAGE = 'account.html';

function initAccountMenu(){
  const slot = $('#nav .nav-act');
  if (!slot) return;
  const wrap = document.createElement('div');
  wrap.className = 'acct';
  wrap.hidden = true; // shown once we know whether login is on
  wrap.innerHTML = `
    <button class="acct-btn" type="button" aria-label="Log in">${ICONS.person}<b class="acct-initial" aria-hidden="true"></b></button>
    <div class="acct-menu" id="acctMenu" hidden>
      <p class="acct-hi"><span>Hello,</span><b data-acct-name></b><small data-acct-phone></small></p>
      <a href="${PAGE}#orders">${ICONS.orders}My Orders</a>
      <a href="${PAGE}#profile">${ICONS.profile}My Profile</a>
      <a href="${PAGE}#addresses">${ICONS.pin}Saved addresses</a>
      <button type="button" data-acct-logout>${ICONS.out}Log out</button>
    </div>`;
  slot.insertBefore(wrap, slot.firstChild);
  const btn = $('.acct-btn', wrap), menu = $('.acct-menu', wrap);

  const setOpen = open => {
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', open);
    if (open) $('a', menu).focus();
  };

  onUser(user => {
    wrap.classList.toggle('in', !!user);
    btn.setAttribute('aria-label', user ? 'Your account' : 'Log in');
    if (user){
      btn.setAttribute('aria-controls', 'acctMenu'); btn.setAttribute('aria-expanded', !menu.hidden);
    } else {
      btn.removeAttribute('aria-controls'); btn.removeAttribute('aria-expanded'); menu.hidden = true;
    }
    $('.acct-initial', wrap).textContent = (user?.name || user?.phone || '').trim().charAt(0).toUpperCase() || '';
    $('[data-acct-name]', wrap).textContent = user?.name || 'TranzLife customer';
    $('[data-acct-phone]', wrap).textContent = user ? `+91 ${user.phone}` : '';
    wrap.hidden = !user && !loginMode();
  });
  ready.then(() => { wrap.hidden = !currentUser() && !loginMode(); });

  btn.addEventListener('click', () => {
    if (!currentUser()) return openLogin();
    setOpen(menu.hidden);
  });
  $('[data-acct-logout]', wrap).addEventListener('click', async () => {
    setOpen(false);
    await logout();
    toast("You're logged out");
  });
  menu.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('pointerdown', e => { if (!menu.hidden && !wrap.contains(e.target)) setOpen(false); });
  wrap.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden){ setOpen(false); btn.focus(); } });
}

export { initAccountMenu };
