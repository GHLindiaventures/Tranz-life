// TranzLife product catalogue used by the Tulsi chat, taken from the client's brochure and product posters
// in "new resource/" (November 2026). The shop section still uses src/data/products.js.
//
// Wording rules (health safety and advertising rules):
//   - describe what each product is made for, in "support" / "made for" language; never cure, treat or prevent
//   - Reviva: never repeat the poster's blood-sugar claims or its comparison with diabetes medicines; always say it
//     does not replace diabetes medicine
//   - only products with status 'available' are recommended; 'pipeline' ones are "coming soon"; R&D work is never mentioned
//
// Fields: id, name, short (card title), match (how visitors refer to it), status, form, size, price (₹, null if not
// printed), forProblems / aliases / questions (matching data for the understanding layer, never shown), pitch (one short line used when suggesting it), about (what it is made for), mechanism (plain-language explanation of how and why the product may help, used when visitors ask "how does it work"), use (directions on the pack), caution, ingested (swallowed), note (always said), suitability (who can use the product — used when visitors ask "can anyone / a normal person take this?")

const CATALOG = [
  { id:'pulmoclear', forProblems:['lung health', 'smokers lungs', 'dust and pollution exposure', 'frequent colds', 'cough and congestion', 'low immunity', 'traffic smoke', 'airways comfort', 'tickling chest'], aliases:['lung booster', 'pulmo clear', 'lung gummies', 'lungs gummy'], questions:['what do you have for lungs', 'gummies for lung health', 'anything for my lungs', 'product for smokers lungs', 'pollution nala mooku adaikuthu gummies', 'gummies for frequent colds'], pitch:'Ayurvedic herbal gummies made to support respiratory wellness and natural immunity', name:'PulmoClear Lung Booster Gummies', short:'PulmoClear Gummies', status:'available', ingested:true,
    match:/pulmo\s*clear(?!.{0,15}crav)|lung\s*booster/i, form:'Gummies', size:'60 gummies, natural berry flavour', price:null,
    about:'Ayurvedic herbal gummies with vasaka, tulsi, mulethi, turmeric, giloy and black pepper extracts, plus vitamin C, vitamin D3 and zinc, made to support respiratory wellness and natural immunity.',
    mechanism:'These gummies combine Ayurvedic herbs traditionally used in Indian herbal practice for respiratory comfort: vasaka and mulethi are traditionally used to soothe the throat and airways, and tulsi, turmeric and giloy are traditionally used to support natural immunity. Vitamin C, vitamin D3 and zinc are added because these nutrients play a role in normal immune function, and black pepper extract is traditionally added alongside the other herbs.',
    suitability:'Made for adults who want to support their respiratory wellness and natural immunity. You do not need to be a smoker to use them.',
    use:'Adults: 2 gummies twice daily after meals. Chew well before swallowing. Do not exceed the recommended daily amount.',
    caution:'Not recommended in pregnancy or while breastfeeding. Check with your doctor first if you take regular medicine. Keep out of reach of children. It is a nutraceutical, not a medicine.' },
  { id:'craving-gummies', forProblems:['quit smoking', 'nicotine cravings', 'tobacco habit', 'smoking stress'], aliases:['craving gummies', 'quit smoking gummies', 'anti smoking gummies'], questions:['gummies to stop smoking', 'what helps cigarette cravings', 'product for heavy smokers'], pitch:'nicotine-free herbal gummies made to support you while you cut down or quit smoking', name:'PulmoClear Craving Control Gummies', short:'Craving Control Gummies', status:'available', ingested:true,
    match:/craving\s*control\s*gumm|pulmo\s*clear.{0,15}crav|crav\w*\s*gumm/i, form:'Gummies', size:'Gummies for heavy smokers', price:null,
    about:'Nicotine-free herbal gummies with ashwagandha, L-theanine, black pepper extract, tulsi and vasaka extracts, vitamin C and zinc, made to support people who are cutting down or quitting smoking, including cravings and the stress that comes with them.',
    mechanism:'Quitting smoking is hard partly because of the stress and restlessness that come with it. Ashwagandha is an adaptogenic herb traditionally used to help the body cope with stress, and L-theanine, found naturally in tea, is associated with a calm, focused feeling. Black pepper extract gives a mild throat sensation that some people find satisfying when the urge to smoke comes. Tulsi and vasaka are traditional Ayurvedic herbs used for respiratory comfort, and vitamin C and zinc play a role in normal immune function.',
    suitability:'Made for adults who are cutting down or quitting smoking. If you do not smoke, the Lung Booster Gummies are a better fit for general respiratory wellness.',
    use:'2 gummies daily after meals.',
    caution:'Check with your doctor first if you are pregnant, breastfeeding, or take regular medicine.' },
  { id:'breathefree', forProblems:['stress', 'anxiety moments', 'urge to smoke', 'calm and focus', 'work pressure', 'exam fear', 'restlessness', 'overthinking'], aliases:['breathe free', 'breathfree', 'aroma inhaler', 'stress inhaler'], questions:['inhaler for stress', 'something to calm me down', 'what helps when I feel stressed', 'instant ah calm aaga aromatherapy product', 'inhaler for anxiety'], pitch:'a nicotine-free pocket aromatherapy inhaler for calm moments when you feel stressed', name:'BreatheFree Aromatherapy Inhaler', short:'BreatheFree Inhaler', status:'available', ingested:false,
    match:/breathe\s*free/i, form:'Aromatherapy inhaler', size:'Pocket inhaler', price:null,
    about:'A nicotine-free, non-addictive pocket aromatherapy inhaler with peppermint, lavender, eucalyptus, lemon, black pepper and tulsi oils, made to support you on the journey to quitting smoking, and for calm, stressful moments.',
    mechanism:'Aromatherapy works through your sense of smell. Peppermint and eucalyptus give a fresh, cool feeling that can help you pause and reset in a stressful moment, and lavender is widely associated with relaxation. Black pepper oil gives a mild throat sensation that some people find helpful when the urge to smoke comes. It is nicotine-free and non-addictive.',
    suitability:'Made for adults who want a calming moment, whether or not they smoke. Many people keep it for stressful moments at work or at home.',
    use:'Remove the cap, inhale deeply through each nostril, and use whenever you feel the urge to smoke or feel stressed.',
    caution:'For inhalation only. Keep away from eyes and out of reach of children.' },
  { id:'craving-control', forProblems:['quit smoking', 'cigarette cravings', 'beedi and tobacco habit', 'night cravings', 'sudden craving', 'stop smoking urge'], aliases:['craving control', 'quit smoking inhaler', 'smoking inhaler', 'craving inhaler'], questions:['inhaler to quit smoking', 'what do you have for smokers', 'product to stop cigarettes', 'sudden craving varumpothu enna panlam', 'beedi quit panna inhaler'], pitch:'aromatherapy inhalers made to help you handle cravings while you quit', name:'Craving Control Aromatherapy Inhalers', short:'Craving Control Inhalers', status:'available', ingested:false,
    match:/craving\s*control(?!\s*gumm)|craving\s*control\s*(plus|gold|night)/i, form:'Aromatherapy inhaler series', size:'4 variants', price:null,
    about:'A premium aromatherapy inhaler series for tobacco cessation: Craving Control (for smokers of 10 or more cigarettes a day), Craving Control Plus (20 or more a day, high stress, strong withdrawal), Craving Control Gold (busy professionals) and Craving Control Night (night cravings, sleep disturbances and restlessness). Each uses a blend of essential oils such as black pepper, peppermint, vetiver, lemon, lavender and tulsi.',
    mechanism:'Each variant is blended for a different level of smoking habit. Black pepper oil gives a mild peppery throat sensation that some people find takes the edge off a craving, and peppermint gives a fresh, cool inhale. Vetiver, lavender and tulsi are traditionally associated with calm. Because these are aromatherapy inhalers (no nicotine, no medicine), they also give your hands and mouth a small ritual to replace the cigarette habit.',
    suitability:'Made for adults who are quitting smoking or tobacco; each variant suits a different level of use. If you do not smoke but want a calming inhaler, the BreatheFree Inhaler is a better fit.',
    use:'Open the inhaler, take 2 to 3 slow, deep inhalations, and repeat whenever cravings arise. Combine with drinking water and breathing exercises.',
    caution:'For inhalation only. Keep out of reach of children.' },
  { id:'respira', forProblems:['lung care range'], aliases:['respirajel', 'respira plus', 'respira'], questions:['what is respira', 'respira gummies'], pitch:'part of our lung care range', name:'RespiraJel+ Gummies and Respira+ Effervescent', short:'RespiraJel+ / Respira+', status:'available', ingested:true,
    match:/respira\s*jel|respira\s*\+|respira\s*plus|\brespira\b/i, form:'Gummies and effervescent tablets', size:null, price:null,
    about:'Part of the TranzLife lung care range. Full details are not in our product notes yet, so please ask the team through the Contact section.',
    mechanism: null,
    suitability: null,
    use:'Please follow the directions on the pack.', caution:'Check with your doctor first if you are pregnant, breastfeeding, or take regular medicine.' },
  { id:'liver-booster', forProblems:['liver health', 'alcohol habit', 'junk food habit', 'digestion', 'fatty liver risk', 'kalleeral detox', 'heavy digestion after outside food'], aliases:['liver tonic', 'liver syrup', 'liver detox', 'liverdetox'], questions:['what do you have for liver', 'product for drinkers', 'liver tonic for alcohol', 'fatty liver syrup', 'liver detox tonic'], pitch:'an Ayurvedic polyherbal liquid made to support liver health and digestion', name:'Liver Booster (LiverDetox)', short:'Liver Booster', status:'available', ingested:true,
    match:/liver\s*(booster|detox)|liverdetox/i, form:'Ayurvedic polyherbal liquid', size:null, price:null,
    about:'An Ayurvedic polyherbal liquid with herbs such as bhumyamalaki, kalmegh, kutki, punarnava, bhringraj, guduchi, amla and turmeric, made to support liver health, digestion and natural detoxification.',
    mechanism:'This liquid combines herbs traditionally used in Ayurveda for liver support: bhumyamalaki, kalmegh and kutki are traditionally used for the liver and digestion, punarnava is traditionally associated with the body\'s natural cleansing, and guduchi, amla and turmeric are traditionally used for their antioxidant properties. Together they are made to support everyday liver health and digestion.',
    suitability:'Made for adults who want to support their liver health and digestion, whether or not they drink.',
    use:'Adults: 10 ml (2 teaspoons) twice daily after meals. Shake well before use. Refrigerate after opening.',
    caution:'Not recommended in pregnancy or while breastfeeding. Check with your doctor first if you take regular medicine.',
    note:'It cannot undo the effects of heavy drinking; drinking less is what helps the liver most.' },
  { id:'cyclerelief', forProblems:['period cramps', 'menstrual pain', 'PMS discomfort', 'monthly cycle pain', 'chums pain', 'adi vayiru vali', 'stomach pain during periods'], aliases:['cycle relief', 'period roll on', 'periods rollon', 'menstrual roll on'], questions:['what do you have for periods', 'period pain product', 'roll on for cramps', 'chums pain ethavathu iruka', 'monthly cycle pain roll on'], pitch:'a plant-based roll-on made for menstrual comfort', name:'CycleRelief Roll-On', short:'CycleRelief Roll-On', status:'available', ingested:false,
    match:/cycle\s*relief|period\s*roll|menstrual\s*roll/i, form:'Roll-on', size:'8 ml', price:null,
    about:'A plant-based roll-on with dill and eucalyptus essential oils, made for menstrual comfort: to help ease period cramps and soothe tummy discomfort.',
    mechanism:'Dill essential oil has traditionally been used for tummy comfort, and eucalyptus oil gives a cool, fresh feel on the skin. Rolling it around the belly button with a gentle massage helps you relax the area where the cramps are felt. It is applied on the skin, not swallowed.',
    suitability:'Made for women who get period cramps or tummy discomfort during their cycle.',
    use:'Roll gently around the belly button every morning on an empty stomach. Use daily for best results.',
    caution:'For external use only. Avoid contact with eyes. Keep out of reach of children.' },
  { id:'reviva', forProblems:['diabetes wellness support', 'sugar patients', 'sugar level control', 'blood sugar management', 'sugar control roll on', 'support for sugar'], aliases:['reviva rollon', 'diabetes roll on', 'sugar roll on'], questions:['product for diabetes', 'anything for sugar patients', 'what do you have for diabetic people', 'sugar control panna ethavathu iruka', 'sugar level maintain panna product', 'product for sugar control'], pitch:'a massage roll-on made as natural wellness support for people living with diabetes', name:'Reviva Massage Roll-On', short:'Reviva Roll-On', status:'available', ingested:false,
    match:/reviva/i, form:'Massage roll-on', size:'50 ml', price:399,
    about:'A massage roll-on with dill and eucalyptus essential oils, made by TranzLife as a natural wellness support for people living with diabetes.',
    mechanism:'Reviva uses dill and eucalyptus essential oils in a gentle topical roll-on. A gentle massage around the belly button area with these fresh, cooling oils gives you a comforting daily ritual as natural wellness support. It works only through a gentle massage on the skin, and is meant to be used alongside the diabetes care your doctor has given you.',
    suitability:'Reviva is designed as an external wellness massage roll-on for people living with diabetes alongside their regular medical care. It is an external roll-on, not an ingested medicine, and does not replace prescribed diabetes medicines or insulin.',
    use:'Roll gently around the belly button every morning on an empty stomach. Use daily for best results.',
    caution:'For external use only. Avoid contact with eyes.',
    note:'It does not replace diabetes medicine. Please keep taking what your doctor has prescribed and keep checking your sugar as advised.' },
  { id:'energy-booster', forProblems:['tiredness', 'low stamina', 'low energy', 'long working hours', 'night shifts', 'drowsiness', 'exhaustion', 'dullness'], aliases:['energy tonic', 'energy syrup', 'stamina tonic', 'wellgen'], questions:['what do you have for energy', 'product for stamina', 'something for tiredness', 'daily evening dull and drowsy', 'night shift energy tonic'], pitch:'a herbal oral liquid made to support everyday energy and stamina', name:'Energy Booster', short:'Energy Booster', status:'available', ingested:true,
    match:/energy\s*booster|well\s*gen/i, form:'Oral liquid', size:'500 ml', price:null,
    about:'A herbal and bioactive oral liquid (ruta graveolens, hekla lava, symphytum, calcarea phosphorica and echinacea) made to support everyday energy, stamina and overall vitality.',
    mechanism:'Energy Booster is formulated with herbal and mineral bioactives (such as ruta graveolens, symphytum, calcarea phosphorica and echinacea) traditionally used to help support overall vitality, manage everyday fatigue, and maintain stamina during long working hours or busy schedules.',
    suitability:'Made for adults looking for everyday vitality and stamina support. Check with your doctor first if you take regular medication or have a chronic health condition.',
    use:'7.5 ml twice daily, or as recommended by a healthcare professional.',
    caution:'Check with your doctor first if you are pregnant, breastfeeding, or take regular medicine.' }
];

// Announced in the brochure but not on sale yet.
const COMING_SOON = ['Rasayana Elite', 'Total360', 'Golden Years', 'Femina', 'Viryamax', 'Kidzen'];
const COMING_SOON_MATCH = /rasayana|total\s*360|golden\s*years|femina|viryamax|kidzen/i;

// Words for a whole product type, so "roll on" or "inhalers" lists that type.
const KINDS = [
  { match:/roll[\s-]*ons?\b/i, ids:['cyclerelief', 'reviva'] },
  { match:/\binha(le|lae|lei|lo|el|l)rs?\b|\binhlaer\b/i, ids:['breathefree', 'craving-control'] },
  { match:/\bgumm(y|ies|is|ys|ie)\b/i, ids:['pulmoclear', 'craving-gummies', 'respira'] }
];

export { CATALOG, COMING_SOON, COMING_SOON_MATCH, KINDS };
