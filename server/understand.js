// Semantic understanding layer (TULSI_FIX_BRIEF.md, phase 2).
//
// Works out which approved topic, product, intent and subject a message is about, even with typos, Tamil script,
// Tanglish or paraphrases that the regex rules in advisor-rules.js miss. It is used IN ADDITION to the regexes:
//   - it can only return ids that already exist (topics in wellness-tips.js, products in catalog.js, a fixed list of
//     intents, self / other). It never produces advice text, products or claims.
//   - emergencies, warning signs, stop-medicine, cure, dose and diagnosis checks stay regex-based and run first.
//     This layer may only ADD a warning ("possible emergency"), never remove one.
//   - if Ollama or the embedding model is slow or missing, understand() returns null and the chat uses the regexes only.
//
// Step A: embeddings. Each example in server/intents.js and each product's matching data (catalog.js) is embedded once
//         at start-up. A message is embedded and compared by cosine similarity; a topic is kept only if it clears a
//         threshold and beats the next topic by a margin (both tuned on the labelled set, see scripts/understand-eval.mjs).
// Step B: only when step A is ambiguous, gemma2 classifies the message into the same closed lists (temperature 0, JSON),
//         and anything outside the lists is dropped.
// Step C: if still unsure, nothing is returned, and the chat asks a clarifying question.
import { CONCERNS } from './wellness-tips.js';
import { CONCERN_EXAMPLES, INTENT_EXAMPLES } from './intents.js';
import { CATALOG } from '../src/data/catalog.js';
import { FAQ_EXAMPLES } from './faq.js';

const INTENTS = ['health_problem', 'product_question', 'recommend', 'shop', 'smalltalk', 'other'];
const CONCERN_IDS = CONCERNS.map(c => c.id);
const PRODUCT_IDS = CATALOG.filter(p => p.status === 'available').map(p => p.id);

// Tuned on the labelled set (scripts/understand-eval.mjs prints the best values). Change only after re-running it.
// Grid search on 93 labelled messages (November 2026, bge-m3): topic 0.72 / margin 0.02 / intent 0.62 / product 0.8
// gave 89/93 correct topics and 0 wrong products before the LLM step.
const DEFAULTS = {
  topic:0.72,        // a topic must score at least this
  margin:0.02,       // and beat the next topic by this much
  ambiguous:0.60,    // between this and `topic` (or a small margin): ask the LLM (step B)
  plainMargin:0.04,  // a topic must beat the closest non-health example by this much, or the LLM decides
  intent:0.62,       // an intent example must score at least this to count
  product:0.80,      // a product's matching data must score at least this
  faq:0.71,          // a product/shop question example (server/faq.js) must score at least this, beat the next one by
  faqMargin:0.015,   //   faqMargin and the best health topic by faqOverTopic; a general "suggest something" message keeps the
  faqOverTopic:0.05, //   general answer (tuned 14 Nov 2026 on 108 product/shop questions and the 95 labelled health messages)
  embedTimeout:2000, llmTimeout:9000
};

const cosine = (a, b) => { let d = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++){ d += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; } return d / (Math.sqrt(na*nb) || 1); };
const ranked = scores => Object.entries(scores).sort((x, y) => y[1] - x[1]);

// The documents that get embedded: [{ kind:'concern'|'intent'|'product', id, text }]
function documents(){
  const docs = [];
  for (const [id, list] of Object.entries(CONCERN_EXAMPLES)) if (CONCERN_IDS.includes(id)) list.forEach(text => docs.push({ kind:'concern', id, text }));
  for (const [id, list] of Object.entries(INTENT_EXAMPLES)) list.forEach(text => docs.push({ kind:'intent', id, text }));
  // product and shop questions (server/faq.js): "a sweet supplement?", "cash on delivery?", "enaku inippa supplement"
  for (const [id, list] of Object.entries(FAQ_EXAMPLES)) list.forEach(text => docs.push({ kind:'faq', id, text }));
  for (const p of CATALOG.filter(x => x.status === 'available'))
    [...(p.aliases || []), ...(p.forProblems || []).map(t => `product for ${t}`), ...(p.questions || [])].forEach(text => docs.push({ kind:'product', id:p.id, text }));
  return docs;
}

// Step A scoring, separated so tests and the tuning script can run it on stored vectors.
function score(vector, docs, vectors){
  const best = { concern:{}, intent:{}, product:{}, faq:{} };
  docs.forEach((d, i) => { const s = cosine(vector, vectors[i]); if (!(best[d.kind][d.id] >= s)) best[d.kind][d.id] = s; });
  return best;
}

function decide(best, t = DEFAULTS){
  const c = ranked(best.concern), i = ranked(best.intent), p = ranked(best.product);
  const [topId, top = 0] = c[0] || [], second = c[1]?.[1] || 0;
  let clear = top >= t.topic && top - second >= t.margin;
  // a non-health intent that scores higher than the best topic wins ("which product should I use", "I drink water a lot")
  const [intentId, intentScore = 0] = i[0] || [];
  const intentHit = intentScore >= t.intent && intentScore > top ? intentId : null;
  if (intentHit && intentHit !== 'recommend') clear = false;
  if (intentHit === 'recommend' && intentScore - top >= t.margin) clear = false;
  // a non-health example almost as close as the topic ("I play cricket every evening": "I drink beer every night" 0.74,
  // "I exercise daily" 0.72) is too close to call on sentence shape alone: let the LLM decide (step B)
  const bestPlain = Math.max(...['neutral', 'other', 'unsupported'].map(id => best.intent[id] || 0));
  if (clear && top - bestPlain < t.plainMargin) clear = false;
  const concerns = clear ? [topId] : [];
  const products = p.filter(([, s]) => s >= t.product).slice(0, 2).map(([id]) => id);
  const ambiguous = !clear && !intentHit && top >= t.ambiguous;
  // "unsupported": a complaint we have no approved tips for (dizziness, rashes...): no topic, no LLM, ask instead
  const noTopic = ['neutral', 'other', 'unsupported'].includes(intentHit);
  const intent = intentHit === 'neutral' || intentHit === 'unsupported' ? 'other' : intentHit || (concerns.length ? 'health_problem' : null);
  // a product or shop question, when it is clearly the closest meaning and closer than any health topic
  const f = ranked(best.faq || {});
  const faq = f[0] && f[0][1] >= t.faq && f[0][1] - (f[1]?.[1] || 0) >= t.faqMargin && f[0][1] - top >= t.faqOverTopic
    && !(intentHit === 'recommend' && f[0][0] !== 'bestseller' && intentScore >= f[0][1] - 0.05) ? f[0][0] : null;
  return { concerns, products:noTopic ? [] : products, intent, faq, faqScore:f[0]?.[1] || 0, ambiguous:ambiguous && !noTopic, top, second,
    candidates:c.slice(0, 5).map(([id]) => id) };
}

// Step B prompt: closed lists, a few examples, JSON only.
function classifierPrompt(text){
  const topics = CONCERNS.map(c => `${c.id} (${c.label})`).join(', ');
  return `Classify a message sent to a wellness shop's chat assistant. Answer with JSON only, no other text.
Allowed "concerns" (0 to 2): ${topics}.
Allowed "intent": ${INTENTS.join(', ')}.
Allowed "subject": self (about the writer), other (about a friend or family member).
"emergency": true only if the message describes something that may need urgent medical help.
Messages may be in English, Tamil, Tanglish (Tamil in English letters) and may have typos.
Examples:
"nan daily kudikiren" -> {"concerns":["alcohol"],"intent":"health_problem","subject":"self","emergency":false}
"en appa ku cigarette pazhakkam" -> {"concerns":["smoking"],"intent":"health_problem","subject":"other","emergency":false}
"vayiru erichal saptathum" -> {"concerns":["acidity"],"intent":"health_problem","subject":"self","emergency":false}
"what do you have for my lungs" -> {"concerns":["lungs"],"intent":"recommend","subject":"self","emergency":false}
"kannu romba valikuthu" -> {"concerns":["eyes"],"intent":"health_problem","subject":"self","emergency":false}
"how much is the roll on" -> {"concerns":[],"intent":"shop","subject":"self","emergency":false}
"who won the match" -> {"concerns":[],"intent":"other","subject":"self","emergency":false}
"my mother suddenly cannot speak properly" -> {"concerns":[],"intent":"health_problem","subject":"other","emergency":true}
Message: ${JSON.stringify(text)}`;
}

// keep only known values from the model's JSON
function validate(raw){
  let j; try { j = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch(e){ return null; }
  if (!j || typeof j !== 'object') return null;
  const concerns = (Array.isArray(j.concerns) ? j.concerns : []).filter(id => CONCERN_IDS.includes(id)).slice(0, 2);
  const intent = INTENTS.includes(j.intent) ? j.intent : null;
  const subject = j.subject === 'self' || j.subject === 'other' ? j.subject : null;
  return { concerns, intent, subject, emergency:j.emergency === true };
}

function createUnderstanding(env = {}, overrides = {}){
  const OLLAMA = (env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
  const EMBED = env.EMBED_MODEL || 'bge-m3', LLM = env.CHAT_MODEL || 'gemma2:9b';
  const t = { ...DEFAULTS, ...overrides.thresholds };
  // injectable for tests: embed(texts) -> vectors, classify(text) -> raw JSON string
  const embed = overrides.embed || (async (input, timeout) => {
    const r = await fetch(`${OLLAMA}/api/embed`, { method:'POST', signal:AbortSignal.timeout(timeout), headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({ model:EMBED, input, keep_alive:'30m' }) });
    if (!r.ok) throw new Error(`embed ${r.status}`);
    return (await r.json()).embeddings;
  });
  const classify = overrides.classify || (async text => {
    const r = await fetch(`${OLLAMA}/api/generate`, { method:'POST', signal:AbortSignal.timeout(t.llmTimeout), headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({ model:LLM, prompt:classifierPrompt(text), format:'json', stream:false, keep_alive:'30m', options:{ temperature:0, num_predict:80 } }) });
    if (!r.ok) throw new Error(`classify ${r.status}`);
    return (await r.json()).response;
  });

  const docs = documents();
  let vectors = null, loading = null;
  // embed every example once, in batches, and keep the vectors in memory
  function init(){
    if (vectors) return Promise.resolve(true);
    loading ??= (async () => {
      const out = [];
      for (let i = 0; i < docs.length; i += 64) out.push(...await embed(docs.slice(i, i + 64).map(d => d.text), 120000));
      vectors = out; return true;
    })().catch(err => { loading = null; throw err; });
    return loading;
  }

  // Returns { concerns, products, intent, subject, emergency, via, top } or null (then the chat uses the regexes only).
  async function understand(text){
    try {
      if (!vectors) await Promise.race([init(), new Promise((_, no) => setTimeout(() => no(new Error('not ready')), t.embedTimeout))]);
      const [v] = await embed([text], t.embedTimeout);
      const d = decide(score(v, docs, vectors), t);
      if (!d.ambiguous) return { ...d, subject:null, emergency:false, via:'embed' };
      // step B: one extra model call, only for ambiguous messages
      const c = validate(await classify(text));
      if (!c) return { ...d, concerns:[], subject:null, emergency:false, via:'embed' };
      // the LLM may only pick between the embedding's own top candidates, never a topic out of nowhere
      // ("dizzy and no appetite" must not become "feeling sick" unless the examples also point there)
      const concerns = c.concerns.filter(id => d.candidates.includes(id));
      return { ...d, concerns, intent:c.intent || d.intent, subject:c.subject, emergency:c.emergency, via:'llm' };
    } catch(err){
      return null;
    }
  }

  // The latest message of a chat. For a short message ("what would you recommend?") the previous visitor message is
  // understood too, so a follow-up can continue a topic the regex rules missed ("I drink most nights").
  async function understandChat(msgs){
    const users = msgs.filter(m => m.role === 'user').map(m => m.content);
    const s = await understand(users[users.length - 1] || '');
    if (s && users.length > 1 && users[users.length - 1].trim().split(/\s+/).length <= 14){
      const p = await understand(users[users.length - 2]);
      s.prevConcerns = p?.concerns || [];
    }
    return s;
  }

  return { init, understand, understandChat, documents:docs, get ready(){ return !!vectors; } };
}

export { createUnderstanding, documents, score, decide, validate, classifierPrompt, DEFAULTS, INTENTS };
