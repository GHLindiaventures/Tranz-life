// Product catalogue for the Products page: the six TranzLife products (same ids, order and prices as
// src/data/products.js). Short copy from the client's product sheet (Nov 2026); full write-ups: product-details.js.
const PRODUCTS = [
  { id:'gummies', no:'01', short:'Lung Booster', name:'TranzLife Lung Booster Gummies', cat:'gummies', tag:'Respiratory', price:549, size:'60 gummies',
    desc:'PulmoClear gummies: Tulsi, Vasaka, dry ginger and long pepper with Vitamin C, D3 and Zinc, in a natural berry flavour, designed to support respiratory wellness.',
    ing:['Tulsi & Vasaka','Vitamin C, D3 & Zinc','60 gummies'], model:'jar', fit:1, gummy:['#d2161f', '#ee7a12', '#f2a12c', '#97182c', '#e8551a'] },
  { id:'inhaler', no:'02', short:'BreatheFree', name:'TranzLife BreatheFree Aromatherapy Inhaler', cat:'inhaler', tag:'Smoke-free', price:249, size:'Pocket aromatherapy inhaler',
    desc:'An essential oil aromatherapy inhaler for your journey towards a smoke-free lifestyle: relaxation, freshness and breathing comfort, wherever you are.',
    ing:['Six essential oils','Pocket-sized','Smoke-free support'], model:'inhaler', fit:1.16 },
  { id:'rollon', no:'03', short:'CycleRelief', name:'TranzLife CycleRelief Roll-On', cat:'rollon', tag:'Women’s care', price:399, size:'8 ml roll-on',
    desc:'A plant-based roll-on with wintergreen, peppermint, ginger, lavender and eucalyptus oils, for a soothing self-care routine during your menstrual cycle.',
    ing:['Wintergreen & peppermint','Ginger & lavender','8 ml roll-on'], model:'rollon', fit:1.06 },
  { id:'reviva', no:'04', short:'Reviva', name:'TranzLife Reviva Roll-On', cat:'rollon', tag:'Self-care', price:399, size:'50 ml massage roll-on',
    desc:'A botanical-inspired massage roll-on with dill and eucalyptus essential oils, for a refreshing daily personal-care routine.',
    ing:['Dill & eucalyptus','Massage roll-on','External use'], model:'reviva', fit:1.06 },
  { id:'liver', no:'05', short:'Liver Booster', name:'TranzLife Liver Booster', cat:'liquid', tag:'Liver wellness', price:649, size:'500 ml polyherbal concoction',
    desc:'Eleven traditional botanicals in a polyherbal liquid, designed to support normal liver function, digestive wellness and overall well-being.',
    ing:['11 botanicals','10 ml twice daily','500 ml'], model:'liver', fit:1.14 },
  { id:'energy', no:'06', short:'Energy Booster', name:'TranzLife Energy Booster', cat:'liquid', tag:'Energy', price:649, size:'500 ml oral liquid',
    desc:'A herbal and bioactive oral liquid with botanical and mineral ingredients, designed to support everyday energy, stamina and an active lifestyle.',
    ing:['Botanical & mineral','7.5 ml twice daily','500 ml'], model:'energy', fit:1.18 }
];

export { PRODUCTS };
