// TranzLife Biosciences - Certifications & Compliance Interactive Controller
import './features/footer/night-footer.js';
import './features/navigation/dropdown.js';
import './components/page-scrollbar.js';
import './components/chat-loader.js';
import { $ } from './utils/dom.js';

export const COMPLIANCE_REPORTS = {
  heavymetals: {
    title: 'Inductively Coupled Plasma Mass Spectrometry (ICP-MS) Panel',
    subtitle: 'NABL Accredited Testing Protocol - Method: AOAC 2015.01 / ICP-MS Multi-Elemental',
    columns: ['Elemental Marker', 'Pharmacopeial Limit', 'TranzLife Specification', 'Observed Result', 'Status'],
    rows: [
      { name: 'Lead (Pb)', limit: '< 0.50 ppm', spec: '< 0.02 ppm', result: '0.003 ppm', status: 'COMPLIANT' },
      { name: 'Arsenic (As)', limit: '< 0.20 ppm', spec: '< 0.01 ppm', result: '< 0.001 ppm', status: 'COMPLIANT' },
      { name: 'Cadmium (Cd)', limit: '< 0.10 ppm', spec: '< 0.01 ppm', result: 'Not Detected (<0.001)', status: 'COMPLIANT' },
      { name: 'Mercury (Hg)', limit: '< 0.05 ppm', spec: '< 0.005 ppm', result: 'Not Detected (<0.0005)', status: 'COMPLIANT' },
      { name: 'Nickel (Ni)', limit: '< 1.00 ppm', spec: '< 0.05 ppm', result: '0.008 ppm', status: 'COMPLIANT' }
    ]
  },
  pesticides: {
    title: 'USP <561> Agricultural Pesticide & Fungicide Screening',
    subtitle: 'Screening 140+ targeted compounds across GC-MS/MS and LC-MS/MS',
    columns: ['Pesticide Chemical Family', 'USP Limit', 'Target Sensitivity', 'Observed Result', 'Status'],
    rows: [
      { name: 'Organophosphorus Pesticides (36 Compounds)', limit: '< 0.10 mg/kg', spec: 'Zero Tolerance', result: 'None Detected (<0.01)', status: 'COMPLIANT' },
      { name: 'Organochlorine Pesticides (28 Compounds)', limit: '< 0.05 mg/kg', spec: 'Zero Tolerance', result: 'None Detected (<0.005)', status: 'COMPLIANT' },
      { name: 'Synthetic Pyrethroids (18 Compounds)', limit: '< 0.10 mg/kg', spec: 'Zero Tolerance', result: 'None Detected (<0.01)', status: 'COMPLIANT' },
      { name: 'Triazole Fungicides (14 Compounds)', limit: '< 0.05 mg/kg', spec: 'Zero Tolerance', result: 'None Detected (<0.005)', status: 'COMPLIANT' },
      { name: 'Glyphosate & AMPA Metabolites', limit: '< 0.10 mg/kg', spec: 'Zero Tolerance', result: 'None Detected (<0.01)', status: 'COMPLIANT' }
    ]
  },
  microbial: {
    title: 'USP <2021> / <2022> Microbial Enumeration & Pathogen Assay',
    subtitle: 'Sterile bio-burden verification executed in ISO 7 cleanroom suites',
    columns: ['Microbial Parameter', 'Regulatory Threshold', 'TranzLife Specification', 'Observed Result', 'Status'],
    rows: [
      { name: 'Total Aerobic Microbial Count (TAMC)', limit: '< 10,000 CFU/g', spec: '< 500 CFU/g', result: '< 10 CFU/g', status: 'COMPLIANT' },
      { name: 'Total Combined Yeasts & Molds (TYMC)', limit: '< 1,000 CFU/g', spec: '< 100 CFU/g', result: '< 10 CFU/g', status: 'COMPLIANT' },
      { name: 'Escherichia coli (USP <2022>)', limit: 'Absent in 10g', spec: 'Absent in 10g', result: 'Confirmed Absent', status: 'COMPLIANT' },
      { name: 'Salmonella species (USP <2022>)', limit: 'Absent in 25g', spec: 'Absent in 25g', result: 'Confirmed Absent', status: 'COMPLIANT' },
      { name: 'Staphylococcus aureus', limit: 'Absent in 10g', spec: 'Absent in 10g', result: 'Confirmed Absent', status: 'COMPLIANT' }
    ]
  }
};

function initCertificationsPage() {
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


  // 5. Interactive Compliance Report Tabs
  const tabBtns = document.querySelectorAll('.cert-tab-btn');
  const repTitle = $('#certReportTitle');
  const repSub = $('#certReportSubtitle');
  const tableHead = $('#certTableHead');
  const tableBody = $('#certTableBody');

  function renderReport(key) {
    const data = COMPLIANCE_REPORTS[key] || COMPLIANCE_REPORTS.heavymetals;

    if (repTitle) repTitle.textContent = data.title;
    if (repSub) repSub.textContent = data.subtitle;

    if (tableHead) {
      tableHead.innerHTML = `
        <tr>
          ${data.columns.map(c => `<th>${c}</th>`).join('')}
        </tr>
      `;
    }

    if (tableBody) {
      tableBody.innerHTML = data.rows.map(r => `
        <tr>
          <td><strong>${r.name}</strong></td>
          <td style="color: var(--muted); font-family: var(--f-mono);">${r.limit}</td>
          <td style="color: var(--sage); font-family: var(--f-mono); font-weight: 700;">${r.spec}</td>
          <td style="font-family: var(--f-mono); font-weight: 800; color: var(--forest);">${r.result}</td>
          <td>
            <span class="q-pass-badge"><i></i> ${r.status}</span>
          </td>
        </tr>
      `).join('');
    }
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderReport(btn.dataset.report);
    });
  });

  renderReport('heavymetals');
}

// Auto-boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCertificationsPage);
} else {
  initCertificationsPage();
}

export { initCertificationsPage };

