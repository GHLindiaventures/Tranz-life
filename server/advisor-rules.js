// Deterministic rules that run before the model. Code decides: what kind of message this is, which approved tips
// may be used, which product (if any) may be shown, which warning signs mean "doctor first", and any fixed sentences.
// The model only rewrites the result warmly. Keywords cover English plus common Tamil / Tanglish spellings.
import { CONCERNS } from './wellness-tips.js';
import { faqById, faqFor } from './faq.js';
import { PRODUCT_NAMES, REMEDIES } from './reply-check.js';
import { CATALOG, COMING_SOON_MATCH, KINDS } from '../src/data/catalog.js';

// Products that are swallowed. These are held back whenever someone has diabetes, a long-term condition or regular
// medicine, because we do not know how they interact; roll-ons and inhalers are not.
const INGESTED = new Set(CATALOG.filter(p => p.ingested).map(p => p.id));
// Remedy words a reply may use when that product is mentioned: the ingredients on its own label.
const PRODUCT_WORDS = Object.fromEntries(CATALOG.map(p => [p.id, Object.keys(REMEDIES).filter(k => REMEDIES[k].test(`${p.about} ${p.use} ${p.mechanism || ''}`))]));

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
  { id:'bp-very-high', why:'a very high blood pressure reading', say:'A blood pressure reading of 180 or more (or a lower number of 120 or more) is very high, so please get it checked by a doctor today. If it comes with chest pain, a severe headache, shortness of breath, confusion, weakness on one side of the body or blurred vision, call 112 straight away.',
    re:/\b(bp|b\.p|blood\s*pressure|pressure)\b.{0,40}?\b(1[89]\d|2\d\d)\b|\b(1[89]\d|2\d\d)\s*\/\s*\d{2,3}\b|\b\d{2,3}\s*\/\s*(1[2-9]\d)\b|\b(1[89]\d|2\d\d)\b.{0,25}\b(bp|blood\s*pressure)\b/i },
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
  { id:'alcohol-dependence', why:'signs the body may depend on alcohol', say:'Shaking, sweating or feeling unwell without a drink, or needing a drink first thing in the morning, can mean the body depends on alcohol. Then stopping suddenly can be dangerous, so please see a doctor for help to cut down safely. India\'s free de-addiction helpline is 14446.',
    re:/(shak|tremor|trembl|sweat|kai\s*nadu)\w*.{0,40}(without|when\s*(i|he|she|they)\s*(stop|don'?t|doesn'?t|do\s*not|does\s*not)\w*|if\s*(i|he|she|they)\s*(stop|don'?t|doesn'?t|does\s*not))\s*.{0,10}(drink|alcohol)|(need|want)\w*\s*a\s*drink\s*(first\s*thing|in\s*the\s*morning|every\s*morning|to\s*(stop|calm)\s*(the\s*)?shak)|morning\s*drink|can'?t\s*(stop|control)\s*(drinking|his\s*drinking|her\s*drinking|my\s*drinking)|addicted\s*to\s*(alcohol|drink)|alcoholic/i },
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
  // asking about someone else ("my friend drinks a lot", "en appa ku...")
  other:/\b(my|our|ennoda|en|enga|engal)\s+([a-z]+\s+)?(friends?|frnds?|frnd|father|dad|daddy|mother|mom|mum|husband|hubby|wife|brother|bro|sister|sis|son|daughter|uncle|aunt|aunty|grand\w+|parents?|colleague|boss|roommate|partner|boyfriend|girlfriend|neighbou?r|appa|amma|anna|thambi|akka|thangachi|kanavar|purushan|manaivi|paati|thatha|paiyan|ponnu|mama|machan)\b|\b(he|she|his|him|her)\b/i,
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
// A message that describes something of its own ("I work in delhi and face respiratory issues, any product?") is not a
// follow-up, even with "any product" in it: after removing the asking words, 3 or more other words are left.
const ASKING_WORDS = new Set(('is are am was there any some anything something product products one thing things for to of me my mine i you your ' +
  'we us it this that these those do does did have has had sell sells get got buy use try take need want would could should can will ' +
  'what which who how best good better nice right suggest recommend recommendation please pls bro da sir madam also too else more other ' +
  'and or so then ok okay a an the in on with about give tell show him her them his their friend dad mom amma appa wife husband ' +
  'enna edhu ethu endha nalla product venum sollunga pannalam iruka irukka ah la ku').split(/\s+/));
const describesNew = text => text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !ASKING_WORDS.has(w)).length >= 3;
const isFollowUp = text => (FOLLOW_UP_START.test(text) && text.trim().split(/\s+/).length <= 8) || (RECOMMEND.test(text) && text.trim().split(/\s+/).length <= 14);

// Questions about how a product works, mechanisms, or benefits
const EXPLAIN_Q = /\bhow\s*(does|do|will|can|is)?\s*(it|this|these|that|the\s+products?|the\s+inhaler|the\s+gumm\w*|the\s+roll[- ]?on|the\s+tonic)\s*(work|help|reduce|ease|soothe|calm|support|act|function)\b|\bhow\s+(it|this|that|these)\s+(works?|helps?)\b|\bhow\s+(these|this|the|your)\s+products?\s+(work|help|helps)\b|\bhow\s+(does|do|this|these)\s+(\w+\s+){1,3}(reduce|ease|soothe|calm|work)\b|\b(epdi|eppadi)\s*(work|help|aagum|pannum)\b|\bwhat\s*(is|are)\s*(the\s*)?(health\s*)?(benefits?|uses?|advantages?)\b|\b(health\s*)?(benefits?|uses?)\s*of\b|\bis\s*(it|this|that)\s*(a\s*)?(really\s*)?(good|worth\w*|effective|useful|reliable|nice|best)\b|\b(does|will|would)\s*(it|this|that)\s*(really\s*)?(work|help)\b|\bworth\s*(it|buying|the\s*money)\b|\bgood\s*product\b|\bnalla\s*product\s*ah?\b/i;
// "is it good?" / "does it work?": an honest answer about a product, not a sales pitch
const GOOD_Q = /\bis\s*(it|this|that)\s*(a\s*)?(really\s*)?(good|worth\w*|effective|useful|reliable|nice|best)\b|\b(does|will|would)\s*(it|this|that)\s*(really\s*)?(work|help)\b|\bworth\s*(it|buying|the\s*money)\b|\bgood\s*product\b|\bnalla\s*product\s*ah?\b/i;
// "how to control diabetes", "tips to manage BP": asks for care, not only a product
const HOW_TO = /\b(how\s*(to|can\s*i|can\s*we|do\s*i|should\s*i)|ways?\s*to|tips?\s*(to|for)|what\s*(can|should)\s*i\s*do|control|manage|reduce|lower|bring\s*down|keep\s*(it\s*)?(under|in)\s*control|eppadi|epdi)\b/i;
// choosing between products: "which one should I use, X or Y?", "from these 2 which is best for me", "I need only one product"
const CHOOSE_Q = /\bwhich\s*(one|1|product|of\s*(these|them|the\s*(two|2)|both))\b|\bwhich\s*(is|one\s*is|would\s*be)\s*(better|best|good|right)\b|\b(better|best)\s*(one|option)?\s*(between|of)\b|\bwhich\s*(should|shall|do|must)\s*i\s*(use|choose|take|buy|pick|get|go\s*with)\b|\b(only|just)\s*(one|1|a\s*single)\s*(product)?\b|\bone\s*product\b|\bchoose\s*(one|between)\b|\bbetter\s*(one|option|choice|for\s*me)\b|\bbest\s*(one\s*)?for\s*(me|my\s*(situation|case|problem|condition|habit))\b|\b(from|between|of)\s*(these|the|this|both|those)\s*(2|two)?\b.{0,25}\b(which|best|better|choose)\b|\b(ethu|edhu)\s*(nalla|best|better|use\s*pannanum)\b/i;
// buying a product ("how can I buy this product", "where to order it"): how to order, never a suitability answer
const BUY_Q = /\b(how\s*(can|do|to|should)\s*(i\s*|we\s*)?(buy|order|purchase|get)|where\s*(can\s*i\s*|to\s*|do\s*i\s*)?(buy|get|order|purchase)|i\s*(want|would\s*like|wanna)\s*to\s*(buy|order|purchase)|(buy|order|purchase)\s*(it|this|that|now|online|one)|book\s*(it|one|an\s*order)|enga\s*(vanga|vaanga|kidaikum)|eppadi\s*(vanga|vaanga|order))\b/i;
// "say it shortly", "in short", "too long": a short version of what we were talking about
const SHORTER_Q = /\b((say|tell|explain|give|write)\s*(it|that|this|me)?\s*(in\s*)?(short|shortly|briefly|brief|simple|simply|one\s*line|few\s*words)|in\s*short|short\s*ah?|chinna\s*ah?|summar\w*|too\s*long|keep\s*it\s*short|tl;?\s*dr|make\s*it\s*short|shorter)\b/i;
// not a drinker ("I don't drink", "non alcoholic person"): the alcohol topic is cancelled
const NOT_DRINKING = /\b(non[-\s]*alc\w*|(don'?t|dont|do\s*not|never|doesn'?t|does\s*not|not\s*a)\s*(drink(er|s|ing)?|take\s*alcohol|use\s*alcohol)|teetotal\w*|kudikka\s*maatten|kudikkaradhu\s*illa)\b/i;
// no health problem, just "what suits me / for general health": the all-round product, then ask about specific needs
const GENERAL_Q = /\b(general|overall|everyday|daily|good)\s*(health|wellness|well-?being|fitness)\b|\bfor\s*(my|their|his|her|our|your)\s*(health|wellness|body)\b|\b(stay|be|keep|remain)\s*(healthy|fit|well)\b|\bsuits?\s*(for\s*)?(me|my|him|her|them|us)\b|\bsuitable\s*for\s*(me|my|him|her|them)\b|\b(good|best|right)\s*for\s*(me|my\s*body)\b|\bhealthy\s*person\b|\bnon[-\s]*alc\w*\s*(person|people)\b/i;
// "how many products do you have?"
const COUNT_Q = /\bhow\s*many\s*(products?|items)|\b(number|count|total)\s*(of\s*)?products?\b|\bevlo\s*products?\b/i;
// a price question ("what is the price", "how much", "evlo")
const PRICE_Q = /\b(price|cost|rate|mrp|how\s*much|evlo|evvalavu|evlo\s*rubaa?)\b/i;

// Questions about who can use a product or suitability ("can a normal person intake gummies", "inhaler use panlam ah venam ah", "who can use this product?", "can my friend use...")
const SUITABILITY_Q = /\bwho\s*can\s*(use|take|buy|try|have|consume|drink)\b|\b(can|should|could)\s+(i|we|he|she|they|my\s*\w+|en\s*\w+|appa|amma|friend)\s+(use|take|buy|try|drink|consume|have|sapda|eduka)\b|\b(can|should|could|is\s*it\s*(ok|okay|safe|good|fine|advisable)|who\s*can|does|do)\b.{0,35}\b(normal|healthy|non[- ]?smok\w*|anyone|anybody|every\w+|regular|person|peson|people|adults?)\b|\b(normal|healthy|non[- ]?smok\w*|regular)\s*(person|peson|people|adults?)?\b.{0,30}\b(take|intake|eat|use|have|consume|can|pannalama)\b|\b(use\s*pan+alama|pan+alam\s*ah|venama|venam\s*ah|eduk+alama|kudik+alama|sap+dalama|eduthuk+alama)\b|\b(should\s*i\s*(use|take|buy|try)|can\s*i\s*(use|take|buy|try))\b|\b(can|should|could)\s+(an?\s+)?(pregnant|breastfeeding|diabetic|elderly|old|kids?|child(ren)?|bab(y|ies)|teen\w*|women|woman|ladies|lady|mothers?|patients?)\s+(\w+\s+){0,2}(use|take|try|have|consume)\b|\b(can|could|should)\b.{0,45}\b(use|take|try|have|consume|apply)\s+(it|this|that|these|them)\b|\b(is\s*it|is\s*this)\s*(ok|okay|safe|fine|suitable)\s*for\s*(my|a|an|her|him)\b/i;

// Anaphora words that refer back to earlier products or topics
const ANAPHORA = /\b(it|this|these|that|those|the\s+products?|these\s+products?|this\s+product)\b/i;

function previousProducts(history){
  if (!Array.isArray(history)) return [];
  for (let i = history.length - 2; i >= 0; i--){
    const msg = history[i];
    if (!msg || !msg.content) continue;
    const ids = namedIn(msg.content);
    if (ids.length) return ids;
    const found = CATALOG.filter(p => new RegExp(`\\b${p.id}\\b|${p.short.replace(/[+]/g, '\\+')}|${p.name.replace(/[+]/g, '\\+')}`, 'i').test(msg.content)).map(p => p.id);
    if (found.length) return [...new Set(found)];
  }
  return [];
}
// asking which product to use ("which product should I use", "enna product use pannalam", "anything for this")
const RECOMMEND = /\b(which|what|any|best|good)\s+(\w+\s+){0,2}(products?|one|thing)\b|which\s*(one|product)|what\s*(should|can|do)\s*i\s*(use|take|buy|try|need)|\b(recommend|suggest)\w*|(anything|something)\s*(for|to\s*help\s*with)\s*(this|that|it|me)|(sell|have|got)\s+(anything|something)\s*(for|to\s*help)|\b(enna|endha|edhu|ethu)\s*(product|nalla)|product\s*(sollunga|suggest|venum)|use\s*pannalam|\bbest\s+product/i;
// explicit catalogue, price or delivery questions (the shop list is only for these)
const SHOP_EXPLICIT = /\b(what|which)\s+products?\s+(do\s+|does\s+)?(you|u|tranzlife)\s+(sell|have|having|make|offer)\b(?!.{0,15}\bfor\b)|\bwhat\s+are\s+(all\s+)?(the|your)\s+products(\s*(you\s+|u\s+)?(have|having|sell|make|offer))?\b(?!.{0,15}\bfor\b)|\ball\s+(your\s+)?products\b|\bproducts?\s*(list|range|catalog)\b|\b(price|cost|rate|evlo|evvalavu|how\s*much)\b|\b(delivery|deliver|shipping|order|buy|purchase|cod|cash\s*on|discount|offer|coupon|stock)\b|\b(do\s+you\s+know|tell\s+me)\s+(about\s+)?(all\s+)?(the\s+|your\s+|our\s+)?products?\b|\b(products?|product)\s*(pathi|paththi)\s*(theriyuma|theriyum\s*ah|sollu|sollunga)\b|\b(namma|unga|ungala)\s*(kitta|kita)?\s*(enna|iruka|irukka)?\s*products?\b/i;
// the visitor says it is severe, long-lasting, repeated or getting worse: only then do tips end with when to see a doctor
const SERIOUS = /sever|really\s*bad|very\s*bad|so\s*bad|worst|unbearable|getting\s*worse|worse\s*(and\s*worse|every|now)|won'?t\s*(go|stop|settle)|not\s*(going\s*away|getting\s*better|improving|stopping)|for\s*(weeks|months|a\s*long\s*time|ages|years)|\b\d+\s*(weeks?|months?|years?)\b|since\s*(last\s*)?(weeks?|months?|year)|every\s*(day|night|week)|daily|always|all\s*the\s*time|keeps?\s*(coming|happening|getting)|again\s*and\s*again|frequent|often|romba\s*naala|rombo\s*naala|neraya\s*naal|ரொம்ப\s*நாள/i;
const SHOP = /\b(what|which)\s+(\w+\s+){0,2}(products?|items?)|\b(products?|items?)\s*(list|range|enna|ennenna)|\b(price|cost|rate|evlo|evvalavu|how\s*much)\b|\b(delivery|deliver|shipping|order|buy|purchase|cod|cash\s*on|discount|offer|coupon|stock)\b/i;
const PRODUCT_Q = /what('?s|\s*is|\s*are)?\s*(in|inside)\b|ingredients?|contain|made\s*(of|with|from)|how\s*(to|do\s*i|should\s*i|can\s*i)\s*(use|apply|take)|price|cost|how\s*much|evlo|evvalavu|\bsize\b|details?|tell\s*me\s*about|what\s*(is|'s)\s*(the\s*)?(\w+\s*){0,4}(for|used\s*for)|enna\s*irukku/i;
const SAFETY_Q = /\b(safe|safety|side[- ]?effects?|harmful|allerg\w*|reaction|interact\w*)\b|(with|along\s*with|together\s*with)\s*my\s*(medicine|tablets?|insulin|maathirai)/i;
const IDENTITY = /\bare\s*(you|u)\s*(a|an)?\s*(real\s*)?(doctor|nurse|human|bot|robot|ai|machine|person|chatbot)\b|who\s*(are|r)\s*(you|u)\b|what\s*are\s*you\b|nee\s*yaaru|neenga\s*yaaru|yaaru\s*neenga/i;
const CURE_Q = /\b(cure|cures|curing|permanent(ly)?\s*(cure|relief|solution)|get\s*rid\s*of|treat(ment)?\s*for|heal)\b/i;
const CONDITION = /\b(an(a)?emia|thyroid|diabetes|bp|blood\s*pressure|cholesterol|pcos|pcod|kidney\s*stones?|arthritis|asthma|cancer|tumou?r|infection|ulcer|piles|h(a)?emorrhoids?|fibroids?|migraine|psoriasis|eczema|hepatitis|fatty\s*liver|gastritis|uti|covid|dengue|typhoid|tuberculosis|heart\s*disease|epilepsy|vertigo|sinus(itis)?|gout|kidney\s*disease|kidneys?\s*(problems?|issues?|failure|pain))\b/i;
// Diagnosed conditions where a product is made as wellness support (never a treatment). Tulsi mentions it only
// alongside the doctor's treatment, with "check with your doctor first". Breathing diseases (asthma, COPD) are
// deliberately not here: no product may be suggested for them.
const SUPPORT = [
  { label:'diabetes', product:'reviva', re:/diabet|\b(have|has|got)\s*sugar\b|sugar\s*(patient|patients|problem|level|control|care|maintain|management|manage|tablet|tablets|medicine|iruk|irruk|irukku|undu|disease|erang|kurai)|\b(blood\s*sugar|high\s*sugar|diabetic)\b|\bsugar\b.{0,20}(iruku|irukku|irukkudhu|irukudhu|control|manage|maintain|kuraika|product|roll\s*on|help)|neerizhivu|நீரிழிவு/i },
  { label:'fatty liver', product:'liver-booster', re:/fatty\s*liver(?!\s*risk)|fat\s*in\s*(my\s*|the\s*)?liver/i }
];
const DIAGNOSE_Q = /what\s*(disease|illness|condition|problem|sickness)\s*(do\s*|does\s*)?(i|she|he|they|my\s*\w+)\s*(have|has|got)|diagnos|what('?s|\s*is)\s*wrong\s*with\s*(me|her|him)|what\s*is\s*(causing|the\s*cause)|enna\s*(noi|vyadhi|vyaadhi)/i;
const DOSE_Q = /\b(dose|dosage|how\s*much\s*(should|to|can)\s*(i\s*|we\s*)?(take|eat|drink|give)|how\s*many\s*(times|tablets|spoons|capsules|drops))\b/i;

const SMALL_TALK = /^\s*(hi+|hello+|helo+|hey+|hai|yo|sup|wassup|whats\s*up|hola|vanakkam|good\s*(morning|afternoon|evening|night)|thanks?|thank\s*(you|u)|thanku|thanx|thnx|tnx|thx|tq|ty|ok+|okay|k|kk|hmm+|yes+|yeah+|yea|yep|yup|ya|sure|alright|aama|haan|sounds\s*good|will\s*do|sari|seri|nandri|super|nice|great|awesome|bye|take\s*care|see\s*(you|ya)|cool|fine|got\s*it|purinjuthu|purinjudhu|how\s*(are|r)\s*(you|u)(\s*doing)?(\s*today)?|how\s*is\s*it\s*going|epdi\s*(irukeenga|irukinga|iruka|irukka)|nalla\s*(irukeengala|irukingala|irukiya)|nice\s*talking\s*to\s*you)\b[\s!.,?🙏😊❤️💚👍]*((bro|da|ma|tulsi|dude|man|buddy|anna|akka|machi|machan|there|friend|so\s*much|a\s*lot|again|take\s*care|cool|super|nice|great|fine|thanks?|thank\s*(you|u)|got\s*it|sure|ok+|okay|will\s*do|sounds\s*good)[\s!.,?🙏😊❤️💚👍]*){0,3}$/iu;
// the visitor is finishing the chat ("no thanks", "that's all", "nothing else", "I'm good", "illa", "podhum")
const DONE = /^\s*(no+|nope|nah|nothing|nothing\s*(else|more)|no\s*(thanks?|thank\s*(you|u)|thx|tq|more|need|other\s*questions?)|no\s*that'?s\s*(all|it)|(that'?s|thats|that\s*is)\s*(all|it|enough)|i'?m\s*(good|done|fine|ok(ay)?|all\s*set)|all\s*(good|done|set)|done|not\s*now|maybe\s*later|onnum\s*(illa|vendam)|illa|vendam|podhum|pothum|podum)\b[\s!.,?🙏😊❤️💚👍]*((thanks?|thank\s*(you|u)|thx|tq|bye|take\s*care|tulsi|bro|da|ma|anna|akka|for\s*now|i'?m\s*good|that'?s\s*all|nandri)[\s!.,?🙏😊❤️💚👍]*){0,3}$/iu;
// "none of the above" / "something else" after the quick-reply options
const NONE_OF_THESE = /^\s*(none(\s*of\s*(these|them|those|the\s*above|above|this))?|something\s*else|some\s*other\s*(thing|problem)|other|others|neither|not\s*(these|this|listed|in\s*(the|this)\s*list)|vera\s*(ethavathu|edhavathu|onnu))\b[\s!.,?]*$/i;
// "how do I contact you / phone number / talk to a person / enquiry"
const CONTACT_Q = /\b(contact|phone\s*(no|num|number)|mobile\s*(no|num|number)|your\s*number|call\s*(you|u|someone|the\s*team|your\s*team|customer\s*care)|whats\s*app|whatsapp|e-?mail\s*(id|address)?|(your|office|shop)\s*address|customer\s*(care|service|support)|(talk|speak|chat)\s*(to|with)\s*(a\s*)?(human|person|someone|somebody|real\s*person|agent|executive|your\s*team|the\s*team|team)|reach\s*(you|u|the\s*team|your\s*team)|enquir\w*|inquir\w*)\b/i;
// a keyboard mash or only numbers/symbols ("asdfgh", "12345", "???")
const GIBBERISH = t => !/\p{L}{2}/u.test(t) || /(\p{L})\1{3,}/u.test(t) || /[bcdfghjklmnpqrstvwxz]{5,}/i.test(t.replace(/\s+/g, ''));
// the bot's own clarifying questions (to notice when it is about to ask the same thing twice)
const CLARIFY_REPLY = /help with the right thing|tell me in your own words|didn't quite get that|still couldn't follow|Happy to help you choose/i;
const STUCK_REPLY = /still couldn't follow|can't help with that here/i;

// the visitor says they are a man ("i am an man", "as a guy", "naan aambala"): period topics need a question, not tips
const MALE_SELF = /\b(i\s*('?m|am)|im|iam)\s*(a|an)?\s*(man|male|guy|boy|gent(leman)?)\b|\bas\s*a\s*(man|guy|male|boy)\b|\bnaan\s*(oru\s*)?(aambala|aan|paiyan)\b/i;
const PERIOD_WORDS = /\b(periods?|menstru\w*|chums|monthly\s*cycle)\b/i;
// the visitor is annoyed with the bot ("are u mad?", "useless", "what nonsense"): apologise, never "Sure!"
const FRUSTRATED = /^\s*(are\s*(you|u)\s*(mad|crazy|stupid|dumb|mental|nuts|serious|kidding|joking|ok)|(you|u)\s*(are|r)\s*(mad|crazy|stupid|dumb|useless|mental|wrong|not\s*(helping|helpful|understanding))|what\s*(rubbish|nonsense|the\s*(hell|heck))|(this\s*is\s*|so\s*|very\s*)?(useless|nonsense|rubbish|stupid|wrong\s*answer|not\s*helpful)|loosu|lusu|paithiyam|paithiyama|that'?s\s*(wrong|not\s*right)|makes?\s*no\s*sense|stupid\s*bot|did\s*(you|u)\s*(even\s*)?read)\b.{0,40}$/i;
// "any product for kidney?": what they asked for, when it is not a person or "it/this"
const FOR_WHAT = /\bfor\s+(my\s+|the\s+|your\s+|a\s+)?([a-z][a-z ]{1,24}?)\s*[?.!]*$/i;
const NOT_A_TOPIC = /^(it|this|that|these|those|me|him|her|them|us|my?self|friend|wife|husband|mother|mom|mum|amma|father|dad|appa|son|daughter|sister|brother|family|kids?|child(ren)?|baby|parents?|grandma|grandpa|men|women|man|woman|ladies|gents|everyone|anyone|sale|you|u|(daily|everyday|regular|general|overall|good|better|my|our|whole\s*family)?\s*(use|usage|health|wellness|purpose|routine|life|living|wellbeing|well\s*being)|daily|everyday|adults?|elders?|old\s*(people|age)|students?|office\s*(people|workers?)|working\s*(people|professionals?))$/i;

// "is this trustable / genuine / a scam?": who TranzLife is and how to check, never the product list
const TRUST_Q = /\b(certificat\w*|approv\w*\s*by|government\s*(approved|certified|registered)|govt|registered\s*(company|brand)|trust(able|worthy|ed)?|genuine|legit(imate)?|real\s*(company|site|website|products?)|fake|scam|fraud|reliable|authentic|original\s*products?|certified|certification|licen[cs]ed?|fssai|ayush|gmp|nambala(ma|am)?|nambalaama|nambikkai|nambakoodiya)\b/i;

// "she is not in her period", "it's not period pain": not the period topic
const NOT_PERIOD = /\b(not|no|isn'?t|aren'?t|never|without|illa|illai)\b\s+(\w+\s+){0,3}?(periods?|menstrua\w*|chums|cycle)\b|\b(periods?|chums)\s+(\w+\s+){0,2}?(illa|illai|over|finished|mudinjiduchu)\b/i;

// questions about what TranzLife and its products are for
const PURPOSE_Q = /\b(use|uses|usage|purpose|benefits?|point|aim|goal|mission|vision|motive|idea|speciality|specialty)\s*(of|behind)\s*(all\s*)?(the\s*|your\s*|ur\s*|these\s*|tranz\s*life\s*)*(products|company|brand|tranz\s*life)\b|\bwhat\s*(are|r|is|do|does)\s*(all\s*)?(your|ur|the|these|tranz\s*life)\s*products?\s*(for|do|used\s*for|good\s*for|meant\s*for)\b|\bwhy\s*(should\s*i\s*)?(use|buy|choose|trust)\s*(your|ur|tranz\s*life)\b|\bwhat\s*(does|do)\s*(tranz\s*life|your\s*company|you\s*guys)\s*(do|make|sell|offer)\b|\b(how|what)\s*(will|can|do|does)\s*(your|ur|tranz\s*life)\s*products?\s*(help|do)\b|\bproducts?\s*(ethuku|edhukku|ethukku|enna\s*use)\b|\b(your|ur|tranz\s*life'?s?|the\s*company'?s?)\s*(mission|vision|purpose|goal|aim|motto|values)\b/i;

// questions about Tulsi or TranzLife ("what can you do", "can you help me", "what is tranzlife", "who made you")
const ABOUT_Q = /what\s*(can|do)\s*(you|u)\s*do|how\s*(can|do)\s*(you|u)\s*help|^\s*(can|could)\s*(you|u)\s*help(\s*me)?\s*[?.!]*\s*$|^\s*(i\s*)?need\s*(some\s*)?help\s*[?.!]*\s*$|^\s*help(\s*me)?\s*[?.!]*\s*$|what\s*(is|'s)\s*tranz\s*life|about\s*(your|the|this)\s*company|tell\s*me\s*about\s*(tranz\s*life|your\s*company|yourself|you)|who\s*(made|built|created|owns|runs)\s*(you|u|tranz\s*life)|what\s*is\s*this\s*(site|website|chat)/i;

// Common Tamil words typed in English letters. Two or more hits = Tanglish.
const TANGLISH = /\b(iruku|irukku|irukken|iruka|irukka|romba|rombo|enaku|enakku|ennaku|unaku|unakku|ungalku|ungalukku|namma|kita|kitta|pathi|paththi|theriyuma|theriyum|theriyala|solla|sollu|sollunga|panna|pannu|pannanum|mudiyala|mudiyalai|aaguthu|aagudhu|agudhu|illa|ille|venum|vendum|epdi|eppadi|enna|yenna|konjam|nalla|naan|nee|neenga|unga|enga|amma|appa|ku|la|ah|da|di|bro|machi|vali|valikuthu|valikudhu|sapadu|saapadu|thookam|thoongave|kaal|kai|udambu|seri|sari|pa|ma|nu|than|thaan|dhaan|kooda|ipo|ippo|apo|appo|varala|pogala|aachu|aagala)\b/gi;

function language(text){
  if (/[஀-௿]/.test(text)) return 'tamil';
  return (text.match(TANGLISH) || []).length >= 2 ? 'tanglish' : 'english';
}

// Topics in a message, ordered by where they are first mentioned: the earliest mention is the main topic
// ("I smoke and drink daily" is mainly about smoking).
const concernsIn = text => CONCERNS.map(c => ({ c, at:text.search(c.match) })).filter(x => x.at >= 0).sort((x, y) => x.at - y.at).map(x => x.c);

// self markers; "other" (a friend or relative) is checked first
const SELF = /\b(i|i'?m|im|i'?ve|me|myself|mine|enaku|enakku|ennaku|naan|nan|naa)\b|\bmy\b/i;
const subjectOf = text => ABOUT.other.test(text) ? 'other' : SELF.test(text) ? 'self' : null;
const nameOf = id => CATALOG.find(p => p.id === id).name;

// Who a message is about: age (if a number is given), age group and gender, from the recent messages about that person.
// ("my mother is 60", "i am 45", "father aged 70"; a number right after a person word, never "my bp is 140")
const AGE_NUM = /\b(\d{1,3})\s*(years?|yrs?|y\/?o|vayasu|vayathu)\b|\bage(d)?\s*(is\s*|of\s*)?(\d{1,3})\b|\b(?:i\s*am|i'?m|im|mother|father|mom|mum|dad|amma|appa|wife|husband|son|daughter|grandma|grandpa|grandmother|grandfather|paati|patti|thatha|brother|sister|friend|he|she|uncle|aunt|aunty)\s+(?:(?:who|that)\s+is\s+|is\s+|was\s+|aged\s+|age\s+|of\s+age\s+)?(\d{1,3})\b(?!\s*(\/|kg|kgs|cm|mg|ml|%|bpm|lakhs?))/i;
const BABY = /\b(baby|babies|infants?|new\s*-?\s*born|toddlers?|kuzhandh\w*|kozhandh\w*|kuzhanth\w*|paapa|pappa)\b|\b([1-9]|1[0-1])\s*months?\s*old\b/i;
const CHILD = /\b(kids?|child|children|school\s*(going|kid|boy|girl)|pasanga|pillainga|my\s*(little|small)\s*(boy|girl|son|daughter))\b|\b([1-9]|1[0-3])\s*(years?|yrs?|vayasu)\s*old\b/i;
const ELDER = /\b(grand\s*(ma|mother|pa|father)|grandma|grandpa|granny|paati|patti|thatha|thaatha|elderly|old\s*(age|man|woman|lady|people|person|parents?)|senior\s*citizens?|aged\s*(parents?|people|mother|father))\b/i;
const FEMALE = /\b(wife|mother|mom|mum|amma|sister|sis|daughter|grand\s*ma|grandma|grandmother|granny|paati|patti|aunt|aunty|athai|chithi|girlfriend|she|her|lady|woman|girl|akka|thangachi|ponnu|manaivi|pondatti)\b|\bi\s*('?m|am)\s*(a|an)?\s*(woman|girl|lady|female)\b|\b(period|menstru|pregnan|breast\s*-?feed)/i;
const MALE = /\b(husband|hubby|father|dad|daddy|appa|brother|son|grand\s*pa|grandpa|grandfather|thatha|thaatha|uncle|boyfriend|he|him|his|purushan)\b/i;
function personOf(recent, subject, childQ, child){
  const n = (recent.match(AGE_NUM) || []).slice(1).map(Number).find(x => x > 0 && x < 120) || null;
  const adult = /\b(is|aged?|age)\s*(1[89]|[2-9]\d)\b|\b(1[89]|[2-9]\d)\s*(years?|yrs?|vayasu)\b|\b(grown[- ]?up|married|working|college|engineer|job|office)\b/i.test(recent);
  const group = n != null ? (n < 2 ? 'baby' : n < 14 ? 'child' : n > 50 ? 'elderly' : 'adult')
    : BABY.test(recent) ? 'baby' : ELDER.test(recent) ? 'elderly' : (CHILD.test(recent) || childQ || child) && !adult ? 'child' : null;
  // the visitor's own gender only when they say it; someone else's from the relation word ("my wife", "my father")
  const gender = subject === 'self'
    ? (MALE_SELF.test(recent) ? 'male' : /\bi\s*('?m|am)\s*(a|an)?\s*(woman|girl|lady|female)\b|\b(period|menstru|pregnan)/i.test(recent) ? 'female' : null)
    // (period or pregnancy words say nothing about who is asking: "my husband has period pain" is still a man)
    : ((f, m) => f && !m ? 'female' : m && !f ? 'male' : null)(FEMALE.test(recent.replace(/\b(period|menstru|pregnan|breast\s*-?feed)\w*/gi, '')), MALE.test(recent));
  return { age:n, group, gender };
}
// why a product does not suit this person: 'age', 'gender' or null (client rules, catalog.js minAge / maxAge / women)
function notFor(p, person, recent = ''){
  if (!p) return null;
  // a disease the product must never be linked to (asthma: no lung product; it is not a substitute for respiratory medicine)
  if (p.avoidWith && p.avoidWith.test(recent)) return 'condition';
  if (p.women && person.gender === 'male') return 'gender';
  // (CycleRelief is for all women who get periods: girls from 10 can use it, never babies)
  if (p.minAge && (person.group === 'baby' || (person.group === 'child' && !p.childOk) || (person.age != null && person.age < p.minAge))) return 'age';
  if (p.maxAge && (person.group === 'elderly' || (person.age != null && person.age > p.maxAge))) return 'age';
  return null;
}

// history: [{ role, content }], ending with the visitor's latest message
// semantic: optional result of server/understand.js for the latest message ({ concerns, products, intent, subject,
// emergency }). It only fills gaps the regexes leave; it never removes a regex finding (TULSI_FIX_BRIEF.md phase 2).
function analyse(history, { semantic = null } = {}){
  const users = history.filter(m => m.role === 'user').map(m => m.content);
  const last = users[users.length - 1] || '';
  // Who each message is about (self / other). A message with no marker ("which product?") inherits the subject of the
  // message before it; the first message defaults to the visitor. The semantic layer decides only when there is no marker.
  const subjects = []; users.forEach((u, i) => {
    const s = subjectOf(u);
    if (s) subjects.push(s);
    else if (SHOP_EXPLICIT.test(u) || IDENTITY.test(u) || SMALL_TALK.test(u)) subjects.push('self');
    else subjects.push((i === users.length - 1 && semantic?.subject) || subjects[i - 1] || 'self');
  });
  const subject = subjects[subjects.length - 1] || 'self';
  // Facts and warning signs come only from the last few messages about the SAME person as the latest message, so a
  // friend's diabetes, BP tablets, pregnancy or child never changes the visitor's products or disclaimers (and back).
  const sameRecent = users.map((u, i) => ({ u, s:subjects[i] })).slice(-4).filter(x => x.s === subject).map(x => x.u);
  const recent = sameRecent.join('\n');
  // (a question like "does Reviva cure blood sugar?" is not saying the person HAS a condition: cure questions do not
  //  count for diabetes, long-term conditions or regular medicine)
  const factsText = sameRecent.filter(u => !CURE_Q.test(u)).join('\n');
  const about = Object.fromEntries(Object.entries(ABOUT).map(([k, re]) => [k, ['diabetes', 'chronic', 'onMeds'].includes(k) ? re.test(factsText) : re.test(recent)]));
  const now = Object.fromEntries(Object.entries(ABOUT).map(([k, re]) => [k, re.test(last)]));
  about.other = now.other = subject === 'other';
  // "my daughter is 22" / "my son works in IT" is an adult, not a child
  const ADULT = /\b(is|aged?|age)\s*(1[89]|[2-9]\d)\b|\b(1[89]|[2-9]\d)\s*(years?|yrs?|vayasu)\b|\b(grown[- ]?up|married|working|college|engineer|job|office)\b/i;
  if (ADULT.test(recent)) about.child = false;
  if (ADULT.test(last)) now.child = false;
  const prevSubject = subjects[subjects.length - 2];

  const nowFlags = RED_FLAGS.filter(f => f.re.test(last) && (!f.with || now[f.with]));
  // warning signs stay on for the next few messages about that person, so a follow-up cannot get home tips for a red-flag problem
  let flags = RED_FLAGS.filter(f => f.re.test(recent) && (!f.with || about[f.with]));
  if (flags.some(f => f.id.startsWith('diabetic'))) flags = flags.filter(f => f.id !== 'foot-wound');
  if (flags.some(f => f.id === 'diabetic-foot')) flags = flags.filter(f => f.id !== 'diabetic-wound');
  // the semantic layer may ADD a warning (never remove one)
  if (semantic?.emergency) flags.push({ id:'possible-emergency', why:'something that may need urgent medical help',
    say:'This may need urgent medical help. If it is sudden or severe, please call 112 or go to the nearest hospital now; otherwise please see a doctor today.' });

  // (names of products that are not on sale are removed first: "craving control gummies" is not PulmoClear)
  const named = namedIn(last.replace(new RegExp(COMING_SOON_MATCH.source, 'gi'), ' '));
  // small talk: the greeting rule, or the understanding layer for short messages with no health topic ("hi dude")
  const done = DONE.test(last), frustrated = FRUSTRATED.test(last);
  const smallTalk = !frustrated && (SMALL_TALK.test(last) || done) || (!frustrated && semantic?.intent === 'smalltalk' && !named.length && !CONTACT_Q.test(last) && !NONE_OF_THESE.test(last) && !concernsIn(last).length && last.trim().split(/\s+/).length <= 8);
  const found = (last.match(CONDITION) || [])[0] || '';
  const condition = /^kidney/i.test(found) ? 'kidney problems' : /^bp$/i.test(found) ? 'blood pressure' : /^uti$/i.test(found) ? 'urine infection' : /^(pcos|pcod)$/i.test(found) ? found.toUpperCase() : found.toLowerCase();
  const support = SUPPORT.filter(s => s.re.test(last));
  const cureQ = CURE_Q.test(last), diagnoseQ = DIAGNOSE_Q.test(last), doseQ = DOSE_Q.test(last), stopMeds = STOP_MEDS.test(last);

  // the topic comes from the latest message. Only a short follow-up ("what else?") keeps the previous topic:
  // a new message about something else ("eye pain") must never get the old topic's tips.
  // (product names are removed first, so "Liver Booster" is a product question, not the liver-care topic)
  const topicText = CATALOG.reduce((t, p) => t.replace(new RegExp(p.match.source, 'gi'), ' '), last);
  const notPeriod = NOT_PERIOD.test(last), notDrinking = NOT_DRINKING.test(last);
  const negated = c => (notPeriod && c.id === 'period') || (notDrinking && c.id === 'alcohol');
  let concerns = smallTalk ? [] : concernsIn(topicText).filter(c => !negated(c)).slice(0, 2), fresh = concerns.length > 0, carried = false, viaSemantic = false;
  // no regex topic: use the semantic layer's topic (typos, Tamil, paraphrases), or the topic of a product it matched by use
  if (!concerns.length && !smallTalk && !named.length && semantic){
    const ids = semantic.concerns?.length ? semantic.concerns
      : semantic.intent === 'recommend' ? (semantic.products || []).map(id => CONCERNS.find(c => c.products.includes(id))?.id).filter(Boolean) : [];
    concerns = [...new Set(ids)].map(id => CONCERNS.find(c => c.id === id)).filter(Boolean).filter(c => !negated(c)).slice(0, 2);
    fresh = viaSemantic = concerns.length > 0;
  }
  // a follow-up ("what else?", "which product should I use?", "enna product?") continues the previous topic, products included
  const recommendQ = RECOMMEND.test(last) || semantic?.intent === 'recommend';
  // ...but NOT when the message describes a new problem of its own that we did not recognise ("i work in delhi and face
  // respiratory issues, is there any product?" must never get the previous topic's product)
  // "any product for kidney health?" names its own topic: never carry the previous one
  const askedFor = (() => { const m = last.match(FOR_WHAT); const w = m && m[2].trim().toLowerCase(); return w && !NOT_A_TOPIC.test(w) && !/\b(product|thing|something|anything)\b/.test(w) ? w : null; })();
  if (!concerns.length && !named.length && !describesNew(last) && !askedFor && (isFollowUp(last) || (['recommend', 'shop'].includes(semantic?.intent) && last.trim().split(/\s+/).length <= 14))){
    for (let i = users.length - 2; i >= Math.max(0, users.length - 3) && !concerns.length; i--){
      const u = users[i];
      const prevNamed = namedIn(u);
      if (prevNamed.length){
        const prodConcern = CONCERNS.find(c => c.products.includes(prevNamed[0]));
        if (prodConcern){
          concerns = [prodConcern];
          carried = true;
          break;
        }
      }
      concerns = concernsIn(CATALOG.reduce((t, p) => t.replace(new RegExp(p.match.source, 'gi'), ' '), u)).slice(0, 2);
      // the rules missed the previous message ("I drink most nights"): use what the understanding layer found in it
      if (!concerns.length && i === users.length - 2 && semantic?.prevConcerns?.length)
        concerns = semantic.prevConcerns.map(id => CONCERNS.find(c => c.id === id)).filter(Boolean).slice(0, 2);
      carried = concerns.length > 0;
      if (carried) break;
    }
  }

  const prevProds = previousProducts(history);
  // "it" / "this" with no product named refers to the product(s) just suggested
  const refProducts = !namedIn(last).length && ANAPHORA.test(last) ? prevProds : [];
  const explainQ = EXPLAIN_Q.test(last);
  // "she is 45" right after "can my mom use this?": the age answers that question
  const ageOnly = /^\s*((she|he|they|my\s+\w+|her\s+age|his\s+age|age|avanga|avar)\s*)?(is|'s|=|:)?\s*\d{1,3}\s*(years?|yrs?|vayasu)?(\s*old)?\s*[.!]?\s*$/i.test(last) && prevProds.length > 0;
  const suitabilityQ = SUITABILITY_Q.test(last) || ageOnly;

  let targetExplain = [];
  if (explainQ){
    if (named.length){
      const matchingConcern = concerns.find(c => named.some(id => c.products.includes(id)));
      if (matchingConcern) targetExplain = named.filter(id => matchingConcern.products.includes(id));
      if (!targetExplain.length) targetExplain = named;
    } else if (ANAPHORA.test(last) || last.trim().split(/\s+/).length <= 8){
      targetExplain = prevProds;
    }
  }

  let targetSuitability = [];
  if (suitabilityQ){
    if (named.length){
      targetSuitability = named;
    } else if (ANAPHORA.test(last) || last.trim().split(/\s+/).length <= 8){
      targetSuitability = prevProds;
    }
  }

  // "is this safe?" / "any side effects?" right after a product was shown is about that product
  const safetyQ = SAFETY_Q.test(last);
  const safetyTarget = !safetyQ ? [] : named.length ? named
    : (ANAPHORA.test(last) || last.trim().split(/\s+/).length <= 8) ? prevProds : [];

  // "grandma", "child" or "pregnant" describe the person, not the problem: dropped when a real problem is named.
  // A long-term condition with an everyday problem ("diabetic, I have a sore throat"): the everyday problem is the
  // topic, and the condition only shapes the cautions (about.*, support products).
  const PERSON_TOPICS = ['elderly', 'child', 'pregnancy'];
  if (concerns.length > 1 && concerns.some(c => !PERSON_TOPICS.includes(c.id))) concerns = concerns.filter(c => !PERSON_TOPICS.includes(c.id));
  // "can my 70 year old dad use liver booster?": only a person word and a product, so it is a question about the product
  if (named.length && concerns.length && concerns.every(c => PERSON_TOPICS.includes(c.id))){ concerns = []; fresh = false; }
  if (concerns.some(c => c.kind !== 'condition') && concerns.some(c => c.kind === 'condition')) concerns = concerns.filter(c => c.kind !== 'condition');
  const conditionOnly = concerns.length > 0 && concerns.every(c => c.kind === 'condition');
  let faq = null;
  // products the visitor may be choosing between, and their situation (the latest real topic in the conversation)
  const chooseFrom = [...new Set([...named, ...(named.length >= 2 ? [] : prevProds)])];
  // (product names are removed first: "BreatheFree Aromatherapy Inhaler" is not the stress topic)
  const noNames = u => CATALOG.reduce((t, p) => t.replace(new RegExp(p.name.replace(/[()+]/g, ' '), 'gi'), ' ').replace(new RegExp(p.match.source, 'gi'), ' '), u);
  const situation = [...users.slice(-4)].reverse().map(u => concernsIn(noNames(u)).find(c => c.products.some(id => chooseFrom.includes(id)))).find(Boolean) || null;
  // no situation known: no pick, the reply says what each is for and asks what they need
  const choice = situation?.products.find(id => chooseFrom.includes(id)) || null;
  const childQ0 = /\b(kids?|children|child|baby|babies|toddlers?|infants?|kuzhandh\w*|kozhandh\w*|pasanga|pillainga)\b/i.test(last);
  // what kind of message is this? (first match wins)
  // A warning sign in this message, or in the last few messages about the same person, always comes first: the doctor
  // message, no tips, no product, no "how it works" or "who can use it" pitch ("diabetic toe sore" -> "can I use Reviva
  // on it?" must still get the doctor message). Only small talk, "who are you / what can you do" and pure price or
  // delivery questions with no product named are answered normally. One exception: when the only warning is the
  // drinking-habit one (not an urgent symptom), a product question ("any product for my friend?", "can he use the
  // liver booster?", "is this safe?") gets an honest answer that LEADS with that warning (doctor + 14446).
  const habitOnly = flags.length && flags.every(f => f.id === 'alcohol-dependence');
  const flagOff = smallTalk || IDENTITY.test(last) || TRUST_Q.test(last) || ABOUT_Q.test(last) || (CONTACT_Q.test(last) && !named.length) || (SHOP_EXPLICIT.test(last) && !named.length && !explainQ && !suitabilityQ)
    || (habitOnly && !nowFlags.length && ((named.length && (explainQ || suitabilityQ)) || (recommendQ && concerns.length) || safetyTarget.length));
  let mode;
  if (nowFlags.length || flags.some(f => f.id === 'possible-emergency') || (flags.length && !flagOff)) mode = 'flag';
  else if (IDENTITY.test(last)) mode = 'identity';
  // "what is the use / purpose of your products?", "what does TranzLife do?": the company's purpose and what each product is for
  else if (PURPOSE_Q.test(last) && !fresh && !named.length) mode = 'purpose';
  else if (ABOUT_Q.test(last) && !fresh && !named.length) mode = 'about';
  else if (frustrated) mode = 'sorry';
  else if (TRUST_Q.test(last) && !fresh && !named.length) mode = 'trust';
  // a man asking about periods for himself: ask what they mean (or who it is for) instead of giving period tips or CycleRelief
  // (also for a man they ask about: "my husband has period pain")
  else if ((concerns.some(c => c.id === 'period') || PERIOD_WORDS.test(last)) && personOf(recent, subject, false, false).gender === 'male') mode = 'askwho';
  // a product or supplement for a baby or child, with no health topic: our products are for ages 14 and above
  else if ((!concerns.length || concerns.every(c => c.id === 'child')) && !named.length && ['baby', 'child'].includes(personOf(recent, subject, false, about.child).group)
    && (recommendQ || /\b(supplements?|vitamins?|tonic|products?|health\s*drink|nutrition)\b/i.test(last))) mode = 'kids';
  else if (smallTalk) mode = 'smalltalk';
  // product and shop questions that are not a health problem ("a sweet supplement?", "cash on delivery?", "is it
  // vegetarian?"): answered from catalogue facts (server/faq.js). Never when the message describes a health problem.
  // (keywords first; then the meaning-based matcher's pick, unless the rules found a health topic in the message)
  // (a person word alone, "my grandma", is not a health problem)
  else if (SHORTER_Q.test(last) && !named.length && (prevProds.length || users.length > 1)) mode = 'shorter';
  else if (COUNT_Q.test(last) && !named.length) mode = 'shop';
  // "what suits me / one product for general health", with no health problem named: the all-round product, then ask
  else if (GENERAL_Q.test(last) && !named.length && !concerns.some(c => !PERSON_TOPICS.includes(c.id))) mode = 'general';
  // choosing between products (named now, or just suggested): the model answers this person's question from the
  // products' facts, with a main pick worked out from their situation (client, 14 Nov 2026: "I need only one product")
  else if (CHOOSE_Q.test(last) && chooseFrom.length >= 2) mode = 'choose';
  // "what is the price?" right after a product was suggested: that product's price, not the whole list
  else if (PRICE_Q.test(last) && !named.length && prevProds.length && !fresh && last.trim().split(/\s+/).length <= 8 && !/\b(all|every|list|range|products)\b/i.test(last)) mode = 'price';
  // ("it" / "this" in a product question means the product just suggested: "how to store it", "does it smell")
  else if (!carried && (faq = faqFor(last, named.length ? named : refProducts, personOf(recent, subject, false, about.child), fresh && !viaSemantic && !concerns.every(c => PERSON_TOPICS.includes(c.id)))
    || (semantic?.faq && !(fresh && !viaSemantic) ? faqById(semantic.faq, { last, named:named.length ? named : refProducts, person:personOf(recent, subject, false, about.child) }) : null))) mode = 'faq';
  else if (safetyQ && (safetyTarget.length || /\b(your|these|this|tranzlife)\s*(products?|gumm|inhaler|roll|liquid)/i.test(last))) mode = 'safety';
  else if (stopMeds && (!fresh || conditionOnly) && !named.length) mode = 'medical';
  // a diagnosed condition with a support product ("I have diabetes"), not a cure or stop-medicine question
  // ("how to control diabetes" asks for care: it gets the topic flow below, the product first and then care tips)
  else if (support.length && !cureQ && !stopMeds && (!fresh || conditionOnly) && !named.length && !(HOW_TO.test(last) && conditionOnly)) mode = 'support';
  // (a cure question, or a condition with no product named: "Reviva for diabetes?" is a product question)
  // (a cure question, or a condition we have no topic for: the strict medical reply; a condition we know gets the
  //  warm topic flow below: simple care tips, check-ups with the doctor, and urgent signs)
  // "is reviva a complete cure for sugar?": a clear No, and what the product is really for
  else if (cureQ && (named.length || refProducts.length)) mode = 'curenamed';
  else if (((condition && !concerns.length) || (cureQ && (!fresh || conditionOnly || condition))) && (cureQ || !named.length)) mode = 'medical';
  else if (BUY_Q.test(last) && (named.length || refProducts.length || prevProds.length)) mode = 'buy';
  else if (suitabilityQ && targetSuitability.length) mode = 'suitability';
  else if (explainQ && targetExplain.length) mode = 'explain';
  else if (named.length && (PRODUCT_Q.test(last) || !fresh || conditionOnly)) mode = 'product';
  else if (COMING_SOON_MATCH.test(last) && (!fresh || PRODUCT_Q.test(last) || explainQ || suitabilityQ)) mode = 'soon';
  // "how do I contact you / phone number / talk to a person": the contact form, with a button to open it
  else if (CONTACT_Q.test(last) && !fresh) mode = 'contact';
  // "do you sell anything for it?" right after a problem is a request for that problem's products, not a shop question
  else if (recommendQ && carried && concerns.length && /\bfor\s+(it|this|that|these|him|her|them|me)\b/i.test(last)) mode = 'recommend';
  // (a health problem in the same message wins: "as a delivery rider I am worn out" is about tiredness, not delivery)
  else if ((SHOP_EXPLICIT.test(last) || semantic?.intent === 'shop') && !(fresh && !/\?|\b(price|cost|order|buy|pay|deliver\s+to)\b/i.test(last))) mode = 'shop';
  // "which product should I use?" with a health topic (in this message or just before) recommends that topic's products
  else if (recommendQ && concerns.length) mode = 'recommend';
  else if (concerns.length) mode = 'tips';
  else if (named.length) mode = 'product';
  // no topic we can help with (or "which product?" with no topic yet): ask a short clarifying question with quick replies
  else mode = 'clarify';
  // a product answer for a baby or child: our products are for ages 14 and above
  if (mode === 'faq' && faq.products.length && ['baby', 'child'].includes(personOf(recent, subject, childQ0, about.child).group)) mode = 'kids';
  // a product named for a problem it is not made for ("can I use cycle relief for headache?"): say what it is for,
  // and give that problem's own help instead
  // (only a real problem counts: "elderly", "child" or "pregnancy" describe the person)
  const wrongUse = ['product', 'suitability', 'explain', 'safety'].includes(mode) && named.length === 1 && fresh && !viaSemantic && concerns.some(c => !PERSON_TOPICS.includes(c.id) && c.kind !== 'condition') && !concerns.some(c => c.products.includes(named[0]))
    && !CATALOG.find(p => p.id === named[0]).forProblems?.some(fp => concerns.some(c => fp.toLowerCase().includes(c.label.split(' ')[0])));
  if (wrongUse && ['product', 'suitability', 'explain', 'safety'].includes(mode)) mode = 'tips';
  if (mode !== 'tips' && mode !== 'recommend') concerns = [];

  const careful = about.pregnant || about.breastfeeding || about.child;
  const serious = SERIOUS.test(recent);
  const tips = [], doctor = [];
  concerns.forEach(c => {
    const v = about.diabetes && c.diabetes ? c.diabetes : c;
    v.tips.filter(t => !(careful && t.kind === 'food') && !(about.diabetes && t.sugar) && !(about.child && t.adult)).forEach(t => tips.push(t));
    // small everyday problems are not sent to a doctor; only severe, lasting or worsening ones (or always-check topics)
    if (serious || v.alwaysDoctor || c.alwaysDoctor) doctor.push(v.doctor);
  });

  if (tips.length > 1){
    const queryWords = last.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    const tipScore = t => {
      let s = 0;
      const tl = t.text.toLowerCase();
      for (const w of queryWords){
        if (tl.includes(w) || (w.length >= 4 && tl.includes(w.slice(0, 4)))) s += 2;
      }
      return s;
    };
    tips.sort((a, b) => tipScore(b) - tipScore(a));
  }

  // products: only for a topic raised in this message or a product asked about by name; never with a warning sign,
  // a medicine, diagnosis or cure-of-a-condition question; never in pregnancy, breastfeeding or for children;
  // nothing swallowed with diabetes, a long-term condition or regular medicine
  // (a diagnosed condition mentioned with an everyday problem, e.g. "I have sugar and feel tired", adds its support product)
  // (follow-ups keep the products; each topic gets at least its first product, in topic order, up to 4)
  // (main topic's products first, then the first product of each other topic, then the rest)
  const byTopic = [...(concerns[0]?.products || []), ...concerns.slice(1).map(c => c.products[0]).filter(Boolean), ...concerns.slice(1).flatMap(c => c.products.slice(1))];
  const wanted = ['tips', 'recommend', 'product', 'support', 'explain', 'suitability'].includes(mode)
    ? [...new Set([...(fresh || carried ? byTopic : []), ...(wrongUse ? [] : named), ...(mode === 'explain' ? targetExplain : []), ...(mode === 'suitability' ? targetSuitability : []), ...(cureQ || stopMeds ? [] : support.map(s => s.product))])].slice(0, 4) : [];
  const buyFor = named.length ? named : refProducts.length ? refProducts : prevProds;
  let products = mode === 'general' ? ['energy-booster'] : mode === 'curenamed' ? (named.length ? named : refProducts) : mode === 'buy' ? buyFor : mode === 'shorter' ? prevProds : mode === 'faq' ? faq.products : mode === 'price' ? prevProds : mode === 'choose' ? (choice ? [choice] : chooseFrom.length <= 2 ? chooseFrom : []) : wanted;
  // "can kids use it?" counts as a child being involved
  const childQ = /\b(kids?|children|child|baby|babies|toddlers?|infants?|kuzhandh\w*|kozhandh\w*|pasanga|pillainga)\b/i.test(last);
  if (stopMeds || diagnoseQ || (cureQ && condition)) products = [];
  // who each product is for (client, 13 Nov 2026): ages 14+ (Liver Booster 14 to 50, Reviva any age), CycleRelief
  // for women only; in pregnancy or while breastfeeding no new product is suggested (a doctor's word first).
  // A medical condition or regular medicine does NOT hold a product back: it is shown with a "check with your doctor" note.
  const person = personOf(recent, subject, childQ, about.child);
  const whyNot = {};
  products.forEach(id => { const r = notFor(CATALOG.find(p => p.id === id), person, recent) || ((about.pregnant || about.breastfeeding) && 'pregnancy'); if (r) whyNot[id] = r; });
  products = products.filter(id => !whyNot[id]);
  const heldBack = wanted.filter(id => !products.includes(id));
  // product names the reply may say
  // products the catalogue's own "how it works / who can use it" text points to ("if you do not smoke, the BreatheFree Inhaler is a better fit")
  const pointedTo = [...targetExplain, ...targetSuitability].map(id => CATALOG.find(p => p.id === id)).filter(Boolean)
    .flatMap(p => Object.keys(PRODUCT_NAMES).filter(id => PRODUCT_NAMES[id].test(`${p.mechanism || ''} ${p.suitability || ''}`)));
  const mentionable = mode === 'flag' ? [] : mode === 'choose' ? chooseFrom : ['shop', 'soon', 'purpose', 'faq', 'price', 'buy', 'curenamed', 'shorter', 'general'].includes(mode) ? CATALOG.map(p => p.id) : [...new Set([...products, ...named, ...targetExplain, ...targetSuitability, ...pointedTo, ...(mode === 'safety' ? safetyTarget : [])])];

  const allowed = new Set(tips.flatMap(t => t.uses || []));
  products.forEach(id => (PRODUCT_WORDS[id] || []).forEach(w => allowed.add(w)));

  // remedies or doses the visitor asked about that are not approved: a fixed sentence says we cannot advise on them
  // (only when they ask about using it: "I soak a pad every hour" is not a question about soaking)
  const asking = /\?|\b(should|can|could|may|shall|is\s*it\s*(ok|okay|good|fine|safe)|do\s*i|will|try|use|using|apply|take|drink|eat|put|give|rub)\b|pannalama|podalama|kudikalama|sapdalama|thadavalama|use\s*pannalama/i.test(last);
  const found_remedies = !asking ? [] : Object.entries(REMEDIES).filter(([k, re]) => !allowed.has(k) && !(k === 'soak' && flags.length) && re.test(last)).map(([, re]) => last.match(re)[0].toLowerCase());
  // drop words already inside another one ("oil" when "coconut oil" was found)
  const asked = [...new Set(found_remedies)].filter((w, i, all) => !all.some((o, j) => j !== i && o.length > w.length && o.includes(w)));
  const prefix = [];
  if (wrongUse){ const p = CATALOG.find(x => x.id === named[0]); prefix.push(`The ${p.name} is ${p.pitch}, not for ${concerns[0].label}. For ${concerns[0].label}, here is what may help instead.`); }
  if (diagnoseQ) prefix.push('I can\'t tell what is causing this. Only a doctor can check that properly.');
  if (asked.length) prefix.push(`I can't advise on ${[...new Set(asked)].join(' or ')}${doseQ ? ' or how much to take' : ''}, so please check with a doctor or pharmacist before trying ${asked.length > 1 ? 'them' : 'it'}.`);
  else if (doseQ) prefix.push('I can\'t advise on doses, so please ask a doctor or pharmacist about that.');
  if (cureQ && mode === 'tips') prefix.push('I can\'t promise a cure, but a few simple things may help.');
  // fixed sentences after the reply, written by code so they can never be left out
  const suffix = [], helps = mode === 'tips' || mode === 'recommend';
  const they = subject === 'other', whose = they ? 'their' : 'your';
  if (helps && (about.pregnant || about.breastfeeding))
    suffix.push(`During ${about.pregnant ? 'pregnancy' : 'breastfeeding'} it's usually best not to start any new product, so a quick word with ${whose} doctor first will be good. 🌿`);
  else if (helps && Object.values(whyNot).includes('age') && (person.group === 'baby' || person.group === 'child'))
    suffix.push(`Our products are made for ages 14 and above, so for a ${person.group === 'baby' ? 'baby' : 'child'}, please talk to the ${person.group === 'baby' ? "baby's" : "child's"} doctor before giving anything new.`);
  else if (helps && Object.values(whyNot).includes('age'))
    suffix.push(`${heldBack.filter(id => whyNot[id] === 'age').map(nameOf).join(' and ')} is made for ages ${heldBack.filter(id => whyNot[id] === 'age').map(id => CATALOG.find(p => p.id === id)).map(p => p.maxAge ? `${p.minAge} to ${p.maxAge}` : `${p.minAge} and above`).join(', ')}, so for ${they ? 'them' : 'you'}, please ask the doctor first.`);
  if (helps && Object.values(whyNot).includes('condition'))
    suffix.push(`With ${they ? 'their' : 'your'} condition, please keep following the doctor's treatment, so I won't suggest a product for it. 🌿`);
  if (helps && products.length && (about.diabetes || about.chronic || about.onMeds) && !support.length)
    suffix.push(`Since ${they ? 'they have' : 'you have'} a health condition or take regular medicine, please check with ${whose} doctor first and use the suggested product as they advise.`);
  // an everyday problem with no TranzLife product and no reason to see a doctor: say more products are coming soon
  // (client, 13 Nov 2026); serious, lasting or worsening problems get the doctor line instead
  if (mode === 'tips' && !wanted.length && !named.length && !doctor.length && !flags.length && concerns.length)
    suffix.push(`We don't have a TranzLife product for ${concerns[0].label} yet, but more products are on the way and will launch soon. 🌿`);
  // every helpful reply ends by asking what next (client flow, 13 Nov 2026), with quick replies (suggestChips)
  const askNext = helps && !flags.length && !/explore our products/.test([...history].reverse().find(m => m.role === 'assistant')?.content || '');
  // the product suggestion is written by code from the catalogue, never by the model
  // Every product card gets a sentence about it: the full pitch the first time, a short reminder when the same product
  // was already suggested in the last few messages (tester, 14 Nov 2026: cards appeared with no word about them)
  // Tulsi is TranzLife's assistant, so the product comes FIRST, with real facts (what it is, how to use it, price), and the
  // care tips follow (client, 14 Nov 2026). Written by code from the catalogue, never by the model.
  const pitchedBefore = id => history.slice(-4).some(m => m.role === 'assistant' && m.content.includes(CATALOG.find(p => p.id === id)?.name));
  const lead = [];
  if (mode === 'tips' && products.length){
    const priceOf = p => p.price ? `₹${p.price}` : p.priceSoon ? 'price coming soon' : null;
    const line = p => `**${p.name}**${priceOf(p) ? ` (${priceOf(p)})` : ''}: ${p.highlight || p.pitch}. How to use: ${p.useShort || 'follow the pack label'}.`;
    const fresh_ = products.filter(id => !pitchedBefore(id)).map(id => CATALOG.find(x => x.id === id));
    const again = products.filter(pitchedBefore).map(id => CATALOG.find(x => x.id === id));
    const them = subject === 'other';
    const main = concerns[0];
    // drinking: the product supports the liver, it is not a way to quit
    const intro = main?.id === 'alcohol' ? `While ${them ? 'they cut' : 'you cut'} down on alcohol, our TranzLife ${fresh_.length > 1 ? 'products' : 'product'} may help support ${them ? 'their' : 'your'} liver`
      : `For ${main ? (main.forLabel || main.label) : 'this'}, our TranzLife ${fresh_.length > 1 ? 'products' : 'product'} may help ${them ? 'them' : 'you'}`;
    if (fresh_.length === 1) lead.push(`${intro}: ${line(fresh_[0])}`);
    else if (fresh_.length > 1) lead.push(`${intro}:\n${fresh_.map(p => `- ${line(p)}`).join('\n')}`);
    // topic-specific honesty notes, e.g. Liver Booster for drinking: "it cannot undo the effects of heavy drinking"
    const notes = [...new Set(fresh_.flatMap(p => [p.note, ...concerns.map(c => c.productNotes?.[p.id])]).filter(Boolean))];
    if (notes.length) lead.push(notes.join(' '));
    if (again.length) lead.push(`As I mentioned, our ${again.map(p => `**${p.name}**`).join(' and our ')} may help here too.`);
  }
  // a diagnosed condition (diabetes, fatty liver) alongside an everyday problem: the doctor's treatment comes first
  if (helps && support.length && products.length) suffix.push(`For ${support.map(s => s.label).join(' and ')}, please keep following your doctor's advice and check with them before trying any new product.`);
  // a fixed line some topics always end with (for example the quit-smoking helpline)
  // (not when the drinking warning already leads the reply: it says the same thing)
  if (helps) concerns.filter(c => c.footer && !(c.id === 'alcohol' && flags.length)).forEach(c => suffix.unshift(c.footer));

  // product facts (ingredients, price, size, how to use) come straight from the catalogue, never from the model
  const productInfo = mode === 'product';
  // a named product that does not suit this person (age, gender, a condition it is never for): said first, in the reply
  const personNote = [...new Set([...named, ...targetSuitability, ...targetExplain, ...(mode === 'safety' ? safetyTarget : [])])].map(id => [CATALOG.find(p => p.id === id), notFor(CATALOG.find(p => p.id === id), person, recent)]).filter(([, r]) => r).map(([p, r]) =>
    r === 'age' ? `The ${p.name} is made for ages ${p.minAge}${p.maxAge ? ` to ${p.maxAge}` : ' and above'}, so ${person.group === 'child' || person.group === 'baby' ? `for a ${person.group === 'baby' ? 'baby' : 'child'}, please ask the ${person.group === 'baby' ? "baby's" : "child's"} doctor` : 'please ask the doctor'} before using it.`
    : r === 'gender' ? `The ${p.name} is made for women, for comfort during periods.`
    : `With ${subject === 'other' ? 'their' : 'your'} condition, please keep following the doctor's treatment; the ${p.name} is not a substitute for it.`);
  // someone else whose age we don't know ("can my mom use this?") and a product with an age limit: say the limit, so
  // the answer is never a plain yes (Liver Booster is for 14 to 50)
  const rel = (last.match(/\bmy\s+(mom|mum|mother|amma|dad|father|appa|grand\w+|wife|husband|sister|brother|friend|aunt\w*|uncle|son|daughter|parents?|in[-\s]*laws?)\b/i) || [])[1];
  if (subject === 'other' && person.age == null && !['baby', 'child'].includes(person.group))
    [...new Set([...named, ...targetSuitability, ...targetExplain])].map(id => CATALOG.find(p => p.id === id)).filter(p => p && !notFor(p, person, recent)).forEach(p => {
      const who = rel ? `your ${rel.toLowerCase()} is` : 'they are';
      if (p.maxAge) personNote.push(`The ${p.name} is made for ages ${p.minAge} to ${p.maxAge}, so if ${who} over ${p.maxAge}, please ask the doctor before using it.`);
      else if (p.minAge && /son|daughter|brother|sister|friend/i.test(rel || '')) personNote.push(`The ${p.name} is made for ages ${p.minAge} and above.`);
    });
  const named_allowed = mentionable.flatMap(id => PRODUCT_WORDS[id] || []);
  // honesty notes per product for this topic (e.g. Liver Booster for drinking), used by the recommend reply
  // the drinking warning was given in the bot's last reply: the next answers open with a one-line reminder, not the whole paragraph
  const lastBot = [...history].reverse().find(m => m.role === 'assistant')?.content || '';
  const warnedJustNow = flags.length > 0 && flags.every(f => f.id === 'alcohol-dependence') && /14446/.test(lastBot);
  // (the same sentence can come from the product and the topic: say it once)
  const productNotes = Object.fromEntries(products.map(id => [id, [...new Set([CATALOG.find(p => p.id === id).note, ...concerns.map(c => c.productNotes?.[id])].filter(Boolean))]]));
  // earlier turns go to the model only for a genuine follow-up about the same person; a new topic or a new subject
  // gets a clean context, so the model cannot copy an earlier reply about a friend
  const keepHistory = carried && prevSubject === subject;
  // which kind of small talk, for the fixed small-talk replies
  const smallTalkKind = mode !== 'smalltalk' ? null
    : done || /\b(bye|take\s*care|see\s*(you|ya)|good\s*night)\b/i.test(last) ? 'bye'
    : /\b(thanks?|thank\s*(you|u)|thank|thanku|thanx|thnx|tnx|thx|tq|ty|nandri)\b/i.test(last) ? 'thanks'
    : /how\s*(are|r)\s*(you|u)|how\s*is\s*it\s*going|epdi|nalla\s*iruk/i.test(last) ? 'howareyou'
    // a real greeting starts with a greeting word; anything else short ("yeah sure", "ok cool") is agreeing with the last reply
    : /^\s*(hi+|hello+|helo+|hey+|hai|yo|sup|wassup|whats\s*up|hola|vanakkam|good\s*(morning|afternoon|evening))\b/i.test(last) || (!lastBot && !SMALL_TALK.test(last)) ? 'greeting'
    : 'ok';
  // "yeah sure" right after a product was suggested: point to the card, don't start over
  const afterProduct = smallTalkKind === 'ok' && CATALOG.some(p => lastBot.includes(p.name));
  // products came up anywhere in this chat (the closing message then points to the Enquire cards)
  const talkedProducts = history.some(m => m.role === 'assistant' && CATALOG.some(p => m.content.includes(p.name)));
  // which clarifying question: never the same one twice in a row ("None of the above" used to get the same question again)
  const prevTopic = mode !== 'clarify' ? null : users.slice(-4, -1).reverse().map(u => concernsIn(u)[0]).find(Boolean) || null;
  const clarifyKind = mode !== 'clarify' ? null
    : NONE_OF_THESE.test(last) ? 'other'
    : STUCK_REPLY.test(lastBot) ? 'stuck'
    : CLARIFY_REPLY.test(lastBot) ? 'again'
    : recommendQ && askedFor ? 'noproduct'
    : recommendQ ? 'choose'
    : prevTopic ? 'topic'
    : GIBBERISH(last) ? 'unreadable'
    : 'unclear';
  // "any product for that?" about a topic we have no product for: say so honestly, with the approved tips if not given yet
  const noProduct = mode === 'recommend' && !products.length && !heldBack.length;
  const justDiscussed = users.slice(-3, -1).some(u => concernsIn(u).some(c => concerns.some(x => x.id === c.id)));
  const recommendTips = noProduct && !carried && !justDiscussed ? tips.slice(0, 3) : [];
  // product questions are written by the model from these products' facts (code adds the safety lines)
  const factProducts = mode === 'explain' ? targetExplain : mode === 'suitability' ? targetSuitability : mode === 'product' ? named : [];
  const modelWrite = ['product', 'explain', 'suitability'].includes(mode) && !flags.length && factProducts.length > 0 && factProducts.length <= 2;
  // the last topic, for "say it shortly" when no product was talked about
  const lastTopic = [...users.slice(0, -1)].reverse().map(u => concernsIn(u)[0]).find(Boolean)?.id || null;
  // what the bot already said (so follow-up answers do not repeat it) and whether drinking came up at all
  const botTurns = history.filter(m => m.role === 'assistant').map(m => m.content);
  const lastBotText = botTurns[botTurns.length - 1] || '', recentBot = botTurns.slice(-2).join('\n');
  const alcoholContext = !notDrinking && users.slice(-4).some(u => CONCERNS.find(c => c.id === 'alcohol').match.test(u));
  // a known age that fits every product asked about: say so first ("At 45, age is not a problem for the Liver Booster.")
  const ageFits = person.age && factProducts.length && factProducts.every(id => { const p = CATALOG.find(x => x.id === id); return !notFor(p, person, recent) && (!p.minAge || person.age >= p.minAge) && (!p.maxAge || person.age <= p.maxAge); })
    ? `At ${person.age}, age is not a problem for the ${factProducts.map(nameOf).join(' or the ')}.` : null;
  return { lang:language(last), mode, modelWrite, lastTopic, notDrinking, lastBotText, recentBot, alcoholContext, ageFits, cureCondition:condition || (concerns.find(c => c.kind === 'condition')?.label) || null, factProducts, faq, person, personNote, goodQ:GOOD_Q.test(last), chooseFrom, choice:mode === 'choose' && choice ? (products.includes(choice) ? choice : products[0] || null) : null, situation:situation?.id || null, askNext, smallTalkKind, afterProduct, talkedProducts, noProduct, recommendTips, askedFor, askedWhoBefore:mode === 'askwho' && /Periods usually affect women|Men don.t have periods/.test(lastBot), clarifyKind, prevTopic:prevTopic?.id || null, recommendQ, viaSemantic, subject, carried, keepHistory, productNotes, support:support.map(s => s.label), productInfo, smallTalk, named, condition, concerns:concerns.map(c => c.id), fresh, serious, tips:mode === 'tips' ? tips : [], doctor, products, heldBack, mentionable,
    flags, about, stopMeds, childQ, prefix, lead, suffix, explainProducts:targetExplain, suitabilityProducts:targetSuitability, safetyProducts:mode === 'safety' ? safetyTarget : [], warnedJustNow, allowed:new Set([...(mode === 'tips' ? allowed : []), ...named_allowed]), shop:mode === 'shop' };
}

// The note the model sees right before the visitor's latest message.
function routingNote(a){
  const L = ['ROUTING NOTE (from the website, not from the visitor; follow it exactly and never mention it):'];
  // English only: the reply checker can verify English, and small models write unreliable Tamil
  if (a.lang === 'tanglish') L.push('- The visitor wrote in Tanglish. Reply in simple, friendly English. You may open with one short casual word like "Aiyo" or "Seri", but write everything else, especially tips and doctor advice, in plain English.');
  else if (a.lang === 'tamil') L.push('- The visitor wrote in Tamil. Reply in simple, clear English. Do not write Tamil script.');
  else L.push('- Reply in English.');
  if (a.about.other) L.push('- They are asking about someone else (a friend or family member). Give the tips for that person ("your friend could…", "your father could…"), not for the visitor, and be kind to both.');
  else L.push('- This latest message is about the visitor themselves: talk to them directly as "you". Even if earlier messages were about a friend or family member, do not mention those people now.');
  if (a.prefix.length) L.push(`- The website will put this before your reply, so do not repeat it and do not mention those remedies: "${a.prefix.join(' ')}"`);

  if (a.mode === 'flag'){
    L.push(`- WARNING SIGN: ${a.flags.map(f => f.why).join('; ')}. Kindly but clearly tell them to see a doctor soon, using this: "${a.flags.map(f => f.say).join(' ')}"`);
    L.push('- Do NOT give any home remedy or self-care tip, and do NOT mention any product.');
  } else if (a.mode === 'smalltalk'){
    L.push('- This is small talk (a greeting, thanks or OK). Reply in one or two short, kind sentences. No tips and no products. If it is a greeting, ask how they are feeling.');
  } else if (a.mode === 'shop'){
    L.push('- They are asking about our products, prices or orders. Answer only from the product list in your instructions (names, sizes and prices exactly as listed). For orders, delivery, offers or anything not in the list, point them to the Shop and Contact sections of this page. No health claims and no health tips.');
  } else if (a.modelWrite){
    // a question about one or more products, answered by the model from those products' facts (client, 14 Nov 2026:
    // answers should talk to the question, not paste the label). Safety lines are added by code before and after.
    L.push(`- The visitor is asking about ${a.factProducts.map(nameOf).join(' and ')}. This is a product question: answer EXACTLY what they asked, like a friendly TranzLife shop assistant who knows the product well. PRODUCT FACTS (the only facts you may use):`);
    a.factProducts.map(id => CATALOG.find(p => p.id === id)).forEach(p => L.push(`    • ${p.name} (${[p.form, p.size, p.price ? `₹${p.price}` : p.priceSoon ? 'price coming soon' : null].filter(Boolean).join(', ')}). What it is: ${p.about} How it works: ${p.mechanism || p.pitch} Who it is for: ${p.suitability || ''} How to use: ${p.useShort || p.use}.`));
    if (a.lastBotText) L.push(`- Your previous reply already said: "${a.lastBotText.replace(/\s+/g, ' ').slice(0, 450)}". Do NOT repeat any of that: answer only the new question, in fresh words.`);
    if (a.mode === 'suitability') L.push('- They are asking WHO can use it: answer only that (men and/or women, and who it suits). Do not describe the ingredients or how to use it.');
    if (a.personNote?.length) L.push('- Do not mention age limits or ages: the website adds that line itself.');
    L.push('- 2 to 4 short sentences (1 to 2 for a simple follow-up), plain words. Do not paste the facts as a list, do not greet, and do not repeat the same sentence twice.');
    L.push('- If they ask what it is for or what the use is, say its purpose in plain words and who it suits. If they ask how to use it, give the directions. Mention the price only if they ask about price.');
    if (a.goodQ) L.push('- They ask if it is good or worth it: be honest. It can be a helpful part of a daily wellness routine, but it is a wellness product, not a medicine, and results differ from person to person.');
    L.push('- Never say it treats, cures, controls or prevents anything, and never compare it with medicine. Do not mention any other product. Do not mention doctors or cautions: the website adds those lines itself.');
  } else if (a.mode === 'product'){
    L.push(`- They are asking about ${a.named.map(nameOf).join(' and ')}. This is a product question, not a health problem: do not react as if they are unwell ("that sounds tough"), just answer it helpfully. Answer only from the product list in your instructions. Do not add ingredients, uses, doses or claims that are not in the list. If they ask how to use it, say to follow the directions on the pack. No health tips.`);
  } else if (a.mode === 'choose'){
    const facts = a.chooseFrom.map(id => CATALOG.find(p => p.id === id)).map(p => `    • ${p.name} (${[p.form, p.size, p.price ? `₹${p.price}` : p.priceSoon ? 'price coming soon' : null].filter(Boolean).join(', ')}): ${p.highlight || p.pitch}. Who it is for: ${p.suitability || p.pitch}${p.note ? ` Note: ${p.note}` : ''}`);
    const sit = a.situation ? CONCERNS.find(c => c.id === a.situation) : null;
    L.push(`- The visitor is choosing between these TranzLife products and wants a clear answer for their own situation${sit ? ` (${sit.forLabel || sit.label})` : ''}. PRODUCT FACTS (the only facts you may use):`);
    facts.forEach(f => L.push(f));
    if (!a.choice) L.push('- Their situation is not clear yet: in one or two sentences say what each product is for, then ask what they mainly want support with, so you can suggest one.');
    if (a.choice) L.push(`- Best fit for their situation: ${CATALOG.find(p => p.id === a.choice).name}. Say this clearly in your FIRST sentence, then explain why in plain words using only the facts above.`);
    L.push('- Then, in one sentence, say when the other product could also help, so they understand the difference. Answer their actual question; do not repeat a list of both products, do not use bullet points, and do not greet them.');
    L.push('- 3 to 5 short sentences. Do not add health claims, doses, prices or products that are not in the facts above.');
  } else if (a.mode === 'tips'){
    L.push(`- Topic: ${a.concerns.map(id => CONCERNS.find(c => c.id === id).label).join(' and ')}. APPROVED TIPS (use 2 or 3 of these and nothing else; reword warmly but keep the meaning exactly):`);
    a.tips.forEach(t => L.push(`    • ${t.text}`));
    if (a.doctor.length) L.push(`- Then say when to see a doctor, in one short sentence, based on: "${a.doctor.join(' ')}"`);
    else L.push('- This sounds like an everyday problem. Do NOT tell them to see a doctor or pharmacist; just help, kindly and confidently. You may end with one short, warm line such as "Hope this helps." Do not ask how they feel after trying the tips.');
    L.push('- Do not add any other remedy, food, drink, herb, spice, oil, medicine, supplement, dose or exercise that is not in the approved tips.');
  }

  if (a.mode === 'choose' || a.modelWrite) L.push('- You may name only the products listed in the PRODUCT FACTS above.');
  else if (a.lead?.length) L.push('- The website shows a TranzLife product suggestion right BEFORE your reply. So do not greet, do not open with sympathy, and do not mention any product. Start with a short linking line such as "Along with that, a few simple habits can help:" and then give the tips.');
  else if (a.products.length) L.push('- Do not mention any product: the website adds a short product suggestion and a product card with your reply.');
  else if (a.mode === 'shop') L.push('- Do not recommend a product for a health problem here; just answer the question.');
  else if (a.named.length && a.mode !== 'flag') L.push(`- Because of their health situation, do not recommend ${a.named.map(nameOf).join(' or ')} right now; kindly say to check with their doctor first.`);
  else L.push('- Do not mention or recommend any TranzLife product in this reply.');

  if (a.stopMeds) L.push('- They are asking about stopping or replacing prescribed medicine. Clearly and kindly say not to stop or change any medicine without talking to their doctor first.');
  if (a.suffix.length) L.push(`- The website will add this after your reply, so do not repeat it or say anything like it: "${a.suffix.join(' ')}"`);
  return L.join('\n');
}

export { analyse, routingNote, language };
