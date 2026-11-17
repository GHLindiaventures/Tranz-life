// Anonymous issue insights: what customers ask Tulsi about, so the team can see common problems and product gaps.
// PRIVACY: no message text, names, phone numbers, IP addresses or session ids are ever stored. Each line is only
// the day, the topic ids the rules found, the products shown, warning-sign ids, the language, and (for an issue we
// have no tips for) a 1-3 word generic label written by the model ("dizziness"), checked by code before saving.
//   INSIGHTS=off            turn it off
//   INSIGHTS_FILE=path      where to save (default data/insights.jsonl, kept out of git)
// Report: npm run insights   (scripts/insights-report.mjs)
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { CONCERNS } from './wellness-tips.js';
import { CATALOG } from '../src/data/catalog.js';

const DEFAULT_FILE = 'data/insights.jsonl';
const day = (d = new Date()) => d.toISOString().slice(0, 10);

// One saved line for one chat reply. a: the analyse() result; via: how the reply was made.
function entryFor(a, { via, first, emergency } = {}){
  if (emergency) return { d:day(), k:'chat', mode:'emergency', first:!!first };
  if (!a) return null;
  const gap = a.concerns.filter(id => !CONCERNS.find(c => c.id === id)?.products.length);
  return { d:day(), k:'chat', first:!!first, mode:a.mode, topics:a.concerns, products:a.products, held:a.heldBack || [], gap,
    flags:(a.flags || []).map(f => f.id), condition:a.condition || null, support:a.support || [], lang:a.lang, about:a.subject, via };
}

// Messages worth a short label: the visitor described something we could not match (clarify), not small talk or shop.
const wantsLabel = (a, text) => a && a.mode === 'clarify' && !a.recommendQ && !['other', 'again', 'stuck'].includes(a.clarifyKind) && text.trim().split(/\s+/).length >= 2;

const NOT_ISSUE = /^(none|n\/a|nothing|unknown|general|health|issue|problem|wellness|product|products)$/;
const PERSONAL = /\b(my|me|i|he|she|his|her|they|mother|mom|amma|father|dad|appa|wife|husband|son|daughter|friend|brother|sister|years?|old|age|aged|mr|mrs|dr)\b/;
// A label is saved only if it is 1-3 plain lowercase words: no digits, names of people, ages or places can get through.
function cleanLabel(raw){
  const s = String(raw || '').toLowerCase().replace(/["'`.*:!?]/g, '').replace(/\s+/g, ' ').trim();
  if (!s || s.length > 32 || /[^a-z \-]/.test(s)) return null;
  const words = s.split(' ');
  if (words.length > 3 || NOT_ISSUE.test(s) || PERSONAL.test(s)) return null;
  return s;
}
// The model may list two issues ("dizziness, appetite loss"): each part is checked on its own, at most 2 kept.
const cleanLabels = raw => [...new Set(String(raw || '').split(/,|;|\n|\band\b|\//).map(cleanLabel).filter(Boolean))].slice(0, 2);

const labelPrompt = text => `A visitor wrote this message to a wellness shop's chat assistant:
"""${text.slice(0, 400)}"""
Reply with ONLY a short generic name (1 to 3 English words, lowercase) for the health issue or need it describes, for example: dizziness, skin rash, weight gain, knee swelling, low appetite.
Never include names, ages, places, people, numbers or any personal detail. If it does not describe a health issue or need, reply NONE.`;

// Summary for the report. entries: parsed lines; from/to: 'YYYY-MM-DD' (inclusive, optional).
function summarise(entries, { from = '', to = '9999' } = {}){
  const inRange = entries.filter(e => e && e.d >= from && e.d <= to);
  const chats = inRange.filter(e => e.k === 'chat'), enquiries = inRange.filter(e => e.k === 'enquire');
  const count = list => Object.entries(list.reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]);
  const topicName = id => CONCERNS.find(c => c.id === id)?.label || id;
  const productName = id => CATALOG.find(p => p.id === id)?.name || id;
  // a topic counts once per reply, by its main topic first
  const topics = count(chats.flatMap(e => e.topics || []));
  return {
    from:inRange[0]?.d || null, to:inRange[inRange.length - 1]?.d || null,
    conversations:chats.filter(e => e.first).length, messages:chats.length,
    topics:topics.map(([id, n]) => ({ id, name:topicName(id), n, hasProduct:!!CONCERNS.find(c => c.id === id)?.products.length })),
    gaps:{
      topics:count(chats.flatMap(e => e.gap || [])).map(([id, n]) => ({ name:topicName(id), n })),
      unmatched:count(chats.flatMap(e => e.labels || [])).map(([name, n]) => ({ name, n })),
      conditions:count(chats.flatMap(e => [e.condition, ...(e.support || [])]).filter(Boolean)).map(([name, n]) => ({ name, n }))
    },
    products:CATALOG.filter(p => p.status === 'available').map(p => ({ id:p.id, name:productName(p.id),
      shown:chats.filter(e => (e.products || []).includes(p.id)).length, enquiries:enquiries.filter(e => e.product === p.id).length }))
      .filter(p => p.shown || p.enquiries).sort((a, b) => b.shown - a.shown),
    warnings:count(chats.flatMap(e => e.flags || [])).map(([id, n]) => ({ id, n })),
    emergencies:chats.filter(e => e.mode === 'emergency').length,
    languages:count(chats.map(e => e.lang).filter(Boolean)).map(([lang, n]) => ({ lang, n }))
  };
}

// env: INSIGHTS, INSIGHTS_FILE, plus the chat's model and Ollama address for labels
function createInsights(env = {}, { generateLabel } = {}){
  const off = env.INSIGHTS === 'off';
  const file = resolve(env.INSIGHTS_FILE || DEFAULT_FILE);
  let ready = null;
  const write = entry => {
    if (off || !entry) return Promise.resolve();
    ready ??= mkdir(dirname(file), { recursive:true }).catch(() => {});
    // saving must never break or slow down the chat: errors are only logged
    return ready.then(() => appendFile(file, JSON.stringify(entry) + '\n')).catch(err => console.warn('[tulsi] insights not saved:', err.message));
  };

  // Called after the reply is sent. text is used only to ask the model for a label and is never saved.
  async function record(a, text, meta = {}){
    if (off) return;
    const entry = entryFor(a, meta);
    if (entry && generateLabel && wantsLabel(a, text)){
      try { entry.labels = cleanLabels(await generateLabel(labelPrompt(text))); } catch { entry.labels = []; }
    }
    return write(entry);
  }
  // an "Enquire" click on a product card (only the product id)
  const enquire = id => CATALOG.some(p => p.id === id) ? write({ d:day(), k:'enquire', product:id }) : Promise.resolve();

  async function read(){
    try { return (await readFile(file, 'utf8')).split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); }
    catch { return []; }
  }
  return { record, enquire, read, file, off };
}

export { createInsights, entryFor, cleanLabel, cleanLabels, summarise, wantsLabel, labelPrompt };
