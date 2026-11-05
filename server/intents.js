// Example messages for the semantic understanding layer (server/understand.js).
//
// At server start every example is turned into an embedding. A visitor's message is matched against them, and the
// closest topic or intent wins if it is clear enough. These are DATA, not advice: they only decide which approved
// topic (server/wellness-tips.js) or product (src/data/catalog.js) a message is about. Add real visitor phrasings here
// (English, Tamil script, Tanglish, typos), then run `npm run test:understand` to check accuracy.
//
// Keep emergencies and warning signs OUT of this file: they are always decided by the regex rules, which run first.

const CONCERN_EXAMPLES = {
  period:[
    'I get period cramps', 'my periods are very painful', 'stomach pain during periods', 'menstrual cramps every month',
    'first day of my period hurts a lot', 'PMS pain', 'periods time la vayiru vali', 'enaku period vali romba iruku',
    'mensus pain', 'period pain relief', 'cramps during my cycle', 'மாதவிடாய் வலி', 'periodku munnadi vali', 'lower tummy ache on my period',
    'period cramp ku enna pannalam', 'periods paining a lot', 'pain on my periods'
  ],
  stress:[
    'I am very stressed', 'work stress is too much', 'I feel anxious all the time', 'exam pressure', 'I cannot focus at work',
    'tension ah iruku', 'manasu romba tension', 'overthinking a lot', 'I feel overwhelmed', 'office la pressure athigam',
    'nervous before meetings', 'I cant concentrate', 'mind is restless', 'மன அழுத்தம்', 'romba kavalai ah iruku', 'burnout from work'
  ],
  sleep:[
    'I cannot sleep at night', 'trouble sleeping', 'insomnia', 'I wake up many times at night', 'sleep is very poor',
    'thookam varala', 'night full ah thoongave mudiyala', 'my mind keeps racing at bedtime', 'not getting enough sleep',
    'தூக்கம் வரவில்லை', 'I sleep very late and wake up tired', 'cant fall asleep', 'poor sleep quality', 'sleepless nights'
  ],
  feet:[
    'my heels are cracked', 'dry feet', 'cracked heels', 'rough skin on my feet', 'kaal vedippu', 'kuthikal vedippu iruku',
    'my feet are very dry', 'heel cracks', 'குதிகால் வெடிப்பு', 'feet skin is peeling', 'dry and rough soles', 'kaal la crack'
  ],
  tired:[
    'I feel tired all the time', 'no energy', 'low stamina', 'always exhausted', 'udambu sorva iruku', 'energy illa',
    'feeling weak and drained', 'I get tired easily', 'night shift makes me tired', 'long working hours I am drained',
    'சோர்வாக இருக்கிறது', 'feel lazy and dull', 'tired after gym', 'kalaippa iruku', 'low energy in the afternoon', 'fatigue'
  ],
  liver:[
    'how to take care of my liver', 'liver health', 'liver detox', 'I eat junk food every day', 'fatty food daily',
    'kalleeral health', 'I want to protect my liver', 'eating outside food daily', 'liver strong aaganum', 'கல்லீரல் ஆரோக்கியம்',
    'cleanse my liver', 'fried food a lot', 'worried about my liver'
  ],
  alcohol:[
    'I drink alcohol daily', 'I am a drinker', 'my friend drinks a lot', 'nan kudikiren', 'weekend la kudipen',
    'daily kudikira pazhakkam iruku', 'sarakku adikiren', 'alchohol adikren', 'I drink beer every night', 'whisky every weekend',
    'how to reduce drinking', 'en husband romba kudikiraru', 'quit alcohol', 'too much drinking', 'மது பழக்கம்', 'I booze a lot',
    'cutting down on drinks', 'hangover every sunday'
  ],
  pollution:[
    'pollution is very bad in my city', 'I work in a dusty place', 'construction site dust', 'traffic smoke every day',
    'air quality is poor', 'smog outside', 'factory fumes at work', 'dust allergy area la iruken', 'thoosi romba', 'மாசு அதிகம்',
    'I travel in heavy traffic daily', 'breathing dust all day'
  ],
  lungs:[
    'lung health', 'my lungs feel weak', 'I have weak lungs', 'lung problem iruku', 'lungs feel heavy', 'improve lung strength',
    'lung health improve panna enna pannalam', 'நுரையீரல் ஆரோக்கியம்', 'breathing feels heavy', 'how to keep lungs healthy',
    'nurai eeral weak', 'strengthen my lungs', 'lungs congested'
  ],
  immunity:[
    'I fall sick often', 'low immunity', 'I catch colds easily', 'weak immunity', 'adikadi udambu sari illa', 'get sick every month',
    'boost my immune system', 'always getting infections', 'adikadi sali pidikuthu', 'நோய் எதிர்ப்பு சக்தி குறைவு', 'kids keep giving me colds'
  ],
  headache:[
    'I have a headache', 'head pain every evening', 'thalai vali', 'my head hurts', 'headache after work', 'tension headache',
    'thala romba valikuthu', 'தலைவலி', 'head is pounding', 'headache from screen', 'migraine like pain', 'sir dard',
    'headache since morning', 'head aching the whole day'
  ],
  acidity:[
    'acidity after dinner', 'heartburn', 'acid reflux', 'stomach burning after food', 'gas trouble', 'bloated after eating',
    'nenju erichal', 'vayiru erichal', 'stomach pain after eating outside food', 'indigestion', 'நெஞ்செரிச்சல்', 'sour burps',
    'stomach upset after oily food', 'saptathum erichal'
  ],
  cold:[
    'I have a cold', 'runny nose', 'sore throat', 'cough', 'blocked nose', 'sneezing a lot', 'jaladosham', 'sali pidichiruku',
    'irumal iruku', 'thondai vali', 'சளி', 'இருமல்', 'throat pain and cold', 'stuffy nose', 'chest congestion with cough'
  ],
  constipation:[
    'constipated', 'motion pogala', 'hard stools', 'not passing stool for days', 'malachikkal', 'மலச்சிக்கல்',
    'bowel movement problem', 'potty varala', 'cant go to the toilet', 'stomach not clear in the morning'
  ],
  eyes:[
    'eye pain', 'my eyes feel tired', 'eye strain from laptop', 'dry eyes', 'kannu vali', 'kannu romba erichal', 'கண் வலி',
    'burning eyes', 'sore eyes after screen', 'eyes are itchy and tired', 'watery tired eyes', 'kannu valikuthu'
  ],
  back:[
    'back pain', 'lower back pain', 'muthugu vali', 'backache from sitting', 'my back hurts', 'idupu vali', 'முதுகு வலி',
    'stiff back in the morning', 'back pain from office chair', 'upper back ache'
  ],
  joints:[
    'joint pain', 'knee pain', 'my knee hurts after walking', 'mootu vali', 'shoulder pain', 'ankle hurts', 'மூட்டு வலி',
    'stiff joints', 'wrist pain', 'hip ache', 'kaal muttu vali'
  ],
  acne:[
    'pimples on my face', 'acne', 'breakouts', 'paru iruku', 'skin breaking out', 'பரு', 'spots on my face', 'oily skin pimples',
    'acne marks'
  ],
  hair:[
    'hair fall', 'losing hair', 'hair thinning', 'mudi kottuthu', 'mudi romba uthiruthu', 'முடி உதிர்வு', 'hair falling a lot',
    'bald patches worry', 'hair loss after illness'
  ],
  ulcer:[
    'mouth ulcer', 'ulcer in my mouth', 'vaai pun', 'canker sore', 'வாய்ப்புண்', 'painful sore inside mouth', 'tongue ulcer'
  ],
  nausea:[
    'feeling sick', 'nausea', 'I feel like vomiting', 'queasy stomach', 'kumattal', 'vaanthi varra maari iruku', 'குமட்டல்',
    'motion sickness feeling', 'sick feeling after lunch'
  ],
  fever:[
    'I have a fever', 'mild fever', 'temperature since morning', 'kaaichal', 'udambu soodu ah iruku', 'காய்ச்சல்', 'feverish',
    'body is hot'
  ],
  dandruff:[
    'dandruff', 'flaky scalp', 'itchy scalp', 'podugu', 'பொடுகு', 'white flakes in hair', 'scalp itching'
  ],
  smoking:[
    'I smoke a lot', 'I want to quit smoking', 'cigarette pidikiren', 'cigerette habit', 'ciggarette quit panna help pannunga',
    'he puffs 20 a day', 'I chew gutka', 'beedi habit', 'tobacco addiction', 'vaping', 'nicotine cravings', 'pugai pidikkum pazhakkam',
    'புகைபிடித்தல்', 'how to stop smoking', 'cigs every day', 'hookah every weekend'
  ]
};

// What kind of message it is (besides a health topic).
const INTENT_EXAMPLES = {
  recommend:[
    'which product should I use', 'which one is best', 'enna product use pannalam', 'recommend something', 'what should I buy',
    'suggest a product', 'anything for this', 'edhu nalla', 'what do you have for this', 'which product is good for me',
    'endha product vaanganum', 'best product for me', 'what can I take for this'
  ],
  shop:[
    'what products do you sell', 'show me all products', 'price list', 'how much does it cost', 'do you deliver to Chennai',
    'how to order', 'cash on delivery available', 'any discount', 'evlo price', 'is it in stock'
  ],
  smalltalk:[
    'hi', 'hello', 'thanks', 'thank you so much', 'ok', 'good morning', 'bye', 'vanakkam', 'nandri', 'super'
  ],
  other:[
    'who won the cricket match', 'what is the weather today', 'tell me a joke', 'what is the capital of France', 'write a poem',
    'what time is it'
  ],
  // real complaints with NO approved tips: these get a clarifying question, never the nearest topic
  // ("dizzy" is not "feeling sick"; a rash is not "pimples")
  unsupported:[
    'I feel dizzy', 'giddiness', 'my head is spinning', 'I lost my appetite', 'not feeling hungry at all', 'skin rash',
    'white patches on my skin', 'ear pain', 'toothache', 'burning while passing urine', 'swelling in my legs', 'numbness in my hand',
    'thalai suthuthu', 'pasi illa', 'kai kaal maraththu pogudhu', 'weight gain', 'irregular periods', 'missed my period'
  ],
  // healthy habits and neutral statements: these must NOT become a health topic ("I drink water a lot" is not alcohol)
  neutral:[
    'I drink water a lot', 'I drink plenty of water', 'thanni neraya kudikiren', 'I drink coffee in the morning', 'I drink tea daily',
    'I sleep well', 'I go for a walk every day', 'I eat healthy food', 'I exercise daily', 'I feel fine today', 'nothing is wrong',
    'I am healthy', 'I drink milk at night', 'I like green tea'
  ]
};

export { CONCERN_EXAMPLES, INTENT_EXAMPLES };
