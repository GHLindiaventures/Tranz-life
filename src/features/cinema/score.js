// The home page's cinematic score, generated live with the Web Audio API: nothing to download, and no third-party
// recordings to license. Every act of the story has its own bed, and the beds cross-fade as the visitor scrolls:
//   gate     airy light, a held breath, while the seed waits to be planted
//   genesis  near-silence: the Genesis film plays its own sound (the bed ducks under it)
//   windows  dawn: a tanpura drone in D (its Pa-Sa-Sa-Sa cycle) with birds waking up
//   roots    night forest: low drone, wind, crickets
//   day      warm strings over the tanpura, birds
//   lens     glass and light: a shimmering pad, sparse bells, a slow pulse (the science)
//   ritual   resolution: strings and a bansuri-like flute phrase in raga Bhupali (D E F# A B)
//   night    the footer: crickets and the last of the drone
// Sound effects follow the story: the hold tone (rising with the hold), planting (a soft earth thud and a bloom of
// bells), whooshes between acts, a drip, a singing bowl when a ritual is sealed, leaf rustles over the roots, a chime
// when the day moves on, a soft wooden tap on clicks.
// Browsers start sound only after a click, tap or key, so nothing plays before that (unlock()). The choice to mute
// is remembered (localStorage); the toggle (#sndToggle in the nav) also mutes the Genesis film. Sound pauses while
// the tab is hidden. Licensed recordings can replace any bed later without touching the rest of the page.
import { state } from '../../app/state.js';

const KEY = 'tl-sound';
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
const BHUPALI = [62, 64, 66, 69, 71];                       // D4 E4 F#4 A4 B4
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

function readMuted(){ try { return localStorage.getItem(KEY) === 'off'; } catch (e) { return false; } }
function saveMuted(m){ try { localStorage.setItem(KEY, m ? 'off' : 'on'); } catch (e) {} }

function initScore(){
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null, out = null, bedBus = null, fxBus = null, verbIn = null, noise = null;
  let muted = readMuted(), unlocked = false, ducked = false;
  let scene = null, wanted = 'gate', live = null;            // live: { name, gain, stop }
  const VOL = matchMedia('(hover: none)').matches ? .72 : .85;
  const listeners = new Set();

  // ---------------------------------------------------------------- the mixing desk
  function build(){
    ctx = new AC({ latencyHint: 'playback' });
    out = ctx.createGain(); out.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 3; comp.attack.value = .02; comp.release.value = .4;
    out.connect(comp); comp.connect(ctx.destination);
    bedBus = ctx.createGain(); bedBus.gain.value = 1; bedBus.connect(out);
    fxBus = ctx.createGain(); fxBus.gain.value = .9; fxBus.connect(out);
    // one shared hall: a generated impulse (decaying stereo noise), so everything sits in the same space
    const verb = ctx.createConvolver(), len = Math.floor(ctx.sampleRate * 4.2), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++){ const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8); }
    verb.buffer = ir;
    verbIn = ctx.createGain(); verbIn.gain.value = .55;
    const verbOut = ctx.createGain(); verbOut.gain.value = .9;
    verbIn.connect(verb); verb.connect(verbOut); verbOut.connect(out);
    const nlen = ctx.sampleRate * 3; noise = ctx.createBuffer(1, nlen, ctx.sampleRate);
    const nd = noise.getChannelData(0); for (let i = 0; i < nlen; i++) nd[i] = Math.random() * 2 - 1;
  }

  // ---------------------------------------------------------------- small instruments
  const now = () => ctx.currentTime;
  function voice(dest, wet = .3){       // a gain that feeds both the dry mix and the hall
    const g = ctx.createGain(); g.gain.value = 0;
    g.connect(dest);
    if (wet){ const w = ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(verbIn); }
    return g;
  }
  function panned(dest, pan){
    if (!ctx.createStereoPanner) return dest;
    const p = ctx.createStereoPanner(); p.pan.value = pan; p.connect(dest); return p;
  }
  function osc(type, f, dest, detune = 0){
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune; o.connect(dest); return o;
  }
  function noiseSrc(dest, loop = true){
    const s = ctx.createBufferSource(); s.buffer = noise; s.loop = loop;
    s.loopStart = Math.random(); s.connect(dest); return s;
  }
  function env(param, t, a, peak, d, floor = .0001){
    param.cancelScheduledValues(t); param.setValueAtTime(floor, t);
    param.linearRampToValueAtTime(peak, t + a);
    param.exponentialRampToValueAtTime(floor, t + a + d);
  }

  // a tanpura string: two detuned saws through a resonant low-pass that closes slowly (the buzzing "jawari")
  function pluck(dest, note, t, gain = .09, len = 4.2){
    const g = voice(dest, .45), f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.Q.value = 7; f.connect(g);
    f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(420, t + len * .8);
    const a = osc('sawtooth', midi(note), f), b = osc('sawtooth', midi(note), f, 6);
    env(g.gain, t, .015, gain, len);
    a.start(t); b.start(t); a.stop(t + len + .1); b.stop(t + len + .1);
  }
  // a bell: FM, inharmonic, long tail
  function bell(dest, f, t, gain = .05, len = 3.2, pan = 0){
    const g = voice(panned(dest, pan), .8);
    const car = osc('sine', f, g), mod = ctx.createOscillator(), mg = ctx.createGain();
    mod.frequency.value = f * 3.51; mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * .05, t + len);
    mod.connect(mg); mg.connect(car.frequency);
    env(g.gain, t, .005, gain, len);
    car.start(t); mod.start(t); car.stop(t + len + .1); mod.stop(t + len + .1);
  }
  // a bansuri-like flute note: soft sine + breath, vibrato that blooms after the attack
  function flute(dest, note, t, len, gain = .05){
    const g = voice(dest, .7), f = midi(note);
    const o = osc('sine', f, g), o2 = osc('triangle', f * 2, g);
    const o2g = ctx.createGain(); o2g.gain.value = .12; o2.disconnect(); o2.connect(o2g); o2g.connect(g);
    const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5.2;
    vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * .012, t + Math.min(len, .9));
    vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
    const br = ctx.createBiquadFilter(); br.type = 'bandpass'; br.frequency.value = f * 2; br.Q.value = 3;
    const bg = ctx.createGain(); bg.gain.value = .25; const n = noiseSrc(br, false); br.connect(bg); bg.connect(g);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(gain, t + .14);
    g.gain.setValueAtTime(gain, t + len * .7); g.gain.exponentialRampToValueAtTime(.0001, t + len + .4);
    [o, o2, vib, n].forEach(s => { s.start(t); s.stop(t + len + .5); });
  }
  // a bird: a few quick sine chirps, panned somewhere in the trees
  function bird(dest, t){
    const g = voice(panned(dest, rnd(-.8, .8)), .7), o = osc('sine', 3000, g);
    const base = rnd(2300, 4200), n = Math.floor(rnd(2, 6));
    let k = t;
    g.gain.setValueAtTime(0, t);
    for (let i = 0; i < n; i++){
      const d = rnd(.05, .11);
      o.frequency.setValueAtTime(base * rnd(.85, 1), k);
      o.frequency.exponentialRampToValueAtTime(base * rnd(1.15, 1.5), k + d);
      g.gain.setValueAtTime(0, k); g.gain.linearRampToValueAtTime(rnd(.012, .022), k + .01); g.gain.linearRampToValueAtTime(0, k + d);
      k += d + rnd(.03, .09);
    }
    o.start(t); o.stop(k + .1);
  }
  // a cricket: a 4.7 kHz tone gated into three fast pulses
  function cricket(dest, t, pan){
    const g = voice(panned(dest, pan), .3), o = osc('sine', rnd(4400, 4900), g);
    g.gain.setValueAtTime(0, t);
    for (let i = 0; i < 3; i++){ const s = t + i * .055; g.gain.setValueAtTime(.009, s); g.gain.setValueAtTime(0, s + .03); }
    o.start(t); o.stop(t + .25);
  }
  // a held chord: detuned saws through a soft low-pass, slow attack and release (strings, far away)
  function chord(dest, notes, t, len, gain = .022, cutoff = 900){
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = .4;
    const g = voice(dest, .6); f.connect(g);
    const os = [];
    notes.forEach(n => { os.push(osc('sawtooth', midi(n), f, -7), osc('sawtooth', midi(n), f, 7), osc('triangle', midi(n), f)); });
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(gain, t + len * .35);
    g.gain.setValueAtTime(gain, t + len * .65); g.gain.linearRampToValueAtTime(.0001, t + len);
    os.forEach(o => { o.start(t); o.stop(t + len + .1); });
  }

  // ---------------------------------------------------------------- the beds
  // each returns a stop(); event parts are scheduled a little ahead on timers that stop with the bed
  function timers(){
    const ids = new Set();
    const loop = (fn, min, max, first = 0) => {
      const tick = () => { fn(now() + .05); const id = setTimeout(tick, rnd(min, max) * 1000); ids.add(id); };
      const id = setTimeout(tick, first * 1000); ids.add(id);
    };
    return { loop, stop(){ ids.forEach(clearTimeout); ids.clear(); } };
  }
  function drone(dest, notes, gain, cutoff = 520){
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
    const g = ctx.createGain(); g.gain.value = gain; f.connect(g); g.connect(dest);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .07; lg.gain.value = gain * .35;
    lfo.connect(lg); lg.connect(g.gain);
    const os = notes.flatMap(n => [osc('sine', midi(n), f), osc('triangle', midi(n), f, 4)]);
    os.forEach(o => o.start()); lfo.start();
    return () => { os.forEach(o => { try { o.stop(); } catch (e) {} }); try { lfo.stop(); } catch (e) {} };
  }
  function wind(dest, gain, freq = 420){
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = .8;
    const g = ctx.createGain(); g.gain.value = gain; f.connect(g); g.connect(dest);
    const s = noiseSrc(f);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .05; lg.gain.value = freq * .5;
    lfo.connect(lg); lg.connect(f.frequency);
    const lfo2 = ctx.createOscillator(), lg2 = ctx.createGain(); lfo2.frequency.value = .11; lg2.gain.value = gain * .6;
    lfo2.connect(lg2); lg2.connect(g.gain);
    s.start(); lfo.start(); lfo2.start();
    return () => [s, lfo, lfo2].forEach(n => { try { n.stop(); } catch (e) {} });
  }
  function tanpura(dest, T, gain = .07, low = 38){
    // Pa - Sa - Sa - low Sa, over and over (A2, D3, D3, D2)
    T.loop(t => { [45, 50, 50, low].forEach((n, i) => pluck(dest, n, t + i * 1.15, i === 3 ? gain * 1.2 : gain)); }, 5.2, 5.2);
  }
  const CHORDS = [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]];   // D  Bm  G  A
  function strings(dest, T, gain, cutoff){
    let i = 0;
    T.loop(t => { chord(dest, CHORDS[i++ % CHORDS.length], t, 10, gain, cutoff); }, 8, 8);
  }

  const BEDS = {
    gate(dest){
      const s1 = drone(dest, [74, 81], .016, 2400), s2 = wind(dest, .05, 1800);
      return () => { s1(); s2(); };
    },
    genesis(dest){ return drone(dest, [50, 57], .02, 400); },
    windows(dest){
      const T = timers(), s = drone(dest, [38, 45], .045);
      tanpura(dest, T, .055);
      T.loop(t => bird(dest, t), 1.8, 5.5, 1.2);
      return () => { T.stop(); s(); };
    },
    roots(dest){
      const T = timers(), s = drone(dest, [33, 40], .06, 300), w = wind(dest, .09, 380);
      T.loop(t => cricket(dest, t, rnd(-.9, .9)), .35, 1.4);
      T.loop(t => pluck(dest, pick([38, 45]), t, .035, 5), 6, 10, 2);
      return () => { T.stop(); s(); w(); };
    },
    day(dest){
      const T = timers(), s = drone(dest, [38, 45], .035);
      tanpura(dest, T, .04);
      strings(dest, T, .02, 1100);
      T.loop(t => bird(dest, t), 3, 7, 2);
      return () => { T.stop(); s(); };
    },
    lens(dest){
      const T = timers(), s = drone(dest, [74, 78, 81, 86], .009, 5000), low = drone(dest, [26, 38], .05, 160);
      T.loop(t => bell(dest, midi(pick(BHUPALI) + pick([12, 24])), t, .028, 3.5, rnd(-.7, .7)), .9, 2.6, .4);
      T.loop(t => {                                      // a slow pulse, like a heartbeat under glass
        [0, .32].forEach((o, i) => {
          const g = voice(dest, .2), x = osc('sine', 52, g);
          env(g.gain, t + o, .01, i ? .05 : .08, .5); x.start(t + o); x.stop(t + o + .7);
        });
      }, 2.4, 2.4, 1);
      return () => { T.stop(); s(); low(); };
    },
    ritual(dest){
      const T = timers(), s = drone(dest, [38, 45], .04);
      tanpura(dest, T, .045);
      strings(dest, T, .024, 1300);
      const PHRASES = [[69, 71, 74, 76, 74, 71, 69], [66, 69, 71, 69, 66, 64, 62], [74, 76, 78, 76, 74, 71, 74]];
      const LENS = [.5, .5, .9, .6, .5, .6, 1.8];
      T.loop(t => {
        let k = t; pick(PHRASES).forEach((n, i) => { flute(dest, n, k, LENS[i]); k += LENS[i] * .92; });
      }, 13, 18, 3);
      return () => { T.stop(); s(); };
    },
    tension(dest){                                    // the red stage: a low drone, a slow heartbeat, a thin high whisper
      const T = timers(), s = drone(dest, [26, 33, 38], .07, 220), w = wind(dest, .035, 3200);
      T.loop(t => {
        [0, .3].forEach((o, i) => { const g = voice(dest, .3), x = osc('sine', 46, g); env(g.gain, t + o, .01, i ? .09 : .14, .55); x.start(t + o); x.stop(t + o + .8); });
      }, 1.6, 1.6, .5);
      return () => { T.stop(); s(); w(); };
    },
    night(dest){
      const T = timers(), s = drone(dest, [33, 45], .045, 260);
      T.loop(t => cricket(dest, t, rnd(-.9, .9)), .3, 1.1);
      return () => { T.stop(); s(); };
    }
  };

  function swapBed(name){
    if (!ctx || !BEDS[name] || (live && live.name === name)) return;
    const t = now(), FADE = 2.6;
    if (live){
      const old = live;
      old.gain.gain.cancelScheduledValues(t); old.gain.gain.setValueAtTime(old.gain.gain.value, t);
      old.gain.gain.linearRampToValueAtTime(0, t + FADE);
      setTimeout(() => { old.stop(); old.gain.disconnect(); }, FADE * 1000 + 200);
    }
    const g = ctx.createGain(); g.gain.value = 0; g.connect(bedBus);
    g.gain.linearRampToValueAtTime(1, t + FADE);
    live = { name, gain: g, stop: BEDS[name](g) };
  }

  // ---------------------------------------------------------------- effects
  let holdNodes = null;
  const FX = {
    tap(){ const t = now(), g = voice(fxBus, .15), f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 2; f.connect(g);
      const n = noiseSrc(f, false); env(g.gain, t, .002, .06, .05); n.start(t); n.stop(t + .1);
      const g2 = voice(fxBus, .1), o = osc('sine', 880, g2); env(g2.gain, t, .002, .025, .06); o.start(t); o.stop(t + .1); },
    whoosh(){ const t = now(), g = voice(fxBus, .5), f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2; f.connect(g);
      f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2400, t + .6); f.frequency.exponentialRampToValueAtTime(500, t + 1.3);
      const n = noiseSrc(f, false); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.08, t + .55); g.gain.linearRampToValueAtTime(0, t + 1.4);
      n.start(t); n.stop(t + 1.5); },
    chime(i = 0){ const t = now(); bell(fxBus, midi(BHUPALI[i % 5] + 12), t, .04, 3, (i % 3 - 1) * .4); bell(fxBus, midi(BHUPALI[(i + 2) % 5] + 24), t + .09, .018, 2.4); },
    rustle(){ const t = now(), g = voice(fxBus, .3), f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2600; f.connect(g);
      const n = noiseSrc(f, false); g.gain.setValueAtTime(0, t);
      for (let i = 0; i < 5; i++){ const s = t + i * rnd(.03, .07); g.gain.linearRampToValueAtTime(rnd(.015, .035), s + .01); g.gain.linearRampToValueAtTime(.002, s + .05); }
      n.start(t); n.stop(t + .5); bell(fxBus, midi(pick(BHUPALI) + 24), t + .05, .012, 1.6); },
    drip(){ const t = now(), g = voice(fxBus, .7), o = osc('sine', 500, g);
      o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(1500, t + .09);
      env(g.gain, t, .004, .12, .22); o.start(t); o.stop(t + .4); },
    shatter(){ const t = now();                          // glass breaking: a bright crack, then falling shards
      const g = voice(fxBus, .6), f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2200; f.connect(g);
      const n = noiseSrc(f, false); env(g.gain, t, .002, .5, .5); n.start(t); n.stop(t + .7);
      const lo = voice(fxBus, .3), o = osc('sine', 70, lo); o.frequency.exponentialRampToValueAtTime(30, t + .6); env(lo.gain, t, .005, .4, .7); o.start(t); o.stop(t + .9);
      for (let i = 0; i < 9; i++) bell(fxBus, rnd(2400, 6200), t + .05 + i * rnd(.03, .09), .03, rnd(.4, 1.1), rnd(-.8, .8)); },
    shimmer(){ const t = now(); [74, 78, 81, 86, 90].forEach((n, i) => bell(fxBus, midi(n), t + i * .11, .03, 3.6, (i - 2) * .3)); },
    bowl(){ const t = now(), f = 196;   // a singing bowl: inharmonic partials, slightly beating, a very long tail
      [[1, .07], [1.006, .05], [2.76, .035], [5.4, .018], [8.93, .008]].forEach(([m, a]) => {
        const g = voice(fxBus, .9), o = osc('sine', f * m, g); env(g.gain, t, .01, a, 7.5); o.start(t); o.stop(t + 7.7);
      });
      const g = voice(fxBus, .3), n = noiseSrc(g, false); env(g.gain, t, .001, .05, .03); n.start(t); n.stop(t + .05); },
    plant(){ const t = now();
      const g = voice(fxBus, .4), o = osc('sine', 90, g);       // the seed meets the earth
      o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(38, t + .5);
      env(g.gain, t, .005, .35, .9); o.start(t); o.stop(t + 1.1);
      const gn = voice(fxBus, .3), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.connect(gn);
      const n = noiseSrc(lp, false); env(gn.gain, t, .003, .12, .35); n.start(t); n.stop(t + .5);
      [62, 69, 74, 78, 81, 86].forEach((m, i) => bell(fxBus, midi(m), t + .18 + i * .085, .035, 4, (i - 2.5) * .25));
      chord(fxBus, [50, 57, 62, 66, 69], t + .1, 6, .03, 1600); }
  };

  // the hold tone: a sine that climbs with the hold and a breath of noise that swells with it
  function holdStart(){
    if (!ready() || holdNodes) return;
    const t = now(), g = voice(fxBus, .5), o = osc('sine', 110, g), o2 = osc('triangle', 165, g);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = .9;
    const ng = ctx.createGain(); ng.gain.value = 0; const n = noiseSrc(f); f.connect(ng); ng.connect(g);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.06, t + .15);
    o.start(t); o2.start(t); n.start(t);
    holdNodes = { g, o, o2, ng, f };
  }
  function hold(p){
    if (!holdNodes) return;
    const t = now(), h = holdNodes;
    h.o.frequency.setTargetAtTime(110 + p * 330, t, .05);
    h.o2.frequency.setTargetAtTime(165 + p * 495, t, .05);
    h.f.frequency.setTargetAtTime(900 + p * 2400, t, .05);
    h.ng.gain.setTargetAtTime(p * .5, t, .05);
    h.g.gain.setTargetAtTime(.04 + p * .06, t, .05);
  }
  function holdEnd(){
    if (!holdNodes) return;
    const h = holdNodes, t = now(); holdNodes = null;
    h.g.gain.cancelScheduledValues(t); h.g.gain.setValueAtTime(h.g.gain.value, t); h.g.gain.linearRampToValueAtTime(0, t + .35);
    setTimeout(() => { try { h.o.stop(); h.o2.stop(); } catch (e) {} h.g.disconnect(); }, 600);
  }

  // ---------------------------------------------------------------- state
  // (a context that is still resuming counts: anything scheduled now plays the moment it is running)
  const ready = () => !!ctx && unlocked && !muted && ctx.state !== 'closed';
  function level(){
    if (!ctx) return;
    const t = now(), on = unlocked && !muted && !document.hidden;
    out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t);
    out.gain.linearRampToValueAtTime(on ? VOL : 0, t + (on ? 1.2 : .35));
    bedBus.gain.setTargetAtTime(ducked ? .12 : 1, t, .6);
    if (on && ctx.state !== 'running') ctx.resume().catch(() => {});
    if (!on) setTimeout(() => { if (ctx && (muted || document.hidden) && ctx.state === 'running') ctx.suspend().catch(() => {}); }, 450);
  }
  function unlock(){
    if (unlocked || !AC) return;
    unlocked = true;
    if (!ctx) build();
    ctx.resume().catch(() => {});
    swapBed(wanted);
    level();
  }
  function setScene(name){
    if (!name || name === scene) return;
    const prev = scene; scene = wanted = name;
    if (ctx && unlocked){
      swapBed(name);
      if (prev && prev !== 'gate' && !muted) sfx('whoosh');
    }
  }
  function sfx(name, arg){ if (ready() && FX[name]) { try { FX[name](arg); } catch (e) {} } }
  function setMuted(m){
    muted = !!m; saveMuted(muted); level();
    const film = document.getElementById('gnFilm');     // the Genesis film follows the same switch
    if (film){ film.muted = muted; if (!muted && !film.paused) film.play().catch(() => {}); }
    listeners.forEach(f => f(muted));
  }
  function duck(on){ ducked = on; if (ctx) level(); }

  document.addEventListener('visibilitychange', level);
  // the first click, tap or key anywhere starts the sound (for visitors who skip the gate)
  const first = () => { ['pointerdown', 'keydown', 'touchend'].forEach(ev => window.removeEventListener(ev, first, true)); unlock(); };
  ['pointerdown', 'keydown', 'touchend'].forEach(ev => window.addEventListener(ev, first, true));

  // ---------------------------------------------------------------- the page tells the score where it is
  function watchScenes(){
    const secs = [...document.querySelectorAll('[data-score]')];
    if (!secs.length || !('IntersectionObserver' in window)) return;
    // the section that crosses the middle of the screen sets the scene
    const io = new IntersectionObserver(es => {
      if (document.documentElement.classList.contains('xp-on')) return;      // the film sets its own scenes
      es.forEach(e => { if (e.isIntersecting) setScene(e.target.dataset.score); });
    }, { rootMargin: '-49% 0px -49% 0px' });
    secs.forEach(s => io.observe(s));
  }
  function watchStory(){
    // soft taps on buttons and links
    document.addEventListener('click', e => { if (e.target.closest('button, a, [role="button"]') && !e.target.closest('[data-no-tap]')) sfx('tap'); });
    // leaves rustle as a root is touched (Our Roots)
    let lastTip = null;
    document.addEventListener('pointerover', e => {
      const tip = e.target.closest && e.target.closest('.rm-tip');
      if (tip && tip !== lastTip) sfx('rustle');
      lastTip = tip;
    });
    // a chime as the day moves to its next moment (A Day with TranzLife)
    const dayCopy = document.getElementById('dayCopy');
    if (dayCopy && 'MutationObserver' in window){
      let n = 0, last = 0;
      new MutationObserver(() => { const t = performance.now(); if (t - last > 500 && scene === 'day'){ last = t; sfx('chime', n++); } }).observe(dayCopy, { childList: true });
    }
    // the bed steps back while the Genesis film speaks
    const film = document.getElementById('gnFilm');
    if (film){
      film.addEventListener('playing', () => duck(!film.muted));
      film.addEventListener('volumechange', () => duck(!film.paused && !film.muted && film.volume > .2));
      ['pause', 'ended'].forEach(ev => film.addEventListener(ev, () => duck(false)));
    }
  }

  // ---------------------------------------------------------------- the switch in the nav
  function wireToggle(){
    const b = document.getElementById('sndToggle');
    if (!b) return;
    const paint = m => { b.classList.toggle('is-off', m); b.setAttribute('aria-pressed', String(!m)); b.setAttribute('aria-label', m ? 'Sound off. Turn sound on' : 'Sound on. Turn sound off'); };
    paint(muted); listeners.add(paint);
    b.addEventListener('click', () => { unlock(); setMuted(!muted); });
  }

  const api = {
    get muted(){ return muted; },
    get supported(){ return !!AC; },
    unlock, setScene, setMuted, sfx, duck, holdStart, hold, holdEnd,
    onMute(f){ listeners.add(f); }
  };
  if (!AC){ Object.assign(api, { unlock(){}, sfx(){}, holdStart(){}, hold(){}, holdEnd(){} }); }
  state.score = api;
  watchScenes(); watchStory(); wireToggle();
  return api;
}

export { initScore };
