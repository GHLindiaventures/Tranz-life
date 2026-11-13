// Scroll-driven 3D scenes that show the product journey from seed to shelf.
import * as THREE from 'three';
import { NSTAGE, RX } from '../../data/pipeline.js';
import { envCube } from '../../lib/environment.js';
import { $, $$ } from '../../utils/dom.js';
import { clamp, lerp } from '../../utils/math.js';
import { reduce } from '../../utils/media.js';

const GOLD = 0xe7c680;
const GREEN = 0x5fa23a;
const CREAM = 0xf2eee0;

function material(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: .48,
    metalness: .05,
    clearcoat: .06,
    clearcoatRoughness: .35,
    ...options
  });
}

function mesh(geometry, mat, position = [0, 0, 0]) {
  const item = new THREE.Mesh(geometry, mat);
  item.position.set(...position);
  return item;
}

function leaf(materialLeaf, x, y, z, scale = 1, rotation = 0) {
  const item = mesh(new THREE.SphereGeometry(.34, 16, 10), materialLeaf, [x, y, z]);
  item.scale.set(scale * 1.6, scale * .35, scale * .75);
  item.rotation.z = rotation;
  return item;
}

function makeScene(index) {
  const group = new THREE.Group();
  const glass = material(0xa6c8b0, { transparent:true, opacity:.34, roughness:.14, metalness:.08 });
  const liquid = material(0xdba43f, { transparent:true, opacity:.9, roughness:.18 });
  const dark = material(0x243b27, { roughness:.24, metalness:.18 });
  const gold = material(GOLD, { roughness:.2, metalness:.65 });
  const leafMat = material(GREEN, { roughness:.7 });
  const cream = material(0xd8c6a0, { roughness:.62 });
  const plinth = material(0x304b35, { roughness:.78 });

  group.add(mesh(new THREE.CylinderGeometry(2.45, 2.7, .18, 48), plinth, [0, -1.32, 0]));
  group.add(mesh(new THREE.TorusGeometry(2.25, .025, 8, 64), gold, [0, -1.2, 0]));

  if (index === 0) {
    const soil = material(0x604126, { roughness: .9 });
    const seed = material(0xb8874b, { roughness: .65 });
    group.add(mesh(new THREE.CylinderGeometry(1.35, 1.5, .55, 24), soil, [0, -.75, 0]));
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      const r = .3 + (i % 3) * .3;
      group.add(mesh(new THREE.SphereGeometry(.14, 12, 8), seed, [Math.cos(a) * r, -.42 + (i % 2) * .08, Math.sin(a) * r]));
    }
    group.add(mesh(new THREE.CylinderGeometry(.08, .11, 1.3, 10), leafMat, [0, .35, 0]));
    group.add(leaf(leafMat, -.3, .92, 0, .72, -.55));
    group.add(leaf(leafMat, .3, 1.08, 0, .78, .55));
    group.add(leaf(leafMat, -.8, .35, .1, .6, -.35));
    group.add(leaf(leafMat, .8, .48, .1, .64, .35));
  } else if (index === 1) {
    group.add(mesh(new THREE.CylinderGeometry(.9, .8, 1.65, 24), glass, [0, 0, 0]));
    group.add(mesh(new THREE.SphereGeometry(.86, 24, 16), glass, [0, .8, 0]));
    group.add(mesh(new THREE.CylinderGeometry(.3, .3, 1.3, 18), liquid, [0, -.38, 0]));
    group.add(mesh(new THREE.TorusGeometry(.72, .08, 12, 32), gold, [0, 1.02, 0]));
    for (let i = 0; i < 3; i++) group.add(mesh(new THREE.TorusGeometry(.34 + i * .12, .045, 8, 24), gold, [.88, .2 - i * .24, 0],));
    group.add(mesh(new THREE.CylinderGeometry(.1, .1, .8, 12), gold, [0, 1.65, 0]));
    group.add(mesh(new THREE.TorusGeometry(1.25, .025, 8, 48), gold, [0, -.2, -.55]));
  } else if (index === 2) {
    [-.9, .9].forEach((x, i) => {
      group.add(mesh(new THREE.CylinderGeometry(.48, .58, 1.15, 20), glass, [x, -.1, 0]));
      group.add(mesh(new THREE.CylinderGeometry(.4, .4, .42, 20), i ? liquid : material(0x9cc27a), [x, -.46, 0]));
      group.add(mesh(new THREE.TorusGeometry(.48, .035, 8, 24), gold, [x, .48, 0]));
    });
    group.add(mesh(new THREE.CylinderGeometry(.12, .12, 1.8, 16), gold, [0, .75, 0]));
    group.add(mesh(new THREE.TorusGeometry(.55, .07, 8, 24), gold, [0, 1.58, 0]));
    group.add(mesh(new THREE.BoxGeometry(2.9, .06, .06), gold, [0, -.82, .72]));
  } else if (index === 3) {
    for (let i = 0; i < 4; i++) {
      const x = -1.05 + i * .7;
      group.add(mesh(new THREE.CylinderGeometry(.2, .24, 1.35, 16), glass, [x, -.1, 0]));
      group.add(mesh(new THREE.CylinderGeometry(.17, .17, .5 + (i % 2) * .15, 16), i % 2 ? liquid : material(0x9cc27a), [x, -.48, 0]));
      group.add(mesh(new THREE.TorusGeometry(.21, .03, 8, 20), gold, [x, .58, 0]));
    }
    group.add(mesh(new THREE.BoxGeometry(1.45, .16, .16), dark, [0, .78, 0]));
    group.add(mesh(new THREE.CylinderGeometry(.12, .12, 1.05, 12), dark, [.15, 1.18, 0]));
    group.add(mesh(new THREE.CylinderGeometry(.3, .1, .18, 12), dark, [.15, 1.68, 0]));
    group.add(mesh(new THREE.TorusGeometry(1.75, .025, 8, 64), gold, [0, -.2, -.4]));
  } else if (index === 4) {
    group.add(mesh(new THREE.BoxGeometry(2.8, 2.35, 1.7), glass, [0, 0, 0]));
    group.add(mesh(new THREE.BoxGeometry(2.95, .12, 1.85), gold, [0, -1.15, 0]));
    group.add(mesh(new THREE.BoxGeometry(2.95, .12, 1.85), gold, [0, 1.15, 0]));
    for (let y of [-.55, .2, .85]) group.add(mesh(new THREE.BoxGeometry(2.35, .07, 1.2), cream, [0, y, .88]));
    group.add(mesh(new THREE.BoxGeometry(.12, 2.2, .12), gold, [-1.4, 0, .9]));
    group.add(mesh(new THREE.BoxGeometry(.12, 2.2, .12), gold, [1.4, 0, .9]));
    group.add(mesh(new THREE.SphereGeometry(.18, 12, 8), liquid, [1.05, .72, 1]));
    group.add(mesh(new THREE.TorusGeometry(1.8, .025, 8, 64), gold, [0, -.1, -1]));
  } else {
    group.add(mesh(new THREE.CylinderGeometry(.62, .7, 1.5, 24), cream, [-.45, -.15, 0]));
    group.add(mesh(new THREE.CylinderGeometry(.66, .66, .18, 24), dark, [-.45, .7, 0]));
    group.add(mesh(new THREE.BoxGeometry(1.35, 2.15, 1.15), material(0xb68b55), [.95, -.05, 0]));
    group.add(mesh(new THREE.BoxGeometry(1.1, .08, .08), leafMat, [.95, .25, .6]));
    group.add(mesh(new THREE.BoxGeometry(.08, 1.5, .08), leafMat, [.95, -.05, .6]));
    group.add(leaf(leafMat, -.95, .55, .1, .8, -.5));
    group.add(mesh(new THREE.TorusGeometry(.55, .06, 8, 24), gold, [-.45, -.92, 0]));
    group.add(mesh(new THREE.BoxGeometry(2.7, .06, .06), gold, [0, -.88, .7]));
  }
  group.traverse(node => { if (node.isMesh) node.castShadow = true; });
  return group;
}

function setOpacity(group, value) {
  group.traverse(node => {
    if (!node.isMesh) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach(mat => { mat.transparent = true; mat.opacity = value; });
  });
}

function initReactor(getProgress) {
  const canvas = $('#reactCanvas'), pin = $('#pin'), tag = $('#molTag');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.environment = envCube();
  const cam = new THREE.PerspectiveCamera(35, 1, .1, 80);
  cam.position.set(0, .15, 12);
  scene.add(new THREE.HemisphereLight(0xf2f5e2, 0x24351f, .8));
  const key = new THREE.DirectionalLight(0xfff0cf, 2);
  key.position.set(4, 7, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xbfe6a8, 1);
  rim.position.set(-6, 2, -5);
  scene.add(rim);

  const world = new THREE.Group();
  scene.add(world);
  const stages = RX.map((_, i) => { const stage = makeScene(i); world.add(stage); return stage; });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3.2, 64), new THREE.MeshStandardMaterial({ color:0x182b1e, roughness:.5, metalness:.1, transparent:true, opacity:.82 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.35;
  floor.receiveShadow = true;
  world.add(floor);

  const slidesEl = $('#slides'), ringEl = $('#wipeRing');
  const pipe = k => `<div class="pipe" aria-hidden="true"><div class="pipe-line"><i></i></div><ol>${RX.map((r, i) => `<li class="${i <= k ? 'lit' : ''}${i === k ? ' cur' : ''}"><em></em><b>${String(i + 1).padStart(2, '0')}</b><span>${r.t}</span></li>`).join('')}</ol></div>`;
  slidesEl.innerHTML = RX.map((r, k) => `
    <article class="slide ${k % 2 === 0 ? 't-cream' : 't-green'}" data-k="${k}">
      <div class="halo"></div>
      <div class="slide-copy">
        <p class="eyebrow">The TranzLife pipeline</p>
        <p class="st-no"><b>${String(k + 1).padStart(2, '0')}</b> / ${String(NSTAGE).padStart(2, '0')}</p>
        <h3 class="st-title">${r.t}</h3>
        <div class="eq"><span class="m">${r.a}</span><i>+</i><span class="m">${r.b}</span><i>→</i><span class="m out">${r.p}</span></div>
        <p class="st-desc">${r.d}</p>
        <div class="spec">${r.s.map(x => `<span>${x}</span>`).join('')}</div>
      </div>
      ${pipe(k)}
    </article>`).join('');
  const slides = $$('.slide', slidesEl);
  slides.forEach(s => s.addEventListener('click', e => {
    const li = e.target.closest('.pipe li');
    if (li) window.dispatchEvent(new CustomEvent('tl:goStage', { detail:[...li.parentNode.children].indexOf(li) }));
  }));
  $$('.pipe li').forEach(li => { li.style.pointerEvents = 'auto'; });

  let W = 1, H = 1, mobile = false, current = 0, lastTheme = 'cream', activeStage = 0;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width); H = Math.max(1, rect.height);
    renderer.setSize(W, H, false);
    cam.aspect = W / H;
    cam.updateProjectionMatrix();
    mobile = W < 760 || cam.aspect < .9;
    world.position.set(mobile ? 0 : 2.55, mobile ? .65 : -.1, 0);
    world.scale.setScalar(mobile ? .72 : 1);
  }

  function apply(progress) {
    const position = clamp(progress, 0, 1) * NSTAGE;
    const k = Math.min(NSTAGE - 1, Math.floor(position));
    const u = Math.min(1, position - k);
    const transition = clamp((u - .72) / .28, 0, 1);
    stages.forEach((stage, i) => {
      const isCurrent = i === k;
      const isNext = i === k + 1 && transition > 0;
      setOpacity(stage, isCurrent ? 1 - transition : (isNext ? transition : 0));
      stage.visible = isCurrent || isNext;
      stage.position.y = Math.sin(progress * Math.PI * 2 + i) * .08;
      stage.rotation.y = (progress * .5 + i * .08) * (mobile ? .6 : 1);
      stage.scale.setScalar(lerp(isCurrent ? 1 : .86, 1.04, isNext ? transition : 0));
    });
    floor.rotation.z = progress * Math.PI * 2;
    slides.forEach((el, i) => { const on = i === k || (i === k + 1 && transition > 0); if (el.hidden === on) el.hidden = !on; });
    const currentSlide = slides[k], nextSlide = slides[k + 1];
    currentSlide.style.zIndex = 1;
    currentSlide.style.clipPath = 'none';
    const diagonal = Math.hypot(W, H);
    if (nextSlide && transition > 0) {
      const radius = transition * diagonal * 1.06;
      nextSlide.style.zIndex = 2;
      nextSlide.style.clipPath = `circle(${radius}px at 50% 100%)`;
      const copy = $('.slide-copy', nextSlide);
      copy.style.transform = `translateY(${(1 - transition) * 36}px)`;
      copy.style.opacity = .35 + .65 * transition;
      ringEl.style.display = 'block';
      ringEl.style.width = ringEl.style.height = `${radius * 2}px`;
      ringEl.style.left = `${W / 2 - radius}px`;
      ringEl.style.top = `${H - radius}px`;
      ringEl.style.opacity = 1 - transition * .9;
    } else {
      ringEl.style.display = 'none';
      if (nextSlide) nextSlide.style.clipPath = 'circle(0px at 50% 100%)';
    }
    $('.slide-copy', currentSlide).style.transform = '';
    $('.slide-copy', currentSlide).style.opacity = k === 0 ? clamp(progress * NSTAGE / .06, 0, 1) : 1;
    pin.style.setProperty('--fill', ((k + .5 + transition) / NSTAGE).toFixed(4));
    tag.textContent = RX[k].p;
    tag.classList.toggle('on', u > .72 && transition < .5);
    tag.style.left = `${mobile ? W / 2 : W * .72}px`;
    tag.style.top = `${H * (mobile ? .72 : .68)}px`;
    lastTheme = transition > .5 ? ((k + 1) % 2 === 0 ? 'cream' : 'green') : (k % 2 === 0 ? 'cream' : 'green');
    activeStage = transition > .5 ? Math.min(k + 1, NSTAGE - 1) : k;
  }

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    const state = getProgress();
    if (!state.visible) return;
    current += (state.p - current) * (1 - Math.exp(-dt * (reduce ? 60 : 9)));
    if (Math.abs(state.p - current) < 1e-5) current = state.p;
    apply(current);
    renderer.render(scene, cam);
  }
  window.addEventListener('resize', resize);
  resize();
  apply(0);
  requestAnimationFrame(frame);
  return { resize, theme:() => lastTheme, stage:() => activeStage, count:NSTAGE };
}

export { initReactor };
