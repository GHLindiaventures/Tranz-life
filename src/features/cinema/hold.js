// Press-and-hold, the gesture that opens and closes the home page's story (the seed at the gate, the seal on "Your
// ritual"). Holding fills a 0..1 progress over `duration` seconds; letting go early drains it back (faster), so a
// visitor feels it "take" rather than click. Works with mouse, touch, pen and the keyboard (Space or Enter, held).
// onProgress(p, holding) runs every frame while anything is moving; onComplete() once when p reaches 1.
function makeHold(target, { duration = 1.8, drain = .7, keyTarget = target, onStart, onProgress, onRelease, onComplete } = {}){
  let p = 0, holding = false, raf = 0, last = 0, done = false, enabled = true;

  function frame(now){
    raf = 0;
    const dt = Math.min(.25, (now - (last || now)) / 1000); last = now;   // real time, so a slow device holds no longer
    p = holding ? Math.min(1, p + dt / duration) : Math.max(0, p - dt / drain);
    onProgress && onProgress(p, holding);
    if (p >= 1 && holding && !done){ done = true; holding = false; onComplete && onComplete(); return; }
    if (holding || p > 0) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf){ last = 0; raf = requestAnimationFrame(frame); } };
  function down(e){
    if (!enabled || done || holding) return;
    holding = true; onStart && onStart(e); kick();
  }
  function up(){
    if (!holding) return;
    holding = false; onRelease && onRelease(p); kick();
  }

  target.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    if (e.target.closest && e.target.closest('[data-hold-skip]')) return;
    try { target.setPointerCapture(e.pointerId); } catch (err) {}
    down(e);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => target.addEventListener(ev, up));
  target.addEventListener('contextmenu', e => e.preventDefault());   // a long press must not open the phone's menu
  const isKey = e => e.key === ' ' || e.key === 'Enter';
  keyTarget.addEventListener('keydown', e => {
    if (!isKey(e) || (e.target.closest && e.target.closest('[data-hold-skip]'))) return;
    e.preventDefault(); if (!e.repeat) down(e);
  });
  keyTarget.addEventListener('keyup', e => { if (isKey(e)) { e.preventDefault(); up(); } });
  window.addEventListener('blur', up);

  return {
    get progress(){ return p; },
    reset(){ done = false; holding = false; p = 0; onProgress && onProgress(0, false); },
    enable(on){ enabled = on; if (!on) up(); }
  };
}

export { makeHold };
