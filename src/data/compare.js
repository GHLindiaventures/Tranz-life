// Before / after comparison content, by product id. The visuals are conceptual illustrations of what a product is
// designed to support, not clinical results; every claim below is taken from the product's own label.
// Images: made by scripts/make-compare-layers.py (cut-out organs) or scripts/make-compare-photos.py (a pair of
// photos, shown full-picture with fill: true); two layers per product, same size and alignment.
export const COMPARE = {
  // From the CycleRelief brochure, which says not to describe the product as treating menstrual cramps or
  // gynaecological conditions: so this speaks of a comfort and self-care routine, never of relief or results.
  rollon: {
    eyebrow: 'CycleRelief™ Roll-On · Plant-based topical care',
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
    // brochure: "Ingredient profile" (complete declaration to be confirmed from the final formulation)
    botanicalsTitle: 'Ingredients shown in the artwork',
    botanicals: [['Dill essential oil', ''], ['Eucalyptus essential oil', '']],
    note: 'Illustrative only: these images show the self-care routine CycleRelief Roll-On is designed for. They are not clinical before-and-after results, and individual experience varies. For external personal-care use only; it is not intended to diagnose, treat, cure or prevent any condition. Perform a patch test before first use. Avoid eyes, mucous membranes, and broken or irritated skin, and discontinue if irritation occurs. Essential oils may not be suitable during pregnancy or for people with sensitivities; seek professional advice where appropriate. Keep out of reach of children.'
  },
  // The Reviva label also makes blood-sugar / diabetes claims; those are deliberately NOT used here (the brochure
  // positions it as a topical massage / personal-care product, and diabetes is a scheduled condition under India's
  // Drugs and Magic Remedies Act). This speaks only of a morning massage ritual, comfort and everyday vitality.
  reviva: {
    eyebrow: 'Reviva™ Roll-On · Botanical massage roll-on',
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
  // From the BreatheFree brochure. Kept to its behavioural wording (resisting the urge, relaxation, focus); no
  // claims that it repairs the lungs or is a medical smoking-cessation treatment, and no cigarette is shown lit.
  inhaler: {
    eyebrow: 'BreatheFree™ Aromatherapy Inhaler · Pure essential oils',
    title: ['Designed to help you', 'breathe free'],
    intro: 'Drag the slider to compare. A visual guide to the moment this pocket aromatherapy inhaler is designed for: reaching for a calming breath instead of a cigarette.',
    fill: true,
    before: {
      label: 'Before',
      sub: 'The urge hits',
      img: '/assets/compare/inhaler-before.webp',
      alt: 'A stressed man on a grey city terrace, hand on his forehead, holding a cigarette pack',
      tags: ['Stress and restlessness', 'The urge to smoke', 'Hard to stay focused']
    },
    after: {
      label: 'After',
      sub: 'With BreatheFree',
      img: '/assets/compare/inhaler-after.webp',
      alt: 'The same man calm on a green, sunlit terrace, breathing in from a small white inhaler, the cigarette pack crushed and set aside',
      tags: ['Helps resist the urge', 'Relaxation & focus', 'Natural & non-addictive']
    },
    size: [2100, 1000],
    // brochure: benefits list, "How to use", "Pocket friendly"
    benefits: [
      ['Helps resist the urge', 'A calming aromatic breath to reach for when the urge to smoke strikes.'],
      ['Relaxation & focus', 'A pure essential-oil blend that supports emotional balance and a calmer mind.'],
      ['Easy breathing', 'Fresh peppermint and eucalyptus help you feel refreshed and breathe easy.'],
      ['Open · Inhale · Relax', 'Remove the cap, inhale deeply through each nostril, and use whenever you need it.'],
      ['Pocket friendly', 'Compact and discreet, so you can use it at work, while travelling or anytime.']
    ],
    icons: ['shield', 'leaf', 'wind', 'spark', 'drop'],
    botanicalsTitle: 'Pure essential oils',
    botanicals: [
      ['Peppermint oil', ''], ['Lavender oil', ''], ['Eucalyptus oil', ''],
      ['Lemon oil', ''], ['Black pepper oil', ''], ['Tulsi oil', '']
    ],
    note: 'Illustrative only: these images show the moment BreatheFree Aromatherapy Inhaler is designed for. They are not clinical before-and-after results, and individual experience varies. BreatheFree is an aromatherapy personal-care product, not a medicine or nicotine replacement therapy, and it is not intended to diagnose, treat, cure or prevent any disease. For inhalation only: do not insert deep into the nostril, and keep away from eyes. Essential oils may not be suitable during pregnancy, for children, or for people with asthma or sensitivities; seek professional advice where appropriate. For support with quitting smoking, speak to a healthcare professional. Keep out of reach of children.'
  },
  energy: {
    eyebrow: 'Energy Booster™ · Herbal & bioactive wellness formulation',
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
    eyebrow: 'Lung Booster · PulmoClear Gummies',
    title: ['Designed to support', 'clearer, stronger lungs'],
    intro: 'Drag the slider to compare. A visual guide to what these 100% Ayurvedic gummies are designed to support: they detoxify, cleanse and strengthen.',
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
      tags: ['Supports lung detoxification', 'Supports easy breathing', 'Antioxidant protection']
    },
    size: [1200, 820],
    // label: "Key benefits"
    benefits: [
      ['Lung detoxification', 'Helps cleanse lungs and remove pollutants.'],
      ['Supports respiratory health', 'Helps soothe and strengthen respiratory function.'],
      ['Natural immunity support', 'Strengthens the body’s natural defences.'],
      ['Relieves congestion', 'Helps clear congestion and supports easy breathing.'],
      ['Antioxidant & anti-inflammatory', 'Protects lung cells from oxidative stress and inflammation.']
    ],
    icons: ['lungs', 'shield', 'leaf', 'wind', 'spark'],
    // label: "Composition (each gummy contains)"
    botanicalsTitle: 'Each gummy contains',
    botanicals: [
      ['Vasaka', '100 mg'], ['Tulsi', '100 mg'], ['Mulethi', '100 mg'], ['Turmeric', '80 mg'], ['Giloy', '80 mg'],
      ['Black Pepper', '50 mg'], ['Vitamin C', '40 mg'], ['Vitamin D3', '10 mcg'], ['Zinc', '5 mg']
    ],
    note: 'Illustrative only: these images show what Lung Booster is designed to support. They are not clinical before-and-after results, and individual experience varies. Lung Booster is a nutraceutical, not for medicinal use, and is not intended to diagnose, treat, cure or prevent any disease. Not recommended for pregnant or lactating women; consult your physician if you are under medication.'
  },
  liver: {
    eyebrow: 'Liver Booster · LiverDetox',
    title: ['Designed to support a', 'cleaner, healthier liver'],
    intro: 'Drag the slider to compare. A visual guide to what this 100% Ayurvedic polyherbal concoction is designed to support: it detoxifies, protects and rejuvenates.',
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
      tags: ['Supports natural detoxification', 'Antioxidant protection', 'Supports digestion & vitality']
    },
    size: [1200, 820],
    // label: "Product benefits"
    benefits: [
      ['Supports liver detoxification', 'Helps flush out toxins and supports natural cleansing.'],
      ['Promotes liver health', 'Protects liver cells and supports healthy liver function.'],
      ['Powerful antioxidant', 'Rich in natural antioxidants that combat oxidative stress.'],
      ['Improves digestion', 'Supports digestion and nutrient absorption.'],
      ['Enhances vitality', 'Helps improve energy, immunity and overall well-being.']
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
