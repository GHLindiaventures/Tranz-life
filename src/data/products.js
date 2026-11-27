// Product catalogue: TranzLife Biosciences official commercial & pipeline range.
// Ingredients follow the official composition sheet (src/data/ingredients.js). Wording follows the client brief:
// relaxation, comfort and wellness positioning, no treatment claims. Sizes, prices and barcodes from TranzLife documents.

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
    desc: 'Berry-flavoured botanical gummies with Tulsi, Vasaka, dry ginger, long pepper and licorice root, plus Vitamin C, D3 and Zinc, in a convenient format for everyday respiratory wellness.',
    ing: ['Tulsi', 'Vasaka', 'Dry Ginger (Sukku)', 'Long Pepper (Thippili)', 'Licorice Root', 'Vitamin C, D3 & Zinc'],
    model: 'jar',
    fit: 1,
    gummy: ['#d2161f', '#ee7a12', '#f2a12c', '#97182c', '#e8551a'],
    barcode: '8906132540147',
    dosage: 'Adults: 2 gummies twice daily after meals'
  },
  {
    id: 'inhaler',
    no: '02',
    short: 'Aroma Inhaler',
    name: 'TranzLife Aromatherapy Inhaler',
    cat: 'inhaler',
    tag: 'Relaxation',
    price: 249,
    size: '10 ml Pocket Inhaler',
    desc: 'A compact, portable aromatherapy inhaler with Peppermint, Lavender, Eucalyptus, Lemon, Black Pepper and Tulsi oils. Pause, breathe and bring a refreshing aromatic moment into your day.',
    ing: ['Peppermint Oil', 'Lavender Oil', 'Eucalyptus Oil', 'Lemon Oil', 'Black Pepper Oil', 'Tulsi Oil'],
    model: 'inhaler',
    fit: 1.16,
    dosage: 'Inhale gently through each nostril 2–3 times whenever you want a moment to pause'
  },
  {
    id: 'rollon',
    no: '03',
    short: 'CycleRelief',
    name: 'TranzLife CycleRelief Roll-On',
    cat: 'rollon',
    tag: 'Menstrual Comfort',
    price: 399,
    size: '50 ml Roll-On (8 ml pocket)',
    desc: 'A women’s menstrual wellness roll-on with Wintergreen, Peppermint, Ginger, Lavender and Eucalyptus in a Sesame oil base, designed around comfort and convenience throughout your cycle. Non-greasy.',
    ing: ['Wintergreen Oil', 'Peppermint Oil', 'Ginger', 'Lavender Oil', 'Eucalyptus Oil', 'Sesame Oil base'],
    model: 'rollon',
    fit: 1.06,
    barcode: '8906132540154',
    dosage: 'Roll gently around the belly button every morning on an empty stomach'
  },
  {
    id: 'reviva',
    no: '04',
    short: 'Reviva',
    // From the Reviva brochure only (a topical massage / personal-care product; no blood-sugar or diabetes claims).
    // Price: the MRP shown in the supplied artwork (the brochure says to verify it).
    name: 'Reviva Roll-On',
    cat: 'rollon',
    tag: 'Botanical Massage Roll-On',
    price: 399,
    size: '50 ml Massage Roll-On',
    desc: 'Botanical massage roll-on for an everyday wellness and vitality ritual. A practical massage roll-on designed to complement a daily self-care routine with a refreshing topical application.',
    ing: ['Dill E.O', 'Eucalyptus E.O', 'Massage Roll-On', 'External Use'],
    model: 'reviva',
    fit: 1.06,
    dosage: 'Apply a small amount to intact skin and massage gently'
  },
  {
    id: 'liver',
    no: '05',
    short: 'Liver Booster',
    name: 'TranzLife Liver Booster',
    cat: 'liquid',
    tag: 'Liver Wellness',
    price: 649,
    size: '500 ml Classical Concoction',
    desc: 'A classical Ayurvedic polyherbal liquid with 11 botanicals including Bhumyamalaki, Kalmegh, Kutki, Punarnava and Daruharidra, made to complement a balanced lifestyle and everyday liver wellness.',
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
    // From the Energy Booster brochure (a draft marketing aid: no treatment claims). The brochure has no price: ₹649, the
    // same as the other 500 ml liquid, until the client confirms the MRP. Photo and cut-out: scripts/make-energy-assets.py.
    name: 'TranzLife Energy Booster',
    cat: 'liquid',
    tag: 'Energy & Vitality',
    price: 649,
    size: '500 ml Oral Liquid',
    desc: 'A herbal and bioactive oral liquid with selected botanical and mineral ingredients, designed to complement an active lifestyle and your everyday energy, activity and well-being.',
    ing: ['Ruta graveolens (Q)', 'Hecla lava (3X)', 'Symphytum officinale (Q)', 'Calcarea phosphorica (8X)', 'Echinacea angustifolia (Q)'],
    model: 'energy',
    fit: 1.18,
    dosage: '7.5 ml twice daily, or as advised by a healthcare professional'
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
