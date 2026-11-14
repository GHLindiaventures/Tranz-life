// Botanicals shown with each product on the Products page. `p` is the index of the product (in PRODUCTS) it is shown
// with. All are real ingredients from the official composition sheet (src/data/ingredients.js); some are in more than
// one product, and the text says so.
const HERBS = [
  { n:'Tulsi', latin:'Ocimum tenuiflorum', part:'Leaf', cmp:'Eugenol', p:0, color:0x7cae45, seed:3, txt:'Holy basil grows in courtyards across India. Its leaves are rich in eugenol and have a long Ayurvedic history as a respiratory herb. It is in the Lung Booster Gummies and the Aroma Inhaler.' },
  { n:'Vasaka', latin:'Justicia adhatoda', part:'Leaf', cmp:'Vasicine', p:0, color:0x6c8f4a, seed:41, txt:'Vasaka (Adulsa) has a long place in Ayurvedic respiratory wellness preparations. Vasicine is its best-studied natural alkaloid.' },
  { n:'Peppermint', latin:'Mentha × piperita', part:'Leaf oil', cmp:'Menthol', p:1, color:0x6fb07a, seed:23, txt:'Peppermint oil is rich in menthol, the compound behind its cool, fresh feel. It is in the Aroma Inhaler and the CycleRelief roll-on.' },
  { n:'Lavender', latin:'Lavandula angustifolia', part:'Flower oil', cmp:'Linalool', p:1, color:0x9a86c4, seed:37, txt:'Linalool gives lavender its soft floral aroma, one of the most popular scents in relaxation routines. It is in the Aroma Inhaler and the CycleRelief roll-on.' },
  { n:'Wintergreen', latin:'Gaultheria procumbens', part:'Leaf oil', cmp:'Methyl salicylate', p:2, color:0x7fa86a, seed:29, txt:'Wintergreen oil is rich in methyl salicylate, long used in massage oils for its warming, comforting feel on the skin.' },
  { n:'Ginger', latin:'Zingiber officinale', part:'Rhizome', cmp:'Gingerol', p:2, color:0xd8a25a, seed:5, txt:'A warming root familiar from every Indian kitchen. Gingerol gives it its warmth. Ginger is in the CycleRelief roll-on and, as dry ginger (Sukku), in the Lung Booster Gummies.' },
  { n:'Dill', latin:'Anethum graveolens', part:'Seed oil', cmp:'Carvone', p:3, color:0x9bb35a, seed:31, txt:'Dill seed oil has a sweet, herbaceous aroma from carvone and a long history in traditional massage preparations.' },
  { n:'Eucalyptus', latin:'Eucalyptus globulus', part:'Leaf oil', cmp:'1,8-Cineole', p:3, color:0x6fb7a0, seed:11, txt:'Steam-distilled leaf oil whose main compound, 1,8-cineole, gives eucalyptus its cool, fresh aroma. It is in Reviva, CycleRelief and the Aroma Inhaler.' },
  { n:'Kalmegh', latin:'Andrographis paniculata', part:'Aerial parts', cmp:'Andrographolide', p:4, color:0x5b8a3c, seed:47, txt:'Known in Ayurveda as the “king of bitters”, Kalmegh is a classical herb in traditional liver-wellness preparations.' },
  { n:'Amla', latin:'Phyllanthus emblica', part:'Fruit', cmp:'Ascorbic acid', p:4, color:0x9cc13f, seed:2, txt:'Indian gooseberry, one of the richest natural sources of vitamin C, and one of the eleven botanicals in the Liver Booster.' },
];

export { HERBS };
