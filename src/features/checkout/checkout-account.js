// The account strip at the top of the checkout's delivery step. Login is optional: guests just fill in the form.
//   logged out: "Log in to use your saved addresses and keep this order in My Orders" with a Log in button
//   logged in:  the saved addresses to pick from; the default one is filled in, and the order goes to My Orders
// initCheckoutAccount(form) -> { refresh() }   refresh() when the checkout opens
// recordOrder(order, status) keeps a test-mode order in My Orders (the real backend links orders by itself)
import { $ } from '../../utils/dom.js';
import { esc } from '../../utils/html.js';
import { account, currentUser, loginMode, onUser } from '../account/account-state.js';
import { openLogin } from '../account/login-dialog.js';

const ADDRESS_FIELDS = ['name', 'phone', 'address', 'city', 'state', 'pincode'];
const oneLine = a => `${a.address}${a.landmark ? `, near ${a.landmark}` : ''}`;

function initCheckoutAccount(form){
  const bar = $('[data-co-acct]', form), saved = $('[data-co-saved]', form);
  const field = name => form.elements[name];
  let picked = null; // the saved address in the form ('' for a new address), kept when the list is drawn again

  // puts a saved address (and the account's email) into the form
  function fill(a, user){
    picked = a.id;
    const values = { name:a.name, phone:a.phone, address:oneLine(a), city:a.city, state:a.state, pincode:a.pincode };
    ADDRESS_FIELDS.forEach(k => { field(k).value = values[k]; field(k).removeAttribute('aria-invalid'); });
    if (user.email && !field('email').value) field('email').value = user.email;
  }
  const formIsEmpty = () => ADDRESS_FIELDS.every(k => !field(k).value.trim());

  function draw(user){
    const mode = loginMode();
    bar.hidden = !user && !mode;
    bar.innerHTML = user
      ? `<span>Logged in as <b>${esc(user.name || `+91 ${user.phone}`)}</b>. This order will be in My Orders.</span>`
      : `<span>Have an account? Log in to use your saved addresses and keep this order in My Orders.</span><button class="co-link" type="button" data-co-login>Log in</button>`;
    const list = user?.addresses || [];
    saved.hidden = !list.length;
    const radio = (value, body) => `<label><input type="radio" name="savedAddress" value="${esc(value)}"${picked === value ? ' checked' : ''}><span>${body}</span></label>`;
    saved.innerHTML = list.length ? `<legend>Deliver to</legend>${list.map(a =>
      radio(a.id, `<b>${esc(a.name)} · ${a.label === 'work' ? 'Work' : 'Home'}${a.isDefault ? ' · Default' : ''}</b>${esc(oneLine(a))}, ${esc(a.city)} ${esc(a.pincode)}`)).join('')}
      ${radio('', '<b>A new address</b>Type it below')}` : '';
  }

  // logged in with an empty form: start from the default address
  function useDefault(user){
    const def = user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0];
    if (!def || !formIsEmpty()) return;
    fill(def, user);
    draw(user);
  }

  function refresh(){
    const user = currentUser();
    if (!user) picked = null;
    draw(user);
    useDefault(user);
  }

  onUser(refresh);
  bar.addEventListener('click', e => {
    if (e.target.closest('[data-co-login]')) openLogin({ reason:'Log in to use your saved addresses and keep this order in My Orders.' });
  });
  saved.addEventListener('change', e => {
    const user = currentUser(), a = user?.addresses.find(x => x.id === e.target.value);
    if (a) fill(a, user);
    else { picked = ''; ADDRESS_FIELDS.forEach(k => { field(k).value = ''; }); field('name').focus(); }
  });
  return { refresh };
}

function recordOrder(order, status){
  if (account.mode === 'demo' && currentUser()) account.recordOrder(order, status);
}

export { initCheckoutAccount, recordOrder };
