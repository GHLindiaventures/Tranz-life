import { describe, expect, it } from 'vitest';
import { emergencyReply, isEmergency, systemPrompt } from '../../server/advisor-prompt.js';
import { analyse, routingNote } from '../../server/advisor-rules.js';
import { PRODUCTS } from '../../src/data/products.js';

describe('chat routing rules', () => {
  it('matches clear concerns to the right product', () => {
    expect(analyse('I get really painful period cramps every month').products).toEqual(['rollon']);
    expect(analyse('bro romba stress ah iruku office la').products).toEqual(['inhaler']);
    expect(analyse('en amma ku sugar iruku, kaal la romba dry ah crack aaguthu').products).toEqual(['reviva']);
    expect(analyse('always tired, no energy even after sleeping').products).toEqual(['gummies']);
    expect(analyse('how can I support my liver after oily food').products).toEqual(['liver']);
  });
  it('recommends nothing when no product fits', () => {
    expect(analyse('I keep getting headaches in the evening').products).toEqual([]);
    expect(analyse('thookame varala, night full ah yosichitte irukken').products).toEqual([]);
  });
  it('puts the doctor first when there is a warning sign', () => {
    const a = analyse("I'm diabetic and there's a small wound on my foot that hasn't healed");
    expect(a.flags.length).toBeGreaterThan(0);
    expect(a.products).toEqual([]);
    expect(routingNote(a, PRODUCTS)).toMatch(/Do NOT recommend/);
    expect(analyse('my eyes look yellow and I feel weak').products).toEqual([]);
  });
  it('flags questions about stopping prescribed medicine', () => {
    expect(analyse('Can I stop my BP tablets and use your products instead?').stopMeds).toBe(true);
    expect(analyse('sugar maathirai niruthalama?').stopMeds).toBe(true);
  });
  it('detects the reply language', () => {
    expect(analyse('I have period cramps').lang).toBe('english');
    expect(analyse('enaku periods time la romba vayiru vali').lang).toBe('tanglish');
    expect(analyse('எனக்கு தூக்கம் வரவில்லை').lang).toBe('tamil');
  });
  it('catches emergencies before the model', () => {
    expect(isEmergency('I have chest pain and my left arm hurts')).toBe(true);
    expect(isEmergency('I want to end my life')).toBe(true);
    expect(isEmergency('dry feet')).toBe(false);
    expect(emergencyReply('I have chest pain')).not.toMatch(/14416/);
    expect(emergencyReply('I want to end my life')).toMatch(/14416/);
  });
  it('lists every product in the system prompt', () => {
    const s = systemPrompt();
    PRODUCTS.forEach(p => expect(s).toContain(p.name));
  });
});
