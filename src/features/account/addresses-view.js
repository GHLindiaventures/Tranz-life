// Manage addresses on the account page: the address book (up to 10), with add, edit, delete and "make default".
// The default address is filled in for the customer at checkout.
import { toast } from '../../components/toast.js';
import { STATES } from '../../data/shipping.js';
import { $ } from '../../utils/dom.js';
import { esc } from '../../utils/html.js';
import { account, currentUser, setUser } from './account-state.js';
import { showFieldError } from './form-errors.js';

const EMPTY = { name:'', phone:'', address:'', landmark:'', city:'', state:'', pincode:'', label:'home' };

function addressForm(a, id = ''){
  const field = (name, label, attrs = '', full = false) =>
    `<div class="ac-field${full ? ' full' : ''}"><label for="ad-${name}">${label}</label><input id="ad-${name}" name="${name}" value="${esc(a[name])}" ${attrs}><small class="ac-ferr" data-for="${name}"></small></div>`;
  const label = (value, text) => `<label class="ac-radio"><input type="radio" name="label" value="${value}"${a.label === value ? ' checked' : ''}><span>${text}</span></label>`;
  return `<form class="ac-card ac-form ac-addr-form" data-id="${esc(id)}" novalidate>
    <h2 class="ac-sub">${id ? 'Edit address' : 'Add a new address'}</h2>
    <div class="ac-grid">
      ${field('name', 'Full name', 'autocomplete="name" maxlength="80"')}
      ${field('phone', '10-digit mobile number', 'type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="14"')}
      ${field('pincode', 'PIN code', 'inputmode="numeric" autocomplete="postal-code" maxlength="6"')}
      <div class="ac-field"><label for="ad-state">State</label><select id="ad-state" name="state" autocomplete="address-level1"><option value="">Choose the state</option>${STATES.map(s => `<option${s === a.state ? ' selected' : ''}>${s}</option>`).join('')}</select><small class="ac-ferr" data-for="state"></small></div>
      ${field('address', 'Address (house no., street, area)', 'autocomplete="street-address" maxlength="200"', true)}
      ${field('city', 'City / town', 'autocomplete="address-level2" maxlength="60"')}
      ${field('landmark', 'Landmark (optional)', 'maxlength="80"')}
    </div>
    <fieldset class="ac-field full"><legend>Address type</legend><div class="ac-radios">${label('home', 'Home')}${label('work', 'Work')}</div></fieldset>
    <div class="ac-actions"><button class="ac-btn" type="submit">Save</button><button class="ac-btn ghost" type="button" data-cancel>Cancel</button></div>
  </form>`;
}

function addressCard(a){
  return `<article class="ac-card ac-address" data-id="${esc(a.id)}">
    <p class="ac-tags"><span class="ac-tag">${a.label === 'work' ? 'Work' : 'Home'}</span>${a.isDefault ? '<span class="ac-tag def">Default</span>' : ''}</p>
    <p class="ac-addr"><b>${esc(a.name)} <span>+91 ${esc(a.phone)}</span></b>${esc(a.address)}${a.landmark ? `, near ${esc(a.landmark)}` : ''}<br>${esc(a.city)}, ${esc(a.state)} ${esc(a.pincode)}</p>
    <p class="ac-actions">
      <button class="ac-link" type="button" data-edit>Edit</button>
      ${a.isDefault ? '' : '<button class="ac-link" type="button" data-default>Make default</button>'}
      <button class="ac-link bad" type="button" data-delete>Delete</button>
    </p>
  </article>`;
}

function renderAddresses(main){
  const list = () => currentUser().addresses;
  const draw = (formFor = null) => {
    const editing = formFor && formFor !== 'new' ? formFor : null;
    main.innerHTML = `
      <h1 class="ac-h">Manage addresses</h1>
      ${formFor === 'new' ? addressForm(EMPTY) : `<button class="ac-card ac-add" type="button" data-add>+ Add a new address</button>`}
      <div class="ac-list">${list().map(a => a.id === editing ? addressForm(a, a.id) : addressCard(a)).join('')}</div>
      ${!list().length && formFor !== 'new' ? '<p class="ac-loading">No saved addresses yet. Addresses you deliver to while logged in are saved here too.</p>' : ''}`;
    $('form input', main)?.focus();
  };

  // runs an account change, then shows the new address book
  async function change(run, done){
    try { setUser(await run()); toast(done); draw(); }
    catch(err){ toast(err.message); }
  }

  main.onclick = e => {
    const card = e.target.closest('[data-id]'), id = card?.dataset.id;
    if (e.target.closest('[data-add]')) draw('new');
    else if (e.target.closest('[data-cancel]')) draw();
    else if (e.target.closest('[data-edit]')) draw(id);
    else if (e.target.closest('[data-default]')) change(() => account.makeDefault(id), 'Default address changed');
    else if (e.target.closest('[data-delete]') && confirm('Delete this address?')) change(() => account.deleteAddress(id), 'Address deleted');
  };
  main.onsubmit = async e => {
    e.preventDefault();
    const form = e.target, id = form.dataset.id, data = Object.fromEntries(new FormData(form)), btn = $('button[type="submit"]', form);
    showFieldError(form, null); btn.disabled = true;
    try {
      setUser(await (id ? account.editAddress(id, data) : account.addAddress(data)));
      toast(id ? 'Address updated' : 'Address saved');
      draw();
    } catch(err){ showFieldError(form, err); btn.disabled = false; }
  };
  draw();
}

export { renderAddresses };
