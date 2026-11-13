// Product catalogue: the five TranzLife products from the client's design boards.
// Names and short copy follow the client's product write-ups (full write-ups: product-details.js).
// Prices are placeholders until the client confirms them.
const PRODUCTS = [
  { id:'gummies', no:'01', short:'Lung Booster', name:'TranzLife Lung Booster Gummies', cat:'gummies', tag:'Respiratory', price:549, size:'60 gummies',
    desc:'Botanical-inspired gummies with Tulsi, Vasaka, dry ginger and long pepper, plus vitamin C, D3 and zinc, in a convenient format for modern lifestyles.',
    ing:['Tulsi & Vasaka','Vitamin C, D3 & Zinc','60 gummies'], model:'jar', fit:1, gummy:['#d2161f', '#ee7a12', '#f2a12c', '#97182c', '#e8551a'] },
  { id:'inhaler', no:'02', short:'Aroma Inhaler', name:'TranzLife Aromatherapy Inhaler', cat:'inhaler', tag:'Relax', price:249, size:'Portable aromatherapy inhaler',
    desc:'A compact, portable aromatherapy inhaler that brings a refreshing aromatic moment into your day. Pause, breathe and rediscover your balance.',
    ing:['Portable','Aromatic experience','Mindful pause'], model:'inhaler', fit:1.16 },
  { id:'rollon', no:'03', short:'CycleRelief', name:'TranzLife CycleRelief', cat:'rollon', tag:'Women’s care', price:349, size:'Roll-on with gift box',
    desc:'A women’s menstrual wellness roll-on with rosemary, rose and peppermint, designed around comfort and convenience throughout your cycle.',
    ing:['Rosemary','Rose','Peppermint'], model:'rollon', fit:1.06 },
  { id:'reviva', no:'04', short:'Reviva', name:'Reviva Roll-On', cat:'rollon', tag:'Massage roll-on', price:399, size:'50 ml',
    desc:'A practical botanical massage roll-on, designed to complement a daily self-care routine with a refreshing topical application.',
    ing:['Dill essential oil','Eucalyptus essential oil','External use'], model:'reviva', fit:1.06 },
  { id:'liver', no:'05', short:'Liver Booster', name:'TranzLife Liver Booster', cat:'liquid', tag:'Liver wellness', price:649, size:'100 ml',
    desc:'A nature-inspired liquid reflecting our botanical, quality-focused approach to liver wellness and a healthier everyday lifestyle.',
    ing:['Botanical-inspired','Quality-focused','Healthy lifestyle'], model:'liver', fit:1.14 }
];

export { PRODUCTS };
