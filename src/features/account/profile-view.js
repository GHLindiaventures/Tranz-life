// Profile information on the account page: name, gender and email. The mobile number is how the customer logs in,
// so it is shown but not edited here.
import { toast } from '../../components/toast.js';
import { $ } from '../../utils/dom.js';
import { esc } from '../../utils/html.js';
import { account, currentUser, setUser } from './account-state.js';
import { showFieldError } from './form-errors.js';

function renderProfile(main){
  const u = currentUser();
  const gender = (value, label) => `<label class="ac-radio"><input type="radio" name="gender" value="${value}"${u.gender === value ? ' checked' : ''}><span>${label}</span></label>`;
  main.innerHTML = `
    <h1 class="ac-h">Profile information</h1>
    <form class="ac-card ac-form" novalidate>
      <div class="ac-field full"><label for="pf-name">Full name</label><input id="pf-name" name="name" autocomplete="name" maxlength="80" value="${esc(u.name)}"><small class="ac-ferr" data-for="name"></small></div>
      <fieldset class="ac-field full"><legend>Gender</legend><div class="ac-radios">${gender('female', 'Female')}${gender('male', 'Male')}${gender('', 'Prefer not to say')}</div></fieldset>
      <div class="ac-field full"><label for="pf-email">Email address</label><input id="pf-email" name="email" type="email" autocomplete="email" maxlength="120" value="${esc(u.email)}" placeholder="you@example.com"><small class="ac-ferr" data-for="email"></small></div>
      <div class="ac-field full"><label for="pf-phone">Mobile number</label><input id="pf-phone" value="+91 ${esc(u.phone)}" readonly><small class="ac-hint">You log in with this number.</small></div>
      <button class="ac-btn" type="submit">Save changes</button>
    </form>`;

  const form = $('form', main);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('button[type="submit"]', form), data = Object.fromEntries(new FormData(form));
    showFieldError(form, null);
    btn.disabled = true;
    try { setUser(await account.saveProfile(data)); toast('Profile saved'); }
    catch(err){ showFieldError(form, err); }
    finally { btn.disabled = false; }
  });
}

export { renderProfile };
