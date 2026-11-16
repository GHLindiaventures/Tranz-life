// Second held-out batch, written AFTER the fixes for real-questions.js and run once without tuning (an honest check).
//   node scripts/understand-eval.mjs --set real2
const CC = 'craving-control', CG = 'craving-gummies', PC = 'pulmoclear', LB = 'liver-booster', EB = 'energy-booster', BF = 'breathefree', CR = 'cyclerelief';
const SMOKE = [BF, PC];   // client, 13 Nov 2026: only the 6 launch products
const TIPS = 'Here are a few simple things that may help...';

const CASES = [
  { g:'breathing', t:['mumbai local trains are so crowded and dusty, my nose is always blocked'], concerns:['pollution'], alt:['cold'], products:[PC] },
  { g:'breathing', t:['I cough a lot in winter mornings'], concerns:['cold'], alt:['lungs'], products:[PC] },
  { g:'breathing', t:['my breathing is not as good as before, I want natural support'], concerns:['lungs'], products:[PC] },
  { g:'breathing', t:['painting work la smell and dust romba, nenju heavy ah iruku'], concerns:['pollution'], alt:['lungs'], products:[PC] },
  { g:'breathing', t:['I teach in a school near a highway, lots of exhaust'], concerns:['pollution'], products:[PC] },
  { g:'smoking', t:['I want to cut down from 20 cigarettes to zero'], concerns:['smoking'], products:SMOKE },
  { g:'smoking', t:['my dad smokes beedis daily, help him stop'], concerns:['smoking'], products:SMOKE, subject:'other' },
  { g:'smoking', t:['tried quitting thrice, cravings beat me every time'], concerns:['smoking'], products:SMOKE },
  { g:'smoking', t:['pan masala habit vittudanum'], concerns:['smoking'], products:SMOKE },
  { g:'liver', t:['I booze on fridays and saturdays'], concerns:['alcohol'], products:[LB] },
  { g:'liver', t:['my brother is a heavy drinker, can anything support his liver'], concerns:['alcohol'], alt:['liver'], products:[LB], subject:'other' },
  { g:'liver', t:['worried my liver is overloaded from all the junk I eat'], concerns:['liver'], products:[LB] },
  { g:'liver', t:['office parties every week, too much whisky'], concerns:['alcohol'], products:[LB] },
  { g:'stress', t:['deadlines are killing me, I am always on edge'], concerns:['stress'], products:[BF] },
  { g:'stress', t:['I get nervous before interviews'], concerns:['stress'], products:[BF] },
  { g:'stress', t:['family problems la mind romba disturbed ah iruku'], concerns:['stress'], products:[BF] },
  { g:'stress', t:['I feel mentally burnt out from work pressure'], concerns:['stress'], products:[BF] },
  { g:'energy', t:['I have no josh, always tired after lunch'], concerns:['tired'], products:[EB] },
  { g:'energy', t:['as a delivery rider I am worn out by evening'], concerns:['tired'], products:[EB] },
  { g:'energy', t:['how do I get my energy back, I feel weak and dull'], concerns:['tired'], products:[EB] },
  { g:'energy', t:['I work 12 hours a day and feel completely drained'], concerns:['tired'], products:[EB] },
  { g:'period', t:['periods la back and stomach ache'], concerns:['period'], products:[CR] },
  { g:'period', t:['menstrual discomfort every month, need something natural'], concerns:['period'], products:[CR] },
  { g:'period', t:['my wife has painful periods, anything for her?'], concerns:['period'], products:[CR], subject:'other' },
  // children are mentioned, so products are held back by design (safety rule), even though the visitor means themselves
  { g:'immunity', t:['my kids bring home every infection and I catch it too'], concerns:['immunity'], alt:['cold'], products:[] },
  { g:'immunity', t:['sore throat and sneezing since yesterday'], concerns:['cold'], products:[PC] },
  { g:'immunity', t:['I want to stay healthy during flu season'], concerns:['immunity'], alt:['cold'], products:[PC] },
  { g:'no-product', t:['I keep waking up at night and can not fall back asleep'], concerns:['sleep'], products:[] },
  { g:'no-product', t:['heartburn after biryani'], concerns:['acidity'], products:[] },
  { g:'no-product', t:['stomach feels hard and I strain in the toilet'], concerns:['constipation'], products:[] },
  { g:'no-product', t:['eyes red and tired after gaming'], concerns:['eyes'], products:[] },
  { g:'no-product', t:['lower back stiffness in the morning'], concerns:['back'], products:[] },
  { g:'no-product', t:['my ankles ache after standing all day'], concerns:['joints'], alt:['feet'], products:[] },
  { g:'no-product', t:['face la pimples adikadi varuthu'], concerns:['acne'], products:[] },
  { g:'no-product', t:['so much hair on my pillow every morning'], concerns:['hair'], products:[] },
  { g:'no-product', t:['migraine type headache in the evenings'], concerns:['headache'], products:[] },
  { g:'switch', t:['I feel tired always', TIPS, 'my office is near a cement factory, anything for my lungs?'], concerns:['pollution'], alt:['lungs'], products:[PC] },
  { g:'switch', t:['I smoke daily', TIPS, 'also my wife has period pain, any product for her?'], concerns:['period'], products:[CR], subject:'other' },
  { g:'switch', t:['hair fall problem', TIPS, 'I am also very stressed about my exams, do you have something'], concerns:['stress'], products:[BF] },
  { g:'switch', t:['I drink a lot', TIPS, 'and I get sneezing every morning, any product'], concerns:['cold'], products:[PC] },
  { g:'follow-up', t:['nightly drinks have become a habit', TIPS, 'anything from your range?'], concerns:['alcohol'], products:[LB] },
  { g:'follow-up', t:['I get exhausted by evening', TIPS, 'what do you suggest'], concerns:['tired'], products:[EB] },
  { g:'follow-up', t:['constant work tension', TIPS, 'which product can help me'], concerns:['stress'], products:[BF] },
  { g:'follow-up', t:['I breathe dust all day at work', TIPS, 'got anything for that?'], concerns:['pollution'], products:[PC] },
  { g:'none', t:['what are your office timings'], concerns:[], products:[] },
  { g:'none', t:['I go cycling every weekend'], concerns:[], products:[] },
  { g:'none', t:['my favourite food is dosa'], concerns:[], products:[] },
  { g:'none', t:['I am a software engineer in pune'], concerns:[], products:[] },
  { g:'none', t:['can I pay by UPI'], concerns:[], products:[] },
  { g:'none', t:['I drink buttermilk every afternoon'], concerns:[], products:[] }
];

export { CASES };
