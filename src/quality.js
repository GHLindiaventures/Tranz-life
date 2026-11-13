// TranzLife Biosciences - Quality & Manufacturing Interactive Controller
import { initCart } from './features/cart/cart.js';
import { $ } from './utils/dom.js';

// Simulated Live Batch Quality Database
export const BATCH_DATABASE = {
  'BATCH-TL-2026-GUM01': {
    product: 'TranzLife Focus & Cognitive Gummies',
    batchNo: 'BATCH-TL-2026-GUM01',
    mfgDate: '14 Jan 2026',
    expDate: '13 Jan 2028',
    lotOrigin: 'Nilgiri Terroir / Sub-Himalaya (Lot #NIL-26-88)',
    status: 'Released / Analytical Clearance',
    tests: [
      { param: 'Asiaticoside Active Marker (HPLC)', spec: '≥ 40.0 mg / serving', result: '42.4 mg / serving', status: 'PASS' },
      { param: 'Withanolides Assay (HPLC)', spec: '≥ 5.0% Standardized', result: '5.24% Standardized', status: 'PASS' },
      { param: 'Heavy Metals (Lead - ICP-MS)', spec: '< 0.05 ppm', result: '0.004 ppm', status: 'PASS' },
      { param: 'Heavy Metals (Arsenic - ICP-MS)', spec: '< 0.02 ppm', result: '< 0.001 ppm', status: 'PASS' },
      { param: 'Heavy Metals (Cadmium / Mercury)', spec: '< 0.01 ppm', result: 'Not Detected (<0.001)', status: 'PASS' },
      { param: 'Total Aerobic Microbial Count', spec: '< 500 CFU/g', result: '< 10 CFU/g', status: 'PASS' },
      { param: 'E. Coli & Salmonella (USP <2022>)', spec: 'Absent in 10g', result: 'Absent / Confirmed', status: 'PASS' },
      { param: 'Pesticide Screen (140+ Compounds)', spec: 'USP <561> Negative', result: 'Zero Residues Detected', status: 'PASS' }
    ]
  },
  'BATCH-TL-2026-ROL02': {
    product: 'TranzLife Calm Roll-On Aromatherapy',
    batchNo: 'BATCH-TL-2026-ROL02',
    mfgDate: '18 Jan 2026',
    expDate: '17 Jan 2028',
    lotOrigin: 'Nilgiri & Valley of Roses (Lot #VLR-26-14)',
    status: 'Released / Analytical Clearance',
    tests: [
      { param: 'L-Menthol Purity (GC-MS)', spec: '≥ 98.0%', result: '99.14% Standardized', status: 'PASS' },
      { param: '1,8-Cineole Content (GC-MS)', spec: '≥ 45.0%', result: '48.20% Standardized', status: 'PASS' },
      { param: 'Geraniol Terpenoid Assay', spec: '≥ 15.0%', result: '16.75% Standardized', status: 'PASS' },
      { param: 'Heavy Metals (Lead - ICP-MS)', spec: '< 0.05 ppm', result: '0.003 ppm', status: 'PASS' },
      { param: 'Solvent Residue Panel (USP <467>)', spec: 'Zero Solvents', result: 'None Detected (CO₂)', status: 'PASS' },
      { param: 'Microbial Bio-Burden', spec: '< 100 CFU/g', result: '< 10 CFU/g', status: 'PASS' },
      { param: 'Skin Sensitization Assay', spec: 'Non-Irritating', result: 'Hypoallergenic Cleared', status: 'PASS' }
    ]
  },
  'BATCH-TL-2026-LIV03': {
    product: 'TranzLife Liver Protect Herbal Drops',
    batchNo: 'BATCH-TL-2026-LIV03',
    mfgDate: '22 Jan 2026',
    expDate: '21 Jan 2028',
    lotOrigin: 'Himalayan Slopes & Western Ghats (Lot #HIM-26-42)',
    status: 'Released / Analytical Clearance',
    tests: [
      { param: 'Silymarin Assay (HPLC Silybin A/B)', spec: '≥ 80.0%', result: '81.65% Standardized', status: 'PASS' },
      { param: 'Picrosides I & II (Kutkin)', spec: '≥ 15.0%', result: '17.30% Standardized', status: 'PASS' },
      { param: 'Andrographolide Active Fraction', spec: '≥ 50.0%', result: '52.10% Standardized', status: 'PASS' },
      { param: 'Heavy Metals (Lead - ICP-MS)', spec: '< 0.02 ppm', result: '0.002 ppm', status: 'PASS' },
      { param: 'Aflatoxin Panel (B1, B2, G1, G2)', spec: '< 2.0 ppb', result: 'Zero Detected (<0.1)', status: 'PASS' },
      { param: 'Total Microbial Plate Count', spec: '< 300 CFU/ml', result: '< 5 CFU/ml', status: 'PASS' },
      { param: 'Pathogenic E. Coli / Salmonella', spec: 'Absent', result: 'Absent / Confirmed', status: 'PASS' }
    ]
  },
  'BATCH-TL-2026-INH04': {
    product: 'TranzLife Forest Breathe Botanical Inhaler',
    batchNo: 'BATCH-TL-2026-INH04',
    mfgDate: '28 Jan 2026',
    expDate: '27 Jan 2028',
    lotOrigin: 'Tasmanian & Nilgiri Highlands (Lot #TAS-26-09)',
    status: 'Released / Analytical Clearance',
    tests: [
      { param: '1,8-Cineole Molecular Purity', spec: '≥ 99.0%', result: '99.35% Standardized', status: 'PASS' },
      { param: 'Eugenol Fraction (Tulsi Active)', spec: '≥ 92.0%', result: '94.80% Standardized', status: 'PASS' },
      { param: 'Volatile Organic Impurities (USP)', spec: 'Compliant', result: 'Pure Terpene Matrix', status: 'PASS' },
      { param: 'Inhalation Cytotoxicity Screen', spec: 'Non-Cytotoxic', result: 'Cellular Viability 99.8%', status: 'PASS' },
      { param: 'Heavy Metals (Total ICP-MS)', spec: '< 0.01 ppm', result: '< 0.001 ppm', status: 'PASS' },
      { param: 'Aerosol Particle Vapor Integrity', spec: 'Sterile Sealed', result: 'Hermetically Verified', status: 'PASS' }
    ]
  },
  'BATCH-TL-2026-REV05': {
    product: 'TranzLife Reviva Cellular Energy Drops',
    batchNo: 'BATCH-TL-2026-REV05',
    mfgDate: '03 Feb 2026',
    expDate: '02 Feb 2028',
    lotOrigin: 'Western Ghats & Rajasthan (Lot #WGH-26-77)',
    status: 'Released / Analytical Clearance',
    tests: [
      { param: 'Curcuminoids C3 Complex (HPLC)', spec: '≥ 95.0%', result: '96.20% Standardized', status: 'PASS' },
      { param: 'Phytosome Liposome Micelle Size', spec: '< 120 nm', result: '84.6 nm Homogeneous', status: 'PASS' },
      { param: 'Withanolides Active Concentration', spec: '≥ 5.0%', result: '5.42% Standardized', status: 'PASS' },
      { param: 'Heavy Metals (Lead - ICP-MS)', spec: '< 0.02 ppm', result: '0.003 ppm', status: 'PASS' },
      { param: 'Heavy Metals (Mercury - ICP-MS)', spec: '< 0.005 ppm', result: 'Not Detected', status: 'PASS' },
      { param: 'Microbial Pathogen Screen', spec: 'Sterile Safe', result: '0 CFU Detected', status: 'PASS' }
    ]
  }
};

function initQualityPage() {
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

  // 5. Interactive Batch COA Controller
  const batchButtons = document.querySelectorAll('.q-batch-btn');
  batchButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      batchButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const batchCode = btn.dataset.batch;
      renderCOA(batchCode);
    });
  });

  function renderCOA(code) {
    const data = BATCH_DATABASE[code] || BATCH_DATABASE['BATCH-TL-2026-GUM01'];

    const prodEl = $('#coaProduct');
    const batchEl = $('#coaBatchNo');
    const mfgEl = $('#coaMfgDate');
    const expEl = $('#coaExpDate');
    const originEl = $('#coaOrigin');
    const statusEl = $('#coaStatus');
    const tbody = $('#coaTableBody');

    if (prodEl) prodEl.textContent = data.product;
    if (batchEl) batchEl.textContent = data.batchNo;
    if (mfgEl) mfgEl.textContent = data.mfgDate;
    if (expEl) expEl.textContent = data.expDate;
    if (originEl) originEl.textContent = data.lotOrigin;
    if (statusEl) statusEl.textContent = data.status;

    if (tbody) {
      tbody.innerHTML = data.tests.map(t => `
        <tr>
          <td><strong>${t.param}</strong></td>
          <td><span style="font-family: var(--f-mono); color: var(--muted);">${t.spec}</span></td>
          <td><span style="font-family: var(--f-mono); font-weight: 700; color: var(--forest);">${t.result}</span></td>
          <td>
            <span class="q-pass-badge"><i></i> ${t.status}</span>
          </td>
        </tr>
      `).join('');
    }
  }

  // Initial COA Render
  renderCOA('BATCH-TL-2026-GUM01');
}

// Auto-boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQualityPage);
} else {
  initQualityPage();
}

export { initQualityPage };

