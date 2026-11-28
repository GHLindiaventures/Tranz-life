// Botanicals named on the products (from the client's product sheet, Nov 2026). `p` is the index of the product,
// or null for botanicals in our R&D library (not yet tied to a product on sale).
const HERBS = [
  { n:'Peppermint', latin:'Mentha × piperita', part:'Leaf oil', cmp:'Menthol', p:1, color:0x6fb07a, seed:23, txt:'Peppermint oil is rich in menthol, the compound behind its cool, fresh feel. It is in the BreatheFree inhaler and the CycleRelief roll-on.' },
  { n:'Wintergreen', latin:'Gaultheria procumbens', part:'Leaf oil', cmp:'Methyl salicylate', p:2, color:0x7b9a5a, seed:29, txt:'Wintergreen leaf oil gives a cool, minty warmth on the skin. It leads the essential oils in the CycleRelief roll-on.' },
  { n:'Dill', latin:'Anethum graveolens', part:'Seed oil', cmp:'Carvone', p:3, color:0xa8b54a, seed:31, txt:'Dill seed oil has a fresh, herbal aroma. With eucalyptus, it is one of the two essential oils in the Reviva massage roll-on.' },
  { n:'Tulsi', latin:'Ocimum tenuiflorum', part:'Leaf', cmp:'Eugenol', p:0, color:0x7cae45, seed:3, txt:'Holy basil grows in courtyards across India. Its leaves are rich in eugenol and have a long Ayurvedic history as a respiratory herb and everyday adaptogen.' },
  { n:'Eucalyptus', latin:'Eucalyptus globulus', part:'Leaf oil', cmp:'1,8-Cineole', p:3, color:0x6fb7a0, seed:11, txt:'Steam-distilled leaf oil whose main compound, 1,8-cineole, gives eucalyptus its cool, opening vapour.' },
  { n:'Ashwagandha', latin:'Withania somnifera', part:'Root', cmp:'Withanolides', p:null, color:0xd8a25a, seed:5, txt:'An adaptogenic root used for centuries to help the body cope with stress. Its active group of compounds is called withanolides.' },
  { n:'Amla', latin:'Phyllanthus emblica', part:'Fruit', cmp:'Ascorbic acid', p:4, color:0x9cc13f, seed:2, txt:'Indian gooseberry, one of the richest natural sources of vitamin C, and a base of the classic Chyawanprash.' },
  { n:'Chamomile', latin:'Matricaria chamomilla', part:'Flower', cmp:'Apigenin', p:null, color:0xe9cf6a, seed:17, txt:'Small daisy-like flowers best known as a bedtime tea. Apigenin is the flavonoid most studied for its calming effect.' },
];

export { HERBS };
