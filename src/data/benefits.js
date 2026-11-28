// "What goes in" for the benefits table: each product's ingredients and pack facts, from the client's product sheet
// (Tranzlife Biosciences Products.pdf, Nov 2026). Same order as PRODUCTS. Facts only: the key benefits are shown above
// the table, from each product's write-up (products-page/data/product-details.js). The table compares with a typical
// brand, where a dash means "not always stated".
const BENEFITS = {
  gummies:['Tulsi and Vasaka', 'Sukku (dry ginger) and Thippili (long pepper)', 'Licorice root and Karumanjal (black turmeric)', 'Jeera, black pepper and small onion extract', 'Vitamin C, Vitamin D3 and Zinc', 'Natural berry flavour', '60 gummies per pack'],
  inhaler:['Peppermint and eucalyptus oils', 'Lavender and lemon oils', 'Black pepper and tulsi oils', 'Non-addictive formulation', 'Pocket-sized, discreet inhaler', 'Protective cap'],
  rollon:['Wintergreen oil', 'Peppermint and ginger essential oils', 'Lavender and eucalyptus oils', 'Sesame oil base', 'Non-greasy roll-on', 'Plant-based, not tested on animals', 'Compact 8 ml pack'],
  reviva:['Dill essential oil', 'Eucalyptus essential oil', 'Massage roll-on applicator', 'For external use', 'Portable 50 ml roll-on', 'ISO 9001:2015 and GMP certified'],
  liver:['Bhumyamalaki 500 mg per 10 ml', 'Kalmegh and Kutki, 400 mg each', 'Punarnava and Bhringraj, 300 mg each', 'Daruharidra, Guduchi, Amla and Haritaki, 200 mg each', 'Turmeric 150 mg and black pepper 50 mg', 'No added colours or sugar', '500 ml, 100% Ayurvedic'],
  energy:['Ruta graveolens (Q)', 'Hecla lava (3X)', 'Symphytum officinale (Q)', 'Calcarea phosphorica (8X)', 'Echinacea angustifolia (Q)', 'Measuring device in the pack', '500 ml oral liquid']
};

export { BENEFITS };
