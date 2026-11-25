// Centered continuous process video with synced top overlay, custom video controls, and fullscreen modal.
import { NSTAGE, RX } from '../../data/pipeline.js';
import { $ } from '../../utils/dom.js';
import processVideoUrl from '../../assets/process vedios/process vedio.mp4';

const STEP_CUES = [
  { start: 0.0  }, // 01 Ethical sourcing
  { start: 5.6  }, // 02 Gentle extraction
  { start: 11.0 }, // 03 Formulation
  { start: 20.1 }, // 04 Batch testing
  { start: 30.1 }, // 05 Stability & sensory
  { start: 38.0 }, // 06 Sealed & shipped
];

const PLAY_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="7 4 21 12 7 20 7 4"></polygon></svg>`;
const PAUSE_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;

function controlsMarkup(prefix) {
  return `
    <div class="process-controls" id="${prefix}Controls">
      <input class="pc-seek" id="${prefix}Seek" type="range" min="0" max="100" step="0.1" value="0" aria-label="Seek video">
    </div>`;
}

function initReactor(getProgress) {
  const slidesEl = $('#slides');
  const ringEl = $('#wipeRing'), tag = $('#molTag'), canvas = $('#reactCanvas');
  if (ringEl) ringEl.style.display = 'none';
  if (tag) tag.classList.remove('on');
  if (canvas) canvas.style.display = 'none';

  const totalPad = String(NSTAGE).padStart(2, '0');

  slidesEl.innerHTML = `
    <div class="wrap process-layout">
      <div class="process-header">
        <p class="eyebrow">The TranzLife process</p>
        <h3 class="h2 process-heading">From the roots of nature to the infinity of science</h3>
      </div>

      <div class="process-stage-wrap">
        <div class="process-mini-card" id="processMiniCard">
          <video class="process-mini-video" id="processMiniVideo" src="${processVideoUrl}" muted playsinline loop preload="auto"></video>
          <div class="process-mini-scrim"></div>
          <div class="process-mini-top">
            <div class="process-live-step">
              <div class="st-head">
                <p class="st-no"><b id="processStepNum">01</b> / ${totalPad}</p>
                <h4 class="st-title" id="processStepTitle">${RX[0].t}</h4>
              </div>
              <p class="st-desc" id="processStepDesc">${RX[0].d}</p>
            </div>
            <button class="process-fs-btn" id="miniFsBtn" type="button" aria-label="Full screen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>
          </div>
          <button class="pc-center-play" id="miniPlayBtn" type="button" aria-label="Pause video">${PAUSE_ICON}</button>
          ${controlsMarkup('mini')}
        </div>
      </div>
    </div>`;

  // Fullscreen modal mounted on document.body so it covers navbar/dock cleanly
  let modal = $('#processFullscreenModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'processFullscreenModal';
    modal.className = 'process-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <video class="process-modal-video" id="processModalVideo" src="${processVideoUrl}" muted playsinline loop preload="auto"></video>
      <div class="process-modal-scrim"></div>
      <button class="process-modal-close" id="processModalClose" type="button" aria-label="Close full screen video">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <button class="pc-center-play" id="modalPlayBtn" type="button" aria-label="Pause video">${PAUSE_ICON}</button>
      <div class="process-modal-copy">
        <div class="st-head">
          <p class="st-no"><b id="modalStepNum">01</b> / ${totalPad}</p>
          <h4 class="st-title" id="modalStepTitle">${RX[0].t}</h4>
        </div>
        <p class="st-desc" id="modalStepDesc">${RX[0].d}</p>
      </div>
      ${controlsMarkup('modal')}`;
    document.body.appendChild(modal);
  }

  const miniCard = $('#processMiniCard', slidesEl);
  const miniVideo = $('#processMiniVideo', slidesEl);
  const modalVideo = $('#processModalVideo', modal);
  const closeBtn = $('#processModalClose', modal);

  const miniControls = $('#miniControls', slidesEl);
  const miniPlayBtn = $('#miniPlayBtn', slidesEl);
  const miniSeek = $('#miniSeek', slidesEl);
  const miniFsBtn = $('#miniFsBtn', slidesEl);

  const modalControls = $('#modalControls', modal);
  const modalPlayBtn = $('#modalPlayBtn', modal);
  const modalSeek = $('#modalSeek', modal);

  const numEl = $('#processStepNum', slidesEl);
  const titleEl = $('#processStepTitle', slidesEl);
  const descEl = $('#processStepDesc', slidesEl);
  const modalNumEl = $('#modalStepNum', modal);
  const modalTitleEl = $('#modalStepTitle', modal);
  const modalDescEl = $('#modalStepDesc', modal);

  let activeStage = 0;
  let shownStage = -1;
  let wasVisible = false;
  let isOpen = false;
  let userPaused = false;

  function activeVideo() {
    return isOpen ? modalVideo : miniVideo;
  }

  function syncPlayButtons() {
    const v = activeVideo();
    const isPaused = v.paused;
    miniPlayBtn.innerHTML = isPaused ? PLAY_ICON : PAUSE_ICON;
    miniPlayBtn.setAttribute('aria-label', isPaused ? 'Play video' : 'Pause video');
    modalPlayBtn.innerHTML = isPaused ? PLAY_ICON : PAUSE_ICON;
    modalPlayBtn.setAttribute('aria-label', isPaused ? 'Play video' : 'Pause video');
  }

  function syncUI(t, dur) {
    let idx = 0;
    for (let i = STEP_CUES.length - 1; i >= 0; i--) {
      if (t >= STEP_CUES[i].start) {
        idx = i;
        break;
      }
    }
    activeStage = idx;

    if (idx !== shownStage) {
      shownStage = idx;
      const num = String(idx + 1).padStart(2, '0');
      const { t: title, d: desc } = RX[idx];
      numEl.textContent = num;
      titleEl.textContent = title;
      descEl.textContent = desc;
      modalNumEl.textContent = num;
      modalTitleEl.textContent = title;
      modalDescEl.textContent = desc;
    }

    const total = dur && !isNaN(dur) ? dur : 49.53;
    const pct = Math.min(100, Math.max(0, (t / total) * 100));
    miniSeek.value = pct.toFixed(1);
    modalSeek.value = pct.toFixed(1);
    miniSeek.style.setProperty('--pct', `${pct}%`);
    modalSeek.style.setProperty('--pct', `${pct}%`);
  }

  function togglePlay(e) {
    if (e) e.stopPropagation();
    const v = activeVideo();
    if (v.paused) {
      userPaused = false;
      v.play().catch(() => {});
    } else {
      userPaused = true;
      v.pause();
    }
    syncPlayButtons();
  }

  function handleSeek(seekEl) {
    const v = activeVideo();
    const total = v.duration && !isNaN(v.duration) ? v.duration : 49.53;
    const target = (parseFloat(seekEl.value) / 100) * total;
    v.currentTime = target;
    syncUI(target, total);
  }

  miniControls.addEventListener('click', (e) => e.stopPropagation());
  modalControls.addEventListener('click', (e) => e.stopPropagation());
  miniPlayBtn.addEventListener('click', togglePlay);
  modalPlayBtn.addEventListener('click', togglePlay);
  miniSeek.addEventListener('input', () => handleSeek(miniSeek));
  modalSeek.addEventListener('input', () => handleSeek(modalSeek));

  function openModal(e) {
    if (e) e.stopPropagation();
    if (isOpen) return;
    isOpen = true;
    modalVideo.currentTime = miniVideo.currentTime || 0;
    if (!miniVideo.paused) miniVideo.pause();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    if (!userPaused) modalVideo.play().catch(() => {});
    syncPlayButtons();
  }

  function closeModal() {
    if (!isOpen) return;
    isOpen = false;
    miniVideo.currentTime = modalVideo.currentTime || 0;
    if (!modalVideo.paused) modalVideo.pause();
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (wasVisible && !userPaused) miniVideo.play().catch(() => {});
    syncPlayButtons();
  }

  miniCard.addEventListener('click', openModal);
  miniFsBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeModal();
  });

  function frame() {
    requestAnimationFrame(frame);
    const st = getProgress();
    const visible = st.visible;

    if (isOpen) {
      syncUI(modalVideo.currentTime || 0, modalVideo.duration);
      return;
    }

    if (visible) {
      if (!wasVisible) {
        wasVisible = true;
        if (!userPaused && miniVideo.paused) {
          miniVideo.play().catch(() => {});
        }
        syncPlayButtons();
      }
      syncUI(miniVideo.currentTime || 0, miniVideo.duration);
    } else if (wasVisible) {
      wasVisible = false;
      if (!miniVideo.paused) miniVideo.pause();
    }
  }

  miniVideo.load();
  modalVideo.load();
  syncUI(0, 49.53);
  syncPlayButtons();
  requestAnimationFrame(frame);

  return {
    resize() {},
    theme: () => 'green',
    stage: () => activeStage,
    count: NSTAGE,
  };
}

export { initReactor };
