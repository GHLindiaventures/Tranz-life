// TranzLife Biosciences - Contact Us Page Interactive Controller
import './features/footer/night-footer.js';
import './features/navigation/dropdown.js';
import { $ } from './utils/dom.js';
import { PRODUCTS, EXTRA_PRODUCTS } from './data/products.js';

function initContactPage() {
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


  // 5. Interactive Contact Form Submission
  // links from product pages arrive as ?product=<id> (a product question, filled in) or ?topic=retail
  const query = new URLSearchParams(window.location.search);
  const asked = [...PRODUCTS, ...EXTRA_PRODUCTS].find(p => p.id === query.get('product'));
  const category = $('#cpCategory'), message = $('#cpMessage');
  if (category && query.get('topic') === 'retail') category.value = 'retail';
  if (asked){
    if (category) category.value = 'support';
    if (message && !message.value) message.value = `I'd like to know more about ${asked.name}.`;
  }

  const contactForm = $('#mainContactForm');
  const toast = $('#toast');

  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = contactForm.querySelector('input[name="name"]')?.value || 'Guest';

      if (toast) {
        toast.textContent = `Thank you ${name}! Your inquiry has been sent to our scientific support team.`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4000);
      }
      contactForm.reset();
    });
  }

  // 6. FAQ Accordions Controller
  const faqItems = document.querySelectorAll('.cp-faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.cp-faq-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        // Close others for clean accordion feel
        faqItems.forEach(i => i.classList.remove('open'));
        if (!isOpen) {
          item.classList.add('open');
        }
      });
    }
  });
}

// Auto-boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContactPage);
} else {
  initContactPage();
}

export { initContactPage };

