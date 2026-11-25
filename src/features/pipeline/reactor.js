// Full-screen continuous process video with timed step introductions.
import { NSTAGE, RX } from '../../data/pipeline.js';
import { $ } from '../../utils/dom.js';
import processVideoUrl from '../../assets/process vedios/process vedio.mp4';

// Exact start timestamps (seconds) for each of the 6 stages inside process vedio.mp4 (49.53s)
const STEP_CUES = [
  { start: 0.0  }, // 01 Ethical sourcing (0.0s - 5.6s)
  { start: 5.6  }, // 02 Gentle extraction (5.6s - 11.0s)
  { start: 11.0 }, // 03 Formulation (11.0s - 20.1s)
  { start: 20.1 }, // 04 Batch testing (20.1s - 30.1s)
  { start: 30.1 }, // 05 Stability & sensory (30.1s - 38.0s)
  { start: 38.0 }, // 06 Sealed & shipped (38.0s - 49.5s)
];

function initReactor(getProgress) {
  const slidesEl = $('#slides'), ringEl = $('#wipeRing'), tag = $('#molTag'), canvas = $('#reactCanvas');
  if (ringEl) ringEl.style.display = 'none';
  if (tag) tag.classList.remove('on');
  if (canvas) canvas.style.display = 'none';

  slidesEl.innerHTML = `
    <article class="slide t-green">
      <div class="slide-video-fullscreen">
        <video class="process-step-video" id="processMainVideo" src="${processVideoUrl}" muted playsinline loop preload="auto"></video>
        <div class="slide-video-overlay"></div>
      </div>
      <div class="slide-copy" id="processStepCopy">
        <div class="st-head">
          <p class="st-no"><b id="processStepNum">01</b> / ${String(NSTAGE).padStart(2, '0')}</p>
          <h3 class="st-title" id="processStepTitle">${RX[0].t}</h3>
        </div>
        <p class="st-desc" id="processStepDesc">${RX[0].d}</p>
      </div>
    </article>`;

  const video = $('#processMainVideo', slidesEl);
  const copyEl = $('#processStepCopy', slidesEl);
  const numEl = $('#processStepNum', slidesEl);
  const titleEl = $('#processStepTitle', slidesEl);
  const descEl = $('#processStepDesc', slidesEl);

  let activeStage = 0;
  let shownStage = -1;
  let wasVisible = false;

  function updateStepOverlay(t) {
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
      numEl.textContent = String(idx + 1).padStart(2, '0');
      titleEl.textContent = RX[idx].t;
      descEl.textContent = RX[idx].d;
      copyEl.classList.add('is-on');
    }
  }

  function frame() {
    requestAnimationFrame(frame);
    const st = getProgress();
    const visible = st.visible;

    if (visible) {
      if (!wasVisible) {
        wasVisible = true;
        if (video.paused) video.play().catch(() => {});
      }
      updateStepOverlay(video.currentTime || 0);
    } else if (wasVisible) {
      wasVisible = false;
      if (!video.paused) video.pause();
    }
  }

  video.load();
  updateStepOverlay(0);
  requestAnimationFrame(frame);

  return {
    resize() {},
    theme: () => 'green',
    stage: () => activeStage,
    count: NSTAGE,
  };
}

export { initReactor };
