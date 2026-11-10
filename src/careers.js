// TranzLife Biosciences - Careers Interactive Controller
import './styles/main.css';
import { initCart } from './features/cart/cart.js';
import { $ } from './utils/dom.js';

export const JOBS_DATA = [
  {
    id: 'formulation-scientist',
    title: 'Senior Formulation Scientist (Phytochemistry)',
    dept: 'rd',
    deptLabel: 'Research & Development',
    location: 'Bangalore R&D Center',
    type: 'Full-Time',
    desc: 'Lead liposomal and phytosome encapsulation R&D for next-generation botanical actives. Design clinical trial formulations and oversee pilot-scale supercritical extraction runs. Ph.D. or M.Pharm in Natural Products required.'
  },
  {
    id: 'analytical-chemist',
    title: 'Analytical Chemist (HPLC & Mass Spectrometry)',
    dept: 'rd',
    deptLabel: 'Research & Development',
    location: 'Analytical Testing Suites',
    type: 'Full-Time',
    desc: 'Conduct routine batch assay fingerprinting, heavy metal ICP-MS screening, and active compound HPLC quantification under strict NABL accreditation guidelines.'
  },
  {
    id: 'qa-regulatory-manager',
    title: 'Quality Assurance & Regulatory Affairs Manager',
    dept: 'quality',
    deptLabel: 'Quality & Regulatory',
    location: 'Bangalore Campus',
    type: 'Full-Time',
    desc: 'Manage compliance across AYUSH GMP, ISO 9001:2015, and international export dossier submissions. Conduct annual internal quality audits and raw material vendor verifications.'
  },
  {
    id: 'agroforestry-lead',
    title: 'Agroforestry & Sourcing Operations Lead',
    dept: 'operations',
    deptLabel: 'Operations & Supply Chain',
    location: 'Nilgiri & Western Ghats Hubs',
    type: 'Full-Time',
    desc: 'Coordinate directly with 450+ indigenous wildcraft harvesting cooperatives to maintain sustainable harvest thresholds, DNA lot traceability, and community endowment distribution.'
  },
  {
    id: 'growth-storytelling-lead',
    title: 'Digital Growth & Science Storytelling Lead',
    dept: 'growth',
    deptLabel: 'Marketing & Digital Growth',
    location: 'Bangalore HQ (Hybrid)',
    type: 'Full-Time',
    desc: 'Translate complex biochemical mechanisms and clinical trial breakthroughs into compelling visual stories, whitepapers, and consumer educational resources.'
  }
];

function initCareersPage() {
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

  // 5. Jobs Filtering & Rendering
  let activeFilter = 'all';
  const jobsList = $('#carJobsList');
  const filterBtns = document.querySelectorAll('.car-filter-btn');
  const toast = $('#toast');

  function renderJobs() {
    if (!jobsList) return;

    const filtered = JOBS_DATA.filter(j => activeFilter === 'all' || j.dept === activeFilter);

    jobsList.innerHTML = filtered.map(j => `
      <article class="car-job-card" data-id="${j.id}">
        <div class="car-job-info">
          <div class="car-job-badges">
            <span class="car-job-badge">${j.deptLabel}</span>
            <span class="car-job-badge">${j.location}</span>
            <span class="car-job-badge" style="background: rgba(36, 80, 42, 0.1);">${j.type}</span>
          </div>
          <h3>${j.title}</h3>
          <p>${j.desc}</p>
        </div>
        <div>
          <button class="car-apply-btn" data-title="${j.title}" type="button">
            Apply Now
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </article>
    `).join('');

    // Attach click listeners to Apply buttons
    const applyButtons = jobsList.querySelectorAll('.car-apply-btn');
    applyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const title = btn.dataset.title;
        if (toast) {
          toast.textContent = `Application initiated for "${title}". Please forward your CV to careers@tranzlife.bio`;
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 4500);
        }
        window.location.href = `mailto:careers@tranzlife.bio?subject=Application for ${encodeURIComponent(title)}`;
      });
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.dept || 'all';
      renderJobs();
    });
  });

  renderJobs();
}

// Auto-boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCareersPage);
} else {
  initCareersPage();
}

export { initCareersPage };
