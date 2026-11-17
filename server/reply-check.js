// Checks every model reply before a customer sees it. A reply that breaks a rule is rewritten once, and if it
// still breaks a rule it is replaced by fallbackReply(): plain, fixed text built only from the approved tips.
import { CONCERNS } from './wellness-tips.js';
import { CATALOG, COMING_SOON_MATCH, KINDS } from '../src/data/catalog.js';

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
  // cooking and massage oils are never advised; "essential oils" only when a product with them may be mentioned
  oil:/\b(coconut|castor|mustard|sesame|olive|almond|gingelly|thengai|nalla)\s*(oils?|ennai)\b|\bghee\b|\bnei\b|\bennai\b|oil\s*massage|massag\w*\s*(it\s*)?(with\s*)?(some\s*)?oil/i,
  essentialoil:/essential\s*oils?|\boils?\b/i,
  aloe:/aloe|kathalai|katrazhai/i, neem:/\bneem|vembu|veppilai/i,
  // one key per herb, so a product's own label ingredients never let other herbs through
  ...Object.fromEntries([
    ['ashwagandha'], ['triphala'], ['giloy', 'guduchi'], ['brahmi'], ['shatavari'], ['amla', 'nellikai'], ['fenugreek', 'methi', 'vendhayam'],
    ['cumin', 'jeera', 'jeeragam'], ['ajwain', 'omam'], ['fennel', 'sombu', 'saunf'], ['garlic', 'poondu'], ['cinnamon', 'pattai'],
    ['black\\s*pepper', 'milagu'], ['cloves?', 'kirambu'], ['cardamom', 'elakkai'], ['mint', 'pudina'], ['chamomile'], ['lavender'], ['eucalyptus'],
    ['vasaka'], ['mulethi', 'licorice', 'liquorice'], ['kalmegh'], ['kutki'], ['punarnava'], ['bhringraj'], ['bhumyamalaki'], ['l-?theanine'], ['dill'],
    ['green\\s*tea', 'herbal\\s*teas?'], ['kadha', 'kashayam', 'kashaayam'], ['curry\\s*leaves', 'karuveppilai'], ['coriander', 'kothamalli'],
    ['seeds?\\s*water'], ['jaggery', 'vellam'], ['churna', 'lehyam', 'arishtam', 'ayurvedic\\s*(medicine|remedy|powder)'], ['herbs?']
  ].map(names => [names[0].replace(/\\s\*|[^a-z]/g, ''), new RegExp(`\\b(${names.join('|')})\\b`, 'i')])),
  sweet:/\bjuices?\b|soft\s*drinks?|\bcola\b|\bsweets\b|energy\s*drinks?/i,
  vinegar:/vinegar|baking\s*soda|epsom/i,
  soak:/\bsoak|oora\s*vai|ooravai|ooravechu/i,
  ice:/\bice\b|ice\s*pack|cold\s*compress/i,
  balm:/vicks|vapou?r\s*rub|\bbalm\b|amrutanjan|zandu/i,
  medicine:/paracetamol|ibuprofen|aspirin|crocin|\bdolo\b|combiflam|antacid|digene|\beno\b|pain\s*-?killer|antibiotic|\bointments?\b|laxative|decongestant|nasal\s*spray|\bsyrup|antihistamine|steroid/i,
  vitamin:/vitamin\s*[a-z0-9]+|\bb12\b|multivitamin/i, zinc:/\bzinc\b/i,
  supplement:/\biron\s*(tablet|supplement|pill|tonic|rich)|magnesium|melatonin|omega|calcium|protein\s*powder|probiotic/i,
  detox:/\bfasting\b|detox\s*(diet|drink|juice|water|tea|plan)|\bcleanse\b/i,
  pranayama:/kapalbhati|kapalabhati|bhastrika|anulom|pranayam|surya\s*namaskar|\basana/i,
  blade:/pumice|\bblades?\b|scrape|razor/i
};
const SOAK_WARNING = /(do\s*not|don'?t|never|avoid|no)\s+(\w+\s){0,2}soak/i;

const CLAIMS = [
  [/\bcur(e|es|ed|ing)\b/i, 'promises a cure'],
  // KT document: no "strengthens / improves / detoxifies the lungs or liver" claims
  // ("protect your lungs by staying away from smoke" is an approved lifestyle tip, so "protect" is not on the list)
  [/\b(improv\w*|strengthen\w*|boost\w*|detox\w*|cleans\w*|repair\w*|restor\w*)\s+(\w+\s+){0,2}(lungs?|liver|lung\s*health|liver\s*health|lung\s*function|liver\s*function)\b/i, 'claims to improve the lungs or liver'],
  [/guarantee/i, 'guarantees results'],
  [/no\s*side[- ]?effects?/i, 'claims no side effects'],
  [/(completely|totally|absolutely|perfectly|100\s*%|100\s*percent)\s*(safe|harmless|effective)/i, 'claims complete safety'],
  [/permanent(ly)?\s*(relief|cure|solution|fix)|instant(ly)?\s*(relief|cure|results)|miracle/i, 'promises permanent or instant results'],
  [/(clinically|scientifically|medically)\s*(proven|tested|approved)|doctor[- ]?(approved|recommended)/i, 'claims proof or approval'],
  [/revers(e|es|ed|ing)\s*(diabetes|damage|the\s*disease)|boost(s|ing)?\s*(your\s*|the\s*)?(immunity|immune|energy)/i, 'makes a disease, immunity or energy claim'],
  [/(support|control|manag|lower|reduc|balanc|regulat|improv|normali[sz]|maintain)\w*\s+(\w+\s+){0,3}(blood\s*sugar|sugar\s*levels?|glucose|blood\s*pressure|\bbp\b|cholesterol)|(blood\s*sugar|sugar\s*levels?|glucose)\s+(\w+\s+){0,2}(control|support|balance|management)/i, 'makes a blood sugar, blood pressure or cholesterol claim'],
  [/(instead\s*of|replace\w*|better\s*than|alternative\s*to|no\s*need\s*(for|of))\s+(\w+\s+){0,3}(medicine|medication|tablets?|insulin|allopath\w*|drugs?)/i, 'compares with or replaces medicine'],
  [/\b(my|mine)\s+(own\s+)?(vision|eyes?|eyesight|body|head|stomach|tummy|back|knees?|periods?|skin|hair|feet|throat)\b|\bi\s+(also\s+|sometimes\s+|often\s+)?(get|had|have|feel|felt|suffer\w*)\s+(a\s+|from\s+)?(headaches?|pain|cramps?|tired|sick|acidity|stress\w*|blurry)|\bwhen\s+i'?m\s+(tired|sick|stressed)/i, 'talks as if it has a body or its own health'],
  // ("as your doctor advised" is fine; "as your doctor, I…" is not)
  [/\b(i\s*am|i'?m|as)\s*(a\s*|your\s*)?(doctor|physician|nurse|pharmacist|ayurvedic\s*(doctor|practitioner|physician)|dietitian|real\s*person|human)\b(?!\s*(advised|advises|said|says|prescribed|recommended|recommends|told|suggested))/i, 'pretends to be a professional or a human']
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
const PRODUCT_NAMES = Object.fromEntries(CATALOG.map(p => [p.id, p.match]));
const AVAILABLE = CATALOG.filter(p => p.status === 'available');

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
  for (const [re, why] of CLAIMS){
    if (!re.test(text)) continue;
    // "It does not replace diabetes medicine" is a safety line, not a claim: only a negation right before the match counts
    if (why === 'compares with or replaces medicine' && [...text.matchAll(new RegExp(re.source, 'gi'))]
      .every(m => /(\bnot|n't|\bnever)\s+(\w+\s+)?$/i.test(text.slice(Math.max(0, m.index - 20), m.index)))) continue;
    out.push(why);
  }
  if (/\b100\s*(%|percent)/i.test(text)) out.push('uses a 100% claim');
  if (DIAGNOSIS.some(re => re.test(text))) out.push('suggests a diagnosis');
  for (const m of text.matchAll(STOP_MED)) if (!NEGATION.test(text.slice(Math.max(0, m.index - 60), m.index)) && !/^\s*without/i.test(text.slice(m.index + m[0].length, m.index + m[0].length + 12)))
    out.push(`may tell them to stop or change medicine ("${m[0]}")`);
  // amounts are only allowed when they are printed on a product that may be mentioned (its size or directions)
  const printed = a.mentionable.map(id => { const p = CATALOG.find(x => x.id === id); return `${p.size || ''} ${p.use}`; }).join(' ').toLowerCase().replace(/\s+/g, ' ');
  for (const m of text.matchAll(DOSE)) if (!printed.includes(m[0].toLowerCase().replace(/\s+/g, ' '))) out.push(`gives a dose or amount ("${m[0]}")`);
  // "will heal", "can treat": a claim, unless it is about what a doctor can do
  for (const m of text.matchAll(TREAT)) if (!/doctor|hospital|clinic|helps?\s+\w+\s*$/i.test(text.slice(Math.max(0, m.index - 40), m.index + m[1].length + 1))){ out.push(`claims to treat or heal ("${m[0]}")`); break; }

  // products: only the allowed ones
  for (const [id, re] of Object.entries(PRODUCT_NAMES)) if (re.test(text) && !a.mentionable.includes(id)) out.push(`mentions a product that is not allowed here (${id})`);
  for (const k of KINDS) if (k.match.test(text) && !k.ids.some(id => a.mentionable.includes(id))) out.push(`mentions a product type that is not allowed here ("${text.match(k.match)[0]}")`);
  if (COMING_SOON_MATCH.test(text) && a.mode !== 'soon' && a.mode !== 'shop') out.push('mentions a product that is not on sale yet');
  if (!a.mentionable.length && /\bour\s+(products?|range|gumm|inhaler|roll|liquid)|tranzlife\s+(products?|gumm|inhaler|roll|pulmo|reviva|liver|cycle|breathe|craving|energy)/i.test(text)) out.push('mentions TranzLife products when none are allowed');

  // a warning sign or no approved tips means the doctor must be mentioned
  if ((a.flags.length || a.stopMeds) && !DOCTOR.test(text)) out.push('does not tell them to see a doctor');
  return [...new Set(out)];
}

const MEDS_LINE = ' Please don\'t stop or change any medicine your doctor has prescribed without talking to them first.';
const careLine = a => a.about.pregnant || a.about.breastfeeding || a.about.child ? ' Since pregnancy, breastfeeding or a child is involved, please check with the doctor before trying anything new.' : '';
const TOPICS = CONCERNS.map(c => c.label).join(', ').replace(/, ([^,]*)$/, ' and $1');
const productNames = () => AVAILABLE.map(p => p.name).join(', ');
// how to buy (client, 13 Nov 2026): the TranzLife e-commerce site, or the official WhatsApp number
const WHATSAPP = '+91 91503 94443';
// what TranzLife is for (client wording, 14 Nov 2026; "food supplements" widened, since the range also has roll-ons and an inhaler)
const PURPOSE = 'At TranzLife, our purpose is to bring nature and bioscience together to support your everyday wellness. 🌿 We create thoughtfully developed wellness products and food supplements using natural ingredients, designed to nourish your body, support your health, and help you live a healthier, more balanced life. Because wellness isn\'t just a goal, it\'s a part of everyday living.';
const ORDER_LINE =`To order, please check the TranzLife e-commerce site, or message us on WhatsApp at **${WHATSAPP}** to enquire and order.`;
const priceOf = p => p.price ? `₹${p.price}` : p.priceSoon ? 'price coming soon' : null;

// Product facts, word for word from the catalogue (src/data/catalog.js, from the client's brochure).
const productText = a => (a.personNote?.length ? `${a.personNote.join(' ')}\n\n` : '') + a.named.map(id => { const p = CATALOG.find(x => x.id === id);
  const head = [p.form, p.size, priceOf(p)].filter(Boolean).join(', ');
  return `**${p.name}** (${head})\n${p.about}${p.note ? ` ${p.note}` : ''}\nHow to use: ${p.use}\nCaution: ${p.caution}`; }).join('\n\n')
  + `${a.stopMeds ? `\n\n${MEDS_LINE.trim()}` : ''}${careLine(a) ? `\n\n${careLine(a).trim()}` : ''}`
  + `\n\n${ORDER_LINE}`;

// Messages that are answered with fixed text and never go to the model: questions where any creative answer is a risk.
// The drinking-habit warning that leads a product answer (urgent warnings never get here: they are flag mode).
// Right after the bot gave the full warning, a one-line reminder instead of the same paragraph again.
function warningLead(a){
  if (!a.flags?.length) return [];
  if (a.warnedJustNow) return [`Because of the drinking, please let a doctor guide ${a.about.other ? 'them' : 'you'} before starting anything new; the free helpline 14446 can help too.`];
  return a.flags.map(f => f.say);
}

// Cautions about this person (pregnancy, a child, a condition or regular medicine), said before anything else about a product.
function personCautions(a, ps){
  const whose = a.about.other ? 'their' : 'your';
  const first = warningLead(a);
  if (a.about.pregnant || a.about.breastfeeding) first.push('During pregnancy or breastfeeding, please check with the doctor before using any of our products.');
  if (a.childQ || a.about.child) first.push('For children, please ask their doctor first: these products are made for ages 14 and above.');
  if ((a.about.diabetes || a.about.chronic || a.about.onMeds) && ps.some(p => p.ingested))
    first.push(`Because of ${whose} health condition or regular medicine, please check with the doctor before using ${ps.length > 1 ? 'these' : 'it'}.`);
  return first;
}

// A named product that does not suit this person (age, gender, a condition): said first in the safety, "who can use
// it" and "how it works" replies too ("is breathefree safe for kids?" -> "made for ages 14 and above").
function fixedReply(a){
  const r = fixedReplyBase(a);
  // (not when the reply already opens with the children caution: say it once)
  const said = /For children, please ask their doctor first/.test(r) && a.personNote?.every(n => /child|baby/.test(n));
  return r && a.personNote?.length && !said && ['safety', 'suitability', 'explain'].includes(a.mode) ? `${a.personNote.join(' ')}\n\n${r}` : r;
}

function fixedReplyBase(a){
  const meds = a.stopMeds ? MEDS_LINE : '';
  if (a.mode === 'identity') return 'I\'m Tulsi, TranzLife\'s virtual wellness assistant. I\'m not a doctor. I can share simple, general wellness tips from trusted public health guidance and help you find our products. For anything medical, a doctor is always the right person. 🌿';
  if (a.mode === 'safety'){
    const ids = a.safetyProducts?.length ? a.safetyProducts : a.named;
    const what = ids.length ? `the ${ids.map(id => CATALOG.find(p => p.id === id).name).join(' and the ')}` : 'any of our products';
    const lead = a.flags.length ? `${warningLead(a).join(' ')}\n\n` : '';
    return `${lead}That's a good question to ask. No product can be promised to suit everyone, so for ${what}, please read the label and ingredients first, and stop using it if you notice any irritation or reaction. Please check with your doctor before using it if you're pregnant, breastfeeding, buying it for a child, or have a health condition or take regular medicine.${meds}`;
  }
  if (a.mode === 'explain'){
    const ps = (a.explainProducts || []).map(id => CATALOG.find(x => x.id === id)).filter(Boolean);
    const notePart = ps.flatMap(p => a.productNotes?.[p.id] || (p.note ? [p.note] : [])).filter(Boolean);
    const notesStr = notePart.length ? `\n\n${[...new Set(notePart)].join(' ')}` : '';
    const flagWarning = '';   // any warning now leads the reply (personCautions)
    const care = personCautions(a, ps), lead = care.length ? `${care.join(' ')}\n\n` : '';
    // "is it good?": an honest opener, then what it is and does (no promises)
    const honest = a.goodQ ? `It's a good choice if it fits what you need, as part of a daily wellness routine; it is a wellness product, not a medicine, and no product can be promised to work the same for everyone. ` : '';
    if (ps.length === 1){
      const p = ps[0];
      const mech = p.mechanism || p.about;
      const usePart = p.use ? `\n\nHow to use: ${p.use}` : '';
      const cautionPart = p.caution ? `\n\nCaution: ${p.caution}` : '';
      return `${lead}${honest}Here is how the **${p.name}** helps:\n\n${mech}${notesStr}${flagWarning}${usePart}${cautionPart}`;
    }
    if (ps.length > 1){
      const lines = ps.map(p => `- **${p.name}**: ${p.mechanism || p.about}`);
      const quitNote = ps.some(p => /quit|craving|smoking/i.test(p.forProblems?.join(' ') || ''))
        ? '\n\nFor free support while quitting tobacco, you can call India\'s National Tobacco Quit Line on 1800 112 356.' : '';
      return `${lead}Here is how these products may support you:\n\n${lines.join('\n\n')}${notesStr}${flagWarning}${quitNote}\n\nTap Enquire on any card below for pricing and order details.`;
    }
  }
  if (a.mode === 'suitability'){
    const ps = (a.suitabilityProducts || []).map(id => CATALOG.find(x => x.id === id)).filter(Boolean);
    if (ps.length){
      // 1. any caution that applies to this person comes FIRST (never "Yes, for anyone" to a pregnant visitor or a father on BP tablets)
      const first = personCautions(a, ps);
      // 2. who it is made for, then the label's own caution
      const body = ps.map(p => `${ps.length > 1 ? `- **${p.name}**: ` : ''}${p.suitability || `**${p.name}** is a plant-based wellness product made for adults.`} ${p.caution ? `Caution: ${p.caution}` : ''}`.trim());
      const notePart = [...new Set(ps.flatMap(p => a.productNotes?.[p.id] || (p.note ? [p.note] : [])).filter(Boolean))];
      const general = first.length ? '' : '\n\nIf you are pregnant or breastfeeding, have a long-term condition or take regular medicine, please check with your doctor first.';
      // an age that fits ("my sister who is 55"): answer that first
      const age = a.person?.age;
      const ageOk = age && !a.personNote?.length && ps.every(p => (!p.minAge || age >= p.minAge) && (!p.maxAge || age <= p.maxAge))
        ? `At ${age}, age is not a problem for the ${ps.map(p => p.name).join(' or the ')}.${ps.some(p => p.id === 'reviva') ? ' Reviva is made for people with diabetes, so it suits them if they have diabetes.' : ''}\n\n` : '';
      return `${ageOk}${first.length ? `${first.join(' ')}\n\n` : ''}${ps.length > 1 ? 'Here is who these products are made for:\n\n' : ''}${body.join('\n\n')}${notePart.length ? `\n\n${notePart.join(' ')}` : ''}${general}`;
    }
  }
  if (a.productInfo) return productText(a);
  if (a.mode === 'medical') return `Thank you for asking. TranzLife products are natural wellness products. They aren't meant for medical conditions${a.condition ? ` like ${a.condition}` : ''}, and I can't recommend herbs, remedies or doses for them. A doctor is the right person to guide you on this.${meds || MEDS_LINE}`;
  if (a.mode === 'support'){
    const ps = a.products.map(id => CATALOG.find(x => x.id === id));
    const label = a.support.join(' and ');
    const extra = ps.length ? ` Alongside your doctor's treatment, you could look at our ${ps.map(p => `${p.name}, ${p.pitch}`).join('; or our ')}.${ps.filter(p => p.note).map(p => ` ${p.note}`).join('')} Please check with your doctor before trying it.` : '';
    return `Thanks for telling me. TranzLife products are natural wellness products, not a treatment for ${label}, so please keep following your doctor's advice and don't stop or change any medicine without them.${extra}${careLine(a)}`;
  }
  if (a.mode === 'recommend' && a.noProduct){
    // no TranzLife product is made for this topic: say so, never an empty list of suggestions
    const label = a.concerns.map(id => CONCERNS.find(x => x.id === id).label).join(' and ');
    const tips = a.recommendTips?.length ? `\n\nA few simple things that may help:\n\n${a.recommendTips.map(t => `- ${t.text}`).join('\n')}` : '';
    const doctor = a.doctor?.length ? ` ${a.doctor.join(' ')}` : ' If it keeps coming back or gets worse, a doctor or pharmacist can help.';
    // a long-term condition: no "coming soon" (that would sound like a treatment), regular check-ups instead
    if (a.concerns.some(id => CONCERNS.find(x => x.id === id).kind === 'condition'))
      return `We don't have a TranzLife product for ${label}, so I won't suggest one. 🌿${tips}

${a.doctor?.length ? a.doctor.join(' ') : 'Regular check-ups with the doctor are the best way to look after it.'}`.trim();
    return `We don't have a TranzLife product for ${label} yet, but more products are on the way and will launch soon. 🌿${tips}\n\n${a.recommendTips?.length ? 'Until then, these simple steps should help.' : 'Until then, the simple tips I shared are the best place to start.'}${doctor}`.replace(/\n\n /, '\n\n').trim();
  }
  if (a.mode === 'recommend'){
    const label = a.concerns.map(id => { const c = CONCERNS.find(x => x.id === id); return c.forLabel || c.label; }).join(' and ');
    const who = a.person?.group === 'baby' ? 'a baby' : a.person?.group === 'child' ? 'a child' : a.about.other ? 'them' : 'you';
    const lines = a.products.map(id => { const p = CATALOG.find(x => x.id === id);
      return `- **${p.name}** (${priceOf(p) || 'price on request'}): ${p.highlight || p.pitch}. How to use: ${p.useShort || 'follow the pack label'}.${(a.productNotes[id] || []).map(n => ` ${n}`).join('')}`; });
    const held = a.heldBack.map(id => CATALOG.find(x => x.id === id).name);
    // drinking only: the product supports the liver, it is not a way to quit
    const intro = a.concerns.length === 1 && a.concerns[0] === 'alcohol'
      ? `While ${who === 'them' ? 'they cut' : 'you cut'} down on alcohol, this may help support ${who === 'them' ? 'their' : 'your'} liver:`
      : `For ${label}, these may help ${who}:`;
    // products held back for this person (age, gender, pregnancy): the suffix says why, no product names
    const body = lines.length ? `${intro}\n\n${lines.join('\n')}` : `For ${label}, I won't suggest one of our products for ${who} right now.`;
    const after = a.suffix.length ? `\n\n${a.suffix.join(' ')}` : '';
    const lead = a.flags.length ? `${warningLead(a).join(' ')}\n\n` : '';   // the drinking warning comes first
    return `${lead}${body}${after}${lines.length ? '\n\nTap Enquire on a card for the price, or message us on WhatsApp to order.' : ''}`;
  }
  // small talk: instant fixed replies (the model kept answering "bye" and "ok" with "Hi there!")
  if (a.mode === 'smalltalk') return {
    bye:closingText(a),
    thanks:'You\'re welcome! 🌿 Is there anything else on your mind?',
    howareyou:'I\'m doing well, thanks for asking! 🌿 How are you feeling today? Tell me if anything is bothering you.',
    ok:a.afterProduct ? 'Great! 🌿 Tap Enquire on the product card and our team will help you with the price and how to order. Is there anything else on your mind?'
      : 'Sure! 🌿 If anything is bothering you, like stress, sleep or tiredness, just tell me.',
    greeting:'Hi! 🌿 I\'m Tulsi. How are you feeling today? Tell me what\'s on your mind, or pick one below.'
  }[a.smallTalkKind || 'greeting'];
  // about Tulsi / TranzLife (company line from the client's brochure)
  // the company's purpose (client wording, 14 Nov 2026) and what each launch product is made for
  // product and shop questions (server/faq.js)
  if (a.mode === 'faq') return a.faq.text;
  // "is reviva a complete cure for sugar?": a clear No first, then what it is really for
  if (a.mode === 'curenamed'){
    const p = CATALOG.find(x => x.id === a.products[0]) || CATALOG.find(x => x.id === (a.named[0]));
    if (p) return `No. The **${p.name}** can't cure ${p.id === 'reviva' ? 'diabetes or control blood sugar' : a.cureCondition || 'any disease'}, and no wellness product can. It is ${p.pitch}, ${p.id === 'reviva' ? 'used as a refreshing daily self-care routine alongside the care your doctor gives you' : 'to support everyday wellness alongside healthy habits'}. Please keep following your doctor's advice and don't stop or change any prescribed medicine.`;
  }
  // "what suits me / one product for general health": the all-round product, then the specific ones
  if (a.mode === 'general'){
    const e = CATALOG.find(x => x.id === 'energy-booster');
    if (!a.products.includes('energy-booster')) return 'Our products are made for ages 14 and above. Tell me what you would like support with, and I will suggest what fits. 🌿';
    return `For everyday wellness, our most all-round choice is the **${e.name}** (${priceOf(e)}): ${e.highlight}. How to use: ${e.useShort}.${a.notDrinking ? " Since you don't drink, that's great for your health too; our Liver Booster is also made for anyone who wants everyday liver and digestive wellness, whether or not they drink." : ''}\n\nIf you have a specific need, tell me and I'll match the right one: lung health, quitting smoking, liver and digestion, period comfort, stress, or diabetes wellness.`;
  }
  // "how can I buy this product?"
  if (a.mode === 'buy') return `You can buy the ${a.products.map(id => CATALOG.find(x => x.id === id)).map(p => `**${p.name}** (${priceOf(p) || 'price on request'})`).join(' and the ')} on the TranzLife e-commerce site, or order on WhatsApp at **${WHATSAPP}**: just send the product name and the team will help you with payment and delivery.`;
  // "say it shortly": the short version of what we were talking about
  if (a.mode === 'shorter'){
    if (a.products.length) return `In short:\n${a.products.map(id => CATALOG.find(x => x.id === id)).map(p => `- **${p.name}** (${priceOf(p) || 'price on request'}): ${p.pitch}. How to use: ${p.useShort || 'see the pack label'}.${p.note ? ` ${p.note.split('. ')[0].replace(/\.$/, '')}.` : ''}`).join('\n')}`;
    const t = a.lastTopic && CONCERNS.find(c => c.id === a.lastTopic);
    if (t) return `In short, for ${t.label}: ${t.tips.slice(0, 2).map(x => x.text.replace(/\.$/, '')).join('; ').toLowerCase()}.${t.products.length ? ` Our ${t.products.map(id => CATALOG.find(x => x.id === id).name).join(' or ')} may also help.` : ''}`;
    return 'In short: tell me what\'s bothering you, and I\'ll suggest the TranzLife product that may help, with a few simple tips. 🌿';
  }
  // "what is the price?" about the product just suggested
  if (a.mode === 'price') return `${a.products.map(id => { const p = CATALOG.find(x => x.id === id); const pr = priceOf(p); return pr ? `The **${p.name}** (${p.size}) is ${pr}.` : `Prices for the **${p.name}** (${p.size}) are shared on request.`; }).join(' ')}\n\n${ORDER_LINE}`;
  if (a.mode === 'purpose') return `${PURPOSE}\n\nHere's what each of our products is made for:\n\n${AVAILABLE.map(p => `- **${p.name}**: ${p.pitch}.`).join('\n')}\n\nThey support everyday wellness alongside healthy habits; they are not medicines and don't cure any disease. Tell me what you'd like support with, and I'll suggest the right one for you.`;
  if (a.mode === 'about') return `I'm Tulsi, the wellness assistant from TranzLife Biosciences, a Chennai-based life sciences company. ${PURPOSE}\n\nI can share simple natural tips for everyday problems like stress, sleep, tiredness, acidity, colds or period cramps, and help you find the right TranzLife product. What's on your mind today? You can pick one below or just tell me.`;
  if (a.mode === 'clarify') return clarifyText(a);
  if (a.mode === 'kids') return KIDS_TEXT;
  // "is this trustable?": who we are and how to check, with no claims about certificates we have not been given
  if (a.mode === 'trust') return 'That\'s a fair question to ask. 🌿 TranzLife Biosciences (Tranz Life Bio Sciences Pvt. Ltd.) is a Chennai-based life sciences company with an office at Montieth Road, Egmore, Chennai. You can talk to the team directly on **+91 917 611 2188** or at **info@tranzlife.in**.\n\nOur products are natural wellness products, not medicines. I\'ll always tell you honestly what each one is made for, what it is not for, and when a doctor is the right person instead. Before using any product, please read the label and ingredients, and check with your doctor if you are pregnant, take regular medicine or have a health condition. \n\nTranzLife is registered and recognised under FSSAI, MSME, Make in India, Startup India (DPIIT) and StartupTN, and is listed on the Government e-Marketplace (GeM).';
  if (a.mode === 'sorry') return 'Sorry, my last reply wasn\'t right. 🌿 I\'m a wellness assistant and I can get things wrong. Could you tell me again, in a few words, what you need? Or tap **Contact our team** below to talk to a person from TranzLife.';
  // a man asking about periods: ask kindly, no period tips and no CycleRelief
  // asking about a man they know ("my husband has period pain")
  if (a.mode === 'askwho' && a.about.other) return 'Periods only happen to women, so what he is feeling is likely something else. 🌿 Could you tell me where his pain or discomfort is (for example lower tummy, groin or back) and how long it has lasted? If it is strong, keeps coming back, or comes with fever, vomiting or blood in his urine, please take him to a doctor.';
  if (a.mode === 'askwho' && a.askedWhoBefore) return "Men don't have periods, so what you're feeling is likely something else. 🌿 If you have pain, cramps or discomfort in your lower tummy, groin or back, please tell me where it is and how long it has lasted, or see a doctor, especially if it is strong, keeps coming back or comes with fever, blood in your urine or trouble passing urine.";
  if (a.mode === 'askwho') return 'Thanks for telling me. Periods usually affect women, so I want to make sure I understand you. 🌿 Are you asking for someone else, like your wife, sister or daughter? Or are you having pain or discomfort yourself, for example in your lower tummy or back? Tell me a little more and I\'ll help. If the pain is strong or keeps coming back, please see a doctor.';
  // company contact details as printed on the TranzLife brochures
  if (a.mode === 'contact') return 'You can reach the TranzLife team through the contact form on this page: tap **Contact our team** below and I\'ll open it for you with your message started. To enquire or order, message us on WhatsApp at **+91 91503 94443**. You can also call **+91 917 611 2188** or email **info@tranzlife.in**. Our office is at 6, Flat 2D, 2nd Floor, Queenscourt, Montieth Road, Egmore, Chennai 600 008. The team will help with prices, orders, delivery and any other questions. 🌿';
  if (a.mode === 'shop') return `We have ${AVAILABLE.length} products right now: ${AVAILABLE.map(p => `${p.name} (${priceOf(p) || 'price on request'})`).join(', ')}. Ask me about any of them and I'll share what it's for and how to use it.\n\n${ORDER_LINE}`;
  if (a.mode === 'soon') return `That one isn't available right now, so I can't share details about it. Right now our range is: ${productNames()}. 🌿`;
  return '';
}

// supplements or products for a baby or child (client: our products are for ages 14 and above)
const KIDS_TEXT = "That's lovely that you're thinking about your little one's health. 🌿 Our products are made for ages 14 and above, so I won't suggest one for a baby or young child. More products are on the way and will launch soon.\n\nFor now, the best person to ask about supplements or vitamins is your child's doctor (paediatrician), because babies and children need very specific amounts. Regular check-ups, keeping vaccinations on time, and age-appropriate home food usually give a child what they need. Please don't give any supplement without the doctor's advice.";

// The last message of a chat ("no thanks", "that's all", "bye"): thank them, say how to order, say goodbye.
function closingText(a){
  const order = a.talkedProducts
    ? ` To order, check the TranzLife e-commerce site or message us on WhatsApp at ${WHATSAPP}.`
    : ' If you\'d like to talk to someone, tap Contact our team below.';
  return `Thank you for chatting with me today! 🌿${order} I hope you feel your best. Take care, and come back anytime you need me.`;
}

// Clarifying questions. Each kind is worded differently, so the visitor never gets the same question twice in a row,
// and from the second time on there is always a way out (Contact our team).
function clarifyText(a){
  const topic = a.prevTopic && CONCERNS.find(c => c.id === a.prevTopic);
  return {
    noproduct:`We don't have a TranzLife product for ${a.askedFor}, so I can't suggest one. Our products are made for lung health, quitting smoking, stress, liver and digestive wellness, period comfort, everyday energy and diabetes wellness. If you have a health problem with your ${a.askedFor}, a doctor is the right person to check it.`,
    choose:'Happy to help you choose. What would you like support with? Pick one below or tell me in your own words.',
    unclear:'I want to make sure I help with the right thing. Could you tell me a little more about how you feel, or pick one of these? If it\'s something I can\'t advise on, a pharmacist or doctor is the best person to ask.',
    unreadable:'Sorry, I didn\'t quite get that. 🌿 Could you tell me in a few words what\'s bothering you? For example, "I can\'t sleep well" or "I want to quit smoking". You can also pick one below.',
    topic:`Sorry, I didn't quite get that. 🌿 Would you like to keep talking about ${topic?.label || 'the same thing'}? If it's something else, just tell me in your own words.`,
    other:'No problem. 🌿 Tell me in your own words what\'s bothering you, for example "my knees hurt when I climb stairs" or "I get headaches at work". If it\'s about an order, a price or anything else, tap **Contact our team** below and a person from TranzLife will help you.',
    stuck:'I\'m sorry, I can\'t help with that here. 🌿 The TranzLife team can: tap **Contact our team** below. Or tap **Start a new chat** to begin again.',
    again:'Sorry, I still couldn\'t follow that. 🌿 I can help with everyday things like stress, sleep, tiredness, acidity, colds, period cramps, smoking or liver care, so you can type one of those. For anything else, tap **Contact our team** below and a person from TranzLife will help you.'
  }[a.clarifyKind || (a.recommendQ ? 'choose' : 'unclear')];
}

// Fixed, safe reply used when the model cannot produce one that passes. English, built only from approved text.
function fallbackReply(a){
  const meds = a.stopMeds ? MEDS_LINE : '';
  if (a.mode === 'flag') return `I'm sorry you're dealing with this. ${a.flags.map(f => f.say).join(' ')} Please don't try to manage it at home first. A doctor can check it properly and guide you. 💚`;
  if (a.mode === 'product') return productText(a);
  if (a.mode === 'shop') return fixedReply(a);
  if (a.mode === 'smalltalk') return 'Happy to help anytime. 🌿 Tell me how you\'re feeling, and we\'ll look at it together.';
  // choosing between products: a clear pick for their situation, and what the other one is for
  if (a.mode === 'choose'){
    if (!a.choice) return `They're made for different needs:\n${a.chooseFrom.map(id => CATALOG.find(p => p.id === id)).map(p => `- **${p.name}**: ${p.pitch}.`).join('\n')}\n\nWhat would you mainly like support with? Tell me, and I'll suggest the one that fits you best.`;
    const c = CATALOG.find(p => p.id === a.choice), others = a.chooseFrom.filter(id => id !== a.choice).map(id => CATALOG.find(p => p.id === id));
    const sit = a.situation ? CONCERNS.find(x => x.id === a.situation) : null;
    return `For ${sit ? sit.forLabel || sit.label : 'your situation'}, I'd start with the **${c.name}**: ${c.highlight || c.pitch}.${c.note ? ` ${c.note}` : ''} ${others.map(o => `The **${o.name}** is ${o.pitch}, so you can add it later if you want that support too.`).join(' ')}`.trim();
  }
  if (a.mode !== 'tips') return fixedReply(a);
  const label = a.concerns.map(id => CONCERNS.find(c => c.id === id).label).join(' and ');
  return `I'm sorry you're dealing with ${label}. A few gentle things that may help:\n\n${a.tips.slice(0, 4).map(t => `- ${t.text}`).join('\n')}${a.doctor.length ? `\n\n${a.doctor.join(' ')}` : ''}${meds}`;
}

// Quick-reply chips sent with a clarifying question (X-Suggest header). Each label is worded so that, when tapped and
// sent back as a message, it matches an approved topic.
const SUGGEST_HEALTH = ['Stress', 'Trouble sleeping', 'Tiredness', 'Acidity', 'Cold or cough'];
const SUGGEST_PRODUCTS = ['Quit smoking', 'Lung health', 'Liver care', 'Period cramps', 'Low energy'];
const NONE = 'None of these';
// after tips or a product suggestion: what next (each label leads somewhere when tapped)
const NEXT = ['Show all products', 'Something else', "That's all, thanks"];
const NEXT_LINE = 'Is there anything else on your mind, or would you like to explore our products? 🌿';
function suggestChips(a){
  if (a.mode === 'about' || (a.mode === 'smalltalk' && ['greeting', 'howareyou'].includes(a.smallTalkKind))) return SUGGEST_HEALTH;
  if (a.mode === 'askwho') return ['My wife has period cramps', 'My sister has period cramps', NONE];
  if (a.askNext) return NEXT;
  if (a.mode === 'purpose') return SUGGEST_PRODUCTS;
  if (a.mode === 'faq') return a.faq.chips || [];
  if (a.mode !== 'clarify' || ['other', 'stuck'].includes(a.clarifyKind)) return [];
  if (a.clarifyKind === 'again') return SUGGEST_HEALTH;
  if (a.clarifyKind === 'noproduct') return SUGGEST_PRODUCTS;
  if (a.clarifyKind === 'topic'){
    const c = CONCERNS.find(x => x.id === a.prevTopic);
    // the chip is sent back as a message, so it must lead to that same topic again
    const back = c && [`More about ${c.label}`, c.label].find(t => CONCERNS.find(x => x.match.test(t))?.id === c.id);
    return back ? [back, NONE] : [...SUGGEST_HEALTH.slice(0, 4), NONE];
  }
  return [...(a.recommendQ ? SUGGEST_PRODUCTS : SUGGEST_HEALTH), NONE];
}

// Buttons under a reply (X-Actions header): "whatsapp" opens the official WhatsApp chat, "contact" opens the contact
// form, "new" starts a new chat.
function replyActions(a){
  if (a.mode === 'smalltalk' && a.smallTalkKind === 'bye') return ['whatsapp', 'contact', 'new'];
  if (a.mode === 'smalltalk' && a.smallTalkKind === 'ok' && a.afterProduct) return ['whatsapp', 'contact'];
  if (['contact', 'shop', 'product', 'price'].includes(a.mode)) return ['whatsapp', 'contact'];
  if (a.mode === 'purpose') return ['whatsapp'];
  if (a.mode === 'faq') return a.faq.actions?.length ? a.faq.actions : a.products.length ? ['whatsapp'] : [];
  if (['soon', 'sorry', 'trust'].includes(a.mode)) return ['contact'];
  if (a.mode === 'recommend' && a.products.length) return ['whatsapp'];
  if (a.mode === 'clarify' && a.clarifyKind === 'stuck') return ['contact', 'new'];
  if (a.mode === 'clarify' && ['other', 'again'].includes(a.clarifyKind)) return ['contact'];
  return [];
}

// Safety lines around a model-written product answer: this person's cautions first (age, pregnancy, a condition or
// regular medicine), the product's own honesty note after ("It does not replace diabetes medicine...").
function productLead(a){
  const ps = (a.factProducts || []).map(id => CATALOG.find(x => x.id === id)).filter(Boolean);
  const cautions = personCautions(a, ps).filter(c => !(a.personNote?.length && /^For children/.test(c)));
  return [...(a.ageFits ? [a.ageFits] : []), ...(a.personNote || []), ...cautions];
}
function productTail(a){
  const ps = (a.factProducts || []).map(id => CATALOG.find(x => x.id === id)).filter(Boolean);
  // (said once: not when the last replies already said it; the drinking note only when drinking came up)
  return [...new Set(ps.flatMap(p => a.productNotes?.[p.id] || (p.note ? [p.note] : [])).filter(Boolean))]
    .filter(n => !(a.recentBot || '').includes(n.slice(0, 40)))
    .filter(n => !/heavy drinking/i.test(n) || a.alcoholContext);
}

export { NEXT_LINE, productLead, productTail, problems, fixedReply, fallbackReply, suggestChips, replyActions, REMEDIES, PRODUCT_NAMES };
