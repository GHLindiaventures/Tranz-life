// Product catalogue: the six TranzLife products from the client's design boards.
// Names and short copy follow the client's product write-ups (full write-ups: product-details.js).
// Ingredients follow the official composition sheet (src/data/ingredients.js); prices and sizes match src/data/products.js.
const PRODUCTS = [
  { id:'gummies', no:'01', short:'Lung Booster', name:'TranzLife Lung Booster Gummies', cat:'gummies', tag:'Respiratory', price:549, size:'60 gummies',
    desc:'Botanical-inspired gummies with Tulsi, Vasaka, dry ginger and long pepper, plus vitamin C, D3 and zinc, in a convenient format for modern lifestyles.',
    ing:['Tulsi & Vasaka','Vitamin C, D3 & Zinc','60 gummies'], model:'jar', fit:1, gummy:['#d2161f', '#ee7a12', '#f2a12c', '#97182c', '#e8551a'] },
  { id:'inhaler', no:'02', short:'Aroma Inhaler', name:'TranzLife Aromatherapy Inhaler', cat:'inhaler', tag:'Relax', price:249, size:'10 ml pocket inhaler',
    desc:'A compact, portable aromatherapy inhaler that brings a refreshing aromatic moment into your day. Pause, breathe and rediscover your balance.',
    ing:['Peppermint & Lavender','Eucalyptus & Lemon','Portable'], model:'inhaler', fit:1.16 },
  { id:'rollon', no:'03', short:'CycleRelief', name:'TranzLife CycleRelief Roll-On', cat:'rollon', tag:'Women’s care', price:399, size:'50 ml roll-on',
    desc:'A women’s menstrual wellness roll-on with wintergreen, peppermint, ginger, lavender and eucalyptus, designed around comfort and convenience throughout your cycle.',
    ing:['Wintergreen & Peppermint','Ginger & Lavender','Eucalyptus'], model:'rollon', fit:1.06 },
  { id:'reviva', no:'04', short:'Reviva', name:'Reviva Roll-On', cat:'rollon', tag:'Massage roll-on', price:399, size:'50 ml',
    desc:'A practical botanical massage roll-on, designed to complement a daily self-care routine with a refreshing topical application.',
    ing:['Dill essential oil','Eucalyptus essential oil','External use'], model:'reviva', fit:1.06 },
  { id:'liver', no:'05', short:'Liver Booster', name:'TranzLife Liver Booster', cat:'liquid', tag:'Liver wellness', price:649, size:'500 ml',
    desc:'A classical Ayurvedic liquid with eleven botanicals, led by Bhumyamalaki, Kalmegh and Kutki, for everyday liver wellness and a healthier lifestyle.',
    ing:['Bhumyamalaki & Kalmegh','Kutki & Punarnava','11 botanicals'], model:'liver', fit:1.14 },
  { id:'energy', no:'06', short:'Energy Booster', name:'TranzLife Energy Booster', cat:'liquid', tag:'Energy & vitality', price:null, size:'500 ml oral liquid',
    desc:'A herbal and bioactive oral liquid designed to complement an active lifestyle, daily energy and general well-being.',
    ing:['Botanical & mineral','Oral liquid','Daily routine'], model:'energy', fit:1.12 }
];

export { PRODUCTS };
