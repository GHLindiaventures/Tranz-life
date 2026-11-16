// Product catalogue: TranzLife Biosciences official commercial & pipeline range.
// Formulations, dosages, sizes, and barcodes directly aligned with official TranzLife documentation.

export const PRODUCTS = [
  {
    id: 'gummies',
    no: '01',
    short: 'Lung Booster',
    name: 'TranzLife Lung Booster Gummies',
    cat: 'gummies',
    tag: 'Respiratory',
    price: 549,
    size: '60 Gummies',
    desc: 'Discover TranzLife Lung Booster Gummies, a botanical-inspired wellness formulation developed with a focus on quality and contemporary product innovation.',
    ing: ['Tulsi & Vasaka', 'Dry Ginger & Long Pepper', 'Vitamin C, D3 & Zinc'],
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
    short: 'Aroma Inhaler',
    name: 'TranzLife Aromatherapy Inhaler',
    cat: 'inhaler',
    tag: 'Relaxation & Balance',
    price: 249,
    size: 'Portable Aromatherapy Inhaler',
    desc: 'Discover the TranzLife Aromatherapy Inhaler, a portable aromatherapy product designed to bring a refreshing aromatic experience to your everyday self-care routine.',
    ing: ['Portable Format', 'Botanical Essential Oils', 'Mindful Breathing'],
    model: 'inhaler',
    fit: 1.16,
    dosage: 'Inhale gently as part of a personal relaxation routine alongside mindful breathing'
  },
  {
    id: 'rollon',
    no: '03',
    short: 'CycleRelief',
    name: 'TranzLife CycleRelief',
    cat: 'rollon',
    tag: 'Menstrual Wellness',
    price: 349,
    size: 'Roll-On with Gift Box',
    desc: 'Discover TranzLife CycleRelief, a women’s wellness product developed with a focus on menstrual comfort, thoughtful innovation, and quality-conscious product development.',
    ing: ['Comfort-Focused Formulation', 'Botanical Innovation', 'Non-Greasy Topical Care'],
    model: 'rollon',
    fit: 1.06,
    barcode: '8906132540154',
    dosage: 'Apply gently for localized topical comfort as directed on the product label'
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
    short: 'Liver Booster',
    name: 'TranzLife Liver Booster',
    cat: 'liquid',
    tag: 'Liver Wellness',
    price: 649,
    size: '100 ml Botanical Liquid',
    desc: 'Discover TranzLife Liver Booster, a nature-inspired wellness product from TranzLife Biosciences, reflecting our commitment to quality-focused formulation and scientific innovation.',
    ing: ['Botanical Inspiration', 'Quality-Focused Formulation', 'Holistic Wellness'],
    model: 'liver',
    fit: 1.14,
    barcode: '8906132540130',
    mfgLic: 'TN/AYU/24/1234',
    dosage: 'Use only as directed on the approved product label'
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
