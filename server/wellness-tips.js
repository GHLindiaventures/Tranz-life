// APPROVED WELLNESS TIPS: the only health advice Tulsi is allowed to give.
//
// Every tip below is reworded from public health guidance (sources listed on each concern) and was checked
// against those pages in November 2026. Tulsi never invents remedies: code picks the concern, the model only
// rephrases these tips warmly, and server/reply-check.js rejects any reply that adds other remedies.
//
// Before changing anything here:
//   - keep tips to simple, low-risk self-care that the source itself recommends
//   - never add herb doses, medicines, oils, fasting/detox plans, or anything to swallow for children or in pregnancy
//   - add the source link, and add a test in tests/server/
//   - ideally have a qualified person (BAMS doctor / pharmacist) read the change
//
// Tip fields:
//   kind    'lifestyle' (habits, rest, movement), 'heat' (warmth on the body), 'food' (anything eaten, drunk or gargled)
//   uses    remedy words this tip may use (see REMEDIES in reply-check.js); anything else in a reply is rejected
//   sugar   contains sugar or honey (dropped when diabetes is mentioned)
//   adult   adults only (dropped for children)

const CONCERNS = [
  {
    id:'period', label:'period cramps', product:'rollon',
    // pain or cramps must be mentioned: late, missed or irregular periods are not this topic (they need a doctor)
    match:/(period|menstrua|menses|mensus|maadhavidai|maathavidai|matha\s*vidai|பீரியட்|மாதவிடாய்).{0,45}(pain|painful|cramp|ache|hurt|discomfort|vali|வலி)|(pain|painful|cramp|ache|hurt|vali|வலி)\w*.{0,45}(period|menstrua|menses|maadhavidai|மாதவிடாய்)|\bcramps?\b|\bpms\b|month(ly)?\s*(pain|cramp)/i,
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
    id:'stress', label:'stress', product:'inhaler',
    match:/stress|anxious|anxiety|tension|overwhelm|restless|nervous|pathattam|padapadappu|mana\s*azhutham|மன\s*அழுத்த|பதட்ட/i,
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
    id:'sleep', label:'trouble sleeping', product:null,
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
    id:'feet', label:'dry or cracked feet', product:'reviva',
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
      doctor:'With diabetes, any cut, blister, colour change, swelling or loss of feeling in the feet should be shown to a doctor as soon as possible, without waiting for the routine check.'
    },
    sources:['https://www.diabetes.org.uk/guide-to-diabetes/complications/feet/taking-care-of-your-feet']
  },
  {
    id:'tired', label:'tiredness', product:'gummies',
    match:/tired(?!.{0,20}\b(feet|foot|kaal)\b)|fatigue|exhaust|no\s*energy|low\s*energy|energy\s*(illa|ille|kammi|kuraivu)|weak(ness)?\b|run\s*down|sorv|soarv|kalaippu|kalaipa|சோர்வ|களைப்பு/i,
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
    id:'liver', label:'liver care', product:'liver',
    match:/\bliver\b|\bdetox|kalleeral|kalleral|கல்லீரல்/i,
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
    id:'headache', label:'headaches', product:null,
    match:/headache|head\s*ache|head\s*pain|thalai\s*vali|thalaivali|thala\s*vali|தலை\s*வலி|தலைவலி/i,
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
    id:'acidity', label:'acidity or heartburn', product:null,
    match:/acidity|acid\s*reflux|reflux|heartburn|indigestion|gas\s*trouble|bloat|heavy\s*(after|stomach)|oily\s*food|fatty\s*food|nenju\s*erichal|vayiru\s*erichal|erichal|நெஞ்செரிச்சல்/i,
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
    id:'cold', label:'a cold or cough', product:null,
    match:/common\s*cold|\ba\s*cold\b|\bhave\s*(a\s*)?cold\b|caught\s*(a\s*)?cold|cold\s*(and|&)\s*cough|runny\s*nose|blocked\s*nose|stuffy\s*nose|sore\s*throat|throat\s*pain|cough|sneez|jaladosh|jalathosh|\bsali\b|irumal|thondai\s*vali|ஜலதோஷ|இருமல்|சளி/i,
    tips:[
      { text:'Rest well and drink plenty of fluids, like water.', kind:'lifestyle' },
      { text:'For a blocked nose, breathe in steam, for example by sitting in the bathroom with a hot shower running.', kind:'lifestyle' },
      { text:'Sip a warm lemon and honey drink to soothe a sore throat (never give honey to babies under 1 year).', kind:'food', uses:['lemon', 'honey'], sugar:true },
      { text:'Adults can gargle with salt water for a sore throat.', kind:'food', uses:['salt'], adult:true }
    ],
    doctor:'If a high temperature lasts more than 3 days, symptoms get worse or do not improve after 10 days, a cough lasts more than 3 weeks, or you feel short of breath, please see a doctor. With diabetes or another long-term condition, see a doctor sooner.',
    sources:['https://www.nhs.uk/conditions/common-cold/']
  },
  {
    id:'constipation', label:'constipation', product:null,
    match:/constipat|hard\s*stool|motion\s*(pogala|varala|aagala|problem)|malachikkal|malachikal|malasikkal|மலச்சிக்கல்/i,
    tips:[
      { text:'Drink plenty of water through the day.', kind:'lifestyle' },
      { text:'Slowly add more fibre: fruit, vegetables, oats and whole grains.', kind:'food' },
      { text:'Be more active, like a daily walk.', kind:'lifestyle' },
      { text:'Do not hold it in when you feel the urge, and keep a regular toilet time.', kind:'lifestyle' }
    ],
    doctor:'If it is not improving, keeps coming back, or comes with blood in your stool, tummy pain, or weight loss without trying, please see a doctor.',
    sources:['https://www.nhs.uk/conditions/constipation/']
  }
];

export { CONCERNS };
