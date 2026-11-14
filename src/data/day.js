// "A Day with TranzLife": the home page's product story, one moment per product from morning to night.
// Each moment is named by what it does for you (shown on the arc and as the handwritten label); the sun still runs
// morning to night, following each product's label directions (after meals, twice daily, whenever you want a pause...).
// Wording follows the client brief: wellness and comfort positioning, no treatment claims.
// Botanicals are the real ingredients (src/data/ingredients.js); `cmp` / `formula` are each one's best-known compound,
// shown by the science lens when a botanical is hovered or focused.

export const BOTANICALS = {
  tulsi:        { name: 'Tulsi', latin: 'Ocimum tenuiflorum', cmp: 'Eugenol', formula: 'C₁₀H₁₂O₂', color: '#5f9a3c', shape: 'leaf' },
  vasaka:       { name: 'Vasaka', latin: 'Justicia adhatoda', cmp: 'Vasicine', formula: 'C₁₁H₁₂N₂O', color: '#6c8f4a', shape: 'leaf' },
  ginger:       { name: 'Ginger', latin: 'Zingiber officinale', cmp: '6-Gingerol', formula: 'C₁₇H₂₆O₄', color: '#d8a25a', shape: 'root' },
  longPepper:   { name: 'Long Pepper', latin: 'Piper longum', cmp: 'Piperine', formula: 'C₁₇H₁₉NO₃', color: '#7a5a3a', shape: 'seed' },
  bhumyamalaki: { name: 'Bhumyamalaki', latin: 'Phyllanthus niruri', cmp: 'Phyllanthin', formula: 'C₂₄H₃₄O₆', color: '#7fae4f', shape: 'leaf' },
  kalmegh:      { name: 'Kalmegh', latin: 'Andrographis paniculata', cmp: 'Andrographolide', formula: 'C₂₀H₃₀O₅', color: '#4f7f35', shape: 'leaf' },
  kutki:        { name: 'Kutki', latin: 'Picrorhiza kurroa', cmp: 'Picroside I', formula: 'C₂₄H₂₈O₁₁', color: '#8a6a44', shape: 'root' },
  amla:         { name: 'Amla', latin: 'Phyllanthus emblica', cmp: 'Ascorbic acid', formula: 'C₆H₈O₆', color: '#a6c34a', shape: 'seed' },
  echinacea:    { name: 'Echinacea', latin: 'Echinacea angustifolia', cmp: 'Echinacoside', formula: 'C₃₅H₄₆O₂₀', color: '#c46aa0', shape: 'petal' },
  ruta:         { name: 'Ruta', latin: 'Ruta graveolens', cmp: 'Rutin', formula: 'C₂₇H₃₀O₁₆', color: '#8fae55', shape: 'leaf' },
  symphytum:    { name: 'Symphytum', latin: 'Symphytum officinale', cmp: 'Allantoin', formula: 'C₄H₆N₄O₃', color: '#7b6bb0', shape: 'petal' },
  calcPhos:     { name: 'Calcarea phos.', latin: 'Calcium phosphate (mineral)', cmp: 'Calcium phosphate', formula: 'Ca₃(PO₄)₂', color: '#d9d2bf', shape: 'seed' },
  peppermint:   { name: 'Peppermint', latin: 'Mentha × piperita', cmp: 'L-Menthol', formula: 'C₁₀H₂₀O', color: '#4fae7a', shape: 'leaf' },
  lavender:     { name: 'Lavender', latin: 'Lavandula angustifolia', cmp: 'Linalool', formula: 'C₁₀H₁₈O', color: '#9a86c4', shape: 'petal' },
  eucalyptus:   { name: 'Eucalyptus', latin: 'Eucalyptus globulus', cmp: '1,8-Cineole', formula: 'C₁₀H₁₈O', color: '#5aa69a', shape: 'leaf' },
  lemon:        { name: 'Lemon', latin: 'Citrus limon', cmp: 'Limonene', formula: 'C₁₀H₁₆', color: '#e8c840', shape: 'seed' },
  wintergreen:  { name: 'Wintergreen', latin: 'Gaultheria procumbens', cmp: 'Methyl salicylate', formula: 'C₈H₈O₃', color: '#3f7f52', shape: 'leaf' },
  sesame:       { name: 'Sesame oil', latin: 'Sesamum indicum', cmp: 'Sesamin', formula: 'C₂₀H₁₈O₆', color: '#e2c58a', shape: 'seed' },
  dill:         { name: 'Dill', latin: 'Anethum graveolens', cmp: 'Carvone', formula: 'C₁₀H₁₄O', color: '#9bb35a', shape: 'leaf' }
};

// sky: the stage's background at this moment (top, bottom); ink: text colour on it
export const MOMENTS = [
  {
    id: 'morning', name: 'Breathe well', productId: 'gummies',
    title: ['Begin with', 'a deep breath'],
    copy: 'Two berry-flavoured gummies after breakfast: Tulsi, Vasaka, dry ginger and long pepper with Vitamin C, D3 and Zinc, for everyday respiratory wellness.',
    benefit: 'Everyday respiratory wellness',
    botanicals: ['tulsi', 'vasaka', 'ginger', 'longPepper'],
    sky: ['#f7e3c4', '#e7efd9'], ink: '#1f4423', sun: 0.08
  },
  {
    id: 'breakfast', name: 'Liver care', productId: 'liver',
    title: ['Care that starts', 'from within'],
    copy: '10 ml after your meal. Eleven classical Ayurvedic botanicals, led by Bhumyamalaki, Kalmegh and Kutki, made to complement a balanced lifestyle.',
    benefit: 'Everyday liver wellness',
    botanicals: ['bhumyamalaki', 'kalmegh', 'kutki', 'amla'],
    sky: ['#fbefcf', '#e9f0d8'], ink: '#1f4423', sun: 0.24
  },
  {
    id: 'midday', name: 'Daily energy', productId: 'energy',
    title: ['Keep the day', 'moving'],
    copy: '7.5 ml twice a day. A herbal and bioactive oral liquid designed to complement daily energy, activity and an active routine.',
    benefit: 'Complements daily energy',
    botanicals: ['echinacea', 'ruta', 'symphytum', 'calcPhos'],
    sky: ['#fff6dc', '#eef3dc'], ink: '#1f4423', sun: 0.45
  },
  {
    id: 'afternoon', name: 'Mindful pause', productId: 'inhaler',
    title: ['Pause.', 'Breathe. Relax.'],
    copy: 'When the day gets busy, two slow breaths from a pocket aromatherapy inhaler: peppermint, lavender, eucalyptus, lemon, black pepper and tulsi oils.',
    benefit: 'A mindful, aromatic pause',
    botanicals: ['peppermint', 'lavender', 'eucalyptus', 'lemon'],
    sky: ['#fbe6c8', '#e6eed6'], ink: '#1f4423', sun: 0.64
  },
  {
    id: 'cycle', name: 'Period comfort', productId: 'rollon', cycle: true,
    title: ['Comfort through', 'every cycle'],
    copy: 'Roll gently around the navel each morning: wintergreen, peppermint, ginger, lavender and eucalyptus in a sesame oil base. Designed around comfort, made to carry with you.',
    benefit: 'Menstrual comfort, on the go',
    botanicals: ['wintergreen', 'peppermint', 'ginger', 'lavender'],
    sky: ['#f6d9cf', '#ecdfe0'], ink: '#3b2430', sun: 0.8
  },
  {
    id: 'evening', name: 'Evening massage', productId: 'reviva',
    title: ['Unwind with', 'a gentle ritual'],
    copy: 'End the day with a slow massage: a botanical roll-on with dill and eucalyptus oils, for an everyday wellness and vitality ritual.',
    benefit: 'An evening massage ritual',
    botanicals: ['dill', 'eucalyptus'],
    sky: ['#2b3d4a', '#1b2d24'], ink: '#eef3e8', sun: 0.96, night: true
  }
];

// "Your ritual" filter: which needs each product answers
export const NEEDS = [
  { id: 'all', label: 'Everything' },
  { id: 'breath', label: 'Breath', products: ['gummies', 'inhaler'] },
  { id: 'calm', label: 'Calm', products: ['inhaler', 'reviva'] },
  { id: 'comfort', label: 'Comfort', products: ['rollon', 'reviva'] },
  { id: 'energy', label: 'Energy', products: ['energy', 'gummies'] },
  { id: 'liver', label: 'Liver', products: ['liver'] }
];
