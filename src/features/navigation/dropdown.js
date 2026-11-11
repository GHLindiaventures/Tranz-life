// Grouped Dropdown Navigation Toggle (for touch, click & keyboard accessibility)
export function initNavDropdowns() {
  if (window.__navDropdownsInitialized) return;
  window.__navDropdownsInitialized = true;

  const getDropdowns = () => document.querySelectorAll('.nav-drop');
  const getDropBtns = () => document.querySelectorAll('.nav-drop-btn');

  function closeAll() {
    getDropdowns().forEach(d => {
      d.classList.remove('open');
      d.querySelector('.nav-drop-btn')?.setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-drop-btn');
    if (btn) {
      e.stopPropagation();
      const drop = btn.closest('.nav-drop');
      if (!drop) return;
      const wasOpen = drop.classList.contains('open');
      closeAll();
      if (!wasOpen) {
        drop.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
      return;
    }

    if (!e.target.closest('.nav-drop')) {
      closeAll();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAll();
    }
  });
}

// Auto-run if DOM already loaded or on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavDropdowns);
} else {
  initNavDropdowns();
}
