// Before / after comparison content, by product id. The visuals are conceptual illustrations of what a product is
// designed to support, not clinical results; every claim below is taken from the product's own label.
// Images: made by scripts/make-compare-layers.py (cut-out organs) or scripts/make-compare-photos.py (a pair of
// photos, shown full-picture with fill: true); two layers per product, same size and alignment.
export const COMPARE = {
  // From the CycleRelief brochure, which says not to describe the product as treating menstrual cramps or
  // gynaecological conditions: so this speaks of a comfort and self-care routine, never of relief or results.
  rollon: {
    eyebrow: 'CycleRelief Roll-On · Plant-based topical care',
    title: ['Designed for a soothing', 'self-care ritual'],
    intro: 'Drag the slider to compare. A visual guide to the routine this plant-based roll-on is designed for: a soothing self-care ritual around the menstrual cycle.',
    fill: true,
    before: {
      label: 'Before',
      sub: 'Uneasy days',
      img: '/assets/compare/cycle-before.webp',
      alt: 'Illustration of a young woman holding her stomach, looking uncomfortable',
      tags: ['Monthly discomfort', 'Tense, uneasy days', 'Low mood']
    },
    after: {
      label: 'After',
      sub: 'With the CycleRelief ritual',
      img: '/assets/compare/cycle-after.webp',
      alt: 'Illustration of the same young woman smiling and relaxed',
      tags: ['Soothing self-care ritual', 'Easy roll-on routine', 'Plant-based topical care']
    },
    size: [2100, 1000],
    // brochure: "Product highlights", "The TranzLife approach"
    benefits: [
      ['Easy to apply', 'A convenient roll-on format for a simple self-care ritual.'],
      ['For external use', 'Apply a small amount to intact external skin and massage gently.'],
      ['Comfort & relaxation', 'A simple addition to a personal comfort and relaxation routine.'],
      ['Portable 8 ml pack', 'Small enough to keep with you through every cycle.'],
      ['Plant-based', 'Inspired by botanical ingredients and designed for simple, everyday wellness routines.']
    ],
    icons: ['drop', 'shield', 'spark', 'cycle', 'leaf'],
    // composition sheet (src/data/ingredients.js); the brochure artwork showed only dill and eucalyptus
    botanicalsTitle: 'Ingredients',
    botanicals: [['Wintergreen oil', ''], ['Peppermint oil', ''], ['Ginger', ''], ['Lavender oil', ''], ['Eucalyptus oil', ''], ['Sesame oil base', '']],
    note: 'Illustrative only: these images show the self-care routine CycleRelief Roll-On is designed for. They are not clinical before-and-after results, and individual experience varies. For external personal-care use only; it is not intended to diagnose, treat, cure or prevent any condition. Perform a patch test before first use. Avoid eyes, mucous membranes, and broken or irritated skin, and discontinue if irritation occurs. Essential oils may not be suitable during pregnancy or for people with sensitivities; seek professional advice where appropriate. Keep out of reach of children.'
  },
  // The Reviva label also makes blood-sugar / diabetes claims; those are deliberately NOT used here (the brochure
  // positions it as a topical massage / personal-care product, and diabetes is a scheduled condition under India's
  // Drugs and Magic Remedies Act). This speaks only of a morning massage ritual, comfort and everyday vitality.
  reviva: {
    eyebrow: 'Reviva Roll-On · Botanical massage roll-on',
    title: ['Designed for a refreshing', 'morning self-care ritual'],
    intro: 'Drag the slider to compare. A visual guide to the routine this botanical massage roll-on is designed for: a simple morning ritual to start the day feeling refreshed.',
    fill: true,
    before: {
      label: 'Before',
      sub: 'A heavy start',
      img: '/assets/compare/reviva-before.webp',
      alt: 'A tired man sitting on the edge of his bed in dim morning light, rubbing his neck',
      tags: ['Sluggish mornings', 'Stiff and tired', 'Low on vitality']
    },
    after: {
      label: 'After',
      sub: 'With the Reviva ritual',
      img: '/assets/compare/reviva-after.webp',
      alt: 'The same man refreshed and smiling in warm sunlight, holding a roll-on bottle',
      tags: ['Refreshing morning ritual', 'Easy roll-on massage', 'Everyday vitality']
    },
    size: [2100, 1000],
    // label: "How to use", "Ingredients"; benefits kept to the label's comfort / well-being wording
    benefits: [
      ['Morning ritual', 'Roll gently around the belly button every morning, as part of a daily routine.'],
      ['Easy to apply', 'A mess-free massage roll-on for a quick, simple self-care moment.'],
      ['Comfort & well-being', 'A soothing massage designed to complement comfort and overall well-being.'],
      ['Balance · Restore · Revitalize', 'A refreshing start that complements everyday vitality.'],
      ['50 ml roll-on', 'For external use on intact skin only.']
    ],
    icons: ['spark', 'drop', 'leaf', 'bolt', 'shield'],
    botanicalsTitle: 'Ingredients',
    botanicals: [['Dill essential oil', ''], ['Eucalyptus essential oil', '']],
    note: 'Illustrative only: these images show the self-care routine Reviva Roll-On is designed for. They are not clinical before-and-after results, and individual experience varies. For external personal-care use only; it is not intended to diagnose, treat, cure or prevent any disease, and it is not a substitute for prescribed medication or medical advice. Perform a patch test before first use. Avoid eyes, mucous membranes, and broken or irritated skin, and discontinue if irritation occurs. Essential oils may not be suitable during pregnancy or for people with sensitivities; seek professional advice where appropriate. Keep out of reach of children.'
  },
  // Aroma Inhaler (the brochure called it BreatheFree). Wording follows the client brief: relaxation and a mindful
  // pause, no smoking-cessation or treatment claims. The photos still show a cigarette pack; swap them when new ones arrive.
  inhaler: {
    eyebrow: 'Aroma Inhaler · Pure essential oils',
    title: ['Designed for a', 'moment of calm'],
    intro: 'Drag the slider to compare. A visual guide to the moment this pocket aromatherapy inhaler is designed for: pausing for a calming, aromatic breath in a stressful day.',
    fill: true,
    before: {
      label: 'Before',
      sub: 'A stressful moment',
      img: '/assets/compare/inhaler-before.webp',
      alt: 'A stressed man on a grey city terrace, hand on his forehead, holding a cigarette pack',
      tags: ['Stress and restlessness', 'A busy, pressured day', 'Hard to stay focused']
    },
    after: {
      label: 'After',
      sub: 'With the Aroma Inhaler',
      img: '/assets/compare/inhaler-after.webp',
      alt: 'The same man calm on a green, sunlit terrace, breathing in from a small white inhaler, the cigarette pack crushed and set aside',
      tags: ['A mindful pause', 'Relaxation & focus', 'Pure essential oils']
    },
    size: [2100, 1000],
    // brochure: benefits list, "How to use", "Pocket friendly"
    benefits: [
      ['A mindful pause', 'A calming aromatic breath to reach for whenever the day gets busy.'],
      ['Relaxation & focus', 'A pure essential-oil blend for a calmer, more balanced moment.'],
      ['A fresh feeling', 'Peppermint and eucalyptus give a cool, refreshing aroma.'],
      ['Open · Inhale · Relax', 'Remove the cap, inhale gently through each nostril, and use whenever you need a pause.'],
      ['Pocket friendly', 'Compact and discreet, so you can use it at work, while travelling or anytime.']
    ],
    icons: ['shield', 'leaf', 'wind', 'spark', 'drop'],
    botanicalsTitle: 'Pure essential oils',
    botanicals: [
      ['Peppermint oil', ''], ['Lavender oil', ''], ['Eucalyptus oil', ''],
      ['Lemon oil', ''], ['Black pepper oil', ''], ['Tulsi oil', '']
    ],
    note: 'Illustrative only: these images show the moment the Aroma Inhaler is designed for. They are not clinical before-and-after results, and individual experience varies. The Aroma Inhaler is an aromatherapy personal-care product, not a medicine or nicotine replacement therapy, and it is not intended to diagnose, treat, cure or prevent any disease. For inhalation only: do not insert deep into the nostril, and keep away from eyes. Essential oils may not be suitable during pregnancy, for children, or for people with asthma or sensitivities; seek professional advice where appropriate. For support with quitting smoking, speak to a healthcare professional. Keep out of reach of children.'
  },
  energy: {
    eyebrow: 'Energy Booster · Herbal & bioactive wellness formulation',
    title: ['Designed to complement', 'everyday energy'],
    intro: 'Drag the slider to compare. A visual guide to what this oral liquid is designed to complement: daily energy, activity and general well-being.',
    fill: true,
    before: {
      label: 'Before',
      sub: 'Running low',
      img: '/assets/compare/energy-before.webp',
      alt: 'A tired man at his desk, head in hand, surrounded by paperwork',
      tags: ['Feeling drained', 'Low on energy', 'Less active days']
    },
    after: {
      label: 'After',
      sub: 'Complemented with Energy Booster',
      img: '/assets/compare/energy-after.webp',
      alt: 'An energetic man outdoors in the sunshine, arms raised',
      tags: ['Complements daily energy', 'Supports an active lifestyle', 'General well-being']
    },
    size: [2100, 1000],
    // brochure: "Wellness positioning", "Product at a glance", "Directions for use"
    benefits: [
      ['Complements daily energy', 'For adults seeking to complement daily energy, activity and general well-being.'],
      ['Active lifestyle', 'Designed to complement an active lifestyle and everyday wellness routine.'],
      ['Botanical & mineral blend', 'Selected botanical and mineral-origin ingredients in a ready-to-use liquid.'],
      ['Simple measured routine', '7.5 ml twice daily, or as advised by a healthcare professional.'],
      ['500 ml oral liquid', 'Use the measuring device supplied with the pack and follow the approved label.']
    ],
    icons: ['bolt', 'cycle', 'leaf', 'drop', 'shield'],
    // brochure: "Key ingredients" (potencies as listed; complete composition on the approved label)
    botanicalsTitle: 'Key ingredients',
    botanicals: [
      ['Ruta graveolens', 'Q'], ['Hecla lava', '3X'], ['Symphytum officinale', 'Q'],
      ['Calcarea phosphorica', '8X'], ['Echinacea angustifolia', 'Q']
    ],
    note: 'Illustrative only: these images show what Energy Booster is designed to complement. They are not clinical before-and-after results, and individual experience varies. No claim is made to diagnose, treat, cure or prevent any disease. Use only as directed and do not exceed the recommended serving. Consult a qualified healthcare professional before use if pregnant, breastfeeding, taking medication or managing a health condition. Keep out of reach of children.'
  },
  gummies: {
    eyebrow: 'Lung Booster Gummies · Respiratory wellness',
    title: ['Designed for everyday', 'respiratory wellness'],
    intro: 'Drag the slider to compare. A visual guide to what these botanical gummies are designed for: everyday respiratory wellness alongside a healthy lifestyle.',
    before: {
      label: 'Before',
      sub: 'Everyday pollutants',
      img: '/assets/compare/lungs-before.webp',
      alt: 'Illustration of discoloured lungs burdened by everyday pollutants',
      tags: ['Pollutant build-up', 'Congestion', 'Oxidative stress']
    },
    after: {
      label: 'After',
      sub: 'Supported with Lung Booster',
      img: '/assets/compare/lungs-after.webp',
      alt: 'Illustration of healthy, clear lungs',
      tags: ['Traditional botanicals', 'Vitamin C, D3 & Zinc', 'Everyday respiratory wellness']
    },
    size: [1200, 820],
    // wording: the client brief (wellness positioning, no treatment claims)
    benefits: [
      ['Respiratory wellness', 'Botanicals traditionally used in Ayurvedic respiratory preparations.'],
      ['Traditional botanicals', 'Tulsi, Vasaka, dry ginger, long pepper and licorice root.'],
      ['Vitamins & minerals', 'Vitamin C, Vitamin D3 and Zinc, which contribute to normal immune function.'],
      ['Easy gummy format', 'A convenient, berry-flavoured gummy for modern routines.'],
      ['Quality-focused', 'Developed with an emphasis on ingredient specifications and consistency.']
    ],
    icons: ['lungs', 'shield', 'leaf', 'wind', 'spark'],
    // composition sheet (src/data/ingredients.js); quantities are on the product label
    botanicalsTitle: 'Key ingredients',
    botanicals: [
      ['Tulsi', ''], ['Vasaka', ''], ['Dry Ginger (Sukku)', ''], ['Long Pepper (Thippili)', ''], ['Black Pepper', ''],
      ['Black Turmeric (Karumanjal)', ''], ['Cumin (Jeera)', ''], ['Licorice Root', ''], ['Small Onion Extract', ''],
      ['Vitamin C', ''], ['Vitamin D3', ''], ['Zinc', '']
    ],
    note: 'Illustrative only: these images show what Lung Booster is designed to support. They are not clinical before-and-after results, and individual experience varies. Lung Booster is a nutraceutical, not for medicinal use, and is not intended to diagnose, treat, cure or prevent any disease. Not recommended for pregnant or lactating women; consult your physician if you are under medication.'
  },
  liver: {
    eyebrow: 'Liver Booster · Ayurvedic liver wellness',
    title: ['Designed for everyday', 'liver wellness'],
    intro: 'Drag the slider to compare. A visual guide to what this classical Ayurvedic polyherbal liquid is designed for: everyday liver wellness alongside a balanced lifestyle.',
    before: {
      label: 'Before',
      sub: 'Everyday strain',
      img: '/assets/compare/liver-before.webp',
      alt: 'Illustration of a dull, mottled liver under everyday strain',
      tags: ['Toxin build-up', 'Oxidative stress', 'Sluggish digestion']
    },
    after: {
      label: 'After',
      sub: 'Supported with Liver Booster',
      img: '/assets/compare/liver-after.webp',
      alt: 'Illustration of a smooth, healthy liver',
      tags: ['11 classical botanicals', 'Natural antioxidants', 'Balanced lifestyle']
    },
    size: [1200, 820],
    // wording: the client brief (wellness positioning, no treatment claims)
    benefits: [
      ['Liver wellness', 'Classical botanicals traditionally used in Ayurvedic liver-wellness preparations.'],
      ['Eleven botanicals', 'Led by Bhumyamalaki, Kalmegh and Kutki.'],
      ['Natural antioxidants', 'Amla, Haritaki and Turmeric are natural sources of antioxidants.'],
      ['Everyday routine', '10 ml twice daily after meals.'],
      ['Balanced lifestyle', 'Made to complement a balanced diet, regular activity and limited alcohol.']
    ],
    icons: ['drop', 'shield', 'spark', 'cycle', 'bolt'],
    // label: "Composition (each 10 ml contains)"
    botanicalsTitle: 'Each 10 ml contains 11 classical botanicals',
    botanicals: [
      ['Bhumyamalaki', '500 mg'], ['Kalmegh', '400 mg'], ['Kutki', '400 mg'], ['Punarnava', '300 mg'],
      ['Bhringraj', '300 mg'], ['Daruharidra', '200 mg'], ['Guduchi', '200 mg'], ['Amla', '200 mg'],
      ['Haritaki', '200 mg'], ['Turmeric', '150 mg'], ['Black Pepper', '50 mg']
    ],
    note: 'Illustrative only: these images show what Liver Booster is designed to support. They are not clinical before-and-after results, and individual experience varies. Liver Booster is an Ayurvedic proprietary medicine and is not intended to diagnose, treat, cure or prevent any disease. Not recommended for pregnant or lactating women; consult your physician if you are under medication.'
  }
};
