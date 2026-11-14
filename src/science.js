// TranzLife Biosciences - Science & Innovation Page Interactive Controller
import './features/footer/night-footer.js';
import './features/navigation/dropdown.js';
import { initMolecule } from './features/science/molecule-viewer.js';
import { initReactor } from './features/pipeline/reactor.js';
import { buildLab } from './features/lab/lab-board.js';
import { pageProgress } from './app/page-sections.js';
import { initScroll } from './app/scroll-animations.js';
import { NSTAGE } from './data/pipeline.js';
import { $ } from './utils/dom.js';

// The 10 botanicals in the compound explorer: all are real TranzLife ingredients (src/data/ingredients.js, the official
// composition sheet). `product` lists every product that contains it; the link goes to the first. `seed` and `color`
// shape the 3D molecule. Wording follows the client brief: traditional use and sensory experience, no treatment claims.
export const SCIENCE_HERBS = [
  {
    id: 'peppermint',
    n: 'Peppermint',
    latin: 'Mentha × piperita',
    part: 'Steam-distilled leaf oil',
    cmp: 'L-Menthol',
    formula: 'C₁₀H₂₀O',
    mw: '156.27 g/mol',
    target: 'Cooling sensation (TRPM8 receptor)',
    color: 0x5ea36a,
    seed: 23,
    product: 'CycleRelief Roll-On & Aroma Inhaler',
    productId: 'rollon',
    txt: 'Menthol is the compound behind peppermint’s familiar cooling feel. It activates the TRPM8 cold receptors in the skin and nose, giving a fresh, cooling sensation in both the roll-on and the inhaler.'
  },
  {
    id: 'wintergreen',
    n: 'Wintergreen',
    latin: 'Gaultheria procumbens',
    part: 'Steam-distilled leaf oil',
    cmp: 'Methyl Salicylate',
    formula: 'C₈H₈O₃',
    mw: '152.15 g/mol',
    target: 'Warming sensation on the skin',
    color: 0x7fa86a,
    seed: 29,
    product: 'CycleRelief Roll-On',
    productId: 'rollon',
    txt: 'Wintergreen oil is rich in methyl salicylate, a compound long used in massage oils and balms for its warming, comforting feel on the skin.'
  },
  {
    id: 'dill',
    n: 'Dill',
    latin: 'Anethum graveolens',
    part: 'Steam-distilled seed oil',
    cmp: 'Carvone',
    formula: 'C₁₀H₁₄O',
    mw: '150.22 g/mol',
    target: 'Aromatic massage oil',
    color: 0x9bb35a,
    seed: 31,
    product: 'Reviva Roll-On',
    productId: 'reviva',
    txt: 'Dill essential oil, with its sweet, herbaceous aroma from carvone, has a long history in traditional massage and personal-care preparations.'
  },
  {
    id: 'eucalyptus',
    n: 'Eucalyptus',
    latin: 'Eucalyptus globulus',
    part: 'Steam-distilled leaf oil',
    cmp: '1,8-Cineole (Eucalyptol)',
    formula: 'C₁₀H₁₈O',
    mw: '154.25 g/mol',
    target: 'Fresh, clear-breathing aroma',
    color: 0x56a695,
    seed: 11,
    product: 'Aroma Inhaler, CycleRelief Roll-On & Reviva Roll-On',
    productId: 'inhaler',
    txt: 'Cineole gives eucalyptus its crisp, camphor-like aroma, a scent widely associated with a feeling of fresh, easy breathing. It appears in three TranzLife products.'
  },
  {
    id: 'lavender',
    n: 'Lavender',
    latin: 'Lavandula angustifolia',
    part: 'Steam-distilled flower oil',
    cmp: 'Linalool',
    formula: 'C₁₀H₁₈O',
    mw: '154.25 g/mol',
    target: 'Calming aroma',
    color: 0x9a86c4,
    seed: 37,
    product: 'Aroma Inhaler & CycleRelief Roll-On',
    productId: 'inhaler',
    txt: 'Linalool is the floral note of lavender, one of the most widely used aromas in relaxation and aromatherapy routines.'
  },
  {
    id: 'tulsi',
    n: 'Holy Basil (Tulsi)',
    latin: 'Ocimum tenuiflorum',
    part: 'Leaf',
    cmp: 'Eugenol',
    formula: 'C₁₀H₁₂O₂',
    mw: '164.20 g/mol',
    target: 'Traditional respiratory botanical',
    color: 0x6e9f3b,
    seed: 3,
    product: 'Lung Booster Gummies & Aroma Inhaler',
    productId: 'gummies',
    txt: 'Tulsi is one of the most valued plants in Indian herbal tradition. Its warm, clove-like aroma comes from eugenol, and it is traditionally used in respiratory wellness preparations.'
  },
  {
    id: 'vasaka',
    n: 'Vasaka',
    latin: 'Justicia adhatoda',
    part: 'Leaf',
    cmp: 'Vasicine',
    formula: 'C₁₁H₁₂N₂O',
    mw: '188.23 g/mol',
    target: 'Traditional Ayurvedic respiratory herb',
    color: 0x6c8f4a,
    seed: 41,
    product: 'Lung Booster Gummies',
    productId: 'gummies',
    txt: 'Vasaka (Adulsa) has a long place in Ayurvedic respiratory wellness formulations. Vasicine is its best-studied natural alkaloid.'
  },
  {
    id: 'black-pepper',
    n: 'Black Pepper',
    latin: 'Piper nigrum',
    part: 'Dried fruit',
    cmp: 'Piperine',
    formula: 'C₁₇H₁₉NO₃',
    mw: '285.34 g/mol',
    target: 'Absorption partner for other botanicals',
    color: 0x5a5440,
    seed: 43,
    product: 'Lung Booster Gummies, Liver Booster & Aroma Inhaler',
    productId: 'gummies',
    txt: 'Piperine gives black pepper its bite and is studied for how it interacts with the absorption of other botanicals and nutrients, which is why it is paired with herbs in classical formulations.'
  },
  {
    id: 'kalmegh',
    n: 'Kalmegh',
    latin: 'Andrographis paniculata',
    part: 'Aerial parts',
    cmp: 'Andrographolide',
    formula: 'C₂₀H₃₀O₅',
    mw: '350.45 g/mol',
    target: 'Traditional liver-wellness herb',
    color: 0x5b8a3c,
    seed: 47,
    product: 'Liver Booster',
    productId: 'liver',
    txt: 'Known in Ayurveda as the “king of bitters”, Kalmegh is a classical herb in traditional liver-wellness preparations. Andrographolide is its main bitter compound.'
  },
  {
    id: 'turmeric',
    n: 'Turmeric',
    latin: 'Curcuma longa',
    part: 'Rhizome',
    cmp: 'Curcumin',
    formula: 'C₂₁H₂₀O₆',
    mw: '368.38 g/mol',
    target: 'Antioxidant curcuminoids',
    color: 0xd98c28,
    seed: 14,
    product: 'Liver Booster',
    productId: 'liver',
    txt: 'Turmeric’s golden colour comes from curcumin, a natural antioxidant compound. It is one of the eleven classical botanicals in the Liver Booster.'
  }
];

// Interactive Bioavailability Simulation Data
const SIMULATION_MODES = {
  crude: {
    title: 'Crude Botanical Powder (Raw Plant Material)',
    desc: 'Unextracted ground herbs contain cellulose and fiber that bind actives. Over 65% is destroyed by harsh stomach acid, leading to erratic, low-yield intestinal absorption.',
    permeability: 16,
    retention: 28,
    onset: 18,
    specs: {
      bioavailability: '12% – 16%',
      tmax: '180 mins',
      halfLife: '2.2 hrs',
      gastricSurvival: '< 35%'
    }
  },
  solvent: {
    title: 'Conventional Solvent Extract (Hydro-Ethanolic)',
    desc: 'Standard chemical extracts concentrate phytochemicals but lack protection against digestive enzymes. Actives undergo significant hepatic first-pass degradation before reaching circulation.',
    permeability: 42,
    retention: 52,
    onset: 55,
    specs: {
      bioavailability: '38% – 45%',
      tmax: '75 mins',
      halfLife: '4.0 hrs',
      gastricSurvival: '62%'
    }
  },
  phytosome: {
    title: 'TranzLife Bio-Phytosome Delivery Platform',
    desc: 'Botanical actives are molecularly complexed within non-GMO sunflower phosphatidylcholine bi-layers. Resists gastric acid, transits mucosal barriers intact, and achieves rapid 20-minute cellular delivery.',
    permeability: 92,
    retention: 94,
    onset: 95,
    specs: {
      bioavailability: '88% – 94%',
      tmax: '20 mins',
      halfLife: '8.5 hrs',
      gastricSurvival: '> 96%'
    }
  }
};

function initSciencePage() {
  // 2. Navigation scroll header styling
  const nav = $('#nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 3. Mobile / Full-screen Navigation Menu Controller
  const btn = $('#dockMenu');
  const menu = $('#menu');
  const menuX = $('#menuX');

  function setMenuOpen(open) {
    if (!menu) return;
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', !open);
    if (btn) {
      btn.setAttribute('aria-expanded', open);
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    document.documentElement.classList.toggle('menu-open', open);
  }

  if (btn) btn.addEventListener('click', () => setMenuOpen(!menu.classList.contains('open')));
  if (menuX) menuX.addEventListener('click', () => setMenuOpen(false));
  if (menu) {
    menu.addEventListener('click', e => {
      if (e.target.closest('a')) setMenuOpen(false);
    });
  }
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu && menu.classList.contains('open')) {
      setMenuOpen(false);
    }
  });


  // 5. Interactive 3D Compound Viewer Setup
  let molViewer = null;
  const molCanvas = $('#molCanvas');
  if (molCanvas) {
    try {
      molViewer = initMolecule();
    } catch (e) {
      console.warn('Molecule 3D viewer initialization notice:', e);
    }
  }

  // Botanical Selector Buttons & Dossier
  const chipsContainer = $('#sciHerbChips');
  if (chipsContainer) {
    chipsContainer.innerHTML = SCIENCE_HERBS.map((h, i) => `
      <button class="sci-herb-btn ${i === 0 ? 'on' : ''}" data-index="${i}" type="button">
        ${h.n}
      </button>
    `).join('');

    const buttons = chipsContainer.querySelectorAll('.sci-herb-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        selectHerb(idx);
      });
    });

    // Select initial herb
    selectHerb(0);
  }

  function selectHerb(idx) {
    const herb = SCIENCE_HERBS[idx];
    if (!herb) return;

    // Update active button state
    const buttons = document.querySelectorAll('.sci-herb-btn');
    buttons.forEach((b, i) => b.classList.toggle('on', i === idx));

    // Update 3D molecule model
    if (molViewer && typeof molViewer.show === 'function') {
      molViewer.show(herb);
    }

    // Update Dossier content
    const nameEl = $('#dossierName');
    const latinEl = $('#dossierLatin');
    const cmpPillEl = $('#dossierCmpPill');
    const txtEl = $('#dossierTxt');
    const formulaEl = $('#dossierFormula');
    const mwEl = $('#dossierMw');
    const partEl = $('#dossierPart');
    const targetEl = $('#dossierTarget');
    const prodLinkEl = $('#dossierProdLink');
    const molNameHUD = $('#sciMolNameHUD');

    if (nameEl) nameEl.textContent = herb.n;
    if (latinEl) latinEl.textContent = herb.latin;
    if (cmpPillEl) cmpPillEl.textContent = herb.cmp;
    if (txtEl) txtEl.textContent = herb.txt;
    if (formulaEl) formulaEl.textContent = herb.formula;
    if (mwEl) mwEl.textContent = herb.mw;
    if (partEl) partEl.textContent = herb.part;
    if (targetEl) targetEl.textContent = herb.target;
    if (molNameHUD) molNameHUD.textContent = `${herb.cmp} (${herb.formula})`;

    if (prodLinkEl) {
      prodLinkEl.textContent = `Featured in: ${herb.product} →`;
      prodLinkEl.href = `product-details.html?id=${herb.productId}`;
    }
  }

  // 6. Interactive Bioavailability Simulator Tabs
  const simTabs = document.querySelectorAll('.sci-sim-tab');
  simTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const modeKey = tab.dataset.mode;
      simTabs.forEach(t => t.classList.toggle('active', t === tab));
      updateSimulation(modeKey);
    });
  });

  function updateSimulation(modeKey) {
    const data = SIMULATION_MODES[modeKey] || SIMULATION_MODES.phytosome;

    // Update bars
    const barPerm = $('#simBarPerm');
    const barRet = $('#simBarRet');
    const barOnset = $('#simBarOnset');
    const valPerm = $('#simValPerm');
    const valRet = $('#simValRet');
    const valOnset = $('#simValOnset');

    if (barPerm) barPerm.style.width = `${data.permeability}%`;
    if (barRet) barRet.style.width = `${data.retention}%`;
    if (barOnset) barOnset.style.width = `${data.onset}%`;

    if (valPerm) valPerm.textContent = `${data.permeability}% Intestinal Transport`;
    if (valRet) valRet.textContent = `${data.retention}% Retained Active`;
    if (valOnset) valOnset.textContent = `${data.onset}% Cellular Rate`;

    // Highlight phytosome
    if (barPerm) barPerm.classList.toggle('highlight', modeKey === 'phytosome');
    if (barRet) barRet.classList.toggle('highlight', modeKey === 'phytosome');
    if (barOnset) barOnset.classList.toggle('highlight', modeKey === 'phytosome');

    // Update callout text
    const titleEl = $('#simTitle');
    const descEl = $('#simDesc');
    const specBio = $('#simSpecBio');
    const specTmax = $('#simSpecTmax');
    const specHalf = $('#simSpecHalf');
    const specGastric = $('#simSpecGastric');

    if (titleEl) titleEl.textContent = data.title;
    if (descEl) descEl.textContent = data.desc;
    if (specBio) specBio.textContent = data.specs.bioavailability;
    if (specTmax) specTmax.textContent = data.specs.tmax;
    if (specHalf) specHalf.textContent = data.specs.halfLife;
    if (specGastric) specGastric.textContent = data.specs.gastricSurvival;
  }

  // Initialize simulation in Phytosome mode
  updateSimulation('phytosome');

  // 7. Seed-to-shelf pipeline: the scroll-driven molecule reactor
  try {
    initReactor(() => pageProgress('process'));
    // clicking a stage in the pipeline rail scrolls to that stage
    window.addEventListener('tl:goStage', e => {
      const sec = document.getElementById('process');
      if (!sec) return;
      const top = sec.getBoundingClientRect().top + window.scrollY;
      const y = top + ((e.detail + .32) / NSTAGE) * (sec.offsetHeight - window.innerHeight);
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    });
  } catch (e) {
    console.warn('Pipeline reactor unavailable:', e);
  }

  // 8. R&D lab board
  try { buildLab(); } catch (e) { console.warn('Lab board unavailable:', e); }

  // 9. Scroll reveals for the reactor and lab sections
  try { initScroll(); } catch (e) { console.warn('Scroll reveals unavailable:', e); }
}

// Auto-boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSciencePage);
} else {
  initSciencePage();
}

export { initSciencePage };

