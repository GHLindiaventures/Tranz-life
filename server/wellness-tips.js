// APPROVED WELLNESS TIPS: the only health advice Tulsi is allowed to give.
//
// Every tip below is reworded from public health guidance (sources listed on each topic) and was checked
// against those pages in November 2026. Tulsi never invents remedies: code picks the topic, the model only
// rephrases these tips warmly, and server/reply-check.js rejects any reply that adds other remedies.
//
// Before changing anything here:
//   - keep tips to simple, low-risk self-care that the source itself recommends
//   - never add herb doses, medicines, oils, fasting/detox plans, or anything to swallow for children or in pregnancy
//   - add the source link, and add a test in tests/server/
//   - ideally have a qualified person (BAMS doctor / pharmacist) read the change
//
// Topic fields:
//   products      catalogue ids (src/data/catalog.js) that may be suggested for this topic
//   doctor        when to see a doctor; only said when the visitor describes it as severe, long-lasting or worsening,
//                 unless alwaysDoctor is set (everyday small problems should not be sent to a doctor)
// Tip fields:
//   kind    'lifestyle' (habits, rest, movement), 'heat' / 'cold' (on the body), 'food' (anything eaten, drunk or gargled)
//   uses    remedy words this tip may use (see REMEDIES in reply-check.js); anything else in a reply is rejected
//   sugar   contains sugar or honey (dropped when diabetes is mentioned)
//   adult   adults only (dropped for children)

import { MORE_CONCERNS } from './wellness-tips-more.js';

const CONCERNS = [
  {
    id:'period', label:'period cramps', products:['cyclerelief'],
    // pain or cramps must be mentioned: late, missed or irregular periods are not this topic (they need a doctor)
    match:/(period|menstrua|menses|mensus|chums|maadhavidai|maathavidai|matha\s*vidai|பீரியட்|மாதவிடாய்).{0,45}(pain|painful|cramp|ache|hurt|discomfort|vali|வலி)|(pain|painful|cramp|ache|hurt|vali|வலி)\w*.{0,45}(period|menstrua|menses|chums|maadhavidai|மாதவிடாய்)|(?<!\b(leg|legs|muscle|muscles|calf|calves|foot|feet|hand|hands|thigh|thighs|toe|toes|night|kaal|neck|back)\s+)\bcramps?\b(?!\s+(in|on|at)\s+(my|the|his|her|your)?\s*(legs?|calf|calves|foot|feet|hands?|thighs?|toes?|neck|back|muscles?)\b)|\bpms\b|month(ly)?\s*(cycle\s*)?(pain|cramp|discomfort|vali)|\bcycle\s*(pain|cramp|vali)\b|chums\s*pain/i,
    tips:[
      { text:'Put a hot water bag or heat pad, wrapped in a towel, on your lower tummy.', kind:'heat', uses:['heat'] },
      { text:'A warm bath or shower can help.', kind:'lifestyle' },
      { text:'Gently massage your lower tummy and back.', kind:'lifestyle' },
      { text:'Gentle movement, like walking, swimming or light yoga, can ease the pain.', kind:'lifestyle' }
    ],
    doctor:'See a doctor if the pain is severe or worse than usual, stops you doing your daily activities, or your periods become heavier or irregular, or you bleed between periods.',
    sources:['https://www.nhs.uk/conditions/period-pain/']
  },
  {
    id:'stress', label:'stress', products:['breathefree'],
    match:/stress|can'?t\s*(concentrate|focus)|(concentrat\w*|focus)\s*(panna\s*)?mudiyala|kavalai|anxious|anxiety|(?<!hyper|hypo)tension|overwhelm|restless|nervous|work\s*pressure|exam\s*(pressure|fear|tension)|deadlines?|burn\s*-?\s*out|overthink|pathattam|padapadap\w*|mana\s*azhutham|\b(calm|calming|relax|relaxing)\b|peace\s*of\s*mind|aromatherap\w*|மன\s*அழுத்த|பதட்ட/i,
    tips:[
      { text:'Pause for a few minutes and breathe slowly: in gently through your nose, and out slowly through your mouth.', kind:'lifestyle' },
      { text:'Break big tasks into small steps, and give yourself credit as you finish each one.', kind:'lifestyle' },
      { text:'Talk to a friend, family member or colleague you trust.', kind:'lifestyle' },
      { text:'Being active, even a short walk, helps release nervous energy.', kind:'lifestyle' }
    ],
    doctor:'If the stress feels severe, is affecting your daily life, or you feel you cannot cope, please talk to a doctor. If you ever feel unsafe, you can call Tele-MANAS on 14416, any time.',
    sources:['https://www.nhs.uk/every-mind-matters/mental-health-issues/stress/']
  },
  {
    id:'sleep', label:'trouble sleeping', products:[],
    match:/(can'?t|cannot|can\s*not|unable\s*to|trouble|difficulty|problem|hard\s*to|not\s*able\s*to)\s*(\w+\s*){0,2}(sleep|fall\s*asleep|stay\s*asleep)|(no|poor|bad|less|broken|light)\s*sleep|sleep(less|ing)?\s*(problem|issue|trouble|badly|poorly)|not\s*sleeping|insomnia|wake\s*up\s*(at\s*night|often|many\s*times|again\s*and\s*again)|thookam|thookame|thukkam|thoongave|thoonga\s*mudiyala|thoongamudiyala|thoongala|thoongarathu|தூக்க/i,
    tips:[
      { text:'Get up at the same time every day, even after a bad night, and try not to nap during the day.', kind:'lifestyle' },
      { text:'Avoid tea, coffee and alcohol in the 6 hours before bed, and do not eat a big meal late at night.', kind:'lifestyle' },
      { text:'Put your phone and screens away for the hour before bed.', kind:'lifestyle' },
      { text:'Relax for an hour before bed, with a warm bath or a book, in a dark, quiet room.', kind:'lifestyle' }
    ],
    doctor:'If changing these habits has not helped, you have had trouble sleeping for months, or it is making daily life hard, please see a doctor.',
    sources:['https://www.nhs.uk/conditions/insomnia/']
  },
  {
    id:'feet', label:'dry or cracked feet', products:[],
    match:/(dry|crack|rough|tired|hard|flak|vedi|vedippu|veddi)\w*.{0,40}\b(feet|foot|heels?|kaal|kaalu|paadham|paatham|kuthikal|kudhikal)\b|\b(feet|foot|heels?|kaal|kaalu|paadham|paatham|kuthikal|kudhikal)\b.{0,40}(dry|crack|rough|tired|vedi|vedippu|veddi)|cracked\s*heel|பாத|குதிகால்/i,
    tips:[
      { text:'Use a moisturising cream on your feet every day, but not between the toes.', kind:'lifestyle' },
      { text:'Wash your feet daily with warm (not hot) water and dry them well, especially between the toes.', kind:'lifestyle' },
      { text:'Wear comfortable, well-fitting shoes and socks that do not rub.', kind:'lifestyle' }
    ],
    doctor:'If the cracks bleed, hurt a lot, or look red, swollen or infected, please see a doctor.',
    // used instead when diabetes is mentioned anywhere in the chat
    diabetes:{
      tips:[
        { text:'Check the feet every day, including the soles (use a mirror or ask someone to help), for cuts, blisters or colour changes.', kind:'lifestyle' },
        { text:'Use a moisturising cream every day, but never between the toes.', kind:'lifestyle' },
        { text:'Wash the feet daily with warm water, checking the temperature with your wrist or elbow first, and dry well between the toes.', kind:'lifestyle' },
        { text:'Do not soak the feet, and wear wide, comfortable shoes and socks that do not rub.', kind:'lifestyle', uses:['soak-warning'] }
      ],
      doctor:'With diabetes, any cut, blister, colour change, swelling or loss of feeling in the feet should be shown to a doctor as soon as possible, without waiting for the routine check.',
      alwaysDoctor:true
    },
    sources:['https://www.diabetes.org.uk/guide-to-diabetes/complications/feet/taking-care-of-your-feet']
  },
  {
    id:'tired', label:'tiredness', products:['energy-booster'],
    match:/(?<!\beyes?\s+(\w+\s+){0,3})tired(?!.{0,20}\b(feet|foot|kaal|eyes?)\b)|fatigue|(?<!heat\s+)exhaust(ed|ion|ing)\b|worn\s*out|drained|no\s*energy|low\s*energy|(low|less|no|poor)\s*stamina|stamina|night\s*shifts?|long\s*(working\s*|work\s*)?hours|after\s*(the\s*)?(gym|workout)|workouts?\s*(tired|recovery)|busy\s*schedule|energy\s*(illa|ille|kammi|kuraivu)|(?<!\b(lungs?|chest|breathing|knees?|legs?|eyes?|eyesight|immunity)\s+(\w+\s+){0,2})weak(ness)?\b(?!\s*(lungs?|immun))|run\s*down|dull\b|drows\w*|letharg\w*|sluggish|sorv|soarv|kalaippu|kalaipa|சோர்வ|களைப்பு/i,
    tips:[
      { text:'Go to bed and get up at the same times each day, aiming for 6 to 9 hours of sleep.', kind:'lifestyle' },
      { text:'Eat well and stay active, even a short walk each day helps.', kind:'lifestyle' },
      { text:'Put screens away for the hour before bed, and avoid caffeine and big meals in the 2 hours before sleep.', kind:'lifestyle' },
      { text:'Go easy on alcohol.', kind:'lifestyle' }
    ],
    doctor:'If you have felt tired for a few weeks without a clear reason, it is affecting your daily life, or you also have weight loss or mood changes, please see a doctor so they can check the cause.',
    sources:['https://www.nhs.uk/conditions/tiredness-and-fatigue/']
  },
  {
    id:'liver', label:'liver care', products:['liver-booster'],
    // also lifestyle habits that strain the liver: junk / fried food habits, eating out a lot, fatty liver risk
    match:/\bliver\b|\bdetox|junk\s*food|fast\s*food|fried\s*food\s*(daily|a\s*lot|every|often)|eat(ing)?\s*(out|outside|hotel\s*food)\s*(daily|a\s*lot|every\s*day|often)|(outside|hotel|street)\s*food\s*(daily|a\s*lot|every\s*day|often)|fatty\s*liver|heavy\s*(stomach|digestion)|digestion\s*(problem|trouble|tonic|syrup|support)|liver\s*(tonic|syrup|safe|health|damage|cleanse)|kalleeral|kalleral|கல்லீரல்/i,
    tips:[
      { text:'Eat a healthy, balanced diet.', kind:'lifestyle' },
      { text:'Keep alcohol low, or avoid it.', kind:'lifestyle' },
      { text:'Stay active, aiming for about 150 minutes a week, like brisk walking.', kind:'lifestyle' },
      { text:'Keep your weight in a healthy range.', kind:'lifestyle' }
    ],
    doctor:'If you notice yellow skin or eyes, constant tiredness, loss of appetite, weight loss, itchy skin or nausea, please see a doctor.',
    sources:['https://www.nhs.uk/conditions/liver-disease/', 'https://www.nhs.uk/conditions/non-alcoholic-fatty-liver-disease/']
  },
  {
    id:'alcohol', label:'drinking alcohol', forLabel:'cutting down on alcohol', products:['liver-booster'],
    match:/alcohol|\balc[a-z]{0,3}h[a-z]{0,3}l|alkohol|(?<!(thanni|thannee|water|tea|coffee|paal|milk|juice)\s)\bkudi(kk?iren|kk?iraen|pp?en|kk?iraaru|kk?iraru|kk?iran|kk?uraan|kk?urar|kk?ura|kk?ira|kk?aranga|kk?irom|chen|chitten)\b|after\s*drinking|drinking\s*(habit|problem|too\s*much|a\s*lot)|\bdrink(s|ing)?\b(?!\s*(more\s*|enough\s*|plenty\s*of\s*|lots\s*of\s*)?(water|juice|tea|coffee|milk|fluids|soup))(?!.{0,25}\b(water|juice|tea|coffee|milk|fluids)\b).{0,25}(a\s*lot|too\s*much|heavily|daily|every\s*(day|night)|beer|whisk|brandy|\brum\b|vodka|wine|\bpegs?\b)|\bdrinkers?\b|\bdrunk\b|\bbooze|\bbeers?\b|whiske?y|brandy|\brum\b|vodka|liquor|\bpegs?\b|hangover|sarakk?u|thanni\s*adi|tasmac|kudi\s*(pazhakkam|palakkam)|kudikaa?ran|மது|சாராய/i,
    tips:[
      { text:'Set a limit before starting to drink, and keep to it; taking only a fixed amount of money helps.', kind:'lifestyle' },
      { text:'Have several drink-free days every week.', kind:'lifestyle' },
      { text:'Eat something and drink water first, and alternate every alcoholic drink with a glass of water.', kind:'lifestyle' },
      { text:'Choose smaller or lower-strength drinks, and cut back a little each day.', kind:'lifestyle' },
      { text:'Tell friends and family about cutting down, so they can support it.', kind:'lifestyle' }
    ],
    doctor:'If drinking feels hard to control, or there is shaking, sweating, anxiety or poor sleep when cutting down, please see a doctor.',
    // always said: stopping suddenly after heavy drinking can be dangerous (NHS), and where to get free help
    footer:'If someone drinks heavily every day, stopping suddenly can be dangerous, so a doctor should help them cut down safely. India\'s free de-addiction helpline is 14446.',
    productNotes:{ 'liver-booster':'It cannot undo the effects of heavy drinking; drinking less is what helps the liver most.' },
    sources:['https://www.nhs.uk/live-well/alcohol-advice/tips-on-cutting-down-alcohol/', 'https://www.nhs.uk/conditions/alcohol-misuse/', 'https://dot.gov.in/node/18785']
  },
  {
    id:'pollution', label:'air pollution and dust', products:['pulmoclear'],
    match:/pollut|\bsmog\b|\baqi\b|air\s*quality|\bdust(y)?\b|fumes|(traffic|vehicle|exhaust|bus)\s*smoke|(vehicle|car|bus|traffic|lots\s*of|diesel)\s*exhaust\b|near\s*(a\s*|the\s*)?(highway|main\s*road|factory)|(breathe|breathing|inhal\w*)\s+(\w+\s+)?smoke|construction\s*(site|work|dust)|factory\s*(smoke|dust|work)|dhool|thoosi|தூசி|மாசு/i,
    tips:[
      { text:'On high-pollution days, change when and where you go out: avoid busy roads and peak traffic times when you can.', kind:'lifestyle' },
      { text:'Keep exercising, but choose cleaner times and places, away from heavy traffic.', kind:'lifestyle' },
      { text:'Keep the air at home clean: no smoking indoors, and let fresh air in or use a kitchen exhaust when cooking.', kind:'lifestyle' }
    ],
    doctor:'If you have asthma, a lung or heart condition, or are pregnant, ask your doctor how best to protect yourself on high-pollution days. Trouble breathing needs urgent help.',
    sources:['https://www.who.int/news-room/questions-and-answers/item/air-pollution-personal-interventions-and-risk-communication']
  },
  {
    // lung health, NOT lung disease: asthma / COPD are conditions with no product (see advisor-rules.js), and
    // breathing difficulty, chest tightness and coughing blood are emergencies or warning signs that run first
    id:'lungs', label:'lung health', products:['pulmoclear'], alwaysDoctor:true,
    match:/\blungs?\b|respirat\w*|breathing\s*(problems?|issues?|troubles?|difficult\w*|kashtam\w*)|(hard|difficult|tough)\s*to\s*breathe|support\s*(my\s*)?breathing|breathless\w*|moochu\s*(vida|vidarathu)?\s*kashtam\w*|nurai\s*eeral|nuraiyeeral|breath(ing)?\s*(feels?\s*)?(heavy|weak|tight)|chest\s*feels?\s*congested|lung\s*(health|problem|weak)|weak\s*lungs?|நுரையீரல்/i,
    tips:[
      { text:'Protect your lungs by staying away from tobacco smoke, dust and indoor air pollution.', kind:'lifestyle' },
      { text:'Stay active, like walking or cycling, but avoid exercising outdoors on very hot or very cold days.', kind:'lifestyle' },
      { text:'Keep warm and drink plenty of fluids.', kind:'lifestyle' },
      { text:'Check the air quality, and plan outdoor activity around days when the air is poor.', kind:'lifestyle' }
    ],
    doctor:'If you get breathless, wheezy or tight in the chest, or have a cough lasting more than 3 weeks, please see a doctor. If you already have a lung condition, keep using your prescribed treatment exactly as your doctor advised.',
    sources:['https://www.england.nhs.uk/london/wp-content/uploads/sites/8/2022/07/TOP-TIPS-FOR-LUNG-HEALTH-v3.1.pdf', 'https://www.nhs.uk/conditions/common-cold/']
  },
  {
    id:'immunity', label:'falling sick often', products:['pulmoclear'],
    match:/immun|fall(ing)?\s*sick\s*(often|a\s*lot|frequently|easily|again)|get(ting)?\s*sick\s*(often|easily|a\s*lot|again\s*and\s*again)|catch(ing)?\s*(colds?|infections?)\s*(often|easily|a\s*lot)|always\s*(getting\s*)?(sick|cold)|adikadi\s*(sali|kaaichal|udambu\s*sari\s*illa)/i,
    tips:[
      { text:'Wash your hands often with soap and warm water.', kind:'lifestyle' },
      { text:'Try not to touch your eyes and nose, and do not share cups or towels with someone who has a cold.', kind:'lifestyle' },
      { text:'Keep fit and healthy: balanced meals, enough sleep and regular activity.', kind:'lifestyle' }
    ],
    doctor:'If you catch infections very often, or they take a long time to clear, please see a doctor.',
    sources:['https://www.nhs.uk/conditions/common-cold/']
  },
  {
    id:'headache', label:'headaches', products:[],
    match:/headache|head\s*ache|head\s*pain|thal(a|ai)\s+(\w+\s+){0,2}(vali|valikuthu|valikudhu)|thalaivali|தலை\s*வலி|தலைவலி/i,
    tips:[
      { text:'Drink plenty of water through the day.', kind:'lifestyle' },
      { text:'Do not skip meals, even if you do not feel hungry.', kind:'lifestyle' },
      { text:'Take regular breaks from screens to rest your eyes.', kind:'lifestyle' },
      { text:'Try to relax, as stress can make headaches worse.', kind:'lifestyle' }
    ],
    doctor:'If headaches keep coming back, are getting worse, or self-care is not helping, please see a doctor. Get urgent help if a headache comes with vision problems or vomiting, or is set off by coughing, sneezing or bending down.',
    sources:['https://www.nhs.uk/conditions/headaches/']
  },
  {
    id:'acidity', label:'acidity or heartburn', products:[],
    match:/acidity|(stomach|tummy)\s*(pain|ache|upset)\s*after\s*(eating|food|meals?|lunch|dinner)|(after|from)\s*(eating\s*)?(outside|hotel|street)\s*food|acid\s*reflux|reflux|heartburn|indigestion|gas\s*trouble|bloat|heavy\s*(after|stomach)|oily\s*food|fatty\s*food|nenju\s*erichal|vayiru\s*erichal|(?<!(urine|moothiram|mootharam|uchaa|pee)(\s*la)?\s+)erichal|நெஞ்செரிச்சல்/i,
    tips:[
      { text:'Eat smaller meals more often, instead of big ones.', kind:'lifestyle' },
      { text:'Avoid eating in the 3 to 4 hours before bed.', kind:'lifestyle' },
      { text:'Notice which foods or drinks set it off, such as spicy, oily or fried food, coffee or alcohol, and cut down on them.', kind:'lifestyle' },
      { text:'Avoid clothes that are tight around your waist.', kind:'lifestyle' }
    ],
    doctor:'If you have it most days, it is getting worse, food feels stuck when you swallow, you are often sick, or you are losing weight without trying, please see a doctor. Chest pain needs urgent help: call 112.',
    sources:['https://www.nhs.uk/conditions/heartburn-and-acid-reflux/']
  },
  {
    id:'cold', label:'a cold or cough', products:['pulmoclear'],
    match:/common\s*cold|\b(monsoon|seasonal|rainy\s*season|winter|weather)\s*(cold|cough|flu)\b|\ba\s*cold\b|\bhave\s*(a\s*)?cold\b|caught\s*(a\s*)?cold|cold\s*(and|&)\s*cough|runny\s*nose|blocked\s*nose|stuffy\s*nose|sore\s*throat|throat\s*pain|cough|sneez|congestion|tickl\w*|thummal|mookk?adaip+u|mooku\s*(ozhuguthu|adaippu|adaikuthu)|sali\s*pidi\w*|jaladosh|jalathosh|\bsali\b|irumal|thondai\s*vali|ஜலதோஷ|இருமல்|சளி/i,
    tips:[
      { text:'Rest well and drink plenty of fluids, like water.', kind:'lifestyle' },
      { text:'Sip warm water or warm fluids to soothe a tickle in the throat or chest.', kind:'lifestyle' },
      { text:'For a blocked nose, breathe in steam, for example by sitting in the bathroom with a hot shower running.', kind:'lifestyle' },
      { text:'Sip a warm lemon and honey drink to soothe a sore throat (never give honey to babies under 1 year).', kind:'food', uses:['lemon', 'honey'], sugar:true },
      { text:'Adults can gargle with salt water for a sore throat.', kind:'food', uses:['salt'], adult:true }
    ],
    doctor:'If a high temperature lasts more than 3 days, symptoms get worse or do not improve after 10 days, a cough lasts more than 3 weeks, or you feel short of breath, please see a doctor. With diabetes or another long-term condition, see a doctor sooner.',
    sources:['https://www.nhs.uk/conditions/common-cold/']
  },
  {
    id:'constipation', label:'constipation', products:[],
    match:/constipat|hard\s*stool|motion\s*(pogala|varala|aagala|problem)|malachikkal|malachikal|malasikkal|மலச்சிக்கல்/i,
    tips:[
      { text:'Drink plenty of water through the day.', kind:'lifestyle' },
      { text:'Slowly add more fibre: fruit, vegetables, oats and whole grains.', kind:'food' },
      { text:'Be more active, like a daily walk.', kind:'lifestyle' },
      { text:'Do not hold it in when you feel the urge, and keep a regular toilet time.', kind:'lifestyle' }
    ],
    doctor:'If it is not improving, keeps coming back, or comes with blood in your stool, tummy pain, or weight loss without trying, please see a doctor.',
    sources:['https://www.nhs.uk/conditions/constipation/']
  },
  {
    id:'eyes', label:'tired or sore eyes', products:[],
    match:/\beyes?\b.{0,25}(pain|strain|tired|sore|dry|ache|hurt|burn|itch|irritat|watering)|(pain|strain|tired|sore|dry|aching|burning|itchy)\w*\s*(in\s*(my\s*)?)?eyes?\b|eye\s*(pain|strain)|kann?u\s+(\w+\s+){0,2}(vali|(?<!(urine|moothiram|mootharam|uchaa|pee)(\s*la)?\s+)erichal|valikuthu|valikudhu|erikuthu|erikudhu)|கண்\s*வலி/i,
    tips:[
      { text:'Take regular breaks to rest your eyes when using a screen or watching TV.', kind:'lifestyle' },
      { text:'Keep your computer screen just below eye level.', kind:'lifestyle' },
      { text:'Avoid spending long hours in smoky, dusty or dry places, or in strong air-conditioning.', kind:'lifestyle' },
      { text:'If you wear contact lenses, switch to glasses for a while to rest your eyes.', kind:'lifestyle' }
    ],
    doctor:'If your eyes stay sore or dry for a few weeks, please see an optician or doctor. Get urgent help if the eye is painful and red, your vision changes, or it hurts to look at light.',
    sources:['https://www.nhs.uk/conditions/dry-eyes/']
  },
  {
    id:'back', label:'back pain', products:[],
    match:/back\s*(pain|ache|vali|stiff)|backache|lower\s*back|(muthugu|mudhugu|idupu|iduppu)\s+(\w+\s+){0,2}(vali|valikuthu|valikudhu)|முதுகு\s*வலி/i,
    tips:[
      { text:'Keep moving and carry on with your daily activities as much as you can; staying in bed for long can slow recovery.', kind:'lifestyle' },
      { text:'For stiffness, a heat pack or hot water bag wrapped in a towel can help.', kind:'heat', uses:['heat'] },
      { text:'For pain or swelling, an ice pack or a bag of frozen peas wrapped in a towel can help.', kind:'cold', uses:['ice'] },
      { text:'Gentle back stretches, walking, swimming or yoga can help; stop if the pain gets worse.', kind:'lifestyle' }
    ],
    doctor:'If it has not improved after a few weeks, stops you doing daily activities, is worse at night, or comes with weight loss or feeling feverish, please see a doctor.',
    sources:['https://www.nhs.uk/conditions/back-pain/']
  },
  {
    id:'joints', label:'joint pain', products:[],
    match:/joint\s*pain|joints?\s*(ache|hurt|stiff)|\b(knees?|ankles?|wrists?|elbows?|shoulders?|hips?)\b\s*(pain|ache|vali|hurts?|is\s*hurting|are\s*hurting|sore|stiff)|(pain|ache|hurt\w*)\s*(in\s*)?(my\s*)?\b(knees?|ankles?|wrists?|elbows?|shoulders?|hips?)\b|(mootu|muttu|moottu|kaal\s*muttu)\s+(\w+\s+){0,2}(vali|valikuthu|valikudhu)|மூட்டு\s*வலி/i,
    tips:[
      { text:'Rest the joint when you can, but keep gently moving it rather than stopping completely.', kind:'lifestyle' },
      { text:'An ice pack or a bag of frozen peas wrapped in a towel, for up to 20 minutes every 2 to 3 hours, can ease pain.', kind:'cold', uses:['ice'] },
      { text:'Regular exercise and a healthy, balanced diet help your joints.', kind:'lifestyle' },
      { text:'Keeping to a healthy weight takes strain off your joints.', kind:'lifestyle' }
    ],
    doctor:'If pain or swelling is getting worse or keeps coming back, has not improved after 2 weeks, or the joint stays stiff for more than 30 minutes after waking, please see a doctor.',
    sources:['https://www.nhs.uk/conditions/joint-pain/']
  },
  {
    id:'acne', label:'pimples', products:[],
    match:/pimple|acne|\bspots?\s*on\s*(my\s*)?(face|skin)|breakout|paru|பரு/i,
    tips:[
      { text:'Wash your skin twice a day with a gentle cleanser.', kind:'lifestyle' },
      { text:'Remove make-up at the end of the day, and choose skincare and make-up labelled non-comedogenic (they do not clog pores).', kind:'lifestyle' },
      { text:'Try not to pick or squeeze spots, as it can leave scars.', kind:'lifestyle' },
      { text:'Do not scrub your skin, as it can make acne worse.', kind:'lifestyle' }
    ],
    doctor:'If it is not improving, the spots are deep, painful or leaving scars, or it is affecting how you feel, a pharmacist or doctor can suggest stronger options.',
    sources:['https://www.nhs.uk/conditions/acne/']
  },
  {
    id:'hair', label:'hair fall', products:[],
    match:/hair\s*(fall|loss|falling|thinning)|losing\s*(my\s*)?hair|mudi\s*(kottuthu|kottudhu|uthiruthu|udhiradhu)|முடி\s*உதிர/i,
    tips:[
      { text:'Hair fall is often temporary, for example after an illness, stress or weight loss, and the hair usually grows back once you recover.', kind:'lifestyle' },
      { text:'Look after your general health with balanced meals, good sleep and ways to manage stress.', kind:'lifestyle' },
      { text:'If it is upsetting you, talking to others who have been through it can help.', kind:'lifestyle' }
    ],
    doctor:'If you are worried about it or it is affecting how you feel, a doctor can help find the cause, which is worth doing before spending on hair clinics.',
    sources:['https://www.nhs.uk/conditions/hair-loss/']
  },
  {
    id:'ulcer', label:'mouth ulcers', products:[],
    match:/mouth\s*ulcers?|ulcers?\s*in\s*(my\s*)?mouth|canker|vaai\s*pun|vaipun|வாய்\s*புண்/i,
    tips:[
      { text:'Use a soft-bristled toothbrush.', kind:'lifestyle' },
      { text:'Eat softer foods, and drink cool drinks through a straw.', kind:'food' },
      { text:'Avoid very spicy, salty or acidic food, rough crunchy food, and very hot drinks.', kind:'lifestyle', uses:['salt'] }
    ],
    doctor:'If an ulcer lasts more than 3 weeks, keeps getting bigger, bleeds, or becomes more painful and red, please see a dentist or doctor.',
    sources:['https://www.nhs.uk/conditions/mouth-ulcers/']
  },
  {
    id:'nausea', label:'feeling sick', products:[],
    match:/nause|feel(ing|s)?\s*(a\s*(bit|little)\s*|little\s*|kind\s*of\s*|so\s*|very\s*)?sick|queasy|vomit\w*\s*feel|vaanthi\s*(varra|vara|varuthu)\s*maari|kumattal|குமட்டல்/i,
    tips:[
      { text:'Get some fresh air, and take regular small sips of a cold drink.', kind:'lifestyle' },
      { text:'Eat smaller meals more often, and avoid strong-smelling, fried or greasy food.', kind:'lifestyle' },
      { text:'Try not to lie down soon after eating, and avoid tight clothes around your tummy.', kind:'lifestyle' },
      { text:'Ginger or peppermint tea may help settle your stomach.', kind:'food', uses:['ginger', 'peppermint'] }
    ],
    doctor:'If you still feel sick after a few days, or it keeps coming back, please see a doctor. If you are also vomiting, keep sipping fluids so you do not get dehydrated.',
    sources:['https://www.nhs.uk/conditions/feeling-sick-nausea/']
  },
  {
    id:'fever', label:'a mild fever', products:[], alwaysDoctor:true,
    match:/(?<!hay\s+)\bfever\b|temperature|kaaichal|kaichal|காய்ச்சல்/i,
    tips:[
      { text:'Get plenty of rest.', kind:'lifestyle' },
      { text:'Drink plenty of fluids, mainly water, so you do not get dehydrated.', kind:'lifestyle' },
      { text:'Stay at home and away from others until the temperature has gone.', kind:'lifestyle' }
    ],
    // India: a fever lasting more than 2 days should be checked (dengue, malaria, typhoid are common)
    doctor:'If the temperature is very high, getting worse, not improving with rest, or lasts more than 2 days, please see a doctor.',
    sources:['https://www.nhs.uk/conditions/fever-in-adults/']
  },
  {
    id:'dandruff', label:'dandruff', products:[],
    match:/dandruff|flaky\s*scalp|itchy\s*scalp|podugu|பொடுகு/i,
    tips:[
      { text:'Use an anti-dandruff shampoo from a pharmacy or supermarket, and give it up to 4 weeks to work.', kind:'lifestyle' },
      { text:'If the first shampoo does not help, try a different anti-dandruff shampoo.', kind:'lifestyle' },
      { text:'Wash your hair regularly; dandruff is not caused by poor hygiene, but it shows more if hair is not washed often.', kind:'lifestyle' }
    ],
    doctor:'If it has not improved after 4 weeks of anti-dandruff shampoo, or your scalp is red, swollen or very itchy, please see a pharmacist or doctor.',
    sources:['https://www.nhs.uk/conditions/dandruff/']
  },
  {
    id:'smoking', label:'quitting smoking or tobacco', products:['breathefree', 'pulmoclear'],
    // smoking, beedi, chewing tobacco, gutka, hookah, vaping; smoking also affects the lungs, so PulmoClear is suggested too
    // ("traffic smoke", "breathe factory smoke" is pollution, not smoking)
    match:/(?<!\b(traffic|vehicle|factory|exhaust|chimney|kitchen|wood|fire|bus|breathe|breathing|inhale|inhaling)\s+)smok(?!e\s+from\s+(traffic|vehicles?|factor))|\bcig\w*|\bsig(a|e)ret\w*|\bpuffs?\b|\bbeedi|\bbidi|tobacco|nicotine|gutka|gutkha|pan\s*masala|\bkhaini\b|hookah|vape|vaping|quit\s*(smoking|tobacco)|thamm?\s*adik|\bcrav(e|es|ing|ings)\b|urge\s*to\s*smoke|chain\s*smok\w*|heavy\s*smok\w*|pugai|புகை/i,
    productNotes:{ pulmoclear:'It does not undo the harm of smoking; quitting is what helps your lungs most.' },
    tips:[
      { text:'Pick a quit date and plan for the moments that usually make you want to smoke or use tobacco.', kind:'lifestyle' },
      { text:'Get support: telling friends and family helps, and free counselling is available (the quit line number is added below).', kind:'lifestyle' },
      { text:'If you slip up, do not give up; refocus and keep going. Reaching 28 days tobacco-free makes you much more likely to stay quit.', kind:'lifestyle' },
      { text:'Notice your progress: your body starts to recover within days of stopping.', kind:'lifestyle' }
    ],
    doctor:'A doctor can also help with stronger support to quit.',
    footer:'For free support, you can call India\'s National Tobacco Quit Line on 1800 112 356 (counselling in many languages).',
    sources:['https://www.nhs.uk/better-health/quit-smoking/', 'https://ntcp.mohfw.gov.in/national_tobacco_quit_line_services']
  }
];

// extra topics from public health guidance (November 2026): conditions and everyday problems
CONCERNS.push(...MORE_CONCERNS);

export { CONCERNS };
