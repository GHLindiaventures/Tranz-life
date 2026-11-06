// Realistic customer questions, written to be DIFFERENT from the examples the understanding layer was built from
// (server/intents.js): long sentences with job / city / lifestyle context, indirect descriptions, Tanglish, typos,
// and topic switches in the middle of a chat. Same format as understand-cases.js; run with
//   node scripts/understand-eval.mjs --set real
// t: messages (user / assistant alternating), ending with the message tested. concerns: expected main topic first.
const CC = 'craving-control', CG = 'craving-gummies', PC = 'pulmoclear', LB = 'liver-booster', EB = 'energy-booster', BF = 'breathefree', CR = 'cyclerelief';
const SMOKE = [CC, CG, PC];
const TIPS = 'Here are a few simple things that may help...';

const CASES = [
  // breathing / lungs / pollution, said in many ways
  { g:'breathing', t:['i work in delhi and face respiratory issues is there any product'], concerns:['pollution'], alt:['lungs'], products:[PC] },
  { g:'breathing', t:['the smog in my city makes it hard to breathe properly'], concerns:['pollution'], alt:['lungs'], products:[PC] },
  { g:'breathing', t:['I ride a bike to office every day through heavy traffic smoke'], concerns:['pollution'], products:[PC] },
  { g:'breathing', t:['I work in a construction site with lots of cement dust'], concerns:['pollution'], products:[PC] },
  { g:'breathing', t:['my chest feels heavy and congested in the mornings'], concerns:['lungs'], alt:['cold', 'pollution'], products:[PC] },
  { g:'breathing', t:['I get breathless easily when I climb stairs, want to improve my lung health'], concerns:['lungs'], products:[PC] },
  { g:'breathing', t:['looking for something to support my breathing'], concerns:['lungs'], products:[PC] },
  { g:'breathing', t:['factory la work panren, dust romba iruku, breathing kashtama iruku'], concerns:['pollution'], alt:['lungs'], products:[PC] },
  { g:'breathing', t:['chennai traffic la daily travel, mooku adaikuthu'], concerns:['pollution'], alt:['cold'], products:[PC] },
  { g:'breathing', t:['my lungs feel weak after covid, anything natural?'], concerns:['lungs'], products:[PC] },
  { g:'breathing', t:['air quality is very bad here and I keep coughing'], concerns:['pollution'], alt:['cold', 'lungs'], products:[PC] },
  { g:'breathing', t:['I am a traffic police officer, I breathe vehicle fumes all day'], concerns:['pollution'], products:[PC] },
  // smoking, said indirectly
  { g:'smoking', t:['I finish a pack a day and want to stop'], concerns:['smoking'], products:SMOKE },
  { g:'smoking', t:['i light up whenever i feel tense at work, how to stop this habit'], concerns:['smoking'], alt:['stress'], products:SMOKE },
  { g:'smoking', t:['my husband chain smokes, what can help him quit'], concerns:['smoking'], products:SMOKE, subject:'other' },
  { g:'smoking', t:['I chew tobacco and want to give it up'], concerns:['smoking'], products:SMOKE },
  { g:'smoking', t:['vape panna start panniten, ippo nirutha mudiyala'], concerns:['smoking'], products:SMOKE },
  { g:'smoking', t:['need help quitting beedi, been smoking 15 years'], concerns:['smoking'], products:SMOKE },
  { g:'smoking', t:['after every meal I crave a cigarette'], concerns:['smoking'], products:SMOKE },
  { g:'smoking', t:['how do I stop the urge to smoke'], concerns:['smoking'], products:SMOKE },
  // drinking / liver
  { g:'liver', t:['I have a few pegs every night after work'], concerns:['alcohol'], products:[LB] },
  { g:'liver', t:['weekend parties la full ah drink pannuvom'], concerns:['alcohol'], products:[LB] },
  { g:'liver', t:['I eat outside food almost every day because of my job'], concerns:['liver'], alt:['acidity'], products:[LB] },
  { g:'liver', t:['my diet is mostly oily fast food, worried about my liver'], concerns:['liver'], products:[LB] },
  { g:'liver', t:['want something to keep my liver in good shape'], concerns:['liver'], products:[LB] },
  { g:'liver', t:['I socially drink and want to take care of myself'], concerns:['alcohol'], products:[LB] },
  { g:'liver', t:['too much beer lately, feeling heavy'], concerns:['alcohol'], products:[LB] },
  // stress / anxiety / calm
  { g:'stress', t:['my job is very hectic and I always feel tense'], concerns:['stress'], products:[BF] },
  { g:'stress', t:['exams are coming and I am panicking'], concerns:['stress'], products:[BF] },
  { g:'stress', t:['I overthink everything and cannot relax'], concerns:['stress'], products:[BF] },
  { g:'stress', t:['team lead pressure romba iruku, mind calm aagave matengudhu'], concerns:['stress'], products:[BF] },
  { g:'stress', t:['need something to calm my nerves before presentations'], concerns:['stress'], products:[BF] },
  { g:'stress', t:['I get anxious in crowded places'], concerns:['stress'], products:[BF] },
  { g:'stress', t:['work from home has made me restless and irritated'], concerns:['stress'], products:[BF] },
  // tiredness / energy
  { g:'energy', t:['I do night shifts and feel drained all the time'], concerns:['tired'], products:[EB] },
  { g:'energy', t:['by 3 pm I have no energy left at the office'], concerns:['tired'], products:[EB] },
  { g:'energy', t:['I feel lazy and sluggish every morning'], concerns:['tired'], products:[EB] },
  { g:'energy', t:['gym ku poga energy illa, romba weak ah feel aguthu'], concerns:['tired'], products:[EB] },
  { g:'energy', t:['long driving hours make me exhausted'], concerns:['tired'], products:[EB] },
  { g:'energy', t:['I need more stamina for my busy schedule'], concerns:['tired'], products:[EB] },
  { g:'energy', t:['always yawning and dull at work'], concerns:['tired'], alt:['sleep'], products:[EB] },
  // periods
  { g:'period', t:['the first two days of my cycle are very painful'], concerns:['period'], products:[CR] },
  { g:'period', t:['my lower tummy hurts a lot during that time of the month'], concerns:['period'], products:[CR] },
  { g:'period', t:['menses time la vayiru romba valikuthu'], concerns:['period'], products:[CR] },
  { g:'period', t:['my daughter is 22 and gets bad cramps monthly'], concerns:['period'], products:[CR], subject:'other' },
  { g:'period', t:['PMS makes me bloated and uncomfortable'], concerns:['period'], alt:['acidity'], products:[CR] },
  { g:'period', t:['anything natural for monthly pain?'], concerns:['period'], products:[CR] },
  // immunity / colds
  { g:'immunity', t:['I catch a cold every time the weather changes'], concerns:['cold'], alt:['immunity'], products:[PC] },
  { g:'immunity', t:['my immunity is low, I keep falling sick'], concerns:['immunity'], products:[PC] },
  { g:'immunity', t:['rainy season la adikadi sali pidikuthu'], concerns:['cold'], alt:['immunity'], products:[PC] },
  { g:'immunity', t:['blocked nose and sneezing since two days'], concerns:['cold'], products:[PC] },
  { g:'immunity', t:['throat feels scratchy and I have a mild cough'], concerns:['cold'], products:[PC] },
  { g:'immunity', t:['want to build my resistance against infections'], concerns:['immunity'], products:[PC] },
  // problems with tips but no product
  { g:'no-product', t:['I lie awake till 3 am every night'], concerns:['sleep'], products:[] },
  { g:'no-product', t:['phone use at night is ruining my sleep'], concerns:['sleep'], products:[] },
  { g:'no-product', t:['my stomach burns after spicy food'], concerns:['acidity'], products:[] },
  { g:'no-product', t:['sour burps after dinner'], concerns:['acidity'], products:[] },
  { g:'no-product', t:['I have not been regular in the toilet this week'], concerns:['constipation'], products:[] },
  { g:'no-product', t:['my eyes get dry staring at the laptop'], concerns:['eyes'], products:[] },
  { g:'no-product', t:['neck and shoulder pain from my desk job'], concerns:['back'], alt:['joints'], products:[] },
  { g:'no-product', t:['my knees creak and hurt when I squat'], concerns:['joints'], products:[] },
  { g:'no-product', t:['oily skin with lots of pimples'], concerns:['acne'], products:[] },
  { g:'no-product', t:['my hair is thinning at the front'], concerns:['hair'], products:[] },
  { g:'no-product', t:['itchy flaky scalp'], concerns:['dandruff'], products:[] },
  { g:'no-product', t:['painful white spot inside my lip'], concerns:['ulcer'], products:[] },
  { g:'no-product', t:['I feel like vomiting when I travel by bus'], concerns:['nausea'], products:[] },
  { g:'no-product', t:['my head pounds after long screen time'], concerns:['headache'], alt:['eyes'], products:[] },
  { g:'no-product', t:['dry cracked heels that hurt when I walk'], concerns:['feet'], products:[] },
  { g:'no-product', t:['body is a little warm since morning'], concerns:['fever'], products:[] },
  // a new problem after an earlier topic, with "any product": must NOT reuse the old topic
  { g:'switch', t:['how to take care of my liver', TIPS, 'i work in delhi and face respiratory issues is there any product'], concerns:['pollution'], alt:['lungs'], products:[PC] },
  { g:'switch', t:['I am stressed at work', TIPS, 'also my periods are very painful, anything for that?'], concerns:['period'], products:[CR] },
  { g:'switch', t:['I drink every weekend', TIPS, 'I also smoke, is there any product for it'], concerns:['smoking'], products:SMOKE },
  { g:'switch', t:['I get acidity', TIPS, 'and I feel tired all day, any product?'], concerns:['tired'], products:[EB] },
  { g:'switch', t:['my hair is falling', TIPS, 'I catch colds easily too, what do you have'], concerns:['cold'], alt:['immunity'], products:[PC] },
  { g:'switch', t:['period cramps', TIPS, 'what about something for stress'], concerns:['stress'], products:[BF] },
  { g:'switch', t:['I smoke a lot', TIPS, 'my friend drinks daily, any product for him'], concerns:['alcohol'], products:[LB], subject:'other' },
  { g:'switch', t:['cant sleep', TIPS, 'dust allergy at my workplace, any product to help my breathing'], concerns:['pollution'], alt:['lungs'], products:[PC] },
  // genuine follow-ups: keep the earlier topic
  { g:'follow-up', t:['I work near a factory and breathe smoke daily', TIPS, 'is there any product'], concerns:['pollution'], products:[PC] },
  { g:'follow-up', t:['I feel tired every afternoon', TIPS, 'which product should I use'], concerns:['tired'], products:[EB] },
  { g:'follow-up', t:['my periods hurt a lot', TIPS, 'any product for this?'], concerns:['period'], products:[CR] },
  { g:'follow-up', t:['so much office pressure', TIPS, 'do you sell anything for it'], concerns:['stress'], products:[BF] },
  { g:'follow-up', t:['I drink most nights', TIPS, 'what would you recommend'], concerns:['alcohol'], products:[LB] },
  { g:'follow-up', t:['I want to quit cigarettes', TIPS, 'which one is best for me?'], concerns:['smoking'], products:SMOKE },
  { g:'follow-up', t:['sneezing and runny nose', TIPS, 'anything else?'], concerns:['cold'], products:[PC] },
  // no health topic: no products
  { g:'none', t:['where is your office located'], concerns:[], products:[] },
  { g:'none', t:['do you deliver to bangalore'], concerns:[], products:[] },
  { g:'none', t:['I love cooking on weekends'], concerns:[], products:[] },
  { g:'none', t:['what is the weather today'], concerns:[], products:[] },
  { g:'none', t:['I just moved to delhi for work'], concerns:[], products:[] },
  { g:'none', t:['my friend recommended your website'], concerns:[], products:[] },
  { g:'none', t:['I play cricket every evening'], concerns:[], products:[] }
];

export { CASES };
