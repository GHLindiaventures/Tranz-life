// MORE APPROVED WELLNESS TIPS: extra topics for Tulsi, same rules and schema as server/wellness-tips.js.
//
// Every tip is reworded from the public health page(s) listed in `sources` (opened and checked in November 2026).
// Only simple, low-risk self-care that the source itself recommends: no herbs, supplements, doses, medicines, oils,
// diets or fasting, and nothing to swallow for babies, children or in pregnancy. Products are mapped separately.
//
// Extra topic fields (besides those described in wellness-tips.js):
//   kind      'everyday' (common, usually self-limiting) or 'condition' (a diagnosed or long-term medical condition)
//   urgent    one plain sentence with the signs that need emergency help now (112 / hospital), or null
//   doctor    when to see a doctor; for 'condition' topics alwaysDoctor is set and the line is phrased as care
//
// MORE_EXAMPLES holds example visitor messages per topic id (same use as CONCERN_EXAMPLES in intents.js).
// Keep emergencies and warning signs out of the examples: they are decided by the regex rules, which run first.

const MORE_CONCERNS = [
  // ---------------------------------------------------------------- long-term conditions
  {
    id:'bp', label:'high blood pressure', kind:'condition', products:[], alwaysDoctor:true,
    match:/high\s*(bp|blood\s*pressure)|(?<!low\s{0,3})(\bbp\b|blood\s*pressure)(?!\s*(\w+\s*){0,2}(low|kuraiv|kammi|down|drop\w*|9\d\s*(by|\/)\s*[5-6]\d))|hypertension|pressure\s*(maathirai|tablet|patient)|\bku\s*pressure\s*iruk|(ரத்த|இரத்த)\s*அழுத்த/i,
    tips:[
      { text:'Cut back on salt, and eat a healthy, balanced diet.', kind:'food', uses:['salt'] },
      { text:'Be active regularly, aiming for about 150 minutes a week, like brisk walking.', kind:'lifestyle' },
      { text:'Keep alcohol low, cut down on coffee and tea, and stop smoking if you smoke.', kind:'lifestyle' },
      { text:'If you are overweight, losing some weight helps.', kind:'lifestyle' }
    ],
    urgent:'Sudden chest pain or pressure, pain spreading to the arm, neck, jaw or back, or chest pain with sweating, sickness or breathlessness needs emergency help now: call 112.',
    doctor:'Please keep up regular blood pressure checks with the doctor and take any prescribed tablets exactly as advised. If you are 40 or over and have not had it checked in a few years, a check is a good idea.',
    sources:['https://www.nhs.uk/conditions/high-blood-pressure/']
  },
  {
    id:'lowbp', label:'low blood pressure', kind:'everyday', products:[],
    match:/low\s*(bp|blood\s*pressure)|(bp|blood\s*pressure)\s*(is\s*|ah\s*|romba\s*|goes\s*|keeps\s*)?(low|kuraiv|kammi|down|drop|dropp\w*)|hypotension/i,
    tips:[
      { text:'Get up slowly: from lying, sit for a moment first, then stand.', kind:'lifestyle' },
      { text:'Drink more water through the day, and keep alcohol low.', kind:'food' },
      { text:'Eat smaller meals more often, and sit still for a little while after eating.', kind:'food' },
      { text:'Avoid standing or sitting still for long, bending down, or changing position suddenly.', kind:'lifestyle' }
    ],
    urgent:null,
    doctor:'If you keep feeling dizzy or faint, or have fainted, please see a doctor and get your blood pressure checked.',
    sources:['https://www.nhs.uk/conditions/low-blood-pressure-hypotension/']
  },
  {
    id:'diabetes', label:'diabetes', kind:'condition', products:['reviva'], alwaysDoctor:true,
    match:/diabet|daibet|blood\s*sugar|sugar\s*(level|iruk|patient|problem|athigam|jaasthi|high|test|disease|noi|vyadhi|complaint)|high\s*sugar|sugar\s*(ah|aa)\s*iruk|sakkarai\s*(noi|vyadhi|iruk)|சர்க்கரை\s*நோய்|நீரிழிவு|hba1c|insulin/i,
    tips:[
      { text:'Eat plenty of vegetables, fruit, whole grains and pulses, and cut down on processed food high in salt and sugar; make changes slowly, one small step at a time.', kind:'food', uses:['salt'] },
      { text:'Be active across the week, for at least two and a half hours in total, like brisk walking.', kind:'lifestyle' },
      { text:'Stop smoking if you smoke, and keep alcohol low.', kind:'lifestyle' },
      { text:'Check your feet every day for cuts, blisters or colour changes.', kind:'lifestyle' }
    ],
    urgent:'If someone with diabetes becomes confused, is not responding normally, has a fit or passes out, call 112 now.',
    doctor:'Please keep up regular diabetes check-ups with the doctor, including the blood test every few months and the yearly eye and foot checks, and take any medicine exactly as prescribed. Do not start a very strict diet without asking the doctor first.',
    sources:['https://www.nhs.uk/conditions/type-2-diabetes/treatment/', 'https://www.nhs.uk/conditions/low-blood-sugar-hypoglycaemia/']
  },
  {
    id:'thyroid', label:'thyroid problems', kind:'condition', products:[], alwaysDoctor:true,
    match:/thyroid|thyriod|thairoid|thyroxin|\btsh\b|goit(re|er)|தைராய்டு/i,
    tips:[
      { text:'Keep taking your thyroid tablets exactly as the doctor prescribed.', kind:'lifestyle' },
      { text:'Go for your regular blood tests, so the doctor can check the dose is right for you.', kind:'lifestyle' },
      { text:'Tell the doctor about any side effects, or if you are pregnant or planning a pregnancy.', kind:'lifestyle' }
    ],
    urgent:null,
    doctor:'Please keep up regular check-ups with the doctor. If you have symptoms like a fast or uneven heartbeat, shaking, weight changes, feeling very cold or very hot, or a swelling in the neck, please see them soon.',
    sources:['https://www.nhs.uk/conditions/underactive-thyroid-hypothyroidism/', 'https://www.nhs.uk/conditions/overactive-thyroid-hyperthyroidism/']
  },
  {
    id:'kidney', label:'kidney health', kind:'condition', products:[], alwaysDoctor:true,
    match:/(?<!stones?\s*in\s*(my\s*|the\s*|his\s*|her\s*)?)kidney(?!\s*(la\s*)?(stones?|kal))|kidni|creatinine|creatinin|\bckd\b|dialysis|\brenal\b(?!\s*(stone|calcul))|siruneeragam|சிறுநீரக(?!\s*கல்)/i,
    tips:[
      { text:'Eat a balanced diet with plenty of fruit and vegetables, and keep salt, sugar and fatty food low.', kind:'food', uses:['salt'] },
      { text:'Stay active, aiming for about 150 minutes a week, and stop smoking if you smoke.', kind:'lifestyle' },
      { text:'Keep alcohol low.', kind:'lifestyle' },
      { text:'Do not take pain relief tablets more often, or for longer, than the label or the doctor says.', kind:'lifestyle' }
    ],
    urgent:null,
    doctor:'Please keep up regular check-ups with the doctor, especially with diabetes or high blood pressure, and take prescribed medicines as advised. See them soon if you notice swollen ankles, feet or hands, blood in the urine, or feel unusually tired or breathless.',
    sources:['https://www.nhs.uk/conditions/kidney-disease/', 'https://www.nhs.uk/conditions/kidney-disease/prevention/']
  },
  {
    id:'kidneystone', label:'kidney stones', kind:'condition', products:[], alwaysDoctor:true,
    match:/kidney\s*(la\s*)?stones?|stones?\s*in\s*(my\s*|the\s*|his\s*|her\s*)?kidney|renal\s*(stone|calcul)|urinary\s*stone|kal\s*adaippu|siruneeraga\s*kal|kidney\s*la\s*kal|சிறுநீரக\s*கல்/i,
    tips:[
      { text:'Drink plenty of water through the day, enough that your pee stays pale.', kind:'food' },
      { text:'Cut down on fizzy, caffeinated and alcoholic drinks.', kind:'food' },
      { text:'Keep salt low in your food.', kind:'food', uses:['salt'] }
    ],
    urgent:'Very severe pain, or pain with a high temperature or shivering, needs urgent help today: go to a hospital.',
    doctor:'Please see a doctor if you think you have a kidney stone, and before making big changes to what you eat.',
    sources:['https://www.nhs.uk/conditions/kidney-stones/']
  },
  {
    id:'cholesterol', label:'high cholesterol', kind:'condition', products:[], alwaysDoctor:true,
    match:/cholest|cholestrol|kolest|\bldl\b|triglycerid|lipid\s*profile|கொலஸ்ட்ரால்/i,
    tips:[
      { text:'Eat less fatty meat, butter, cream, cheese, cakes and biscuits, and more whole grains, fruit and vegetables.', kind:'food' },
      { text:'Be active for about 150 minutes a week, like brisk walking, swimming or cycling; pick something you enjoy so you keep it up.', kind:'lifestyle' },
      { text:'Stop smoking if you smoke.', kind:'lifestyle' },
      { text:'Keep alcohol low, with several alcohol-free days each week.', kind:'lifestyle' }
    ],
    urgent:null,
    doctor:'Please keep up regular check-ups and blood tests with the doctor, and take any prescribed medicine exactly as advised.',
    sources:['https://www.nhs.uk/conditions/high-cholesterol/', 'https://www.nhs.uk/conditions/high-cholesterol/how-to-lower-your-cholesterol/']
  },
  {
    id:'pcos', label:'PCOS', kind:'condition', products:[], alwaysDoctor:true,
    match:/\bpc\s*o\s*[sd]\b|\bpcod\b|\bpcos\b|polycystic|poly\s*cystic|\bpmos\b|சினைப்பை\s*நீர்க்கட்டி/i,
    tips:[
      { text:'Eat a healthy, balanced diet.', kind:'food' },
      { text:'Exercise regularly.', kind:'lifestyle' },
      { text:'If you are overweight, losing some weight can help with symptoms.', kind:'lifestyle' },
      { text:'If it is getting you down or making you worried, talking to someone, or to a counsellor, can help.', kind:'lifestyle' }
    ],
    urgent:null,
    doctor:'Please keep in touch with the doctor about it, and see them soon if symptoms are affecting your daily life, your periods change, or you are trying to get pregnant.',
    sources:['https://www.nhs.uk/conditions/polycystic-ovary-syndrome-pcos/']
  },
  {
    id:'irregular', label:'irregular or missed periods', kind:'everyday', products:[], alwaysDoctor:true,
    match:/irregular\s*(period|cycle|mens|menses|chums)|(period|periods|mensus|menses|chums)\s*(is\s*|are\s*|has\s*|have\s*)?(late|delayed|irregular|not\s*coming|not\s*regular|stopped|missed|varala|varalai|varavillai|thalli|thalli\s*pogu\w*|sariya\s*varala|olunga\s*varala)|missed\s*(my\s*|her\s*)?(period|periods|mensus)|(no|delayed|late)\s*periods?\b|period\s*(skip|miss)|maadhavidai\s*(thalli|sariya|olunga)|மாதவிடாய்\s*(தள்ளி|சரியாக|ஒழுங்காக)/i,
    tips:[
      { text:'Keep track of your periods in an app or a diary, counting the first day of bleeding as day 1.', kind:'lifestyle' },
      { text:'Stress can upset the cycle, so make time each day to rest and relax.', kind:'lifestyle' },
      { text:'Big changes in weight, or very heavy exercise, can upset periods; aim for a steady, healthy weight and moderate activity.', kind:'lifestyle' }
    ],
    urgent:null,
    doctor:'Please see a doctor if you have missed 3 periods in a row, your usual pattern has changed, periods last longer than 7 days, you bleed between periods, or you also have weight changes, tiredness or extra facial hair. If you could be pregnant, take a pregnancy test.',
    sources:['https://www.nhs.uk/conditions/irregular-periods/', 'https://www.nhs.uk/conditions/stopped-or-missed-periods/']
  },
  {
    id:'menopause', label:'menopause symptoms', kind:'everyday', products:[],
    match:/menopaus|meno\s*pause|hot\s*flush|hot\s*flash|night\s*sweats?|periods?\s*(is\s*|are\s*)?(stopping|ending)\s*(at|in|after)|maadhavidai\s*nirut|மாதவிடாய்\s*நிறுத்த/i,
    tips:[
      { text:'For hot flushes and night sweats, wear light clothing, keep your bedroom cool, and cut down on spicy food, caffeine, hot drinks and alcohol.', kind:'lifestyle' },
      { text:'Get plenty of rest, with a regular sleep routine.', kind:'lifestyle' },
      { text:'Exercise regularly, including strength exercises, and try relaxing activities like yoga or meditation.', kind:'lifestyle' },
      { text:'Talk to friends, family or others going through the same thing.', kind:'lifestyle' }
    ],
    urgent:null,
    doctor:'If the symptoms are troubling you or affecting daily life, please talk to a doctor, as there are treatments that help. Please ask the doctor before taking any herbal or other remedy.',
    sources:['https://www.nhs.uk/conditions/menopause-and-perimenopause/things-you-can-do/']
  },
  {
    id:'anaemia', label:'low haemoglobin', kind:'condition', products:[], alwaysDoctor:true,
    match:/an(a)?emi|aneamia|low\s*(hb|hemoglobin|haemoglobin|heamoglobin|hemoglobin)|h(a|e)?emoglobin\s*(is\s*|level\s*)?(low|less|kammi|kuraiv)|\bhb\s*(is\s*|level\s*)?(low|less|kammi|kuraiv)|iron\s*deficien|blood\s*(count\s*|level\s*)?(is\s*)?(low|less)\b|ratham\s*(kammi|kuraiv|illa)|ratha\s*sogai|(ரத்த|இரத்த)\s*சோகை/i,
    tips:[
      { text:'Include foods with iron, like dark-green leafy vegetables, beans, lentils and peas, and dried fruit.', kind:'food' },
      { text:'Large amounts of tea and coffee make it harder for the body to take in iron, so go easy on them, especially around meals.', kind:'food' },
      { text:'Follow the treatment the doctor gives, for as long as they advise.', kind:'lifestyle' }
    ],
    urgent:null,
    doctor:'Please see a doctor to find the cause, and keep up the follow-up blood tests they advise.',
    sources:['https://www.nhs.uk/conditions/iron-deficiency-anaemia/']
  },
  {
    id:'asthma', label:'asthma', kind:'condition', products:[], alwaysDoctor:true,
    match:/asthma|asthama|astma|asma\b|wheez|aasthum|eosinophil|eesinophil|ஆஸ்துமா|moochu\s*izhupp|izhuppu\s*(noi|iruk)/i,
    tips:[
      { text:'Notice what sets it off, like smoke, dust, pollution, pollen, mould, pets or cold air, and avoid those triggers where you can.', kind:'lifestyle' },
      { text:'Always keep your prescribed asthma treatment with you, and use it exactly as your doctor advised.', kind:'lifestyle' },
      { text:'Stay active and keep a healthy weight; ask the doctor for advice if exercise sets it off.', kind:'lifestyle' },
      { text:'Do not smoke, and keep away from other people\'s smoke.', kind:'lifestyle' }
    ],
    urgent:'If breathing gets worse, the usual reliever treatment is not helping, or it is hard to speak or breathe, call 112 now.',
    doctor:'Please have an asthma review with the doctor at least once a year, and see them soon if you need your reliever more often, symptoms wake you at night, or they stop you doing usual activities.',
    sources:['https://www.nhs.uk/conditions/asthma/']
  },
  // ---------------------------------------------------------------- tummy
  {
    id:'stomach', label:'a stomach ache', kind:'everyday', products:[],
    // not after food (acidity) and not with periods (period)
    match:/(?<!(period|periods|mensus|menses|menstrual|chums)\w*\s.{0,30})((stomach|tummy|belly|abdomen|abdominal)\s*(pain|ache|cramp|hurts?|hurting|is\s*paining|paining)|stomachache|tummyache|vayiru\s*vali|vayitru\s*vali|vayiru\s*valikuthu|வயிற்று\s*வலி|வயிறு\s*வலி)(?!.{0,40}(period|after\s*(eat|food|meal|lunch|dinner|sapt)|mensus|chums|menstru|saptathum|saapitta))/i,
    tips:[
      { text:'Sip water or clear fluids slowly.', kind:'food' },
      { text:'Rest, and eat small, light meals when you feel like eating, avoiding fatty or fried food.', kind:'food' },
      { text:'To help prevent it, drink plenty of water, eat smaller meals more often, and stay active.', kind:'lifestyle' }
    ],
    urgent:'Sudden, severe stomach pain, vomiting blood, black or bloody stools, a hard swollen tummy, not being able to pee or pass stool at all, or pain in pregnancy needs emergency help now: call 112.',
    doctor:'If the pain does not improve in a day or two, keeps coming back, or comes with fever, vomiting, burning when passing urine, or weight loss, please see a doctor.',
    sources:['https://www.nhs.uk/conditions/stomach-ache/', 'https://medlineplus.gov/ency/article/003120.htm']
  },
  {
    id:'gas', label:'gas and wind', kind:'everyday', products:['liver-booster'],
    match:/\bgas(?!\s*(trouble|stove|cylinder|booking|connection|leak))(sy|es)?\b|flatulen|\bfart|passing\s*wind|too\s*much\s*wind|vaayu|vayu\s*(thollai|problem|pidi)|வாயு|stomach\s*(feels\s*)?(full\s*of\s*air|swollen|tight)|vayiru\s*(ubbi|ubbu|oppi|uppi|uppu)/i,
    tips:[
      { text:'Eat smaller meals more often, eat slowly with your mouth closed, and do not slouch while eating.', kind:'lifestyle' },
      { text:'Cut down on fizzy drinks, and on foods that cause gas for you, such as cabbage, beans or lentils.', kind:'food' },
      { text:'Stay active, and drink plenty of water.', kind:'lifestyle' },
      { text:'Gently massage your tummy in a circle, from right to left.', kind:'lifestyle' }
    ],
    urgent:'A swollen tummy with sudden, severe pain, or vomiting blood, needs emergency help now: call 112.',
    doctor:'If you often feel this way, it continues after changing what you eat, or comes with weight loss, blood in your stool, vomiting or fever, please see a doctor.',
    sources:['https://www.nhs.uk/conditions/bloating/']
  },
  {
    id:'diarrhoea', label:'loose motions', kind:'everyday', products:[],
    match:/diarr?h?o?e?a|diaria|loose\s*(motion|stool|potty)s?|lose\s*motion|watery\s*(stool|motion|potty)|running\s*stomach|upset\s*bowel|vayitru?\s*pokku|bedhi|பேதி|வயிற்றுப்போக்கு|motions?\s*(adikadi|neraya|athigam|frequent|poitu|pogudhu|poguthu)/i,
    tips:[
      { text:'Rest at home, and keep sipping plenty of fluids such as water, in small sips if you feel sick.', kind:'food' },
      { text:'Eat when you feel able, choosing light food and avoiding fatty or spicy food.', kind:'food' },
      { text:'Avoid fizzy drinks, as they can make it worse.', kind:'food' },
      { text:'Wash your hands well with soap and water, especially after the toilet and before eating.', kind:'lifestyle' }
    ],
    urgent:'Vomiting blood, a sudden severe tummy pain, cold or blotchy skin, confusion, or a baby or child who is very drowsy or has not peed in 12 hours needs emergency help now: call 112.',
    doctor:'If it lasts more than 7 days, there is blood in the stool, you cannot keep fluids down, or there are signs of dehydration like very dark or little pee, please see a doctor. For a baby or young child, see a doctor sooner.',
    sources:['https://www.nhs.uk/conditions/diarrhoea-and-vomiting/']
  },
  {
    id:'vomiting', label:'vomiting', kind:'everyday', products:[],
    match:/(?<!(bus|car|travel\w*|journey|payanam)\s(\w+\s){0,3})((?<!(like|feel|feels|feeling)\s{1,3})\bvomit(ing|ed|s|tting)?\b(?!\s*(feel|sensation))|throw(ing)?\s*up|threw\s*up|\bpuk(e|ed|ing)\b|vaanthi\s*(eduth|edukk|edukur|aach|aagu|vandh|vanthu|varudhu|varuthu|pannit|ah\s*varu|aayiduchu)|vandhi\s*(eduth|edukk|vanthu)|வாந்தி\s*(எடு|வருது|வந்து))(?!.{0,25}(bus|car|travel|journey|payanam))/i,
    tips:[
      { text:'Rest, and keep taking small, frequent sips of water so you do not get dehydrated.', kind:'food' },
      { text:'When you feel able to eat, start with small amounts of light food, avoiding fatty or spicy food.', kind:'food' },
      { text:'Avoid fizzy drinks.', kind:'food' }
    ],
    urgent:'Vomiting blood or something that looks like coffee grounds, green vomit, a stiff neck with pain in bright light, a sudden severe headache or tummy pain, or confusion needs emergency help now: call 112.',
    doctor:'If vomiting lasts more than 2 days, you cannot keep any fluids down, or there are signs of dehydration, please see a doctor. For a baby or young child, see a doctor sooner.',
    sources:['https://www.nhs.uk/conditions/diarrhoea-and-vomiting/', 'https://www.nhs.uk/conditions/dehydration/']
  },
  // ---------------------------------------------------------------- mouth, ears
  {
    id:'toothache', label:'toothache', kind:'everyday', products:[],
    match:/tooth\s*ache|toothache|toothpain|tooth\s*pain|(tooth|teeth)\s*(pain|ache|hurt\w*)|pain\s*in\s*(my\s*|the\s*)?(tooth|teeth|molar)|wisdom\s*tooth|pal(lu)?\s*vali|pal\s*valikuthu|பல்\s*வலி/i,
    tips:[
      { text:'Eat soft foods and try not to chew on the sore side.', kind:'food' },
      { text:'Use a soft toothbrush, and avoid flossing around the sore tooth for now.', kind:'lifestyle' },
      { text:'Avoid sugary, very hot or very cold food and drinks, and do not smoke.', kind:'lifestyle' }
    ],
    urgent:'Swelling around the eye or neck, or swelling in the mouth or neck that makes it hard to breathe, swallow or speak, needs emergency help now: go to a hospital or call 112.',
    doctor:'If the toothache lasts more than 2 days, or comes with a swollen face or jaw, fever, red gums or a bad taste, please see a dentist.',
    sources:['https://www.nhs.uk/conditions/toothache/']
  },
  {
    id:'gums', label:'bleeding gums or sensitive teeth', kind:'everyday', products:[],
    match:/(bleed\w*|swollen|sore|weak|painful)\s*gums?|gums?\s*(are\s*|is\s*)?(bleed|swell|swollen|sore|pain|problem|infection)|sensitiv\w*\s*(teeth|tooth)|(teeth|tooth)\s*(are\s*|is\s*)?(sensitiv|sensitiv\w*)|(teeth|tooth)\s*sensitivity|pal\s*(koosu|kooch|koochu)|eeru\s*(la\s*)?(ratham|blood|veekkam|vali)|ஈறு/i,
    tips:[
      { text:'Brush twice a day with a fluoride toothpaste, including last thing at night, then spit out the toothpaste rather than rinsing.', kind:'lifestyle' },
      { text:'Clean between your teeth every day with floss or small interdental brushes.', kind:'lifestyle' },
      { text:'Do not smoke.', kind:'lifestyle' },
      { text:'Have regular dental check-ups.', kind:'lifestyle' }
    ],
    urgent:null,
    doctor:'If your gums bleed, are painful or swollen, your teeth feel loose, or the sensitivity keeps bothering you, please see a dentist.',
    sources:['https://www.nhs.uk/conditions/gum-disease/', 'https://www.nhs.uk/live-well/healthy-teeth-and-gums/how-to-keep-your-teeth-clean/']
  },
  {
    id:'ear', label:'earache', kind:'everyday', products:[],
    match:/\bears?\s*(ache|pain|infection|hurt\w*|paining|is\s*paining|block\w*)|earache|ear-ache|pain\s*in\s*(my\s*|the\s*|his\s*|her\s*)?ears?\b|(kaathu|kaadhu|kadhu|kathu)\s*(vali|valikuthu|valikudhu|adaippu)|காது\s*வலி/i,
    tips:[
      { text:'Hold a warm flannel or cloth against the ear.', kind:'heat', uses:['heat'] },
      { text:'Do not put anything inside the ear, like cotton buds, and do not try to remove earwax yourself.', kind:'lifestyle' },
      { text:'Keep water out of the sore ear.', kind:'lifestyle' }
    ],
    urgent:null,
    doctor:'If earache lasts more than 2 to 3 days, keeps coming back, or comes with fever, swelling around the ear, fluid coming out, or a change in hearing, please see a doctor. For a young child, see a doctor sooner.',
    sources:['https://www.nhs.uk/conditions/earache/']
  },
  // ---------------------------------------------------------------- skin
  {
    id:'allergy', label:'allergies like hay fever', kind:'everyday', products:[],
    match:/(?<!skin\s{0,3})allerg(?!y\s*area)|hay\s*fever|pollen|allergic\s*rhinitis|ovvamai|ஒவ்வாமை/i,
    tips:[
      { text:'Shower and change your clothes after being outside, and keep windows and doors shut when the air is full of pollen or dust.', kind:'lifestyle' },
      { text:'Vacuum regularly and dust with a damp cloth.', kind:'lifestyle' },
      { text:'Wear wraparound sunglasses or a mask outdoors to keep pollen and dust out of your eyes and nose.', kind:'lifestyle' },
      { text:'Do not smoke, and stay away from smoke.', kind:'lifestyle' }
    ],
    urgent:'Sudden swelling of the lips, mouth, tongue or throat, or trouble breathing or swallowing, needs emergency help now: call 112.',
    doctor:'If symptoms are getting worse or are not improving, please see a pharmacist or doctor.',
    sources:['https://www.nhs.uk/conditions/hay-fever/']
  },
  {
    id:'rash', label:'an itchy skin or rash', kind:'everyday', products:[],
    match:/(?<!(heat|sweat|nappy|diaper|prickly)\s{0,3})\brash(es)?\b|\bhives\b|urticaria|itch(y|ing)?\s*(skin|body|all\s*over|everywhere)|skin\s*(is\s*|feels\s*)?(itch|allerg)|body\s*(is\s*)?itch|(udambu|body)\s*(full\s*ah\s*)?arip|arippu|thadippu|அரிப்பு|தடிப்பு/i,
    tips:[
      { text:'Pat or tap the skin instead of scratching, and hold something cool, like a damp cloth, on the itchy area.', kind:'lifestyle' },
      { text:'Have cool or lukewarm baths or showers, and keep them short.', kind:'lifestyle' },
      { text:'Use an unperfumed moisturiser, and avoid perfumed soaps and creams.', kind:'lifestyle' },
      { text:'Wear loose cotton clothes, and keep your nails short and clean.', kind:'lifestyle' }
    ],
    urgent:'A rash that does not fade when you press a glass on it, sudden swelling of the lips, tongue or throat, or trouble breathing needs emergency help now: call 112.',
    doctor:'If the itch is severe, covers the whole body, affects daily life, keeps coming back, or comes with a new lump or swelling, or you are pregnant, please see a doctor.',
    sources:['https://www.nhs.uk/conditions/itchy-skin/', 'https://www.nhs.uk/conditions/rashes-babies-and-children/']
  },
  {
    id:'dryskin', label:'dry skin', kind:'everyday', products:[],
    match:/dry\s*skin|skin\s*(is\s*|feels\s*|gets\s*)?(very\s*|so\s*|too\s*)?(dry|flaky|rough|scaly)|(dry|flaky|scaly)\s*(and\s*\w+\s*)?skin|skin\s*(varanda|varandu|varandi|veduchu|vedikuthu)|thol\s*(varanda|varandu|varatchi)|வறண்ட\s*தோல்|தோல்\s*வறட்சி/i,
    tips:[
      { text:'Keep baths and showers short, and use lukewarm water, not hot.', kind:'lifestyle' },
      { text:'Use a gentle cleanser without perfume or dyes.', kind:'lifestyle' },
      { text:'Pat your skin dry with a towel rather than rubbing.', kind:'lifestyle' },
      { text:'Put on an unperfumed moisturiser regularly, especially after washing.', kind:'lifestyle' }
    ],
    urgent:null,
    doctor:'If the skin stays very dry, cracked, red or itchy despite moisturising, please see a doctor.',
    sources:['https://medlineplus.gov/ency/article/000835.htm', 'https://www.nhs.uk/conditions/itchy-skin/']
  },
  {
    id:'sunburn', label:'sunburn', kind:'everyday', products:[],
    match:/sun\s*-?\s*burn|burnt\s*(in|by)\s*the\s*sun|sun\s*tan\b|tanned\s*skin|skin\s*(got\s*)?(burn\w*|tanned|dark\w*)\s*(from|in|by)\s*(the\s*)?(sun|veyil)|veyil\w*\s*(la\s*)?(skin|mugam|face)\s*(karuppu|kar\w*|burn\w*|sivandh\w*)/i,
    tips:[
      { text:'Get out of the sun, and cool the skin with a cool shower, bath or damp towel.', kind:'lifestyle' },
      { text:'Put on an aftersun or unperfumed moisturiser.', kind:'lifestyle' },
      { text:'Drink plenty of water, and avoid alcohol.', kind:'food' },
      { text:'Do not pop blisters or peel the skin, avoid tight clothes over it, and keep it covered from the sun until it is better.', kind:'lifestyle' }
    ],
    urgent:'Sunburn with confusion, a fast heartbeat or breathing, or fainting can be heatstroke: call 112 now.',
    doctor:'If the skin is blistered or swollen, or you also have fever, chills, dizziness, nausea, a headache or cramps, or a baby or young child is sunburnt, please see a doctor soon.',
    sources:['https://www.nhs.uk/conditions/sunburn/']
  },
  {
    id:'heatrash', label:'heat rash', kind:'everyday', products:[],
    match:/heat\s*rash|prickly\s*heat|sweat\s*rash|miliaria|verkuru|vErkuru|verkkuru|வேர்க்குரு/i,
    tips:[
      { text:'Wear loose cotton clothes and use light bedding.', kind:'lifestyle' },
      { text:'Have cool baths or showers, and drink plenty of water.', kind:'lifestyle' },
      { text:'A cold, damp cloth or a wrapped ice pack for up to 20 minutes can soothe it.', kind:'cold', uses:['ice'] },
      { text:'Tap or pat the rash instead of scratching, and avoid perfumed shower gels or creams.', kind:'lifestyle' }
    ],
    urgent:null,
    doctor:'If the rash has not improved after a few days, or a baby has a rash you are worried about, please see a doctor.',
    sources:['https://www.nhs.uk/conditions/heat-rash-prickly-heat/']
  },
  {
    id:'heat', label:'the heat and dehydration', kind:'everyday', products:[],
    match:/heat\s*(exhaustion|stroke)|sun\s*stroke|sunstroke|dehydrat|dehidrat|(too|very|extreme|so)\s*(much\s*)?hot\s*(weather|day|days|outside)|summer\s*heat|heat\s*wave|heatwave|veyil\s*(thangala|athigam|romba|adikuthu|adichi)|neer\s*sathu\s*(kuraiv|kammi)|நீர்ச்சத்து|வெயில்/i,
    tips:[
      { text:'Drink plenty of water through the day, enough that your pee stays pale, and more when it is hot or you are active.', kind:'food' },
      { text:'Stay out of the sun in the hottest part of the day, around 11am to 3pm.', kind:'lifestyle' },
      { text:'Wear light, loose, light-coloured clothes, and keep alcohol and caffeine low.', kind:'lifestyle' },
      { text:'If someone feels faint from the heat, move them to a cool place, loosen clothing, give water to sip, and cool their skin with water and fanning.', kind:'lifestyle' }
    ],
    urgent:'If someone still feels unwell after 30 minutes of cooling and fluids, or has hot skin that is not sweating, confusion, fast breathing, a fit or passes out, call 112 now: heatstroke is an emergency.',
    doctor:'If you feel unusually tired or dizzy that does not go away, or your pee stays dark, please see a doctor. Babies, young children, older people and those with long-term conditions need extra care in hot weather.',
    sources:['https://www.nhs.uk/conditions/heat-exhaustion-heatstroke/', 'https://www.nhs.uk/conditions/dehydration/']
  },
  // ---------------------------------------------------------------- aches
  {
    id:'dizzy', label:'dizziness', kind:'everyday', products:[],
    match:/dizz|dizy|giddi|giddy|head\s*(is\s*)?spinning|room\s*(is\s*)?spinning|light\s*-?\s*headed|vertigo|thala(i)?\s*(suth|sutr|sutt)|mayakk?am|மயக்க|தலை\s*சுற்ற|feel(ing)?\s*(like\s*)?faint/i,
    tips:[
      { text:'Lie down until it passes, then get up slowly.', kind:'lifestyle' },
      { text:'Move slowly and carefully, and avoid bending down suddenly.', kind:'lifestyle' },
      { text:'Rest, and drink plenty of fluids, especially water.', kind:'food' },
      { text:'Avoid coffee, cigarettes and alcohol, and do not drive or climb ladders while you feel dizzy.', kind:'lifestyle' }
    ],
    urgent:'Dizziness with a drooping face, weakness or numbness in an arm or leg, trouble speaking, sudden vision loss, chest pain or fainting needs emergency help now: call 112.',
    doctor:'If dizziness does not go away or keeps coming back, or comes with hearing changes, ringing in the ears, blurred or double vision, headaches or vomiting, please see a doctor.',
    sources:['https://www.nhs.uk/symptoms/dizziness/', 'https://www.nhs.uk/conditions/vertigo/']
  },
  {
    id:'muscle-cramps', label:'muscle cramps', kind:'everyday', products:[],
    match:/(leg|legs|calf|calves|muscle|thigh|foot|feet|night|kaal)\s*cramps?|cramps?\s*in\s*(my\s*|the\s*)?(leg|legs|calf|calves|thigh|foot|feet|muscle)|charley\s*horse|naramb?u\s*izhu|kaal\s*izhu|sathai\s*izhu|kendai\s*(sathai\s*)?(izhu|pidi)|muscle\s*(pull|spasm|catch)|தசைப்பிடிப்பு|கால்\s*இழுப்பு/i,
    tips:[
      { text:'During a cramp, gently stretch and massage the muscle, and stand up with your weight on that leg.', kind:'lifestyle' },
      { text:'Do calf stretches each day, with the last one just before bed.', kind:'lifestyle' },
      { text:'Drink enough fluids, and keep alcohol low.', kind:'food' },
      { text:'Avoid over-straining your muscles when exercising, especially in hot weather.', kind:'lifestyle' }
    ],
    urgent:null,
    doctor:'If cramps disturb your sleep, last longer than 10 minutes, or come with numbness or swelling in the legs, please see a doctor.',
    sources:['https://www.nhs.uk/conditions/leg-cramps/']
  },
  {
    id:'bodypain', label:'body aches', kind:'everyday', products:[],
    match:/body\s*(pain|ache|aches|is\s*paining|paining)|bodyache|bodypain|aching\s*all\s*over|(whole|full)\s*body\s*(hurts|aches|pain|is\s*aching)|muscle\s*(pain|ache|aches|soreness)|sore\s*muscles|muscles?\s*(are\s*)?(sore|aching|hurt)|myalgia|udambu\s*(full\s*ah\s*|ellam\s*)?vali|udambu\s*valikuthu|udambu\s*valikudhu|உடம்பு\s*வலி|கை\s*கால்\s*வலி|kai\s*kaal\s*vali/i,
    tips:[
      { text:'Rest the sore area, then ease back in with gentle stretching and light activity like walking or swimming.', kind:'lifestyle' },
      { text:'Stretch before and after exercise, and warm up and cool down.', kind:'lifestyle' },
      { text:'If you sit for long, get up and stretch at least once an hour.', kind:'lifestyle' },
      { text:'Get enough sleep, and drink plenty of fluids when you are active.', kind:'lifestyle' }
    ],
    urgent:'Aches with a very stiff neck and high fever, trouble breathing or swallowing, or sudden weakness or not being able to move a part of the body need emergency help now: call 112.',
    doctor:'If muscle pain lasts more than 3 days, is severe with no clear cause, there is redness or swelling, or it started after a new medicine, please see a doctor.',
    sources:['https://medlineplus.gov/ency/article/003178.htm']
  },
  {
    id:'neck', label:'neck pain', kind:'everyday', products:[],
    match:/neck\s*(pain|ache|hurts?|stiff\w*|sprain|catch|is\s*(hurting|paining|stiff))|stiff\s*neck|crick\s*in\s*(my\s*)?neck|pain\s*in\s*(my\s*|the\s*)?neck|kazhuthu\s*(vali|valikuthu|pidippu|sulukku)|kaluthu\s*(vali|valikuthu|pidippu|sulukku)|கழுத்து\s*வலி/i,
    tips:[
      { text:'Keep your neck gently moving; do not keep it still for long.', kind:'lifestyle' },
      { text:'Use a low, firm pillow.', kind:'lifestyle' },
      { text:'A heat pack or a cold pack wrapped in a towel can ease the pain.', kind:'heat', uses:['heat', 'ice'] },
      { text:'Try gentle neck stretches, and keep good posture with your shoulders relaxed.', kind:'lifestyle' }
    ],
    urgent:'A stiff neck with fever, a rash, vomiting, or pain when looking at bright light needs emergency help now: call 112.',
    doctor:'If neck pain lasts more than a few weeks, is getting worse, or comes with pins and needles, numbness or weakness in the arm, please see a doctor.',
    sources:['https://www.nhs.uk/conditions/neck-pain/', 'https://www.nhs.uk/conditions/shoulder-pain/']
  },
  // ---------------------------------------------------------------- weight, mood, mind
  {
    id:'weight', label:'losing weight', kind:'everyday', products:[],
    match:/over\s*weight|obes|\b(lose|reduce|reducing|cut|cutting|loose|burn)\s*(some\s*|my\s*|the\s*|extra\s*)?(weight|belly\s*fat|tummy\s*fat|fat)(?!\s*(without|suddenly|for\s*no))|weight\s*(gain|loss\s*tips|reduc|kuraik|kuraika|kuraiya|is\s*increasing|increas|athigam|koodi|kooduthu|is\s*going\s*up)|\bgain(ed|ing)\s*(\w+\s*){0,3}weight|put\s*on\s*weight|belly\s*fat|tummy\s*fat|thoppai|தொப்பை|உடல்\s*எடை|edai\s*(kuraik|athigam|kooduthu|koodi)|weight\s*loss\s*(tips|plan|program)/i,
    tips:[
      { text:'Eat a balanced diet with more fruit and vegetables, and less fatty and sugary food.', kind:'food' },
      { text:'Be active every day, building up slowly, and include some strength exercises.', kind:'lifestyle' },
      { text:'Cut down on alcohol.', kind:'lifestyle' },
      { text:'Aim to lose weight slowly and steadily, set small realistic goals, and be patient with yourself.', kind:'lifestyle' }
    ],
    urgent:null,
    doctor:'If you would like help losing weight, especially with diabetes, high blood pressure, joint pain or high cholesterol, please see a doctor. Please do not start a very strict diet without asking them.',
    sources:['https://www.nhs.uk/conditions/obesity/']
  },
  {
    id:'appetite', label:'a poor appetite', kind:'everyday', products:[],
    match:/appetite|apetite|appitite|not\s*(feeling\s*)?hungry|no\s*hunger|pasi(ye)?\s*(illa|edukala|edukkala|varala|eduka|kammi)|பசி|(losing|lost)\s*weight\s*(without|for\s*no|suddenly)|weight\s*loss\s*without|(want|need|how)\s*(\w+\s*)?(to\s*)?gain\s*weight|under\s*weight|underweight|\b(too|very)\s*thin\b|don'?t\s*feel\s*like\s*eating|saapida\s*(pidikala|thonala|mudiyala)|saapadu\s*(pidikala|irangala)/i,
    tips:[
      { text:'Try several small meals or nourishing snacks through the day instead of large meals.', kind:'food' },
      { text:'Keep a simple note of everything eaten and drunk for a day or two; it helps you and the doctor see the pattern.', kind:'lifestyle' },
      { text:'Family can help by offering favourite foods.', kind:'food' }
    ],
    urgent:null,
    doctor:'If you are losing weight without trying, the poor appetite lasts, or it comes with low mood, a new medicine or heavy drinking, please see a doctor so they can check the cause.',
    sources:['https://medlineplus.gov/ency/article/003121.htm', 'https://www.nhs.uk/symptoms/unintentional-weight-loss/']
  },
  {
    id:'lowmood', label:'feeling low', kind:'everyday', products:[],
    match:/low\s*mood|feel(ing|s)?\s*(so\s*|very\s*|really\s*|a\s*bit\s*)?(low|down|sad|empty|hopeless|blue|lonely|worthless)\b|depress|sad\s*(all\s*the\s*time|always|every\s*day|everyday)|lonel|no\s*interest\s*in|lost\s*interest|nothing\s*makes\s*me\s*happy|manasu\s*(sari\s*illa|kashtam|baaram|bharam|odanju|udanju)|sogam|மனச்சோர்வு|சோகம்|வருத்தமா/i,
    tips:[
      { text:'Make a list of things you enjoy or that matter to you, and do a few each day, starting with the easiest.', kind:'lifestyle' },
      { text:'Talk to a friend, family member or colleague you trust.', kind:'lifestyle' },
      { text:'Keep a steady sleep routine.', kind:'lifestyle' },
      { text:'Add small bits of movement to your day, like a short walk or taking the stairs.', kind:'lifestyle' }
    ],
    urgent:'If you ever feel unsafe or have thoughts of harming yourself, please call 112 or Tele-MANAS on 14416 right now, or tell someone near you.',
    doctor:'If the low mood lasts more than 2 weeks, is affecting your daily life, or you feel you cannot cope, please talk to a doctor. Tele-MANAS (14416) is free and open any time.',
    sources:['https://www.nhs.uk/every-mind-matters/mental-health-issues/low-mood/']
  },
  {
    id:'memory', label:'memory and focus', kind:'everyday', products:[],
    match:/memory|forget|brain\s*fog|absent\s*-?\s*minded|marathi|maradhi|maranthu\s*(pog|poi|poid)|ஞாபக\s*மறதி|மறதி/i,
    tips:[
      { text:'Stress, worry, low mood and poor sleep can all affect memory, so looking after these helps.', kind:'lifestyle' },
      { text:'Exercise regularly and eat a balanced diet.', kind:'lifestyle' },
      { text:'Keep alcohol low, and stop smoking if you smoke.', kind:'lifestyle' },
      { text:'Keep your weight and blood pressure in a healthy range, with regular check-ups.', kind:'lifestyle' }
    ],
    urgent:'Sudden confusion, or memory loss with a drooping face, weakness in an arm or trouble speaking, needs emergency help now: call 112.',
    doctor:'If memory problems are affecting daily life, or an older relative is becoming more forgetful, please see a doctor; it helps to bring someone who knows the problem well.',
    sources:['https://www.nhs.uk/conditions/memory-loss-amnesia/', 'https://www.nhs.uk/conditions/dementia/about-dementia/prevention/']
  },
  {
    id:'snoring', label:'snoring', kind:'everyday', products:[],
    match:/snor|kurattai|kurrattai|குறட்டை/i,
    tips:[
      { text:'Try sleeping on your side rather than your back.', kind:'lifestyle' },
      { text:'If you are overweight, losing some weight can help.', kind:'lifestyle' },
      { text:'Do not smoke, and avoid drinking alcohol, especially in the evening.', kind:'lifestyle' }
    ],
    urgent:null,
    doctor:'If breathing stops and starts or there is gasping or choking during sleep, you feel very sleepy in the day, or the snoring is affecting your life, please see a doctor.',
    sources:['https://www.nhs.uk/conditions/snoring/']
  },
  // ---------------------------------------------------------------- urinary, bowel, circulation
  {
    id:'uti', label:'burning when passing urine', kind:'everyday', products:[],
    match:/\buti\b|urin(e|ary)\s*(infection|burn\w*|pain|tract)|burn\w*\s*(sensation\s*)?(while|when|during|after)\s*(passing\s*)?(urin|pee|peeing|urinat)|pain\w*\s*(while|when|during)\s*(i\s*|you\s*)?(passing\s*)?(urin|pee)|\bpee\w*\s*(burns?|hurts?|pain)|painful\s*urinat|urine\s*(la\s*)?(erichal|kaduppu|burn)|neer\s*(kaduppu|kadupu|erichal)|moothira\s*(kaduppu|erichal)|siruneer\s*(erichal|kaduppu|thottru)|சிறுநீர்\s*(எரிச்சல்|கடுப்பு|தொற்று)|cystitis/i,
    tips:[
      { text:'Rest, and drink enough fluids, mainly water, to pass pale urine regularly.', kind:'food' },
      { text:'Avoid drinks that irritate the bladder, like coffee and alcohol.', kind:'food' },
      { text:'Do not hold in urine, and wipe from front to back after the toilet.', kind:'lifestyle' },
      { text:'Wear loose cotton underwear, and avoid scented soap around the private area.', kind:'lifestyle' }
    ],
    urgent:'Confusion, drowsiness or trouble speaking with these symptoms needs emergency help now: call 112.',
    doctor:'Please see a doctor if it does not improve within 2 days, gets worse, or comes with fever or shivering, pain in the back or lower tummy, or blood in the urine; and see them soon if you are a man, pregnant, over 65, diabetic, or it is for a child.',
    sources:['https://www.nhs.uk/conditions/urinary-tract-infections-utis/']
  },
  {
    id:'piles', label:'piles', kind:'everyday', products:[],
    match:/\bpiles\b|h(a|e)?emorr?h?oid|hemroid|moola\s*(noi|vyadhi)|moolam\s*(noi|iruk|problem|vali)|மூல\s*நோய்/i,
    tips:[
      { text:'Drink plenty of fluids and eat high-fibre foods to keep stools soft.', kind:'food' },
      { text:'Do not strain or sit on the toilet longer than needed, and do not ignore the urge to go.', kind:'lifestyle' },
      { text:'A warm bath can ease itching and pain, and keep the area clean and dry, patting rather than rubbing.', kind:'lifestyle' },
      { text:'Cut back on alcohol and caffeine.', kind:'lifestyle' }
    ],
    urgent:'Bleeding that will not stop, a lot of blood or clots, or severe pain needs emergency help now: go to a hospital or call 112.',
    doctor:'If it is not improving with home care, keeps coming back, or you notice bleeding, pus or any change around the bottom, please see a doctor.',
    sources:['https://www.nhs.uk/conditions/piles-haemorrhoids/']
  },
  {
    id:'varicose', label:'varicose veins', kind:'everyday', products:[],
    match:/vari(c|ck)ose|vericose|varicos|swollen\s*veins|bulging\s*veins|veins\s*(are\s*|look\s*)?(bulging|swollen|twisted|popping)|naramb?u\s*(surul|sural|pudaippu|mudichu)|nerambu\s*surul|நரம்பு\s*சுருள்|spider\s*veins/i,
    tips:[
      { text:'Rest with your legs raised when you can.', kind:'lifestyle' },
      { text:'Avoid standing or sitting for long periods; move around regularly.', kind:'lifestyle' },
      { text:'Exercise regularly, like walking, and keep to a healthy weight.', kind:'lifestyle' },
      { text:'Moisturise dry or itchy skin on the legs, protect the legs from knocks, and stop smoking if you smoke.', kind:'lifestyle' }
    ],
    urgent:'A varicose vein that is bleeding needs urgent help: press firmly on it and go to a hospital.',
    doctor:'If your legs are painful, itchy or swollen, a sore on the leg has not healed after 2 weeks, or the veins are getting worse, please see a doctor.',
    sources:['https://www.nhs.uk/conditions/varicose-veins/']
  },
  // ---------------------------------------------------------------- small, everyday
  {
    id:'motion', label:'travel sickness', kind:'everyday', products:[],
    match:/motion\s*sickness(?!\s*feeling)|travel\s*sick|car\s*sick|carsick|bus\s*sick|sea\s*sick|seasick|(bus|car|travel\w*|journey|payanam|train)\s*(\w+\s*){0,3}(vomit|vaanthi|vandhi)|(vomit\w*|vaanthi|vandhi)\s*(\w+\s*){0,3}(bus|car|travel\w*|journey|payanam)/i,
    tips:[
      { text:'Sit in the front of a car, or the middle of a boat, and look ahead at a fixed point like the horizon.', kind:'lifestyle' },
      { text:'Get fresh air, for example by opening a window, and close your eyes and breathe slowly.', kind:'lifestyle' },
      { text:'Do not read or watch a screen while travelling.', kind:'lifestyle' },
      { text:'Avoid heavy or spicy meals and alcohol before and during the journey, and break up long journeys for fresh air and a walk.', kind:'lifestyle' }
    ],
    urgent:null,
    doctor:'A pharmacist can suggest other options if this does not help.',
    sources:['https://www.nhs.uk/conditions/motion-sickness/']
  },
  {
    id:'hiccups', label:'hiccups', kind:'everyday', products:[],
    match:/hiccup|hiccough|hicup|vikkal|விக்கல்/i,
    tips:[
      { text:'Sip very cold water.', kind:'food' },
      { text:'Hold your breath for a short time, or pull your knees up to your chest and lean forward.', kind:'lifestyle' },
      { text:'Avoid fizzy drinks, alcohol, eating quickly, and spicy food.', kind:'lifestyle' }
    ],
    urgent:null,
    doctor:'If hiccups last longer than 2 days, or keep coming back and affect daily life, please see a doctor.',
    sources:['https://www.nhs.uk/conditions/hiccups/']
  },
  {
    id:'nails', label:'nail problems', kind:'everyday', products:[],
    match:/nails?\s*(are\s*|is\s*|keep\s*)?(break\w*|brittle|crack\w*|split\w*|weak|discolou?r\w*|yellow|peel\w*|fungus|fungal|infection|problem)|(brittle|weak|yellow|broken)\s*nails|ingrown|nail\s*biting|bite\s*my\s*nails|nagam\s*(odaiyuthu|udaiyuthu|udainju|manjal)|நகம்/i,
    tips:[
      { text:'Keep nails short, and do not bite, pick or tear at them.', kind:'lifestyle' },
      { text:'Put a moisturising cream on your hands and nails after washing or bathing.', kind:'lifestyle' },
      { text:'Cut toenails straight across, and wear shoes that do not squeeze your toes.', kind:'lifestyle' },
      { text:'Take your own tools to a nail salon, and do not let anyone cut your cuticles.', kind:'lifestyle' }
    ],
    urgent:null,
    doctor:'If nails change colour or shape, become painful, pitted, peeling or ingrown, or there is a dark streak under a nail, please see a doctor.',
    sources:['https://medlineplus.gov/ency/article/003247.htm']
  },
  // ---------------------------------------------------------------- life stages
  {
    id:'child', label:'a child\'s health', kind:'condition', products:[], alwaysDoctor:true,
    match:/\b(baby|babies|infant|newborn|toddler|kid|kids|child|children|son|daughter|kuzhandhai|kuzhanthai|kolandha|kozhandha|paapa|pappa|பாப்பா|குழந்தை)\b.{0,40}\b(health|healthy|growth|grow|growing|vaccin\w*|check-?ups?|development|milestones?|weight|height)\b|vaccin|thadupoosi|தடுப்பூசி|pa?ediatrician|peadiatrician|child\s*specialist|kuzhandhai\s*doctor/i,
    tips:[
      { text:'Keep up the routine check-ups with the child\'s doctor (paediatrician), where growth and development are checked.', kind:'lifestyle' },
      { text:'Give every vaccine on time, following the schedule; if one was missed, ask the doctor about catching up.', kind:'lifestyle' },
      { text:'Trust your instincts: if you feel something is wrong, get the child checked by a doctor.', kind:'lifestyle' }
    ],
    urgent:'A child who has trouble breathing, blue, grey or blotchy skin or lips, a rash that does not fade when pressed, a fit, is hard to wake, or a baby under 3 months with a temperature of 38°C or more needs emergency help now: call 112.',
    doctor:'For any question about a child\'s health, growth or feeding, the child\'s doctor (paediatrician) is the right person to ask. Please do not give children any remedy or medicine without asking the doctor first.',
    sources:['https://www.nhs.uk/baby/health/when-to-get-urgent-medical-help-for-babies-and-children-under-5/', 'https://www.nhs.uk/vaccinations/nhs-vaccinations-and-when-to-have-them/']
  },
  {
    id:'elderly', label:'staying well in older age', kind:'everyday', products:['energy-booster'],
    match:/elderly|old\s*age|senior\s*citizen|aged\s*(parent|parents|father|mother|people)|grand\s*(father|mother|ma|pa)|grandparents?|\bthatha\b|\bthaatha\b|\bpaati\b|\bpatti\b|\b(father|mother|dad|mom|amma|appa|parents?)\s*(is|are)\s*(\d{2}|above\s*\d{2}|over\s*\d{2}|old|getting\s*old|aged)|\b[6-9]\d\s*(years?|yrs?)\s*old|\b[6-9]\d\s*vayasu|vayasana|வயதான|முதியோர்/i,
    tips:[
      { text:'Stay active every day, even light activity, and do strength and balance exercises at least twice a week.', kind:'lifestyle' },
      { text:'Break up long periods of sitting with some movement.', kind:'lifestyle' },
      { text:'Prevent falls at home: clear clutter and loose wires, use a non-slip mat in the bathroom, and wear well-fitting shoes or slippers with a good grip.', kind:'lifestyle' },
      { text:'Have regular eye and hearing checks, and ask the doctor to review medicines if they cause dizziness.', kind:'lifestyle' }
    ],
    urgent:'After a fall with a possible head, neck, back or hip injury, or if they cannot get up, call 112.',
    doctor:'Regular check-ups with the doctor are a good idea in older age, and see them after any fall or if balance or walking is getting harder.',
    sources:['https://www.nhs.uk/conditions/falls/', 'https://www.nhs.uk/live-well/exercise/exercise-guidelines/physical-activity-guidelines-older-adults/']
  },
  {
    id:'pregnancy', label:'pregnancy', kind:'condition', products:[], alwaysDoctor:true,
    match:/pregnan|pregant|pragnent|pregnent|preganant|expecting\s*(a\s*)?baby|garbam|karpam|karbam|garbini|karpini|கர்ப்ப|maasama\s*iruk|antenatal|trimester/i,
    tips:[
      { text:'Go to every pregnancy check-up, and contact the doctor or maternity unit any time you are worried, without waiting for the next visit.', kind:'lifestyle' },
      { text:'Keep active with gentle exercise, drink water to stay hydrated, keep cool, and stop if you feel uncomfortable, too hot or unwell.', kind:'lifestyle' },
      { text:'Avoid activities with a risk of falling or bumping your tummy, and do not exercise on an empty stomach.', kind:'lifestyle' },
      { text:'Do not smoke or drink alcohol during pregnancy.', kind:'lifestyle' }
    ],
    urgent:'In pregnancy, vaginal bleeding, a severe headache, blurred vision or flashing lights, pain below the ribs, sudden swelling of the face, hands or feet, or the baby moving less needs urgent help now: go to the hospital or call 112.',
    doctor:'Please keep up all pregnancy check-ups with the doctor, and ask them before taking any medicine, remedy or product.',
    sources:['https://www.nhs.uk/pregnancy/keeping-well/exercise/', 'https://www.nhs.uk/pregnancy/your-pregnancy-care/your-antenatal-appointments/', 'https://www.nhs.uk/conditions/pre-eclampsia/', 'https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/', 'https://www.nhs.uk/pregnancy/related-conditions/common-symptoms/vaginal-bleeding/']
  }
];

const MORE_EXAMPLES = {
  bp:[
    'I have high blood pressure', 'my BP is high', 'BP high ah iruku', 'en appa ku BP iruku', 'my father has hypertension',
    'appa ku pressure iruku enna pannalam', 'blood pressure is 150 by 95', 'i am bp patient', 'my mother takes bp tablets',
    'how to keep bp normal naturally', 'ரத்த அழுத்தம் அதிகமா இருக்கு', 'bp jaasthi ah iruku', 'doctor said my bp is high',
    'my husband has high bp', 'blood presure high', 'BP 160 vandhuchu', 'tips for high blood pressure', 'amma ku pressure maathirai saapdranga',
    'what to do for high BP'
  ],
  lowbp:[
    'I have low blood pressure', 'my bp is low', 'low BP problem', 'bp romba kammi ah iruku', 'my bp drops when I stand up',
    'low bp ku enna pannalam', 'my sister has low blood pressure', 'blood pressure goes down often', 'bp kuraivu',
    'hypotension tips', 'my bp is 90 by 60', 'low bp and feel faint when I get up', 'BP low aagiduchu', 'mother has low bp',
    'i am having low bp issue', 'how to manage low blood pressure'
  ],
  diabetes:[
    'I have diabetes', 'sugar iruku', 'my father is diabetic', 'blood sugar is high', 'sugar level athigam', 'type 2 diabetes tips',
    'amma ku sugar patient', 'my HbA1c is 8', 'i am a diabetic', 'சர்க்கரை நோய் இருக்கு', 'sugar problem iruku enna saapdalam',
    'my husband takes insulin', 'daibetes lifestyle', 'how to live with diabetes', 'high sugar what to do', 'pre diabetic',
    'appa ku sakkarai noi', 'diabetis care tips', 'my wife has sugar complaint'
  ],
  thyroid:[
    'I have thyroid', 'thyroid problem', 'my wife has hypothyroidism', 'thyroid iruku', 'TSH is high', 'tips for thyroid patients',
    'I take thyroxine every day', 'thyriod issue', 'hyperthyroid', 'amma ku thyroid', 'தைராய்டு பிரச்சனை', 'thyroid and weight gain',
    'my sister has thyroid issue', 'goitre in neck', 'low thyroid', 'thairoid tablet saapdren'
  ],
  kidney:[
    'kidney health', 'how to keep my kidneys healthy', 'my creatinine is high', 'my father has kidney problem', 'CKD patient',
    'kidney function poor ah iruku', 'my mother is on dialysis', 'kidney function low', 'சிறுநீரக நோய்', 'kidni problem',
    'protect kidneys diabetes', 'kidney disease tips', 'my uncle has renal failure', 'kidney care', 'creatinine level athigam',
    'is my kidney ok'
  ],
  kidneystone:[
    'I have kidney stones', 'kidney stone pain', 'stone in my kidney', 'kidney la kal iruku', 'my husband has kidney stone',
    'how to avoid kidney stones', 'small stone in kidney', 'kidney stone came back', 'சிறுநீரக கல்', 'renal stone',
    'kidney stones tips', 'doctor said I have a 5mm kidney stone', 'kal adaippu iruku', 'urinary stone problem', 'siruneeraga kal',
    'my brother had stones in kidney'
  ],
  cholesterol:[
    'I have high cholesterol', 'cholesterol is high', 'my LDL is high', 'cholestrol problem', 'appa ku cholesterol iruku',
    'triglycerides high', 'lipid profile not good', 'கொலஸ்ட்ரால் அதிகம்', 'how to deal with high cholesterol', 'my wife has cholesterol',
    'cholesterol athigama iruku', 'kolestrol tips', 'bad cholesterol is high', 'cholesterol report came high', 'high cholesterol food tips',
    'my mom has high cholesterol'
  ],
  pcos:[
    'I have PCOS', 'PCOD problem', 'my daughter has pcod', 'polycystic ovaries', 'pcos weight gain', 'pcod iruku',
    'PCOS tips', 'my wife has pcos', 'pcod irregular periods', 'pcos and facial hair', 'pc od', 'diagnosed with polycystic ovary syndrome',
    'pcos ku enna pannalam', 'PCOD lifestyle', 'சினைப்பை நீர்க்கட்டி', 'pcos and hair on face'
  ],
  irregular:[
    'irregular periods', 'my periods are late', 'missed my period', 'period not coming this month', 'periods varala',
    'period 10 days late', 'my cycle is irregular', 'irregular menses', 'periods thalli pogudhu', 'my daughter has irregular periods',
    'no periods for 2 months', 'maadhavidai sariya varala', 'மாதவிடாய் தள்ளி போகுது', 'period skipped', 'delayed periods',
    'periods are not regular', 'chums varala', 'my wife periods is delayed'
  ],
  menopause:[
    'menopause symptoms', 'hot flushes', 'night sweats', 'I am going through menopause', 'perimenopause', 'my mother has menopause problems',
    'hot flashes at night', 'menopause tips', 'periods stopping at 48', 'menopause la mood swings', 'maadhavidai nirutham',
    'மாதவிடாய் நிறுத்தம்', 'sweating at night menopause', 'menopause mood swings', 'my wife menopause stage', 'menapause'
  ],
  anaemia:[
    'I have anaemia', 'my haemoglobin is low', 'low hb', 'hb is 9', 'anemia', 'iron deficiency', 'ratham kammi ah iruku',
    'my wife has low hemoglobin', 'ரத்த சோகை', 'blood level is low', 'hemoglobin kammi', 'my daughter is anemic',
    'how to increase haemoglobin', 'aneamia tips', 'doctor said low hemoglobin', 'iron deficiency anaemia'
  ],
  asthma:[
    'I have asthma', 'asthma problem', 'my son has asthma', 'wheezing at night', 'asthama tips', 'ஆஸ்துமா',
    'my father has asthma', 'asthma triggers', 'eosinophilia problem', 'moochu izhuppu iruku', 'wheezy chest', 'astma',
    'asthma in winter', 'how to live with asthma', 'my wife has asthma', 'izhuppu noi iruku'
  ],
  stomach:[
    'stomach pain', 'I have a stomach ache', 'tummy ache', 'vayiru vali', 'my stomach hurts', 'abdominal pain', 'belly pain',
    'vayiru valikuthu', 'வயிற்று வலி', 'my son has stomach pain', 'stomach ache since morning', 'stomachache', 'tummy pain',
    'pain in my abdomen', 'my wife has stomach pain', 'stomach is paining', 'vayitru vali romba iruku'
  ],
  gas:[
    'gas problem', 'too much gas', 'I pass gas a lot', 'flatulence', 'farting a lot', 'vayu thollai', 'stomach full of air',
    'gassy stomach', 'வாயு பிரச்சனை', 'gas in stomach', 'vayiru ubbi iruku', 'passing wind too often', 'stomach feels tight and swollen',
    'my father has gas issues', 'gas formation', 'gases in my tummy'
  ],
  diarrhoea:[
    'loose motion', 'diarrhoea', 'diarrhea since yesterday', 'loose motions', 'watery stool', 'motion adikadi poguthu',
    'பேதி', 'my son has loose motion', 'running stomach', 'vayitru pokku', 'lose motion', 'diarhea', 'loose stools 5 times',
    'my mother has diarrhoea', 'motions frequent ah iruku', 'வயிற்றுப்போக்கு'
  ],
  vomiting:[
    'I am vomiting', 'vomiting since morning', 'threw up twice', 'my son is vomiting', 'vaanthi eduthen', 'throwing up',
    'vaanthi varudhu', 'keep vomiting', 'puking', 'வாந்தி எடுக்குது', 'vomitting after food', 'my wife vomited 3 times',
    'baby vomited', 'vandhi vanthuchu', 'vomited at night', 'cant stop vomiting'
  ],
  toothache:[
    'toothache', 'tooth pain', 'pallu vali', 'my tooth hurts', 'pain in my teeth', 'pal vali', 'பல் வலி', 'wisdom tooth pain',
    'molar pain', 'my son has tooth pain', 'toothache at night', 'teeth pain', 'pal valikuthu', 'tooth ache since 2 days',
    'pain in my back tooth', 'my mom has toothache'
  ],
  gums:[
    'bleeding gums', 'my gums bleed when brushing', 'sensitive teeth', 'teeth sensitivity to cold', 'gum swelling', 'eeru la ratham',
    'pal koosu', 'ஈறு வீக்கம்', 'gums are sore', 'swollen gums', 'my teeth are sensitive', 'tooth sensitivity', 'blood from gums',
    'gum problem', 'cold water touch panna pal koochum', 'gums hurt when I brush'
  ],
  ear:[
    'ear pain', 'earache', 'my ear hurts', 'kaathu vali', 'காது வலி', 'pain in my ear', 'my son has ear pain', 'ear infection',
    'kadhu valikuthu', 'ear ache at night', 'ear block and pain', 'ears paining', 'my daughter has earache', 'ear is paining',
    'kaadhu vali romba', 'ear pain after swimming'
  ],
  allergy:[
    'allergy', 'hay fever', 'pollen allergy', 'I have allergies', 'allergic rhinitis', 'allergy every season', 'ovvamai iruku',
    'ஒவ்வாமை', 'my son has allergy', 'allergy to cats', 'allergic to pollen and cats', 'allergy problem', 'alergy',
    'allergy in the morning', 'my wife has allergies', 'seasonal allergies'
  ],
  rash:[
    'skin rash', 'itchy skin', 'rashes on my body', 'body itching', 'hives', 'udambu full ah arippu', 'அரிப்பு', 'skin allergy',
    'red rash on arms', 'my son has rash', 'thadippu', 'itching all over', 'skin is itchy', 'urticaria', 'rash on my neck',
    'my wife has itchy skin', 'whole body itching at night'
  ],
  dryskin:[
    'dry skin', 'my skin is very dry', 'flaky skin', 'skin feels rough', 'dry skin in winter', 'thol varatchi', 'வறண்ட தோல்',
    'my hands skin is dry', 'skin varanda iruku', 'scaly skin', 'dry and itchy skin', 'my mother has dry skin', 'skin gets dry after bath',
    'very dry skin on legs', 'drey skin', 'rough dry skin'
  ],
  sunburn:[
    'sunburn', 'I got sunburnt', 'sun burn on my face', 'burnt in the sun', 'skin got burnt from the sun', 'sun tan',
    'veyil la mugam karuthuduchu', 'my son got sunburn', 'red skin after beach', 'sunburned shoulders', 'tanned skin',
    'skin darkened by the sun', 'sunburn blisters', 'sun burn', 'my face is sunburnt', 'veyil la skin burn aagiduchu'
  ],
  heatrash:[
    'heat rash', 'prickly heat', 'verkuru', 'வேர்க்குரு', 'sweat rash', 'heat rash on neck', 'my baby has heat rash',
    'verkuru romba iruku', 'prickly heat in summer', 'small red bumps from heat', 'heat rash on back', 'miliaria', 'sweat rash under arms',
    'verkkuru', 'heat rash itching', 'my son has prickly heat'
  ],
  heat:[
    'heat exhaustion', 'dehydration', 'I feel dehydrated', 'too hot weather', 'heat stroke', 'summer heat', 'veyil thangala',
    'வெயில் அதிகம்', 'heatwave tips', 'sun stroke', 'my father is dehydrated', 'neer sathu kammi', 'how to stay cool in summer',
    'very hot day outside', 'dehidration', 'I sweat a lot in summer', 'நீர்ச்சத்து குறைவு'
  ],
  dizzy:[
    'I feel dizzy', 'giddiness', 'my head is spinning', 'thalai suthuthu', 'light headed', 'vertigo', 'dizziness when I stand',
    'mayakkam varuthu', 'தலை சுற்றல்', 'room is spinning', 'my mother gets dizzy', 'feel like fainting', 'giddy in the morning',
    'dizzyness', 'thala sutthu', 'my husband has vertigo'
  ],
  'muscle-cramps':[
    'leg cramps', 'cramp in my calf', 'leg cramps at night', 'muscle cramp', 'kaal izhuppu', 'naramb izhuthuchu', 'charley horse',
    'தசைப்பிடிப்பு', 'calf muscle tightens at night', 'my father gets kaal izhuppu at night', 'muscle spasm', 'sudden muscle spasm in the foot',
    'kendai sathai izhuppu', 'thigh muscle pulls after running', 'calf tightening wakes me up', 'naramb izhuppu kaal la'
  ],
  bodypain:[
    'body pain', 'body ache', 'udambu vali', 'whole body aches', 'muscle pain', 'sore muscles', 'udambu full ah valikuthu',
    'உடம்பு வலி', 'muscles are aching', 'body pains every morning', 'kai kaal vali', 'my mother has body pain', 'aching all over',
    'bodyache', 'muscle soreness', 'full body pain'
  ],
  neck:[
    'neck pain', 'stiff neck', 'kazhuthu vali', 'கழுத்து வலி', 'my neck hurts', 'neck pain from laptop', 'neck stiffness in the morning',
    'pain in my neck', 'crick in my neck', 'neck sprain', 'my husband has neck pain', 'kaluthu sulukku', 'neck is paining',
    'neck ache after sleeping', 'neck catch', 'neck pain while working'
  ],
  weight:[
    'I want to lose weight', 'weight gain', 'overweight', 'how to reduce belly fat', 'thoppai kuraikanum', 'weight kuraikanum',
    'I am obese', 'my weight is increasing', 'உடல் எடை குறைக்க', 'gained a lot of weight', 'tummy fat', 'weight loss tips',
    'my wife wants to lose weight', 'edai athigama iruku', 'put on weight after pregnancy', 'reduce my weight', 'loose weight fast'
  ],
  appetite:[
    'no appetite', 'I lost my appetite', 'not feeling hungry', 'pasi illa', 'பசி இல்லை', 'my son is not eating', 'loss of appetite',
    'pasiye edukala', 'I want to gain weight', 'I am underweight', 'losing weight without trying', 'too thin', 'dont feel like eating',
    'my father has no appetite', 'saapida pidikala', 'poor apetite', 'how to gain weight'
  ],
  lowmood:[
    'I feel low', 'feeling down', 'I am sad all the time', 'low mood', 'feeling empty', 'manasu sari illa', 'I feel depressed',
    'lost interest in everything', 'nothing makes me happy', 'feeling lonely', 'மனசு சரியில்லை', 'my wife is feeling low', 'feeling sad',
    'manasu baaram ah iruku', 'feel hopeless', 'sogam ah iruku', 'feeling blue these days'
  ],
  memory:[
    'poor memory', 'I forget things', 'forgetfulness', 'memory power', 'my father is forgetting things', 'marathi athigam',
    'ஞாபக மறதி', 'brain fog', 'I keep forgetting', 'how to improve memory', 'absent minded', 'maranthu poguthu', 'memory loss',
    'my mother forgets names', 'students memory', 'forgetful lately'
  ],
  snoring:[
    'snoring', 'I snore', 'my husband snores loudly', 'kurattai', 'குறட்டை', 'snoring problem', 'loud snoring', 'how to stop snoring',
    'my father snores', 'snoring at night', 'kurattai vidaren', 'wife snoring', 'snorring', 'snoring and gasping', 'snores a lot',
    'kurattai romba'
  ],
  uti:[
    'burning while passing urine', 'urine infection', 'UTI', 'neer kaduppu', 'pain when I pee', 'urine la erichal', 'சிறுநீர் எரிச்சல்',
    'burning sensation when urinating', 'my wife has urine infection', 'peeing hurts', 'urinary infection', 'moothira kaduppu',
    'painful urination', 'urine burning', 'cystitis', 'burning during urination', 'siruneer kaduppu'
  ],
  piles:[
    'piles', 'haemorrhoids', 'hemorrhoids', 'moolam iruku', 'மூல நோய்', 'piles pain', 'my father has piles', 'piles problem',
    'hemroids', 'piles itching', 'moola noi', 'piles bleeding a little', 'how to deal with piles', 'piles after pregnancy',
    'my husband has piles', 'internal piles'
  ],
  varicose:[
    'varicose veins', 'swollen veins on legs', 'bulging veins', 'narambu surul', 'நரம்பு சுருள்', 'vericose veins',
    'my mother has varicose veins', 'veins are bulging in my legs', 'spider veins', 'varicose', 'twisted veins on calf',
    'varicose veins from standing', 'my husband has varicose', 'varicos vein pain', 'veins popping in legs', 'nerambu surul'
  ],
  motion:[
    'motion sickness', 'travel sickness', 'I vomit in the bus', 'car sick', 'bus la vaanthi varudhu', 'seasick', 'carsick on long drives',
    'my son vomits during travel', 'travel panna vaanthi', 'journey la vomit', 'bus sickness', 'sea sickness on boat',
    'vomiting while travelling', 'payanam la vaanthi', 'travel sick', 'car travel vomiting'
  ],
  hiccups:[
    'hiccups', 'I have hiccups', 'hiccups wont stop', 'vikkal', 'விக்கல்', 'hiccup', 'my son has hiccups', 'vikkal nikkala',
    'hiccups after eating', 'hicups', 'constant hiccups', 'how to stop hiccups', 'hiccupping nonstop', 'vikkal varudhu', 'frequent hiccups',
    'hiccups for an hour'
  ],
  nails:[
    'brittle nails', 'my nails break easily', 'soft nails that bend', 'yellow nails', 'ingrown toenail', 'nail fungus', 'nagam udaiyuthu',
    'நகம் உடையுது', 'nails splitting', 'nail biting habit', 'nails are peeling', 'my son bites his nails', 'nail infection',
    'broken nails', 'nails keep cracking', 'nail problem'
  ],
  child:[
    'my baby health', 'baby vaccination', 'my child growth is slow', 'kuzhandhai health', 'thadupoosi schedule', 'தடுப்பூசி',
    'my son weight is low for his age', 'child check up', 'when to take baby to paediatrician', 'my daughter height is less',
    'toddler development', 'baby milestones', 'kids health tips', 'my 2 year old health', 'kolandha growth', 'newborn care',
    'vaccine for my kid'
  ],
  elderly:[
    'my grandmother health', 'elderly care', 'my father is 75 years old', 'old age health tips', 'my parents are getting old',
    'thatha health', 'paati ku enna pannalam', 'senior citizen wellness', 'my mother is 70', 'வயதானவர்கள் ஆரோக்கியம்',
    'old age balance problem', 'my grandfather falls sometimes', 'appa ku 80 vayasu', 'aged parents care', 'elderly mother tips',
    'healthy ageing'
  ],
  pregnancy:[
    'I am pregnant', 'my wife is pregnant', 'pregnancy care tips', 'garbam ah iruken', 'கர்ப்பமாக இருக்கேன்', 'first trimester',
    'pregnant 5 months', 'exercise during pregnancy', 'my sister is expecting a baby', 'pregnancy wellness', 'karpini care',
    'pregnent tips', 'second trimester tips', 'antenatal checkup', 'is walking ok in pregnancy', 'my daughter in law is pregnant',
    'pragnent lady care'
  ]
};

export { MORE_CONCERNS, MORE_EXAMPLES };
