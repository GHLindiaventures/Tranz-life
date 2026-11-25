// Botanicals shown in the Science section. p is the index of the primary TranzLife product
// in src/data/products.js featuring this botanical.
import imgPeppermint from '../assets/process/ingredient-peppermint.webp';
import imgTulsi from '../assets/process/ingredient-tulsi.webp';
import imgEucalyptus from '../assets/process/ingredient-eucalyptus.webp';
import imgLavender from '../assets/process/ingredient-lavender.webp';
import imgBhumyamalaki from '../assets/process/ingredient-bhumyamalaki.webp';
import imgTurmeric from '../assets/process/ingredient-turmeric.webp';
import imgGinger from '../assets/process/ingredient-ginger.webp';
import imgAmla from '../assets/process/ingredient-amla.webp';

const HERBS = [
  { id:'peppermint', n:'Peppermint', latin:'Mentha × piperita', part:'Leaf oil', cmp:'Menthol', p:1, color:0x6fb07a, seed:23, img:imgPeppermint,
    motto:'Breathe. Refresh. Focus.',
    notes:{ part:'Pure cold extract', cmp:'Active cooling menthol', found:'BreatheFree & CycleRelief' },
    txt:'Peppermint oil is rich in menthol, delivering a cool, crisp aromatic sensation. It is a signature botanical in our BreatheFree Inhaler, BreathFree Drops, and CycleRelief Roll-On.' },
  { id:'tulsi', n:'Tulsi', latin:'Ocimum tenuiflorum', part:'Leaf & oil', cmp:'Eugenol', p:0, color:0x7cae45, seed:3, img:imgTulsi,
    motto:'Sacred. Adaptogenic. Pure.',
    notes:{ part:'Whole sacred leaf', cmp:'Bioactive eugenol', found:'PulmoClear & BreatheFree' },
    txt:'Holy basil has a long Ayurvedic heritage for respiratory comfort and everyday balance. It appears in PulmoClear Gummies, BreatheFree Inhaler, and BreathFree Drops.' },
  { id:'eucalyptus', n:'Eucalyptus', latin:'Eucalyptus globulus', part:'Leaf oil', cmp:'1,8-Cineole', p:3, color:0x6fb7a0, seed:11, img:imgEucalyptus,
    motto:'Clear. Opening. Revitalizing.',
    notes:{ part:'Steam-distilled leaf', cmp:'Clearing 1,8-cineole', found:'Reviva, BreatheFree & CycleRelief' },
    txt:'Steam-distilled eucalyptus leaf oil is led by 1,8-cineole for an open, refreshing vapour. Featured across Reviva Roll-On, BreatheFree Inhaler, and CycleRelief Roll-On.' },
  { id:'lavender', n:'Lavender', latin:'Lavandula angustifolia', part:'Flower oil', cmp:'Linalool', p:2, color:0x9b82c8, seed:31, img:imgLavender,
    motto:'Calm. Balance. Comfort.',
    notes:{ part:'Aromatic flower spike', cmp:'Soothing linalool', found:'CycleRelief & BreatheFree' },
    txt:'Fine lavender flower oil brings linalool and linalyl acetate to promote relaxation and emotional balance in both CycleRelief Roll-On and BreatheFree Inhaler.' },
  { id:'bhumyamalaki', n:'Bhumyamalaki', latin:'Phyllanthus niruri', part:'Whole herb', cmp:'Phyllanthin', p:4, color:0x75a64a, seed:19, img:imgBhumyamalaki,
    motto:'Cleanse. Restore. Support.',
    notes:{ part:'500 mg per 10 ml', cmp:'Standardized phyllanthin', found:'TranzLife Liver Booster' },
    txt:'A foundational Ayurvedic herb for liver wellness and natural detoxification. Formulated at 500 mg per 10 ml serving as the lead botanical in TranzLife Liver Booster.' },
  { id:'turmeric', n:'Turmeric', latin:'Curcuma longa', part:'Rhizome', cmp:'Curcuminoids', p:4, color:0xe09638, seed:7, img:imgTurmeric,
    motto:'Golden. Antioxidant. Shield.',
    notes:{ part:'Golden & black rhizome', cmp:'Bioactive curcuminoids', found:'Liver Booster & PulmoClear' },
    txt:'Turmeric rhizome (and Black Turmeric / Karumanjal) provides concentrated antioxidant curcuminoids to support metabolic and respiratory wellness in Liver Booster and PulmoClear Gummies.' },
  { id:'ginger', n:'Ginger', latin:'Zingiber officinale', part:'Dry & oil rhizome', cmp:'Gingerols', p:0, color:0xd8a852, seed:13, img:imgGinger,
    motto:'Warmth. Comfort. Vitality.',
    notes:{ part:'Sukku & essential oil', cmp:'Warming gingerols', found:'PulmoClear, CycleRelief & Drops' },
    txt:'Used both as traditional dry ginger (Sukku) and warming essential oil, ginger brings bioactive gingerols to PulmoClear Gummies, CycleRelief Roll-On, and BreathFree Drops.' },
  { id:'amla', n:'Amla', latin:'Phyllanthus emblica', part:'Fruit', cmp:'Ascorbic acid', p:4, color:0x9cc13f, seed:2, img:imgAmla,
    motto:'Radiance. Immunity. Shield.',
    notes:{ part:'200 mg per 10 ml', cmp:'Natural vitamin C', found:'TranzLife Liver Booster' },
    txt:'Indian gooseberry is one of nature’s richest sources of whole-food vitamin C and polyphenols, providing antioxidant and digestive support at 200 mg per 10 ml in Liver Booster.' },
];

export { HERBS };
