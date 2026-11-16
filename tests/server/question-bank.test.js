// Question bank: every health topic x every kind of person x "any product?", checked against the client's rules
// (13 Nov 2026) instead of one chat at a time. New tester findings should become rules or rows here.
//
// For each case the rules must hold whatever topic the message is matched to:
//   - a reply always exists (fixed text, or a model reply with an approved fallback that passes the reply checker)
//   - products only from the 6 launch products, only from the topic (or a diagnosed condition's support product)
//   - nothing for babies and children (ages 14+; Reviva any age; CycleRelief from 10), nothing new in pregnancy
//   - CycleRelief never for a man; Liver Booster never for someone over 50
//   - nothing with a warning sign
import { describe, expect, it } from 'vitest';
import { analyse } from '../../server/advisor-rules.js';
import { fallbackReply, fixedReply, problems } from '../../server/reply-check.js';
import { CONCERNS } from '../../server/wellness-tips.js';
import { CONCERN_EXAMPLES } from '../../server/intents.js';
import { CATALOG } from '../../src/data/catalog.js';

const PEOPLE = {
  self:t => t,
  wife:t => `my wife has this problem: ${t}`,
  father60:t => `my father is 60. ${t}`,
  child:t => `my 6 year old son: ${t}`,
  baby:t => `my baby: ${t}`,
  pregnant:t => `i am pregnant and ${t}`,
  man:t => `i am a man, ${t}`
};
const ASKS = { tips:t => t, product:t => `${t}, any product for this?` };

const ask = text => analyse([{ role:'user', content:text }]);
const MODEL_MODES = ['tips', 'flag'];      // written by the model, with an approved fallback
const IDS = new Set(CATALOG.map(p => p.id));

const cases = [];
for (const c of CONCERNS){
  for (const ex of (CONCERN_EXAMPLES[c.id] || []).slice(0, 2))
    for (const [who, wrap] of Object.entries(PEOPLE))
      for (const [kind, q] of Object.entries(ASKS)) cases.push({ topic:c.id, who, kind, text:q(wrap(ex)) });
}

describe(`question bank (${cases.length} generated questions)`, () => {
  const results = cases.map(x => ({ x, a:ask(x.text) }));
  const fail = (pred, why) => results.filter(r => pred(r)).map(r => `${why}: [${r.x.topic}/${r.x.who}] ${r.x.text} -> ${r.a.mode} ${JSON.stringify(r.a.products)}`);

  it('covers every topic', () => {
    expect(new Set(cases.map(x => x.topic)).size).toBe(CONCERNS.filter(c => CONCERN_EXAMPLES[c.id]?.length).length);
    expect(cases.length).toBeGreaterThan(1500);
  });
  it('always has a reply', () => {
    expect(fail(({ a }) => !MODEL_MODES.includes(a.mode) && !fixedReply(a), 'no reply')).toEqual([]);
  });
  it('the approved fallback for model replies passes the reply checker', () => {
    expect(fail(({ a }) => MODEL_MODES.includes(a.mode) && problems(fallbackReply(a), a).length > 0, 'fallback rejected')
      .map(s => s.slice(0, 160))).toEqual([]);
  });
  it('only suggests launch products that belong to the topic or a diagnosed condition', () => {
    expect(fail(({ a }) => a.products.some(id => !IDS.has(id)), 'unknown product')).toEqual([]);
    expect(fail(({ a }) => a.products.some(id => !a.concerns.some(c => CONCERNS.find(x => x.id === c).products.includes(id))
      && !['reviva'].includes(id) && !a.named.includes(id)), 'product not for this topic')).toEqual([]);
  });
  it('nothing for babies and children (Reviva any age), nothing new in pregnancy', () => {
    expect(fail(({ x, a }) => ['child', 'baby'].includes(x.who) && a.products.some(id => id !== 'reviva'), 'product for a child (the generated child is 6)')).toEqual([]);
    expect(fail(({ x, a }) => x.who === 'pregnant' && a.products.length > 0, 'product in pregnancy')).toEqual([]);
  });
  it('CycleRelief never for a man, Liver Booster never over 50', () => {
    expect(fail(({ x, a }) => x.who === 'man' && a.products.includes('cyclerelief'), 'CycleRelief for a man')).toEqual([]);
    expect(fail(({ x, a }) => x.who === 'father60' && a.products.includes('liver-booster'), 'Liver Booster over 50')).toEqual([]);
  });
  // tester, 14 Nov 2026: a product card appeared with no word about the product (it had been suggested a few messages before)
  it('every product card is named in the reply, the first time and when suggested again', () => {
    const named = (a, fixed) => a.products.every(id => {
      const name = CATALOG.find(p => p.id === id).name;
      return fixed ? fixed.includes(name) : a.lead.join(' ').includes(name);
    });
    const textOf = a => a.mode === 'tips' ? null : fixedReply(a);
    expect(fail(({ a }) => a.products.length && ['tips', 'recommend'].includes(a.mode) && !named(a, textOf(a)), 'card without a word')).toEqual([]);
    // the same question again, right after the bot suggested the products
    const again = results.filter(r => r.a.products.length && r.a.mode === 'tips').map(({ x, a }) => {
      const before = `Some tips. You might also like our ${a.products.map(id => CATALOG.find(p => p.id === id).name).join(' and our ')}.`;
      return { x, a:analyse([{ role:'user', content:x.text }, { role:'assistant', content:before }, { role:'user', content:x.text }]) };
    });
    expect(again.length).toBeGreaterThan(50);
    expect(again.filter(({ a }) => a.products.length && !named(a, textOf(a))).map(({ x }) => x.text)).toEqual([]);
  });
  it('nothing with a warning sign', () => {
    expect(fail(({ a }) => a.flags.length > 0 && a.products.length > 0, 'product with a warning')).toEqual([]);
  });
});
