import { i as initCart, $ } from "./cart-DFQXMGTx.js";
/* empty css              */
function initAboutPage() {
  document.querySelectorAll(".eyebrow").forEach((el) => el.classList.add("drawn"));
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
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute("href");
    if (hash === "#") return;
    const target = document.querySelector(hash);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "auto" });
    }
  });
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAboutPage);
} else {
  initAboutPage();
}
