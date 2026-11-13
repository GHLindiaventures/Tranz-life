// TranzLife Biosciences - Science & Innovation Page Interactive Controller
import { initCart } from './features/cart/cart.js';
import { initMolecule } from './features/science/molecule-viewer.js';
import { initReactor } from './features/pipeline/reactor.js';
import { buildLab } from './features/lab/lab-board.js';
import { pageProgress } from './app/page-sections.js';
import { initScroll } from './app/scroll-animations.js';
import { NSTAGE } from './data/pipeline.js';
import { $ } from './utils/dom.js';

// Comprehensive 10-Botanical Scientific Registry
export const SCIENCE_HERBS = [
  {
    id: 'peppermint',
    n: 'Peppermint',
    latin: 'Mentha × piperita',
    part: 'Steam-distilled leaf oil',
    cmp: 'L-Menthol',
    formula: 'C₁₀H₂₀O',
    mw: '156.27 g/mol',
    target: 'TRPM8 Cold Receptor Agonist',
    color: 0x5ea36a,
    seed: 23,
    product: 'Calm Roll-On',
    productId: 'rollon',
    txt: 'Natural menthol triggers peripheral TRPM8 thermosensory receptors, generating a sustained physiological cooling sensation that relieves localized tension, eases mental fatigue, and calms sensory nerve hyper-reactivity without tissue temperature drop.',
    metrics: { bioavailability: '+290%', onset: '3-5 mins', retention: '4.5 hrs' }
  },
  {
    id: 'rosemary',
    n: 'Rosemary',
    latin: 'Salvia rosmarinus',
    part: 'CO₂ needle extract',
    cmp: '1,8-Cineole (Eucalyptol)',
    formula: 'C₁₀H₁₈O',
    mw: '154.25 g/mol',
    target: 'AChE Neuro-Inhibitor & Vasodilator',
    color: 0x769652,
    seed: 29,
    product: 'Focus Gummies & Calm Roll-On',
    productId: 'gummies',
    txt: 'Standardized 1,8-cineole passes the blood-brain barrier with high lipophilic affinity, inhibiting acetylcholinesterase to sustain acetylcholine availability. This promotes uninterrupted executive focus, mental clarity, and cerebral microcirculation.',
    metrics: { bioavailability: '+310%', onset: '8-12 mins', retention: '6.0 hrs' }
  },
  {
    id: 'rose',
    n: 'Damask Rose',
    latin: 'Rosa damascena',
    part: 'Hydro-distilled fresh petals',
    cmp: 'Geraniol & Citronellol',
    formula: 'C₁₀H₁₈O',
    mw: '154.25 g/mol',
    target: 'GABA-A Allosteric Modulation',
    color: 0xd6808e,
    seed: 31,
    product: 'Calm Roll-On',
    productId: 'rollon',
    txt: 'Aromatic monoterpenoids in Rosa damascena gently stimulate autonomic olfactory-limbic pathways, blunting acute cortisol secretion and facilitating parasympathetic rest without motor sedation or day-after drowsiness.',
    metrics: { bioavailability: '+280%', onset: '5-10 mins', retention: '5.2 hrs' }
  },
  {
    id: 'tulsi',
    n: 'Holy Basil (Tulsi)',
    latin: 'Ocimum tenuiflorum',
    part: 'Flowering aerial tops',
    cmp: 'Eugenol & Ursolic Acid',
    formula: 'C₁₀H₁₂O₂',
    mw: '164.20 g/mol',
    target: 'COX-2 & 5-LOX Enzyme Suppression',
    color: 0x6e9f3b,
    seed: 3,
    product: 'Forest Breathe Inhaler',
    productId: 'inhaler',
    txt: 'Eugenol and triterpenic ursolic acid downregulate inflammatory cyclooxygenase pathways, shielding respiratory epithelial membranes from ambient oxidative stress and urban particulate micro-pollutants.',
    metrics: { bioavailability: '+330%', onset: '10-15 mins', retention: '6.8 hrs' }
  },
  {
    id: 'eucalyptus',
    n: 'Tasmanian Blue Gum',
    latin: 'Eucalyptus globulus',
    part: 'Supercritical fresh leaf oil',
    cmp: '1,8-Cineole (99.2% Standardized)',
    formula: 'C₁₀H₁₈O',
    mw: '154.25 g/mol',
    target: 'Bronchial Ciliary Motility Enhancer',
    color: 0x56a695,
    seed: 11,
    product: 'Forest Breathe Inhaler',
    productId: 'inhaler',
    txt: 'High-purity cineole vapor decreases mucus viscosity and stimulates mucosal ciliary beat frequency, opening upper airways and relieving sinus constriction with immediate biological onset.',
    metrics: { bioavailability: '+380%', onset: '60 secs', retention: '3.5 hrs' }
  },
  {
    id: 'ashwagandha',
    n: 'Ashwagandha',
    latin: 'Withania somnifera',
    part: 'Standardized root extract',
    cmp: 'Withaferin A & Withanolides',
    formula: 'C₂₈H₃₈O₆',
    mw: '470.60 g/mol',
    target: 'HPA Axis & Cortisol Homeostasis',
    color: 0xc8964d,
    seed: 5,
    product: 'Reviva Drops & Focus Gummies',
    productId: 'reviva',
    txt: 'Purified withanolide glycosides recalibrate the hypothalamic-pituitary-adrenal (HPA) axis, attenuating systemic adrenaline surges, elevating mitochondrial ATP resilience, and stabilizing REM sleep stages.',
    metrics: { bioavailability: '+350%', onset: '30-45 mins', retention: '8.5 hrs' }
  },
  {
    id: 'turmeric',
    n: 'Curcuma Longa',
    latin: 'Curcuma longa L.',
    part: 'Supercritical rhizome phytosome',
    cmp: 'Curcuminoids C3 Complex',
    formula: 'C₂₁H₂₀O₆',
    mw: '368.38 g/mol',
    target: 'NF-κB Inflammatory Pathway Blockade',
    color: 0xd98c28,
    seed: 14,
    product: 'Reviva Drops & Liver Protect',
    productId: 'reviva',
    txt: 'Curcumin C3 Complex inhibits nuclear translocation of NF-κB, stopping cytokine amplification at the genetic level. Co-complexed with non-GMO sunflower phosphatidylcholine to achieve 29x higher plasma bioavailability than standard turmeric powder.',
    metrics: { bioavailability: '+2900%', onset: '20 mins', retention: '8.0 hrs' }
  },
  {
    id: 'milk-thistle',
    n: 'Milk Thistle',
    latin: 'Silybum marianum',
    part: 'Standardized seed extract',
    cmp: 'Silymarin (80% Silybin A/B)',
    formula: 'C₂₅H₂₂O₁₀',
    mw: '482.44 g/mol',
    target: 'Hepatocyte Membrane Stabilization',
    color: 0x985ba6,
    seed: 39,
    product: 'Liver Protect Drops',
    productId: 'liver',
    txt: 'Silymarin suppresses lipid peroxidation and reinforces hepatic cellular outer membranes against metabolic xenobiotics, while simultaneously upregulating endogenous glutathione synthesis and Phase II sulfation pathways.',
    metrics: { bioavailability: '+340%', onset: '25 mins', retention: '7.2 hrs' }
  },
  {
    id: 'amla',
    n: 'Indian Gooseberry',
    latin: 'Phyllanthus emblica',
    part: 'Fresh cold-pressed berries',
    cmp: 'Emblicanin A/B & Ascorbic Complex',
    formula: 'C₆H₈O₆',
    mw: '176.12 g/mol',
    target: 'Cellular Redox & ROS Neutralization',
    color: 0x8fb837,
    seed: 2,
    product: 'Liver Protect & Focus Gummies',
    productId: 'liver',
    txt: 'Tannoid-bound bio-vitamin C resists oxidation significantly longer than laboratory ascorbic acid, preserving cell wall integrity and recycling intracellular vitamins E and glutathione in liver hepatocytes.',
    metrics: { bioavailability: '+260%', onset: '15 mins', retention: '9.0 hrs' }
  },
  {
    id: 'chamomile',
    n: 'German Chamomile',
    latin: 'Matricaria chamomilla',
    part: 'Sun-dried flower blossoms',
    cmp: 'Apigenin Flavonoid',
    formula: 'C₁₅H₁₀O₅',
    mw: '270.24 g/mol',
    target: 'Central Benzodiazepine Receptors',
    color: 0xdfbe4c,
    seed: 17,
    product: 'Calm Roll-On',
    productId: 'rollon',
    txt: 'Apigenin selectively binds central benzodiazepine receptors without risk of habituation or drowsiness, gently dampening neuronal hyper-excitability, quieting somatic muscle tension, and promoting restorative rest.',
    metrics: { bioavailability: '+300%', onset: '20 mins', retention: '5.5 hrs' }
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
  // 1. Initialize shopping bag state
  try {
    initCart();
  } catch (e) {
    console.warn('Cart initialization deferred:', e);
  }

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

  // 4. Cart Bag Drawer Controller
  const bagBtn = $('#bagBtn');
  const drawer = $('#drawer');
  const scrim = $('#scrim');
  const closeBag = $('#closeBag');

  function setDrawerOpen(open) {
    if (!drawer || !scrim) return;
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', !open);
    scrim.classList.toggle('open', open);
    document.documentElement.classList.toggle('bag-open', open);
  }

  if (bagBtn) bagBtn.addEventListener('click', () => setDrawerOpen(true));
  if (closeBag) closeBag.addEventListener('click', () => setDrawerOpen(false));
  if (scrim) scrim.addEventListener('click', () => setDrawerOpen(false));

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

