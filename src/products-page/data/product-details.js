// Full product write-ups shown in the product sheet (lightbox) next to each product's design.
// Wording follows the client's brief: relaxation, comfort and wellness positioning, no treatment claims.
// Reviva has no write-up yet, so its sheet shows the design only.
const BRAND = {
  name: 'TranzLife Biosciences',
  tagline: 'Innovating Life Beyond Limits.',
  line: 'Where Natural Intelligence Meets Scientific Innovation.'
};

const DETAILS = {
  gummies: {
    eyebrow: 'Respiratory Wellness · PulmoClear™ formulation',
    title: 'TranzLife Lung Booster Gummies',
    tagline: 'Breathe Well. Live Better. Embrace Every Breath.',
    intro: [
      'Discover a new approach to everyday wellness with TranzLife Lung Booster Gummies, inspired by traditional botanical knowledge and contemporary product innovation.',
      'Selected botanicals, vitamins and minerals come together in a convenient gummy format designed for modern lifestyles, rooted in nature-inspired innovation and a commitment to quality.'
    ],
    listTitle: 'The power of botanicals in every gummy',
    list: [
      ['Tulsi (Holy Basil)', 'A traditional Indian botanical valued in herbal wellness practices.'],
      ['Vasaka', 'A botanical traditionally used in Ayurvedic respiratory wellness preparations.'],
      ['Dry Ginger (Sukku)', 'A familiar botanical ingredient used in traditional wellness formulations.'],
      ['Long Pepper (Thippili)', 'A traditional spice valued in Ayurvedic herbal preparations.'],
      ['Black Pepper', 'A natural spice containing piperine, studied for its interactions with certain nutrients.'],
      ['Black Turmeric (Karumanjal)', 'A distinctive botanical being explored for its phytochemical properties.'],
      ['Cumin (Jeera)', 'A traditional culinary ingredient included in the botanical formulation.'],
      ['Licorice Root', 'A botanical used in traditional herbal preparations.'],
      ['Small Onion Extract', 'A plant-derived ingredient included in the formulation.'],
      ['Vitamin C, Vitamin D3 & Zinc', 'Essential micronutrients that contribute to normal physiological functions in appropriate quantities.']
    ],
    highlightsTitle: 'Why choose Lung Booster Gummies?',
    highlights: [
      ['Convenient gummy format', 'Designed for easy consumption as directed on the product label.'],
      ['Botanical-inspired formulation', 'Inspired by traditional plant-based wellness practices.'],
      ['Micronutrient inclusion', 'Vitamins and minerals as specified in the final formulation.'],
      ['Quality-focused development', 'Emphasising ingredient specifications and formulation consistency.'],
      ['Modern wellness approach', 'Botanical inspiration and contemporary product development together.']
    ],
    note: 'Use only as directed on the product label. This product is not a substitute for medical treatment or a means of preventing or curing respiratory disease. Consult a qualified healthcare professional if you have a respiratory condition or take regular medication.'
  },

  inhaler: {
    eyebrow: 'Aromatherapy · Relaxation',
    title: 'TranzLife Aromatherapy Inhaler',
    tagline: 'Pause. Breathe. Relax. Rediscover Your Balance.',
    intro: [
      'A moment of calm, wherever life takes you. Work pressures, busy schedules and everyday responsibilities can leave us feeling overwhelmed; taking a moment to pause and reconnect can make a meaningful difference to your daily wellness routine.',
      'The TranzLife Aromatherapy Inhaler is a convenient, portable aromatherapy product, inspired by the relationship between aroma, sensory perception and relaxation, that brings a refreshing sensory experience into your everyday routine.'
    ],
    highlightsTitle: 'Why choose the Aromatherapy Inhaler?',
    highlights: [
      ['A convenient wellness companion', 'A compact, portable format designed to fit easily into everyday routines.'],
      ['An aromatic sensory experience', 'The distinctive aroma of its aromatic ingredients, as part of a personal wellness ritual.'],
      ['A moment to pause', 'Bring a brief pause and mindful breathing into your day whenever you need it.'],
      ['Inspired by nature', 'Reflecting TranzLife’s interest in botanical ingredients and nature-inspired innovation.'],
      ['Designed for modern lifestyles', 'A practical format for people who value simple self-care routines.']
    ],
    closingTitle: 'Make space for a moment of calm',
    closing: 'Wellness is not always about big changes. Use the inhaler as part of a personal relaxation routine alongside mindful breathing, adequate rest, regular physical activity and healthy daily habits.',
    note: 'Use according to the product directions. Individual experiences with aromas may differ; aromatherapy is a complementary wellness practice, not a replacement for professional mental healthcare.'
  },

  rollon: {
    eyebrow: 'Women’s Menstrual Wellness & Comfort',
    title: 'TranzLife CycleRelief',
    tagline: 'Embrace Every Cycle. Celebrate Every You.',
    intro: [
      'Every woman’s journey is unique, and every menstrual cycle deserves care, comfort and understanding. CycleRelief is part of our commitment to convenient wellness solutions designed around the evolving needs of women.',
      'Some women experience discomfort, cramps, lower back pain, bloating or fatigue during their periods. CycleRelief is developed with an emphasis on comfort, convenience and individual care throughout the cycle.'
    ],
    highlightsTitle: 'Designed with women in mind',
    highlights: [
      ['A focus on comfort', 'Positioned as a women’s wellness solution for comfort and well-being during menstruation.'],
      ['Convenience for everyday life', 'A practical solution that fits into women’s daily routines.'],
      ['Thoughtful innovation', 'Scientific understanding, formulation expertise and nature-inspired innovation combined.'],
      ['Quality-conscious development', 'Responsible formulation, appropriate testing and clear information for informed choices.']
    ],
    listTitle: 'Key Botanical Actives',
    list: [
      ['Rosemary Essential Oil (Salvia rosmarinus)', 'Rich in 1,8-cineole and camphor to support healthy micro-circulation and gently ease localized muscular tension.'],
      ['Damask Rose Extract (Rosa damascena)', 'Delicate floral essence containing geraniol and citronellol for soothing emotional balance and nervous system comfort.'],
      ['Peppermint Cooling Oil (Mentha piperita)', 'Natural menthol triggers TRPM8 sensory cooling to provide instant, refreshing comfort for abdominal tightness.'],
      ['100% Botanical Carrier Complex', 'Nourishing lightweight plant lipids providing effortless roller glide and fast absorption without greasy residue.']
    ],
    note: 'Use as directed on the label. Please consult a healthcare professional if your symptoms are severe, unusual or persistent.'
  },

  reviva: {
    eyebrow: 'Botanical Vitality · Targeted Roll-On Ritual',
    title: 'Reviva™ Vitality & Comfort Roll-On',
    tagline: 'Vitality in Every Touch. Botanical Care in Every Roll.',
    intro: [
      'TranzLife Reviva™ is formulated with pure Dill and Eucalyptus essential oils in the Spirit of Organics, crafted for daily vitality, micro-circulation, and nerve comfort.',
      'Applied with a smooth, cooling massage roll-on around the navel to stimulate vitality reflex points as part of your morning wellness routine.'
    ],
    highlightsTitle: 'Why choose Reviva™ Roll-On?',
    highlights: [
      ['Convenient rollerball format', 'Mess-free, targeted topical application anytime, anywhere.'],
      ['100% Pure Essential Oils', 'Carefully distilled Dill and Eucalyptus oils with zero synthetic fragrances.'],
      ['Fast-absorbing & non-greasy', 'Penetrates quickly leaving skin nourished and comfortable.'],
      ['Daily morning ritual', 'Effortlessly integrates into your everyday wellness lifestyle.']
    ],
    listTitle: 'Botanical Active Essentials',
    list: [
      ['Dill Essential Oil (E.O)', 'Pure botanical extract traditionally valued for micro-circulation and metabolic calm.'],
      ['100% Plant-Based Carrier', 'Lightweight, nourishing plant lipids ensuring rapid skin absorption without greasy residue.'],
      ['Eucalyptus Essential Oil', 'Provides a refreshing aromatic profile with a soothing, cooling sensory effect.'],
      ['Targeted Reflex Ritual', 'Designed for gentle circular application around the navel to stimulate wellness pathways.']
    ],
    note: 'For external use only. Roll gently around the belly button every morning. This wellness product is not intended to treat, cure, or prevent disease. Consult a healthcare practitioner for personal medical conditions.'
  },

  liver: {
    eyebrow: 'Nature-Inspired Innovation for Liver Wellness',
    title: 'TranzLife Liver Booster',
    tagline: 'Nourish Your Wellness. Support Your Liver. Embrace a Healthier Lifestyle.',
    intro: [
      'TranzLife Liver Booster reflects our commitment to botanical-inspired wellness solutions designed with a focus on quality, scientific understanding and everyday well-being, combining traditional botanical knowledge with contemporary product development.',
      'The liver plays a vital role in the body’s internal balance: it contributes to nutrient metabolism, processes many substances in the bloodstream and produces bile to support digestion.'
    ],
    highlightsTitle: 'Our approach to liver wellness',
    highlights: [
      ['Botanical inspiration', 'Exploring plant-derived ingredients and traditional botanical knowledge.'],
      ['Quality-focused formulation', 'Ingredient identity, quality standards, formulation consistency and appropriate testing.'],
      ['Science-led innovation', 'Scientific understanding and responsible innovation for evolving wellness needs.'],
      ['Responsible wellness', 'Encouraging informed choices and a holistic approach to well-being.']
    ],
    closingTitle: 'Making liver health a priority',
    closing: 'Liver health begins with everyday habits: a balanced diet, regular physical activity, limiting alcohol, maintaining a healthy weight and following medical advice about medicines.',
    note: 'Liver wellness products should not replace a balanced lifestyle, appropriate medical assessment or prescribed treatment. Consult a qualified healthcare professional if you have concerns about liver function.'
  },

  energy: {
    eyebrow: 'Herbal & Bioactive Wellness Formulation',
    title: 'TranzLife Energy Booster™',
    tagline: 'Energy. Stamina. Vitality. Every Day.',
    intro: [
      'TranzLife Energy Booster is a convenient, ready-to-use oral liquid designed to complement an active lifestyle and an everyday wellness routine.',
      'It combines selected botanical and mineral-origin ingredients in a simple, measured daily format: 7.5 ml twice daily, or as advised by a healthcare professional.'
    ],
    listTitle: 'Key ingredients',
    list: [
      ['Ruta graveolens (Q)', 'A botanical ingredient listed in the supplied formulation artwork.'],
      ['Hecla lava (3X)', 'A mineral-origin homeopathic preparation.'],
      ['Symphytum officinale (Q)', 'A botanical ingredient listed in the supplied formulation artwork.'],
      ['Calcarea phosphorica (8X)', 'A mineral-origin homeopathic preparation.'],
      ['Echinacea angustifolia (Q)', 'A botanical ingredient listed in the supplied formulation artwork.']
    ],
    highlightsTitle: 'Why choose Energy Booster?',
    highlights: [
      ['Ready-to-use oral liquid', '500 ml, with a measuring device supplied in the pack.'],
      ['Botanical-inspired formula', 'Selected botanical and mineral ingredients in one daily routine.'],
      ['Made for active days', 'For adults who want to complement daily energy, activity and general well-being.'],
      ['Quality-focused development', 'Refer to the approved product specification for the complete composition.']
    ],
    note: 'Use only as directed. Do not exceed the recommended serving. Consult a qualified healthcare professional before use if pregnant, breastfeeding, taking medication or managing a health condition. Keep out of reach of children.'
  }
};

export { DETAILS, BRAND };
