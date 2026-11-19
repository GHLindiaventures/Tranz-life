// Line icons for the section dock.
const SEC_IC = {
  xp:'<path d="M4 11l8-7 8 7v9h-5v-6h-6v6H4z"/>',
  collide:'<circle cx="6" cy="7" r="2.2"/><circle cx="18" cy="9" r="2.2"/><circle cx="11" cy="17.5" r="2.2"/><path d="M8.1 7.4l7.7 1.2M7.1 9l2.9 6.5M16.6 10.8l-4.1 4.9"/>',
  genesis:'<path d="M12 21v-7"/><path d="M12 14c-4 0-7-2.5-7-6.5 0-1 .3-2 .8-2.5C7 7 9 8 12 8s5-1 6.2-3c.5.5.8 1.5.8 2.5 0 4-3 6.5-7 6.5z"/><path d="M9 21h6"/>',
  home:'<path d="M4 11l8-7 8 7v9h-5v-6h-6v6H4z"/>',
  roots:'<path d="M8 3c0 5 8 5 8 9s-8 4-8 9"/><path d="M16 3c0 5-8 5-8 9s8 4 8 9"/><path d="M9.5 6.5h5M9.5 17.5h5"/>',
  day:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/>',
  ritual:'<rect x="7" y="9" width="10" height="12" rx="2.5"/><path d="M8 4.5h8V9H8z"/><path d="M10 14h4"/>',
  proof:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M8.8 12.2l2.2 2.2 4.2-4.6"/>',
  nature:'<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  explore:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  insider:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  products:'<rect x="7" y="9" width="10" height="12" rx="2.5"/><path d="M8 4.5h8V9H8z"/><path d="M10 14h4"/>',
  benefits:'<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.3l2.4 2.4 4.6-5"/>',
  process:'<circle cx="6" cy="7" r="2.2"/><circle cx="18" cy="9" r="2.2"/><circle cx="11" cy="17.5" r="2.2"/><path d="M8.1 7.4l7.7 1.2M7.1 9l2.9 6.5M16.6 10.8l-4.1 4.9"/>',
  science:'<path d="M8 3c0 5 8 5 8 9s-8 4-8 9"/><path d="M16 3c0 5-8 5-8 9s8 4 8 9"/><path d="M9.5 6.5h5M9.5 17.5h5"/>',
  lab:'<path d="M9.5 3h5M10.5 3v6l-5 9a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.6 15h8.8"/>',
  finder:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  shop:'<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  contact:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/>'
};

const svgI = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export { SEC_IC, svgI };
