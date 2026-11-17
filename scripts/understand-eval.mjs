// Evaluates the understanding layer on the labelled set (tests/server/understand-cases.js). Needs Ollama with bge-m3.
//   node scripts/understand-eval.mjs           live run (embeddings + LLM step B), accuracy per group, every miss,
//                                              and writes tests/server/fixtures/understand-semantic.json for CI
//   node scripts/understand-eval.mjs --tune    searches thresholds on stored scores (no LLM) and prints the best
// Accuracy counts: concern = the main topic matches (or both empty); products = exact set; subject = self/other.
import { mkdirSync, writeFileSync } from 'node:fs';
import { analyse } from '../server/advisor-rules.js';
import { createUnderstanding, decide, score, DEFAULTS } from '../server/understand.js';
import { CASES as LABELLED } from '../tests/server/understand-cases.js';
import { CASES as REAL1 } from '../tests/server/real-questions.js';
import { CASES as REAL2 } from '../tests/server/real-questions-2.js';
// --set real / --set real2: the realistic held-out questions (tests/server/real-questions*.js); the fixture is written only for the labelled set
const REAL_SET = process.argv.includes('real') || process.argv.includes('real2');
const REAL = process.argv.includes('real2') ? REAL2 : REAL1;
const CASES = REAL_SET ? REAL : LABELLED;

const msgsOf = c => c.t.map((content, i) => ({ role:i % 2 ? 'assistant' : 'user', content }));
const lastOf = c => c.t[c.t.length - 1];
const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

function check(c, a){
  const errs = [];
  const topicOk = [c.concerns[0] || null, ...(c.alt || [])].includes(a.concerns[0] || null);   // alt: other acceptable main topics
  if (!topicOk) errs.push(`topic ${JSON.stringify(a.concerns)} expected ${JSON.stringify(c.concerns)}`);
  if (!same(a.products, c.products)) errs.push(`products ${JSON.stringify(a.products)} expected ${JSON.stringify(c.products)}`);
  if (c.subject && a.subject !== c.subject) errs.push(`subject ${a.subject} expected ${c.subject}`);
  const wrongProduct = a.products.some(id => !c.products.includes(id));
  return { errs, wrongProduct, topicOk };
}

function report(label, results){
  const groups = {};
  for (const r of results){ const g = groups[r.c.g] ??= { n:0, topic:0, all:0 }; g.n++; if (r.topicOk) g.topic++; if (!r.errs.length) g.all++; }
  const n = results.length, topic = results.filter(r => r.topicOk).length, all = results.filter(r => !r.errs.length).length, wrong = results.filter(r => r.wrongProduct).length;
  console.log(`\n${label}: topic ${topic}/${n} (${(100*topic/n).toFixed(1)}%), fully correct ${all}/${n}, wrong-product recommendations ${wrong}`);
  for (const [g, s] of Object.entries(groups)) console.log(`  ${g.padEnd(10)} topic ${s.topic}/${s.n}  fully correct ${s.all}/${s.n}`);
  return { topic, all, wrong, n };
}

const u = createUnderstanding(process.env);
await u.init();

if (process.argv.includes('--tune')){
  // embed every test message once, then try threshold combinations on the stored scores
  const vecs = [];
  for (let i = 0; i < CASES.length; i += 32){ const r = await fetch(`${(process.env.OLLAMA_URL || 'http://localhost:11434')}/api/embed`, { method:'POST',
    body:JSON.stringify({ model:process.env.EMBED_MODEL || 'bge-m3', input:CASES.slice(i, i + 32).map(lastOf) }) }); vecs.push(...(await r.json()).embeddings); }
  const docVecs = await (async () => { const out = []; for (let i = 0; i < u.documents.length; i += 64){ const r = await fetch(`${(process.env.OLLAMA_URL || 'http://localhost:11434')}/api/embed`, { method:'POST',
    body:JSON.stringify({ model:process.env.EMBED_MODEL || 'bge-m3', input:u.documents.slice(i, i + 64).map(d => d.text) }) }); out.push(...(await r.json()).embeddings); } return out; })();
  const bests = vecs.map(v => score(v, u.documents, docVecs));
  const rows = [];
  for (const topic of [0.6, 0.64, 0.68, 0.72, 0.76, 0.8]) for (const margin of [0, 0.02, 0.04, 0.06, 0.08]) for (const intent of [0.62, 0.68, 0.74, 0.8]) for (const product of [0.7, 0.75, 0.8, 0.85, 0.9]){
    const t = { ...DEFAULTS, topic, margin, intent, product };
    const res = CASES.map((c, i) => { const d = decide(bests[i], t); return check(c, analyse(msgsOf(c), { semantic:{ ...d, concerns:d.ambiguous ? [] : d.concerns, subject:null, emergency:false } })); });
    rows.push({ topic, margin, intent, product, ok:res.filter(r => r.topicOk).length, all:res.filter(r => !r.errs.length).length, wrong:res.filter(r => r.wrongProduct).length });
  }
  rows.sort((a, b) => (a.wrong - b.wrong) || (b.ok - a.ok) || (b.all - a.all));
  console.log('best thresholds (fewest wrong products, then most correct topics), without the LLM step:');
  rows.slice(0, 10).forEach(r => console.log(`  topic ${r.topic} margin ${r.margin} intent ${r.intent} product ${r.product}: topic ${r.ok}/${CASES.length}, fully correct ${r.all}, wrong products ${r.wrong}`));
  process.exit(0);
}

// live run
const fixture = {}, live = [], base = [];
for (const c of CASES){
  const sem = await u.understandChat(msgsOf(c));
  fixture[lastOf(c)] = sem && { concerns:sem.concerns, products:sem.products, intent:sem.intent, subject:sem.subject, emergency:sem.emergency, via:sem.via };
  live.push({ c, sem, a:analyse(msgsOf(c), { semantic:sem }), ...check(c, analyse(msgsOf(c), { semantic:sem })) });
  base.push({ c, ...check(c, analyse(msgsOf(c))) });
}
report('Regex rules only (before)', base);
const r = report('Regex + understanding layer', live);
const misses = live.filter(x => x.errs.length);
if (misses.length){ console.log('\nMisses:'); misses.forEach(x => console.log(`  [${x.c.g}] "${lastOf(x.c)}": ${x.errs.join('; ')}  (semantic: ${x.sem ? `${JSON.stringify(x.sem.concerns)} ${x.sem.intent} via ${x.sem.via}` : 'none'})`)); }
if (!REAL_SET){
  mkdirSync(new URL('../tests/server/fixtures/', import.meta.url), { recursive:true });
  writeFileSync(new URL('../tests/server/fixtures/understand-semantic.json', import.meta.url), JSON.stringify(fixture, null, 1));
  console.log('\nfixture written: tests/server/fixtures/understand-semantic.json');
}
process.exit(r.wrong ? 1 : 0);
