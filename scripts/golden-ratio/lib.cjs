// Shared CDP helper: launch Edge (headless or windowed), open one page target, return { send, ev, wait, close }.
const { spawn } = require('child_process');
module.exports = async function open({ port, headless = true, dir, w = 1440, h = 900 }){
  const args = ['--remote-debugging-port=' + port, '--window-size=' + w + ',' + h, '--autoplay-policy=no-user-gesture-required', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-features=CalculateNativeWinOcclusion', '--user-data-dir=' + dir, 'about:blank'];
  if (headless) args.unshift('--headless=new');
  const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args);
  let ver; for (let i = 0; i < 60 && !ver; i++){ await new Promise(r => setTimeout(r, 300)); try { ver = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json(); } catch {} }
  const t = await (await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = {}, handlers = [];
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } handlers.forEach(f => f(d)); };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async e => { const r = (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result; return r?.exceptionDetails ? 'ERR ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text).slice(0, 300) : r?.result?.value; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const close = () => { try { ws.close(); } catch {} edge.kill(); };
  process.on('exit', () => edge.kill());
  return { send, ev, wait, close, on: f => handlers.push(f), edge };
};
