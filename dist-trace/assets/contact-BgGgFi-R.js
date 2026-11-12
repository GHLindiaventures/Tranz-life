import { i as initCart, $ } from "./cart-DFQXMGTx.js";
/* empty css              */
function initContactPage() {
  try {
    initCart();
  } catch (e) {
    console.warn("Cart initialization deferred:", e);
  }
  const nav = $("#nav");
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 20);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const btn = $("#dockMenu");
  const menu = $("#menu");
  const menuX = $("#menuX");
  function setMenuOpen(open) {
    if (!menu) return;
    menu.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", !open);
    if (btn) {
      btn.setAttribute("aria-expanded", open);
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    document.documentElement.classList.toggle("menu-open", open);
  }
  if (btn) btn.addEventListener("click", () => setMenuOpen(!menu.classList.contains("open")));
  if (menuX) menuX.addEventListener("click", () => setMenuOpen(false));
  if (menu) {
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setMenuOpen(false);
    });
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu && menu.classList.contains("open")) {
      setMenuOpen(false);
    }
  });
  const bagBtn = $("#bagBtn");
  const drawer = $("#drawer");
  const scrim = $("#scrim");
  const closeBag = $("#closeBag");
  function setDrawerOpen(open) {
    if (!drawer || !scrim) return;
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", !open);
    scrim.classList.toggle("open", open);
    document.documentElement.classList.toggle("bag-open", open);
  }
  if (bagBtn) bagBtn.addEventListener("click", () => setDrawerOpen(true));
  if (closeBag) closeBag.addEventListener("click", () => setDrawerOpen(false));
  if (scrim) scrim.addEventListener("click", () => setDrawerOpen(false));
  const contactForm = $("#mainContactForm");
  const toast = $("#toast");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      var _a;
      e.preventDefault();
      const name = ((_a = contactForm.querySelector('input[name="name"]')) == null ? void 0 : _a.value) || "Guest";
      if (toast) {
        toast.textContent = `Thank you ${name}! Your inquiry has been sent to our scientific support team.`;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 4e3);
      }
      contactForm.reset();
    });
  }
  const faqItems = document.querySelectorAll(".cp-faq-item");
  faqItems.forEach((item) => {
    const trigger = item.querySelector(".cp-faq-trigger");
    if (trigger) {
      trigger.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");
        faqItems.forEach((i) => i.classList.remove("open"));
        if (!isOpen) {
          item.classList.add("open");
        }
      });
    }
  });
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initContactPage);
} else {
  initContactPage();
}
