// Out-of-the-box customer questions (14 Nov 2026): taste and form, who a product suits, gifts, prices, product facts,
// lifestyle goals, shop questions and off-topic ones. Before, about 45 of these got "Happy to help you choose" or an
// unrelated answer. Each row: the question, what kind of answer it must get, the products shown, and words the reply
// must contain.
import { describe, expect, it } from 'vitest';
import { analyse } from '../../server/advisor-rules.js';
import { fixedReply, replyActions } from '../../server/reply-check.js';

const ask = q => analyse([{ role:'user', content:q }]);

const ROWS = [
  // picking by preference
  ['What product you suggest as a sweet supplement?', 'sweet', ['pulmoclear'], /berry-flavoured gummies/],
  ['which product is tasty', 'sweet', ['pulmoclear'], /sweet and easy to take/],
  ['i dont like bitter medicine, anything easy to take?', 'sweet', ['pulmoclear'], /chewable/],
  ['do you have anything chewable', 'sweet', ['pulmoclear'], /chewable/],
  ['i cant swallow tablets, what can i use', 'notablets', [], /None of our products are tablets/],
  ['something i can apply instead of eating', 'external', ['cyclerelief', 'reviva', 'breathefree'], /nothing to swallow/],
  ['which product can i carry while travelling', 'travel', ['breathefree', 'cyclerelief'], /easy to carry/],
  ['what can i gift my parents', 'gift', ['energy-booster', 'reviva'], /wellness gifts/],
  ['good gift for my wife', 'gift', ['cyclerelief', 'breathefree', 'energy-booster'], /wellness gifts/],
  ['which product is best seller', 'bestseller', [], /depends on what you'd like support with/],
  ['which is your cheapest product', 'cheapest', ['pulmoclear'], /from lowest/],
  ['which product is good for men', 'men', ['pulmoclear', 'breathefree', 'liver-booster', 'reviva', 'energy-booster'], /except CycleRelief/],
  ['products for women', 'women', ['cyclerelief'], /just for women/],
  ['which one should i buy first', 'bestseller', [], /depends on what you'd like support with/],
  // product facts, answered honestly
  ['is your product vegetarian', 'diet', [], /ingredient list is printed on every pack/],
  ['is pulmoclear sugar free', 'sugar', ['pulmoclear'], /don't have their exact sugar content/],
  ['can diabetics eat the gummies', 'sugar', ['pulmoclear'], /Reviva Massage Roll-On/],
  ['can i take liver booster and energy booster together', 'together', ['liver-booster', 'energy-booster'], /check with your doctor or pharmacist/],
  ['what is the difference between energy booster and liver booster', 'difference', ['liver-booster', 'energy-booster'], /how they differ/],
  ['how long to see results', 'results', [], /no fixed time/],
  ['will i get side effects', 'sideeffects', [], /patch test/],
  ['is it ayurvedic', 'natural', [], /natural ingredients/],
  ['is it natural or chemical', 'natural', [], /not medicines/],
  ['can i take energy booster on empty stomach', 'food', ['energy-booster'], /7\.5 ml twice daily/],
  ['can i take liver booster with milk', 'food', ['liver-booster'], /after meals/],
  ['how to store liver booster', 'storage', ['liver-booster'], /refrigerator after opening/],
  ['what is the expiry', 'expiry', [], /printed on each pack/],
  ['how many days will one bottle last', 'lasts', [], /about 10 days/],
  ['is it safe for long term use', 'longterm', [], /check with your doctor/],
  ['is reviva sticky', 'smell', ['reviva'], /small amount/],
  ['does cyclerelief smell', 'smell', ['cyclerelief'], /dill and eucalyptus/],
  ['can i use breathefree in office', 'discreet', ['breathefree'], /pocket-sized and discreet/],
  ['is breathefree like vape', 'vape', ['breathefree'], /not a vape/],
  // lifestyle goals
  ['best product for gym and workout', 'gym', ['energy-booster'], /Energy Booster/],
  ['product for students during exams', 'exams', ['breathefree', 'energy-booster'], /exam time/],
  ['something to stay fresh in the morning', 'fresh', ['energy-booster'], /start the day/],
  ['is there anything for hangover', 'hangover', [], /don't have a product for hangovers/],
  ['i want to look young', 'beauty', [], /launch soon/],
  ['something for glowing skin', 'beauty', [], /launch soon/],
  ['product for weight loss', 'weightloss', [], /launch soon/],
  ['do you have protein powder', 'notsold', [], /We don't sell protein powder/],
  ['do you sell vitamin d', 'notsold', [], /not as a vitamin supplement/],
  ['do you have hair oil', 'notsold', [], /We don't sell hair oil/],
  // shop and business
  ['do you deliver to bangalore', 'delivery', [], /91503 94443/],
  ['cash on delivery available?', 'payment', [], /cash on delivery/],
  ['can i return the product', 'returns', [], /order details/],
  ['any discount', 'offers', [], /offers, combos/],
  ['do you have any combo offer', 'offers', [], /offers, combos/],
  ['do you have a shop in chennai', 'shop', [], /Egmore, Chennai/],
  ['can i become a dealer or distributor', 'business', [], /info@tranzlife\.in/],
  // second and third batches (new wordings, Tanglish)
  ['what can i buy under 300 rupees', 'cheapest', ['pulmoclear', 'cyclerelief'], /Within ₹300/],
  ['show me products below 250', 'cheapest', ['pulmoclear'], /Within ₹250/],
  ['is liver booster bitter', 'smell', ['liver-booster'], /slightly bitter/],
  ['i hate syrups, is there anything else', 'notablets', [], /Chewable gummies/],
  ['got anything that tastes like candy', 'sweet', ['pulmoclear'], /berry-flavoured/],
  ['does the gummy contain pork gelatine', 'diet', ['pulmoclear'], /ingredient list/],
  ['can i send it to my sister in kerala', 'delivery', [], /delivery to your city/],
  ['my parcel came broken', 'returns', [], /damaged or wrong product/],
  ['looking for a present for my grandma', 'gift', ['energy-booster', 'reviva'], /wellness gifts/],
  ['i run a pharmacy, can i stock your products', 'business', [], /dealership, distribution/],
  ['who is the owner of tranzlife', 'company', [], /Chennai-based life sciences company/],
  ['who started this brand', 'company', [], /info@tranzlife\.in/],
  ['will energy booster make me addicted', 'longterm', [], /nicotine-free/],
  ['what is 2+2', 'offtopic', [], /can't help with that one/],
  ['how many gummies in one box', 'packsize', ['pulmoclear'], /60 gummies/],
  ['what is the pack size of liver booster', 'packsize', ['liver-booster'], /200 ml/],
  ['i want to order 10 bottles for my shop', 'business', [], /dealership, distribution/],
  ['what is the score in the india match', 'offtopic', [], /can't help with that one/],
  ['name a good skin doctor near anna nagar', 'doctor', [], /can't recommend a specific doctor/],
  ['can you recommend a hospital for my mother', 'doctor', [], /can't recommend a specific doctor/],
  // off-topic
  ['tell me a joke', 'joke', [], /well-rooted/],
  ['what is the weather today', 'offtopic', [], /can't help with that one/],
  ['suggest a good doctor in chennai', 'doctor', [], /can't recommend a specific doctor/]
];

describe(`out-of-the-box questions (${ROWS.length})`, () => {
  for (const [q, id, products, says] of ROWS){
    it(q, () => {
      const a = ask(q);
      expect(a.mode, q).toBe('faq'); expect(a.faq.id, q).toBe(id);
      expect(a.products, q).toEqual(products);
      const r = fixedReply(a); expect(r, q).toMatch(says);
      expect(r, q).not.toMatch(/Happy to help you choose|help with the right thing/);
      if (products.length) expect(products.every(p => r.includes(['PulmoClear', 'BreatheFree', 'Liver Booster', 'CycleRelief', 'Reviva', 'Energy Booster'][['pulmoclear', 'breathefree', 'liver-booster', 'cyclerelief', 'reviva', 'energy-booster'].indexOf(p)])), q).toBe(true);
    });
  }
  it('other kinds of answers', () => {
    expect(ask('do you have certificate').mode).toBe('trust');
    expect(ask('which product for monsoon cold').products).toEqual(['pulmoclear']);
    expect(ask('i work night shifts, what should i take').products).toEqual(['energy-booster']);
    const kid = ask('can i give pulmoclear to my 10 year old'); expect(kid.products).toEqual([]);
    expect(fixedReply(kid)).toMatch(/made for ages 14 and above, so for a child, please ask the child's doctor/);
    expect(ask('can my 15 year old son use energy booster').products).toEqual(['energy-booster']);
    expect(replyActions(ask('do you deliver to bangalore'))).toContain('whatsapp');
  });
  it('a product named for the wrong problem gets a correction and that problem\'s help', () => {
    const a = ask('can i use cycle relief for headache'); expect(a.mode).toBe('tips'); expect(a.products).toEqual([]);
    expect(a.prefix.join(' ')).toMatch(/The CycleRelief Roll-On is .*not for headaches/);
    expect(ask('can my dad use liver booster, he takes BP tablets?').mode).toBe('suitability');   // a condition is a caution, not a wrong use
  });
  it('a product named for a child or someone too old says so first', () => {
    expect(fixedReply(ask('is breathefree safe for kids'))).toMatch(/^The BreatheFree Aromatherapy Inhaler is made for ages 14 and above/);
    expect(fixedReply(ask('can my 70 year old dad use liver booster'))).toMatch(/^The Liver Booster is made for ages 14 to 50/);
    expect(ask('do u have something kids would like to eat').mode).toBe('kids');
  });
  it('the meaning-based match: product questions picked by meaning, general "suggest something" kept general', async () => {
    const { decide } = await import('../../server/understand.js');
    if (!decide) return;
    const base = { concern:{ tired:0.6 }, intent:{}, product:{} };
    expect(decide({ ...base, faq:{ sweet:0.78, gift:0.70 } }).faq).toBe('sweet');
    expect(decide({ ...base, faq:{ sweet:0.70 } }).faq).toBe(null);                          // too far in meaning
    expect(decide({ ...base, concern:{ tired:0.76 }, faq:{ sweet:0.78 } }).faq).toBe(null);   // a health topic is as close
    expect(decide({ ...base, intent:{ recommend:0.8 }, faq:{ travel:0.78 } }).faq).toBe(null); // "recommend something"
    expect(decide({ ...base, intent:{ recommend:0.8 }, faq:{ sweet:0.99 } }).faq).toBe('sweet'); // "enaku inippa supplement venum"
  });
  it('health questions still get the health flow, not a shop answer', () => {
    expect(ask('natural remedy for thyroid').mode).toBe('tips');
    expect(ask('i take bp tablets and feel tired').mode).toBe('tips');
    expect(ask('my back pain returns every winter').concerns).toContain('back');
    expect(ask('i get travel sickness in the bus').concerns).toContain('motion');
    expect(ask('can i take energy booster with my bp tablets').mode).not.toBe('faq');
  });
});
