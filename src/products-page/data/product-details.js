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
    eyebrow: 'Nature-Inspired Respiratory Wellness · PulmoClear™ Formulation',
    title: 'TranzLife Lung Booster Gummies',
    tagline: 'Breathe Well. Live Better. Embrace Every Breath.',
    intro: [
      'Discover a new approach to everyday wellness with TranzLife Lung Booster Gummies, inspired by traditional botanical knowledge and contemporary product innovation.',
      'Developed under the wellness vision of TranzLife Biosciences, our gummy formulation concept brings together selected botanicals, vitamins and minerals in a convenient format designed for modern lifestyles.'
    ],
    listTitle: 'The Power of Botanicals in Every Gummy',
    listSubtitle: 'Inspired by India’s rich botanical heritage, the TranzLife Lung Booster Gummies formulation combines selected plant-derived ingredients with essential micronutrients.',
    list: [
      ['Tulsi (Holy Basil)', 'A traditional Indian botanical valued in herbal wellness practices.'],
      ['Vasaka', 'A botanical traditionally used in Ayurvedic respiratory wellness preparations.'],
      ['Dry Ginger (Sukku)', 'A familiar botanical ingredient used in traditional wellness formulations.'],
      ['Long Pepper (Thippili)', 'A traditional spice valued in Ayurvedic herbal preparations.'],
      ['Black Pepper', 'A natural spice containing piperine, a compound studied for its interactions with certain nutrients and other substances.'],
      ['Black Turmeric (Karumanjal)', 'A distinctive botanical being explored for its phytochemical properties.'],
      ['Cumin (Jeera)', 'A traditional culinary ingredient included in the botanical formulation concept.'],
      ['Licorice Root', 'A botanical used in traditional herbal preparations.'],
      ['Small Onion Extract', 'A plant-derived ingredient included in the formulation concept.'],
      ['Vitamin C, Vitamin D3 and Zinc', 'Essential micronutrients that contribute to normal physiological functions when supplied in appropriate quantities.']
    ],
    highlightsTitle: 'Why Choose TranzLife Lung Booster Gummies?',
    highlights: [
      ['Convenient Gummy Format', 'Designed for convenient consumption as directed on the product label.'],
      ['Botanical-Inspired Formulation', 'Inspired by traditional plant-based wellness practices.'],
      ['Micronutrient Inclusion', 'Incorporating vitamins and minerals as specified in the final formulation.'],
      ['Quality-Focused Development', 'Emphasising ingredient specifications and formulation consistency.'],
      ['Modern Wellness Approach', 'Bringing botanical inspiration and contemporary product development together.']
    ],
    closingTitle: 'Wellness Inspired by Nature. Innovation Guided by Science.',
    closing: 'At TranzLife Biosciences, we believe that responsible innovation begins with understanding nature and advances through scientific knowledge. Our commitment is to explore thoughtfully developed wellness products that align with contemporary consumer needs, quality expectations and applicable regulatory requirements. TranzLife Lung Booster Gummies represent this philosophy through a convenient gummy format inspired by botanical ingredients and nutritional science.',
    journeyTitle: 'Make TranzLife Part of Your Wellness Journey',
    journeyText: 'Discover the TranzLife approach to nature-inspired wellness and experience our commitment to innovation, quality and responsible product development. TRANZLIFE BIOSCIENCES: Innovating Life Beyond Limits.',
    note: 'Use only as directed on the product label. This product should not be presented as a substitute for medical treatment or as a means of preventing or curing respiratory disease. Product benefits and claims must be supported by the final formulation, relevant evidence and applicable regulatory approvals. Consult a qualified healthcare professional if you have a respiratory condition or take regular medication.'
  },

  inhaler: {
    eyebrow: 'A Moment of Calm, Wherever Life Takes You',
    title: 'TranzLife Aromatherapy Inhaler',
    tagline: 'Pause. Breathe. Relax. Rediscover Your Balance.',
    intro: [
      'Modern life can be demanding. Work pressures, busy schedules, and everyday responsibilities can leave us feeling overwhelmed and mentally exhausted. Taking a moment to pause and reconnect can make a meaningful difference to your wellness routine.',
      'At TranzLife Biosciences, we believe that small moments of self-care are essential to a balanced lifestyle. The TranzLife Aromatherapy Inhaler is a portable companion designed to bring a refreshing sensory experience into your everyday routine.'
    ],
    listTitle: 'Nature-Inspired Aromatherapy. Everyday Convenience.',
    listSubtitle: 'Aromatherapy uses aromatic botanical substances to create distinctive sensory experiences. Certain aromas help create a refreshing sense of calm and mental clarity.',
    list: [
      ['A Convenient Wellness Companion', 'A sleek, pocket-sized format designed to fit effortlessly into your work, commute, and daily travel routines.'],
      ['Distinctive Sensory Experience', 'Delivers the crisp, invigorating aroma of natural botanical volatile oils as part of your personal wellness ritual.'],
      ['Mindful Breathing Anchor', 'Incorporate an intentional pause and deep breathing whenever you need a moment of clarity and decompression.'],
      ['Botanical-Inspired Innovation', 'Formulated with an appreciation for natural plant compounds and contemporary product development standards.']
    ],
    highlightsTitle: 'Why Choose TranzLife Aromatherapy Inhaler?',
    highlights: [
      ['Pocket-Sized Portability', 'Compact, spill-proof format slips easily into pocket, purse, or desk drawer.'],
      ['Natural Aromatic Essence', 'Distinctive plant-derived aromas crafted for personal sensory refreshment.'],
      ['Mindful Daily Ritual', 'Serves as a tactile sensory anchor for conscious breathing breaks throughout the day.'],
      ['Botanical Innovation', 'Combines nature-inspired aromatic ingredients with quality-conscious formulation.'],
      ['Modern Convenience', 'Designed specifically for busy, active lifestyles seeking effortless self-care.']
    ],
    closingTitle: 'Make Space for a Moment of Calm',
    closing: 'Wellness is not always about making big changes. Sometimes, it begins with taking a short break, slowing down, and paying attention to the present moment. You can incorporate the TranzLife Aromatherapy Inhaler into a personal relaxation routine alongside mindful breathing, adequate rest, and healthy daily habits.',
    journeyTitle: 'Our Commitment to Responsible Wellness',
    journeyText: 'At TranzLife Biosciences, we explore innovative wellness solutions through thoughtful development, quality-conscious practices, and responsible communication. Where Natural Intelligence Meets Scientific Innovation.',
    note: 'Use according to product directions. Individual experiences with aromas may differ. Aromatherapy should be viewed as a complementary wellness practice rather than a replacement for professional mental healthcare. Consult a qualified professional for chronic stress or clinical anxiety.'
  },

  rollon: {
    eyebrow: 'Women’s Menstrual Wellness & Comfort',
    title: 'TranzLife CycleRelief',
    tagline: 'Embrace Every Cycle. Celebrate Every You.',
    intro: [
      'Every woman’s journey is unique, and every menstrual cycle deserves care, comfort, and understanding. TranzLife CycleRelief reflects our commitment to convenient wellness solutions designed around the evolving needs of women.',
      'With a focus on menstrual wellness and everyday comfort, CycleRelief brings together nature-inspired thinking, scientific understanding, and consumer-focused product development to support practical self-care throughout your cycle.'
    ],
    listTitle: 'Key Botanical Actives',
    list: [
      ['Rosemary Essential Oil (Salvia rosmarinus)', 'Rich in 1,8-cineole and camphor to support healthy micro-circulation and gently ease localized muscular tension.'],
      ['Damask Rose Extract (Rosa damascena)', 'Delicate floral essence containing geraniol and citronellol for soothing emotional balance and nervous system comfort.'],
      ['Peppermint Cooling Oil (Mentha piperita)', 'Natural menthol triggers TRPM8 sensory cooling to provide instant, refreshing comfort for abdominal tightness.'],
      ['100% Botanical Carrier Complex', 'Nourishing lightweight plant lipids providing effortless roller glide and fast absorption without greasy residue.']
    ],
    highlightsTitle: 'Our Commitment to Women’s Wellness',
    highlights: [
      ['Promoting Awareness', 'Encouraging positive awareness of menstrual health, cycle tracking, and proactive daily self-care.'],
      ['Supporting Informed Choices', 'Providing practical options and clear information to help manage period-related discomfort.'],
      ['Prioritising Quality', 'Upholding stringent formulation standards, responsible innovation, and consumer-centric design.'],
      ['Encouraging Guidance', 'Promoting professional medical consultation whenever symptoms are severe, unusual, or persistent.']
    ],
    closingTitle: 'Making Every Cycle a Little Easier',
    closing: 'At TranzLife Biosciences, we recognise that menstrual wellness is about more than a monthly routine. It is about helping women feel informed, supported, and confident in making decisions about their well-being. Through CycleRelief, we aim to contribute to a more thoughtful approach to women’s wellness, guided by our commitment to innovation, quality, and responsible product development.',
    journeyTitle: 'Where Natural Intelligence Meets Scientific Innovation',
    journeyText: 'Committed to exploring innovative wellness solutions for a healthier, more confident future. TRANZLIFE BIOSCIENCES: Innovating Life Beyond Limits.',
    note: 'Use only as directed on the product label. Positioned around menstrual wellness, comfort, and everyday self-care. CycleRelief should not be presented as a medical treatment for clinical conditions. Consult a qualified healthcare professional if symptoms are severe, unusual, or persistent.'
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
      'At TranzLife Biosciences, we believe that better health begins with informed choices, responsible innovation, and a deeper understanding of nature. TranzLife Liver Booster reflects our commitment to exploring botanical-inspired wellness solutions designed for everyday well-being.',
      'Developed as part of our wellness product portfolio, TranzLife Liver Booster combines traditional botanical knowledge with contemporary product development principles to support a holistic approach to internal balance.'
    ],
    listTitle: 'Our Approach to Liver Wellness',
    listSubtitle: 'The liver plays a vital role in maintaining internal balance, nutrient metabolism, and digestion. Thoughtful wellness development combines botanical knowledge with scientific care.',
    list: [
      ['Botanical Inspiration', 'Exploring the potential of plant-derived ingredients and traditional botanical knowledge in wellness-focused product development.'],
      ['Quality-Focused Formulation', 'Prioritising ingredient identity, quality standards, formulation consistency, and appropriate product testing.'],
      ['Science-Led Innovation', 'Bringing together scientific understanding and responsible innovation to develop products that meet evolving consumer needs.'],
      ['Responsible Wellness', 'Encouraging informed lifestyle choices and a holistic approach to maintaining daily health and vitality.']
    ],
    highlightsTitle: 'The TranzLife Difference',
    highlights: [
      ['Nature-Inspired Development', 'Exploring botanical traditions and plant-derived ingredients for daily vitality.'],
      ['Quality-Conscious Practices', 'Upholding stringent ingredient identity, testing, and formulation consistency.'],
      ['Science-Led Formulation', 'Uniting traditional botanical knowledge with modern nutritional understanding.'],
      ['Informed Wellness Choices', 'Empowering consumers with transparent information and practical self-care options.'],
      ['Preventive Wellness Vision', 'Dedicated to exploring long-term life science innovations beyond conventional limits.']
    ],
    closingTitle: 'Making Liver Health a Priority',
    closing: 'Supporting liver health begins with everyday habits. A balanced diet, regular physical activity, limiting alcohol exposure, maintaining a healthy weight, and following medical advice regarding medicines can all contribute to liver health. TranzLife encourages consumers to take a proactive approach to wellness and consult qualified healthcare professionals if they have concerns about liver function.',
    journeyTitle: 'Where Natural Intelligence Meets Scientific Innovation',
    journeyText: 'We are committed to exploring innovative wellness solutions that bring together botanical inspiration, scientific knowledge, and a vision for a healthier future. TRANZLIFE BIOSCIENCES: Innovating Life Beyond Limits.',
    note: 'Use only as directed on the product label. Liver wellness products should not replace a balanced lifestyle, appropriate medical assessment, or prescribed treatment. Consult a qualified healthcare professional if you have concerns about liver function.'
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
