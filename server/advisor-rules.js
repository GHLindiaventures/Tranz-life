// Deterministic rules that run before the model. Code decides: what kind of message this is, which approved tips
// may be used, which product (if any) may be shown, which warning signs mean "doctor first", and any fixed sentences.
// The model only rewrites the result warmly. Keywords cover English plus common Tamil / Tanglish spellings.
import { CONCERNS } from './wellness-tips.js';
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
const isFollowUp = text => (FOLLOW_UP_START.test(text) && text.trim().split(/\s+/).length <= 8) || (RECOMMEND.test(text) && text.trim().split(/\s+/).length <= 14);

// Questions about how a product works, mechanisms, or benefits
const EXPLAIN_Q = /\bhow\s*(does|do|will|can|is)?\s*(it|this|these|that|the\s+products?|the\s+inhaler|the\s+gumm\w*|the\s+roll[- ]?on|the\s+tonic)\s*(work|help|reduce|ease|soothe|calm|support|act|function)\b|\bhow\s+(it|this|that|these)\s+(works?|helps?)\b|\bhow\s+(these|this|the|your)\s+products?\s+(work|help|helps)\b|\bhow\s+(does|do|this|these)\s+(\w+\s+){1,3}(reduce|ease|soothe|calm|work)\b|\b(epdi|eppadi)\s*(work|help|aagum|pannum)\b|\bwhat\s*(is|are)\s*(the\s*)?(health\s*)?(benefits?|uses?|advantages?)\b|\b(health\s*)?(benefits?|uses?)\s*of\b/i;

// Questions about who can use a product or suitability ("can a normal person intake gummies", "inhaler use panlam ah venam ah", "who can use this product?", "can my friend use...")
const SUITABILITY_Q = /\bwho\s*can\s*(use|take|buy|try|have|consume|drink)\b|\b(can|should|could)\s+(i|we|he|she|they|my\s*\w+|en\s*\w+|appa|amma|friend)\s+(use|take|buy|try|drink|consume|have|sapda|eduka)\b|\b(can|should|could|is\s*it\s*(ok|okay|safe|good|fine|advisable)|who\s*can|does|do)\b.{0,35}\b(normal|healthy|non[- ]?smok\w*|anyone|anybody|every\w+|regular|person|peson|people|adults?)\b|\b(normal|healthy|non[- ]?smok\w*|regular)\s*(person|peson|people|adults?)?\b.{0,30}\b(take|intake|eat|use|have|consume|can|pannalama)\b|\b(use\s*pan+alama|pan+alam\s*ah|venama|venam\s*ah|eduk+alama|kudik+alama|sap+dalama|eduthuk+alama)\b|\b(should\s*i\s*(use|take|buy|try)|can\s*i\s*(use|take|buy|try))\b|\b(can|should|could)\s+(an?\s+)?(pregnant|breastfeeding|diabetic|elderly|old|kids?|child(ren)?|bab(y|ies)|teen\w*|women|woman|ladies|lady|mothers?|patients?)\s+(\w+\s+){0,2}(use|take|try|have|consume)\b/i;

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
const RECOMMEND = /\b(which|what|any|best|good)\s+(\w+\s+){0,2}(products?|one|thing)\b|which\s*(one|product)|what\s*(should|can|do)\s*i\s*(use|take|buy|try|need)|\b(recommend|suggest)\w*|(anything|something)\s*(for|to\s*help\s*with)\s*(this|that|it|me)|\b(enna|endha|edhu|ethu)\s*(product|nalla)|product\s*(sollunga|suggest|venum)|use\s*pannalam|\bbest\s+product/i;
// explicit catalogue, price or delivery questions (the shop list is only for these)
const SHOP_EXPLICIT = /\b(what|which)\s+products?\s+(do\s+|does\s+)?(you|u|tranzlife)\s+(sell|have|having|make|offer)\b(?!.{0,15}\bfor\b)|\bwhat\s+are\s+(all\s+)?(the|your)\s+products(\s*(you\s+|u\s+)?(have|having|sell|make|offer))?\b(?!.{0,15}\bfor\b)|\ball\s+(your\s+)?products\b|\bproducts?\s*(list|range|catalog)\b|\b(price|cost|rate|evlo|evvalavu|how\s*much)\b|\b(delivery|deliver|shipping|order|buy|purchase|cod|cash\s*on|discount|offer|coupon|stock)\b|\b(do\s+you\s+know|tell\s+me)\s+(about\s+)?(all\s+)?(the\s+|your\s+|our\s+)?products?\b|\b(products?|product)\s*(pathi|paththi)\s*(theriyuma|theriyum\s*ah|sollu|sollunga)\b|\b(namma|unga|ungala)\s*(kitta|kita)?\s*(enna|iruka|irukka)?\s*products?\b/i;
// the visitor says it is severe, long-lasting, repeated or getting worse: only then do tips end with when to see a doctor
const SERIOUS = /sever|really\s*bad|very\s*bad|so\s*bad|worst|unbearable|getting\s*worse|worse\s*(and\s*worse|every|now)|won'?t\s*(go|stop|settle)|not\s*(going\s*away|getting\s*better|improving|stopping)|for\s*(weeks|months|a\s*long\s*time|ages|years)|\b\d+\s*(weeks?|months?|years?)\b|since\s*(last\s*)?(weeks?|months?|year)|every\s*(day|night|week)|daily|always|all\s*the\s*time|keeps?\s*(coming|happening|getting)|again\s*and\s*again|frequent|often|romba\s*naala|rombo\s*naala|neraya\s*naal|ரொம்ப\s*நாள/i;
const SHOP = /\b(what|which)\s+(\w+\s+){0,2}(products?|items?)|\b(products?|items?)\s*(list|range|enna|ennenna)|\b(price|cost|rate|evlo|evvalavu|how\s*much)\b|\b(delivery|deliver|shipping|order|buy|purchase|cod|cash\s*on|discount|offer|coupon|stock)\b/i;
const PRODUCT_Q = /what('?s|\s*is|\s*are)?\s*(in|inside)\b|ingredients?|contain|made\s*(of|with|from)|how\s*(to|do\s*i|should\s*i|can\s*i)\s*(use|apply|take)|price|cost|how\s*much|evlo|evvalavu|\bsize\b|details?|tell\s*me\s*about|what\s*(is|'s)\s*(the\s*)?(\w+\s*){0,4}(for|used\s*for)|enna\s*irukku/i;
const SAFETY_Q = /\b(safe|safety|side[- ]?effects?|harmful|allerg\w*|reaction|interact\w*)\b|(with|along\s*with|together\s*with)\s*my\s*(medicine|tablets?|insulin|maathirai)/i;
const IDENTITY = /\bare\s*(you|u)\s*(a|an)?\s*(real\s*)?(doctor|nurse|human|bot|robot|ai|machine|person|chatbot)\b|who\s*(are|r)\s*(you|u)\b|what\s*are\s*you\b|nee\s*yaaru|neenga\s*yaaru|yaaru\s*neenga/i;
const CURE_Q = /\b(cure|cures|curing|permanent(ly)?\s*(cure|relief|solution)|get\s*rid\s*of|treat(ment)?\s*for|heal)\b/i;
const CONDITION = /\b(an(a)?emia|thyroid|diabetes|bp|blood\s*pressure|cholesterol|pcos|pcod|kidney\s*stones?|arthritis|asthma|cancer|tumou?r|infection|ulcer|piles|h(a)?emorrhoids?|fibroids?|migraine|psoriasis|eczema|hepatitis|fatty\s*liver|gastritis|uti|covid|dengue|typhoid|tuberculosis|heart\s*disease|epilepsy|vertigo|sinus(itis)?|gout|kidney\s*disease)\b/i;
// Diagnosed conditions where a product is made as wellness support (never a treatment). Tulsi mentions it only
// alongside the doctor's treatment, with "check with your doctor first". Breathing diseases (asthma, COPD) are
// deliberately not here: no product may be suggested for them.
const SUPPORT = [
  { label:'diabetes', product:'reviva', re:/diabet|\b(have|has|got)\s*sugar\b|sugar\s*(patient|patients|problem|level|control|care|maintain|management|manage|tablet|tablets|medicine|iruk|irruk|irukku|undu|disease|erang|kurai)|\b(blood\s*sugar|high\s*sugar|diabetic)\b|\bsugar\b.{0,20}(iruku|irukku|irukkudhu|irukudhu|control|manage|maintain|kuraika|product|roll\s*on|help)|neerizhivu|நீரிழிவு/i },
  { label:'fatty liver', product:'liver-booster', re:/fatty\s*liver(?!\s*risk)|fat\s*in\s*(my\s*|the\s*)?liver/i }
];
const DIAGNOSE_Q = /what\s*(disease|illness|condition|problem|sickness)\s*(do\s*|does\s*)?(i|she|he|they|my\s*\w+)\s*(have|has|got)|diagnos|what('?s|\s*is)\s*wrong\s*with\s*(me|her|him)|what\s*is\s*(causing|the\s*cause)|enna\s*(noi|vyadhi|vyaadhi)/i;
const DOSE_Q = /\b(dose|dosage|how\s*much\s*(should|to|can)\s*(i\s*|we\s*)?(take|eat|drink|give)|how\s*many\s*(times|tablets|spoons|capsules|drops))\b/i;

const SMALL_TALK = /^\s*(hi+|hello+|helo+|hey+|hai|yo|sup|wassup|whats\s*up|hola|vanakkam|good\s*(morning|afternoon|evening|night)|thanks?|thank\s*(you|u)|thx|tq|ty|ok+|okay|k|kk|hmm+|sari|seri|nandri|super|nice|great|awesome|bye|take\s*care|see\s*(you|ya)|cool|fine|got\s*it|purinjuthu|purinjudhu|how\s*(are|r)\s*(you|u)(\s*doing)?(\s*today)?|how\s*is\s*it\s*going|epdi\s*(irukeenga|irukinga|iruka|irukka)|nalla\s*(irukeengala|irukingala|irukiya)|nice\s*talking\s*to\s*you)\b[\s!.,?🙏😊❤️💚👍]*((bro|da|ma|tulsi|dude|man|buddy|anna|akka|machi|machan|there|friend|so\s*much|a\s*lot|again|take\s*care|cool|super|nice|great|fine|thanks?|thank\s*(you|u)|got\s*it)[\s!.,?🙏😊❤️💚👍]*){0,3}$/iu;
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
  const about = Object.fromEntries(Object.entries(ABOUT).map(([k, re]) => [k, re.test(recent)]));
  const now = Object.fromEntries(Object.entries(ABOUT).map(([k, re]) => [k, re.test(last)]));
  about.other = now.other = subject === 'other';
  const prevSubject = subjects[subjects.length - 2];

  const nowFlags = RED_FLAGS.filter(f => f.re.test(last) && (!f.with || now[f.with]));
  // warning signs stay on for the next few messages about that person, so a follow-up cannot get home tips for a red-flag problem
  let flags = RED_FLAGS.filter(f => f.re.test(recent) && (!f.with || about[f.with]));
  if (flags.some(f => f.id.startsWith('diabetic'))) flags = flags.filter(f => f.id !== 'foot-wound');
  if (flags.some(f => f.id === 'diabetic-foot')) flags = flags.filter(f => f.id !== 'diabetic-wound');
  // the semantic layer may ADD a warning (never remove one)
  if (semantic?.emergency) flags.push({ id:'possible-emergency', why:'something that may need urgent medical help',
    say:'This may need urgent medical help. If it is sudden or severe, please call 112 or go to the nearest hospital now; otherwise please see a doctor today.' });

  const named = namedIn(last);
  // small talk: the greeting rule, or the understanding layer for short messages with no health topic ("hi dude")
  const smallTalk = SMALL_TALK.test(last) || (semantic?.intent === 'smalltalk' && !named.length && !concernsIn(last).length && last.trim().split(/\s+/).length <= 8);
  const found = (last.match(CONDITION) || [])[0] || '';
  const condition = /^bp$/i.test(found) ? 'blood pressure' : /^uti$/i.test(found) ? 'urine infection' : /^(pcos|pcod)$/i.test(found) ? found.toUpperCase() : found.toLowerCase();
  const support = SUPPORT.filter(s => s.re.test(last));
  const cureQ = CURE_Q.test(last), diagnoseQ = DIAGNOSE_Q.test(last), doseQ = DOSE_Q.test(last), stopMeds = STOP_MEDS.test(last);

  // the topic comes from the latest message. Only a short follow-up ("what else?") keeps the previous topic:
  // a new message about something else ("eye pain") must never get the old topic's tips.
  // (product names are removed first, so "Liver Booster" is a product question, not the liver-care topic)
  const topicText = CATALOG.reduce((t, p) => t.replace(new RegExp(p.match.source, 'gi'), ' '), last);
  let concerns = smallTalk ? [] : concernsIn(topicText).slice(0, 2), fresh = concerns.length > 0, carried = false, viaSemantic = false;
  // no regex topic: use the semantic layer's topic (typos, Tamil, paraphrases), or the topic of a product it matched by use
  if (!concerns.length && !smallTalk && !named.length && semantic){
    const ids = semantic.concerns?.length ? semantic.concerns
      : semantic.intent === 'recommend' ? (semantic.products || []).map(id => CONCERNS.find(c => c.products.includes(id))?.id).filter(Boolean) : [];
    concerns = [...new Set(ids)].map(id => CONCERNS.find(c => c.id === id)).filter(Boolean).slice(0, 2);
    fresh = viaSemantic = concerns.length > 0;
  }
  // a follow-up ("what else?", "which product should I use?", "enna product?") continues the previous topic, products included
  const recommendQ = RECOMMEND.test(last) || semantic?.intent === 'recommend';
  if (!concerns.length && !named.length && (isFollowUp(last) || (semantic?.intent === 'recommend' && last.trim().split(/\s+/).length <= 14))){
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
      carried = concerns.length > 0;
      if (carried) break;
    }
  }

  const prevProds = previousProducts(history);
  const explainQ = EXPLAIN_Q.test(last);
  const suitabilityQ = SUITABILITY_Q.test(last);

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

  // what kind of message is this? (first match wins)
  // A warning sign in this message, or in the last few messages about the same person, always comes first: the doctor
  // message, no tips, no product, no "how it works" or "who can use it" pitch ("diabetic toe sore" -> "can I use Reviva
  // on it?" must still get the doctor message). Only small talk, "who are you / what can you do" and pure price or
  // delivery questions with no product named are answered normally. One exception: when the only warning is the
  // drinking-habit one (not an urgent symptom), a product question ("any product for my friend?", "can he use the
  // liver booster?", "is this safe?") gets an honest answer that LEADS with that warning (doctor + 14446).
  const habitOnly = flags.length && flags.every(f => f.id === 'alcohol-dependence');
  const flagOff = smallTalk || IDENTITY.test(last) || ABOUT_Q.test(last) || (SHOP_EXPLICIT.test(last) && !named.length && !explainQ && !suitabilityQ)
    || (habitOnly && !nowFlags.length && ((named.length && (explainQ || suitabilityQ)) || (recommendQ && concerns.length) || safetyTarget.length));
  let mode;
  if (nowFlags.length || flags.some(f => f.id === 'possible-emergency') || (flags.length && !flagOff)) mode = 'flag';
  else if (IDENTITY.test(last)) mode = 'identity';
  else if (ABOUT_Q.test(last) && !fresh && !named.length) mode = 'about';
  else if (smallTalk) mode = 'smalltalk';
  else if (safetyQ && (safetyTarget.length || /\b(your|these|this|tranzlife)\s*(products?|gumm|inhaler|roll|liquid)/i.test(last))) mode = 'safety';
  else if (stopMeds && !fresh && !named.length) mode = 'medical';
  // a diagnosed condition with a support product ("I have diabetes"), not a cure or stop-medicine question
  else if (support.length && !cureQ && !stopMeds && !fresh && !named.length) mode = 'support';
  // (a cure question, or a condition with no product named: "Reviva for diabetes?" is a product question)
  else if ((condition || cureQ) && !fresh && (cureQ || !named.length)) mode = 'medical';
  else if (suitabilityQ && targetSuitability.length) mode = 'suitability';
  else if (explainQ && targetExplain.length) mode = 'explain';
  else if (named.length && (PRODUCT_Q.test(last) || !fresh)) mode = 'product';
  else if (COMING_SOON_MATCH.test(last) && !fresh) mode = 'soon';
  else if (SHOP_EXPLICIT.test(last) || semantic?.intent === 'shop') mode = 'shop';
  // "which product should I use?" with a health topic (in this message or just before) recommends that topic's products
  else if (recommendQ && concerns.length) mode = 'recommend';
  else if (concerns.length) mode = 'tips';
  else if (named.length) mode = 'product';
  // no topic we can help with (or "which product?" with no topic yet): ask a short clarifying question with quick replies
  else mode = 'clarify';
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
    ? [...new Set([...(fresh || carried ? byTopic : []), ...named, ...(mode === 'explain' ? targetExplain : []), ...(mode === 'suitability' ? targetSuitability : []), ...(cureQ || stopMeds ? [] : support.map(s => s.product))])].slice(0, 4) : [];
  let products = wanted;
  // "can kids use it?" counts as a child being involved
  const childQ = /\b(kids?|children|child|baby|babies|toddlers?|infants?|kuzhandh\w*|kozhandh\w*|pasanga|pillainga)\b/i.test(last);
  if (stopMeds || careful || childQ || diagnoseQ || (cureQ && condition)) products = [];
  if (about.diabetes || about.chronic || about.onMeds) products = products.filter(id => !INGESTED.has(id));
  const heldBack = wanted.filter(id => !products.includes(id));
  // product names the reply may say
  // products the catalogue's own "how it works / who can use it" text points to ("if you do not smoke, the BreatheFree Inhaler is a better fit")
  const pointedTo = [...targetExplain, ...targetSuitability].map(id => CATALOG.find(p => p.id === id)).filter(Boolean)
    .flatMap(p => Object.keys(PRODUCT_NAMES).filter(id => PRODUCT_NAMES[id].test(`${p.mechanism || ''} ${p.suitability || ''}`)));
  const mentionable = mode === 'flag' ? [] : mode === 'shop' ? CATALOG.map(p => p.id) : [...new Set([...products, ...named, ...targetExplain, ...targetSuitability, ...pointedTo, ...(mode === 'safety' ? safetyTarget : [])])];

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
  const suffix = [], helps = mode === 'tips' || mode === 'recommend';
  if (helps && (now.pregnant || now.breastfeeding)) suffix.push('Since you\'re pregnant or breastfeeding, please check with your doctor before trying any new product or supplement.');
  else if (helps && now.child) suffix.push('For a child, please check with their doctor before giving anything new.');
  else if (helps && heldBack.length && !support.length && (now.diabetes || now.chronic || now.onMeds)) suffix.push(`Because of ${now.other ? 'their' : 'your'} health condition or regular medicine, please check with the doctor before starting any supplement.`);
  else if (helps && (about.pregnant || about.breastfeeding || about.child || ((about.diabetes || about.chronic || about.onMeds) && heldBack.length)))
    suffix.push('If you are pregnant or breastfeeding, it is for a child, or you have a long-term condition or take regular medicine, please check with your doctor before starting any new product or supplement.');
  // the product suggestion is written by code from the catalogue, never by the model
  const alreadyPitched = history.slice(-4).some(m => m.role === 'assistant' && products.some(id => m.content.includes(CATALOG.find(p => p.id === id)?.name)));
  if (mode === 'tips' && products.length && !alreadyPitched){
    const ps = products.map(id => CATALOG.find(x => x.id === id));
    // topic-specific honesty notes, e.g. Liver Booster for drinking: "it cannot undo the effects of heavy drinking"
    const notes = ps.flatMap(p => [p.note, ...concerns.map(c => c.productNotes?.[p.id])]).filter(Boolean);
    suffix.unshift(`You might also like our ${ps.map(p => `${p.name}, ${p.pitch}`).join('; or our ')}.${[...new Set(notes)].map(n => ` ${n}`).join('')}`);
  }
  // a diagnosed condition (diabetes, fatty liver) alongside an everyday problem: the doctor's treatment comes first
  if (helps && support.length && products.length) suffix.push(`For ${support.map(s => s.label).join(' and ')}, please keep following your doctor's advice and check with them before trying any new product.`);
  // a fixed line some topics always end with (for example the quit-smoking helpline)
  // (not when the drinking warning already leads the reply: it says the same thing)
  if (helps) concerns.filter(c => c.footer && !(c.id === 'alcohol' && flags.length)).forEach(c => suffix.unshift(c.footer));

  // product facts (ingredients, price, size, how to use) come straight from the catalogue, never from the model
  const productInfo = mode === 'product';
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
    : /\b(bye|take\s*care|see\s*(you|ya)|good\s*night)\b/i.test(last) ? 'bye'
    : /\b(thanks?|thank|thx|tq|ty|nandri)\b/i.test(last) ? 'thanks'
    : /how\s*(are|r)\s*(you|u)|how\s*is\s*it\s*going|epdi|nalla\s*iruk/i.test(last) ? 'howareyou'
    : /^\s*(ok+|okay|k|kk|hmm+|cool|super|nice|great|awesome|fine|got\s*it|sari|seri|purinj\w*)\b/i.test(last) ? 'ok'
    : 'greeting';
  return { lang:language(last), mode, smallTalkKind, recommendQ, viaSemantic, subject, carried, keepHistory, productNotes, support:support.map(s => s.label), productInfo, smallTalk, named, condition, concerns:concerns.map(c => c.id), fresh, serious, tips:mode === 'tips' ? tips : [], doctor, products, heldBack, mentionable,
    flags, about, stopMeds, childQ, prefix, suffix, explainProducts:targetExplain, suitabilityProducts:targetSuitability, safetyProducts:mode === 'safety' ? safetyTarget : [], warnedJustNow, allowed:new Set([...(mode === 'tips' ? allowed : []), ...named_allowed]), shop:mode === 'shop' };
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
