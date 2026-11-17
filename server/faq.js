// Product and shop questions that are not a health problem: taste and form ("a sweet supplement?"), who a product
// suits, gifts, prices, storage, how long a pack lasts, using two together, delivery, payment, returns, dealership,
// and off-topic questions (jokes, weather, "suggest a doctor").
//
// Answered by code from the catalogue (src/data/catalog.js, the KT document) and the client's answers (13-14 Nov 2026),
// never by the model. Where we do not have a fact (sugar content, vegetarian, delivery cities, return policy) the
// answer says so honestly and points to the official WhatsApp number instead of guessing.
//
// Each entry: { id, match, needs?:'one'|'two' (named products required), answer(ctx) -> { text, products?, chips?, actions? } }
// ctx: { last, named (product ids in the message), person ({ age, group, gender }), CATALOG helpers }
// The first matching entry wins, so specific ones come before general ones.
import { CATALOG } from '../src/data/catalog.js';

const P = id => CATALOG.find(p => p.id === id);
const price = p => p.price ? `₹${p.price}` : p.priceSoon ? 'price coming soon' : 'price on request';
const WA = '+91 91503 94443';
const ASK_WA = `For that, please message us on WhatsApp at **${WA}** and the team will confirm.`;
const line = p => `- **${p.name}** (${price(p)}): ${p.pitch}.`;
const list = ids => ids.map(id => line(P(id))).join('\n');
const ALL = CATALOG.map(p => p.id);
const NEEDS = ['Quit smoking', 'Lung health', 'Liver care', 'Period cramps', 'Low energy'];

const FAQ = [
  // ---------- about one or two named products ----------
  { id:'vape', needs:'one', health:true, match:/\b(vape|vaping|e-?cig\w*|electronic\s*cigarette|hookah|like\s*(a\s*)?cigarette)\b/i,
    answer:() => ({ products:['breathefree'], text:'No. The **BreatheFree Aromatherapy Inhaler** is not a vape or an e-cigarette: there is no nicotine, no smoke, no heating and no battery. It is a small pocket inhaler with a natural essential oil blend; you open it and gently breathe in the aroma for a fresh, calming moment, for example when the urge to smoke comes.' }) },
  { id:'discreet', needs:'one', match:/\b(office|work\s*place|workplace|in\s*public|public\s*place|outside|travel\w*|bus|train|flight|discreet|carry)\b/i,
    answer:({ named }) => named.includes('breathefree')
      ? { products:['breathefree'], text:'Yes. The **BreatheFree Aromatherapy Inhaler** is pocket-sized and discreet, so you can keep it in your pocket or bag and use it at the office, while travelling or anywhere you need a calm, fresh moment. Just remove the cap and inhale gently.' }
      : null },
  { id:'together', needs:'two', match:/\b(together|both|combine|combined|along\s*with|with\s*each\s*other|same\s*time|at\s*once)\b/i,
    answer:({ named }) => ({ products:named, text:`These are made for different needs:\n${list(named)}\n\nI don't have information on using them together, so please check with your doctor or pharmacist first, especially if you take any regular medicine. ${ASK_WA.replace('For that, please', 'You can also')}` }) },
  { id:'difference', needs:'two', match:/\b(difference|differ|different|vs|versus|compare|comparison|which\s*(one\s*)?is\s*better|better\s*than)\b/i,
    answer:({ named }) => ({ products:named, text:`Here's how they differ:\n${named.map(id => { const p = P(id); return `- **${p.name}** (${p.form}, ${p.size}, ${price(p)}): ${p.highlight || p.pitch}.`; }).join('\n')}\n\nThe right one depends on what you'd like support with. Tell me, and I'll point you to the best fit.` }) },
  { id:'smell', needs:'one', match:/\b(smell|smells|odou?r|fragrance|scent|aroma|sticky|oily|greasy|stain|taste|tastes|tasty|bitter|sweet|flavou?r)\b/i,
    answer:({ named, last }) => {
      const p = P(named[0]);
      if (/sticky|oily|greasy|stain/i.test(last)) return { products:[p.id], text:`I don't have that detail for the **${p.name}**. Use only a small amount and massage it in gently, as the label says. For anything more, please message us on WhatsApp at **${WA}**.` };
      const aroma = { cyclerelief:'a fresh, herbal aroma from its dill and eucalyptus essential oils', reviva:'a fresh, herbal aroma from its dill and eucalyptus essential oils', breathefree:'a fresh, cool aroma from its natural essential oil blend (the product poster mentions peppermint, lavender, eucalyptus and lemon)', pulmoclear:'a natural berry flavour', 'liver-booster':'the natural herbal taste of its 13 botanicals, so it can taste slightly bitter, like most herbal liquids', 'energy-booster':'the natural taste of its botanical and mineral ingredients' }[p.id];
      const tail = p.ingested ? (p.id === 'pulmoclear' ? 'They are chewable gummies, easy to take.' : 'If you prefer something sweet and easy to take, our PulmoClear Gummies are berry-flavoured.') : 'It is applied or inhaled, not eaten. If you are sensitive to strong smells or essential oils, try a small amount first.';
      return { products:[p.id], text:`The **${p.name}** has ${aroma}. ${tail}` };
    } },
  { id:'food', needs:'one', match:/\b(milk|water|juice|tea|coffee|empty\s*stomach|before\s*(food|meals?|eating|breakfast)|after\s*(food|meals?|eating)|with\s*food|on\s*an?\s*empty)\b/i,
    answer:({ named }) => {
      const p = P(named[0]);
      if (!p.ingested) return { products:[p.id], text:`The **${p.name}** is not swallowed: ${p.useShort}. So food and drink don't matter for it.` };
      const when = p.id === 'liver-booster' ? 'The label says 10 ml twice daily after meals, using a measuring cup.' : p.id === 'energy-booster' ? 'The label says 7.5 ml twice daily, using the measuring device in the pack.' : 'Please follow the serving and timing on the pack label.';
      return { products:[p.id], text:`For the **${p.name}**: ${when} I don't have any information about taking it with milk or other drinks, or on an empty stomach, so please take it exactly as the label says, or as your doctor advises.` };
    } },
  { id:'packsize', needs:'one', match:/\bhow\s*(many|much)\s*(gummies|ml|pieces|tablets|quantity)|\b(pack|bottle|box)\s*(size|contains?|quantity)|\bquantity\b|\bhow\s*(much|many)\s*(is\s*)?(in|inside)\s*(one|a|the|each)\s*(box|bottle|pack)|\bin\s*(one|a|each)\s*(box|bottle|pack)\b/i,
    answer:({ named }) => ({ products:named, text:named.map(id => { const p = P(id); return `The **${p.name}** comes as ${p.size} (${p.form.toLowerCase()}), ${price(p)}.`; }).join(' ') }) },
  { id:'storage', needs:'one', match:/\b(store|storage|keep\s*it|fridge|refrigerat\w*|room\s*temperature|heat|sunlight)\b/i,
    answer:({ named }) => {
      const p = P(named[0]);
      const how = p.id === 'liver-booster' ? 'Shake well before use and keep it in the refrigerator after opening.' : 'Keep it closed, in a cool, dry place away from direct sunlight, as the pack label says.';
      return { products:[p.id], text:`For the **${p.name}**: ${how} Always keep it out of reach of children.` };
    } },

  // ---------- picking a product by preference ----------
  { id:'sweet', match:/\b(sweet|tasty|taste\s*(good|nice)|yummy|delicious|flavou?r\w*|candy|toffee|bitter|chew(able|y)?|kids?\s*(would\s*)?(love|like|enjoy)|(will|would)\s*(actually\s*)?eat)\b/i,
    answer:() => { const p = P('pulmoclear');
      return { products:['pulmoclear'], text:`If you'd like something sweet and easy to take, our **${p.name}** (${price(p)}) are chewable, natural berry-flavoured gummies: ${p.highlight}. They're made for everyday respiratory wellness, for ages 14 and above. If you have diabetes, please check the sugar content on the label with your doctor first.\n\nOur other products aren't sweets: the Liver Booster and Energy Booster are herbal liquids, CycleRelief and Reviva are roll-ons, and BreatheFree is an aromatherapy inhaler.` }; } },
  { id:'notablets', match:/\b(can'?t|cannot|unable\s*to|hard\s*to|difficult\s*to|don'?t\s*like(\s*to)?|hate|dislike)\s*(swallow|take\s*tablets|take\s*pills|syrups?|liquids?|tonics?|medicines?)|\b(no|not|without)\s*(tablets?|pills?|capsules?|syrups?)\b|\bother\s*than\s*(liquid|syrup|tablet)s?\b/i,
    answer:() => ({ chips:NEEDS, text:`None of our products are tablets or capsules, so you have easy options:\n- Chewable gummies: **PulmoClear Lung Booster Gummies** (berry flavour)\n- Herbal liquids: **Liver Booster** and **Energy Booster**\n- Applied on the skin: **CycleRelief Roll-On** and **Reviva Massage Roll-On**\n- Breathed in: **BreatheFree Aromatherapy Inhaler**\n\nTell me what you'd like support with, and I'll suggest the right one.` }) },
  { id:'external', match:/\b(apply|applied|external\w*|on\s*(the\s*)?skin|rub|massage|instead\s*of\s*(eating|taking|swallowing|drinking)|not\s*(to\s*)?(eat|swallow|drink))\b/i,
    answer:() => ({ products:['cyclerelief', 'reviva', 'breathefree'], text:`These are used on the outside, nothing to swallow:\n${list(['cyclerelief', 'reviva', 'breathefree'])}\n\nCycleRelief is for women during their periods, and Reviva is for people with diabetes, used alongside their regular care. For the roll-ons, do a patch test first.` }) },
  { id:'travel', match:/\b(travel\w*|trip|journey|carry|pocket|portable|handbag|on\s*the\s*go)\b/i,
    answer:() => ({ products:['breathefree', 'cyclerelief'], text:`These are easy to carry:\n${list(['breathefree', 'cyclerelief'])}\n\nThe BreatheFree inhaler is pocket-sized, and CycleRelief is a small 8 ml roll-on that fits in any bag.` }) },
  { id:'men', match:/\b(for|good\s*for|suitable\s*for|meant\s*for)\s*(men|male|males|gents|guys|boys|husbands?)\b|\b(men|gents)'?s?\s*products?\b/i,
    answer:() => ({ products:ALL.filter(id => !P(id).women), text:`All our products except CycleRelief (made for women's periods) are made for both men and women aged 14 and above:\n${list(ALL.filter(id => !P(id).women))}\n\nTell me what you'd like support with, and I'll point you to the right one.` }) },
  { id:'women', match:/\b(for|good\s*for|suitable\s*for|meant\s*for)\s*(women|woman|female|females|ladies|girls|wife|wives)\b|\b(women|ladies)'?s?\s*products?\b/i,
    answer:() => ({ products:['cyclerelief'], text:`All our products are made for women, and one is just for women:\n${list(['cyclerelief'])}\n\nThe others suit both men and women aged 14 and above:\n${list(ALL.filter(id => !P(id).women))}` }) },
  { id:'gift', match:/\b(gift|gifting|present|surprise)\b/i,
    answer:({ last }) => {
      const older = /\b(parents?|mother|mom|amma|father|dad|appa|grand\w*|paati|patti|thatha|elders?|old)\b/i.test(last);
      const her = /\b(wife|girlfriend|sister|mother|mom|amma|her|she|daughter|aunt\w*)\b/i.test(last);
      const ids = older ? ['energy-booster', 'reviva'] : her ? ['cyclerelief', 'breathefree', 'energy-booster'] : ['energy-booster', 'breathefree', 'pulmoclear'];
      return { products:ids, text:`That's a thoughtful idea. 🌿 A few that make good wellness gifts:\n${list(ids)}\n\n${older ? 'Reviva is for people with diabetes. ' : ''}If they take regular medicine or have a health condition, it's best they check with their doctor before starting something new.` };
    } },
  { id:'cheapest', match:/\b(cheap\w*|lowest\s*price|low\s*price|budget|affordable|less\s*price|least\s*expensive|most\s*expensive|costl\w*|price\s*list|all\s*prices|(under|below|less\s*than|within)\s*(rs\.?|₹|inr)?\s*\d{2,5})\b/i,
    answer:({ last }) => { const sorted = CATALOG.filter(p => p.price).sort((a, b) => a.price - b.price);
      // the corporate site lists no prices (src/data/catalog.js): point to the team instead of a price list
      if (!sorted.length) return { actions:['whatsapp'], text:`We don't list prices on this website. For prices and to order, message our team on WhatsApp at **${WA}** or use the Contact page, and they'll help you right away.` };
      // "what can I buy under 300 rupees": only what fits the budget
      const limit = Number((last.match(/(?:under|below|less\s*than|within)\s*(?:rs\.?|₹|inr)?\s*(\d{2,5})/i) || [])[1]) || null;
      const fits = limit ? sorted.filter(p => p.price <= limit) : sorted;
      if (limit) return fits.length
        ? { products:fits.map(p => p.id), actions:['whatsapp'], text:`Within ₹${limit}, you can get:\n${fits.map(line).join('\n')}\n\nTo order, check the TranzLife e-commerce site or message us on WhatsApp at **${WA}**.` }
        : { actions:['whatsapp'], text:`None of our products are under ₹${limit} right now. Our lowest price is the **${sorted[0].name}** at ₹${sorted[0].price}.` };
      return { products:[sorted[0].id], text:`Here are our prices, from lowest:\n${sorted.map(line).join('\n')}\n- **${P('breathefree').name}**: price coming soon.\n\nTo order, check the TranzLife e-commerce site or message us on WhatsApp at **${WA}**.`, actions:['whatsapp'] }; } },
  { id:'bestseller', match:/\b(best\s*-?\s*sellers?|best\s*selling|most\s*(popular|sold|bought|famous)|popular|top\s*product|which\s*(one|product)\s*(should|do)\s*i\s*(buy|get|start)|buy\s*first|which\s*is\s*(the\s*)?best\s*product|your\s*best\s*product)\b/i,
    answer:() => ({ chips:NEEDS, text:`I don't have sales figures to share, and the right product really depends on what you'd like support with:\n${list(ALL)}\n\nTell me what's bothering you, and I'll suggest the best fit.` }) },

  // ---------- product facts we answer honestly ----------
  { id:'diet', match:/\b(veg|vegetarian|vegan|non\s*-?\s*veg|gelatine?|pork|beef|halal|jain|egg|animal|gluten|lactose|dairy|allerg\w*|nuts?)\b/i,
    answer:({ named }) => ({ products:named, text:`I don't have the full vegetarian and allergen details for ${named.length ? `the **${named.map(id => P(id).name).join('** and the **')}**` : 'each product'} yet. The complete ingredient list is printed on every pack. ${ASK_WA}` }) },
  { id:'sugar', health:true, match:/\b(sugar\s*-?\s*free|sugarless|no\s*sugar|contains?\s*sugar|sugar\s*content|how\s*much\s*sugar|diabetics?\s*(eat|take|have)|(eat|take|have)\s*(the\s*)?gumm\w*\s*.{0,20}(diabet|sugar))/i,
    answer:() => ({ products:['pulmoclear'], text:`The **PulmoClear Lung Booster Gummies** are berry-flavoured gummies, and I don't have their exact sugar content. Please check the label, and if you have diabetes, check with your doctor before taking any gummy.\n\nFor people with diabetes we have the **Reviva Massage Roll-On**, which is applied on the skin, not eaten, and is used alongside regular diabetes care.` }) },
  { id:'natural', match:/\b(natural|ayurved\w*|herbal|organic|chemical\w*|synthetic|plant\s*-?\s*based|siddha|homeopath\w*|steroid\w*)\b/i,
    answer:() => ({ text:`Our products are built on natural ingredients:\n- **PulmoClear Gummies**: Ayurvedic botanicals (tulsi, vasaka, dry ginger, long pepper and more) with added vitamin C, D3 and zinc\n- **Liver Booster**: a polyherbal liquid with 13 botanicals, such as milk thistle, amla and kalmegh\n- **Energy Booster**: botanical and mineral-origin ingredients\n- **CycleRelief** and **Reviva**: dill and eucalyptus essential oils\n- **BreatheFree**: a natural essential oil blend\n\nThey are wellness products, not medicines, and the full ingredient list is on each pack.` }) },
  { id:'results', match:/\b(how\s*(long|soon|many\s*days)\s*(will\s*it\s*take|to\s*(see|get|work|show)|before)|when\s*will\s*(i|it)\s*(see|work|feel|show)|results?\s*(time|in\s*how)|how\s*fast|immediate\s*(result|effect)|work\s*(fast|immediately|instantly))/i,
    answer:() => ({ text:'Our products are wellness products, not medicines, so there\'s no fixed time; everyone is different. They are made to be part of a regular daily routine, used as the label directs, along with healthy habits like good sleep, food and movement. If a health problem is not getting better, please see a doctor.' }) },
  { id:'longterm', match:/\b(long\s*-?\s*term|every\s*day\s*for\s*(years|months|life)|daily\s*for\s*(years|months)|lifelong|for\s*life|habit\s*forming|addict\w*|dependent|dependence)\b/i,
    answer:() => ({ text:'They are made for daily wellness routines, used as the label directs, and the BreatheFree inhaler is nicotine-free. Long-term use has not been studied for every product, so for regular use over months, especially if you have a health condition or take regular medicine, please check with your doctor.' }) },
  { id:'sideeffects', match:/\b(side\s*-?\s*effects?|safe\s*to\s*use|is\s*it\s*safe|harmful|reactions?|any\s*problems?\s*if)\b/i,
    answer:() => ({ text:'No product can be promised to suit everyone. Please read the label and ingredients first, do a patch test before using a roll-on, and stop if you notice any irritation or reaction. If you are pregnant or breastfeeding, buying for a child, or have a health condition or take regular medicine, please check with your doctor before starting anything new.' }) },
  { id:'expiry', match:/\b(expiry|expire\w*|expiration|shelf\s*life|best\s*before|manufactur\w*\s*date|mfg|batch)\b/i,
    answer:() => ({ text:`The expiry date and batch details are printed on each pack. Once opened, the Liver Booster should be kept in the refrigerator. ${ASK_WA.replace('For that, please', 'For a specific batch, please')}` }) },
  { id:'lasts', match:/\b(how\s*(long|many\s*days|many\s*weeks)\s*(will|does|would|can)\s*(one|a|the|1)?\s*(bottle|pack|box|unit|piece)|(bottle|pack|box)\s*(lasts?|is\s*enough)|how\s*many\s*days\s*(supply|course))/i,
    answer:() => ({ text:'At the label serving:\n- **Liver Booster** (200 ml, 10 ml twice daily): about 10 days\n- **Energy Booster** (500 ml, 7.5 ml twice daily): about a month (around 33 days)\n- **PulmoClear Gummies** (60 gummies): depends on the serving on the pack label\n- **CycleRelief** (8 ml) and **Reviva** (50 ml) roll-ons: depends on how often you use them' }) },

  // ---------- lifestyle goals ----------
  { id:'gym', match:/\b(gym|work\s*-?\s*out|exercise|fitness|sports?|athlete|running|cycling|body\s*building|muscle\s*gain|stamina\s*for)\b/i,
    answer:() => ({ products:['energy-booster'], text:`For an active routine, our **Energy Booster** (₹1850) may help: ${P('energy-booster').highlight}. How to use: 7.5 ml twice daily.\n\nWe don't sell protein powder or sports supplements. Good food, enough water and sleep matter most for training.` }) },
  { id:'exams', match:/\b(exams?|students?|study\w*|board\s*exam|college|school\s*exam|revision)\b/i,
    answer:({ person }) => person.group === 'child' || person.group === 'baby'
      ? { text:'Our products are made for ages 14 and above, so for a younger child, please ask their doctor before giving anything new. Good sleep, regular meals and short breaks while studying help most.' }
      : { products:['breathefree', 'energy-booster'], text:`For exam time (ages 14 and above), these may help:\n${list(['breathefree', 'energy-booster'])}\n\nAlong with that: keep regular sleep, take short breaks every hour, drink enough water and don't skip meals.` } },
  { id:'fresh', match:/\b(fresh|active|energetic)\s*(in\s*the\s*)?(morning|day|all\s*day)|\bstart\s*(my|the)\s*day\b|\bmorning\s*(energy|freshness)\b/i,
    answer:() => ({ products:['energy-booster'], text:`To start the day feeling fresh, our **Energy Booster** (₹1850) may help: ${P('energy-booster').highlight}. How to use: 7.5 ml twice daily.\n\nAlong with that: a regular sleep time, a glass of water and some daylight or a short walk in the morning help a lot.` }) },
  { id:'hangover', health:true, match:/\b(hang\s*-?\s*over|after\s*(a\s*)?party|drank\s*too\s*much|morning\s*after\s*drinking)\b/i,
    answer:() => ({ text:'We don\'t have a product for hangovers, and nothing can undo the effects of drinking too much. 🌿 Drink plenty of water, eat something light, and rest. Drinking less, with water between drinks, is what helps most.\n\nOur **Liver Booster** is made for everyday liver and digestive wellness, not as a hangover remedy. If you have vomiting that won\'t stop, confusion or chest pain, please get medical help straight away (112).' }) },
  { id:'beauty', match:/\b(glow\w*|fair\w*\s*skin|skin\s*(whiten|brighten|tone)|look\s*(young|younger|beautiful)|anti\s*-?\s*age\w*|ageing|aging|wrinkles?|beauty|complexion)\b/i,
    answer:() => ({ chips:NEEDS, text:'We don\'t have a skin or beauty product yet, but more products are on the way and will launch soon. 🌿 Until then, a few simple habits help skin look its best: sleep well, drink enough water, protect your skin from strong sun, eat plenty of fruit and vegetables, and don\'t smoke.' }) },
  { id:'weightloss', match:/\b(weight\s*loss|lose\s*weight|losing\s*weight|reduce\s*weight|slim\w*|fat\s*loss|belly\s*fat|over\s*weight|obes\w*|weight\s*gain|gain\s*weight)\b/i,
    answer:() => ({ chips:NEEDS, text:'We don\'t have a weight-management product yet, but more products are on the way and will launch soon. 🌿 Until then, these help most:\n- Eat a balanced diet with more fruit and vegetables, and less fatty and sugary food.\n- Be active every day, building up slowly.\n- Cut down on alcohol and sugary drinks.\n- Aim for slow, steady change, and be patient with yourself.' }) },
  { id:'notsold', match:/\b(protein\s*(powder|shake)?|whey|multi\s*-?\s*vitamins?|vitamin\s*[a-e]\d*|calcium|iron\s*tablets?|omega|fish\s*oil|collagen|biotin|hair\s*oil|shampoo|soap|face\s*wash|cream|lotion|sunscreen|toothpaste|tablets?|capsules?|syrup\s*for\s*cough)\b/i,
    answer:({ last }) => { const w = (last.match(/protein\s*(powder|shake)?|whey|multi\s*-?\s*vitamins?|vitamin\s*[a-e]\d*|calcium|iron\s*tablets?|omega|fish\s*oil|collagen|biotin|hair\s*oil|shampoo|soap|face\s*wash|cream|lotion|sunscreen|toothpaste|tablets?|capsules?|syrup\s*for\s*cough/i) || ['that'])[0];
      return { chips:NEEDS, text:`We don't sell ${w.toLowerCase().replace(/^vitamin\s*([a-e])/, (m, l) => `vitamin ${l.toUpperCase()}`)} right now. ${/vitamin/i.test(w) ? 'Our PulmoClear Gummies include vitamin C, D3 and zinc, but they are made for respiratory wellness, not as a vitamin supplement. ' : ''}Here's our current range:\n${list(ALL)}` }; } },

  // ---------- shop, delivery and business ----------
  { id:'payment', match:/\b(cod|cash\s*on\s*delivery|payment|pay\s*(by|with|through|using)|upi|gpay|google\s*pay|phonepe|paytm|card|emi)\b/i,
    answer:() => ({ actions:['whatsapp'], text:`For payment options, including cash on delivery, please check the TranzLife e-commerce site, or message us on WhatsApp at **${WA}** and the team will confirm.` }) },
  { id:'delivery', match:/\b(deliver\w*|shipping|ship\s*to|courier|send\s*(it\s*|them\s*)?to|available\s*in|do\s*you\s*(come|ship)|pan\s*india|outside\s*india|abroad)\b/i,
    answer:() => ({ actions:['whatsapp'], text:`You can order from the TranzLife e-commerce site. For delivery to your city and how long it takes, please message us on WhatsApp at **${WA}** and the team will confirm.` }) },
  { id:'returns', match:/\b(return|refund|replace\w*|exchange|damaged|broken|leak\w*|wrong\s*product|cancel\w*)\b/i,
    answer:() => ({ actions:['whatsapp', 'contact'], text:`For returns, refunds or a damaged or wrong product, please message us on WhatsApp at **${WA}** with your order details, or email **info@tranzlife.in**. The team will help you.` }) },
  { id:'offers', match:/\b(discount|offers?|coupon|promo\w*|combo|deal|sale|bulk\s*order|buy\s*\d|free\s*shipping)\b/i,
    answer:() => ({ actions:['whatsapp'], text:`For current offers, combos or bulk orders, please check the TranzLife e-commerce site, or message us on WhatsApp at **${WA}** and the team will share what's available.` }) },
  { id:'business', match:/\b(dealer\w*|distribut\w*|franchise|reseller|resell|wholesale|stockist|order\s*\d{2,}|\d{2,}\s*(bottles|boxes|packs|units|pieces)|stock\s*(your|ur|tranz\s*life)|sell\s*your\s*products|partner\w*|business\s*(opportunity|enquiry|with\s*you)|collaborat\w*|job|career|hiring|vacanc\w*|intern\w*)\b/i,
    answer:() => ({ actions:['whatsapp', 'contact'], text:`Thank you for your interest in working with TranzLife! 🌿 For dealership, distribution, partnership or career enquiries, please email **info@tranzlife.in** or message us on WhatsApp at **${WA}**, and the team will get in touch.` }) },
  { id:'shop', match:/\b(shop|store|outlet|showroom|retail|medical\s*shop|pharmacy|buy\s*offline|near\s*me|in\s*(my\s*)?(city|area|town))\b/i,
    answer:() => ({ actions:['whatsapp'], text:`You can buy our products from the TranzLife e-commerce site, or order on WhatsApp at **${WA}**. Our office is at 6, Flat 2D, 2nd Floor, Queenscourt, Montieth Road, Egmore, Chennai 600 008. For a store near you, please ask the team on WhatsApp.` }) },

  { id:'company', match:/\b(owner|founder|founded|ceo|md|director|who\s*(runs|started|owns|made)|established|started\s*in|head\s*office|registered\s*office|where\s*is\s*(your|the|tranz\s*life)\s*(company|office)|company\s*(details|address|location))\b/i,
    answer:() => ({ actions:['contact'], text:'TranzLife Biosciences (Tranz Life Bio Sciences Pvt. Ltd.) is a Chennai-based life sciences company that brings nature and bioscience together to support everyday wellness. 🌿 Our office is at 6, Flat 2D, 2nd Floor, Queenscourt, Montieth Road, Egmore, Chennai 600 008. I don\'t have details about the founders and team to share here; for that, please email **info@tranzlife.in**.' }) },

  // ---------- off-topic ----------
  { id:'joke', match:/\b(joke|funny|make\s*me\s*laugh|bored|sing|poem|story)\b/i,
    answer:() => ({ chips:NEEDS, text:'Here\'s a small one: why did the tulsi plant feel calm? Because it was always well-rooted. 🌿 I\'m better at wellness than jokes, though. Is anything bothering you today, or would you like to know about our products?' }) },
  { id:'offtopic', match:/\b(weather|rain\s*today|temperature\s*today|news|cricket|ipl|football|match\s*score|score\s*(in|of)\s*(the\s*)?\w*\s*match|movie|film|politic\w*|election|stock\s*market|share\s*price|bitcoin|crypto|recipe|cook\w*|homework|code|coding|translate|capital\s*of|president|prime\s*minister)\b|^\s*(what\s*is\s*)?\d+\s*[-+*x\/]\s*\d+\s*[?=]?\s*$/i,
    answer:() => ({ chips:NEEDS, text:'I\'m Tulsi, TranzLife\'s wellness assistant, so I can\'t help with that one. 🌿 I can help with everyday wellness, our products, prices and how to order. Is anything bothering you today?' }) },
  { id:'doctor', match:/\b(suggest|recommend|refer|know|find|good|best|nearby|name)\s*(a\s*|any\s*|me\s*a\s*|the\s*)?(good\s*|best\s*)?(\w+\s+)?(doctor|doctors|hospital|clinic|specialist|physician|dermatologist|gynaecologist|gynecologist|dentist)\b/i,
    answer:() => ({ text:'I can\'t recommend a specific doctor or hospital. 🌿 Your family doctor, a nearby government hospital or a registered clinic is a good place to start, and they can refer you to a specialist if needed. In an emergency, please call 112 straight away.' }) }
];

// The answer for this message, or null. named: product ids named in the message.
// health: the message may also name a health topic ("can diabetics eat the gummies", "is it like a vape", "hangover");
// every other entry is skipped when the message describes a health problem, which gets the topic flow instead.
function faqFor(last, named, person, healthTopic = false){
  for (const f of FAQ){
    if (healthTopic && !f.health) continue;
    if (f.needs === 'one' && named.length < 1) continue;
    if (f.needs === 'two' && named.length < 2) continue;
    // a named product: only questions about that product, or general facts about all products
    if (named.length && !f.needs && !['diet', 'sugar', 'natural', 'longterm', 'results', 'expiry', 'lasts', 'delivery', 'payment', 'returns', 'offers'].includes(f.id)) continue;
    if (!f.match.test(last)) continue;
    const r = f.answer({ last, named, person });
    if (r) return { id:f.id, products:[], chips:[], actions:[], ...r };
  }
  return null;
}

// Example phrasings for the meaning-based matcher (server/understand.js embeds them, like the health topic examples).
// A message close in meaning to these gets that answer even when no keyword above matches ("enaku inippa supplement").
const FAQ_EXAMPLES = {
  sweet:['suggest a sweet supplement', 'something tasty to take', 'enaku inippa ethavathu supplement venum', 'any yummy gummies', 'i want something that tastes good', 'candy like supplement', 'which product is not bitter', 'something nice to eat for health', 'gummies that taste good', 'inippa irukura product', 'i like sweets, anything for me', 'flavoured supplement'],
  notablets:['i cant swallow tablets', 'i hate syrups is there anything else', 'i dont like medicine taste', 'tablet sapda mudiyathu', 'no pills please', 'syrup pidikathu', 'any option other than liquid', 'difficult to take medicines', 'what forms do your products come in'],
  external:['which products dont need to be swallowed', 'something i can apply on skin', 'products for external use', 'not to eat, only apply', 'thadavura product iruka', 'roll on type products', 'something to rub instead of drinking', 'i want something i dont have to eat'],
  travel:['which product can i carry while travelling', 'best thing to keep in my bag', 'portable product', 'pocket size product', 'something for my trip', 'bag la vechukura maari ethavathu', 'easy to carry wellness product'],
  gift:['what can i gift my parents', 'diwali gift for my in laws', 'gift for my wife', 'birthday present for my father', 'wellness gift ideas', 'gift kudukka nalla product', 'pongal gift for family', 'something to gift my boss'],
  cheapest:['which is your cheapest product', 'what can i buy under 300 rupees', 'low budget product', 'products below 500', 'price list please', 'kammi vilai product', 'most affordable one', 'how much do all products cost'],
  bestseller:['which product is best seller', 'which one should i buy first', 'your most popular product', 'what do most people buy', 'which is your best product', 'ethu nalla product', 'top selling item'],
  diet:['is your product vegetarian', 'does pulmoclear have gelatin', 'is it vegan', 'any animal ingredients', 'is it halal', 'i am allergic to nuts', 'veg ah non veg ah', 'is it gluten free'],
  sugar:['is pulmoclear sugar free', 'can diabetics eat the gummies', 'how much sugar in gummies', 'sugar irukka gummies la', 'safe for sugar patients to eat'],
  natural:['is it ayurvedic', 'is it natural or chemical', 'are these herbal products', 'any chemicals in it', 'is it organic', 'natural products ah', 'is it homeopathy'],
  results:['how long to see results', 'when will it start working', 'how many days to get result', 'evlo naal la result varum', 'will it work immediately', 'how fast does it act'],
  longterm:['is it safe for long term use', 'will energy booster make me addicted', 'can i use it daily for years', 'is it habit forming', 'thinamum use pannalama long time'],
  sideeffects:['will i get side effects', 'is it safe to use', 'any side effects', 'side effect irukka', 'is it harmful'],
  expiry:['what is the expiry', 'shelf life of products', 'how long can i keep it', 'expiry date enna', 'manufacturing date'],
  lasts:['how many days will one bottle last', 'one pack enough for how many days', 'how long does a bottle last', 'oru bottle evlo naal varum', 'how many days supply in one pack'],
  gym:['best product for gym and workout', 'supplement for exercise', 'something for sports stamina', 'gym poguravangalukku ethavathu', 'pre workout energy', 'fitness supplement'],
  exams:['product for students during exams', 'something for studying', 'exam time stress product', 'college students ku ethavathu', 'board exam preparation help'],
  fresh:['something to stay fresh in the morning', 'i want to feel energetic all day', 'start my day fresh', 'kaalaila fresh ah irukka'],
  hangover:['is there anything for hangover', 'after party headache from drinking', 'drank too much last night', 'hangover ku ethavathu'],
  beauty:['something for glowing skin', 'i want to look young', 'anti ageing product', 'face glow ku ethavathu', 'beauty supplement', 'skin brightening'],
  weightloss:['product for weight loss', 'i want to lose weight', 'belly fat reduce panna', 'slimming product', 'weight kuraikka ethavathu', 'weight gain product'],
  notsold:['do you have protein powder', 'do you sell vitamin d', 'do you have hair oil', 'any face cream', 'do you sell multivitamin tablets', 'shampoo iruka'],
  delivery:['do you deliver to bangalore', 'delivery charges evlo', 'how many days for delivery', 'do you ship outside tamil nadu', 'can you send to my village', 'courier available'],
  payment:['cash on delivery available', 'how do i pay, gpay available', 'can i pay by card', 'upi payment possible', 'cod iruka'],
  returns:['can i return the product', 'i got a damaged bottle', 'refund policy', 'wrong product delivered', 'product return pannalama'],
  offers:['any discount', 'do you have any combo offer', 'any coupon code', 'offer iruka', 'buy two get one'],
  shop:['do you have a shop in chennai', 'where can i buy offline', 'is it available in medical shops', 'store near me', 'kadai enga iruku'],
  business:['can i become a dealer or distributor', 'i want to order 10 bottles for my shop', 'do you have any job openings', 'franchise details', 'wholesale price for my store', 'business tie up'],
  company:['who is the owner of tranzlife', 'who founded tranzlife', 'where is your company located', 'when was tranzlife started', 'who runs this company', 'company details'],
  joke:['tell me a joke', 'make me laugh', 'i am bored', 'say something funny'],
  offtopic:['what is the weather today', 'what is 2+2', 'who won the cricket match', 'tell me the news', 'write a poem', 'help with my homework', 'what is the capital of india'],
  doctor:['suggest a good doctor in chennai', 'can you recommend a hospital for my mother', 'best hospital near me', 'which doctor should i consult', 'nalla doctor sollunga']
};

// The answer for an id the meaning-based matcher picked (only entries that need no named product).
function faqById(id, ctx){
  const f = FAQ.find(x => x.id === id);
  if (!f || f.needs) return null;
  const r = f.answer(ctx);
  return r ? { id:f.id, products:[], chips:[], actions:[], ...r } : null;
}

export { FAQ, FAQ_EXAMPLES, faqFor, faqById };
