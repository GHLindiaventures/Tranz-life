// Product catalogue: the six TranzLife products on sale.
// Facts and wording from the client's "Tranzlife Biosciences Products.pdf" (Nov 2026): each product's introduction, key
// benefits, ingredients, directions and pack details. Claims printed on some packs that describe effects on a disease
// (blood sugar, detox / flushing toxins, lung function, cramp relief) are left out: the site keeps to "supports" and
// "designed for" wording and never says a product treats, cures or prevents anything. Prices and barcodes from
// earlier TranzLife documents.

export const PRODUCTS = [
  {
    id: 'gummies',
    no: '01',
    short: 'Lung Booster',
    name: 'TranzLife Lung Booster Gummies',
    cat: 'gummies',
    tag: 'Respiratory Wellness',
    price: 549,
    size: '60 Gummies',
    desc: 'PulmoClear gummies: traditional Ayurvedic botanicals such as Tulsi, Vasaka, dry ginger and long pepper, with Vitamin C, D3 and Zinc, in a natural berry flavour. Designed to support respiratory wellness and everyday health.',
    ing: ['Tulsi', 'Vasaka', 'Dry Ginger (Sukku)', 'Long Pepper (Thippili)', 'Licorice Root', 'Vitamin C, D3 & Zinc'],
    model: 'jar',
    fit: 1,
    gummy: ['#d2161f', '#ee7a12', '#f2a12c', '#97182c', '#e8551a'],
    barcode: '8906132540147',
    dosage: 'Follow the serving size on the pack; do not exceed the recommended daily intake'
  },
  {
    id: 'inhaler',
    no: '02',
    short: 'BreatheFree',
    name: 'TranzLife BreatheFree Aromatherapy Inhaler',
    cat: 'inhaler',
    tag: 'Smoke-Free Support',
    price: 249,
    size: 'Pocket Aromatherapy Inhaler',
    desc: 'An essential oil aromatherapy inhaler with Peppermint, Eucalyptus, Lavender, Lemon, Black Pepper and Tulsi oils, designed to support your journey towards a smoke-free lifestyle with relaxation, freshness and breathing comfort.',
    ing: ['Peppermint Oil', 'Eucalyptus Oil', 'Lavender Oil', 'Lemon Oil', 'Black Pepper Oil', 'Tulsi Oil'],
    model: 'inhaler',
    fit: 1.16,
    dosage: 'Remove the cap, hold near each nostril and take slow, deep breaths whenever cravings or stress come'
  },
  {
    id: 'rollon',
    no: '03',
    short: 'CycleRelief',
    name: 'TranzLife CycleRelief Roll-On',
    cat: 'rollon',
    tag: 'Menstrual Comfort',
    price: 399,
    size: '8 ml Roll-On',
    desc: 'A plant-based topical roll-on with Wintergreen, Peppermint, Ginger, Lavender and Eucalyptus oils in Sesame oil, for a soothing self-care and relaxation routine during your menstrual cycle. Easy to apply and non-greasy.',
    ing: ['Wintergreen Oil', 'Peppermint Oil', 'Ginger Essential Oil', 'Lavender Essential Oil', 'Eucalyptus Oil', 'Sesame Oil'],
    model: 'rollon',
    fit: 1.06,
    barcode: '8906132540154',
    dosage: 'Roll onto the lower abdomen, lower back or inner wrists and massage gently; reapply 2–4 times a day as needed during your cycle'
  },
  {
    id: 'reviva',
    no: '04',
    short: 'Reviva',
    // A massage roll-on for external use, made for people with diabetes (the story card says so). Its pack's
    // blood-sugar claims are not used on the site.
    name: 'TranzLife Reviva Roll-On',
    cat: 'rollon',
    tag: 'Daily Self-Care',
    price: 399,
    size: '50 ml Massage Roll-On',
    desc: 'A botanical-inspired massage roll-on with Dill and Eucalyptus essential oils, for external application as part of a daily personal-care and wellness routine. Refreshing, portable and easy to use.',
    ing: ['Dill Essential Oil', 'Eucalyptus Essential Oil', '50 ml Roll-On', 'External Use'],
    model: 'reviva',
    fit: 1.06,
    dosage: 'Roll gently around the belly button every morning and massage; apply to intact skin and wash hands after use'
  },
  {
    id: 'liver',
    no: '05',
    short: 'Liver Booster',
    name: 'TranzLife Liver Booster',
    cat: 'liquid',
    tag: 'Liver Wellness',
    price: 649,
    size: '500 ml Polyherbal Concoction',
    desc: 'A botanical-based polyherbal concoction with 11 traditional herbs, led by Bhumyamalaki, Kalmegh and Kutki, designed to support normal liver function, digestive wellness and overall well-being.',
    ing: ['Bhumyamalaki 500mg', 'Kalmegh 400mg', 'Kutki 400mg', 'Punarnava 300mg', 'Bhringraj 300mg', 'Daruharidra 200mg'],
    model: 'liver',
    fit: 1.14,
    barcode: '8906132540130',
    dosage: 'Adults: 10 ml (2 tsp) twice daily after meals'
  },
  {
    id: 'energy',
    no: '06',
    short: 'Energy Booster',
    // No price in the client's documents: ₹649, the same as the other 500 ml liquid, until the client confirms the MRP.
    // Photo and cut-out: scripts/make-energy-assets.py.
    name: 'TranzLife Energy Booster',
    cat: 'liquid',
    tag: 'Energy & Vitality',
    price: 649,
    size: '500 ml Oral Liquid',
    desc: 'A herbal and bioactive oral liquid with selected botanical and mineral ingredients, designed to complement an active lifestyle and support everyday energy, stamina and overall wellness.',
    ing: ['Ruta graveolens (Q)', 'Hecla lava (3X)', 'Symphytum officinale (Q)', 'Calcarea phosphorica (8X)', 'Echinacea angustifolia (Q)'],
    model: 'energy',
    fit: 1.18,
    dosage: '7.5 ml twice daily, or as recommended by a healthcare professional'
  }
];


// R&D Breakthrough Discoveries
export const RD_PROGRAMS = [
  {
    id: 'autism-spectrum',
    title: 'Autism Spectrum Disorder (ASD) Bioactive Research',
    status: 'Discovery & Phytochemical Profiling',
    timeline: '2027–2028',
    bioactives: [
      { name: 'Bacopa monnieri', role: 'Bacosides A & B neuro-protection and synaptic plasticity modulation' },
      { name: 'Juglans regia', role: 'Nutty walnut polyphenols and neuro-lipid membrane integrity' },
      { name: 'Curcuma caesia', role: 'Black turmeric bio-actives with potent cerebral anti-neuroinflammatory markers' }
    ],
    summary: 'Investigating synergistic neuro-active phytochemicals to modulate neuro-inflammation, sensory gating, and cognitive adaptation in neurodevelopmental conditions.'
  },
  {
    id: 'oncology-bioactive',
    title: 'Oncology / Cancer Preventive Bioactive Program',
    status: 'Preclinical Cellular Assay',
    timeline: '2028',
    bioactives: [
      { name: 'Annona muricata', role: 'Annonaceous acetogenins (ACGs) targeting mitochondrial ATP synthesis in abnormal cells' }
    ],
    summary: 'Preclinical evaluation of Annonaceous acetogenins isolated from soursop leaf matrix for selective cellular apoptosis and anti-proliferative activity.'
  },
  {
    id: 'precision-genetics',
    title: 'Precision Genomics & AI Biomarker Discovery',
    status: 'Platform Conceptualization',
    timeline: '2027–2029',
    pillars: ['Genetic Innovation', 'Biomarker Discovery', 'AI-Powered Diagnostic Engines', 'Prenatal & Genetic Screening', 'Preventive Healthcare Solutions'],
    summary: 'Developing predictive AI algorithms and molecular genetic screening panels to personalize botanical dosage algorithms before symptoms arise.'
  }
];
