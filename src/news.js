// TranzLife Biosciences - News & Insights Interactive Controller
import './styles/main.css';
import { initCart } from './features/cart/cart.js';
import { $ } from './utils/dom.js';

export const ARTICLES_DATA = [
  {
    id: 'bioavailability-barrier',
    title: 'Overcoming the Polyphenol Bioavailability Barrier: A Comparative Phytosome Study',
    category: 'clinical',
    categoryLabel: 'Clinical Whitepaper',
    date: '28 Oct 2026',
    readTime: '6 min read',
    excerpt: 'How phospholipid micellar complexation shields polyphenol molecules through the acidic gastric barrier, achieving up to 29-fold higher circulating plasma bioavailability than unformulated botanical extracts.',
    author: 'Dr. V. Narayanan, Lead Phytochemist'
  },
  {
    id: 'respiratory-cineole',
    title: 'Molecular Architecture of Upper Respiratory Relief: Standardized 1,8-Cineole in Focus',
    category: 'botanical',
    categoryLabel: 'Botanical Science',
    date: '14 Oct 2026',
    readTime: '4 min read',
    excerpt: 'An analytical review of how volatile monoterpene vapors interact with bronchial epithelial cilia to increase mucociliary clearance velocity without chemical decongestant rebound.',
    author: 'TranzLife Respiratory Research Group'
  },
  {
    id: 'cleanroom-expansion',
    title: 'TranzLife Expands Cleanroom Manufacturing with ISO 7 Certification',
    category: 'company',
    categoryLabel: 'Company Milestone',
    date: '02 Oct 2026',
    readTime: '3 min read',
    excerpt: 'Our newly commissioned 12,000 sq ft pharmaceutical cleanroom suite features Class 10,000 positive pressure isolation, expanded supercritical CO₂ extraction, and automated nitrogen packaging.',
    author: 'Corporate Communications'
  },
  {
    id: 'circadian-neurochemistry',
    title: 'Circadian Neurochemistry: How Apigenin and Geraniol Modulate Parasympathetic Rebound',
    category: 'health',
    categoryLabel: 'Preventive Health',
    date: '19 Sep 2026',
    readTime: '5 min read',
    excerpt: 'Examining non-sedative autonomic nervous system regulation through gentle GABA-A receptor affinity, reducing cortisol spikes and priming physiological slow-wave sleep cycles.',
    author: 'Clinical Science Advisory Board'
  },
  {
    id: 'hepatic-phase2-pathways',
    title: 'Phase II Hepatic Detoxification Pathways: The Synergistic Action of Silymarin and Kutkin',
    category: 'clinical',
    categoryLabel: 'Clinical Research',
    date: '05 Sep 2026',
    readTime: '7 min read',
    excerpt: 'Dual-action hepatoprotection: how standardized flavonolignans and iridoid glycosides protect cell membrane integrity while accelerating enzymatic glutathione sulfation in liver hepatocytes.',
    author: 'Dr. S. Kulkarni, Molecular Biology'
  },
  {
    id: 'regenerative-endowment',
    title: 'Regenerative Agroforestry in the Western Ghats: TranzLife’s Harvester Endowment',
    category: 'company',
    categoryLabel: 'Ecological Stewardship',
    date: '22 Aug 2026',
    readTime: '4 min read',
    excerpt: 'Expanding our ethical wildcrafting partnership to support 450+ indigenous tribal families with guaranteed above-market wages, soil regeneration protocols, and clean water endowments.',
    author: 'Sustainability & Community Team'
  }
];

function initNewsPage() {
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

  // 5. News Category Filter
  let activeFilter = 'all';
  const grid = $('#newsGrid');
  const filterBtns = document.querySelectorAll('.news-filter-btn');

  function renderArticles() {
    if (!grid) return;

    const filtered = ARTICLES_DATA.filter(a => activeFilter === 'all' || a.category === activeFilter);

    grid.innerHTML = filtered.map(a => `
      <article class="news-card" data-id="${a.id}">
        <div class="news-card-top">
          <span class="news-card-badge">${a.categoryLabel}</span>
          <span class="news-card-date">${a.date}</span>
        </div>
        <h3>${a.title}</h3>
        <p>${a.excerpt}</p>
        <div class="news-card-foot">
          <span>${a.readTime}</span>
          <a href="about.html" class="news-read-more">Read Whitepaper →</a>
        </div>
      </article>
    `).join('');
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.category || 'all';
      renderArticles();
    });
  });

  renderArticles();

  // 6. Newsletter Subscription Form
  const subForm = $('#newsSubForm');
  const toast = $('#toast');

  if (subForm) {
    subForm.addEventListener('submit', e => {
      e.preventDefault();
      const emailInput = subForm.querySelector('input[type="email"]');
      if (emailInput && emailInput.value.includes('@')) {
        emailInput.value = '';
        if (toast) {
          toast.textContent = 'Thank you for subscribing to TranzLife Clinical Insights!';
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 3500);
        }
      }
    });
  }
}

// Auto-boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNewsPage);
} else {
  initNewsPage();
}

export { initNewsPage };
