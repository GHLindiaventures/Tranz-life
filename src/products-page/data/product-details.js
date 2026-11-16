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
    listTitle: 'Targeted botanical actions in every gummy',
    list: [
      ['Airway Clearance', 'Vasaka and long pepper traditionally valued for supporting clear, comfortable respiratory flow.'],
      ['Mucosal Soothing', 'Tulsi and licorice root provide gentle, comforting plant-derived nourishment for throat and chest.'],
      ['Bioavailability & Warmth', 'Dry ginger and black pepper with piperine promote natural absorption and internal warmth.'],
      ['Phytochemical Defense', 'Black turmeric, cumin, and small onion extract contribute distinctive antioxidant richness.'],
      ['Cellular Resilience', 'Balanced Vitamin C, Vitamin D3, and Zinc support normal immune defenses and tissue vitality.']
    ],
    highlightsTitle: 'Formulation highlights',
    highlights: [
      ['Standardized Botanical Extracts', 'Sourced with verified plant identity and strict purity standards.'],
      ['Gelatin-Free Pectin Base', '100% plant-based chewy texture that is gentle on daily digestion.'],
      ['Synergistic Micronutrient Matrix', 'Balanced levels of Vitamin C, D3, and Zinc for complementary immune support.'],
      ['City Air Companion', 'Crafted specifically to support respiratory comfort against urban air pollutants.'],
      ['Clean Label Commitment', 'No artificial colors, synthetic binders, or unnecessary fillers.']
    ],
    closingTitle: 'Daily Respiratory Vitality',
    closing: 'Formulated to integrate seamlessly into your morning routine, providing consistent plant-based defense for active city life.',
    note: 'Use only as directed on the product label. This product is not a substitute for medical treatment or a means of preventing or curing respiratory disease. Consult a qualified healthcare professional if you have a respiratory condition or take regular medication.'
  },

  inhaler: {
    eyebrow: 'Aromatherapy · Sensory Reset',
    title: 'TranzLife Aromatherapy Inhaler',
    tagline: 'Pause. Breathe. Relax. Rediscover Your Balance.',
    intro: [
      'Work pressures, fast-paced commutes, and continuous screen time can leave our senses fatigued. Taking an intentional sensory reset can restore mental clarity and center your daily wellness routine.',
      'Formulated with therapeutic essential oils, the TranzLife Aromatherapy Inhaler uses targeted olfactory stimulation to deliver an immediate sensation of crisp, refreshing coolness.'
    ],
    highlightsTitle: 'Why carry the Aroma Inhaler?',
    highlights: [
      ['Fast-Acting Sensory Reset', 'Direct inhalation delivers natural volatile botanicals straight to olfactory receptors.'],
      ['Zero Nicotine & Additives', 'Pure plant essential oil blend with no synthetic fragrances, propellants, or habit-forming agents.'],
      ['Airtight Pocket Shell', 'Engineered to lock in vapor pressure and maintain aromatic potency across months of daily use.'],
      ['Mindful Transition Ritual', 'An effective sensory cue to decompress between meetings, travel, or intense work sessions.'],
      ['Pure Botanical Vapors', 'Cold-extracted essential oils chosen for their clean, crisp, and uplifting aromatic profile.']
    ],
    closingTitle: 'Reset your sensory focus',
    closing: 'Incorporate deep, rhythmic breathing whenever you open the cap to maximize the calming impact of the essential oil vapor.',
    note: 'Use according to the product directions. Individual experiences with aromas may differ; aromatherapy is a complementary wellness practice, not a replacement for professional mental healthcare.'
  },

  rollon: {
    eyebrow: 'Women’s Menstrual Wellness & Comfort',
    title: 'TranzLife CycleRelief',
    tagline: 'Comfort Through Every Phase. Care Designed for Women.',
    intro: [
      'Menstrual cycles bring complex physical changes. CycleRelief was created to offer women a natural, discreet topical ritual for soothing recurring monthly tension.',
      'Combining cooling essential oils with fast-absorbing botanical carrier lipids, it glides on smoothly over the lower abdomen and lower back without leaving greasy residue.'
    ],
    highlightsTitle: 'Targeted topical benefits',
    highlights: [
      ['Cooling Sensation', 'Menthol from natural peppermint oil delivers an invigorating thermogenic effect that eases localized tension.'],
      ['Subtle Aromatherapy', 'Herbaceous rosemary and soothing rose essential oils create a delicate, calming botanical scent.'],
      ['Non-Greasy Rollerball', 'Stainless-steel roller glides effortlessly, absorbing in seconds without staining clothing or bedding.'],
      ['Travel-Ready Discretion', 'Compact, leak-proof vial easily slips into your handbag, desk drawer, or gym tote.']
    ],
    listTitle: 'Core botanical ingredients',
    list: [
      ['Rosemary Leaf Oil', 'Traditionally celebrated for stimulating local microcirculation and soothing tired muscles.'],
      ['Damask Rose Extract', 'Valued for its uplifting floral aromatic profile and delicate skin-toning benefits.'],
      ['Peppermint Essential Oil', 'Provides crisp, lasting topical coolness to distract from deep abdominal cramping.'],
      ['Plant Carrier Lipids', 'Lightweight plant oils that nourish skin while carrying active terpenes across the epidermis.']
    ],
    note: 'For external topical use only. Avoid contact with eyes and broken skin. Please consult a qualified healthcare professional if severe pain persists.'
  },

  liver: {
    eyebrow: 'Hepatic Support & Daily Metabolic Balance',
    title: 'TranzLife Liver Booster',
    tagline: 'Nourish From Within. Protect Your Core Vitality.',
    intro: [
      'As your body’s primary metabolic filter, the liver continuously processes nutrients, neutralizes toxins, and produces bile for digestion. Sustaining its function is essential for daily vitality.',
      'TranzLife Liver Booster combines time-tested Ayurvedic bitter tonics with gentle restorative botanicals to create an easily assimilated liquid formulation.'
    ],
    highlightsTitle: 'Physiological support pillars',
    highlights: [
      ['Bile Secretion Support', 'Traditional bitter botanicals stimulate digestive bile production to ease lipid breakdown.'],
      ['Antioxidant Enzyme Protection', 'Polyphenol-rich herbs defend hepatic cellular membranes against oxidative wear.'],
      ['Rapid Liquid Bioavailability', 'Dissolved phytonutrients absorb faster through the digestive tract than dry compressed tablets.'],
      ['Gentle Metabolic Cleanse', 'Encourages the body’s innate detoxification pathways without harsh purgative effects.']
    ],
    closingTitle: 'Complementing healthy daily habits',
    closing: 'Pair with consistent hydration, antioxidant-rich whole foods, and regular exercise for comprehensive hepatic support.',
    note: 'Dietary supplements should not replace a balanced lifestyle, appropriate medical assessment or prescribed treatment. Consult a healthcare professional if you have concerns about liver function.'
  }
};

export { DETAILS, BRAND };
