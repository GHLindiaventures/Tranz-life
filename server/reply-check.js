// Checks every model reply before a customer sees it. A reply that breaks a rule is rewritten once, and if it
// still breaks a rule it is replaced by fallbackReply(): plain, fixed text built only from the approved tips.
import { CONCERNS } from './wellness-tips.js';
import { PRODUCTS } from '../src/data/products.js';

// Remedy words. A reply may only use the ones the approved tips (or the recommended product's label) allow.
// Keys never allowed by any tip (soak, medicine, supplement, ...) are therefore always rejected.
const REMEDIES = {
  heat:/hot[- ]?water\s*(bag|bottle)|heat(ing)?\s*pad|warm\s*compress|hot\s*compress|hot\s*pack|fomentation|ottha?dam|othadam/i,
  honey:/\bhoney\b|\bthaen\b|\bthen\s*(kalandh|kalanth)/i,
  lemon:/\blemon|\blime\b|elumich|nimbu/i,
  salt:/\bsalt|\buppu\b/i,
  peppermint:/peppermint/i, rose:/\brose\b(?!mary)|rose\s*water/i, rosemary:/rosemary/i,
  ginger:/ginger|\binji\b|\bsukku\b|\bchukku\b/i, tulsi:/(?<!ask\s)\btulsi\s*(tea|leaves|leaf|water|kashayam|drink)|thulasi|holy\s*basil/i,
  turmeric:/turmeric|haldi|manjal\s*(podi|paal|thool|powder|milk)/i, milk:/\bmilk\b|\bpaal\b/i,
  oil:/\b(coconut|castor|mustard|sesame|olive|almond|eucalyptus|gingelly|thengai|nalla)\s*(oils?|ennai)\b|\boils?\b|ennai|\bghee\b|\bnei\b|castor|essential\s*oils?/i, aloe:/aloe|kathalai|katrazhai/i, neem:/\bneem|vembu|veppilai/i,
  herbs:/\b(ashwagandha|triphala|giloy|guduchi|brahmi|shatavari|amla|nellikai|fenugreek|methi|vendhayam|cumin|jeera|jeeragam|ajwain|omam|fennel|sombu|saunf|garlic|poondu|cinnamon|pattai|black\s*pepper|milagu|cloves?|kirambu|cardamom|elakkai|mint|pudina|chamomile|lavender|green\s*tea|herbal\s*teas?|kadha|kashayam|kashaayam|curry\s*leaves|karuveppilai|coriander|kothamalli|seeds?\s*water|jaggery|vellam|herbs?|ayurvedic\s*(medicine|remedy|herb|powder|churna)|churna|lehyam|arishtam)\b/i,
  sweet:/\bjuices?\b|soft\s*drinks?|\bcola\b|\bsweets\b|energy\s*drinks?/i,
  vinegar:/vinegar|baking\s*soda|epsom/i,
  soak:/\bsoak|oora\s*vai|ooravai|ooravechu/i,
  ice:/\bice\b|ice\s*pack|cold\s*compress/i,
  balm:/vicks|vapou?r\s*rub|\bbalm\b|amrutanjan|zandu/i,
  medicine:/paracetamol|ibuprofen|aspirin|crocin|\bdolo\b|combiflam|antacid|digene|\beno\b|pain\s*-?killer|antibiotic|ointment|laxative|decongestant|nasal\s*spray|\bsyrup|antihistamine|steroid/i,
  supplement:/vitamin\s*[a-z0-9]|\bb12\b|\biron\b|\bzinc\b|magnesium|melatonin|omega|calcium|protein\s*powder|multivitamin|probiotic/i,
  detox:/\bfasting\b|detox\s*(diet|drink|juice|water|tea|plan)|cleanse/i,
  pranayama:/kapalbhati|kapalabhati|bhastrika|anulom|pranayam|surya\s*namaskar|\basana/i,
  blade:/pumice|\bblades?\b|scrape|razor/i
};
const SOAK_WARNING = /(do\s*not|don'?t|never|avoid|no)\s+(\w+\s){0,2}soak/i;

const CLAIMS = [
  [/\bcur(e|es|ed|ing)\b/i, 'promises a cure'],
  [/guarantee/i, 'guarantees results'],
  [/no\s*side[- ]?effects?/i, 'claims no side effects'],
  [/(completely|totally|absolutely|perfectly|100\s*%|100\s*percent)\s*(safe|harmless|effective)/i, 'claims complete safety'],
  [/permanent(ly)?\s*(relief|cure|solution|fix)|instant(ly)?\s*(relief|cure|results)|miracle/i, 'promises permanent or instant results'],
  [/(clinically|scientifically|medically)\s*(proven|tested|approved)|doctor[- ]?(approved|recommended)/i, 'claims proof or approval'],
  [/revers(e|es|ed|ing)\s*(diabetes|damage|the\s*disease)|boost(s|ing)?\s*(your\s*|the\s*)?(immunity|immune|energy)/i, 'makes a disease, immunity or energy claim'],
  [/\b(i\s*am|i'?m|as)\s*(a\s*|your\s*)?(doctor|physician|nurse|pharmacist|ayurvedic\s*(doctor|practitioner|physician)|dietitian|real\s*person|human)\b/i, 'pretends to be a professional or a human']
];
const DIAGNOSIS = [
  /(?<!\bif\s)(?<!\bif\s\w+\s)\b(you|she|he|they|your\s+\w+|amma|appa)\s+(probably|likely|might|may|could|must|definitely)?\s*(have|has|be\s+suffering\s+from|is\s+suffering\s+from|are\s+suffering\s+from|got)\s+(a\s+|an\s+)?(\w+\s+){0,2}(infection|disease|disorder|deficiency|anaemia|anemia|thyroid|pcos|pcod|cancer|ulcer|fibroids?|endometriosis|depression|migraine|sinusitis|gerd|ibs|hypertension|fatty\s*liver|jaundice|hepatitis|insomnia|neuropathy|arthritis)/i,
  /(sounds|looks|seems)\s+like\s+(a\s+|an\s+|you\s+have\s+)?(\w+\s+){0,2}(infection|disease|disorder|deficiency|anaemia|anemia|thyroid|pcos|pcod|migraine|sinusitis|gerd|ibs|depression|fatty\s*liver|endometriosis|fibroids?|neuropathy|insomnia)/i,
  /(it|this|that)\s+(could|might|may|must)\s+be\s+(a\s+|an\s+)?(\w+\s+){0,2}(infection|disease|disorder|deficiency|anaemia|anemia|thyroid|pcos|pcod|migraine|sinusitis|gerd|ibs|ulcer|neuropathy)/i
];
const STOP_MED = /\b(stop|quit|skip|reduce|replace|cut\s*down|come\s*off|niruthunga|niruthidunga)\s+(taking\s+|using\s+)?(\w+\s+){0,3}(medicines?|medications?|tablets?|pills?|insulin|treatment|maathirai|marundhu)/gi;
const NEGATION = /(don'?t|do\s*not|never|not|no\s*need\s*to|shouldn'?t|should\s*not|please\s*don'?t|avoid|without\s*(first\s*)?(talking|speaking|checking|asking))[^.!?]{0,40}$/i;
const DOSE = /\b\d+(\.\d+)?\s*(mg|mcg|g|gm|grams?|ml|tsp|tbsp|teaspoons?|tablespoons?|drops?|capsules?|tablets?|pills?|cups?|times\s*a\s*day|times\s*daily)\b/gi;
const TREAT = /\b(will|can|to|it|this|that|they|which|would)\s+(treat|heal)\b/gi;
const DOCTOR = /doctor|hospital|clinic|maruthuv|dactor|டாக்டர்|மருத்துவ/i;
const PRODUCT_NAMES = { gummies:/gumm(y|ies)/i, inhaler:/inhaler/i, rollon:/calm\s*(period\s*)?(relief\s*)?roll|period\s*relief/i, reviva:/reviva/i, liver:/liver\s*booster/i };
const ANY_ROLLON = /roll[- ]?on/i;

function problems(text, a){
  const out = [], words = text.trim().split(/\s+/).length;
  if (!text.trim()) return ['empty reply'];
  if (words > 170) out.push(`too long (${words} words)`);
  if (/\[|\]/.test(text)) out.push('contains brackets or notes');
  if (/[஀-௿]/.test(text)) out.push('written in Tamil script, which cannot be checked');

  // remedies outside the approved tips
  for (const [key, re] of Object.entries(REMEDIES)){
    if (a.allowed.has(key) || !re.test(text)) continue;
    if (key === 'soak' && a.allowed.has('soak-warning') && !text.replace(SOAK_WARNING, '').match(re)) continue;   // "do not soak" is fine
    out.push(`mentions a remedy that is not approved (${key}: "${text.match(re)[0]}")`);
  }
  for (const [re, why] of CLAIMS) if (re.test(text)) out.push(why);
  if (/\b100\s*(%|percent)/i.test(text) && !(a.mentionable.includes('inhaler') && /100\s*(%|percent)\s*natural/i.test(text))) out.push('uses a 100% claim');
  if (DIAGNOSIS.some(re => re.test(text))) out.push('suggests a diagnosis');
  for (const m of text.matchAll(STOP_MED)) if (!NEGATION.test(text.slice(Math.max(0, m.index - 60), m.index)) && !/^\s*without/i.test(text.slice(m.index + m[0].length, m.index + m[0].length + 12)))
    out.push(`may tell them to stop or change medicine ("${m[0]}")`);
  for (const m of text.matchAll(DOSE)) if (!(/^100\s*ml$/i.test(m[0]) && a.mentionable.includes('liver'))) out.push(`gives a dose or amount ("${m[0]}")`);
  // "will heal", "can treat": a claim, unless it is about what a doctor can do
  for (const m of text.matchAll(TREAT)) if (!/doctor|hospital|clinic|helps?\s+\w+\s*$/i.test(text.slice(Math.max(0, m.index - 40), m.index + m[1].length + 1))){ out.push(`claims to treat or heal ("${m[0]}")`); break; }

  // products: only the allowed ones
  for (const [id, re] of Object.entries(PRODUCT_NAMES)) if (re.test(text) && !a.mentionable.includes(id)) out.push(`mentions a product that is not allowed here (${id})`);
  if (ANY_ROLLON.test(text) && !a.mentionable.some(id => id === 'rollon' || id === 'reviva')) out.push('mentions a roll-on that is not allowed here');
  if (!a.mentionable.length && /\bour\s+(product|range|gumm|inhaler|roll|liquid)|tranzlife\s+(product|gumm|inhaler|roll|calm|reviva|liver)/i.test(text)) out.push('mentions TranzLife products when none are allowed');

  // a warning sign or no approved tips means the doctor must be mentioned
  if ((a.flags.length || a.stopMeds) && !DOCTOR.test(text)) out.push('does not tell them to see a doctor');
  return [...new Set(out)];
}

const MEDS_LINE = ' Please don\'t stop or change any medicine your doctor has prescribed without talking to them first.';
const careLine = a => a.about.pregnant || a.about.breastfeeding || a.about.child ? ' Since pregnancy, breastfeeding or a child is involved, please check with the doctor before trying anything new.' : '';
const TOPICS = 'period cramps, stress, sleep, dry feet, tiredness, liver care, headaches, acidity, colds and constipation';

// Product facts, word for word from the catalogue (src/data/products.js).
const productText = a => a.named.map(id => { const p = PRODUCTS.find(x => x.id === id);
  return `${p.name} (${p.size}, ₹${p.price}): ${p.desc} Key points: ${p.ing.join(', ')}.`; }).join('\n\n')
  + `\n\nPlease follow the directions on the pack.${a.stopMeds ? MEDS_LINE : ''}${careLine(a)}`;

// Messages that are answered with fixed text and never go to the model: questions where any creative answer is a risk.
function fixedReply(a){
  const meds = a.stopMeds ? MEDS_LINE : '';
  if (a.mode === 'identity') return 'I\'m Tulsi, TranzLife\'s virtual wellness assistant. I\'m not a doctor. I can share simple, general wellness tips from trusted public health guidance and help you find our products. For anything medical, a doctor is always the right person. 🌿';
  if (a.mode === 'safety'){
    const what = a.named.length ? `the ${a.named.map(id => PRODUCTS.find(p => p.id === id).name).join(' and the ')}` : 'any of our products';
    return `That's a good question to ask. No product can be promised to suit everyone, so for ${what}, please read the label and ingredients first, and stop using it if you notice any irritation or reaction. Please check with your doctor before using it if you're pregnant, breastfeeding, buying it for a child, or have a health condition or take regular medicine.${meds}`;
  }
  if (a.productInfo) return productText(a);
  if (a.mode === 'medical') return `Thank you for asking. TranzLife products are natural wellness products. They aren't meant for medical conditions${a.condition ? ` like ${a.condition}` : ''}, and I can't recommend herbs, remedies or doses for them. A doctor is the right person to guide you on this.${meds || MEDS_LINE}`;
  if (a.mode === 'none') return `Thanks for your message. I can only help with a few everyday wellness topics: ${TOPICS}. For anything else about your health, a doctor or pharmacist is the best person to ask, especially if it's severe, getting worse or not going away.${meds}${careLine(a)}`;
  return '';
}

// Fixed, safe reply used when the model cannot produce one that passes. English, built only from approved text.
function fallbackReply(a){
  const meds = a.stopMeds ? MEDS_LINE : '';
  if (a.mode === 'flag') return `I'm sorry you're dealing with this. ${a.flags.map(f => f.say).join(' ')} Please don't try to manage it at home first. A doctor can check it properly and guide you. 💚`;
  if (a.mode === 'product') return productText(a);
  if (a.mode === 'shop') return 'You can see all our products, with prices and details, in the Shop section of this page. For orders or delivery questions, the team is happy to help through the Contact section.';
  if (a.mode === 'smalltalk') return 'Happy to help anytime. 🌿 Tell me how you\'re feeling, and we\'ll look at it together.';
  if (a.mode !== 'tips') return fixedReply(a);
  const label = a.concerns.map(id => CONCERNS.find(c => c.id === id).label).join(' and ');
  const prods = a.products.map(id => { const p = PRODUCTS.find(x => x.id === id), c = CONCERNS.find(x => x.product === id); return `Many people also find our ${p.name} helpful for ${c.label}.`; }).join(' ');
  return `I'm sorry you're dealing with ${label}. A few gentle things that may help:\n\n${a.tips.slice(0, 4).map(t => `- ${t.text}`).join('\n')}\n\n${a.doctor.join(' ')}${meds}${careLine(a)}${prods ? `\n\n${prods}` : ''}`;
}

export { problems, fixedReply, fallbackReply, REMEDIES, PRODUCT_NAMES };
