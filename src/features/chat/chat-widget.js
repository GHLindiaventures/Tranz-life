// "Tulsi" wellness chat: a floating button that opens a chat panel. Replies stream from the chat API
// (server/chat-api.js, built into the site's server, which talks to a local Ollama model). Recommended products appear as cards
// from the brochure catalogue (src/data/catalog.js), with an "Enquire" button that opens the contact form.
import '../../styles/components/chat.css';   // the chat brings its own styles, so every page (whatever its stylesheet) gets it
import { CATALOG } from '../../data/catalog.js';
import { PRODUCTS } from '../../data/products.js';
import { $ } from '../../utils/dom.js';

const API = (import.meta.env.VITE_CHAT_API || '') + '/api/chat';
const STORE = 'tl-chat-v1';
const UI = 'tl-chat-ui';            // open / min / closed, kept while the visitor moves between pages (this visit)
const TEASED = 'tl-chat-teased';    // the welcome bubble shows once per visit
const TEASE_AFTER = 8000, TEASE_FOR = 8000, TYPE_FOR = 1200;   // ms: wait before it, how long it stays, the "typing" dots
const WELCOME = 'Hi, I\'m Tulsi, TranzLife\'s wellness assistant 🌿 Tell me what\'s been bothering you, and I\'ll suggest the TranzLife product that may help, along with simple, natural care tips. You can also ask me about our products and their ingredients. Type in English, Tamil or Tanglish, and I\'ll reply in simple English. I share general wellness guidance, not medical advice.';
const CHIPS = ['Period cramps', 'Stressed at work', 'Dry, cracked feet', 'Always tired', 'Liver care', 'Can\'t sleep well'];

const LEAF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19c3-4 6-7 10-9"/></svg>';
const SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';

let msgs = [], busy = false, els;

const esc = s => s.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

// light formatting: **bold**, "- " lists, paragraphs. Any [[tags]] or stray brackets from the model are dropped.
function format(text){
  const clean = text.replace(/\[\[[^\]]*\]?\]?/g, '').replace(/\[\[?$/, '').trim();
  return clean.split(/\n{2,}/).map(block => {
    const lines = block.split('\n').map(l => esc(l).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'));
    if (lines.every(l => /^\s*[-*•]\s/.test(l))) return `<ul>${lines.map(l => `<li>${l.replace(/^\s*[-*•]\s/, '')}</li>`).join('')}</ul>`;
    return `<p>${lines.join('<br>')}</p>`;
  }).join('');
}

// quick replies suggested by the server with a clarifying question
const suggestRow = list => list && list.length ? `<div class="ch-chips ch-suggest" style="padding:2px 0 0">${list.map(s => `<button type="button" data-say="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : '';

// buttons the server asks for under a reply: open the contact form, or start a new chat
const ACTIONS = {
  // the official TranzLife WhatsApp number for enquiries and orders (client, 13 Nov 2026)
  whatsapp:'<a class="ch-action ch-wa" href="https://wa.me/919150394443" target="_blank" rel="noopener">WhatsApp us</a>',
  contact:'<a class="ch-action ch-enquire" href="#contact" data-product="" data-id="">Contact our team</a>',
  new:'<button type="button" class="ch-action ch-restart">Start a new chat</button>'
};
const actionRow = list => list && list.length ? `<div class="ch-actions">${list.map(k => ACTIONS[k] || '').join('')}</div>` : '';

function productCard(id){
  const p = CATALOG.find(x => x.id === id); if (!p) return '';
  const meta = [p.form, p.size].filter(Boolean).join(' · ');   // no prices: this is the corporate site (enquiries go to Contact)
  return `<div class="ch-prod"><span class="ch-prod-ic">${LEAF}</span>
    <div><b>${esc(p.name)}</b>${p.pitch ? `<span class="ch-prod-pitch">${esc(p.pitch)}</span>` : ''}<small>${esc(meta)}</small></div>
    <a class="ch-enquire" href="#contact" data-product="${esc(p.name)}" data-id="${esc(p.id)}">Enquire</a></div>`;
}

function bubble(m){
  const row = document.createElement('div');
  row.className = `ch-msg ${m.role === 'user' ? 'me' : 'bot'}`;
  row.innerHTML = m.role === 'user' ? `<div class="ch-b"><p>${esc(m.content)}</p></div>`
    : `<span class="ch-av">${LEAF}</span><div class="ch-b">${format(m.content)}${(m.products || []).map(productCard).join('')}${actionRow(m.actions)}${suggestRow(m.suggest)}</div>`;
  return row;
}

function save(){ try { sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-30))); } catch(e){} }
function load(){ try { const v = JSON.parse(sessionStorage.getItem(STORE) || '[]'); return Array.isArray(v) ? v : []; } catch(e){ return []; } }

function scrollDown(){ els.list.scrollTop = els.list.scrollHeight; }

function render(){
  els.list.innerHTML = '';
  els.list.append(bubble({ role:'assistant', content:WELCOME }));
  msgs.forEach(m => els.list.append(bubble(m)));
  els.chips.hidden = msgs.length > 0;
  scrollDown();
}

async function send(text){
  text = text.trim(); if (!text || busy) return;
  busy = true; els.send.disabled = true; els.input.value = ''; autosize(); els.chips.hidden = true;
  msgs.push({ role:'user', content:text }); els.list.append(bubble(msgs[msgs.length - 1]));
  const reply = { role:'assistant', content:'', products:[] };
  const row = bubble(reply); row.classList.add('typing'); row.querySelector('.ch-b').innerHTML = '<i class="ch-dots"><span></span><span></span><span></span></i>';
  els.list.append(row); scrollDown();
  const body = row.querySelector('.ch-b');
  try {
    const res = await fetch(API, { method:'POST', headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({ messages:msgs.map(({ role, content }) => ({ role, content })) }) });
    if (!res.ok || !res.body) throw new Error(res.status);
    reply.products = (res.headers.get('X-Products') || '').split(',').filter(id => CATALOG.some(p => p.id === id));
    reply.suggest = (res.headers.get('X-Suggest') || '').split('|').map(s => s.trim()).filter(Boolean).slice(0, 6);
    reply.actions = (res.headers.get('X-Actions') || '').split(',').filter(k => k in ACTIONS);
    const reader = res.body.getReader(), dec = new TextDecoder();
    for (;;){
      const { done, value } = await reader.read(); if (done) break;
      reply.content += dec.decode(value, { stream:true });
      if (reply.content.trim()){ row.classList.remove('typing'); body.innerHTML = format(reply.content); scrollDown(); }
    }
    if (!reply.content.trim()) throw new Error('empty');
    body.innerHTML = format(reply.content) + reply.products.map(productCard).join('') + actionRow(reply.actions) + suggestRow(reply.suggest);
    msgs.push(reply);
  } catch(err){
    row.classList.remove('typing');
    body.innerHTML = '<p>Sorry, I can\'t connect right now. Please try again in a minute, or reach the team through the Contact section.</p>';
    msgs.pop();     // let them resend the same message
  }
  save(); scrollDown();
  busy = false; els.send.disabled = false; els.input.focus();
}

function autosize(){ els.input.style.height = 'auto'; els.input.style.height = Math.min(els.input.scrollHeight, 120) + 'px'; }

// minimized: the chat stays on screen as a small header bar; the conversation is kept
function remember(){ try { sessionStorage.setItem(UI, els.root.classList.contains('open') ? (els.root.classList.contains('min') ? 'min' : 'open') : 'closed'); } catch(e){} }

function minimize(on, quiet){
  els.root.classList.toggle('min', on);
  els.min.setAttribute('aria-label', on ? 'Expand chat' : 'Minimize chat');
  els.min.title = on ? 'Expand' : 'Minimize';
  els.min.setAttribute('aria-expanded', !on);
  if (!on){ scrollDown(); if (!quiet) setTimeout(() => els.input.focus(), 250); }
  remember();
}

function open(on, quiet){
  els.root.classList.remove('min'); els.min.setAttribute('aria-label', 'Minimize chat'); els.min.title = 'Minimize'; els.min.setAttribute('aria-expanded', true);
  els.root.classList.toggle('open', on);
  els.fab.setAttribute('aria-expanded', on);
  els.panel.setAttribute('aria-hidden', !on);
  if (on){ scrollDown(); if (!quiet) setTimeout(() => els.input.focus(), 250); hideTease(true); }
  remember();
}

// ---------- the welcome bubble: once per visit, a few seconds after the page settles, beside the button
function teaseText(){
  const page = location.pathname.split('/').pop() || 'index.html';
  if (page.startsWith('product-details')){
    const id = new URLSearchParams(location.search).get('id'), p = PRODUCTS.find(x => x.id === id);
    if (p) return `Curious about the ${p.short || p.name}? Ask me anything here! 🌿`;
  }
  if (page.startsWith('products')) return 'Not sure which product fits your day? Ask me here! 🌿';
  if (page.startsWith('ingredients')) return 'Want to know more about an ingredient? Ask me here! 🌿';
  return 'Questions about our products? Ask me anything here! 🌿';
}
let tease = null, teaseT = 0;
function hideTease(now){
  if (!tease || tease.hidden) return;
  clearTimeout(teaseT); els.root.classList.remove('teasing');
  tease.classList.remove('in'); tease.classList.add('out');
  setTimeout(() => { tease.hidden = true; tease.classList.remove('out', 'typed'); }, now ? 0 : 420);
}
function showTease(){
  try { sessionStorage.setItem(TEASED, '1'); } catch(e){}
  tease.querySelector('.ch-msg').textContent = teaseText();
  tease.hidden = false; els.root.classList.add('teasing');
  requestAnimationFrame(() => requestAnimationFrame(() => tease.classList.add('in')));
  teaseT = setTimeout(() => { tease.classList.add('typed'); teaseT = setTimeout(() => hideTease(), TEASE_FOR); }, TYPE_FOR);
}
// waits until the visitor has been still for a moment (not mid-scroll), nothing else is in front (page loader, menu,
// the chat itself) and the tab is visible
function scheduleTease(){
  let done = false; try { done = !!sessionStorage.getItem(TEASED); } catch(e){}
  if (done) return;
  let moved = 0; const mark = () => { moved = performance.now(); };
  ['scroll', 'wheel', 'touchmove', 'keydown'].forEach(t => window.addEventListener(t, mark, { passive:true, capture:true }));
  const check = () => {
    try { if (sessionStorage.getItem(TEASED)) return; } catch(e){}
    if (els.root.classList.contains('open')) return;   // already chatting: no need
    const loader = document.getElementById('loader');
    const busy = document.hidden || performance.now() - moved < 1500 || document.documentElement.classList.contains('pt-show')
      || (loader && !loader.classList.contains('done')) || document.querySelector('.menu.open') || document.body.classList.contains('sc-ov-open');
    if (busy){ setTimeout(check, 700); return; }
    showTease();
  };
  setTimeout(check, TEASE_AFTER);
}

function initChat(){
  if (document.getElementById('chat')) return;   // once per page
  const root = document.createElement('div');
  root.className = 'chat t-cream'; root.id = 'chat';
  root.innerHTML = `
    <section class="ch-panel" id="chatPanel" role="dialog" aria-label="Chat with Tulsi, TranzLife wellness advisor" aria-hidden="true">
      <header class="ch-head">
        <span class="ch-av big">${LEAF}</span>
        <div><b>Tulsi</b><small><i></i>TranzLife wellness friend</small></div>
        <button class="ch-new" type="button" title="Start a new chat">New chat</button>
        <button class="ch-min" type="button" aria-label="Minimize chat" title="Minimize" aria-expanded="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="ch-min-dash" d="M6 12h12"/><path class="ch-min-up" d="M6 15l6-6 6 6"/></svg></button>
        <button class="ch-x" type="button" aria-label="Close chat">×</button>
      </header>
      <div class="ch-list" data-lenis-prevent aria-live="polite"></div>
      <div class="ch-chips">${CHIPS.map(c => `<button type="button">${c}</button>`).join('')}</div>
      <form class="ch-form">
        <textarea rows="1" placeholder="Tell me how you're feeling…" aria-label="Your message" maxlength="1500"></textarea>
        <button class="ch-send" type="submit" aria-label="Send">${SEND}</button>
      </form>
      <p class="ch-note">General wellness tips, not medical advice. In an emergency, call 112. We count common topics anonymously to improve our products; your messages are not stored.</p>
    </section>
    <div class="ch-tease" hidden>
      <button class="ch-tease-body" type="button" aria-controls="chatPanel">
        <span class="ch-av">${LEAF}</span>
        <span class="ch-tease-txt" role="status" aria-live="polite"><b>Tulsi</b><span class="ch-dots" aria-hidden="true"><span></span><span></span><span></span></span><span class="ch-msg"></span></span>
      </button>
      <button class="ch-tease-x" type="button" aria-label="Dismiss">×</button>
    </div>
    <button class="ch-fab" type="button" aria-controls="chatPanel" aria-expanded="false">
      <span class="ch-fab-ic">${LEAF}</span><b>Ask Tulsi</b>
    </button>`;
  document.body.append(root);
  els = { root, panel:$('.ch-panel', root), list:$('.ch-list', root), chips:$('.ch-chips', root), input:$('textarea', root), send:$('.ch-send', root), fab:$('.ch-fab', root) };

  msgs = load(); render();
  els.min = $('.ch-min', root);
  // the round button: opens the chat, expands it if minimized, or closes it
  els.fab.addEventListener('click', () => root.classList.contains('min') ? minimize(false) : open(!root.classList.contains('open')));
  $('.ch-x', root).addEventListener('click', () => open(false));
  els.min.addEventListener('click', e => { e.stopPropagation(); minimize(!root.classList.contains('min')); });
  // tapping the minimized bar (anywhere but its buttons) expands it again
  $('.ch-head', root).addEventListener('click', e => { if (root.classList.contains('min') && !e.target.closest('button')) minimize(false); });
  const restart = () => { if (busy) return; msgs = []; save(); render(); els.input.focus(); };
  $('.ch-new', root).addEventListener('click', restart);
  els.list.addEventListener('click', e => { const s = e.target.closest('.ch-suggest button'); if (s) send(s.dataset.say); });
  els.list.addEventListener('click', e => { if (e.target.closest('.ch-restart')) restart(); });
  // "Enquire" on a product card (or "Contact our team"): start a contact message, then close the chat
  els.list.addEventListener('click', e => {
    const a = e.target.closest('.ch-enquire'); if (!a) return;
    const msg = $('#f-msg');
    if (msg && !msg.value.trim()) msg.value = a.dataset.product ? `Hi, I'd like to know more about the ${a.dataset.product}.`
      : 'Hi, I\'d like to know more about your products.';
    // count the enquiry anonymously (only the product id)
    if (a.dataset.id) try { navigator.sendBeacon?.(API.replace(/chat$/, 'insight'), new Blob([JSON.stringify({ enquire:a.dataset.id })], { type:'application/json' })); } catch {}
    open(false);
  });
  els.chips.addEventListener('click', e => { const b = e.target.closest('button'); if (b) send(b.textContent); });
  $('.ch-form', root).addEventListener('submit', e => { e.preventDefault(); send(els.input.value); });
  els.input.addEventListener('input', autosize);
  els.input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); send(els.input.value); } });
  document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (root.classList.contains('open')) open(false); else hideTease(); });
  // the welcome bubble: tap it to open the chat with its question already there; × dismisses it (once per visit)
  tease = $('.ch-tease', root);
  $('.ch-tease-body', tease).addEventListener('click', () => {
    const text = tease.querySelector('.ch-msg').textContent || teaseText();
    if (!msgs.length || msgs[msgs.length - 1].content !== text){ msgs.push({ role:'assistant', content:text }); save(); render(); }
    hideTease(true); open(true);
  });
  $('.ch-tease-x', tease).addEventListener('click', () => hideTease());
  // hovering or focusing it keeps it up; leaving it starts a short goodbye
  tease.addEventListener('pointerenter', () => { if (tease.classList.contains('typed')) clearTimeout(teaseT); });
  tease.addEventListener('pointerleave', () => { if (tease.classList.contains('typed')){ clearTimeout(teaseT); teaseT = setTimeout(() => hideTease(), 3000); } });
  tease.addEventListener('focusin', () => clearTimeout(teaseT));
  // the same state on every page of this visit: open, minimized or closed
  let ui = 'closed'; try { ui = sessionStorage.getItem(UI) || 'closed'; } catch(e){}
  if (ui === 'open' || ui === 'min'){ root.classList.add('instant'); open(true, true); if (ui === 'min') minimize(true, true); requestAnimationFrame(() => root.classList.remove('instant')); }
  scheduleTease();
  // the bag opens on top of the chat; close the chat so they don't overlap on small screens
  $('#bagBtn')?.addEventListener('click', () => { if (innerWidth < 620) open(false); });
}

export { initChat };
