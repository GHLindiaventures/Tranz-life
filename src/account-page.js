// The account page (account.html): My Orders, Profile information and Manage addresses, with a sidebar like a big
// shop's account area. The part after # picks the view: #orders, #orders/TL-…, #profile, #addresses.
// Logged out, the page asks the customer to log in.
import { initAccountMenu } from './features/account/account-menu.js';
import { currentUser, logout, onUser, ready } from './features/account/account-state.js';
import { renderAddresses } from './features/account/addresses-view.js';
import { openLogin } from './features/account/login-dialog.js';
import { renderOrders } from './features/account/orders-view.js';
import { renderProfile } from './features/account/profile-view.js';
import { toast } from './components/toast.js';
import { $, $$ } from './utils/dom.js';

const VIEWS = { orders:renderOrders, profile:renderProfile, addresses:renderAddresses };
const main = $('#acMain'), side = $('#acSide');

// "#orders/TL-261126-ABCD2345" -> { view:'orders', ref:'TL-261126-ABCD2345' }
function readHash(){
  const [view, ref] = location.hash.replace(/^#/, '').split('/');
  return { view:VIEWS[view] ? view : 'orders', ref:ref ? decodeURIComponent(ref) : null };
}

function loggedOut(){
  side.hidden = true;
  main.innerHTML = `<div class="ac-card ac-empty ac-welcome">
    <h1 class="ac-h">Your TranzLife account</h1>
    <p>Log in with your mobile number to see your orders, follow their delivery and keep your addresses for a faster checkout.</p>
    <button class="ac-btn" type="button" data-login>Log in with your mobile number</button>
  </div>`;
}

function route(){
  const user = currentUser();
  if (!user) return loggedOut();
  side.hidden = false;
  const { view, ref } = readHash();
  $$('[data-view]', side).forEach(a => a.toggleAttribute('aria-current', a.dataset.view === view));
  main.onclick = main.onsubmit = null; // each view sets its own
  VIEWS[view](main, ref);
  main.focus({ preventScroll:true });
}

function showCustomer(user){
  $('[data-ac-name]', side).textContent = user?.name || 'TranzLife customer';
  $('[data-ac-initial]', side).textContent = (user?.name || user?.phone || '?').charAt(0).toUpperCase();
}

async function start(){
  initAccountMenu();
  await ready;
  let wasIn = !!currentUser();
  onUser(user => {
    showCustomer(user);
    if (!!user !== wasIn){ wasIn = !!user; route(); } // logged in or out: draw the page again
  });
  window.addEventListener('hashchange', route);
  document.addEventListener('click', e => {
    if (e.target.closest('[data-login]')) openLogin({ reason:'Log in to see your orders and saved addresses.' });
    if (e.target.closest('[data-retry]')) route();
  });
  $('[data-logout]', side).addEventListener('click', async () => { await logout(); toast("You're logged out"); });
  route();
}

start();
