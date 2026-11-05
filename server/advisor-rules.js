// Deterministic rules that run before the model. Code decides: what kind of message this is, which approved tips
// may be used, which product (if any) may be shown, which warning signs mean "doctor first", and any fixed sentences.
// The model only rewrites the result warmly. Keywords cover English plus common Tamil / Tanglish spellings.
import { CONCERNS } from './wellness-tips.js';
import { REMEDIES } from './reply-check.js';
import { CATALOG, COMING_SOON_MATCH, KINDS } from '../src/data/catalog.js';

// Products that are swallowed. These are held back whenever someone has diabetes, a long-term condition or regular
// medicine, because we do not know how they interact; roll-ons and inhalers are not.
const INGESTED = new Set(CATALOG.filter(p => p.ingested).map(p => p.id));
// Remedy words a reply may use when that product is mentioned: the ingredients on its own label.
const PRODUCT_WORDS = Object.fromEntries(CATALOG.map(p => [p.id, Object.keys(REMEDIES).filter(k => REMEDIES[k].test(`${p.about} ${p.use}`))]));

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
  { id:'eye', why:'an eye problem that needs checking', say:'A painful red eye, any change in your vision, light hurting your eyes, or an injury or something stuck in the eye should be checked by a doctor straight away.',
    re:/(vision|sight|eyesight).{0,25}(chang|blur|loss|lost|gone|flash|wavy|dark)|blurr?(ed|y)\s*vision|flash\w*\s*lights?|wavy\s*lines|can'?t\s*see|light\s*hurts|hurts?\s*to\s*look\s*at\s*(the\s*)?light|eyes?.{0,20}(injur|hit|pierc|scratch|chemical|stuck)|(something|dust|chemical)\s*(went\s*)?(in|into|stuck\s*in)\s*(my\s*)?eye|(red|swollen)\s*(and\s*)?painful\s*eye|painful\s*(and\s*)?red\s*eye|eyes?\s*(is|are)?\s*(very|dark|blood)\s*red/i },
  { id:'back', why:'back pain with warning signs', say:'Back pain with numbness or weakness in the legs, trouble peeing or controlling your bladder or bowels, fever, or pain after an accident or fall needs a doctor straight away.',
    re:/(back|spine).{0,60}(numb|tingl|weak).{0,25}(leg|legs|both)|(numb|tingl|weak)\w*.{0,25}(both\s*legs|legs).{0,40}back|(can'?t|cannot|difficult\w*|trouble)\s*(to\s*)?(pee|urinate|control\s*(my\s*)?(bladder|bowel))|back.{0,40}after\s*(an?\s*)?(accident|fall|crash)/i },
  { id:'joint', why:'a hot, swollen or injured joint', say:'A hot, swollen joint, joint pain with fever, or a joint you cannot put weight on after an injury should be checked by a doctor soon.',
    re:/(joint|knee|ankle|wrist|elbow|shoulder|hip)\w*.{0,30}(hot|red).{0,20}swol|swol\w*.{0,20}(and\s*)?(hot|red)\b|can'?t\s*(walk|put\s*weight|stand\s*on)|(joint|knee|ankle|wrist|elbow|shoulder|hip).{0,40}after\s*(a\s*)?(fall|injury|accident)|(joint|knee|ankle|wrist|elbow|shoulder|hip)\w*.{0,30}(out\s*of\s*place|dislocat)/i },
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
// ("quit smoking" or "stop drinking" is not about medicine)
const STOP_WORD = '(stop|quit|skip|replace|instead of|leave|come\\s*off|go\\s*off|get\\s*off|wean|taper|switch\\s*from|niruth|niruthi|vittu)(?!\\w*\\s*(smok|cigar|beedi|bidi|tobacco|drink|alcohol|vap))';
const MED_WORD = '(tablet|medicine|medication|pill|insulin|maathirai|mathirai|marundhu|marunthu|மாத்திரை|மருந்து)';
const STOP_MEDS = new RegExp(`${STOP_WORD}\\w*.{0,40}${MED_WORD}|${MED_WORD}\\w*.{0,40}${STOP_WORD}`, 'i');

// Products named by the visitor, and questions about them or the shop.
// a product name, or a product type ("roll-ons", "inhalers", "gummies") that lists every product of that type
const namedIn = text => {
  const ids = CATALOG.filter(p => p.match.test(text)).map(p => p.id);
  if (!ids.length) KINDS.filter(k => k.match.test(text)).forEach(k => ids.push(...k.ids));
  return [...new Set(ids)];
};
// a short follow-up that continues the previous topic ("what else?", "anything more?", "innum enna?")
const FOLLOW_UP_START = /^\s*(and\s*|ok(ay)?\s*|so\s*)?(what\s*else|anything\s*else|any\s*(more|other)|more\s*(tips|ideas|help)?|other\s*(tips|ideas|ways)|what\s*more|then\s*what|what\s*(now|next)|what\s*(should|can|do)\s*i\s*do|how|why|and\b|then\b|innum|vera\s*enna|apram|aprom|enna\s*pannalam|really)/i;
const isFollowUp = text => FOLLOW_UP_START.test(text) && text.trim().split(/\s+/).length <= 8;
// the visitor says it is severe, long-lasting, repeated or getting worse: only then do tips end with when to see a doctor
const SERIOUS = /sever|really\s*bad|very\s*bad|so\s*bad|worst|unbearable|getting\s*worse|worse\s*(and\s*worse|every|now)|won'?t\s*(go|stop|settle)|not\s*(going\s*away|getting\s*better|improving|stopping)|for\s*(weeks|months|a\s*long\s*time|ages|years)|\b\d+\s*(weeks?|months?|years?)\b|since\s*(last\s*)?(weeks?|months?|year)|every\s*(day|night|week)|daily|always|all\s*the\s*time|keeps?\s*(coming|happening|getting)|again\s*and\s*again|frequent|often|romba\s*naala|rombo\s*naala|neraya\s*naal|ரொம்ப\s*நாள/i;
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
const nameOf = id => CATALOG.find(p => p.id === id).name;

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

  const named = namedIn(last);
  const smallTalk = SMALL_TALK.test(last);
  const found = (last.match(CONDITION) || [])[0] || '';
  const condition = /^bp$/i.test(found) ? 'blood pressure' : /^uti$/i.test(found) ? 'urine infection' : /^(pcos|pcod)$/i.test(found) ? found.toUpperCase() : found.toLowerCase();
  const cureQ = CURE_Q.test(last), diagnoseQ = DIAGNOSE_Q.test(last), doseQ = DOSE_Q.test(last), stopMeds = STOP_MEDS.test(last);

  // the topic comes from the latest message. Only a short follow-up ("what else?") keeps the previous topic:
  // a new message about something else ("eye pain") must never get the old topic's tips.
  // (product names are removed first, so "Liver Booster" is a product question, not the liver-care topic)
  const topicText = CATALOG.reduce((t, p) => t.replace(new RegExp(p.match.source, 'gi'), ' '), last);
  let concerns = smallTalk ? [] : concernsIn(topicText).slice(0, 2), fresh = concerns.length > 0;
  if (!concerns.length && !named.length && isFollowUp(last)) for (let i = users.length - 2; i >= Math.max(0, users.length - 3) && !concerns.length; i--) concerns = concernsIn(users[i]).slice(0, 2);

  // what kind of message is this? (first match wins)
  let mode;
  if (flags.length) mode = 'flag';
  else if (IDENTITY.test(last)) mode = 'identity';
  else if (SAFETY_Q.test(last) && (named.length || /\b(your|these|this|tranzlife)\s*(products?|gumm|inhaler|roll|liquid)/i.test(last))) mode = 'safety';
  // (a cure question, or a condition with no product named: "Reviva for diabetes?" is a product question)
  else if ((condition || cureQ) && !fresh && (cureQ || !named.length)) mode = 'medical';
  else if (named.length && (PRODUCT_Q.test(last) || !fresh)) mode = 'product';
  else if (COMING_SOON_MATCH.test(last) && !fresh) mode = 'soon';
  else if (smallTalk) mode = 'smalltalk';
  else if (concerns.length) mode = 'tips';
  else if (SHOP.test(last)) mode = 'shop';
  else if (named.length) mode = 'product';
  else mode = 'none';
  if (mode !== 'tips') concerns = [];

  const careful = about.pregnant || about.breastfeeding || about.child;
  const serious = SERIOUS.test(recent);
  const tips = [], doctor = [];
  concerns.forEach(c => {
    const v = about.diabetes && c.diabetes ? c.diabetes : c;
    v.tips.filter(t => !(careful && t.kind === 'food') && !(about.diabetes && t.sugar) && !(about.child && t.adult)).forEach(t => tips.push(t));
    // small everyday problems are not sent to a doctor; only severe, lasting or worsening ones (or always-check topics)
    if (serious || v.alwaysDoctor || c.alwaysDoctor) doctor.push(v.doctor);
  });

  // products: only for a topic raised in this message or a product asked about by name; never with a warning sign,
  // a medicine, diagnosis or cure-of-a-condition question; never in pregnancy, breastfeeding or for children;
  // nothing swallowed with diabetes, a long-term condition or regular medicine
  const wanted = mode === 'tips' || mode === 'product' ? [...new Set([...(fresh ? concerns.flatMap(c => c.products) : []), ...named])].slice(0, 3) : [];
  let products = wanted;
  if (stopMeds || careful || diagnoseQ || (cureQ && condition)) products = [];
  if (about.diabetes || about.chronic || about.onMeds) products = products.filter(id => !INGESTED.has(id));
  const heldBack = wanted.filter(id => !products.includes(id));
  // product names the reply may say
  const mentionable = mode === 'flag' ? [] : mode === 'shop' ? CATALOG.map(p => p.id) : [...new Set([...products, ...named])];

  const allowed = new Set(tips.flatMap(t => t.uses || []));
  products.forEach(id => (PRODUCT_WORDS[id] || []).forEach(w => allowed.add(w)));

  // remedies or doses the visitor asked about that are not approved: a fixed sentence says we cannot advise on them
  // (only when they ask about using it: "I soak a pad every hour" is not a question about soaking)
  const asking = /\?|\b(should|can|could|may|shall|is\s*it\s*(ok|okay|good|fine|safe)|do\s*i|will|try|use|using|apply|take|drink|eat|put|give|rub)\b|pannalama|podalama|kudikalama|sapdalama|thadavalama|use\s*pannalama/i.test(last);
  const found_remedies = !asking ? [] : Object.entries(REMEDIES).filter(([k, re]) => !allowed.has(k) && !(k === 'soak' && flags.length) && re.test(last)).map(([, re]) => last.match(re)[0].toLowerCase());
  // drop words already inside another one ("oil" when "coconut oil" was found)
  const asked = [...new Set(found_remedies)].filter((w, i, all) => !all.some((o, j) => j !== i && o.length > w.length && o.includes(w)));
  const prefix = [];
  if (diagnoseQ) prefix.push('I can\'t tell what is causing this. Only a doctor can check that properly.');
  if (asked.length) prefix.push(`I can't advise on ${[...new Set(asked)].join(' or ')}${doseQ ? ' or how much to take' : ''}, so please check with a doctor or pharmacist before trying ${asked.length > 1 ? 'them' : 'it'}.`);
  else if (doseQ) prefix.push('I can\'t advise on doses, so please ask a doctor or pharmacist about that.');
  if (cureQ && mode === 'tips') prefix.push('I can\'t promise a cure, but a few simple things may help.');
  // fixed sentences after the reply, written by code so they can never be left out
  const suffix = [];
  if (mode === 'tips' && (about.pregnant || about.breastfeeding)) suffix.push('Since you\'re pregnant or breastfeeding, please check with your doctor before trying any new product or supplement.');
  else if (mode === 'tips' && about.child) suffix.push('For a child, please check with their doctor before giving anything new.');
  else if (mode === 'tips' && heldBack.length && (about.diabetes || about.chronic || about.onMeds)) suffix.push('Because of your health condition or regular medicine, please check with your doctor before starting any supplement.');
  // the product suggestion is written by code from the catalogue, never by the model
  if (mode === 'tips' && products.length){
    const ps = products.map(id => CATALOG.find(x => x.id === id));
    suffix.unshift(`You might also like our ${ps.map(p => `${p.name} (${p.pitch})`).join(', or our ')}.${ps.filter(p => p.note).map(p => ` ${p.note}`).join('')}`);
  }
  // a fixed line some topics always end with (for example the quit-smoking helpline)
  if (mode === 'tips') concerns.filter(c => c.footer).forEach(c => suffix.unshift(c.footer));

  // product facts (ingredients, price, size, how to use) come straight from the catalogue, never from the model
  const productInfo = mode === 'product';
  const named_allowed = mentionable.flatMap(id => PRODUCT_WORDS[id] || []);
  return { lang:language(last), mode, productInfo, smallTalk, named, condition, concerns:concerns.map(c => c.id), fresh, serious, tips:mode === 'tips' ? tips : [], doctor, products, heldBack, mentionable,
    flags, about, stopMeds, prefix, suffix, allowed:new Set([...(mode === 'tips' ? allowed : []), ...named_allowed]), shop:mode === 'shop' };
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
    if (a.doctor.length) L.push(`- Then say when to see a doctor, in one short sentence, based on: "${a.doctor.join(' ')}"`);
    else L.push('- This sounds like an everyday problem. Do NOT tell them to see a doctor or pharmacist; just help, kindly and confidently. You may end with one short, warm line such as "Hope this helps." Do not ask how they feel after trying the tips.');
    L.push('- Do not add any other remedy, food, drink, herb, spice, oil, medicine, supplement, dose or exercise that is not in the approved tips.');
  }

  if (a.products.length) L.push('- Do not mention any product: the website adds a short product suggestion and a product card after your reply.');
  else if (a.mode === 'shop') L.push('- Do not recommend a product for a health problem here; just answer the question.');
  else if (a.named.length && a.mode !== 'flag') L.push(`- Because of their health situation, do not recommend ${a.named.map(nameOf).join(' or ')} right now; kindly say to check with their doctor first.`);
  else L.push('- Do not mention or recommend any TranzLife product in this reply.');

  if (a.stopMeds) L.push('- They are asking about stopping or replacing prescribed medicine. Clearly and kindly say not to stop or change any medicine without talking to their doctor first.');
  if (a.suffix.length) L.push(`- The website will add this after your reply, so do not repeat it or say anything like it: "${a.suffix.join(' ')}"`);
  return L.join('\n');
}

export { analyse, routingNote, language };
