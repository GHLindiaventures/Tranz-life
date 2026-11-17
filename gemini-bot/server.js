import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "products.json"), "utf8"));
const MOCK = process.env.MOCK === "1";
const MODEL = process.env.MODEL || "gemini-2.5-flash";
const allowed = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);

// ── Multi-key rotation ──────────────────────────────────────────
const ALL_KEYS = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
  .split(",")
  .map(k => k.trim().replace(/^["']|["']$/g, ""))
  .filter(Boolean);

const USE_VERTEX = process.env.GEMINI_VERTEX === "1";
const clients = ALL_KEYS.map(k => new GoogleGenAI(USE_VERTEX ? { vertexai: true, apiKey: k } : { apiKey: k }));
let currentKeyIndex = 0;

function getAI() { return clients[currentKeyIndex]; }
function getKeyLabel() { return `Key-${currentKeyIndex + 1}/${clients.length} (...${ALL_KEYS[currentKeyIndex].slice(-6)})`; }

function rotateKey() {
  const prev = currentKeyIndex;
  currentKeyIndex = (currentKeyIndex + 1) % clients.length;
  console.log(`🔄 Rotated API key: Key-${prev + 1} → Key-${currentKeyIndex + 1} (...${ALL_KEYS[currentKeyIndex].slice(-6)})`);
  return currentKeyIndex !== prev; // returns false if only 1 key (no real rotation)
}

function isRotatableError(e) {
  const m = `${e.status || ""} ${e.message || ""}`.toLowerCase();
  return m.includes("429") || m.includes("quota") || m.includes("resource_exhausted") || m.includes("rate limit") || m.includes("404") || m.includes("not found") || m.includes("503");
}
// ─────────────────────────────────────────────────────────────────

function hint(e) {
  const m = `${e.status || ""} ${e.message || ""}`.toLowerCase();
  if (m.includes("fetch failed") || m.includes("enotfound") || m.includes("econn") || m.includes("etimedout")) return "-> Network problem: this computer cannot reach Google. Check internet/VPN/firewall/proxy.";
  if (m.includes("api key not valid") || m.includes("api_key_invalid") || m.includes("unauthenticated") || m.includes("401")) return "-> The key is not accepted. Create a fresh key at https://aistudio.google.com/apikey (starts with AIza) and paste it into .env.";
  if (m.includes("403") || m.includes("permission")) return "-> Permission denied: enable the Gemini API for the key's project, or create a new key in AI Studio.";
  if (m.includes("404") || m.includes("not found")) return "-> Model not found: set MODEL=gemini-3.5-flash-lite in .env.";
  if (m.includes("429") || m.includes("quota") || m.includes("resource_exhausted")) return "-> Quota/rate limit hit: wait a minute or enable billing.";
  return "-> See the message above.";
}
async function selfTest() {
  if (!clients.length) {
    console.error("WARNING: No Gemini API keys configured. Set GEMINI_API_KEYS in .env");
    return;
  }
  let ready = false;
  for (let i = 0; i < clients.length; i++) {
    try {
      const r = await getAI().models.generateContent({ model: MODEL, contents: "Reply with the word OK", config: { maxOutputTokens: 20 } });
      console.log(`Gemini connection OK (${getKeyLabel()}):`, (r.text || "").trim());
      ready = true;
      break;
    } catch (e) {
      console.warn(`⚠️ ${getKeyLabel()} unavailable: ${e.status || ""} ${(e.message || "").slice(0, 100)}...`);
      if (clients.length > 1) rotateKey();
    }
  }
  if (!ready) {
    console.error("All keys failed self-test. Check internet or API keys.");
  } else {
    console.log(`🔑 Loaded ${clients.length} API key(s) with automatic rotation.`);
  }
}

const SYSTEM_PROMPT = `You are the TranzLife Assistant, the website chatbot for ${data.company.name}.
You help visitors learn about our 6 products and choose the right one.

ABSOLUTE RULES
1. Use ONLY the product data below. If something is not in it (exact quantities, price, shelf life, age limits, mechanism, licence, clinical evidence), say it is not confirmed yet and offer the contact details. Never guess or invent.
2. Do NOT claim any product diagnoses, treats, cures or prevents any disease. Never say a product detoxifies, regenerates or protects the liver, cures fatty liver, strengthens lungs, controls or lowers blood sugar, treats menstrual cramps, or has "no side effects" or is "safe for long-term use". Speak in wellness-support terms ("traditionally used for", "designed to support", "positioned for").
3. Never compare us against allopathic/other medicines or tell anyone to stop or replace medication.
4. For anyone with a medical condition (liver disease, diabetes, respiratory illness), pregnancy/breastfeeding, children, or on prescription medicines: give the label precautions and advise consulting a doctor first. For emergencies or severe symptoms (chest pain, trouble breathing, severe pain, bleeding), tell them to seek medical care immediately.
5. Doses: only quote the usage shown in the data, and say the final pack label is the authority.
6. Stay on topic (TranzLife and its products). Politely decline unrelated requests.
7. Prices: only quote a price if listed in the data, flagged as to be confirmed; otherwise direct to ${data.company.phone} or ${data.company.email}.

STYLE: warm, concise (under ~120 words unless asked for detail), plain language, short bullets only when listing. LANGUAGE: reply in the same language the visitor used in their LATEST message. If they write Tamil words in English letters (Tanglish, e.g. "thala vali", "iruka", "panna", "vanakkam"), you MUST reply in Tanglish: Tamil sentences written ONLY in English letters (no Tamil script at all), keeping product names and common English words as they are (style example, do not copy it: "Ungalukku energy-kaga Energy Booster nalla option-ah irukum."). Never answer a Tanglish message in plain English. Tamil script gets Tamil script; English gets English. When helpful, recommend one product and say why, then offer a next step. Mention that information is for general wellness and not medical advice when health is discussed.

COMPANY: ${JSON.stringify(data.company)}

PRODUCT DATA (verified source of truth):
${JSON.stringify(data.products, null, 2)}`;

if (!MOCK && !ALL_KEYS.length) console.error("WARNING: No Gemini API keys found. Set GEMINI_API_KEYS in .env and restart.");
console.log("Model:", MODEL);

// ── Usage tracker ────────────────────────────────────────────────
const stats = {
  startedAt: new Date().toISOString(),
  totalRequests: 0,
  totalSuccess: 0,
  totalErrors: 0,
  totalRateLimited: 0,
  todayRequests: 0,
  todayDate: new Date().toISOString().slice(0, 10),
  minuteRequests: 0,
  minuteTimestamp: Math.floor(Date.now() / 60000),
  peakRPM: 0,
  recentLogs: [],          // last 50 request/response logs
  responseTimesMs: [],     // last 100 response times
};

function resetDayIfNeeded() {
  const today = new Date().toISOString().slice(0, 10);
  if (stats.todayDate !== today) {
    stats.todayRequests = 0;
    stats.todayDate = today;
  }
}

function trackMinute() {
  const now = Math.floor(Date.now() / 60000);
  if (stats.minuteTimestamp !== now) {
    stats.minuteRequests = 0;
    stats.minuteTimestamp = now;
  }
  stats.minuteRequests++;
  if (stats.minuteRequests > stats.peakRPM) stats.peakRPM = stats.minuteRequests;
}

function addLog(entry) {
  stats.recentLogs.unshift(entry);
  if (stats.recentLogs.length > 50) stats.recentLogs.length = 50;
}

function addResponseTime(ms) {
  stats.responseTimesMs.push(ms);
  if (stats.responseTimesMs.length > 100) stats.responseTimesMs.shift();
}

function avgResponseTime() {
  if (!stats.responseTimesMs.length) return 0;
  return Math.round(stats.responseTimesMs.reduce((a, b) => a + b, 0) / stats.responseTimesMs.length);
}
// ─────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: "20kb" }));

app.use((req, res, next) => {
  const o = req.headers.origin;
  if (o && (allowed.includes("*") || allowed.includes(o))) {
    res.setHeader("Access-Control-Allow-Origin", allowed.includes("*") ? "*" : o);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// tiny in-memory rate limit: 20 msgs / 5 min / IP
const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 5 * 60 * 1000;
  const arr = (hits.get(ip) || []).filter(t => now - t < win);
  arr.push(now); hits.set(ip, arr);
  return arr.length > 20;
}

app.get("/api/products", (_req, res) =>
  res.json(data.products.map(p => ({ id: p.id, name: p.name, pack: p.pack, forWhom: p.forWhom }))));

app.post("/api/chat", async (req, res) => {
  if (limited(req.ip)) {
    stats.totalRateLimited++;
    addLog({ time: new Date().toISOString(), ip: req.ip, status: "RATE_LIMITED" });
    return res.status(429).json({ error: "Too many messages. Please try again in a few minutes." });
  }
  const raw = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const messages = raw
    .filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-12)
    .map(m => ({ role: m.role, content: m.content.slice(0, 1000) }));
  if (!messages.length || messages[messages.length - 1].role !== "user")
    return res.status(400).json({ error: "Send at least one user message." });

  const userMsg = messages[messages.length - 1].content;
  resetDayIfNeeded();
  trackMinute();
  stats.totalRequests++;
  stats.todayRequests++;
  const startTime = Date.now();

  if (MOCK) {
    const last = messages[messages.length - 1].content;
    addLog({ time: new Date().toISOString(), ip: req.ip, status: "MOCK", userMsg: last, latencyMs: 0 });
    stats.totalSuccess++;
    return res.json({ reply: `(mock mode) You asked: "${last}". Add your GEMINI_API_KEY and run npm start for real answers.` });
  }
  try {
    // Gemini uses role "model" (not "assistant") and the history must start with a user turn
    const contents = messages
      .map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    while (contents.length && contents[0].role !== "user") contents.shift();

    const genConfig = {
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 800,
        temperature: 0.4,
        ...(/2\.5-flash/.test(MODEL) ? { thinkingConfig: { thinkingBudget: 0 } } : {})
      }
    };

    // Try current key; on quota error, rotate and retry with remaining keys
    let lastErr;
    for (let attempt = 0; attempt < clients.length; attempt++) {
      try {
        const r = await getAI().models.generateContent(genConfig);
        const latencyMs = Date.now() - startTime;
        const reply = r.text || "Sorry, I couldn't generate an answer. Please try again.";
        addResponseTime(latencyMs);
        stats.totalSuccess++;
        addLog({ time: new Date().toISOString(), ip: req.ip, status: "OK", key: getKeyLabel(), userMsg, reply: reply.slice(0, 200), latencyMs });
        console.log(`[CHAT] ${getKeyLabel()} | ${req.ip} | ${latencyMs}ms | "${userMsg.slice(0, 60)}" → "${reply.slice(0, 60)}"`);
        return res.json({ reply });
      } catch (e) {
        lastErr = e;
        if (isRotatableError(e) && clients.length > 1) {
          console.warn(`⚠️ ${getKeyLabel()} hit limit/error (${e.status || "fail"}). Rotating...`);
          const rotated = rotateKey();
          if (!rotated) break; // all keys tried
        } else {
          throw e; // non-rotatable error
        }
      }
    }
    throw lastErr; // all keys exhausted
  } catch (e) {
    const latencyMs = Date.now() - startTime;
    stats.totalErrors++;
    addLog({ time: new Date().toISOString(), ip: req.ip, status: "ERROR", userMsg, error: `${e.status || ""} ${(e.message || "").slice(0, 150)}`, latencyMs });
    console.error("GEMINI ERROR:", e.status, e.message);
    console.error(hint(e));
    res.status(500).json({ debug: process.env.DEBUG === "1" ? `${e.status || ""} ${e.message}` : undefined, error: `Sorry, I'm having trouble right now. Please call ${data.company.phone} or email ${data.company.email}.` });
  }
});

// ── Stats API & Admin Dashboard ──────────────────────────────────
function getFreeTierLimits() {
  const count = Math.max(1, clients.length);
  return {
    rpm: 10 * count,
    rpd: 500 * count,
    tpm: 250000 * count,
    keyCount: count,
    activeKey: getKeyLabel()
  };
}

app.get("/api/stats", (_req, res) => {
  resetDayIfNeeded();
  const now = Math.floor(Date.now() / 60000);
  const currentMinuteReqs = stats.minuteTimestamp === now ? stats.minuteRequests : 0;
  const limits = getFreeTierLimits();
  res.json({
    uptime: Math.round((Date.now() - new Date(stats.startedAt).getTime()) / 1000),
    startedAt: stats.startedAt,
    model: MODEL,
    freeTierLimits: limits,
    activeKey: getKeyLabel(),
    totalKeys: clients.length,
    usage: {
      totalRequests: stats.totalRequests,
      totalSuccess: stats.totalSuccess,
      totalErrors: stats.totalErrors,
      totalRateLimited: stats.totalRateLimited,
      todayRequests: stats.todayRequests,
      todayRemaining: Math.max(0, limits.rpd - stats.todayRequests),
      currentMinuteRequests: currentMinuteReqs,
      minuteRemaining: Math.max(0, limits.rpm - currentMinuteReqs),
      peakRPM: stats.peakRPM,
      avgResponseTimeMs: avgResponseTime(),
    },
    recentLogs: stats.recentLogs,
  });
});

app.get("/admin", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TranzLife Bot — Admin Dashboard</title>
<style>
*{box-sizing:border-box;margin:0}body{font:14px/1.5 system-ui,sans-serif;background:#0f1117;color:#e0e0e0;padding:20px}
header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px}
h1{font-size:22px;color:#4ade80}
.badge{background:#1f3b28;color:#4ade80;border:1px solid #2f6b3e;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px}
.card{background:#1a1d27;border:1px solid #2a2d37;border-radius:10px;padding:16px;text-align:center}
.card .val{font-size:28px;font-weight:700;color:#4ade80}.card .lbl{font-size:12px;color:#888;margin-top:2px}
.card.warn .val{color:#facc15}.card.danger .val{color:#f87171}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #2a2d37}
th{color:#888;font-weight:600;position:sticky;top:0;background:#0f1117}
.ok{color:#4ade80}.err{color:#f87171}.rl{color:#facc15}
#logs-wrap{max-height:400px;overflow-y:auto;background:#1a1d27;border-radius:10px;border:1px solid #2a2d37}
.bar{background:#1a1d27;border:1px solid #2a2d37;border-radius:8px;padding:12px 16px;margin-bottom:16px;display:flex;gap:24px;align-items:center;flex-wrap:wrap}
.bar .meter{flex:1;min-width:150px}.bar .meter-lbl{font-size:12px;color:#888;margin-bottom:4px}
.bar .meter-bar{height:8px;border-radius:4px;background:#2a2d37;overflow:hidden}.bar .meter-fill{height:100%;border-radius:4px;transition:width .5s}
.fill-ok{background:#4ade80}.fill-warn{background:#facc15}.fill-danger{background:#f87171}
</style></head><body>
<header>
  <h1>📊 TranzLife Bot — Live Dashboard</h1>
  <div id="key-info" class="badge">Keys: loading...</div>
</header>
<div class="bar" id="meters"></div>
<div class="grid" id="cards"></div>
<h3 style="margin-bottom:8px;color:#888">Recent Requests (live)</h3>
<div id="logs-wrap"><table><thead><tr><th>Time</th><th>Key</th><th>IP</th><th>Status</th><th>User Message</th><th>Reply</th><th>Latency</th></tr></thead><tbody id="logs"></tbody></table></div>
<script>
function pct(used,max){return Math.min(100,Math.round(used/max*100))}
function fillClass(p){return p<60?'fill-ok':p<85?'fill-warn':'fill-danger'}
function cardClass(p){return p<60?'':'warn '+(p>=85?'danger':'')}
function meter(label,used,max){const p=pct(used,max);return '<div class="meter"><div class="meter-lbl">'+label+' — '+used+' / '+max+' ('+p+'%)</div><div class="meter-bar"><div class="meter-fill '+fillClass(p)+'" style="width:'+p+'%"></div></div></div>'}
async function refresh(){try{const r=await fetch('/api/stats');const d=await r.json();const u=d.usage;
document.getElementById('key-info').textContent = '🔑 ' + d.totalKeys + ' key(s) in pool | Active: ' + d.activeKey;
document.getElementById('meters').innerHTML=
  meter('Requests this minute (RPM pool)',u.currentMinuteRequests,d.freeTierLimits.rpm)+
  meter('Requests today (RPD pool)',u.todayRequests,d.freeTierLimits.rpd);
document.getElementById('cards').innerHTML=
  '<div class="card"><div class="val">'+u.totalRequests+'</div><div class="lbl">Total Requests</div></div>'+
  '<div class="card"><div class="val ok">'+u.totalSuccess+'</div><div class="lbl">Successful</div></div>'+
  '<div class="card '+(u.totalErrors?'danger':'')+'"><div class="val">'+u.totalErrors+'</div><div class="lbl">Errors</div></div>'+
  '<div class="card '+(u.totalRateLimited?'warn':'')+'"><div class="val">'+u.totalRateLimited+'</div><div class="lbl">Rate Limited</div></div>'+
  '<div class="card"><div class="val">'+u.todayRemaining+'</div><div class="lbl">Remaining Today</div></div>'+
  '<div class="card"><div class="val">'+u.avgResponseTimeMs+'ms</div><div class="lbl">Avg Response</div></div>'+
  '<div class="card"><div class="val">'+u.peakRPM+'</div><div class="lbl">Peak RPM</div></div>'+
  '<div class="card"><div class="val">'+Math.floor(u.totalRequests?(u.totalSuccess/u.totalRequests*100):100)+'%</div><div class="lbl">Success Rate</div></div>';
const logs=d.recentLogs||[];
document.getElementById('logs').innerHTML=logs.map(l=>'<tr><td>'+new Date(l.time).toLocaleTimeString()+'</td><td>'+(l.key||'-')+'</td><td>'+l.ip+'</td><td class="'+(l.status==='OK'?'ok':l.status==='ERROR'?'err':'rl')+'">'+l.status+'</td><td>'+(l.userMsg||'-').slice(0,80)+'</td><td>'+(l.reply||l.error||'-').slice(0,80)+'</td><td>'+(l.latencyMs||0)+'ms</td></tr>').join('');
}catch(e){console.error(e)}}
refresh();setInterval(refresh,3000);
</script></body></html>`);
});
// ─────────────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, "public")));
app.listen(process.env.PORT || 3000, () => {
  console.log(`TranzLife bot on :${process.env.PORT || 3000} ${MOCK ? "(MOCK)" : ""}`);
  if (!MOCK) selfTest();
});
