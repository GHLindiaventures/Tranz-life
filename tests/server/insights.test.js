import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyse } from '../../server/advisor-rules.js';
import { cleanLabel, createInsights, entryFor, summarise } from '../../server/insights.js';

const ask = (...texts) => analyse(texts.map((content, i) => ({ role:i % 2 ? 'assistant' : 'user', content })));

describe('anonymous insights', () => {
  it('saves topics, products and gaps but never the message text', () => {
    const text = 'My name is Priya, call me on 9876543210, I have acidity and period cramps';
    const e = entryFor(ask(text), { via:'model', first:true });
    expect(e.topics).toEqual(['acidity', 'period']); expect(e.gap).toEqual(['acidity']);
    expect(JSON.stringify(e)).not.toMatch(/Priya|9876|acidity and period/);
    expect(Object.keys(e)).not.toContain('text');
  });
  it('labels keep only short generic issue names', () => {
    expect(cleanLabel('Dizziness')).toBe('dizziness');
    expect(cleanLabel(' "skin rash". ')).toBe('skin rash');
    for (const bad of ['NONE', 'my mother dizziness', 'dizziness at 62', 'Priya has a rash on her arm today', 'rash in Chennai area for weeks now', 'health'])
      expect(cleanLabel(bad), bad).toBeNull();
  });
  it('asks for a label only for unmatched issues, and stores only the cleaned label', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tulsi-')), file = join(dir, 'i.jsonl');
    const prompts = [];
    const store = createInsights({ INSIGHTS_FILE:file }, { generateLabel:async p => { prompts.push(p); return 'dizziness, appetite loss \n'; } });
    await store.record(ask('I feel dizzy and have no appetite since my wedding'), 'I feel dizzy and have no appetite since my wedding', { via:'fixed', first:true });
    await store.record(ask('I get acidity'), 'I get acidity', { via:'model' });
    await store.record(ask('hi'), 'hi', { via:'fixed' });
    await store.enquire('pulmoclear'); await store.enquire('not-a-product');
    const lines = readFileSync(file, 'utf8').trim().split('\n').map(l => JSON.parse(l));
    expect(prompts).toHaveLength(1);                         // only the unmatched message
    expect(lines[0].labels).toEqual(['dizziness', 'appetite loss']);
    expect(readFileSync(file, 'utf8')).not.toMatch(/wedding|appetite since/);
    expect(lines.filter(l => l.k === 'enquire')).toEqual([{ d:lines[0].d, k:'enquire', product:'pulmoclear' }]);
  });
  it('summarises topics, gaps and product interest', () => {
    const entries = [
      entryFor(ask('I want to quit smoking'), { first:true }), entryFor(ask('I get acidity'), { first:true }),
      entryFor(ask('acidity after food'), { first:true }), { ...entryFor(ask('I have a rash'), { first:true }), labels:['skin rash'] },
      { d:'2026-01-01', k:'enquire', product:'craving-control' }
    ];
    const s = summarise(entries);
    expect(s.conversations).toBe(4); expect(s.topics[0]).toMatchObject({ id:'acidity', n:2, hasProduct:false });
    expect(s.gaps.topics[0]).toEqual({ name:'acidity or heartburn', n:2 }); expect(s.gaps.unmatched).toEqual([{ name:'skin rash', n:1 }]);
    expect(s.products.find(p => p.id === 'craving-control')).toMatchObject({ shown:1, enquiries:1 });
  });
  it('INSIGHTS=off saves nothing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tulsi-')), file = join(dir, 'i.jsonl');
    const store = createInsights({ INSIGHTS:'off', INSIGHTS_FILE:file });
    await store.record(ask('I get acidity'), 'I get acidity', {});
    expect(await store.read()).toEqual([]);
  });
});
