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
  medicine:/paracetamol|ibuprofen|aspirin|crocin|\bdolo\b|combiflam|antacid|digene|\beno\b|pain\s*-?killer|antibiotic|ointment|laxative|decongestant|nasal\s*spray|\bsyrup|antihistamine|steroid/i,
  vitamin:/vitamin\s*[a-z0-9]+|\bb12\b|multivitamin/i, zinc:/\bzinc\b/i,
  supplement:/\biron\s*(tablet|supplement|pill|tonic|rich)|magnesium|melatonin|omega|calcium|protein\s*powder|probiotic/i,
  detox:/\bfasting\b|detox\s*(diet|drink|juice|water|tea|plan)|\bcleanse\b/i,
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

// Product facts, word for word from the catalogue (src/data/catalog.js, from the client's brochure).
const productText = a => a.named.map(id => { const p = CATALOG.find(x => x.id === id);
  const head = [p.form, p.size, p.price ? `₹${p.price}` : null].filter(Boolean).join(', ');
  return `**${p.name}** (${head})\n${p.about}${p.note ? ` ${p.note}` : ''}\nHow to use: ${p.use}\nCaution: ${p.caution}`; }).join('\n\n')
  + `${a.stopMeds ? `\n\n${MEDS_LINE.trim()}` : ''}${careLine(a) ? `\n\n${careLine(a).trim()}` : ''}`
  + (a.named.some(id => !CATALOG.find(x => x.id === id).price) ? '\n\nFor prices and orders, the team is happy to help through the Contact section.' : '');

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
  if (a.childQ || a.about.child) first.push('For children, please ask their doctor first: these products are made for adults.');
  if ((a.about.diabetes || a.about.chronic || a.about.onMeds) && ps.some(p => p.ingested))
    first.push(`Because of ${whose} health condition or regular medicine, please check with the doctor before using ${ps.length > 1 ? 'these' : 'it'}.`);
  return first;
}

function fixedReply(a){
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
    if (ps.length === 1){
      const p = ps[0];
      const mech = p.mechanism || p.about;
      const usePart = p.use ? `\n\nHow to use: ${p.use}` : '';
      const cautionPart = p.caution ? `\n\nCaution: ${p.caution}` : '';
      return `${lead}Here is how the **${p.name}** helps:\n\n${mech}${notesStr}${flagWarning}${usePart}${cautionPart}`;
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
      return `${first.length ? `${first.join(' ')}\n\n` : ''}${ps.length > 1 ? 'Here is who these products are made for:\n\n' : ''}${body.join('\n\n')}${notePart.length ? `\n\n${notePart.join(' ')}` : ''}${general}`;
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
    return `We don't have a TranzLife product made for ${label} right now, so I won't suggest one.${tips}\n\n${a.recommendTips?.length ? '' : 'The simple tips I shared are the best place to start.'}${doctor}`.replace(/\n\n /, '\n\n').trim();
  }
  if (a.mode === 'recommend'){
    const label = a.concerns.map(id => { const c = CONCERNS.find(x => x.id === id); return c.forLabel || c.label; }).join(' and ');
    const who = a.about.other ? 'them' : 'you';
    const lines = a.products.map(id => { const p = CATALOG.find(x => x.id === id);
      return `- **${p.name}**: ${p.pitch}.${(a.productNotes[id] || []).map(n => ` ${n}`).join('')}`; });
    const held = a.heldBack.map(id => CATALOG.find(x => x.id === id).name);
    // drinking only: the product supports the liver, it is not a way to quit
    const intro = a.concerns.length === 1 && a.concerns[0] === 'alcohol'
      ? `While ${who === 'them' ? 'they cut' : 'you cut'} down on alcohol, this may help support ${who === 'them' ? 'their' : 'your'} liver:`
      : `For ${label}, these may help ${who}:`;
    const body = lines.length ? `${intro}\n\n${lines.join('\n')}` : `For ${label}, our usual suggestions are ${held.join(' and ')}.`;
    const heldLine = lines.length && held.length ? `\n\nWe also have ${held.join(' and ')}, but please check with the doctor before trying ${held.length > 1 ? 'those' : 'that'}.` : '';
    const after = a.suffix.length ? `\n\n${a.suffix.join(' ')}` : '';
    const lead = a.flags.length ? `${warningLead(a).join(' ')}\n\n` : '';   // the drinking warning comes first
    return `${lead}${body}${heldLine}${after}\n\nTap Enquire on a card for the price and how to order.`;
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
  if (a.mode === 'about') return 'I\'m Tulsi, the wellness assistant from TranzLife Biosciences, a Chennai-based life sciences company that develops natural, plant-based wellness products. I can share simple natural tips for everyday problems like stress, sleep, tiredness, acidity, colds or period cramps, and help you find the right TranzLife product. What\'s on your mind today? You can pick one below or just tell me.';
  if (a.mode === 'clarify') return clarifyText(a);
  // "is this trustable?": who we are and how to check, with no claims about certificates we have not been given
  if (a.mode === 'trust') return 'That\'s a fair question to ask. 🌿 TranzLife Biosciences (Tranz Life Bio Sciences Pvt. Ltd.) is a Chennai-based life sciences company with an office at Montieth Road, Egmore, Chennai. You can talk to the team directly on **+91 917 611 2188** or at **info@tranzlife.in**.\n\nOur products are natural wellness products, not medicines. I\'ll always tell you honestly what each one is made for, what it is not for, and when a doctor is the right person instead. Before using any product, please read the label and ingredients, and check with your doctor if you are pregnant, take regular medicine or have a health condition. For licence or certification details of a product, tap **Contact our team** below and the team will share them.';
  if (a.mode === 'sorry') return 'Sorry, my last reply wasn\'t right. 🌿 I\'m a wellness assistant and I can get things wrong. Could you tell me again, in a few words, what you need? Or tap **Contact our team** below to talk to a person from TranzLife.';
  // a man asking about periods: ask kindly, no period tips and no CycleRelief
  if (a.mode === 'askwho' && a.askedWhoBefore) return "Men don't have periods, so what you're feeling is likely something else. 🌿 If you have pain, cramps or discomfort in your lower tummy, groin or back, please tell me where it is and how long it has lasted, or see a doctor, especially if it is strong, keeps coming back or comes with fever, blood in your urine or trouble passing urine.";
  if (a.mode === 'askwho') return 'Thanks for telling me. Periods usually affect women, so I want to make sure I understand you. 🌿 Are you asking for someone else, like your wife, sister or daughter? Or are you having pain or discomfort yourself, for example in your lower tummy or back? Tell me a little more and I\'ll help. If the pain is strong or keeps coming back, please see a doctor.';
  // company contact details as printed on the TranzLife brochures
  if (a.mode === 'contact') return 'You can reach the TranzLife team through the contact form on this page: tap **Contact our team** below and I\'ll open it for you with your message started. You can also call **+91 917 611 2188** or email **info@tranzlife.in**. Our office is at 6, Flat 2D, 2nd Floor, Queenscourt, Montieth Road, Egmore, Chennai 600 008. The team will help with prices, orders, delivery and any other questions. 🌿';
  if (a.mode === 'shop') return `Here's our current range: ${productNames()}. Ask me about any of them and I'll share what it's for and how to use it. For prices, orders or delivery, tap **Contact our team** below and the team will help you.`;
  if (a.mode === 'soon') return `That one is coming soon and isn't on sale yet, so I can't share details about it. Right now our range is: ${productNames()}. For updates, the team is happy to help through the Contact section.`;
  return '';
}

// The last message of a chat ("no thanks", "that's all", "bye"): thank them, say how to order, say goodbye.
function closingText(a){
  const order = a.talkedProducts
    ? ' To order, tap Enquire on a product card above, or tap Contact our team below for prices and delivery.'
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
  if (a.mode === 'shop') return `Our range: ${productNames()}. Ask me about any of them for details. For prices, orders or delivery, the team is happy to help through the Contact section.`;
  if (a.mode === 'smalltalk') return 'Happy to help anytime. 🌿 Tell me how you\'re feeling, and we\'ll look at it together.';
  if (a.mode !== 'tips') return fixedReply(a);
  const label = a.concerns.map(id => CONCERNS.find(c => c.id === id).label).join(' and ');
  return `I'm sorry you're dealing with ${label}. A few gentle things that may help:\n\n${a.tips.slice(0, 4).map(t => `- ${t.text}`).join('\n')}${a.doctor.length ? `\n\n${a.doctor.join(' ')}` : ''}${meds}`;
}

// Quick-reply chips sent with a clarifying question (X-Suggest header). Each label is worded so that, when tapped and
// sent back as a message, it matches an approved topic.
const SUGGEST_HEALTH = ['Stress', 'Trouble sleeping', 'Tiredness', 'Acidity', 'Cold or cough'];
const SUGGEST_PRODUCTS = ['Quit smoking', 'Lung health', 'Liver care', 'Period cramps', 'Low energy'];
const NONE = 'None of these';
function suggestChips(a){
  if (a.mode === 'about' || (a.mode === 'smalltalk' && ['greeting', 'howareyou'].includes(a.smallTalkKind))) return SUGGEST_HEALTH;
  if (a.mode === 'askwho') return ['My wife has period cramps', 'My sister has period cramps', NONE];
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

// Buttons under a reply (X-Actions header): "contact" opens the contact form, "new" starts a new chat.
function replyActions(a){
  if (a.mode === 'smalltalk' && a.smallTalkKind === 'bye') return ['contact', 'new'];
  if (a.mode === 'smalltalk' && a.smallTalkKind === 'ok' && a.afterProduct) return ['contact'];
  if (['contact', 'shop', 'soon', 'sorry', 'trust'].includes(a.mode)) return ['contact'];
  if (a.mode === 'clarify' && a.clarifyKind === 'stuck') return ['contact', 'new'];
  if (a.mode === 'clarify' && ['other', 'again'].includes(a.clarifyKind)) return ['contact'];
  return [];
}

export { problems, fixedReply, fallbackReply, suggestChips, replyActions, REMEDIES, PRODUCT_NAMES };
