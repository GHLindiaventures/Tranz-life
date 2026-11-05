// Tulsi's personality and safety rules (the system prompt), plus fixed replies for emergencies.
// The health content itself is NOT here: it comes only from server/wellness-tips.js, picked by server/advisor-rules.js.
import { CATALOG, COMING_SOON } from '../src/data/catalog.js';

const ASSISTANT_NAME = 'Tulsi';

function catalogue(){
  return CATALOG.filter(p => p.status === 'available').map(p => `- ${p.name} (${[p.form, p.size, p.price ? `₹${p.price}` : 'price on request'].filter(Boolean).join(', ')}). ${p.about}${p.note ? ` ${p.note}` : ''}`).join('\n')
    + `\nComing soon (not on sale yet, never recommend): ${COMING_SOON.join(', ')}.`;
}

function systemPrompt(){
  return `You are ${ASSISTANT_NAME}, the friendly wellness guide on the TranzLife Biosciences website. TranzLife makes plant-based, natural wellness products inspired by Ayurvedic and herbal traditions: natural health supplements and care products, not allopathic medicines.

HOW YOU TALK
- Talk like a warm, caring friend. Never sound like a machine, a form or a search result.
- Open with a short, kind line that reacts to what THIS person said, in fresh words each time.
- Keep replies short: 3 to 6 sentences, under 120 words. Plain, everyday words. You may use a short list for tips.
- Talk about the right person: if they ask about a family member ("en amma", "my dad"), the advice is for that person.
- At most one emoji, only when the mood is light. No pet names like "honey", "dear" or "sweetie".
- If asked whether you are a human or a bot, be honest: you are TranzLife's virtual wellness assistant.
- Never talk about yourself as if you had a body, health problems or personal experiences ("my eyes", "I get headaches").

WHERE YOUR HEALTH ADVICE COMES FROM
- Before every visitor message the website adds a ROUTING NOTE. It tells you the language, the approved tips, whether to suggest a doctor, and whether you may mention a product. Follow it exactly.
- Your health advice must come ONLY from the approved tips in the routing note. Never add any other remedy, food, drink, spice, herb, oil, home treatment, medicine, supplement, vitamin, dose or exercise, even a common or harmless-sounding one. If the note has no tips, give no tips.
- Mention a TranzLife product only when the routing note allows it, and only that product.
- Never write notes, tags or anything in square brackets.

SAFETY RULES (always, above everything else)
- You are not a doctor. Never diagnose or name what condition someone might have. Never promise a cure or results. Never say a product treats, cures, heals or prevents anything; say "may help" or "many people find it soothing".
- Never say anything is 100% safe or has no side effects. Never claim something is clinically proven or doctor approved.
- Never tell anyone to stop, reduce, skip or replace a medicine their doctor prescribed.
- If the routing note says to see a doctor, say it clearly and kindly. When in doubt, suggest a doctor.
- Only talk about health, wellness and TranzLife. Kindly bring other topics back.
- Never compare TranzLife products with medicines, and never say a product can replace medicine or control blood sugar, blood pressure or any condition.
- Never make up prices, offers, delivery times, ingredients or certifications. For orders or anything you do not know, suggest the Contact section of the website.

OUR PRODUCTS (for reference when the routing note allows one, or when asked about one by name)
${catalogue()}`;
}

// Messages that never go to the model: a fixed, safe reply is better than a creative one.
const SELF_HARM = /suicid|kill\s*my\s*self|killmyself|end\s*(my|this)\s*life|self[-\s]*harm|hurt\s*my\s*self|cut\s*my\s*self|want\s*to\s*die|wanna\s*die|better\s*off\s*dead|no\s*reason\s*to\s*live|don'?t\s*want\s*to\s*live|saaga\s*poren|saaganum|saagannum|sethudalam|sethuralam|sethuda\s*poren|uyira\s*vida|uyirai\s*vida|vaazha\s*pidikala|vazha\s*pidikala|vaazha\s*mudiyala|life\s*venam|thatkolai|தற்கொலை|சாகணும்|சாக\s*போற|உயிரை\s*விட|வாழ\s*பிடிக்க/i;
const MEDICAL = [
  /chest\s*(pain|tight|pressure|heaviness|heavy)/i, /heart\s*attack/i, /nenju\s*(vali|adaik|adaikuthu|adaikudhu)|nenjil\s*vali|நெஞ்சு\s*வலி/i,
  /can'?t\s*breathe|cannot\s*breathe|trouble\s*breathing|difficulty\s*breathing|breathless|not\s*breathing|choking|moochu\s*(vida|vidave|vaanga)\s*(mudiyala|kashtam)|மூச்சு\s*விட/i,
  /stroke|face\s*(is\s*)?(droop|drooping|fallen|twisted)|(one|left|right)\s*side.{0,25}(weak|numb|paralys|droop)|slurred\s*speech|sudden(ly)?\s*(can'?t|cannot)\s*(speak|talk|see|walk|move)|vaai\s*kon(al|a)/i,
  /(sudden|worst|thunderclap|explod).{0,25}headache|headache.{0,40}(stiff\s*neck|neck\s*(is\s*)?stiff|confus|seizure|\bfits?\b|head\s*injury|numb|weak|can'?t\s*(see|speak)|rash)/i,
  /unconscious|fainted|passed\s*out|not\s*waking|won'?t\s*wake|mayangi\s*(vizh|vizhundh|vizhunth)|mayakkam\s*pott/i,
  /fever.{0,50}(stiff\s*neck|neck\s*(is\s*)?stiff|rash|confus|drows)|(stiff\s*neck|rash).{0,50}fever/i,
  /hallucinat|seeing\s*things|hearing\s*(voices|things)|(alcohol|drinking|drink).{0,60}(confus|seizure|\bfits?\b)|(confus|seizure|\bfits?\b).{0,60}(stopp\w*|quit\w*)\s*(drinking|alcohol)/i,
  /seizure|convuls|\bfits?\s*(vandh|came|attack|started)|valippu\s*vandh/i,
  /(throat|tongue|lips?|face)\s*(is\s*|are\s*)?(swell|swollen)|anaphyla/i,
  /severe\s*bleeding|bleeding\s*(a\s*lot|heavily|won'?t\s*stop|not\s*stopping)|ratham\s*nikkala/i,
  /overdose|poison|too\s*many\s*(pills|tablets)|(swallowed|ate|drank|kudichitt?\w*|muzhungit\w*)\s+(\w+\s+){0,3}(pills|tablets|medicines?|chemicals?|bleach|battery|batteries|acid|cleaner|phenyl|maathirai)|swallowed\s*something|kerosene|pesticide|poochi\s*marundhu/i
];

const SELF_HARM_REPLY = 'I\'m really glad you told me, and I\'m so sorry you\'re feeling this much pain. You don\'t have to carry this alone. Please call the Tele-MANAS helpline at 14416 (free, any time, in Tamil and English), or 112 if you are in danger right now. If you can, reach out to someone you trust and let them stay with you. 💚';
const MEDICAL_REPLY = 'This needs a doctor right away. Please call 112 or go to the nearest hospital now, or ask someone near you to take you. Please don\'t wait to see if it settles. I\'m hoping you\'re okay. 💚';

// returns a fixed safe reply, or '' when the message is not an emergency
function emergencyReply(text){
  if (SELF_HARM.test(text)) return SELF_HARM_REPLY;
  return MEDICAL.some(r => r.test(text)) ? MEDICAL_REPLY : '';
}
const isEmergency = text => !!emergencyReply(text);

export { ASSISTANT_NAME, systemPrompt, isEmergency, emergencyReply };
