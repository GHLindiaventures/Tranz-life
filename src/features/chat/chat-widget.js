// "Tulsi" wellness chat: a floating button that opens a chat panel. Replies stream from the chat API
// (server/chat-server.js, which talks to a local Ollama model). Recommended products appear as cards
// with an "Add to bag" button that the cart already handles (.mini-add[data-id]).
import { thumbs } from '../../app/state.js';
import { PRODUCTS } from '../../data/products.js';
import { $ } from '../../utils/dom.js';
import { inr } from '../../utils/format.js';

const API = (import.meta.env.VITE_CHAT_API || '') + '/api/chat';
const STORE = 'tl-chat-v1';
const WELCOME = 'Hi, I\'m Tulsi 🌿 Tell me what\'s been bothering you, and we\'ll find a gentle, natural way to feel better. You can type in English, Tamil or Tanglish.';
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

function productCard(id){
  const p = PRODUCTS.find(x => x.id === id); if (!p) return '';
  return `<div class="ch-prod">${thumbs[id] ? `<img src="${thumbs[id]}" alt="">` : '<span></span>'}
    <div><b>${esc(p.name)}</b><small>${esc(p.size)} · ${inr(p.price)}</small></div>
    <button class="mini-add" data-id="${id}" type="button">Add to bag</button></div>`;
}

function bubble(m){
  const row = document.createElement('div');
  row.className = `ch-msg ${m.role === 'user' ? 'me' : 'bot'}`;
  row.innerHTML = m.role === 'user' ? `<div class="ch-b"><p>${esc(m.content)}</p></div>`
    : `<span class="ch-av">${LEAF}</span><div class="ch-b">${format(m.content)}${(m.products || []).map(productCard).join('')}</div>`;
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
    reply.products = (res.headers.get('X-Products') || '').split(',').filter(id => PRODUCTS.some(p => p.id === id));
    const reader = res.body.getReader(), dec = new TextDecoder();
    for (;;){
      const { done, value } = await reader.read(); if (done) break;
      reply.content += dec.decode(value, { stream:true });
      if (reply.content.trim()){ row.classList.remove('typing'); body.innerHTML = format(reply.content); scrollDown(); }
    }
    if (!reply.content.trim()) throw new Error('empty');
    body.innerHTML = format(reply.content) + reply.products.map(productCard).join('');
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

function open(on){
  els.root.classList.toggle('open', on);
  els.fab.setAttribute('aria-expanded', on);
  els.panel.setAttribute('aria-hidden', !on);
  if (on){ scrollDown(); setTimeout(() => els.input.focus(), 250); }
}

function initChat(){
  const root = document.createElement('div');
  root.className = 'chat t-cream'; root.id = 'chat';
  root.innerHTML = `
    <section class="ch-panel" id="chatPanel" role="dialog" aria-label="Chat with Tulsi, TranzLife wellness advisor" aria-hidden="true">
      <header class="ch-head">
        <span class="ch-av big">${LEAF}</span>
        <div><b>Tulsi</b><small><i></i>TranzLife wellness friend</small></div>
        <button class="ch-new" type="button" title="Start a new chat">New chat</button>
        <button class="ch-x" type="button" aria-label="Close chat">×</button>
      </header>
      <div class="ch-list" data-lenis-prevent aria-live="polite"></div>
      <div class="ch-chips">${CHIPS.map(c => `<button type="button">${c}</button>`).join('')}</div>
      <form class="ch-form">
        <textarea rows="1" placeholder="Tell me how you're feeling…" aria-label="Your message" maxlength="1500"></textarea>
        <button class="ch-send" type="submit" aria-label="Send">${SEND}</button>
      </form>
      <p class="ch-note">General wellness tips, not medical advice. In an emergency, call 112.</p>
    </section>
    <button class="ch-fab" type="button" aria-controls="chatPanel" aria-expanded="false">
      <span class="ch-fab-ic">${LEAF}</span><b>Ask Tulsi</b>
    </button>`;
  document.body.append(root);
  els = { root, panel:$('.ch-panel', root), list:$('.ch-list', root), chips:$('.ch-chips', root), input:$('textarea', root), send:$('.ch-send', root), fab:$('.ch-fab', root) };

  msgs = load(); render();
  els.fab.addEventListener('click', () => open(!root.classList.contains('open')));
  $('.ch-x', root).addEventListener('click', () => open(false));
  $('.ch-new', root).addEventListener('click', () => { if (busy) return; msgs = []; save(); render(); els.input.focus(); });
  els.chips.addEventListener('click', e => { const b = e.target.closest('button'); if (b) send(b.textContent); });
  $('.ch-form', root).addEventListener('submit', e => { e.preventDefault(); send(els.input.value); });
  els.input.addEventListener('input', autosize);
  els.input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); send(els.input.value); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('open')) open(false); });
  // the bag opens on top of the chat; close the chat so they don't overlap on small screens
  $('#bagBtn')?.addEventListener('click', () => { if (innerWidth < 620) open(false); });
}

export { initChat };
