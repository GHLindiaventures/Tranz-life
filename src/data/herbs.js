// Botanicals shown in the Science section. p is the index of the product the botanical is named on,
// or null for botanicals in our R&D library (not yet tied to a product on sale).
import imgPeppermint from '../assets/process/ingredient-peppermint.webp';
import imgRosemary from '../assets/process/ingredient-rosemary.webp';
import imgRose from '../assets/process/ingredient-rose.webp';
import imgTulsi from '../assets/process/ingredient-tulsi.webp';
import imgEucalyptus from '../assets/process/ingredient-eucalyptus.webp';
import imgAshwagandha from '../assets/process/ingredient-ashwagandha.webp';
import imgAmla from '../assets/process/ingredient-amla.webp';
import imgChamomile from '../assets/process/ingredient-chamomile.webp';

const HERBS = [
  { id:'peppermint', n:'Peppermint', latin:'Mentha × piperita', part:'Leaf oil', cmp:'Menthol', p:2, color:0x6fb07a, seed:23, img:imgPeppermint,
    motto:'Care. Comfort. Confidence.',
    notes:{ part:'Pure cold extract', cmp:'Active cooling molecule', found:'Calm Roll-On formula' },
    txt:'Peppermint oil is rich in menthol, the compound behind its cool, fresh feel on the skin. It is one of the three botanicals in the Calm Roll-On.' },
  { id:'rosemary', n:'Rosemary', latin:'Salvia rosmarinus', part:'Leaf oil', cmp:'1,8-Cineole', p:2, color:0x7b9a5a, seed:29, img:imgRosemary,
    motto:'Clarity. Focus. Invigoration.',
    notes:{ part:'Aromatic needle oil', cmp:'Vapor bioactive', found:'Calm Roll-On formula' },
    txt:'A woody Mediterranean herb whose leaf oil is led by 1,8-cineole and camphor. Rosemary joins rose and peppermint in the Calm Roll-On.' },
  { id:'rose', n:'Rose', latin:'Rosa damascena', part:'Petal oil', cmp:'Geraniol', p:2, color:0xd88a96, seed:31, img:imgRose,
    motto:'Softness. Balance. Harmony.',
    notes:{ part:'Dawn-picked petals', cmp:'Floral restorative', found:'Calm Roll-On formula' },
    txt:'Damask rose petals give a soft floral oil, with geraniol and citronellol among its main compounds. Rose is named on the Calm Roll-On box.' },
  { id:'tulsi', n:'Tulsi', latin:'Ocimum tenuiflorum', part:'Leaf', cmp:'Eugenol', p:null, color:0x7cae45, seed:3, img:imgTulsi,
    motto:'Sacred. Adaptogenic. Pure.',
    notes:{ part:'Whole sacred leaf', cmp:'Stress-shield eugenol', found:'R&D botanical library' },
    txt:'Holy basil grows in courtyards across India. Its leaves are rich in eugenol and have a long Ayurvedic history as a respiratory herb and everyday adaptogen.' },
  { id:'eucalyptus', n:'Eucalyptus', latin:'Eucalyptus globulus', part:'Leaf oil', cmp:'1,8-Cineole', p:null, color:0x6fb7a0, seed:11, img:imgEucalyptus,
    motto:'Breathe. Opening. Clarity.',
    notes:{ part:'Blue gum leaves', cmp:'Clearing vapor compound', found:'R&D botanical library' },
    txt:'Steam-distilled leaf oil whose main compound, 1,8-cineole, gives eucalyptus its cool, opening vapour.' },
  { id:'ashwagandha', n:'Ashwagandha', latin:'Withania somnifera', part:'Root', cmp:'Withanolides', p:null, color:0xd8a25a, seed:5, img:imgAshwagandha,
    motto:'Resilience. Strength. Calm.',
    notes:{ part:'Aged tonic root', cmp:'Resilience withanolides', found:'R&D botanical library' },
    txt:'An adaptogenic root used for centuries to help the body cope with stress. Its active group of compounds is called withanolides.' },
  { id:'amla', n:'Amla', latin:'Phyllanthus emblica', part:'Fruit', cmp:'Ascorbic acid', p:null, color:0x9cc13f, seed:2, img:imgAmla,
    motto:'Radiance. Vitality. Shield.',
    notes:{ part:'Whole golden berry', cmp:'Whole-food vitamin C', found:'R&D botanical library' },
    txt:'Indian gooseberry, one of the richest natural sources of vitamin C, and a base of the classic Chyawanprash.' },
  { id:'chamomile', n:'Chamomile', latin:'Matricaria chamomilla', part:'Flower', cmp:'Apigenin', p:null, color:0xe9cf6a, seed:17, img:imgChamomile,
    motto:'Peace. Rest. Restoration.',
    notes:{ part:'Small daisy blossom', cmp:'Calming flavonoid', found:'R&D botanical library' },
    txt:'Small daisy-like flowers best known as a bedtime tea. Apigenin is the flavonoid most studied for its calming effect.' },
];

export { HERBS };
