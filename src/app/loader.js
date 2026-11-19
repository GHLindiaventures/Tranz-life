// Loading screen progress: the banyan's roots under the logo draw in as boot advances (CSS reads --lp, 0..1).
import { $ } from '../utils/dom.js';

const loader = $('#loader'), gate = $('#gate');

let loadP = 0;

function setLoad(p){ loadP = Math.max(loadP, p); const v = (loadP/100).toFixed(3); if (loader) loader.style.setProperty('--lp', v); if (gate && gate.isConnected) gate.style.setProperty('--lp', v); }

export { setLoad };
