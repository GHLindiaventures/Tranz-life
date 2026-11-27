// The login window, like a big shop's: (1) mobile number, or email address ("Use email instead"), (2) the 6-digit
// code sent by SMS or email, which verifies by itself once all six digits are in, (3) for a new customer, their name.
// No passwords.
//   openLogin({ reason }) -> Promise of the logged-in customer, or null when the window is closed
import { state } from '../../app/state.js';
import { toast } from '../../components/toast.js';
import { $, $$ } from '../../utils/dom.js';
import { esc } from '../../utils/html.js';
import { account, emailLogin, setUser } from './account-state.js';

const REASON = 'Get to your orders, saved addresses and a faster checkout.';
const HELP = {
  phone:"We'll text you a 6-digit code. New here? The same code creates your account.",
  email:"We'll email you a 6-digit code. New here? The same code creates your account."
};
const spaced = phone => `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;

let box = null, method = 'phone', login = null, user = null, busy = false, countdown = 0, resolveOpen = null, lastFocus = null;

function template(){
  return `
  <div class="lg-scrim" data-lg-close></div>
  <div class="lg-panel" role="dialog" aria-modal="true" aria-labelledby="lgTitle" data-lenis-prevent>
    <button class="lg-x" type="button" data-lg-close aria-label="Close login">×</button>
    <aside class="lg-side">
      <h3 id="lgTitle">Login</h3>
      <p data-lg-reason>${REASON}</p>
      <ul class="lg-perks">
        <li>Track every order, step by step</li>
        <li>Saved delivery addresses</li>
        <li data-lg-perk>No password: a code by SMS</li>
      </ul>
    </aside>
    <div class="lg-main">
      <form class="lg-step" data-step="start" novalidate>
        <div class="lg-by" data-by="phone">
          <label class="lg-label" for="lg-phone">Mobile number</label>
          <div class="lg-phone"><span aria-hidden="true">+91</span><input id="lg-phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="14" placeholder="98765 43210" aria-describedby="lg-help"></div>
        </div>
        <div class="lg-by" data-by="email" hidden>
          <label class="lg-label" for="lg-mail">Email address</label>
          <input id="lg-mail" class="lg-input" type="email" inputmode="email" autocomplete="email" maxlength="120" placeholder="you@example.com" aria-describedby="lg-help">
        </div>
        <button class="lg-switch" type="button" data-lg-switch hidden></button>
        <p class="lg-fine" id="lg-help" data-lg-help>${HELP.phone}</p>
        <button class="lg-cta" type="submit">Request code</button>
      </form>

      <form class="lg-step" data-step="code" novalidate hidden>
        <p class="lg-sent">Enter the code sent to <b data-lg-to></b> <button type="button" class="lg-link" data-lg-change>Change</button></p>
        <label class="sr" for="lg-code">6-digit code</label>
        <input id="lg-code" class="lg-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="······">
        <p class="lg-test" data-lg-test hidden></p>
        <button class="lg-cta" type="submit">Verify</button>
        <p class="lg-resend"><span data-lg-wait></span><button type="button" class="lg-link" data-lg-resend hidden>Resend code</button></p>
      </form>

      <form class="lg-step" data-step="name" novalidate hidden>
        <p class="lg-hi">Welcome to TranzLife!</p>
        <label class="lg-label" for="lg-name">What should we call you?</label>
        <input id="lg-name" class="lg-input" autocomplete="name" maxlength="80" placeholder="Your full name">
        <div class="lg-by" data-lg-contact>
          <label class="lg-label" for="lg-email">Email <small>(optional, for order updates)</small></label>
          <input id="lg-email" class="lg-input" type="email" autocomplete="email" maxlength="120" placeholder="you@example.com">
        </div>
        <button class="lg-cta" type="submit">Continue</button>
        <button class="lg-link lg-skip" type="button" data-lg-skip>Skip for now</button>
      </form>

      <p class="lg-err" role="alert" hidden></p>
    </div>
  </div>`;
}

// ---------- small helpers ----------
const showError = msg => { const e = $('.lg-err', box); e.hidden = !msg; e.textContent = msg || ''; };
function setBusy(on){
  busy = on;
  $$('.lg-cta', box).forEach(b => { b.disabled = on; b.classList.toggle('busy', on); });
}
function showStep(name){
  $$('.lg-step', box).forEach(f => { f.hidden = f.dataset.step !== name; });
  showError('');
  const first = $$(`[data-step="${name}"] input`, box).find(i => !i.closest('[hidden]'));
  setTimeout(() => first?.focus(), 30);
}

// mobile number or email address on the first step
function useMethod(next){
  method = next;
  $$('[data-by]', box).forEach(el => { el.hidden = el.dataset.by !== method; });
  const sw = $('[data-lg-switch]', box);
  sw.hidden = !emailLogin();
  sw.textContent = method === 'phone' ? 'Use email instead' : 'Use mobile number instead';
  $('[data-lg-help]', box).textContent = HELP[method];
  showError('');
  setTimeout(() => $(method === 'phone' ? '#lg-phone' : '#lg-mail', box).focus(), 30);
}

function startCountdown(seconds){
  clearInterval(countdown);
  const wait = $('[data-lg-wait]', box), resend = $('[data-lg-resend]', box);
  let left = seconds;
  const tick = () => {
    resend.hidden = left > 0;
    wait.textContent = left > 0 ? `Resend code in 0:${String(left).padStart(2, '0')}` : "Didn't get it? ";
    if (left-- <= 0) clearInterval(countdown);
  };
  tick(); countdown = setInterval(tick, 1000);
}

// ---------- the three steps ----------
async function requestCode(e){
  e?.preventDefault(); if (busy) return;
  setBusy(true); showError('');
  try {
    const ask = login || (method === 'email' ? { email:$('#lg-mail', box).value } : { phone:$('#lg-phone', box).value });
    const r = await account.requestCode(ask);
    login = r.kind === 'email' ? { email:r.to } : { phone:r.to };
    $('[data-lg-to]', box).textContent = r.kind === 'email' ? r.to : spaced(r.to);
    const test = $('[data-lg-test]', box);
    test.hidden = !r.testCode;
    if (r.testCode) test.innerHTML = `<b>Test mode</b> No ${r.kind === 'email' ? 'email' : 'SMS'} is sent. Your code is <code>${esc(r.testCode)}</code>`;
    $('#lg-code', box).value = '';
    showStep('code'); startCountdown(r.resendIn || 30);
  } catch(err){ showError(err.message); }
  finally { setBusy(false); }
}

async function verifyCode(e){
  e?.preventDefault(); if (busy) return;
  const input = $('#lg-code', box);
  if (input.value.length < 6) return showError('Enter all 6 digits of the code.');
  setBusy(true); showError('');
  try {
    const r = await account.verifyCode(login, input.value);
    user = setUser(r.user);
    if (user.name) return finish(`Welcome back, ${user.name.split(' ')[0]}`);
    $('[data-lg-contact]', box).hidden = !!user.loginEmail; // they logged in with their email: no need to ask for it
    showStep('name');
  } catch(err){
    showError(err.message); input.value = ''; input.focus();
  } finally { setBusy(false); }
}

async function saveName(e){
  e.preventDefault(); if (busy) return;
  setBusy(true); showError('');
  try {
    const email = user.loginEmail ? user.email : $('#lg-email', box).value;
    user = setUser(await account.saveProfile({ name:$('#lg-name', box).value, email, gender:user.gender }));
    finish(`Welcome, ${user.name.split(' ')[0]}`);
  } catch(err){ showError(err.message); }
  finally { setBusy(false); }
}

// ---------- opening and closing ----------
function finish(message){
  if (message) toast(message);
  close(user);
}

function close(result = null){
  if (!box || box.hidden) return;
  clearInterval(countdown);
  box.classList.remove('open');
  document.documentElement.classList.remove('lg-open');
  setTimeout(() => { if (!box.classList.contains('open')) box.hidden = true; }, 300);
  state.lenis?.start();
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  resolveOpen?.(result); resolveOpen = null;
}

// keeps Tab inside the window while it is open
function trapFocus(e){
  if (e.key === 'Escape') return close();
  if (e.key !== 'Tab') return;
  const items = $$('button, input', box).filter(el => !el.disabled && el.offsetParent);
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
}

function build(){
  box = document.createElement('div');
  box.className = 'lg'; box.hidden = true; box.innerHTML = template();
  document.body.appendChild(box);
  $('[data-step="start"]', box).addEventListener('submit', requestCode);
  $('[data-step="code"]', box).addEventListener('submit', verifyCode);
  $('[data-step="name"]', box).addEventListener('submit', saveName);
  $('#lg-code', box).addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    if (e.target.value.length === 6) verifyCode();
  });
  $('[data-lg-switch]', box).addEventListener('click', () => useMethod(method === 'phone' ? 'email' : 'phone'));
  $('[data-lg-change]', box).addEventListener('click', () => { clearInterval(countdown); login = null; showStep('start'); useMethod(method); });
  $('[data-lg-resend]', box).addEventListener('click', () => requestCode());
  $('[data-lg-skip]', box).addEventListener('click', () => finish(''));
  box.addEventListener('click', e => { if (e.target.closest('[data-lg-close]')) close(); });
  box.addEventListener('keydown', trapFocus);
}

function openLogin({ reason } = {}){
  if (!box) build();
  close(); // a window already open settles as closed
  login = null; user = null;
  ['#lg-phone', '#lg-mail', '#lg-name', '#lg-email'].forEach(id => { $(id, box).value = ''; });
  $('[data-lg-reason]', box).textContent = reason || REASON;
  $('[data-lg-perk]', box).textContent = emailLogin() ? 'No password: a code by SMS or email' : 'No password: a code by SMS';
  lastFocus = document.activeElement;
  box.hidden = false;
  document.documentElement.classList.add('lg-open');
  requestAnimationFrame(() => box.classList.add('open'));
  state.lenis?.stop();
  showStep('start');
  useMethod('phone');
  return new Promise(resolve => { resolveOpen = resolve; });
}

export { openLogin };
