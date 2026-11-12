import { s as state, c as inr, $, a as $$, t as thumbs, i as initCart, r as renderCart } from "./cart-DFQXMGTx.js";
import { L as Lenis, i as initSmooth } from "./smooth-scroll-BCoiyism.js";
import { S as SHOTS, D as DESIGNS } from "./product-images-B5PeIIKH.js";
import { g as gsapWithCSS, c as clamp, G as Group, b as berryGeometry, a as gummyMaterial, M as Mesh, d as studioLeaf, l as lerp, S as ScrollTrigger, j as jarLayer, B as Box3, V as Vector3, r as reduce, e as ease } from "./jar-layer-CvE_SCn1.js";
const TILE = 496;
const ALPHA_MEAN = 102;
const ALPHA_SD = 42;
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function grainPixels(size = TILE, seed = 24, mean = ALPHA_MEAN, sd = ALPHA_SD) {
  const rnd = mulberry32(seed), px = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const u = Math.max(1e-9, rnd()), v = rnd();
    const n = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    const k = i * 4;
    px[k] = 255;
    px[k + 1] = 255;
    px[k + 2] = 255;
    px[k + 3] = Math.round(mean + n * sd);
  }
  return px;
}
function initGrain() {
  if (typeof document === "undefined") return;
  if ("requestIdleCallback" in window) requestIdleCallback(drawGrain, { timeout: 2e3 });
  else setTimeout(drawGrain, 300);
}
function drawGrain() {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = TILE;
    const g = c.getContext("2d");
    if (!g) return;
    g.putImageData(new ImageData(grainPixels(), TILE, TILE), 0, 0);
    const set = (url) => {
      document.documentElement.style.setProperty("--grain", `url("${url}")`);
      document.querySelectorAll("image.grain-img").forEach((img) => img.setAttribute("href", url));
    };
    if (c.toBlob) c.toBlob((b) => {
      if (b) set(URL.createObjectURL(b));
    }, "image/png");
    else set(c.toDataURL("image/png"));
  } catch (err) {
  }
}
const PRODUCTS = [
  {
    id: "gummies",
    no: "01",
    short: "Lung Booster",
    name: "TranzLife Lung Booster Gummies",
    cat: "gummies",
    tag: "Respiratory",
    price: 549,
    size: "60 gummies",
    desc: "Botanical-inspired gummies with Tulsi, Vasaka, dry ginger and long pepper, plus vitamin C, D3 and zinc, in a convenient format for modern lifestyles.",
    ing: ["Tulsi & Vasaka", "Vitamin C, D3 & Zinc", "60 gummies"],
    model: "jar",
    fit: 1,
    gummy: ["#d2161f", "#ee7a12", "#f2a12c", "#97182c", "#e8551a"]
  },
  {
    id: "inhaler",
    no: "02",
    short: "Aroma Inhaler",
    name: "TranzLife Aromatherapy Inhaler",
    cat: "inhaler",
    tag: "Relax",
    price: 249,
    size: "Portable aromatherapy inhaler",
    desc: "A compact, portable aromatherapy inhaler that brings a refreshing aromatic moment into your day. Pause, breathe and rediscover your balance.",
    ing: ["Portable", "Aromatic experience", "Mindful pause"],
    model: "inhaler",
    fit: 1.16
  },
  {
    id: "rollon",
    no: "03",
    short: "CycleRelief",
    name: "TranzLife CycleRelief",
    cat: "rollon",
    tag: "Women’s care",
    price: 349,
    size: "Roll-on with gift box",
    desc: "A women’s menstrual wellness roll-on with rosemary, rose and peppermint, designed around comfort and convenience throughout your cycle.",
    ing: ["Rosemary", "Rose", "Peppermint"],
    model: "rollon",
    fit: 1.06
  },
  {
    id: "reviva",
    no: "04",
    short: "Reviva",
    name: "Reviva Roll-On",
    cat: "rollon",
    tag: "Foot care",
    price: 449,
    size: "Roll-on",
    desc: "Diabetic foot care in a roll-on: soothing, plant-based and skin-friendly care for dry, tired feet, every day.",
    ing: ["Plant-based", "Skin friendly", "Everyday care"],
    model: "reviva",
    fit: 1.06
  },
  {
    id: "liver",
    no: "05",
    short: "Liver Booster",
    name: "TranzLife Liver Booster",
    cat: "liquid",
    tag: "Liver wellness",
    price: 649,
    size: "100 ml",
    desc: "A nature-inspired liquid reflecting our botanical, quality-focused approach to liver wellness and a healthier everyday lifestyle.",
    ing: ["Botanical-inspired", "Quality-focused", "Healthy lifestyle"],
    model: "liver",
    fit: 1.14
  }
];
const STORY = [
  { t: ["Breathe", "well"], d: "Tulsi, Vasaka, dry ginger and long pepper with vitamin C, D3 and zinc, in an easy gummy.", note: "Embrace every breath ♡", ic: "leaf", c: "#e49a52" },
  { t: ["Pause", "& breathe"], d: "A portable aromatherapy inhaler for a moment of calm, wherever life takes you.", note: "Rediscover your balance", ic: "lotus", c: "#38a58b" },
  { t: ["Every", "cycle"], d: "CycleRelief: rosemary, rose and peppermint in a roll-on made with comfort in mind.", note: "Celebrate every you", ic: "flower", c: "#d6969f" },
  { t: ["Revive", "feet"], d: "Soothing, plant-based roll-on care for dry, tired feet. Skin friendly, every day.", note: "Care. Comfort. Confidence.", ic: "foot", c: "#4d8b47" },
  { t: ["Liver", "wellness"], d: "A nature-inspired liquid for a holistic, healthier approach to liver wellness.", note: "Nourish your wellness", ic: "drop", c: "#a4b955" }
];
function makeScheduler() {
  let pending = null, added = false;
  const tick = () => {
    const fn = pending;
    if (!fn) return;
    pending = null;
    fn(performance.now());
  };
  return function schedule(fn) {
    if (gsapWithCSS && gsapWithCSS.ticker && state.lenis) {
      if (!added) {
        gsapWithCSS.ticker.add(tick);
        added = true;
      }
      pending = fn;
      return 1;
    }
    return requestAnimationFrame(fn);
  };
}
const DETAILS = {
  gummies: {
    eyebrow: "Respiratory Wellness · PulmoClear™ formulation",
    title: "TranzLife Lung Booster Gummies",
    tagline: "Breathe Well. Live Better. Embrace Every Breath.",
    intro: [
      "Discover a new approach to everyday wellness with TranzLife Lung Booster Gummies, inspired by traditional botanical knowledge and contemporary product innovation.",
      "Selected botanicals, vitamins and minerals come together in a convenient gummy format designed for modern lifestyles, rooted in nature-inspired innovation and a commitment to quality."
    ],
    listTitle: "The power of botanicals in every gummy",
    list: [
      ["Tulsi (Holy Basil)", "A traditional Indian botanical valued in herbal wellness practices."],
      ["Vasaka", "A botanical traditionally used in Ayurvedic respiratory wellness preparations."],
      ["Dry Ginger (Sukku)", "A familiar botanical ingredient used in traditional wellness formulations."],
      ["Long Pepper (Thippili)", "A traditional spice valued in Ayurvedic herbal preparations."],
      ["Black Pepper", "A natural spice containing piperine, studied for its interactions with certain nutrients."],
      ["Black Turmeric (Karumanjal)", "A distinctive botanical being explored for its phytochemical properties."],
      ["Cumin (Jeera)", "A traditional culinary ingredient included in the botanical formulation."],
      ["Licorice Root", "A botanical used in traditional herbal preparations."],
      ["Small Onion Extract", "A plant-derived ingredient included in the formulation."],
      ["Vitamin C, Vitamin D3 & Zinc", "Essential micronutrients that contribute to normal physiological functions in appropriate quantities."]
    ],
    highlightsTitle: "Why choose Lung Booster Gummies?",
    highlights: [
      ["Convenient gummy format", "Designed for easy consumption as directed on the product label."],
      ["Botanical-inspired formulation", "Inspired by traditional plant-based wellness practices."],
      ["Micronutrient inclusion", "Vitamins and minerals as specified in the final formulation."],
      ["Quality-focused development", "Emphasising ingredient specifications and formulation consistency."],
      ["Modern wellness approach", "Botanical inspiration and contemporary product development together."]
    ],
    note: "Use only as directed on the product label. This product is not a substitute for medical treatment or a means of preventing or curing respiratory disease. Consult a qualified healthcare professional if you have a respiratory condition or take regular medication."
  },
  inhaler: {
    eyebrow: "Aromatherapy · Relaxation",
    title: "TranzLife Aromatherapy Inhaler",
    tagline: "Pause. Breathe. Relax. Rediscover Your Balance.",
    intro: [
      "A moment of calm, wherever life takes you. Work pressures, busy schedules and everyday responsibilities can leave us feeling overwhelmed; taking a moment to pause and reconnect can make a meaningful difference to your daily wellness routine.",
      "The TranzLife Aromatherapy Inhaler is a convenient, portable aromatherapy product, inspired by the relationship between aroma, sensory perception and relaxation, that brings a refreshing sensory experience into your everyday routine."
    ],
    highlightsTitle: "Why choose the Aromatherapy Inhaler?",
    highlights: [
      ["A convenient wellness companion", "A compact, portable format designed to fit easily into everyday routines."],
      ["An aromatic sensory experience", "The distinctive aroma of its aromatic ingredients, as part of a personal wellness ritual."],
      ["A moment to pause", "Bring a brief pause and mindful breathing into your day whenever you need it."],
      ["Inspired by nature", "Reflecting TranzLife’s interest in botanical ingredients and nature-inspired innovation."],
      ["Designed for modern lifestyles", "A practical format for people who value simple self-care routines."]
    ],
    closingTitle: "Make space for a moment of calm",
    closing: "Wellness is not always about big changes. Use the inhaler as part of a personal relaxation routine alongside mindful breathing, adequate rest, regular physical activity and healthy daily habits.",
    note: "Use according to the product directions. Individual experiences with aromas may differ; aromatherapy is a complementary wellness practice, not a replacement for professional mental healthcare."
  },
  rollon: {
    eyebrow: "Women’s Menstrual Wellness & Comfort",
    title: "TranzLife CycleRelief",
    tagline: "Embrace Every Cycle. Celebrate Every You.",
    intro: [
      "Every woman’s journey is unique, and every menstrual cycle deserves care, comfort and understanding. CycleRelief is part of our commitment to convenient wellness solutions designed around the evolving needs of women.",
      "Some women experience discomfort, cramps, lower back pain, bloating or fatigue during their periods. CycleRelief is developed with an emphasis on comfort, convenience and individual care throughout the cycle."
    ],
    highlightsTitle: "Designed with women in mind",
    highlights: [
      ["A focus on comfort", "Positioned as a women’s wellness solution for comfort and well-being during menstruation."],
      ["Convenience for everyday life", "A practical solution that fits into women’s daily routines."],
      ["Thoughtful innovation", "Scientific understanding, formulation expertise and nature-inspired innovation combined."],
      ["Quality-conscious development", "Responsible formulation, appropriate testing and clear information for informed choices."]
    ],
    listTitle: "Our commitment to women’s wellness",
    list: [
      ["Awareness", "Promoting awareness of menstrual health and self-care."],
      ["Informed choices", "Supporting informed decisions about period-related discomfort."],
      ["Quality", "Prioritising product quality and responsible innovation."],
      ["Professional guidance", "Encouraging medical advice when symptoms are severe, unusual or persistent."]
    ],
    note: "Use as directed on the label. Please consult a healthcare professional if your symptoms are severe, unusual or persistent."
  },
  liver: {
    eyebrow: "Nature-Inspired Innovation for Liver Wellness",
    title: "TranzLife Liver Booster",
    tagline: "Nourish Your Wellness. Support Your Liver. Embrace a Healthier Lifestyle.",
    intro: [
      "TranzLife Liver Booster reflects our commitment to botanical-inspired wellness solutions designed with a focus on quality, scientific understanding and everyday well-being, combining traditional botanical knowledge with contemporary product development.",
      "The liver plays a vital role in the body’s internal balance: it contributes to nutrient metabolism, processes many substances in the bloodstream and produces bile to support digestion."
    ],
    highlightsTitle: "Our approach to liver wellness",
    highlights: [
      ["Botanical inspiration", "Exploring plant-derived ingredients and traditional botanical knowledge."],
      ["Quality-focused formulation", "Ingredient identity, quality standards, formulation consistency and appropriate testing."],
      ["Science-led innovation", "Scientific understanding and responsible innovation for evolving wellness needs."],
      ["Responsible wellness", "Encouraging informed choices and a holistic approach to well-being."]
    ],
    closingTitle: "Making liver health a priority",
    closing: "Liver health begins with everyday habits: a balanced diet, regular physical activity, limiting alcohol, maintaining a healthy weight and following medical advice about medicines.",
    note: "Liver wellness products should not replace a balanced lifestyle, appropriate medical assessment or prescribed treatment. Consult a qualified healthcare professional if you have concerns about liver function."
  }
};
const NEEDS = [
  { t: "A little better every day", p: 0, why: "Sixty plant-based gummies with natural flavours and colours, made to support immunity, energy and everyday wellbeing." },
  { t: "Calm down in a busy moment", p: 1, why: "A pocket nasal inhaler made with 100% natural, organic ingredients. Two slow breaths whenever you need a pause." },
  { t: "Ease period cramps", p: 2, why: "Rosemary, rose and peppermint in a pocket roll-on made for period cramp relief." },
  { t: "Care for dry, tired feet", p: 3, why: "Reviva is a plant-based, skin-friendly roll-on for everyday diabetic foot care." },
  { t: "Support my liver", p: 4, why: "A nature-inspired liquid reflecting our botanical, quality-focused approach to liver wellness." }
];
const HERBS = [
  { n: "Peppermint", latin: "Mentha × piperita", part: "Leaf oil", cmp: "Menthol", p: 2, color: 7319674, seed: 23, txt: "Peppermint oil is rich in menthol, the compound behind its cool, fresh feel on the skin. It is one of the three botanicals in the CycleRelief roll-on." },
  { n: "Rosemary", latin: "Salvia rosmarinus", part: "Leaf oil", cmp: "1,8-Cineole", p: 2, color: 8100442, seed: 29, txt: "A woody Mediterranean herb whose leaf oil is led by 1,8-cineole and camphor. Rosemary joins rose and peppermint in the CycleRelief roll-on." },
  { n: "Rose", latin: "Rosa damascena", part: "Petal oil", cmp: "Geraniol", p: 2, color: 14191254, seed: 31, txt: "Damask rose petals give a soft floral oil, with geraniol and citronellol among its main compounds. Rose is named on the CycleRelief roll-on box." },
  { n: "Tulsi", latin: "Ocimum tenuiflorum", part: "Leaf", cmp: "Eugenol", p: null, color: 8171077, seed: 3, txt: "Holy basil grows in courtyards across India. Its leaves are rich in eugenol and have a long Ayurvedic history as a respiratory herb and everyday adaptogen." },
  { n: "Eucalyptus", latin: "Eucalyptus globulus", part: "Leaf oil", cmp: "1,8-Cineole", p: null, color: 7321504, seed: 11, txt: "Steam-distilled leaf oil whose main compound, 1,8-cineole, gives eucalyptus its cool, opening vapour." },
  { n: "Ashwagandha", latin: "Withania somnifera", part: "Root", cmp: "Withanolides", p: null, color: 14197338, seed: 5, txt: "An adaptogenic root used for centuries to help the body cope with stress. Its active group of compounds is called withanolides." },
  { n: "Amla", latin: "Phyllanthus emblica", part: "Fruit", cmp: "Ascorbic acid", p: null, color: 10273087, seed: 2, txt: "Indian gooseberry, one of the richest natural sources of vitamin C, and a base of the classic Chyawanprash." },
  { n: "Chamomile", latin: "Matricaria chamomilla", part: "Flower", cmp: "Apigenin", p: null, color: 15322986, seed: 17, txt: "Small daisy-like flowers best known as a bedtime tea. Apigenin is the flavonoid most studied for its calming effect." }
];
const ICONS = {
  leaf: '<path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z"/><path d="M5 19l9-9"/>',
  lungs: '<path d="M12 4v8"/><path d="M12 10c-1 0-2 1-3 1.5-2 1-4 3-4 6.5 0 1 .8 2 2 2 2 0 5-1 5-4z"/><path d="M12 10c1 0 2 1 3 1.5 2 1 4 3 4 6.5 0 1-.8 2-2 2-2 0-5-1-5-4z"/>',
  lotus: '<path d="M12 18c-3-2-4-5-4-8 2 1 4 3 4 8z"/><path d="M12 18c3-2 4-5 4-8-2 1-4 3-4 8z"/><path d="M12 18c-1-4 0-8 0-11 0 3 1 7 0 11z"/><path d="M4 16c3 2 5 2 8 2s5 0 8-2"/>',
  shield: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  spark: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  flower: '<circle cx="12" cy="10" r="2.2"/><path d="M12 7.8C10 4 14 4 12 7.8M14.2 10c3.8-2 3.8 2 0 0M12 12.2c2 3.8-2 3.8 0 0M9.8 10C6 12 6 8 9.8 10"/><path d="M12 13v8M12 18c2-2 4-2 5-1"/>',
  foot: '<path d="M9 21c-2.5 0-3.5-2-3.5-4.5S7 11 7 8.5 8 5 10 5s2.5 2 2.5 4-1 4-1 6 1 2 1 3-1 3-3.5 3z"/><circle cx="15" cy="5" r="1.1"/><circle cx="17.2" cy="7.2" r="1"/><circle cx="18.2" cy="10" r=".9"/><circle cx="13.4" cy="3.2" r="1.2"/>',
  drop: '<path d="M12 3c3.5 4.5 6 7.6 6 10.8a6 6 0 0 1-12 0C6 10.6 8.5 7.5 12 3z"/><path d="M9.5 14.5a2.6 2.6 0 0 0 2.5 2.5"/>'
};
const icon = (k, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;
const INTRO_START = -0.15, INTRO_IN = 0.3, INTRO_RELEASE = 1.05;
function calcIntroText(sy, F, vh) {
  const d = (sy - F) / Math.max(1, vh);
  const tin = clamp((d - INTRO_START) / INTRO_IN, 0, 1);
  const lift = Math.max(0, d - INTRO_RELEASE) * vh;
  const o = (1 - Math.pow(1 - tin, 3)) * (lift > vh * 1.2 ? 0 : 1);
  return { o, tin, lift };
}
function calcProductFrame(x, y, h, ratio) {
  const w = h * ratio, padX = Math.max(18, h * 0.05), padY = Math.max(24, h * 0.09);
  const fw = w + padX * 2, fh = h + padY * 2;
  return { x: x - fw / 2, y: y - fh / 2, w: fw, h: fh, r: Math.min(fw / 2, fw * 0.3) };
}
const FRAME_FROM = 0.05, FRAME_TO = 0.13, FRAME_HOLD = 0.17, FRAME_OUT = 0.2;
function calcFrameDraw(P) {
  const counter = clamp((P - ARRIVE) / (1 - ARRIVE), 0, 1);
  const g = clamp((counter - FRAME_FROM) / (FRAME_TO - FRAME_FROM), 0, 1);
  const w = clamp((counter - FRAME_HOLD) / (FRAME_OUT - FRAME_HOLD), 0, 1);
  const sm = (t) => t * t * (3 - 2 * t);
  return sm(g) * (1 - sm(w));
}
function frameHalfPaths(box, inflate = 0) {
  const x = box.x - inflate, y = box.y - inflate, w = box.w + inflate * 2, h = box.h + inflate * 2;
  const r = Math.min(box.r + inflate, w / 2, h / 2), cx = x + w / 2, f = (n) => n.toFixed(1);
  const left = [
    "M",
    f(cx),
    f(y + h),
    "H",
    f(x + r),
    "A",
    f(r),
    f(r),
    0,
    0,
    1,
    f(x),
    f(y + h - r),
    "V",
    f(y + r),
    "A",
    f(r),
    f(r),
    0,
    0,
    1,
    f(x + r),
    f(y),
    "H",
    f(cx)
  ].join(" ");
  const right = [
    "M",
    f(cx),
    f(y + h),
    "H",
    f(x + w - r),
    "A",
    f(r),
    f(r),
    0,
    0,
    0,
    f(x + w),
    f(y + h - r),
    "V",
    f(y + r),
    "A",
    f(r),
    f(r),
    0,
    0,
    0,
    f(x + w - r),
    f(y),
    "H",
    f(cx)
  ].join(" ");
  return [left, right];
}
const FRAME_LEAVES = [0.18, 0.4, 0.62, 0.84];
function leafOpen(u, at) {
  const t = clamp((u - at) / 0.1, 0, 1), c1 = 2.2, c3 = c1 + 1;
  return t <= 0 ? 0 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
const ARRIVE = 0.12, EXIT_AT = 0.7;
function journeyProgress(scrollY2, g) {
  const { showcaseTop, pinEnd, vh } = g;
  const preRoll = g.preRoll != null ? g.preRoll : vh * 0.85;
  const curtainStart = pinEnd - vh;
  if (scrollY2 <= showcaseTop) return ARRIVE * clamp((scrollY2 - (showcaseTop - preRoll)) / Math.max(1, preRoll), 0, 1);
  if (scrollY2 <= curtainStart) return lerp(ARRIVE, EXIT_AT, clamp((scrollY2 - showcaseTop) / Math.max(1, curtainStart - showcaseTop), 0, 1));
  return lerp(EXIT_AT, 1, clamp((scrollY2 - curtainStart) / Math.max(1, vh), 0, 1));
}
function calcHoldTransform(p, start, view, mouse = { x: 0, y: 0 }, tTime = 0, isMobile = false) {
  const q = clamp(p, 0, 1);
  const sm = (t) => t * t * (3 - 2 * t);
  const lead = clamp(q / ARRIVE, 0, 1), e = sm(lead);
  const u = clamp((q - ARRIVE) / (1 - ARRIVE), 0, 1);
  const env = Math.sin(Math.PI * u);
  const x = lerp(start.x, view.x, e);
  const y = lerp(start.y, view.y, e);
  const h = lerp(start.h, view.h, e);
  const front = view.rotY != null ? view.rotY : start.rotY;
  const rotY = lerp(start.rotY, front, e) + Math.PI * 2 * 3 * u + (mouse.x || 0) * 0.3 * env + Math.sin(tTime * 0.6) * 0.02 * env;
  const rotZ = lerp(start.rotZ != null ? start.rotZ : -0.012, 0, e) + Math.sin(u * Math.PI * 4) * 0.12 * env;
  const rotX = lerp(start.rotX != null ? start.rotX : 0.04, 0.06, e) + Math.sin(u * Math.PI * 3) * 0.07 * env + (mouse.y || 0) * 0.1 * env;
  return { x, y, h, rotX, rotY, rotZ };
}
const FLOW_END = 2.6;
const DESIGN_SIZE = { gummies: [1536, 1024], inhaler: [1254, 1254], rollon: [1155, 1362], reviva: [1536, 1024], liver: [1536, 1024] };
function splitDetailWords(root) {
  const kinds = [
    [".sc-blk__h", "rise"],
    [".sc-quote", "blur"],
    [".sc-tagline", "blur"],
    [".sc-kick", "spread"],
    [".sc-list b", "slide"],
    [".sc-herb b", "slide"]
  ];
  kinds.forEach(([sel, kind]) => root.querySelectorAll(sel).forEach((el) => {
    if (el.dataset.split || el.children.length) return;
    const text = el.textContent;
    if (!text.trim()) return;
    el.dataset.split = kind;
    el.setAttribute("aria-label", text.trim());
    let n = 0;
    el.innerHTML = text.trim().split(/\s+/).map((w) => '<span class="dw" aria-hidden="true"><span class="dwi" style="--w:' + n++ + '">' + esc(w) + "</span></span>").join(" ");
  }));
}
function bigLetters(text) {
  const chars = [...String(text)], n = Math.max(1, chars.length - 1);
  return chars.map((c, i) => '<span class="bl" style="--li:' + (i / n).toFixed(3) + '">' + (c === " " ? "&nbsp;" : esc(c)) + "</span>").join("");
}
const esc = (t) => String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
function populateShowcaseDOM(container, activeIndex) {
  if (!container || activeIndex < 0 || activeIndex >= PRODUCTS.length) return;
  const product = PRODUCTS[activeIndex], story = STORY[activeIndex], D = DETAILS[product.id];
  NEEDS.find((n) => n.p === activeIndex);
  HERBS.filter((h) => h.p === activeIndex);
  const $q = (s) => container.querySelector(s);
  const letters = (t) => [...t || ""].map((ch) => `<span class="sc-ch" aria-hidden="true"><span class="sc-chi">${ch === " " ? "&nbsp;" : ch}</span></span>`).join("");
  const lineA = $q("#scHeadA"), lineB = $q("#scHeadB"), head = $q("#scHead");
  const hasD = !!D, nameWords = product.name.split(" "), tl = hasD && story ? story.t : [nameWords[0], nameWords.slice(1).join(" ")];
  if (lineA) lineA.innerHTML = letters(tl[0]);
  if (lineB) lineB.innerHTML = letters(tl[1]);
  if (head) head.setAttribute("aria-label", tl.join(" "));
  if (story) container.style.setProperty("--sc-tint", story.c);
  const ico = $q("#scIco");
  if (ico && story) ico.innerHTML = icon(hasD ? story.ic : "leaf");
  const kick = $q("#scKick");
  if (kick) kick.textContent = `${product.no} · ${product.name}`;
  const no = $q("#scNo");
  if (no) no.textContent = product.no;
  const desc = $q("#scDesc");
  if (desc) desc.innerHTML = hasD && story ? `${icon("spark", "sc-i")}<span>${esc(story.d)}</span>` : "";
  const leadKick = $q("#scLeadKick");
  if (leadKick) leadKick.textContent = D ? D.eyebrow : "";
  const leadTag = $q("#scLeadTag");
  if (leadTag) leadTag.textContent = D ? D.tagline : "";
  const leadHead = $q("#scLeadHead");
  if (leadHead) leadHead.textContent = D ? D.title : product.name;
  const leadDesc = $q("#scLeadDesc");
  if (leadDesc) leadDesc.textContent = D ? D.intro[0] : "";
  const layer = $q("#scStickers");
  if (layer) layer.innerHTML = "";
  const pb = $q("#scPinBadges");
  if (pb) pb.innerHTML = "";
  buildDetails(container, product, D, story);
  const hl = $q("#scHl");
  if (hl) {
    const pts = D && D.highlights ? D.highlights : [];
    const half = Math.ceil(pts.length / 2);
    const words = (txt, from, total) => txt.split(/\s+/).map((w, k) => '<span class="hw"><span class="hwi" style="--wn:' + ((from + k) / Math.max(1, total - 1)).toFixed(3) + '">' + esc(w) + "</span></span>").join(" ");
    const col = (list) => list.map(([t, d]) => {
      const tw = t.split(/\s+/).length, total = tw + (d ? d.split(/\s+/).length : 0);
      return `<div class="sc-hl__item" aria-label="${esc(t + (d ? ". " + d : ""))}"><b aria-hidden="true">${words(t, 0, total)}</b>${d ? `<span aria-hidden="true">${words(d, tw, total)}</span>` : ""}</div>`;
    }).join("");
    hl.setAttribute("aria-label", D && D.highlightsTitle ? D.highlightsTitle : product.name);
    hl.innerHTML = `<div class="sc-hl__col sc-hl__col--l">${col(pts.slice(0, half))}</div><div class="sc-hl__col sc-hl__col--r">${col(pts.slice(half))}</div>`;
  }
  placeBadges(container);
  container.querySelectorAll(".sc-photo img").forEach((img) => {
    if (!img.complete) img.addEventListener("load", () => placeBadges(container), { once: true });
  });
  const arcs = [...container.querySelectorAll(".sc-arcs path")].map((path) => ({ path, len: path.getTotalLength() }));
  container._sc = {
    chars: [...container.querySelectorAll(".sc-chi")],
    badges: [...container.querySelectorAll(".sc-badge")],
    blocks: [...container.querySelectorAll(".sc-blk")],
    bigs: [...container.querySelectorAll(".sc-big")],
    arcs,
    fill: $q("#scProgFill"),
    num: $q("#scProgNum"),
    label: $q("#scProgLabel"),
    labelText: `${product.no} / ${String(PRODUCTS.length).padStart(2, "0")}`,
    labelSet: false
  };
}
function buildDetails(container, product, D, story) {
  const root = container.querySelector(".sc-chs"), blocksEl = container.querySelector(".sc-blocks");
  if (!root || !blocksEl) return;
  const small = innerWidth < 768, hasD = !!D;
  const li = (items) => '<ul class="sc-list">' + items.map(([t, d], i) => '<li style="--i:' + i + '"><b>' + esc(t) + "</b>" + (d ? "<span>" + esc(d) + "</span>" : "") + "</li>").join("") + "</ul>";
  const list = hasD && D.list && D.list.length ? D.list.slice(0, 8) : [];
  const listHtml = (items, k) => (k === 0 ? '<p class="sc-kick">' + esc(D.listTitle || "") + "</p>" : "") + li(items);
  const maxH = innerHeight * (small ? 0.62 : 0.66);
  const measure = (html) => {
    root.innerHTML = '<div class="sc-slot sc-slot--l sc-slot--measure"><div class="sc-c sc-c--list">' + html + "</div></div>";
    return root.firstChild.firstChild.offsetHeight;
  };
  const chunk = (n) => {
    const out = [];
    for (let k = 0; k < list.length; k += n) out.push(list.slice(k, k + n));
    return out;
  };
  let chunks = chunk(4);
  if (list.length) for (let size = 4; size >= 2; size--) {
    chunks = chunk(size);
    if (chunks.every((c, k) => measure(listHtml(c, k)) <= maxH)) break;
  }
  root.innerHTML = "";
  const ledeHtml = hasD && D.intro[1] ? '<p class="sc-lede">' + esc(D.intro[1]) + "</p>" : "";
  const closingHtml = hasD && D.closing ? '<h4 class="sc-blk__h">' + esc(D.closingTitle) + "</h4><p>" + esc(D.closing) + "</p>" : "";
  const buyHtml = (hasD ? '<p class="sc-kick">' + esc(product.tag) + "</p>" : "") + '<p class="sc-price" data-v="' + product.price + '">' + inr(product.price) + '</p><p class="sc-size">' + esc(product.size) + '</p><button class="pill mini-add" type="button" data-id="' + product.id + '"><i aria-hidden="true">+</i><b>Add to bag</b></button>';
  const frames = [], Lq = chunks.map((c, k) => ["sc-c--list", listHtml(c, k)]);
  const Rq = [ledeHtml && ["sc-c--lede", ledeHtml], closingHtml && ["sc-c--closing", closingHtml]].filter(Boolean);
  if (Lq.length) {
    Lq.forEach((item) => frames.push({ l: [item], r: Rq.length ? [Rq.shift()] : [] }));
    while (Rq.length) frames.push({ l: [Rq.shift()], r: [] });
  } else while (Rq.length) frames.push({ l: [Rq.shift()], r: Rq.length ? [Rq.shift()] : [] });
  const lastF = frames[frames.length - 1];
  if (lastF && !lastF.r.length) lastF.r = [["sc-c--buy", buyHtml]];
  else frames.push({ l: [], r: [["sc-c--buy", buyHtml]] });
  const nF = frames.length;
  container._frames = nF;
  const B = [], add = (st, side, cls, html) => {
    if (html) B.push('<div class="sc-blk sc-blk--' + side + " " + cls + '" data-st="' + st + '">' + html + "</div>");
  };
  const bigName = (st, text, cls) => B.push('<p class="sc-big ' + cls + '" data-st="' + st + '" aria-hidden="true">' + bigLetters(text) + "</p>");
  bigName(0, hasD && story ? story.t.join(" ") : product.name, "");
  add(0, "r", "sc-blk--photo sc-m-hide", SHOTS[product.id] ? '<figure class="sc-photo"><img src="' + SHOTS[product.id] + '" alt="' + esc(product.name) + '" width="960" height="960" loading="lazy" decoding="async"><figcaption>' + esc(product.short) + " · " + esc(product.size) + "</figcaption></figure>" : "");
  const sz = DESIGN_SIZE[product.id] || [1536, 1024], mid = Math.min(1, nF);
  add(mid, "l", "sc-blk--photo sc-m-hide", DESIGNS[product.id] ? '<figure class="sc-photo sc-photo--wide"><img src="' + DESIGNS[product.id] + '" alt="' + esc(product.name) + ' design" width="' + sz[0] + '" height="' + sz[1] + '" loading="lazy" decoding="async"></figure>' : "");
  bigName(mid, product.short, "sc-big--2");
  if (hasD && D.note) add(nF, "l", "sc-blk--fine", "<p>" + esc(D.note) + "</p>");
  frames.forEach((f, k) => {
    ["l", "r"].forEach((side) => {
      const arr = small ? side === "l" ? f.l.concat(f.r) : [] : f[side];
      if (arr.length) B.push('<div class="sc-slot sc-slot--' + side + '" data-fr="' + k + '">' + arr.map(([cls, html]) => '<div class="sc-c ' + cls + '">' + html + "</div>").join("") + "</div>");
    });
  });
  blocksEl.innerHTML = B.join("");
  splitDetailWords(blocksEl);
  container._frameCards = frames.map((f, k) => [...blocksEl.querySelectorAll('.sc-slot[data-fr="' + k + '"] .sc-c')]);
  container._frameSlots = frames.map((f, k) => [...blocksEl.querySelectorAll('.sc-slot[data-fr="' + k + '"]')]);
}
function planBeats(naturals, V, r0, A) {
  const n = naturals.length, nh = Math.max(0, n - 1), N = naturals.reduce((s, x) => s + x, 0);
  let Lh = clamp((A - N) / Math.max(1, nh), 0.45 * V, 0.7 * V);
  const a = N > 0 ? clamp((A - nh * Lh) / N, 0.45, 1.7) : 1;
  Lh = clamp((A - a * N) / Math.max(1, nh), 0.4 * V, 0.9 * V);
  const stretches = [], holds = [];
  let cur = r0, E = 0;
  naturals.forEach((Lf, k) => {
    stretches.push({ start: cur, end: cur + a * Lf, E, Lf });
    cur += a * Lf;
    E += Lf;
    if (k < n - 1) {
      holds.push({ start: cur, end: cur + Lh });
      cur += Lh;
    }
  });
  return { r0, a, Lh, stretches, holds, hlFrom: cur, Etot: E };
}
function walkAt(r, b) {
  if (!b || r < b.r0) return { e: 0, hold: -1, u: 0 };
  for (let k = 0; k < b.stretches.length; k++) {
    const s = b.stretches[k], h = b.holds[k];
    if (r < s.end) return { e: s.E + (r - s.start) / b.a, hold: -1, u: 0 };
    if (h && r < h.end) return { e: s.E + s.Lf, hold: k, u: (r - h.start) / Math.max(1, h.end - h.start) };
  }
  return { e: b.Etot, hold: -1, u: 0 };
}
function layoutBeats(container) {
  const flow = container.querySelector(".sc-flow"), nF = container._frames;
  if (!flow || !nF) return;
  const V = innerHeight, H = container.offsetHeight;
  if (!H) return;
  const small = innerWidth < 768, F = (document.getElementById("home") || {}).offsetHeight || V;
  const gap = Math.max(34, V * 0.045), cy = V * (small ? 0.55 : 0.52);
  const groups = Array.from({ length: nF + 1 }, () => []), slots = Array.from({ length: nF }, () => []);
  flow.querySelectorAll(".sc-blk, .sc-big").forEach((el) => {
    if (getComputedStyle(el).display !== "none") groups[Math.min(nF, +el.dataset.st || 0)].push(el);
  });
  flow.querySelectorAll(".sc-slot").forEach((s) => slots[+s.dataset.fr].push(s));
  const stack = (els, y0) => {
    const bottom = { l: y0 - gap, r: y0 - gap };
    els.forEach((el) => {
      if (el.classList.contains("sc-big")) {
        const top2 = Math.max(bottom.l, bottom.r) + gap, h = el.offsetHeight * 0.8;
        el.style.top = top2.toFixed(0) + "px";
        bottom.l = bottom.r = top2 + h;
        return;
      }
      const side = small ? "l" : el.classList.contains("sc-blk--r") ? "r" : "l", top = bottom[side] + gap;
      el.style.top = top.toFixed(0) + "px";
      bottom[side] = top + el.offsetHeight;
    });
    return Math.max(bottom.l, bottom.r);
  };
  const stops = [];
  let cursor = V * 1.2;
  for (let g = 0; g <= nF; g++) {
    if (groups[g].length) cursor = stack(groups[g], cursor) + gap;
    if (g < nF) {
      const h = Math.max(0, ...slots[g].map((s) => s.offsetHeight)), yc = cursor + h / 2;
      slots[g].forEach((s) => {
        s.style.top = yc.toFixed(0) + "px";
      });
      stops.push(yc - cy);
      cursor += h + gap;
    }
  }
  const Etot = cursor - gap;
  const naturals = [];
  let prev = 0;
  stops.forEach((e) => {
    naturals.push(e - prev);
    prev = e;
  });
  naturals.push(Math.max(V * 0.4, Etot - prev));
  const r0 = F + 1.05 * V, A = H - 2 * V - r0 - 1 * V;
  container._beats = planBeats(naturals, V, r0, A);
}
function placeBadges(container) {
  layoutBeats(container);
}
let badgeResize = 0;
if (typeof window !== "undefined") window.addEventListener("resize", () => {
  clearTimeout(badgeResize);
  badgeResize = setTimeout(() => {
    const c = document.getElementById("showcase");
    if (c && c._sc) placeBadges(c);
  }, 120);
});
const BADGE_TILT = [-9, 7, -4];
const easeOut3 = (t) => 1 - Math.pow(1 - t, 3);
const put = (el, prop, val) => {
  const k = "_" + prop;
  if (el[k] !== val) {
    el[k] = val;
    el.style[prop] = val;
  }
};
const putVar = (el, name, val) => {
  const k = "_v" + name;
  if (el[k] !== val) {
    el[k] = val;
    el.style.setProperty(name, val);
  }
};
const onScreen = (r, vh, span = 0.35) => clamp((vh * 0.95 - r.top) / (vh * span), 0, 1);
function updateShowcaseDOM(container, p, tTime = 0) {
  const s = container && container._sc;
  if (!s) return;
  const vh = innerHeight;
  const badgeR = s.badges.map((el) => el.getBoundingClientRect());
  const blockR = s.blocks.map((el) => el.classList.contains("sc-blk--lead") ? null : el.getBoundingClientRect());
  const bigR = s.bigs.map((el) => el.getBoundingClientRect());
  s.badges.forEach((el, k) => {
    const r = badgeR[k];
    if (r.bottom < -40 || r.top > vh + 40) return;
    const t = onScreen(r, vh, 0.3), e = t < 1 ? easeOut3(t) * (t < 0.8 ? 1.12 : 1) : 1;
    put(el, "transform", `rotate(${(BADGE_TILT[k] * (1 + (1 - t) * 4)).toFixed(1)}deg) scale(${e.toFixed(3)})`);
  });
  s.blocks.forEach((el, bi) => {
    if (el.classList.contains("sc-blk--lead")) return;
    const r = blockR[bi];
    if (r.bottom < -60 || r.top > vh + 60) return;
    const raw = onScreen(r, vh, 0.32), t = easeOut3(raw);
    const photo = el.classList.contains("sc-blk--photo");
    put(el, "opacity", photo ? "1" : t.toFixed(2));
    put(el, "transform", `translate3d(0, ${((1 - t) * (photo ? 60 : 40)).toFixed(0)}px, 0)`);
    if (photo) {
      putVar(el, "--rv", easeOut3(clamp(raw * 1.25, 0, 1)).toFixed(2));
      putVar(el, "--py", clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1).toFixed(2));
    }
    const on = t > 0.15;
    if (el.classList.contains("in") !== on) el.classList.toggle("in", on);
  });
  s.ribbons = s.ribbons || [...container.querySelectorAll(".sc-ribbons path")].map((path) => ({ path, len: path.getTotalLength() }));
  const bt = container._beats, ru = bt ? clamp(((container._r || 0) - bt.r0) / Math.max(1, bt.hlFrom - bt.r0), 0, 1) : clamp((p - 0.2) / 0.38, 0, 1);
  s.ribbons.forEach((a, k) => {
    const st = k * 0.3, hd = clamp((ru - st) / 0.26, 0, 1), tl = clamp((ru - st - 0.2) / 0.26, 0, 1);
    put(a.path, "strokeDasharray", ((hd - tl) * a.len).toFixed(0) + " " + a.len.toFixed(0));
    put(a.path, "strokeDashoffset", (-tl * a.len).toFixed(0));
  });
  const bt2 = container._beats, sp = bt2 ? clamp(((container._r || 0) - bt2.r0) / Math.max(1, bt2.hlFrom - bt2.r0), 0, 1) : 0;
  s.bigs.forEach((el, k) => {
    const r = bigR[k];
    if (r.bottom < -40 || r.top > vh + 40) return;
    putVar(el, "--be", clamp((vh * 1.02 - r.top) / (vh * 0.62), 0, 1).toFixed(2));
    put(el, "transform", "translate3d(" + ((sp - 0.5) * 0.12 * innerWidth * (k ? -1 : 1)).toFixed(0) + "px, 0, 0)");
  });
  const enterT = clamp((p - ARRIVE) / 0.04, 0, 1);
  s.prog = s.prog || container.querySelector(".sc-progress");
  if (s.prog) {
    put(s.prog, "opacity", enterT.toFixed(2));
    put(s.prog, "visibility", enterT > 5e-3 ? "visible" : "hidden");
  }
  const along = enterT > 0 ? clamp((p - ARRIVE) / (1 - ARRIVE), 0, 1) : 0;
  s.arcs.forEach((a, k) => {
    const hd = along > 0 ? clamp(along * 1.15 - k * 0.04, 0, 1) : 0;
    put(a.path, "strokeDasharray", `${(hd * a.len).toFixed(0)} ${a.len.toFixed(0)}`);
  });
  if (s.label && !s.labelSet) {
    s.label.textContent = s.labelText;
    s.labelSet = true;
  }
  const progP = clamp((p - ARRIVE) / (1 - ARRIVE), 0, 1);
  if (s.fill) put(s.fill, "transform", `scaleX(${progP.toFixed(3)})`);
  if (s.num) {
    const t = String(Math.min(100, Math.max(0, Math.round(progP * 100)))).padStart(3, "0");
    if (s.num._t !== t) {
      s.num._t = t;
      s.num.textContent = t;
    }
  }
}
function createShowcaseDecor(L) {
  const decorGroup = new Group();
  decorGroup.visible = false;
  L.scene.add(decorGroup);
  const berryGeo = berryGeometry(0.18, 1.2);
  const berryMat = gummyMaterial();
  const gummyColors = PRODUCTS[0].gummy;
  [0, 1, 2, 3].map((k) => {
    const m = new Mesh(berryGeo, berryMat.clone());
    m.material.color.set(gummyColors[k % gummyColors.length]).convertSRGBToLinear();
    decorGroup.add(m);
    return m;
  });
  const leafColors = ["#5d9a44", "#6fa84f", "#4f8a3c", "#7cb858"];
  leafColors.map((col) => {
    const m = studioLeaf(col);
    decorGroup.add(m);
    return m;
  });
  function update(p, activeIndex, centerX, centerY, centerH, tTime, isMobile) {
    {
      decorGroup.visible = false;
      return;
    }
  }
  return { group: decorGroup, update };
}
function calcHlCallout(r, H, vh, flowBottom) {
  const leaveAt = H - 2 * vh;
  const fb = Number.isFinite(flowBottom) ? flowBottom : H - (FLOW_END - 0.3) * vh;
  const start = Math.min(fb - 0.25 * vh, leaveAt - 0.6 * vh);
  const draw = clamp((r - start) / (0.35 * vh), 0, 1);
  const lines = clamp((r - start - 0.18 * vh) / (0.2 * vh), 0, 1);
  const ex = clamp((r - (leaveAt - 0.12 * vh)) / (0.3 * vh), 0, 1);
  return { o: draw > 0 && ex < 1 ? 1 : 0, draw, lines, ex, y: 0 };
}
const entranceOrder = (i, first, n) => ((i - first) % n + n) % n;
function highlightIndex(p, n, first = 0, lead = 0.05) {
  const q = clamp((p - lead) / (1 - lead), 0, 0.999999);
  return (first + Math.floor(q * n)) % n;
}
const ART = [
  ["a", '<path d="M20 168c10-46 40-82 92-104M20 168c40-6 78-34 92-104-40 4-76 30-92 104z"/><path d="M52 134l22-6M70 108l22-4M44 148l-4-22"/>'],
  ["b", '<path d="M100 188V70M100 120c-26-6-40-26-40-50 26 4 40 22 40 50zM100 96c24-6 38-24 38-48-24 4-38 22-38 48zM100 150c-22-4-34-20-34-40 22 4 34 18 34 40z"/>'],
  ["c", '<path d="M30 160C40 100 80 52 160 40c-6 70-48 118-130 120z"/><path d="M30 160c34-36 66-68 108-98"/>'],
  ["d", '<path d="M100 30c26 26 26 66 0 96-26-30-26-70 0-96zM100 126v62M100 150c-16-4-26-14-30-28M100 164c14-4 24-12 28-26"/>']
];
const ART_HTML = ART.map(([k, d]) => '<span class="lu-art lu-art--' + k + '" aria-hidden="true"><svg viewBox="0 0 200 200">' + d + "</svg></span>").join("");
function offsetWithin(el, anc) {
  let x = 0, y = 0, n = el;
  while (n && n !== anc) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent;
  }
  return { x, y };
}
function initProductJourney() {
  const flightCanvas = $("#flightCanvas");
  const lineupSec = $("#lineup");
  const showcaseSec = $("#showcase");
  const flowEl = showcaseSec ? showcaseSec.querySelector(".sc-flow") : null;
  const progEl = showcaseSec ? showcaseSec.querySelector(".sc-progress") : null;
  const introCard = showcaseSec ? showcaseSec.querySelector("#scCard") : null;
  const introLead = showcaseSec ? showcaseSec.querySelector("#scLead") : null;
  const pinEl = $("#lineupPin");
  const stmEl = $("#statement");
  if (!flightCanvas || !lineupSec || !pinEl || !ScrollTrigger) return null;
  const L = jarLayer(flightCanvas);
  const flightJars = PRODUCTS.map((p, i) => L.jar(p, i));
  const ratios = flightJars.map((j) => {
    j.G.updateMatrixWorld(true);
    const s = new Box3().setFromObject(j.b).getSize(new Vector3());
    return Math.max(s.x, s.z) / Math.max(1e-6, s.y);
  });
  function makeOutline(frameSvg) {
    const SVGNS = "http://www.w3.org/2000/svg";
    const LEAF_D = "M0 0C5-7 15-8 22 0C15 8 5 7 0 0Z";
    const svgEl = (tag, cls, parent) => {
      const e = document.createElementNS(SVGNS, tag);
      if (cls) e.setAttribute("class", cls);
      parent.appendChild(e);
      return e;
    };
    let frameParts = null, frameKey = "", frameBoxKey = "";
    if (frameSvg) {
      frameSvg.textContent = "";
      const outer = svgEl("g", "sc-frame__outer", frameSvg), main = svgEl("g", "sc-frame__main", frameSvg), leaves = svgEl("g", "sc-frame__leaves", frameSvg);
      const mk = (g) => [0, 1].map(() => {
        const p = svgEl("path", null, g);
        p.setAttribute("pathLength", "1");
        return p;
      });
      frameParts = {
        outer: mk(outer),
        main: mk(main),
        leaves: [0, 1].flatMap((side) => FRAME_LEAVES.map((at, k) => {
          const g = svgEl("g", "sc-frame__leaf", leaves);
          const p = svgEl("path", null, g);
          p.setAttribute("d", LEAF_D);
          const vein = svgEl("path", "sc-frame__vein", g);
          vein.setAttribute("d", "M1 0H19");
          return { g, side, at, out: (k + side) % 2 === 0 };
        })),
        ring: svgEl("circle", "sc-frame__ring", frameSvg),
        bud: svgEl("circle", "sc-frame__bud", frameSvg),
        top: { x: 0, y: 0 }
      };
    }
    function setFrame2(box, u) {
      if (!frameParts) return;
      if (!box || u <= 1e-3) {
        if (frameKey !== "off") {
          frameKey = "off";
          frameSvg.style.visibility = "hidden";
        }
        return;
      }
      const bk = [box.x, box.y, box.w, box.h].map((v) => v.toFixed(1)).join("|");
      if (bk !== frameBoxKey) {
        frameBoxKey = bk;
        const [l, r] = frameHalfPaths(box), [ol, or] = frameHalfPaths(box, 7);
        frameParts.main[0].setAttribute("d", l);
        frameParts.main[1].setAttribute("d", r);
        frameParts.outer[0].setAttribute("d", ol);
        frameParts.outer[1].setAttribute("d", or);
        frameParts.leaves.forEach((lf) => {
          const path = frameParts.main[lf.side], len = path.getTotalLength(), at = len * lf.at;
          const p = path.getPointAtLength(at), q = path.getPointAtLength(Math.min(len, at + 1));
          let ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
          const outwards = lf.side === 0 ? -1 : 1;
          lf.base = `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(ang + (lf.out ? -38 : 38) * outwards).toFixed(1)})`;
        });
        frameParts.top = { x: box.x + box.w / 2, y: box.y };
        frameParts.bud.setAttribute("cx", frameParts.top.x.toFixed(1));
        frameParts.bud.setAttribute("cy", frameParts.top.y.toFixed(1));
        frameParts.ring.setAttribute("cx", frameParts.top.x.toFixed(1));
        frameParts.ring.setAttribute("cy", frameParts.top.y.toFixed(1));
      }
      const key = bk + "|" + u.toFixed(4);
      if (key === frameKey) return;
      frameKey = key;
      frameSvg.style.visibility = "visible";
      const u2 = clamp((u - 0.12) / 0.88, 0, 1);
      frameParts.main.forEach((p) => {
        p.style.strokeDashoffset = (1 - u).toFixed(4);
      });
      frameParts.outer.forEach((p) => {
        p.style.strokeDashoffset = (1 - u2).toFixed(4);
      });
      frameParts.leaves.forEach((lf) => {
        const s = leafOpen(u, lf.at);
        lf.g.setAttribute("transform", `${lf.base} scale(${Math.max(0, s).toFixed(3)})`);
      });
      const b = clamp((u - 0.94) / 0.06, 0, 1), rip = clamp((u - 0.9) / 0.1, 0, 1);
      frameParts.bud.setAttribute("r", (6 * leafOpen(b, 0)).toFixed(2));
      frameParts.ring.setAttribute("r", (6 + 26 * rip).toFixed(1));
      frameParts.ring.style.opacity = (rip > 0 && rip < 1 ? (1 - rip) * 0.7 : 0).toFixed(3);
    }
    return setFrame2;
  }
  const setFrame = makeOutline(showcaseSec ? showcaseSec.querySelector("#scFrame") : null);
  function makeCallout(pin) {
    if (!pin) return () => {
    };
    const hl = pin.querySelector(".sc-hl");
    const SVGNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "sc-callout");
    svg.setAttribute("aria-hidden", "true");
    const mk = (cls) => {
      const p = document.createElementNS(SVGNS, "path");
      p.setAttribute("class", cls);
      p.setAttribute("pathLength", "1");
      svg.appendChild(p);
      return p;
    };
    const brL = mk("sc-callout__br"), brR = mk("sc-callout__br");
    let lines = [], items = [];
    pin.insertBefore(svg, pin.firstChild);
    let key = "", lastO = -1, lastD = -1, lastL = -1, lastY = NaN, filled = null;
    let lastEx = -1;
    return function setCallout2(box, o, draw, lineDraw = 0, y = 0, ex = 0) {
      const on = !!box && o > 3e-3 && !!hl && hl.children.length > 0;
      svg.style.visibility = on ? "visible" : "hidden";
      if (hl) hl.style.visibility = on ? "visible" : "hidden";
      if (!on) {
        lastO = -1;
        lastY = NaN;
        lastEx = -1;
        return;
      }
      const m = Math.max(10, box.h * 0.04);
      const l = box.x - m, r = box.x + box.w + m, t = box.y - m, b = box.y + box.h + m, cy = (t + b) / 2;
      const gap = geo.mobile ? 30 : Math.max(56, Math.min(120, geo.vw * 0.07));
      const sc = pin.closest(".showcase"), ver = sc && sc._sc;
      const k = [l, r, t, b, gap, geo.vw, geo.vh].map((v) => Math.round(v)).join(",");
      if (k !== key || ver !== filled) {
        key = k;
        filled = ver;
        pin.style.setProperty("--co-l", l.toFixed(0) + "px");
        pin.style.setProperty("--co-r", r.toFixed(0) + "px");
        pin.style.setProperty("--co-cy", cy.toFixed(0) + "px");
        pin.style.setProperty("--co-gap", gap.toFixed(0) + "px");
        const arm = Math.max(16, Math.min(44, (r - l) * 0.2));
        brL.setAttribute("d", "M" + (l + arm) + " " + t + "H" + l + "V" + b + "H" + (l + arm));
        brR.setAttribute("d", "M" + (r - arm) + " " + t + "H" + r + "V" + b + "H" + (r - arm));
        lines.forEach((p) => p.remove());
        lines = [];
        items = [...hl.querySelectorAll(".sc-hl__item")];
        hl.style.transform = "";
        lastY = NaN;
        const pr = pin.getBoundingClientRect(), mid = (l + r) / 2;
        items.forEach((it) => {
          const q = it.getBoundingClientRect(), left = q.left + q.width / 2 < mid;
          const y1 = q.top - pr.top + Math.min(q.height / 2, 14), y2 = Math.max(t + arm, Math.min(b - arm, y1));
          const x1 = left ? q.right - pr.left + 12 : q.left - pr.left - 12, x2 = left ? l - 8 : r + 8;
          const p = mk("sc-callout__ln");
          p.setAttribute("d", "M" + x2.toFixed(1) + " " + y2.toFixed(1) + "L" + x1.toFixed(1) + " " + y1.toFixed(1));
          lines.push(p);
        });
        lastD = -1;
        lastL = -1;
        lastEx = -1;
      }
      if (y !== lastY) {
        lastY = y;
        hl.style.transform = y ? "translate3d(0," + y.toFixed(1) + "px,0)" : "";
        svg.style.transform = y < 0 ? "translate3d(0," + y.toFixed(1) + "px,0)" : "";
      }
      if (Math.abs(o - lastO) > 2e-3) {
        lastO = o;
        svg.style.opacity = o.toFixed(3);
      }
      const d = Math.max(0, Math.min(1, draw)), e = Math.max(0, Math.min(1, ex));
      if (Math.abs(d - lastD) > 2e-3 || Math.abs(e - lastEx) > 2e-3) {
        lastD = d;
        lastEx = e;
        const db = Math.max(1 - Math.min(1, d / 0.7), Math.max(0, Math.min(1, e * 1.4 - 0.4)));
        brL.style.strokeDashoffset = brR.style.strokeDashoffset = db.toFixed(3);
        const n = Math.max(1, items.length);
        items.forEach((it, i) => {
          const sh = Math.max(0, Math.min(1, (d - 0.15 - i * (0.35 / n)) / 0.5)), xo = Math.max(0, Math.min(1, (e - i * (0.3 / n)) / 0.6));
          it.style.setProperty("--sh", sh.toFixed(3));
          it.style.setProperty("--ex", xo.toFixed(3));
        });
        lastL = -1;
      }
      const ld = Math.max(0, Math.min(1, lineDraw));
      if (Math.abs(ld - lastL) > 2e-3) {
        lastL = ld;
        lines.forEach((p, i) => {
          const u = Math.max(0, Math.min(1, (ld - i * 0.06) / 0.7));
          p.style.strokeDashoffset = Math.max(1 - u, Math.min(1, e * 2)).toFixed(3);
        });
      }
    };
  }
  const setCallout = makeCallout(showcaseSec ? showcaseSec.querySelector(".showcase-pin") : null);
  function makeBadges(pin) {
    pin && pin.querySelector(".sc-pbadges");
    pin && pin.closest(".showcase");
    return () => {
    };
  }
  makeBadges(showcaseSec ? showcaseSec.querySelector(".showcase-pin") : null);
  function makeChapters(pin) {
    const sc = pin && pin.closest(".showcase");
    if (!sc) return () => {
    };
    const blocks = sc.querySelector(".sc-blocks");
    let key = "", lastE = NaN;
    return function setChapters2(box, r, H, k) {
      if (box) {
        const m = Math.max(10, box.h * 0.04), l = box.x - m, rr = box.x + box.w + m, cy = box.y + box.h / 2;
        const gap = geo.mobile ? 24 : Math.max(48, Math.min(96, geo.vw * 0.055));
        const kk = [l, rr, cy, gap].map(Math.round).join(",");
        if (kk !== key) {
          key = kk;
          sc.style.setProperty("--pl", Math.round(box.x) + "px");
          sc.style.setProperty("--pr", Math.round(box.x + box.w) + "px");
          [pin, sc].forEach((el) => {
            el.style.setProperty("--co-l", l.toFixed(0) + "px");
            el.style.setProperty("--co-r", rr.toFixed(0) + "px");
            el.style.setProperty("--co-cy", cy.toFixed(0) + "px");
            el.style.setProperty("--ch-gap", gap.toFixed(0) + "px");
          });
        }
      }
      const b = sc._beats, w = walkAt(box ? r : 0, b);
      sc._e = w.e;
      sc._r = box ? r : 0;
      if (blocks && w.e !== lastE) {
        lastE = w.e;
        blocks.style.transform = "translate3d(0," + (-w.e).toFixed(1) + "px,0)";
      }
      if (!b || !sc._frameCards) return;
      sc._frameCards.forEach((cards, f) => {
        const h = b.holds[f];
        if (!h) return;
        const len = h.end - h.start;
        cards.forEach((el, j) => {
          const on = !!box && k > 0 && r >= h.start + (0.05 + j * 0.28) * len;
          if (el.classList.contains("in") !== on) el.classList.toggle("in", on);
        });
        const drift = "translate3d(0," + ((0.5 - (box ? clamp((r - h.start) / len, 0, 1) : 0)) * 30).toFixed(1) + "px,0)";
        (sc._frameSlots[f] || []).forEach((sl) => {
          if (sl._dr !== drift) {
            sl._dr = drift;
            sl.style.transform = drift;
          }
        });
        const price = cards.map((c) => c.querySelector(".sc-price[data-v]")).find(Boolean);
        if (price) {
          const u = box ? clamp((r - h.start) / len, 0, 1) : 0, txt = "₹" + Math.round(+price.dataset.v * clamp((u - 0.1) / 0.3, 0, 1)).toLocaleString("en-IN");
          if (price.textContent !== txt) price.textContent = txt;
        }
      });
    };
  }
  const setChapters = makeChapters(showcaseSec ? showcaseSec.querySelector(".showcase-pin") : null);
  flightJars.forEach((j) => {
    j.G.visible = false;
  });
  const decor = createShowcaseDecor(L);
  L.warm();
  const N = PRODUCTS.length;
  const cardEls = PRODUCTS.map((p) => document.querySelector(`.lineup-card[data-product="${p.id}"]`));
  const slotEls = PRODUCTS.map((p) => document.querySelector(`.lineup-slot[data-slot="${p.id}"]`));
  const itemEls = PRODUCTS.map((p) => document.querySelector(`.lineup-item[data-product="${p.id}"]`));
  const shadowEls = slotEls.map((s) => s && s.querySelector(".lineup-shadow"));
  cardEls.forEach((card, i) => {
    if (card && STORY[i]) card.style.setProperty("--c", STORY[i].c);
  });
  slotEls.forEach((s) => {
    if (s && !s.querySelector(".lu-art")) s.insertAdjacentHTML("afterbegin", ART_HTML);
  });
  itemEls.forEach((btn, i) => {
    const n = btn && btn.querySelector(".lineup-name");
    if (!n || n.dataset.rolled) return;
    const name = n.textContent.trim();
    let k = 0;
    n.dataset.rolled = "1";
    n.innerHTML = '<span class="sr">' + name + '</span><span aria-hidden="true">' + name.split(/(\s+)/).map((w) => /^\s+$/.test(w) ? " " : '<span class="lu-w">' + [...w].map((ch) => '<span class="lu-ch" style="--i:' + k++ + '">' + ch + "</span>").join("") + "</span>").join("") + "</span>";
  });
  cardEls.forEach((card, i) => {
    if (card) card.style.setProperty("--c-deep", "color-mix(in srgb, " + STORY[i].c + " 70%, #1d4424)");
  });
  const geo = { vh: innerHeight, vw: innerWidth, showcaseTop: 0, pinEnd: 0, slots: [], mobile: innerWidth < 768, pinned: false };
  const docTop = (el) => {
    let y = 0, n = el;
    while (n) {
      y += n.offsetTop;
      n = n.offsetParent;
    }
    return y;
  };
  function measure() {
    L.resize();
    geo.vh = innerHeight;
    geo.vw = innerWidth;
    geo.mobile = innerWidth < 768;
    geo.pinEnd = stmEl ? docTop(stmEl) : geo.vh * 6;
    geo.fadeLen = Math.max(1, geo.vh);
    geo.secTop = showcaseSec ? docTop(showcaseSec) : -geo.fadeLen;
    geo.showcaseTop = geo.secTop + geo.fadeLen;
    geo.preRoll = geo.fadeLen;
    geo.secH = showcaseSec ? showcaseSec.offsetHeight : 0;
    geo.lineupTop = docTop(lineupSec);
    geo.lineupH = lineupSec.offsetHeight;
    geo.pinTop = docTop(pinEl);
    {
      let x = 0, n = pinEl;
      while (n) {
        x += n.offsetLeft;
        n = n.offsetParent;
      }
      geo.pinLeft = x;
    }
    geo.slots = slotEls.map((slot) => {
      if (!slot) return { ox: 0, oy: 0, w: 160, h: 220 };
      const o = offsetWithin(slot, pinEl);
      return { ox: o.x, oy: o.y, w: slot.offsetWidth, h: slot.offsetHeight };
    });
    if (showcaseSec) placeBadges(showcaseSec);
  }
  if (showcaseSec) populateShowcaseDOM(showcaseSec, 0);
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  ScrollTrigger.addEventListener("refreshInit", measure);
  if ("ResizeObserver" in window) {
    let t;
    new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(measure, 100);
    }).observe(document.querySelector("main"));
  }
  let hovered = -1;
  cardEls.forEach((card, i) => {
    if (!card) return;
    card.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") hovered = i;
    });
    card.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "mouse" && hovered === i) hovered = -1;
    });
    card.addEventListener("focusin", () => {
      hovered = i;
    });
    card.addEventListener("focusout", () => {
      if (hovered === i) hovered = -1;
    });
  });
  itemEls.forEach((btn, i) => {
    if (btn) btn.addEventListener("click", () => window.dispatchEvent(new CustomEvent("tl:showcase", { detail: { index: i, id: PRODUCTS[i].id } })));
  });
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.tx = e.clientX / innerWidth - 0.5;
    mouse.ty = e.clientY / innerHeight - 0.5;
  });
  const wanted = (new URLSearchParams(location.search).get("id") || location.hash.slice(1) || "").toLowerCase();
  let active = Math.max(0, PRODUCTS.findIndex((p) => p.id === wanted)), lastIdx = -1;
  let handStart = null;
  const restRot = (i) => PRODUCTS[i].model === "rollon" ? -0.32 : -0.38;
  const idleRot = (i, t) => Math.sin(t * 0.85 + i * 1.2) * 0.06;
  function viewFor(i) {
    const fit = flightJars[i].fit || 1, vh = geo.vh, m = geo.mobile;
    return { x: geo.vw * (m ? 0.82 : 0.5), y: vh * (m ? 0.55 : 0.52), h: (m ? Math.min(vh * 0.3, geo.vw * 0.62) : vh * 0.56) * fit, rotY: restRot(i) };
  }
  const ov = {
    el: null,
    sec: null,
    btn: null,
    card: null,
    lead: null,
    setFrame: null,
    idx: -1,
    state: "closed",
    t0: 0,
    from: null,
    last: null,
    pending: null,
    returnFocus: null
  };
  const OPEN_MS = reduce ? 1 : 800, CLOSE_MS = reduce ? 1 : 650;
  const easeIO = (k) => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  function buildOverlay() {
    if (ov.el || !showcaseSec) return;
    const el = document.createElement("div");
    el.className = "sc-overlay";
    el.id = "showcaseOverlay";
    el.tabIndex = -1;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("data-lenis-prevent", "");
    const sec = showcaseSec.cloneNode(true);
    sec.id = "showcaseOv";
    sec.removeAttribute("data-dock");
    sec.removeAttribute("data-theme");
    sec.querySelectorAll("[style]").forEach((n) => {
      if (!n.closest(".sc-badge") && !n.classList.contains("sc-blk") && !n.classList.contains("sc-big")) n.removeAttribute("style");
    });
    sec.querySelectorAll(".sc-callout").forEach((n) => n.remove());
    el.appendChild(sec);
    document.body.appendChild(el);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sc-overlay__close";
    btn.setAttribute("aria-label", "Close");
    btn.innerHTML = '<span aria-hidden="true">×</span>';
    document.body.appendChild(btn);
    btn.addEventListener("click", closeOverlay);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && (ov.state === "open" || ov.state === "opening")) closeOverlay();
    });
    el.addEventListener("scroll", () => {
      if (ov.state === "open" && el.scrollTop >= el.scrollHeight - el.clientHeight - 2) handOff(el.scrollTop + geo.fadeLen);
    }, { passive: true });
    const lenis = reduce ? null : new Lenis({ wrapper: el, content: sec, lerp: 0.09, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.5, autoRaf: false });
    Object.assign(ov, {
      lenis,
      el,
      sec,
      btn,
      card: sec.querySelector("#scCard"),
      lead: sec.querySelector("#scLead"),
      setFrame: makeOutline(sec.querySelector("#scFrame")),
      setCallout: makeCallout(sec.querySelector(".showcase-pin")),
      setBadges: makeBadges(sec.querySelector(".showcase-pin")),
      setChapters: makeChapters(sec.querySelector(".showcase-pin"))
    });
  }
  function cardSpot(i) {
    const r = slotEls[i].getBoundingClientRect(), jar = flightJars[i];
    return {
      x: r.left + r.width / 2,
      y: r.top + r.height * 0.52,
      h: r.height * 0.72 * (jar.fit || 1),
      rx: jar.G.rotation.x,
      ry: jar.G.rotation.y,
      rz: jar.G.rotation.z
    };
  }
  function openOverlay(i) {
    if (i == null || i < 0 || i >= N) return;
    if (ov.state === "opening" || ov.state === "closing") {
      ov.pending = i;
      return;
    }
    if (ov.state === "open") {
      if (i !== ov.idx) {
        ov.pending = i;
        closeOverlay();
      }
      return;
    }
    buildOverlay();
    if (!ov.el) return;
    ov.idx = i;
    ov.returnFocus = itemEls[i];
    populateShowcaseDOM(ov.sec, i);
    ov.el.setAttribute("aria-label", PRODUCTS[i].name);
    ov.from = cardSpot(i);
    if (state.lenis) state.lenis.stop();
    document.body.classList.add("sc-ov-open");
    ov.el.classList.remove("instant");
    ov.el.classList.add("open");
    ov.btn.classList.add("open");
    ov.sec.style.setProperty("margin-top", (-geo.fadeLen).toFixed(0) + "px", "important");
    ov.el.scrollTop = 0;
    if (ov.lenis) {
      ov.lenis.resize();
      ov.lenis.start();
      ov.lenis.scrollTo(0, { immediate: true, force: true });
    }
    const flow = ov.sec.querySelector(".sc-flow");
    if (flow) {
      flow.style.visibility = "visible";
      flow.style.opacity = "1";
    }
    placeBadges(ov.sec);
    [ov.card, ov.lead].forEach((el) => {
      if (el) {
        el.style.opacity = "0";
        el.style.setProperty("--tin", "0");
      }
    });
    ov.state = "opening";
    ov.t0 = ov.openedAt = performance.now();
    flightCanvas.classList.add("active");
    wasOn = true;
    ov.el.focus({ preventScroll: true });
  }
  function closeOverlay() {
    if (ov.state !== "open" && ov.state !== "opening") return;
    ov.from = cardSpot(ov.idx);
    ov.state = "closing";
    ov.t0 = performance.now();
    ov.el.classList.remove("open");
    ov.btn.classList.remove("open");
  }
  function handOff(sy) {
    const i = ov.idx;
    const pageY = showcaseSec.getBoundingClientRect().top + scrollY + sy;
    const ahead = ov.lenis ? ov.lenis.targetScroll - ov.lenis.animatedScroll : 0;
    active = i;
    handStart = { ...viewFor(i), rotX: 0.04, rotY: restRot(i), rotZ: 0 };
    if (lastIdx !== i) {
      lastIdx = i;
      populateShowcaseDOM(showcaseSec, i);
      placeBadges(showcaseSec);
    }
    lastIntro = "";
    lastP = -1;
    ov.el.classList.add("instant");
    ov.el.classList.remove("open");
    ov.btn.classList.remove("open");
    ov.returnFocus = null;
    finishClose();
    if (state.lenis) {
      state.lenis.scrollTo(pageY, { immediate: true, force: true });
      if (Math.abs(ahead) > 0.5) state.lenis.scrollTo(pageY + ahead);
    } else window.scrollTo(0, pageY);
  }
  function finishClose() {
    ov.state = "closed";
    if (ov.lenis) ov.lenis.stop();
    document.body.classList.remove("sc-ov-open");
    if (state.lenis) state.lenis.start();
    if (ov.returnFocus) ov.returnFocus.focus({ preventScroll: true });
    ov.idx = -1;
    const next = ov.pending;
    ov.pending = null;
    if (next != null) openOverlay(next);
  }
  function renderOverlay(now, tTime) {
    const i = ov.idx, jar = flightJars[i], vh = geo.vh, F = geo.fadeLen;
    const sy = (ov.lenis ? ov.lenis.animatedScroll : ov.el.scrollTop) + F, H = ov.sec.offsetHeight;
    const P = journeyProgress(sy, { showcaseTop: F, pinEnd: H - vh, vh, preRoll: F });
    updateShowcaseDOM(ov.sec, P, tTime);
    const view = viewFor(i);
    const hold = calcHoldTransform(P, { x: view.x, y: view.y, h: view.h, rotX: 0.04, rotY: restRot(i), rotZ: 0 }, view, mouse, tTime, geo.mobile);
    let a = 1;
    if (ov.state === "opening" || ov.state === "closing") {
      const k = clamp((now - ov.t0) / (ov.state === "opening" ? OPEN_MS : CLOSE_MS), 0, 1), e = easeIO(k);
      a = ov.state === "opening" ? e : 1 - e;
      if (k >= 1) {
        if (ov.state === "opening") ov.state = "open";
        else {
          finishClose();
          return;
        }
      }
    }
    if (ov.state === "open" && showcaseSec && H - vh - sy <= vh) {
      handOff(sy);
      return;
    }
    const f = ov.from, lerp2 = (p, q) => p + (q - p) * a;
    flightJars.forEach((j, k) => {
      j.G.visible = k === i;
    });
    L.place(jar.G, lerp2(f.x, hold.x), lerp2(f.y, hold.y));
    L.size(jar, Math.max(1, lerp2(f.h, hold.h)));
    jar.G.rotation.set(lerp2(f.rx, hold.rotX), lerp2(f.ry, hold.rotY), lerp2(f.rz, hold.rotZ));
    const sc0 = calcIntroText(sy, F, vh), timed = reduce ? 1 : clamp((now - ov.openedAt - 200) / 1300, 0, 1);
    const tin = timed, it = { tin, lift: sc0.lift, o: (1 - Math.pow(1 - tin, 3)) * (sc0.lift > vh * 1.2 ? 0 : 1) };
    const o = it.o * (ov.state === "closing" ? a : 1);
    [ov.card, ov.lead].forEach((el, s) => {
      if (!el) return;
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o > 3e-3 ? "visible" : "hidden";
      el.style.transform = "translate3d(" + ((s ? 24 : -24) * (1 - it.tin)).toFixed(1) + "px, " + (-it.lift).toFixed(1) + "px, 0)";
    });
    if (ov.card) {
      const chars = ov.card.querySelectorAll(".sc-chi"), n = Math.max(1, chars.length);
      chars.forEach((ch, k) => {
        const u = clamp((it.tin - k / n * 0.6) / 0.4, 0, 1), e = 1 - Math.pow(1 - u, 3);
        ch.style.opacity = (0.15 + 0.85 * e).toFixed(3);
        ch.style.transform = "translate3d(" + ((1 - e) * -0.5).toFixed(3) + "em,0,0)";
      });
      ov.card.style.setProperty("--tin", it.tin.toFixed(3));
      if (ov.lead) ov.lead.style.setProperty("--tin", it.tin.toFixed(3));
    }
    const ovBox = calcProductFrame(hold.x, hold.y, hold.h, ratios[i]);
    if (ov.setFrame) ov.setFrame(ovBox, calcFrameDraw(P) * (a > 0.999 ? 1 : 0));
    const hlc = calcHlCallout(sy, H, vh, (ov.sec._beats ? ov.sec._beats.hlFrom : H - 2.9 * vh) + 0.25 * vh);
    if (ov.setCallout) ov.setCallout(ovBox, hlc.o * a, hlc.draw, hlc.lines, 0, hlc.ex);
    decor.update();
    if (ov.setChapters) ov.setChapters(ovBox, sy, H, a);
    L.renderer.render(L.scene, L.cam);
  }
  window.addEventListener("tl:showcase", (e) => openOverlay(e.detail && e.detail.index));
  let wasOn = false, lastP = -1, lastIntro = "", last = performance.now();
  const hlv = new Array(N).fill(0);
  const cache = { y: new Array(N).fill(NaN), o: new Array(N).fill(NaN), h: new Array(N).fill(NaN) };
  const ENTER_MS = reduce ? 1 : 1100;
  let enterT0 = -1;
  const enterFrom = (v) => ({ x: v.x, y: geo.vh * 1.12, h: v.h * 0.72, rotX: 0.1, rotY: v.rotY - Math.PI * 1.2, rotZ: -0.08 });
  let rafId = 0;
  const schedule = makeScheduler();
  const wake = () => {
    if (!rafId) {
      last = performance.now();
      rafId = schedule(frame);
    }
  };
  window.addEventListener("scroll", wake, { passive: true });
  window.addEventListener("resize", wake);
  window.addEventListener("tl:showcase", wake);
  lineupSec.addEventListener("pointermove", wake, { passive: true });
  function frame(now) {
    rafId = 0;
    const dt = Math.min(0.1, (now - last) / 1e3);
    last = now;
    const sy = state.lenis ? state.lenis.scroll : scrollY, vh = geo.vh, tTime = now * 1e-3;
    if (ov.state !== "closed") {
      if (ov.lenis) ov.lenis.raf(now);
      renderOverlay(now, tTime);
      rafId = schedule(frame);
      return;
    }
    const lrTop = geo.lineupTop - sy, lrBottom = lrTop + geo.lineupH;
    const inLineup = lrBottom > 0 && lrTop < vh;
    const P = reduce ? 1 : journeyProgress(sy, geo);
    const inJourney = !reduce && P > 0 && P < 1;
    const on = inJourney || inLineup;
    if (enterT0 < 0) enterT0 = now;
    const entering = now - enterT0 < ENTER_MS + 1700;
    if (showcaseSec && !reduce && (inJourney || P !== lastP)) {
      updateShowcaseDOM(showcaseSec, P, tTime);
    }
    lastP = P;
    if (flowEl && flowEl._shown !== true) {
      flowEl._shown = true;
      flowEl.style.visibility = "visible";
      flowEl.style.opacity = "1";
    }
    if (!reduce && introCard && introLead) {
      const sc0 = calcIntroText(sy - geo.secTop, geo.fadeLen, geo.vh);
      const timed = clamp((now - enterT0 - 200) / 1300, 0, 1);
      const tin = Math.max(sc0.tin, timed);
      const it = { tin, lift: sc0.lift, o: (1 - Math.pow(1 - tin, 3)) * (sc0.lift > vh * 1.2 ? 0 : 1) };
      const key = it.o.toFixed(3) + "|" + it.tin.toFixed(3) + "|" + it.lift.toFixed(1);
      if (key !== lastIntro) {
        lastIntro = key;
        const vis = it.o > 3e-3 ? "visible" : "hidden", side = 1 - it.tin;
        introCard.style.opacity = it.o.toFixed(3);
        introCard.style.visibility = vis;
        introCard.style.transform = "translate3d(" + (-24 * side).toFixed(1) + "px, " + (-it.lift).toFixed(1) + "px, 0)";
        introLead.style.opacity = it.o.toFixed(3);
        introLead.style.visibility = vis;
        introCard.style.setProperty("--tin", it.tin.toFixed(3));
        introLead.style.setProperty("--tin", it.tin.toFixed(3));
        introLead.style.transform = "translate3d(" + (24 * side).toFixed(1) + "px, " + (-it.lift).toFixed(1) + "px, 0)";
        const chars = introCard.querySelectorAll(".sc-chi"), n = Math.max(1, chars.length);
        chars.forEach((ch, k) => {
          const u = clamp((it.tin - k / n * 0.6) / 0.4, 0, 1);
          const e = 1 - Math.pow(1 - u, 3);
          ch.style.opacity = (0.15 + 0.85 * e).toFixed(3);
          ch.style.transform = "translate3d(" + ((1 - e) * -0.5).toFixed(3) + "em,0,0)";
        });
      }
    }
    if (!on) {
      if (wasOn) {
        flightCanvas.classList.remove("active");
        wasOn = false;
      }
      if (progEl) {
        progEl.style.opacity = "0";
        progEl.style.visibility = "hidden";
      }
      setFrame(null, 0);
      setCallout(null, 0, 0);
      setChapters(null, 0, 0, 0);
      if (entering) rafId = schedule(frame);
      return;
    }
    rafId = schedule(frame);
    if (!wasOn) {
      flightCanvas.classList.add("active");
      wasOn = true;
    }
    const act = active;
    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;
    if (act !== lastIdx) {
      lastIdx = act;
      if (showcaseSec) populateShowcaseDOM(showcaseSec, act);
      lastIntro = "";
    }
    if (inJourney) {
      const view = viewFor(act);
      let t = calcHoldTransform(P, handStart || view, view, mouse, tTime, geo.mobile);
      const k = clamp((now - enterT0) / ENTER_MS, 0, 1);
      if (k < 1 && !handStart) {
        const e = easeIO(k), f = enterFrom(view), lp = (p, q) => p + (q - p) * e;
        t = { x: lp(f.x, t.x), y: lp(f.y, t.y), h: lp(f.h, t.h), rotX: lp(f.rotX, t.rotX), rotY: lp(f.rotY, t.rotY), rotZ: lp(f.rotZ, t.rotZ) };
      }
      const covered = !!stmEl && geo.pinEnd - sy < t.y - t.h / 2;
      PRODUCTS.forEach((prod, i) => {
        const jar = flightJars[i];
        if (i !== act) {
          jar.G.visible = false;
          return;
        }
        jar.G.visible = !covered;
        L.place(jar.G, t.x, t.y);
        L.size(jar, Math.max(1, t.h));
        jar.G.rotation.set(t.rotX, t.rotY, t.rotZ);
      });
      decor.update();
      const box = calcProductFrame(t.x, t.y, t.h, ratios[act]);
      setFrame(box, calcFrameDraw(P));
      const hlc = calcHlCallout(sy - geo.secTop, geo.secH, geo.vh, (showcaseSec._beats ? showcaseSec._beats.hlFrom : geo.secH - 2.9 * geo.vh) + 0.25 * geo.vh);
      setCallout(box, hlc.o, hlc.draw, hlc.lines, 0, hlc.ex);
      setChapters(box, sy - geo.secTop, geo.secH, 1);
      L.renderer.render(L.scene, L.cam);
      return;
    }
    setFrame(null, 0);
    setCallout(null, 0, 0);
    decor.update();
    const pr = { top: geo.pinTop - sy, left: geo.pinLeft };
    const first = act;
    const c = clamp((vh - lrTop) / (geo.lineupH + vh), 0, 1);
    const cycleIdx = reduce || canHover ? -1 : highlightIndex(c, N, first);
    const inView = lrTop < vh * 0.6 && lrBottom > vh * 0.4;
    PRODUCTS.forEach((prod, i) => {
      const jar = flightJars[i], s = geo.slots[i], card = cardEls[i];
      const order = entranceOrder(i, first, N);
      const slotTop = pr.top + s.oy;
      const e = reduce ? 1 : clamp((vh * 0.97 - slotTop - order * vh * 0.035) / (vh * 0.42), 0, 1);
      const eb = ease.back(e);
      const target = hovered >= 0 ? hovered === i ? 1 : 0 : inView && cycleIdx === i ? 1 : 0;
      hlv[i] += (target - hlv[i]) * (1 - Math.exp(-dt * 6));
      const hl = hlv[i];
      if (card) {
        const rh = Math.round(hl * 100) / 100;
        if (cache.h[i] !== rh) {
          cache.h[i] = rh;
          card.style.setProperty("--hl", String(rh));
        }
        const on2 = hl > 0.5;
        if (card.classList.contains("on") !== on2) card.classList.toggle("on", on2);
      }
      if (shadowEls[i]) {
        const so = clamp(e * 1.4 - 0.2, 0, 1).toFixed(2);
        if (cache.o[i] !== so) {
          cache.o[i] = so;
          shadowEls[i].style.opacity = so;
        }
      }
      const sx = pr.left + s.ox + s.w / 2;
      const syy = pr.top + s.oy + s.h * 0.5 + s.h * 0.02 - hl * s.h * 0.02;
      jar.G.visible = e > 0.01 && slotTop < vh * 1.05 && slotTop + s.h > -vh * 0.05;
      L.place(jar.G, sx, syy);
      L.size(jar, Math.max(1, s.h * 0.72 * (jar.fit || 1) * (0.7 + 0.3 * clamp(eb, 0, 1.1)) * (1 - hl * 0.04)));
      const hov = hovered === i;
      jar.G.rotation.set(
        hl * 0.05 + (hov ? mouse.y * 0.15 : 0),
        restRot(i) - (1 - eb) * Math.PI * 1.4 + idleRot(i, tTime) + hl * 0.25 + (hov ? mouse.x * 0.6 : 0),
        -0.61 * (1 - eb) - hl * 0.1
        // about -35 degrees while arriving, -6 when highlighted
      );
    });
    L.renderer.render(L.scene, L.cam);
  }
  wake();
  if (reduce && showcaseSec) showcaseSec.hidden = true;
  return { flightJars, L, measure, geo, active: () => active };
}
function initStatementPage() {
  const sec = $("#statement"), title = $("#stmTitle");
  const head = $("#luHead"), sun = $(".lu-sun");
  if (!sec || !title) return null;
  const pill = $(".stw-hl", title);
  const headWords = head ? $$(".stw-i", head) : [];
  const small = matchMedia("(max-width:767px)");
  let lastP = -1, lastH = -1, lastR = -1, lastHill = -1;
  const hillsSvg = sec.querySelector(".stm-hills");
  function applyStatement(p) {
    sec.style.setProperty("--p", p.toFixed(4));
    const ty = (0.5 - p) * 2 * innerWidth * 0.043;
    title.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0)`;
    if (pill) {
      const hl = ease.out(clamp((p - 0.36) / 0.2, 0, 1));
      pill.style.setProperty("--hl", hl.toFixed(3));
      pill.classList.toggle("on", hl > 0.25);
    }
  }
  function applyHead(t) {
    headWords.forEach((w, i) => {
      const e = ease.out(clamp((t - i * 0.15) / 0.55, 0, 1));
      w.style.transform = `translate3d(0, ${((1 - e) * 115).toFixed(1)}%, 0)`;
    });
  }
  if (reduce) {
    applyStatement(0.7);
    applyHead(1);
    headWords.forEach((w) => {
      w.style.transform = "none";
    });
    title.style.transform = "none";
    return null;
  }
  const docTop = (el) => {
    let y = 0, n = el;
    while (n) {
      y += n.offsetTop;
      n = n.offsetParent;
    }
    return y;
  };
  const geo = {};
  const measure = () => {
    geo.secTop = docTop(sec);
    geo.secH = sec.offsetHeight;
    if (head) {
      geo.headTop = docTop(head);
      geo.headH = head.offsetHeight;
    }
  };
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  const scrollPos = () => state.lenis ? state.lenis.scroll : window.scrollY;
  let near = false, rafId = 0;
  const schedule = makeScheduler();
  const watch = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      e.target._near = e.isIntersecting;
    });
    near = [sec, head].some((el) => el && el._near);
    if (near && !rafId) rafId = schedule(frame);
  }, { rootMargin: "30% 0px" });
  [sec, head].forEach((el) => {
    if (el) watch.observe(el);
  });
  function frame() {
    rafId = near ? schedule(frame) : 0;
    if (!near) return;
    const vh = innerHeight, sy = scrollPos();
    const r = { top: geo.secTop - sy, height: geo.secH };
    r.bottom = r.top + r.height;
    if (hillsSvg && r.top < vh * 1.3 && r.bottom > 0) {
      const t = clamp((vh - r.top) / vh, 0, 1);
      if (Math.abs(t - lastHill) > 1e-3) {
        lastHill = t;
        hillsSvg.style.setProperty("--hb", (t * 84).toFixed(1) + "px");
        hillsSvg.style.setProperty("--hm", (t * 40).toFixed(1) + "px");
      }
    }
    if (r.bottom > -vh * 0.2 && r.top < vh * 1.2) {
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      if (Math.abs(p - lastP) > 5e-4) {
        lastP = p;
        applyStatement(p);
      }
    }
    if (head) {
      const hr = { top: geo.headTop - sy };
      hr.bottom = hr.top + geo.headH;
      if (hr.top < vh * 1.2 && hr.bottom > -vh * 0.2) {
        const t = clamp((vh * 0.95 - hr.top) / (vh * 0.3), 0, 1);
        if (Math.abs(t - lastH) > 5e-4) {
          lastH = t;
          applyHead(t);
        }
      }
      if (sun && !small.matches) {
        const a = 360 * clamp((vh * 2.6 - hr.top) / (vh * 2.3), 0, 1);
        if (Math.abs(a - lastR) > 0.05) {
          lastR = a;
          sun.style.transform = `rotate(${a.toFixed(1)}deg)`;
        }
      }
    }
  }
  return null;
}
function initProductsPage() {
  Object.assign(thumbs, SHOTS);
  try {
    initCart();
    renderCart();
  } catch (e) {
    console.warn("Cart initialization deferred:", e);
  }
  try {
    initGrain();
  } catch (e) {
    console.warn("Grain unavailable:", e);
  }
  try {
    initSmooth();
  } catch (e) {
    console.warn("Smooth scroll unavailable:", e);
  }
  try {
    initStatementPage();
  } catch (e) {
    console.warn("Statement page unavailable:", e);
  }
  try {
    state.journeyApi = initProductJourney();
  } catch (e) {
    console.warn("Product journey unavailable:", e);
  }
  const nav = $("#nav");
  let navQueued = false, navScrolled = null;
  function applyNav() {
    navQueued = false;
    if (!nav) return;
    const y = state.lenis ? state.lenis.scroll : window.scrollY;
    const s = y > 20;
    if (s !== navScrolled) {
      navScrolled = s;
      nav.classList.toggle("scrolled", s);
    }
  }
  function onScroll() {
    if (!navQueued) {
      navQueued = true;
      requestAnimationFrame(applyNav);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  applyNav();
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
    if (state.lenis) open ? state.lenis.stop() : state.lenis.start();
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
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProductsPage);
} else {
  initProductsPage();
}
