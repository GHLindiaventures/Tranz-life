// Product catalogue: TranzLife Biosciences official commercial & pipeline range.
// Formulations, dosages, sizes, and barcodes directly aligned with official TranzLife documentation.

export const PRODUCTS = [
  {
    id: 'gummies',
    no: '01',
    short: 'PulmoClear™',
    name: 'PulmoClear™ Lung Booster Gummies',
    cat: 'gummies',
    tag: 'Lung Detox',
    price: 549,
    size: '60 Gummies',
    desc: '100% Ayurvedic Lung Booster & Craving Control Gummies for heavy smokers. Detoxifies, cleanses, and strengthens respiratory health with Vasaka, Tulsi, Mulethi, Vitamin C & Zinc. Natural Berry Flavour.',
    ing: ['Vasaka 100mg', 'Tulsi 100mg', 'Mulethi 100mg', 'Turmeric 80mg', 'Giloy 80mg', 'Vitamin C 40mg', 'Zinc 5mg'],
    model: 'jar',
    fit: 1,
    gummy: ['#d2161f', '#ee7a12', '#f2a12c', '#97182c', '#e8551a'],
    barcode: '8906132540147',
    mfgLic: 'TN/AYU/24/1234',
    dosage: 'Adults: 2 gummies twice daily after meals'
  },
  {
    id: 'inhaler',
    no: '02',
    short: 'Craving Control™',
    name: 'Craving Control™ Aromatherapy Inhaler',
    cat: 'inhaler',
    tag: 'Quit Smoking',
    price: 249,
    size: '10 ml Pocket Inhaler',
    desc: '100% natural, non-addictive aromatherapy inhaler for tobacco and smoking cessation. Pure therapeutic blend of Peppermint, Black Pepper, Tulsi, Lavender and Eucalyptus oils to curb nicotine cravings instantly on the go.',
    ing: ['Black Pepper Oil', 'Peppermint Oil', 'Tulsi Oil', 'Lavender Oil', 'Eucalyptus Oil'],
    model: 'inhaler',
    fit: 1.16,
    dosage: 'Inhale deeply through each nostril 2–3 times whenever cravings arise'
  },
  {
    id: 'rollon',
    no: '03',
    short: 'CycleRelief™',
    name: 'CycleRelief™ Menstrual Comfort Roll-On',
    cat: 'rollon',
    tag: 'Period Relief',
    price: 399,
    size: '50 ml Roll-On (8 ml pocket)',
    desc: '100% natural plant-based formula that eases menstrual cramps, soothes abdominal discomfort, and relaxes tense pelvic muscles with pure Dill and Eucalyptus essential oils. Fast-absorbing and non-greasy.',
    ing: ['Dill E.O', 'Eucalyptus E.O', '100% Plant-Based', 'Non-Greasy Formula'],
    model: 'rollon',
    fit: 1.06,
    barcode: '8906132540154',
    dosage: 'Roll gently around the belly button every morning on an empty stomach'
  },
  {
    id: 'reviva',
    no: '04',
    short: 'Reviva™',
    name: 'Reviva™ Diabetes & Vitality Roll-On',
    cat: 'rollon',
    tag: 'Blood Sugar & Vitality',
    price: 449,
    size: '50 ml Massage Roll-On',
    desc: 'Natural support for diabetes, circulation, and vitality. Formulated with Dill and Eucalyptus in the Spirit of Organics to support healthy blood sugar levels, relieve neuropathic discomfort, and improve circulation.',
    ing: ['Dill E.O', 'Eucalyptus E.O', 'Blood Sugar Support', 'Nerve Vitality'],
    model: 'reviva',
    fit: 1.06,
    barcode: '8906132540147',
    dosage: 'Roll gently around the belly button every morning on an empty stomach'
  },
  {
    id: 'liver',
    no: '05',
    short: 'LiverDetox™',
    name: 'LiverDetox™ Polyherbal Concoction',
    cat: 'liquid',
    tag: 'Liver Booster',
    price: 649,
    size: '500 ml Classical Concoction',
    desc: '100% Ayurvedic Liver Booster. Detoxifies, protects, and rejuvenates liver parenchyma cells with 11 classical botanicals including Bhumyamalaki, Kalmegh, Kutki, Punarnava, and Daruharidra.',
    ing: ['Bhumyamalaki 500mg', 'Kalmegh 400mg', 'Kutki 400mg', 'Punarnava 300mg', 'Bhringraj 300mg', 'Daruharidra 200mg'],
    model: 'liver',
    fit: 1.14,
    barcode: '8906132540130',
    mfgLic: 'TN/AYU/24/1234',
    dosage: 'Adults: 10 ml (2 tsp) twice daily after meals'
  },
  {
    id: 'energy',
    no: '06',
    short: 'Energy Booster™',
    name: 'TranzLife Energy Booster™',
    cat: 'liquid',
    tag: 'Energy & Vitality',
    price: 1850,
    size: '500 ml Oral Liquid',
    desc: 'A herbal and bioactive wellness formulation in a ready-to-use oral liquid, designed to complement an active lifestyle, daily energy and general well-being.',
    ing: ['Ruta graveolens (Q)', 'Hecla lava (3X)', 'Symphytum officinale (Q)', 'Calcarea phosphorica (8X)', 'Echinacea angustifolia (Q)'],
    model: 'energy',
    fit: 1.12,
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
