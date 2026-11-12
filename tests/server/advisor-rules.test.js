import { describe, expect, it } from 'vitest';
import { emergencyReply, isEmergency, systemPrompt } from '../../server/advisor-prompt.js';
import { analyse, routingNote } from '../../server/advisor-rules.js';
import { fallbackReply, fixedReply, problems, replyActions, suggestChips } from '../../server/reply-check.js';
import { CONCERNS } from '../../server/wellness-tips.js';
import { CATALOG } from '../../src/data/catalog.js';

const ask = (...texts) => analyse(texts.map((content, i) => ({ role:i % 2 ? 'assistant' : 'user', content })));

describe('topic, tips and products', () => {
  it('matches clear concerns to approved tips and the right brochure product', () => {
    expect(ask('I get really painful period cramps every month').products).toEqual(['cyclerelief']);
    expect(ask('bro romba stress ah iruku office la').products).toEqual(['breathefree']);
    expect(ask('always tired, no energy even after sleeping').products).toEqual(['energy-booster']);
    expect(ask('how can I take care of my liver').products).toEqual(['liver-booster']);
    expect(ask('I want to quit smoking').products).toEqual(['craving-control', 'craving-gummies', 'pulmoclear']);
    expect(ask('I have a cold and sore throat').products).toEqual(['pulmoclear']);
    expect(ask('I have period cramps').tips.length).toBeGreaterThan(1);
  });
  it('gives tips but no product where no product fits', () => {
    for (const q of ['I keep getting headaches in the evening', 'acidity after every meal', 'constipation for 3 days', 'eye pain', 'back pain from sitting',
      'knee pain', 'pimples on my face', 'hair fall', 'mouth ulcer', 'feeling sick', 'dandruff', 'my heels are cracked']){
      const a = ask(q); expect(a.mode, q).toBe('tips'); expect(a.tips.length, q).toBeGreaterThan(0); expect(a.products, q).toEqual([]);
    }
  });
  it('answers topics with no approved tips with a clarifying question and quick replies, never the model', () => {
    const a = ask('I have white patches on my skin'); expect(a.mode).toBe('clarify'); expect(a.tips).toEqual([]); expect(a.products).toEqual([]);
    expect(fixedReply(a)).toMatch(/tell me a little more/); expect(fixedReply(a)).not.toMatch(/don't have trusted tips/);
    expect(suggestChips(a).length).toBeGreaterThan(2);
  });
  it('does not carry an old topic into a new, different message', () => {
    expect(ask('I am stressed at work', 'Sorry to hear...', 'eye pain').concerns).toEqual(['eyes']);
    const r = ask('headache in the evening', 'Sorry...', 'roll on');
    expect(r.concerns).toEqual([]); expect(r.mode).toBe('product'); expect(r.named).toEqual(['cyclerelief', 'reviva']);
  });
  it('keeps short follow-up questions on the earlier topic, with its products', () => {
    const a = ask('I have period cramps', 'Sorry to hear that...', 'what else can I do?');
    expect(a.concerns).toEqual(['period']); expect(a.products).toEqual(['cyclerelief']); expect(a.keepHistory).toBe(true);
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

describe('alcohol', () => {
  it('gives cutting-down tips, the Liver Booster with an honest note, and the safety line', () => {
    for (const q of ['my friend drinks alcohol a lot', 'en appa daily sarakku adikiraaru', 'I drink every night, how to protect my liver']){
      const a = ask(q); expect(a.concerns, q).toContain('alcohol'); expect(a.products, q).toEqual(['liver-booster']);
      expect(a.suffix.join(' '), q).toMatch(/cannot undo the effects of heavy drinking/); expect(a.suffix.join(' '), q).toMatch(/14446/);
    }
  });
  it('does not mistake drinking water for alcohol', () => {
    expect(ask('I drink water a lot').concerns).not.toContain('alcohol');
  });
  it('treats dependence signs as a warning and severe withdrawal as an emergency', () => {
    expect(ask('he gets shaky in the morning without a drink').flags.map(f => f.id)).toContain('alcohol-dependence');
    expect(emergencyReply('I stopped drinking and now I am seeing things')).toMatch(/112/);
  });
});

describe('habits, situations and conditions matched to products', () => {
  it('matches everyday habits and situations to the related product', () => {
    const m = {
      'I smoke a lot and cough every morning':['craving-control', 'craving-gummies', 'pulmoclear'],
      'I chew gutka daily':['craving-control', 'craving-gummies', 'pulmoclear'],
      'I work at a construction site with lots of dust':['pulmoclear'],
      'pollution is very bad in my city':['pulmoclear'],
      'I fall sick often':['pulmoclear'],
      'I eat junk food every day':['liver-booster'],
      'I work night shifts and feel drained':['energy-booster'],
      'exam pressure is too much':['breathefree'],
      'my friend drinks alcohol a lot':['liver-booster']
    };
    for (const [q, p] of Object.entries(m)) expect(ask(q).products, q).toEqual(p);
  });
  it('mentions a support product for a diagnosed condition, never as a treatment', () => {
    const d = fixedReply(ask('I have diabetes'));
    expect(d).toMatch(/not a treatment for diabetes/); expect(d).toMatch(/Reviva/); expect(d).toMatch(/check with your doctor before trying it/);
    expect(ask('I have fatty liver').suffix.join(' ')).toMatch(/For fatty liver, please keep following your doctor's advice/);
  });
  it('suggests nothing for breathing diseases, cure questions or stopping medicine', () => {
    expect(ask('I have asthma').products).toEqual([]);
    expect(ask('Which herb cures diabetes?').products).toEqual([]);
    expect(fixedReply(ask('can I stop insulin and use your products?'))).toMatch(/don't stop or change any medicine/);
  });
});

// TULSI_FIX_BRIEF.md, bug table rows A to M
describe('fix brief: bugs A to M', () => {
  const run = (...u) => ask(...u.flatMap((c, i) => i < u.length - 1 ? [c, 'ok'] : [c]));
  it('A: a friend\'s BP does not hold back the visitor\'s Liver Booster', () => {
    const a = run('my friend has bp and takes tablets', 'i am a drinker which product should i need to use');
    expect(a.subject).toBe('self'); expect(a.products).toEqual(['liver-booster']); expect(a.heldBack).toEqual([]);
    expect(fixedReply(a)).toMatch(/Liver Booster.*cannot undo the effects of heavy drinking/s); expect(fixedReply(a)).not.toMatch(/If you are pregnant/);
  });
  it('B: a friend\'s diabetes does not hold back the visitor\'s smoking products', () => {
    expect(run('my friend has diabetes', 'i smoke a lot, which product should i use').products).toEqual(['craving-control', 'craving-gummies', 'pulmoclear']);
  });
  it('C, D: "which product" after a health message recommends that topic, not the whole list', () => {
    const c = run('i drink a lot', 'which product should i use'); expect(c.mode).toBe('recommend'); expect(c.products).toEqual(['liver-booster']);
    const d = run('i smoke', 'which product is best'); expect(d.mode).toBe('recommend'); expect(d.products[0]).toBe('craving-control');
  });
  it('E: "what else" after smoking keeps tips and products', () => {
    const e = run('i smoke a lot', 'what else'); expect(e.mode).toBe('tips'); expect(e.concerns).toEqual(['smoking']); expect(e.products.length).toBe(3);
  });
  it('F: smoking is the main topic, smoking products first, liver second', () => {
    expect(run('i smoke and drink daily').products).toEqual(['craving-control', 'craving-gummies', 'pulmoclear', 'liver-booster']);
  });
  it('G, H: Tamil verb forms, slang and misspellings reach the right topic', () => {
    for (const q of ['nan kudikiren', 'weekend la kudipen', 'en husband romba kudikiraru', 'daily kudikira pazhakkam iruku', 'alchohol adikren'])
      expect(run(q).concerns, q).toContain('alcohol');
    for (const q of ['cigerette pidikiren', 'ciggarette quit panna help pannunga', 'he puffs 20 a day']) expect(run(q).concerns, q).toContain('smoking');
    expect(run('thanni kudikiren daily').concerns).not.toContain('alcohol');
  });
  it('I, J: lung questions reach PulmoClear, recommended with its pitch', () => {
    for (const q of ['lung problem iruku enna product', 'my lungs feel heavy', 'lung health improve panna enna pannalam', 'I have a weak lungs'])
      expect(run(q).products, q).toEqual(['pulmoclear']);
    const j = run('what products do you have for lungs'); expect(j.mode).toBe('recommend'); expect(fixedReply(j)).toMatch(/PulmoClear Lung Booster Gummies\*\*: botanical gummies made for everyday respiratory wellness support/);
  });
  it('K: a friend\'s drinking, then "en frnd ku enna product", recommends Liver Booster for the friend', () => {
    const k = run('en friend drinks daily', 'en frnd ku enna product use pannalam');
    expect(k.subject).toBe('other'); expect(k.mode).toBe('recommend'); expect(k.products).toEqual(['liver-booster']); expect(fixedReply(k)).toMatch(/may help support their liver/);
  });
  it('L: ordinary messages get the closest topic or a clarifying question, never the dead end', () => {
    expect(run('stomach pain after eating outside food').concerns).toEqual(['acidity']);
    expect(run('i cant concentrate and feel low').concerns).toEqual(['stress']);
    const l = run('i feel dizzy and no appetite'); expect(l.mode).toBe('clarify'); expect(fixedReply(l)).not.toMatch(/don't have trusted tips/);
  });
  it('M: after a friend topic, the visitor\'s own message is about them and gets no earlier history', () => {
    const m = run('my friend drinks alcohol a lot', 'i smoke a lot i want to fix myself');
    expect(m.subject).toBe('self'); expect(m.keepHistory).toBe(false); expect(routingNote(m)).toMatch(/about the visitor themselves/);
  });
  it('"which product" with no topic asks what they need, with product chips', () => {
    const a = run('which product should i use'); expect(a.mode).toBe('clarify'); expect(suggestChips(a)).toContain('Lung health');
  });
});

describe('small talk and questions about Tulsi', () => {
  it('answers greetings, thanks, okay and goodbye with the right fixed reply', () => {
    const kind = { 'hi dude':'greeting', 'hey there':'greeting', 'vanakkam anna':'greeting', 'how are you doing today':'howareyou', 'epdi irukeenga':'howareyou',
      'thank you so much dude':'thanks', 'ok cool':'ok', 'hmm':'ok', 'bye take care':'bye', 'good night':'bye' };
    for (const [q, k] of Object.entries(kind)){ const a = ask(q); expect(a.mode, q).toBe('smalltalk'); expect(a.smallTalkKind, q).toBe(k); expect(fixedReply(a), q).toBeTruthy(); }
    expect(fixedReply(ask('bye take care'))).toMatch(/Take care/); expect(fixedReply(ask('hi dude'))).not.toMatch(/tell me a little more/);
    expect(suggestChips(ask('hi dude')).length).toBeGreaterThan(2);
  });
  it('answers "what can you do / can you help me / what is tranzlife" with an introduction', () => {
    for (const q of ['what can you do', 'can you help me', 'i need help', 'what is tranzlife', 'tell me about your company', 'who made you'])
      expect(fixedReply(ask(q)), q).toMatch(/I'm Tulsi, the wellness assistant from TranzLife Biosciences/);
  });
  it('does not treat a health message that starts with a greeting as small talk', () => {
    expect(ask('hi i have a headache').mode).toBe('tips'); expect(ask('hello, can you help me with acidity').concerns).toEqual(['acidity']);
  });
});

describe('who the message is about', () => {
  it('does not carry "my friend" or someone else\'s medicine into the visitor\'s own new message', () => {
    const a = ask('my friend drinks alcohol a lot', 'Your friend could...', 'my father takes BP tablets and is tired', 'Your father could...', 'i smoke a lot i want to fix myself');
    expect(a.about.other).toBe(false);
    expect(routingNote(a)).not.toMatch(/someone else/);
    expect(a.suffix.join(' ')).not.toMatch(/Because of (your|their) health condition|If you are pregnant/);
    expect(a.products).toEqual(['craving-control', 'craving-gummies', 'pulmoclear']);   // the father's BP tablets are not the visitor's
  });
  it('talks about the other person when the latest message is about them', () => {
    const a = ask('my father takes BP tablets and wants to quit smoking');
    expect(a.about.other).toBe(true); expect(a.suffix.join(' ')).toMatch(/Because of their health condition/);
  });
  it('talks to the visitor when they say it about themselves', () => {
    expect(ask('i smoke a lot i want to fix myself').suffix.join(' ')).not.toMatch(/health condition/);
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
    expect(ask('I have sugar and feel tired all the time').products).toEqual(['reviva']);   // no Energy Booster; Reviva as diabetes support
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
    for (const q of ['period cramps', 'my eyes are yellow', 'my child has a cough', 'quit smoking',
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

  it('handles explain queries by describing product mechanism', () => {
    // Direct product explain with concern
    const a1 = ask('how this inhaler reduce stress');
    expect(a1.mode).toBe('explain');
    expect(a1.explainProducts).toEqual(['breathefree']);
    expect(fixedReply(a1)).toMatch(/Aromatherapy works through your sense of smell/);
    expect(fixedReply(a1)).not.toMatch(/Pause for a few minutes and breathe slowly/); // not generic lifestyle tips

    // Follow-up with anaphora ("how it works" after product recommendation)
    const a2 = ask('is there any product for smoking persons?', 'We recommend Craving Control and PulmoClear Gummies...', 'how it works');
    expect(a2.mode).toBe('explain');
    expect(a2.explainProducts.length).toBeGreaterThan(0);
    expect(fixedReply(a2)).toMatch(/Here is how these products may support you/);

    // Follow-up with "how these product help me ?"
    const a3 = ask('is there any product for smoking persons?', 'Here are products: Craving Control Inhaler and PulmoClear Gummies...', 'how these product help me ?');
    expect(a3.mode).toBe('explain');
    expect(fixedReply(a3)).toMatch(/Here is how these products may support you/);
  });

  it('handles suitability queries directly without dumping specs', () => {
    const a1 = ask('does a normal peson can intake gummies ?');
    expect(a1.mode).toBe('suitability');
    expect(a1.suitabilityProducts).toEqual(['pulmoclear', 'craving-gummies', 'respira']);
    const reply1 = fixedReply(a1);
    expect(reply1).toMatch(/You do not need to be a smoker to use them/);
    expect(reply1).toMatch(/Here is who these products are made for/);

    const a2 = ask('inhaler use panlam ah venam ah');
    expect(a2.mode).toBe('suitability');
    expect(a2.suitabilityProducts).toEqual(['breathefree', 'craving-control']);
    const reply2 = fixedReply(a2);
    expect(reply2).toMatch(/who these products are made for/);
  });

  it('avoids repeating the product pitch suffix on consecutive turns', () => {
    const a1 = ask('I am feeling so stressed at work');
    expect(a1.suffix.join(' ')).toMatch(/You might also like our BreatheFree/);

    // Follow-up turn where assistant already pitched BreatheFree in previous turn
    const a2 = ask('I am feeling so stressed at work', 'Take a break. You might also like our BreatheFree Aromatherapy Inhaler...', 'what else can I do for stress?');
    expect(a2.suffix.join(' ')).not.toMatch(/You might also like our BreatheFree/);
  });

  it('handles "how are you" as friendly small talk rather than symptom clarification', () => {
    const a = ask('how are you');
    expect(a.mode).toBe('smalltalk');
    expect(a.concerns).toEqual([]);
    expect(fixedReply(a)).not.toMatch(/Stress.*Trouble sleeping/);
  });

  it('prevents sticky red-flag loop from hijacking subsequent shop and product queries', () => {
    // 1. Alcoholism warning triggers on initial question
    const a1 = ask('my friend is alcoholic any product you suggest?');
    expect(a1.mode).toBe('flag');
    expect(a1.flags.map(f => f.id)).toContain('alcohol-dependence');

    // 2. Asking about Liver Booster for the friend addresses suitability with honesty note & safety warning
    const a2 = ask('my friend is alcoholic any product you suggest?', 'Shaking or sweating... see a doctor (Helpline 14446)...', 'can my friend use the liver booster to help him regain his health back?');
    expect(a2.mode).toBe('suitability');
    expect(a2.suitabilityProducts).toEqual(['liver-booster']);
    const r2 = fixedReply(a2);
    expect(r2).toMatch(/cannot undo the effects of heavy drinking/);
    expect(r2).toMatch(/14446/);

    // 3. Shop question is NOT hijacked by alcohol warning
    const a3 = ask('my friend is alcoholic', 'Shaking or sweating...', 'what are the products you are having');
    expect(a3.mode).toBe('shop');
    expect(fixedReply(a3)).toMatch(/Here's our current range/);

    // 4. Inhaler question is NOT hijacked by alcohol warning
    const a4 = ask('my friend is alcoholic', 'Shaking or sweating...', 'how this inhaler reduce stress');
    expect(a4.mode).toBe('explain');
    expect(a4.explainProducts).toEqual(['breathefree']);

    // 5. Follow-up "who can use this product?" on Liver Booster resolves to Liver Booster, NOT BreatheFree
    const a5 = ask('how this inhaler reduce stress', 'Here is how BreatheFree works...', 'what is the health benefits of liver booster', 'Here is how Liver Booster helps...', 'who can use this product?');
    expect(a5.mode).toBe('suitability');
    expect(a5.suitabilityProducts).toEqual(['liver-booster']);
    expect(fixedReply(a5)).toMatch(/Made for adults who want to support their general liver and digestive wellness/);
    expect(fixedReply(a5)).not.toMatch(/BreatheFree/);
  });

  it('addresses "tickling effect in chest" as airway / cough irritation and does not assume user smokes', () => {
    const a = ask('tickling effect in chest');
    expect(a.mode).toBe('tips');
    expect(a.concerns).toEqual(['cold']);
    expect(a.tips.some(t => t.text.includes('tickle in the throat or chest'))).toBe(true);

    const reply = fallbackReply(a);
    expect(reply).not.toMatch(/If you smoke, quitting/i);
    expect(reply).toMatch(/tickle in the throat or chest/i);
  });

  it('recognizes Tanglish product inventory inquiries like "namma kita iruka products pathi unaku theriyuma"', () => {
    const a = ask('namma kita iruka products pathi unaku theriyuma ?');
    expect(a.mode).toBe('shop');
    expect(a.lang).toBe('tanglish');
    expect(fixedReply(a)).toMatch(/Here's our current range/);
  });

  it('maps realistic common-man questions across all product categories', () => {
    // 1. Diabetes / Sugar control -> Reviva (support mode, doctor first)
    const sugar1 = ask('sugar control panna namma kita enna irukku');
    expect(sugar1.mode).toBe('support');
    expect(sugar1.products).toEqual(['reviva']);
    expect(fixedReply(sugar1)).toMatch(/Reviva Massage Roll-On/);
    expect(fixedReply(sugar1)).toMatch(/does not replace diabetes medicine/);

    const sugar2 = ask('blood sugar level maintain panna wellness product');
    expect(sugar2.mode).toBe('support');
    expect(sugar2.products).toEqual(['reviva']);

    // 2. Stress / Anxiety moments -> BreatheFree
    const stress1 = ask('exam fear pathattam ah iruku');
    expect(stress1.products).toContain('breathefree');

    const stress2 = ask('instant ah calm aaga oru aromatherapy product venum');
    expect(stress2.products).toContain('breathefree');

    // 3. Sudden cravings & tobacco habit -> Craving Control
    const crave1 = ask('sudden craving varumpothu enna panlam');
    expect(crave1.products).toContain('craving-control');

    const crave2 = ask('night time la cigarette pidikanum nu thonuthu');
    expect(crave2.products).toContain('craving-control');

    // 4. Period cramps & menstrual discomfort -> CycleRelief
    const period1 = ask('chums pain ethavathu product iruka');
    expect(period1.products).toContain('cyclerelief');

    const period2 = ask('monthly cycle pain relief product');
    expect(period2.products).toContain('cyclerelief');

    // 5. Liver health & digestion recovery -> Liver Booster
    const liver1 = ask('fatty liver iruku nu scan la sonnanga, any herbal syrup?');
    expect(liver1.products).toContain('liver-booster');

    const liver2 = ask('daily fast food sapdren, liver detox panna tonic iruka');
    expect(liver2.products).toContain('liver-booster');

    // 6. Fatigue & stamina -> Energy Booster
    const energy1 = ask('IT company night shift, body full ah drained and exhausted');
    expect(energy1.products).toContain('energy-booster');

    const energy2 = ask('daily evening dull and drowsy ah aagudhu');
    expect(energy2.products).toContain('energy-booster');

    // 7. Pollution & respiratory comfort -> PulmoClear
    const lung1 = ask('chennai traffic la daily travel panren, pollution nala mooku adaikuthu');
    expect(lung1.products).toContain('pulmoclear');

    const lung2 = ask('frequent ah cold varuthu immunity increase panna ethavathu iruka');
    expect(lung2.products).toContain('pulmoclear');
  });
});

describe('how it works and who can use it', () => {
  const reply = (...t) => { const a = ask(...t); return { a, r:a.mode === 'flag' ? '' : (fixedReply(a) || '') }; };
  it('keeps warning signs first, even on a product follow-up', () => {
    for (const t of [["I'm diabetic with a sore on my toe", 'ok', 'can I use reviva on it?'], ['my eyes look yellow', 'ok', 'how does the liver booster work?'], ['blood in my stool', 'ok', 'how does it work?']]){
      const a = ask(...t); expect(a.mode, t.at(-1)).toBe('flag'); expect(a.products, t.at(-1)).toEqual([]);
    }
  });
  it('puts the caution for this person before anything else', () => {
    expect(reply('can my dad use liver booster, he takes BP tablets?').r).toMatch(/^Because of their health condition or regular medicine/);
    const kids = reply('who can use breathefree? can kids use it?'); expect(kids.a.products).toEqual([]); expect(kids.r).toMatch(/^For children, please ask their doctor first/);
    const preg = reply('can a pregnant woman use cycle relief?'); expect(preg.a.mode).toBe('suitability'); expect(preg.r).toMatch(/^During pregnancy or breastfeeding/);
    expect(reply('I am pregnant, how does energy booster work?').r).toMatch(/^During pregnancy or breastfeeding/);
  });
  it('never says a product is for anyone and adds a general caution when none applied', () => {
    const { r } = reply('who can use pulmoclear?');
    expect(r).toMatch(/^Made for adults/); expect(r).toMatch(/pregnant or breastfeeding, have a long-term condition or take regular medicine/);
  });
  it('catalogue texts use traditional-use wording only', () => {
    for (const p of CATALOG){
      const t = `${p.mechanism || ''} ${p.suitability || ''}`;
      expect(t, p.id).not.toMatch(/hepatoprotect|antispasmodic|research|clinically|proven|opens the airways|warming|for anyone|for any woman|^Yes\b/i);
    }
  });
  it('explain and suitability replies pass the reply checker', () => {
    for (const q of ['how does the liver booster work?', 'how does cycle relief work?', 'how does reviva work?', 'who can use pulmoclear?', 'who can use craving control inhalers?', 'who can use energy booster?']){
      const { a, r } = reply(q); expect(r, q).not.toBe(''); expect(problems(r, a), q).toEqual([]);
    }
  });
});

describe('helping a friend who may depend on alcohol', () => {
  const FULL = "Shaking, sweating or feeling unwell without a drink, or needing a drink first thing in the morning, can mean the body depends on alcohol. Then stopping suddenly can be dangerous, so please see a doctor for help to cut down safely. India's free de-addiction helpline is 14446.";
  it('knows "my alcoholic friend" is about the friend and keeps the warning on the follow-up', () => {
    expect(ask('i want to help my alcoholic friend').subject).toBe('other');
    const a = ask('i want to help my alcoholic friend', FULL, 'is there any product for my friend?');
    expect(a.flags.map(f => f.id)).toEqual(['alcohol-dependence']);
    expect(a.mode).toBe('recommend'); expect(a.products).toEqual(['liver-booster']);
    const r = fixedReply(a);
    expect(r).toMatch(/^Because of the drinking, please let a doctor guide them/);   // warning first, short after the full one
    expect(r).toMatch(/While they cut down on alcohol, this may help support their liver/);
    expect(r.match(/cannot undo the effects of heavy drinking/g)).toHaveLength(1);   // said once
    expect(problems(r, a)).toEqual([]);
  });
  it('answers "is this safe?" about the product just suggested, warning first', () => {
    const a = ask('i want to help my alcoholic friend', FULL, 'is there any product for my friend?', 'Because of the drinking ... 14446 ... Liver Booster ...', 'is this safe?');
    expect(a.mode).toBe('safety'); expect(a.safetyProducts).toEqual(['liver-booster']);
    const r = fixedReply(a);
    expect(r).toMatch(/^Because of the drinking/); expect(r).toMatch(/for the Liver Booster, please read the label/);
    expect(r).not.toMatch(/current range/);
  });
  it('urgent warnings still block products on the same questions', () => {
    const a = ask('my eyes look yellow', 'ok', 'is there any product for this?');
    expect(a.mode).toBe('flag'); expect(a.products).toEqual([]);
    expect(ask('my dad has blood in his stool', 'ok', 'is this safe?').mode).toBe('flag');
  });
  it('a new drinking warning in the latest message is always the full warning', () => {
    expect(ask('my friend shakes when he does not drink, any product for him?').mode).toBe('flag');
  });
});

describe('agreeing after a reply', () => {
  const P = 'Alongside your doctor\'s treatment, you could look at our Reviva Massage Roll-On, a massage roll-on ...';
  it('"yeah sure" after a product suggestion points to the card instead of greeting again', () => {
    for (const yes of ['yeah sure', 'yes', 'sure', 'ok sure', 'yep', 'sounds good']){
      const a = ask('any product for diabetes', P, yes);
      expect(a.mode, yes).toBe('smalltalk'); expect(a.smallTalkKind, yes).toBe('ok');
      expect(fixedReply(a), yes).toMatch(/Tap Enquire on the product card/); expect(suggestChips(a), yes).toEqual([]);
    }
  });
  it('agreeing after tips is a short "sure", and a real hi is still a greeting', () => {
    expect(fixedReply(ask('I am stressed', 'Try a short walk.', 'yeah'))).toMatch(/^Sure!/);
    const hi = ask('I am stressed', 'Try a short walk.', 'hi'); expect(hi.smallTalkKind).toBe('greeting'); expect(suggestChips(hi).length).toBeGreaterThan(0);
  });
});

// Tester feedback (Nov 2026): closing message, "None of the above" loop, missing Enquire button, random input
describe('conversation flow', () => {
  const CLARIFY = 'I want to make sure I help with the right thing. Could you tell me a little more about how you feel, or pick one of these?';
  it('ends the chat with a closing message when the visitor is done', () => {
    for (const q of ['no thanks', 'no', 'nothing else', "that's all", 'thats all thanks', "i'm good", 'no thank you bye', 'illa', 'podhum', 'bye']){
      const a = ask(q); expect(a.mode, q).toBe('smalltalk'); expect(a.smallTalkKind, q).toBe('bye');
      expect(fixedReply(a), q).toMatch(/Thank you for chatting/); expect(replyActions(a), q).toEqual(['contact', 'new']);
    }
    const after = ask('I want to quit smoking', 'You could look at our PulmoClear Craving Control Gummies.', 'no thanks');
    expect(fixedReply(after)).toMatch(/tap Enquire on a product card/);
  });
  it('does not mistake ordinary messages for "done"', () => {
    expect(ask('no appetite').mode).not.toBe('smalltalk');
    expect(ask('nothing helps my back pain').mode).toBe('tips');
  });
  it('"None of the above" gets a different reply with a way out, never the same question again', () => {
    const first = ask('asdf 12345'); expect(first.mode).toBe('clarify'); expect(suggestChips(first)).toContain('None of these');
    for (const q of ['None of these', 'none of the above', 'something else', 'other']){
      const a = ask('asdf 12345', CLARIFY, q); expect(a.clarifyKind, q).toBe('other');
      expect(fixedReply(a), q).not.toBe(fixedReply(first)); expect(fixedReply(a), q).toMatch(/own words/); expect(replyActions(a), q).toEqual(['contact']);
    }
  });
  it('random input twice gets a new reply, and a third time hands over to the team', () => {
    const second = ask('asdf 12345', CLARIFY, 'qwerty'); expect(second.clarifyKind).toBe('again');
    expect(fixedReply(second)).not.toBe(CLARIFY); expect(replyActions(second)).toContain('contact');
    const third = ask('asdf', CLARIFY, 'qwerty', fixedReply(second), 'zzzz'); expect(third.clarifyKind).toBe('stuck');
    expect(fixedReply(third)).not.toBe(fixedReply(second)); expect(replyActions(third)).toEqual(['contact', 'new']);
    expect(ask('12345').clarifyKind).toBe('unreadable');
    // after "None of these", another unclear message moves on too (never back to the first question)
    const other = fixedReply(ask('asdf', CLARIFY, 'None of these'));
    expect(ask('asdf', CLARIFY, 'None of these', other, 'qwerty').clarifyKind).toBe('again');
  });
  it('random input during a topic asks about that topic, with a chip that goes back to it', () => {
    const a = ask('I want to quit smoking', 'Some tips...', 'jkjkjk'); expect(a.clarifyKind).toBe('topic');
    expect(fixedReply(a)).toMatch(/quitting smoking/);
    const chip = suggestChips(a)[0]; expect(ask(chip).concerns).toContain('smoking');
  });
  it('order, price and contact questions come with a Contact our team button', () => {
    for (const q of ['how to order', 'price', 'i want to buy']){ const a = ask(q); expect(a.mode, q).toBe('shop'); expect(replyActions(a), q).toEqual(['contact']); }
    for (const q of ['what is your phone number', 'can i talk to a person', 'enquiry', 'how can I contact you', 'whatsapp number']){
      const a = ask(q); expect(a.mode, q).toBe('contact'); expect(fixedReply(a), q).toMatch(/Contact our team/); expect(replyActions(a), q).toEqual(['contact']);
    }
    // the understanding layer may call a short message small talk; a contact question still gets the contact reply
    const sem = analyse([{ role:'user', content:'what is your phone number' }], { semantic:{ intent:'smalltalk' } }); expect(sem.mode).toBe('contact');
    expect(replyActions(ask('any product for diabetes', 'Alongside your doctor\'s treatment, you could look at our Reviva Massage Roll-On', 'ok'))).toEqual(['contact']);
  });
});

// Tranzlife Products - KT.docx (Nov 2026): claims the team must not make, and the brochure contact details
describe('product knowledge (KT document)', () => {
  it('never claims detox, strengthening the lungs, immunity or a cure in customer-facing product text', () => {
    for (const p of CATALOG){
      const t = [p.name, p.pitch, p.about, p.mechanism, p.suitability, p.use].filter(Boolean).join(' ').toLowerCase();
      for (const bad of ['detox', 'cleanse', 'strengthen', 'immunity', 'regenerat', 'non-addictive', 'best results'])
        expect(t.includes(bad), `${p.id}: ${bad}`).toBe(false);
    }
  });
  it('knows the KT facts for each focus product', () => {
    const by = id => CATALOG.find(p => p.id === id);
    expect(by('liver-booster').about).toMatch(/13 botanical/); expect(by('liver-booster').use).toMatch(/10 ml twice daily after meals/);
    expect(by('pulmoclear').use).toMatch(/pack label/); expect(by('pulmoclear').size).toMatch(/60 gummies/);
    expect(by('energy-booster').use).toMatch(/7.5 ml twice daily/); expect(by('energy-booster').size).toBe('500 ml');
    expect(by('reviva').size).toBe('50 ml'); expect(by('cyclerelief').size).toBe('8 ml');
    expect(by('reviva').about).toMatch(/not a diabetes medicine/);
  });
  it('shares the brochure phone and email when asked how to contact the team', () => {
    const r = fixedReply(ask('what is your phone number'));
    expect(r).toMatch(/917 611 2188/); expect(r).toMatch(/info@tranzlife.in/);
  });
});

// Tester chat (Nov 2026): "Acidity" -> tips -> "do you have any products for that" got "our usual suggestions are ."
describe('asking for a product where none fits', () => {
  it('says honestly there is no product, never an empty list or Enquire line', () => {
    const a = ask('hello there', 'Hi!', 'Acidity', 'Try smaller meals.', 'do you have any products for that');
    expect(a.mode).toBe('recommend'); expect(a.products).toEqual([]);
    const r = fixedReply(a);
    expect(r).toMatch(/don't have a TranzLife product made for acidity/); expect(r).not.toMatch(/suggestions are \./); expect(r).not.toMatch(/Tap Enquire/);
  });
  it('gives the approved tips when the question comes first', () => {
    const r = fixedReply(ask('any product for headache'));
    expect(r).toMatch(/don't have a TranzLife product made for headaches/); expect(r).toMatch(/^- /m);
  });
  it('no product-less topic ever produces an empty suggestion list', () => {
    for (const c of CONCERNS.filter(c => !c.products?.length)){
      const r = fixedReply(ask(`any product for ${c.label}`));
      expect(r, c.id).not.toMatch(/suggestions are \./); expect(r, c.id).not.toMatch(/\.\s*\./);
    }
  });
});

// Tester chat (Nov 2026): a man asking about periods, "are u mad ?", "any product for kidney ?"
describe('tester chat: periods for a man, frustration, unknown product topic', () => {
  it('a man asking about periods for himself gets a kind question, no period tips and no CycleRelief', () => {
    for (const t of [['i am an man i facing the periods issue'], ['im a guy and i have period pain'], ['i am an man i facing the periods issue', 'Periods can be tough!', 'i am an man how i have periods issue ?']]){
      const a = ask(...t); const q = t[t.length - 1];
      expect(a.mode, q).toBe('askwho'); expect(a.products, q).toEqual([]); expect(a.tips, q).toEqual([]);
      expect(fixedReply(a), q).toMatch(/Are you asking for someone else/); expect(fixedReply(a), q).not.toMatch(/CycleRelief|hot water/);
    }
    // also when the understanding layer found the period topic
    const sem = analyse([{ role:'user', content:'i am an man i facing the periods issue' }], { semantic:{ concerns:['period'], intent:'tips', subject:'self' } });
    expect(sem.mode).toBe('askwho'); expect(sem.products).toEqual([]);
    // the quick reply for his wife works, and women still get period help
    expect(suggestChips(sem)).toContain('My wife has period cramps');
    expect(ask('i am a man', 'Thanks for telling me...', 'My wife has period cramps').products).toEqual(['cyclerelief']);
    expect(ask('i have period cramps').products).toEqual(['cyclerelief']);
  });
  it('"are u mad ?" gets an apology and a way to reach the team, never "Sure!"', () => {
    for (const q of ['are u mad ?', 'are you crazy', 'you are useless', 'what nonsense', 'this is wrong answer', 'loosu ah nee']){
      const a = ask('i am an man i facing the periods issue', 'Periods can be tough!', q);
      expect(a.mode, q).toBe('sorry'); expect(fixedReply(a), q).toMatch(/^Sorry/); expect(replyActions(a), q).toEqual(['contact']);
    }
    const sem = analyse([{ role:'user', content:'are u mad ?' }], { semantic:{ intent:'smalltalk' } }); expect(sem.mode).toBe('sorry');
    expect(ask('ok').mode).toBe('smalltalk');
  });
  it('"any product for kidney ?" says there is no product and lists what the range is for', () => {
    const a = ask('does u have any product for kidney ?'); expect(a.clarifyKind).toBe('noproduct');
    expect(fixedReply(a)).toMatch(/don't have a TranzLife product for kidney/); expect(fixedReply(a)).toMatch(/doctor/);
    expect(ask('kidney problem').mode).toBe('medical');
    // people and general words are not topics
    for (const q of ['any product for my friend', 'which product is good for daily use', 'any product for my wife', 'what product for this'])
      expect(ask(q).clarifyKind, q).toBe('choose');
  });
});

describe('tester chat: asking a man the same question twice', () => {
  it('the second time gives a direct answer instead of repeating the question', () => {
    const first = fixedReply(ask('i am an man i facing the periods issue'));
    const second = fixedReply(ask('i am an man i facing the periods issue', first, 'i am an man how i have periods issue ?'));
    expect(second).not.toBe(first); expect(second).toMatch(/^Men don't have periods/); expect(second).toMatch(/doctor/);
  });
});

// Tester chat (Nov 2026): "is this trustable?", repeated headache tips, "kidney health" answered as headache, "thankyou"
describe('tester chat: trust, repeated tips, new topic, thankyou', () => {
  const H = 'Try to relax, as stress can make headaches worse. Drink plenty of water. Hope this helps.';
  it('"is this trustable?" explains who TranzLife is and how to reach them, never the product list', () => {
    for (const q of ['is this trustable?', 'is this site genuine', 'is it a scam', 'are your products certified?', 'nambalama?']){
      const a = ask(q); expect(a.mode, q).toBe('trust');
      const r = fixedReply(a); expect(r, q).toMatch(/Chennai/); expect(r, q).toMatch(/917 611 2188/); expect(r, q).not.toMatch(/current range/);
      expect(replyActions(a), q).toEqual(['contact']);
    }
    // the understanding layer may call it a shop question; the trust reply still wins
    expect(analyse([{ role:'user', content:'is this trustable?' }], { semantic:{ intent:'shop' } }).mode).toBe('trust');
  });
  it('does not repeat the tips it just gave when asked for a product', () => {
    const r = fixedReply(ask('i am facing headache', H, 'suggest your product for headache'));
    expect(r).toMatch(/don't have a TranzLife product made for headaches/); expect(r).not.toMatch(/^- /m);
  });
  it('a new topic in a product question is never answered with the previous topic', () => {
    const a = ask('i am facing headache', H, 'suggest your product for headache', 'We don\'t have a TranzLife product made for headaches right now', 'any product for kidney health?');
    expect(a.concerns).toEqual([]); const r = fixedReply(a);
    expect(r).toMatch(/product for kidney health/); expect(r).not.toMatch(/headache/);
    // a real follow-up still keeps the topic
    expect(ask('I want to quit smoking', 'Some tips.', 'which product should i use').products.length).toBeGreaterThan(0);
  });
  it('"thankyou" as one word is thanks', () => {
    for (const q of ['thankyou', 'thanku so much', 'tnx', 'thanx']){
      const a = ask(q); expect(a.smallTalkKind, q).toBe('thanks'); expect(fixedReply(a), q).toMatch(/You're welcome/);
    }
  });
});
