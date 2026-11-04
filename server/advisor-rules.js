// Deterministic rules that run before the model. Code decides: what kind of message this is, which approved tips
// may be used, which product (if any) may be shown, which warning signs mean "doctor first", and any fixed sentences.
// The model only rewrites the result warmly. Keywords cover English plus common Tamil / Tanglish spellings.
import { CONCERNS } from './wellness-tips.js';
import { REMEDIES } from './reply-check.js';
import { PRODUCTS } from '../src/data/products.js';

// Products that are swallowed. These are held back whenever someone has diabetes, a long-term condition or regular
// medicine, because we do not know how they interact; topical products (roll-ons) and the inhaler are not.
const INGESTED = new Set(['gummies', 'liver']);
// Words a reply may use when that product is recommended (its labelled ingredients).
const PRODUCT_WORDS = { rollon:['peppermint', 'rose', 'rosemary'] };

const FOOT = '(foot|feet|toes?|heels?|kaal|kaalu|sole|paadham)';
const WOUND = '(wound|sore|ulcer|infect|pus\\b|blister|swollen|swelling|numb|punn|seezh|cut|black\\s*(spot|patch|colou?r))';

// Warning signs: the doctor comes first. No home tips and no product in that reply.
const RED_FLAGS = [
  { id:'diabetic-foot', why:'a foot wound or problem with diabetes', say:'With diabetes, any wound, sore, blister, swelling or colour change on the foot should be checked by a doctor as soon as possible, not treated at home.',
    re:new RegExp(`\\b${FOOT}\\b.{0,40}\\b${WOUND}|\\b${WOUND}\\w*.{0,40}\\b${FOOT}\\b`, 'i'), with:'diabetes' },
  { id:'diabetic-wound', why:'a wound that is not healing, with diabetes', say:'With diabetes, a wound that is not healing should be checked by a doctor as soon as possible.',
    re:/(wound|cut|sore|punn)\w*.{0,40}(not\s*heal|hasn'?t\s*heal|won'?t\s*heal|isn'?t\s*heal|not\s*getting\s*better|aaravillai|aarala|aaralai)/i, with:'diabetes' },
  { id:'foot-wound', why:'a foot wound or infection', say:'A wound or infection on the foot should be checked by a doctor.',
    re:new RegExp(`\\b${FOOT}\\b.{0,40}\\b(wound|ulcer|infect|pus\\b|punn)|\\b(wound|ulcer|infect|pus\\b|punn)\\w*.{0,40}\\b${FOOT}\\b`, 'i') },
  { id:'jaundice', why:'possible jaundice', say:'Yellow eyes or skin can be a sign of a liver problem and needs a doctor\'s check soon.',
    re:/jaundice|yellow\w*.{0,12}\b(eyes?|skin)\b|\b(eyes?|skin)\b.{0,15}yellow|kann?u?\s*manjal|manjal\s*kaamalai|manjal\s*kamalai|மஞ்சள்\s*காமாலை/i },
  { id:'blood', why:'blood where it should not be', say:'Blood in vomit, stool, urine or phlegm should always be checked by a doctor soon.',
    re:/blood\s*in\s*(my\s*|the\s*|his\s*|her\s*)?(vomit|stool|urine|motion|poo|pee|phlegm|sputum|cough)|(vomit|cough|spit)\w*\s*(up\s*)?blood|black\s*(stool|motion|poo)|ratham\s*(varuthu|vandhuchu|varudhu)/i },
  { id:'heavy-bleeding', why:'very heavy period bleeding', say:'Very heavy bleeding needs a doctor\'s check.',
    re:/(heavy|lot of|too much|non[- ]?stop)\s*(period\s*)?bleed|soak\w*\s*(a\s*|through\s*)?(pad|tampon)|big\s*clots/i },
  { id:'pregnancy', why:'bleeding or pain in pregnancy', say:'Bleeding or pain during pregnancy should be checked by a doctor straight away.',
    re:/(bleed|spotting|pain|cramp|vali)/i, with:'pregnant' },
  { id:'fever', why:'a high or long fever', say:'A high or long-lasting fever needs a doctor\'s check.',
    re:/high\s*fever|fever\s*(for|since)\s*(\d|a\s*week|many|several|three|four|five)|\b10[2-5](\.\d)?\s*(°|deg|f\b)|\b(39|40|41)(\.\d)?\s*(°|deg|c\b)|kaaichal\s*(romba|adhigam)/i },
  { id:'child', why:'an unwell baby or young child', say:'A baby or young child who has a fever, keeps vomiting, has a rash, or seems very unwell should be seen by a doctor.',
    re:/fever|temperature|kaaichal|vomit|rash|not\s*(eating|feeding|drinking)|fits|seizure|breath/i, with:'child' },
  { id:'weight', why:'unexplained weight loss', say:'Losing weight without trying should be checked by a doctor.',
    re:/(losing|lost|lose)\s*(a\s*lot\s*of\s*)?weight\s*(without|for no)|unexplained\s*weight|weight\s*loss\s*without/i },
  { id:'severe-pain', why:'severe pain', say:'Pain that is severe or unbearable should be checked by a doctor soon.',
    re:/(severe|unbearable|terrible|excruciating|worst)\s*(\w+\s){0,2}(pain|ache|cramps?|vali)|pain.{0,12}(unbearable|severe)|thanga\s*mudiyala|thaanga\s*mudiyala/i },
  { id:'heart', why:'heart racing or skipping', say:'A racing, pounding or irregular heartbeat should be checked by a doctor.',
    re:/palpitation|heart\s*(is\s*)?(racing|pounding|skipping|beating\s*(fast|irregular))|irregular\s*heart/i },
  { id:'lump', why:'a lump', say:'Any new lump should be checked by a doctor.', re:/\blump\b|\bkatti\b/i },
  { id:'mood', why:'low mood', say:'Feeling low for a long time is worth talking to a doctor about, and Tele-MANAS (14416) is free to call any time.',
    re:/depress|hopeless|empty\s*inside|nothing\s*matters|can'?t\s*stop\s*crying/i },
  { id:'vomiting', why:'vomiting that will not settle', say:'Vomiting that will not settle, or not being able to keep water down, needs a doctor.',
    re:/(can'?t|cannot|unable to)\s*keep\s*(water|anything|food)\s*down|vomit\w*\s*(for\s*(a|one|two|\d)\s*day|all\s*day|again\s*and\s*again|non[- ]?stop)|dehydrat/i }
];

// Facts about the person, gathered from their recent messages.
const ABOUT = {
  diabetes:/diabet|\b(have|has|got)\s*sugar\b|sugar\s*(patient|problem|level|tablet|iruk|irruk|irukku|undu|disease)|\bsugar\b.{0,12}(iruku|irukku|irukkudhu|irukudhu)|neerizhivu|நீரிழிவு|சர்க்கரை\s*(நோய்|இருக்)/i,
  pregnant:/pregnan|expecting\s*(a\s*)?baby|karpam|karbam|garbam|garbini|கர்ப்ப/i,
  breastfeeding:/breast\s*-?feed|nursing\s*(my\s*|a\s*)?baby|feeding\s*my\s*baby|thaai\s*paal|தாய்ப்பால்/i,
  child:/\b(my|en|our|enga)\s*(baby|child|kid|toddler|infant|kuzhandhai|kozhandhai|kuzhanthai|paiyan|ponnu|son|daughter)\b|\b([1-9]|1[0-5])\s*(year|yr|month|vayasu)s?\s*old|kuzhandhai|kozhandhai|kuzhanthai|குழந்தை/i,
  onMeds:/(taking|on|using|eduthutu|edukuren|sapdren|saapidren|podren)\s+.{0,25}(medicine|medication|tablets?|pills?|insulin|maathirai|mathirai|marundhu|marunthu)|\b(bp|sugar|thyroid|heart|blood\s*thinner)\s*(tablets?|medicine|maathirai|pills?)|warfarin|insulin/i,
  chronic:/\b(bp|blood\s*pressure|hypertension|thyroid|heart\s*(disease|problem|patient|condition)|kidney|liver\s*disease|cirrhosis|hepatitis|asthma|epilep|cancer|chemo)/i
};

// Questions about stopping prescribed medicine: never encourage it.
const STOP_MEDS = /(stop|quit|skip|replace|instead of|leave|come\s*off|go\s*off|get\s*off|wean|taper|switch\s*from|niruth|niruthi|vittu)\w*.{0,40}(tablet|medicine|medication|pill|insulin|maathirai|mathirai|marundhu|marunthu|மாத்திரை|மருந்து)|(tablet|medicine|medication|pill|insulin|maathirai|mathirai|marundhu)\w*.{0,40}(stop|quit|skip|replace|niruth|vittu)/i;

// Products named by the visitor, and questions about them or the shop.
const NAMED = { gummies:/gumm(y|ies)/i, inhaler:/inhaler/i, rollon:/calm\s*(period\s*)?(relief\s*)?roll|period\s*(relief\s*)?roll/i, reviva:/reviva/i, liver:/liver\s*booster|booster\s*liquid/i };
const SHOP = /\b(what|which)\s+(\w+\s+){0,2}(products?|items?)|\b(products?|items?)\s*(list|range|enna|ennenna)|\b(price|cost|rate|evlo|evvalavu|how\s*much)\b|\b(delivery|deliver|shipping|order|buy|purchase|cod|cash\s*on|discount|offer|coupon|stock)\b/i;
const PRODUCT_Q = /what('?s|\s*is|\s*are)?\s*(in|inside)\b|ingredients?|contain|made\s*(of|with|from)|how\s*(to|do\s*i|should\s*i|can\s*i)\s*(use|apply|take)|price|cost|how\s*much|evlo|evvalavu|\bsize\b|details?|tell\s*me\s*about|what\s*(is|'s)\s*(the\s*)?(\w+\s*){0,4}(for|used\s*for)|enna\s*irukku/i;
const SAFETY_Q = /\b(safe|safety|side[- ]?effects?|harmful|allerg\w*|reaction|interact\w*)\b|(with|along\s*with|together\s*with)\s*my\s*(medicine|tablets?|insulin|maathirai)/i;
const IDENTITY = /\bare\s*(you|u)\s*(a|an)?\s*(real\s*)?(doctor|nurse|human|bot|robot|ai|machine|person|chatbot)\b|who\s*(are|r)\s*(you|u)\b|what\s*are\s*you\b|nee\s*yaaru|neenga\s*yaaru|yaaru\s*neenga/i;
const CURE_Q = /\b(cure|cures|curing|permanent(ly)?\s*(cure|relief|solution)|get\s*rid\s*of|treat(ment)?\s*for|heal)\b/i;
const CONDITION = /\b(an(a)?emia|thyroid|diabetes|bp|blood\s*pressure|cholesterol|pcos|pcod|kidney\s*stones?|arthritis|asthma|cancer|tumou?r|infection|ulcer|piles|h(a)?emorrhoids?|fibroids?|migraine|psoriasis|eczema|hepatitis|fatty\s*liver|gastritis|uti|covid|dengue|typhoid|tuberculosis|heart\s*disease|epilepsy|vertigo|sinus(itis)?|gout|kidney\s*disease)\b/i;
const DIAGNOSE_Q = /what\s*(disease|illness|condition|problem|sickness)\s*(do\s*|does\s*)?(i|she|he|they|my\s*\w+)\s*(have|has|got)|diagnos|what('?s|\s*is)\s*wrong\s*with\s*(me|her|him)|what\s*is\s*(causing|the\s*cause)|enna\s*(noi|vyadhi|vyaadhi)/i;
const DOSE_Q = /\b(dose|dosage|how\s*much\s*(should|to|can)\s*(i\s*|we\s*)?(take|eat|drink|give)|how\s*many\s*(times|tablets|spoons|capsules|drops))\b/i;

const SMALL_TALK = /^\s*(hi+|hello+|hey+|hai|vanakkam|good\s*(morning|afternoon|evening|night)|thanks?|thank\s*you|thx|tq|ok+|okay|k|sari|seri|nandri|super|nice|great|bye|cool|fine|got\s*it|purinjuthu|purinjudhu)\b[\s!.,🙏😊❤️💚👍]*(bro|da|ma|tulsi|so\s*much)?[\s!.,🙏😊❤️💚👍]*$/i;

// Common Tamil words typed in English letters. Two or more hits = Tanglish.
const TANGLISH = /\b(iruku|irukku|irukken|romba|rombo|enaku|enakku|ennaku|panna|pannu|pannanum|mudiyala|mudiyalai|aaguthu|aagudhu|agudhu|illa|ille|venum|vendum|epdi|eppadi|enna|yenna|konjam|nalla|naan|nee|neenga|unga|enga|amma|appa|ku|la|ah|da|di|bro|machi|vali|valikuthu|valikudhu|sapadu|saapadu|thookam|thoongave|kaal|kai|udambu|seri|sari|theriyala|pa|ma|nu|than|thaan|dhaan|kooda|ipo|ippo|apo|appo|varala|pogala|aachu|aagala)\b/gi;

function language(text){
  if (/[஀-௿]/.test(text)) return 'tamil';
  return (text.match(TANGLISH) || []).length >= 2 ? 'tanglish' : 'english';
}

const concernsIn = text => CONCERNS.filter(c => c.match.test(text));
const nameOf = id => PRODUCTS.find(p => p.id === id).name;

// history: [{ role, content }], ending with the visitor's latest message
function analyse(history){
  const users = history.filter(m => m.role === 'user').map(m => m.content);
  const last = users[users.length - 1] || '';
  const recent = users.slice(-4).join('\n');
  const about = Object.fromEntries(Object.entries(ABOUT).map(([k, re]) => [k, re.test(recent)]));

  // warning signs stay on for the next few messages, so a follow-up cannot get home tips for a red-flag problem
  let flags = RED_FLAGS.filter(f => f.re.test(recent) && (!f.with || about[f.with]));
  if (flags.some(f => f.id.startsWith('diabetic'))) flags = flags.filter(f => f.id !== 'foot-wound');
  if (flags.some(f => f.id === 'diabetic-foot')) flags = flags.filter(f => f.id !== 'diabetic-wound');

  const named = Object.keys(NAMED).filter(id => NAMED[id].test(last));
  const smallTalk = SMALL_TALK.test(last);
  const found = (last.match(CONDITION) || [])[0] || '';
  const condition = /^bp$/i.test(found) ? 'blood pressure' : /^uti$/i.test(found) ? 'urine infection' : /^(pcos|pcod)$/i.test(found) ? found.toUpperCase() : found.toLowerCase();
  const cureQ = CURE_Q.test(last), diagnoseQ = DIAGNOSE_Q.test(last), doseQ = DOSE_Q.test(last), stopMeds = STOP_MEDS.test(last);

  // the concern comes from the latest message; a follow-up like "what else?" keeps the previous concern's tips
  let concerns = smallTalk ? [] : concernsIn(last).slice(0, 2), fresh = concerns.length > 0;
  if (!concerns.length && !smallTalk && !named.length) for (let i = users.length - 2; i >= Math.max(0, users.length - 4) && !concerns.length; i--) concerns = concernsIn(users[i]).slice(0, 2);

  // what kind of message is this? (first match wins)
  let mode;
  if (flags.length) mode = 'flag';
  else if (IDENTITY.test(last)) mode = 'identity';
  else if (SAFETY_Q.test(last) && (named.length || /\b(your|these|this|tranzlife)\s*(products?|gumm|inhaler|roll|liquid)/i.test(last))) mode = 'safety';
  else if (named.length && PRODUCT_Q.test(last)) mode = 'product';
  else if (smallTalk) mode = 'smalltalk';
  else if ((condition || cureQ) && !fresh) mode = 'medical';
  else if (concerns.length) mode = 'tips';
  else if (SHOP.test(last)) mode = 'shop';
  else if (named.length) mode = 'product';
  else mode = 'none';
  if (mode !== 'tips') concerns = [];

  const careful = about.pregnant || about.breastfeeding || about.child;
  const tips = [], doctor = [];
  concerns.forEach(c => {
    const v = about.diabetes && c.diabetes ? c.diabetes : c;
    v.tips.filter(t => !(careful && t.kind === 'food') && !(about.diabetes && t.sugar) && !(about.child && t.adult)).forEach(t => tips.push(t));
    doctor.push(v.doctor);
  });

  // products: only for a concern raised in this message or a product asked about by name; never with a warning sign,
  // a medicine, diagnosis or cure-of-a-condition question; never in pregnancy, breastfeeding or for children;
  // nothing swallowed with diabetes, a long-term condition or regular medicine
  const wanted = mode === 'tips' || mode === 'product' ? [...new Set([...(fresh ? concerns.map(c => c.product).filter(Boolean) : []), ...named])] : [];
  let products = wanted;
  if (stopMeds || careful || diagnoseQ || (cureQ && condition)) products = [];
  if (about.diabetes || about.chronic || about.onMeds) products = products.filter(id => !INGESTED.has(id));
  const heldBack = wanted.filter(id => !products.includes(id));
  // product names the reply may say
  const mentionable = mode === 'flag' ? [] : mode === 'shop' ? PRODUCTS.map(p => p.id) : [...new Set([...products, ...named])];

  const allowed = new Set(tips.flatMap(t => t.uses || []));
  products.forEach(id => (PRODUCT_WORDS[id] || []).forEach(w => allowed.add(w)));

  // remedies or doses the visitor asked about that are not approved: a fixed sentence says we cannot advise on them
  // (only when they ask about using it: "I soak a pad every hour" is not a question about soaking)
  const asking = /\?|\b(should|can|could|may|shall|is\s*it\s*(ok|okay|good|fine|safe)|do\s*i|will|try|use|using|apply|take|drink|eat|put|give|rub)\b|pannalama|podalama|kudikalama|sapdalama|thadavalama|use\s*pannalama/i.test(last);
  const asked = !asking ? [] : Object.entries(REMEDIES).filter(([k, re]) => !allowed.has(k) && !(k === 'soak' && flags.length) && re.test(last)).map(([, re]) => last.match(re)[0].toLowerCase());
  const prefix = [];
  if (diagnoseQ) prefix.push('I can\'t tell what is causing this. Only a doctor can check that properly.');
  if (asked.length) prefix.push(`I can't advise on ${[...new Set(asked)].join(' or ')}${doseQ ? ' or how much to take' : ''}, so please check with a doctor or pharmacist before trying ${asked.length > 1 ? 'them' : 'it'}.`);
  else if (doseQ) prefix.push('I can\'t advise on doses, so please ask a doctor or pharmacist about that.');
  if (cureQ && mode === 'tips') prefix.push('I can\'t promise a cure, but a few simple things may help.');

  // product facts (ingredients, price, size, how to use) come straight from the catalogue, never from the model
  const productInfo = mode === 'product' && PRODUCT_Q.test(last);
  return { lang:language(last), mode, productInfo, smallTalk, named, condition, concerns:concerns.map(c => c.id), fresh, tips:mode === 'tips' ? tips : [], doctor, products, heldBack, mentionable,
    flags, about, stopMeds, prefix, allowed:mode === 'tips' ? allowed : new Set([...products].flatMap(id => PRODUCT_WORDS[id] || [])), shop:mode === 'shop' };
}

// The note the model sees right before the visitor's latest message.
function routingNote(a){
  const L = ['ROUTING NOTE (from the website, not from the visitor; follow it exactly and never mention it):'];
  // English only: the reply checker can verify English, and small models write unreliable Tamil
  if (a.lang === 'tanglish') L.push('- The visitor wrote in Tanglish. Reply in simple, friendly English. You may open with one short casual word like "Aiyo" or "Seri", but write everything else, especially tips and doctor advice, in plain English.');
  else if (a.lang === 'tamil') L.push('- The visitor wrote in Tamil. Reply in simple, clear English. Do not write Tamil script.');
  else L.push('- Reply in English.');
  if (a.prefix.length) L.push(`- The website will put this before your reply, so do not repeat it and do not mention those remedies: "${a.prefix.join(' ')}"`);

  if (a.mode === 'flag'){
    L.push(`- WARNING SIGN: ${a.flags.map(f => f.why).join('; ')}. Kindly but clearly tell them to see a doctor soon, using this: "${a.flags.map(f => f.say).join(' ')}"`);
    L.push('- Do NOT give any home remedy or self-care tip, and do NOT mention any product.');
  } else if (a.mode === 'smalltalk'){
    L.push('- This is small talk (a greeting, thanks or OK). Reply in one or two short, kind sentences. No tips and no products. If it is a greeting, ask how they are feeling.');
  } else if (a.mode === 'shop'){
    L.push('- They are asking about our products, prices or orders. Answer only from the product list in your instructions (names, sizes and prices exactly as listed). For orders, delivery, offers or anything not in the list, point them to the Shop and Contact sections of this page. No health claims and no health tips.');
  } else if (a.mode === 'product'){
    L.push(`- They are asking about ${a.named.map(nameOf).join(' and ')}. This is a product question, not a health problem: do not react as if they are unwell ("that sounds tough"), just answer it helpfully. Answer only from the product list in your instructions. Do not add ingredients, uses, doses or claims that are not in the list. If they ask how to use it, say to follow the directions on the pack. No health tips.`);
  } else if (a.mode === 'tips'){
    L.push(`- Topic: ${a.concerns.map(id => CONCERNS.find(c => c.id === id).label).join(' and ')}. APPROVED TIPS (use 2 or 3 of these and nothing else; reword warmly but keep the meaning exactly):`);
    a.tips.forEach(t => L.push(`    • ${t.text}`));
    L.push(`- Then say when to see a doctor, in one short sentence, based on: "${a.doctor.join(' ')}"`);
    L.push('- Do not add any other remedy, food, drink, herb, spice, oil, medicine, supplement, dose or exercise that is not in the approved tips.');
  }

  if (a.products.length) a.products.forEach(id => { const c = CONCERNS.find(x => x.product === id);
    L.push(`- You may recommend our ${nameOf(id)} in one warm sentence, as something that may help with ${c.label}. A product card appears under your message automatically. Do not mention any other product.`); });
  else if (a.mode === 'shop') L.push('- Do not recommend a product for a health problem here; just answer the question.');
  else if (a.named.length && a.mode !== 'flag') L.push(`- Because of their health situation, do not recommend ${a.named.map(nameOf).join(' or ')} right now; kindly say to check with their doctor first.`);
  else L.push('- Do not mention or recommend any TranzLife product in this reply.');

  if (a.stopMeds) L.push('- They are asking about stopping or replacing prescribed medicine. Clearly and kindly say not to stop or change any medicine without talking to their doctor first.');
  if (a.about.pregnant || a.about.breastfeeding) L.push('- Pregnancy or breastfeeding is involved. Suggest they check with their doctor before trying any product or supplement.');
  if (a.about.child) L.push('- A child is involved. Suggest checking with the child\'s doctor before giving anything.');
  if (a.mode !== 'flag' && a.heldBack.length && (a.about.diabetes || a.about.chronic || a.about.onMeds))
    L.push('- Because of their health condition or regular medicine, suggest they check with their doctor before starting any supplement.');
  return L.join('\n');
}

export { analyse, routingNote, language };
