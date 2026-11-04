// Deterministic rules that run before the model: which product (if any) fits, which warning signs are
// present, and which language to answer in. Small local models are good writers but unreliable judges,
// so these decisions are made here in code and passed to the model as a short note.
// Keywords cover English plus common Tamil / Tanglish spellings. Add more as real chats come in.

const PRODUCT_RULES = [
  { id:'rollon', re:[/period|menstrua|menses|mensus|\bpms\b|month(ly)?\s*(pain|cramp)|cramps?\b|maadhavidai|maathavidai|matha\s*vidai|பீரியட்|மாதவிடாய்/i] },
  { id:'reviva', re:[/(dry|crack|rough|tired|hard|flak|vedi|vedippu|veddi)\w*.{0,40}\b(feet|foot|heels?|kaal|kaalu|paadham|paatham|kuthikal|kudhikal)\b|\b(feet|foot|heels?|kaal|kaalu|paadham|paatham|kuthikal|kudhikal)\b.{0,40}(dry|crack|rough|tired|vedi|vedippu|veddi)|cracked\s*heel|பாத|குதிகால்/i] },
  { id:'inhaler', re:[/stress|anxious|anxiety|tension|overwhelm|restless|nervous|pathattam|padapadappu|mana\s*azhutham|மன\s*அழுத்த|பதட்ட/i] },
  { id:'gummies', re:[/tired|fatigue|exhaust|no\s*energy|low\s*energy|energy\s*(illa|ille|kammi|kuraivu)|weak(ness)?\b|run\s*down|immunit|catch(ing)?\s*colds?|sorv|soarv|sorvaa|kalaippu|kalaipa|சோர்வ|களைப்பு/i] },
  { id:'liver', re:[/liver|detox|fatty\s*food|oily\s*food|heavy\s*(after|stomach)|kalleeral|kalleral|கல்லீரல்/i] }
];

// Warning signs: the doctor comes first and no product is shown.
const RED_FLAGS = [
  { why:'a wound, sore or infection on the foot with diabetes', re:/\b(wound|sore|ulcer|infect|pus\b|blister|swollen|swelling|numb|punn|seezh)\w*/i, with:/diabet|sugar|neerizhivu|நீரிழிவு|சர்க்கரை/i },
  { why:'a foot wound or infection', re:/\b(foot|feet|toe|heel|kaal)\b.{0,40}\b(wound|ulcer|infect|pus|punn)|\b(wound|ulcer|infect|pus|punn)\w*.{0,40}\b(foot|feet|toe|heel|kaal)\b/i },
  { why:'possible jaundice', re:/jaundice|yellow\w*.{0,12}\b(eyes?|skin)\b|\b(eyes?|skin)\b.{0,15}yellow|kann?u?\s*manjal|manjal\s*kaamalai|manjal\s*kamalai|மஞ்சள்\s*காமாலை/i },
  { why:'blood where it should not be', re:/blood\s*in\s*(my\s*)?(vomit|stool|urine|motion|poo|pee)|vomit\w*\s*blood|ratham\s*(varuthu|vandhuchu)/i },
  { why:'very heavy period bleeding', re:/(heavy|lot of|too much)\s*(period\s*)?bleed|soak\w*\s*(a\s*)?pad|clots?\b/i },
  { why:'high or long fever', re:/high\s*fever|fever\s*(for|since)\s*\d|\b10[2-5](\.\d)?\s*(°|deg|f\b)|kaaichal\s*(romba|adhigam)/i },
  { why:'unexplained weight loss', re:/(losing|lost)\s*weight\s*(without|for no)|unexplained\s*weight/i }
];

// Questions about stopping prescribed medicine: never encourage it.
const STOP_MEDS = /(stop|quit|skip|replace|instead of|leave|niruth|niruthi|vittu)\w*.{0,40}(tablet|medicine|medication|pill|insulin|maathirai|mathirai|marundhu|marunthu|மாத்திரை|மருந்து)|(tablet|medicine|medication|pill|insulin|maathirai|mathirai|marundhu)\w*.{0,40}(stop|quit|skip|replace|niruth|vittu)/i;
const CAUTION = /pregnan|breastfeed|nursing|kangaroo|karpam|garbam|கர்ப்ப|my\s*(baby|child|son|daughter|kid)|kozhandhai|kuzhanthai/i;

// Common Tamil words typed in English letters. Two or more hits = Tanglish.
const TANGLISH = /\b(iruku|irukku|irukken|romba|rombo|enaku|enakku|ennaku|panna|pannu|pannanum|mudiyala|mudiyalai|aaguthu|aagudhu|agudhu|illa|ille|venum|vendum|epdi|eppadi|enna|yenna|konjam|nalla|naan|nee|neenga|unga|enga|amma|appa|ku\b|la\b|ah\b|da\b|di\b|bro|machi|vali|valikuthu|valikudhu|sapadu|saapadu|thookam|thoongave|tension|kaal|kai|udambu|seri|sari|theriyala|pa\b|ma\b|nu\b|than|thaan|dhaan|kooda|ipo|ippo|apo|appo)\b/gi;

function language(text){
  if (/[஀-௿]/.test(text)) return 'tamil';
  return (text.match(TANGLISH) || []).length >= 2 ? 'tanglish' : 'english';
}

function analyse(text){
  const products = PRODUCT_RULES.filter(r => r.re.some(re => re.test(text))).map(r => r.id).slice(0, 2);
  const flags = RED_FLAGS.filter(f => f.re.test(text) && (!f.with || f.with.test(text))).map(f => f.why);
  return { lang:language(text), products:flags.length ? [] : products, flags, stopMeds:STOP_MEDS.test(text), caution:CAUTION.test(text) };
}

// The short note the model sees right before the visitor's latest message.
function routingNote(a, PRODUCTS){
  const lines = ['ROUTING NOTE (from the website, not from the visitor; follow it, never mention it):'];
  if (a.lang === 'tanglish') lines.push('- The visitor wrote in Tanglish. Reply in casual Tanglish: simple, common Tamil words typed in English letters, mixed with English, the way friends chat. Use only Tamil words you are sure of; when unsure, use the English word. Mixing in more English is much better than writing wrong Tamil.');
  else if (a.lang === 'tamil') lines.push('- The visitor wrote in Tamil script. Reply in simple, warm Tamil script.');
  else lines.push('- Reply in English.');
  if (a.flags.length) lines.push(`- Warning sign: ${a.flags.join('; ')}. Gently but clearly ask them to see a doctor soon. Do NOT recommend or mention any TranzLife product in this reply.`);
  else if (a.products.length) a.products.forEach(id => { const p = PRODUCTS.find(x => x.id === id); lines.push(`- This matches our ${p.name}. Recommend it by name in one warm sentence saying why it fits. A product card will appear under your message automatically.`); });
  else lines.push('- No product matches this. Do not recommend any product. Natural tips and comfort only.');
  if (a.stopMeds) lines.push('- They are asking about stopping or replacing prescribed medicine. Kindly say not to stop or change it without their doctor; natural care can sit alongside it.');
  if (a.caution) lines.push('- Pregnancy, breastfeeding or a child is involved. Suggest checking with their doctor before starting any supplement.');
  return lines.join('\n');
}

export { analyse, routingNote, language };
