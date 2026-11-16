// Understanding layer tests (TULSI_FIX_BRIEF.md phases 2 and 3). These run WITHOUT Ollama:
//   - the labelled set is replayed through analyse() with the semantic results stored in
//     fixtures/understand-semantic.json (refresh it with `npm run test:understand`)
//   - understand.js logic is tested with a small fake embedder
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyse } from '../../server/advisor-rules.js';
import { createUnderstanding, decide, validate } from '../../server/understand.js';
import { CASES } from './understand-cases.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/understand-semantic.json', import.meta.url), 'utf8'));
const msgsOf = c => c.t.map((content, i) => ({ role:i % 2 ? 'assistant' : 'user', content }));
const lastOf = c => c.t[c.t.length - 1];
const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const topicOk = (c, a) => (a.concerns[0] || null) === (c.concerns[0] || null);

describe('labelled set (93 messages: English, Tamil, Tanglish, typos, friend/self, follow-ups, products)', () => {
  const withLayer = CASES.map(c => ({ c, a:analyse(msgsOf(c), { semantic:fixture[lastOf(c)] || null }) }));
  const rulesOnly = CASES.map(c => ({ c, a:analyse(msgsOf(c)) }));
  it('gets at least 90% of topics right', () => {
    const ok = withLayer.filter(x => topicOk(x.c, x.a)).length;
    expect(ok / CASES.length).toBeGreaterThanOrEqual(0.9);
  });
  it('never recommends a wrong product', () => {
    const wrong = withLayer.filter(x => x.a.products.some(id => !x.c.products.includes(id))).map(x => lastOf(x.c));
    expect(wrong).toEqual([]);
  });
  it('gets the subject (self / other) right where it is labelled', () => {
    const bad = withLayer.filter(x => x.c.subject && x.a.subject !== x.c.subject).map(x => lastOf(x.c));
    expect(bad).toEqual([]);
  });
  it('never breaks a message the rules alone already got right', () => {
    const lost = rulesOnly.filter(x => topicOk(x.c, x.a) && same(x.a.products, x.c.products))
      .filter(x => { const w = withLayer.find(y => y.c === x.c).a; return !topicOk(x.c, w) || !same(w.products, x.c.products); }).map(x => lastOf(x.c));
    expect(lost).toEqual([]);
  });
});

describe('safety is a union, not a replacement', () => {
  it('cannot remove a regex warning sign', () => {
    const a = analyse([{ role:'user', content:'I saw blood in my stool today' }], { semantic:{ concerns:['constipation'], products:[], intent:'health_problem', subject:null, emergency:false } });
    expect(a.mode).toBe('flag'); expect(a.products).toEqual([]);
  });
  it('can add a warning sign ("possible emergency")', () => {
    const a = analyse([{ role:'user', content:'my mother is acting strange' }], { semantic:{ concerns:[], products:[], intent:'health_problem', subject:'other', emergency:true } });
    expect(a.mode).toBe('flag'); expect(a.flags.map(f => f.id)).toContain('possible-emergency');
  });
  it('does not override a regex topic', () => {
    const a = analyse([{ role:'user', content:'I have period cramps' }], { semantic:{ concerns:['stress'], products:[], intent:'health_problem', subject:null, emergency:false } });
    expect(a.concerns).toEqual(['period']);
  });
  it('without the layer (null), the rules still answer', () => {
    expect(analyse([{ role:'user', content:'nan kudikiren' }], { semantic:null }).products).toEqual(['liver-booster']);
  });
});

// a tiny deterministic "embedding": character trigram counts hashed into 128 buckets
const fakeEmbed = async input => input.map(text => { const v = new Array(128).fill(0), s = ` ${text.toLowerCase()} `;
  for (let i = 0; i < s.length - 2; i++){ let h = 0; for (const ch of s.slice(i, i + 3)) h = (h * 31 + ch.charCodeAt(0)) % 128; v[h]++; } return v; });

describe('understand.js', () => {
  it('matches a message to a topic from the examples', async () => {
    const u = createUnderstanding({}, { embed:fakeEmbed, classify:async () => '{}' });
    const r = await u.understand('nan kudikiren');
    expect(r.concerns).toEqual(['alcohol']); expect(r.via).toBe('embed');
  });
  it('only returns ids from the closed lists', () => {
    expect(validate('{"concerns":["alcohol","cancer-cure"],"intent":"buy_now","subject":"robot","emergency":"yes"}'))
      .toEqual({ concerns:['alcohol'], intent:null, subject:null, emergency:false });
    expect(validate('not json')).toBe(null);
  });
  it('asks the LLM only when step A is ambiguous', async () => {
    let calls = 0;
    const u = createUnderstanding({}, { embed:fakeEmbed, classify:async () => { calls++; return '{"concerns":["eyes"],"intent":"health_problem","subject":"self","emergency":false}'; },
      thresholds:{ topic:0.999, intent:0.999, ambiguous:0.01 } });
    const r = await u.understand('my eyes are sore and tired');
    expect(calls).toBe(1); expect(r.via).toBe('llm'); expect(r.concerns).toEqual(['eyes']);   // eyes is among the embedding's top candidates
    // the LLM can only pick from the embedding's own top candidates
    const far = await u.understand('my periods are painful');
    expect(far.concerns.every(id => far.candidates.includes(id))).toBe(true);
    if (!far.candidates.includes('eyes')) expect(far.concerns).not.toContain('eyes');
  });
  it('returns null (rules only) when the embedding model fails or is slow', async () => {
    const broken = createUnderstanding({}, { embed:async () => { throw new Error('down'); } });
    expect(await broken.understand('hello')).toBe(null);
    let n = 0;
    const slow = createUnderstanding({}, { embed:async (input) => { if (n++ === 0) return fakeEmbed(input); return new Promise(() => {}); }, thresholds:{ embedTimeout:50 } });
    expect(await Promise.race([slow.understand('hi').then(() => 'answered'), new Promise(r => setTimeout(() => r('hung'), 2000))])).not.toBe('hung');
  });
  it('a non-health intent that beats the best topic drops the topic', () => {
    const d = decide({ concern:{ immunity:0.7, cold:0.6 }, intent:{ neutral:0.9 }, product:{ pulmoclear:0.85 } });
    expect(d.concerns).toEqual([]); expect(d.products).toEqual([]);
  });
});
