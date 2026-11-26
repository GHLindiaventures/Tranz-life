// Who is logged in, shared by every part of the page (the account menu, the checkout, the account page).
//   account            the account API (account-api.js)
//   ready              Promise, settles once the page knows who is logged in
//   currentUser()      the logged-in customer, or null
//   loginMode()        'twilio' | 'test' | 'demo', or null when login is switched off
//   onUser(fn)         calls fn(user) now and after every login, logout or account change; returns an unsubscribe
//   setUser(user)      after logging in or changing the account
import { createAccountApi } from './account-api.js';

const account = createAccountApi();
const listeners = new Set();
let user = null, mode = null;

function setUser(next){
  user = next || null;
  listeners.forEach(fn => fn(user));
  return user;
}

const ready = account.me()
  .then(r => { mode = r.login ?? null; return setUser(r.user); })
  .catch(() => null); // backend unreachable: the page works as logged out

const currentUser = () => user;
const loginMode = () => mode;

function onUser(fn){
  listeners.add(fn);
  fn(user);
  return () => listeners.delete(fn);
}

async function logout(){
  try { await account.logout(); } finally { setUser(null); }
}

export { account, ready, currentUser, loginMode, onUser, setUser, logout };
