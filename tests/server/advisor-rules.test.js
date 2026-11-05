import { describe, expect, it } from 'vitest';
import { emergencyReply, isEmergency, systemPrompt } from '../../server/advisor-prompt.js';
import { analyse, routingNote } from '../../server/advisor-rules.js';
import { fallbackReply, fixedReply, problems } from '../../server/reply-check.js';
import { CONCERNS } from '../../server/wellness-tips.js';
import { CATALOG } from '../../src/data/catalog.js';

const ask = (...texts) => analyse(texts.map((content, i) => ({ role:i % 2 ? 'assistant' : 'user', content })));

describe('topic, tips and products', () => {
  it('matches clear concerns to approved tips and the right brochure product', () => {
    expect(ask('I get really painful period cramps every month').products).toEqual(['cyclerelief']);
    expect(ask('bro romba stress ah iruku office la').products).toEqual(['breathefree']);
    expect(ask('always tired, no energy even after sleeping').products).toEqual(['energy-booster']);
    expect(ask('how can I take care of my liver').products).toEqual(['liver-booster']);
    expect(ask('I want to quit smoking').products).toEqual(['craving-control', 'craving-gummies']);
    expect(ask('I have a cold and sore throat').products).toEqual(['pulmoclear']);
    expect(ask('I have period cramps').tips.length).toBeGreaterThan(1);
  });
  it('gives tips but no product where no product fits', () => {
    for (const q of ['I keep getting headaches in the evening', 'acidity after every meal', 'constipation for 3 days', 'eye pain', 'back pain from sitting',
      'knee pain', 'pimples on my face', 'hair fall', 'mouth ulcer', 'feeling sick', 'dandruff', 'my heels are cracked']){
      const a = ask(q); expect(a.mode, q).toBe('tips'); expect(a.tips.length, q).toBeGreaterThan(0); expect(a.products, q).toEqual([]);
    }
  });
  it('answers topics with no approved tips with fixed text, never the model', () => {
    const a = ask('I have white patches on my skin'); expect(a.tips).toEqual([]); expect(a.products).toEqual([]);
    expect(fixedReply(a)).toMatch(/don't have trusted tips/);
  });
  it('does not carry an old topic into a new, different message', () => {
    expect(ask('I am stressed at work', 'Sorry to hear...', 'eye pain').concerns).toEqual(['eyes']);
    const r = ask('headache in the evening', 'Sorry...', 'roll on');
    expect(r.concerns).toEqual([]); expect(r.mode).toBe('product'); expect(r.named).toEqual(['cyclerelief', 'reviva']);
  });
  it('keeps short follow-up questions on the earlier topic without showing the card again', () => {
    const a = ask('I have period cramps', 'Sorry to hear that...', 'what else can I do?');
    expect(a.concerns).toEqual(['period']); expect(a.products).toEqual([]);
  });
  it('treats product names and product types as product questions', () => {
    expect(ask('roll on products').named).toEqual(['cyclerelief', 'reviva']);
    expect(ask('liver booster').mode).toBe('product');
    expect(ask('tell me about femina').mode).toBe('soon');
    expect(ask('Do you deliver to Coimbatore?').mode).toBe('shop');
    expect(ask('always tired, no energy even after sleeping').concerns).toEqual(['tired']);
  });
  it('uses the diabetic foot-care tips, which say not to soak', () => {
    const a = ask('my dad has diabetes and his heels are dry and cracked');
    expect(a.tips.map(t => t.text).join(' ')).toMatch(/Do not soak/);
    expect(a.tips.map(t => t.text).join(' ')).not.toMatch(/hot water bag/);
  });
});

describe('when to mention a doctor', () => {
  it('does not send small everyday problems to a doctor', () => {
    for (const q of ['I have a headache', 'eye pain', 'feeling a bit stressed', 'pimples on my face', 'I have a cold'])
      expect(ask(q).doctor, q).toEqual([]);
    expect(routingNote(ask('eye pain'))).toMatch(/Do NOT tell them to see a doctor/);
  });
  it('adds when to see a doctor if it is severe, lasting or getting worse', () => {
    for (const q of ['headaches every day for 3 weeks', 'back pain getting worse', 'really bad acidity for months', 'thalai vali romba naala iruku'])
      expect(ask(q).doctor.length, q).toBeGreaterThan(0);
  });
  it('always says when to check a fever, and diabetic feet', () => {
    expect(ask('I have a mild fever').doctor.length).toBeGreaterThan(0);
    expect(ask('my mother has diabetes and dry feet').doctor.length).toBeGreaterThan(0);
  });
});

describe('caution rules', () => {
  it('shows no product in pregnancy, breastfeeding or for children, and drops food tips', () => {
    expect(ask('I am pregnant and feel so tired').products).toEqual([]);
    expect(ask('I am breastfeeding and stressed').products).toEqual([]);
    const kid = ask('my 6 year old son has a cold and sore throat');
    expect(kid.products).toEqual([]); expect(kid.tips.some(t => t.kind === 'food')).toBe(false);
  });
  it('holds back swallowed products with diabetes, long-term conditions or regular medicine', () => {
    expect(ask('I have sugar and feel tired all the time').products).toEqual([]);
    expect(ask('I take BP tablets and want to support my liver').products).toEqual([]);
    expect(ask('I take thyroid tablets and want to quit smoking').products).toEqual(['craving-control']);
  });
  it('drops honey for people with diabetes', () => {
    expect(ask('diabetic, I have a sore throat').tips.some(t => t.sugar)).toBe(false);
  });
});

describe('warning signs', () => {
  it('puts the doctor first, with no tips and no product', () => {
    for (const q of ["I'm diabetic and there's a small wound on my foot that hasn't healed", 'my eyes look yellow and I feel weak',
      'blood in my stool since yesterday', 'very heavy period bleeding with big clots', 'severe period pain, I cannot stand', 'I found a lump in my breast',
      'my vision is blurred and my eye hurts', 'back pain and numbness in both legs', 'my knee is hot and swollen', 'something went into my eye']){
      const a = ask(q); expect(a.flags.length, q).toBeGreaterThan(0); expect(a.tips, q).toEqual([]); expect(a.products, q).toEqual([]);
      expect(routingNote(a), q).toMatch(/Do NOT give any home remedy/);
    }
  });
  it('keeps the warning on for follow-up messages', () => {
    expect(ask("I'm diabetic with a sore on my toe", 'Please see a doctor...', 'can I put something on it at home?').flags.length).toBeGreaterThan(0);
  });
  it('flags bleeding or pain in pregnancy', () => {
    expect(ask('I am 3 months pregnant and have some bleeding').flags.length).toBeGreaterThan(0);
  });
});

describe('medicine and language', () => {
  it('flags questions about stopping prescribed medicine', () => {
    expect(ask('Can I stop my BP tablets and use your products instead?').stopMeds).toBe(true);
    expect(ask('sugar maathirai niruthalama?').stopMeds).toBe(true);
  });
  it('detects the reply language', () => {
    expect(ask('I have period cramps').lang).toBe('english');
    expect(ask('enaku periods time la romba vayiru vali').lang).toBe('tanglish');
    expect(ask('எனக்கு தூக்கம் வரவில்லை').lang).toBe('tamil');
  });
});

describe('emergencies never reach the model', () => {
  it('sends medical emergencies to 112', () => {
    for (const q of ['I have chest pain and my left arm hurts', 'my mother cannot breathe properly', 'his face is drooping and speech is slurred',
      'sudden worst headache of my life', 'nenju vali romba iruku', 'my throat is swelling after eating prawns', 'my son swallowed some pills',
      'high fever with a stiff neck']){
      expect(emergencyReply(q), q).toMatch(/112/); expect(emergencyReply(q), q).not.toMatch(/14416/);
    }
  });
  it('gives the self-harm helpline', () => {
    for (const q of ['I want to end my life', 'vaazha pidikala, saaganum', 'தற்கொலை செய்யணும்']) expect(emergencyReply(q), q).toMatch(/14416/);
  });
  it('does not treat normal concerns as emergencies', () => {
    for (const q of ['dry feet', 'period cramps', 'headache after work', 'nenju erichal after food', 'eye pain', 'I have a fever']) expect(isEmergency(q), q).toBe(false);
  });
});

describe('products from the brochure', () => {
  it('answers product facts word for word from the catalogue', () => {
    const c = fixedReply(ask('What is in the CycleRelief roll-on?'));
    expect(c).toMatch(/dill and eucalyptus/); expect(c).toMatch(/belly button/);
    const r = fixedReply(ask('How much is the Reviva roll-on?'));
    expect(r).toMatch(/₹399/); expect(r).toMatch(/does not replace diabetes medicine/);
    expect(fixedReply(ask('how much are the pulmoclear gummies, my 5 year old wants them'))).toMatch(/check with the doctor/);
  });
  it('treats "Reviva for diabetes?" as a product question with the medicine note, never as a cure', () => {
    expect(fixedReply(ask('is reviva good for my diabetes?'))).toMatch(/does not replace diabetes medicine/);
    expect(fixedReply(ask('will reviva cure my diabetes?'))).toMatch(/aren't meant for medical conditions like diabetes/);
  });
  it('lists only products on sale in the system prompt, and marks the rest as coming soon', () => {
    CATALOG.forEach(p => expect(systemPrompt()).toContain(p.name));
    expect(systemPrompt()).toMatch(/Coming soon \(not on sale yet, never recommend\)/);
    expect(systemPrompt()).not.toMatch(/autism|cancer/i);
  });
});

describe('reply checker', () => {
  it('passes every approved tip and doctor line for its own topic', () => {
    for (const c of CONCERNS) for (const v of [c, c.diabetes].filter(Boolean)){
      const a = { ...ask(`${c.id}`), concerns:[c.id], tips:v.tips, allowed:new Set(v.tips.flatMap(t => t.uses || [])), products:[], mentionable:[], flags:[], smallTalk:false, shop:false, named:[], mode:'tips' };
      const text = `${v.tips.map(t => t.text).join(' ')} ${v.doctor}`;
      expect(problems(text, a), c.id).toEqual([]);
    }
  });
  it('passes every fallback reply for model-written modes', () => {
    for (const q of ['period cramps', 'my eyes are yellow', 'thanks bro', 'my child has a cough', 'quit smoking',
      'I have diabetes and my feet are dry', 'eye pain', 'back pain']){
      const a = ask(q); expect(fixedReply(a), q).toBe(''); expect(problems(fallbackReply(a), a), q).toEqual([]);
    }
  });
  it('writes product suggestions and the product list in code, not by the model', () => {
    expect(ask('I get period cramps').suffix.join(' ')).toMatch(/You might also like our CycleRelief Roll-On/);
    expect(fixedReply(ask('What products do you sell?'))).toMatch(/PulmoClear.*Energy Booster/s);
    expect(ask('should I use coconut oil for my cracked heels?').prefix.join(' ')).toMatch(/can't advise on coconut oil, so/);
  });
  it('answers risky question types with fixed text', () => {
    expect(ask('Are you a doctor?').mode).toBe('identity');
    expect(fixedReply(ask('Is the Liver Booster 100% safe with no side effects?'))).toMatch(/No product can be promised/);
    expect(fixedReply(ask('Will your gummies cure my anemia?'))).toMatch(/aren't meant for medical conditions like an?a?emia/i);
    expect(fixedReply(ask('what natural remedy is there for thyroid?'))).toMatch(/doctor/);
    expect(fixedReply(ask('I want to come off my thyroid medicine'))).toMatch(/don't stop or change any medicine/);
  });
  it('says plainly when it cannot advise on a remedy, dose or diagnosis', () => {
    expect(ask('Give me the dosage of ashwagandha for stress').prefix.join(' ')).toMatch(/can't advise on ashwagandha or how much to take/);
    expect(ask('should I drink warm milk with turmeric for sleep?').prefix.join(' ')).toMatch(/can't advise on/);
    const d = ask('Just tell me what disease I have, I have headaches and tiredness'); expect(d.prefix.join(' ')).toMatch(/Only a doctor/); expect(d.products).toEqual([]);
  });
  it('does not confuse a sore throat with a diabetic foot sore', () => {
    const a = ask('I am diabetic and have a sore throat'); expect(a.flags).toEqual([]); expect(a.concerns).toEqual(['cold']);
  });
  it('rejects unsafe replies', () => {
    const a = ask('I have period cramps');
    const bad = {
      'Try soaking your feet in warm water with Epsom salt.':/not approved/,
      'Take 500 mg of ashwagandha twice a day.':/not approved|dose/,
      'Our roll-on will cure your cramps permanently.':/cure|permanent/,
      'It sounds like you have endometriosis.':/diagnosis/,
      'You can stop your painkillers and use our roll-on instead.':/stop or change medicine|not approved|replaces medicine/,
      'Our Liver Booster will help too.':/not allowed/,
      'This is 100% safe with no side effects.':/side effects|100%|safety/,
      'Drink ginger tea and take paracetamol.':/not approved/,
      'Our gummies are great for boosting energy.':/energy claim|product type/,
      'Reviva helps control your blood sugar naturally.':/blood sugar/,
      'Reviva is a natural alternative to your diabetes tablets.':/replaces medicine/,
      'Massage some coconut oil on your tummy.':/not approved/,
      'Try our new Femina range.':/not on sale/,
      'My vision sometimes gets blurry when I\'m tired too.':/has a body/
    };
    for (const [text, why] of Object.entries(bad)) expect(problems(text, a).join(' | '), text).toMatch(why);
  });
  it('lets a product reply use that product\'s own ingredients, but no other herbs', () => {
    const a = ask('tell me about the breathefree inhaler');
    expect(problems('BreatheFree has peppermint, lavender and eucalyptus oils.', a)).toEqual([]);
    expect(problems('BreatheFree has peppermint. You could also take ashwagandha.', a).join(' ')).toMatch(/ashwagandha/);
  });
  it('accepts doctor wording that mentions medicine safely', () => {
    const a = ask('Can I stop my BP tablets?');
    expect(problems('Please don\'t stop your BP tablets without talking to your doctor first.', a)).toEqual([]);
  });
});
