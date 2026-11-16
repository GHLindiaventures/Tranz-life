/* TranzLife chat widget. Embed on any page:
   <script src="https://YOUR-BOT-HOST/chatbot.js" data-api="https://YOUR-BOT-HOST"></script> */
(function () {
  const script = document.currentScript;
  const API = (script && script.dataset.api) || "";
  const css = `
  #tl-btn{position:fixed;right:20px;bottom:20px;width:60px;height:60px;border-radius:50%;border:0;cursor:pointer;background:#1f6b3a;color:#fff;font-size:26px;box-shadow:0 6px 20px rgba(0,0,0,.25);z-index:99998}
  #tl-box{position:fixed;right:20px;bottom:92px;width:370px;max-width:calc(100vw - 24px);height:540px;max-height:calc(100vh - 110px);background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.28);display:none;flex-direction:column;overflow:hidden;z-index:99999;font:14px/1.45 system-ui,Segoe UI,Roboto,sans-serif;color:#1c2a22}
  #tl-box.open{display:flex}
  #tl-head{background:linear-gradient(135deg,#1f6b3a,#2f8f52);color:#fff;padding:14px 16px}
  #tl-head b{display:block;font-size:15px}#tl-head span{font-size:12px;opacity:.85}
  #tl-msgs{flex:1;overflow-y:auto;padding:14px;background:#f6f8f5}
  .tl-m{max-width:86%;padding:9px 12px;border-radius:14px;margin:0 0 10px;white-space:pre-wrap;word-wrap:break-word}
  .tl-bot{background:#fff;border:1px solid #e1e8e0;border-bottom-left-radius:4px}
  .tl-user{background:#1f6b3a;color:#fff;margin-left:auto;border-bottom-right-radius:4px}
  #tl-chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px}
  .tl-chip{border:1px solid #1f6b3a;color:#1f6b3a;background:#fff;border-radius:16px;padding:5px 10px;font-size:12.5px;cursor:pointer}
  .tl-chip:hover{background:#1f6b3a;color:#fff}
  #tl-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e1e8e0;background:#fff}
  #tl-in{flex:1;border:1px solid #cfd8cf;border-radius:20px;padding:9px 14px;font:inherit;outline:none}
  #tl-in:focus{border-color:#1f6b3a}
  #tl-send{border:0;background:#1f6b3a;color:#fff;border-radius:20px;padding:0 16px;cursor:pointer;font:inherit}
  #tl-send:disabled{opacity:.5}
  #tl-note{font-size:11px;color:#6b7a70;text-align:center;padding:0 10px 8px;background:#fff}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const btn = document.createElement("button"); btn.id = "tl-btn"; btn.setAttribute("aria-label", "Open chat"); btn.textContent = "💬";
  const box = document.createElement("div"); box.id = "tl-box";
  box.innerHTML = `<div id="tl-head"><b>TranzLife Assistant</b><span>Ask about our 6 wellness products</span></div>
  <div id="tl-msgs" aria-live="polite"></div>
  <form id="tl-form"><input id="tl-in" placeholder="Type your question…" maxlength="500" autocomplete="off"><button id="tl-send">Send</button></form>
  <div id="tl-note">General wellness information, not medical advice.</div>`;
  document.body.append(btn, box);

  const msgs = box.querySelector("#tl-msgs"), form = box.querySelector("#tl-form"),
        input = box.querySelector("#tl-in"), send = box.querySelector("#tl-send");
  const history = [];
  const chips = ["Which product is right for me?", "Energy Booster", "Lung Booster (PulmoClear)", "Liver Booster", "Reviva Roll-on", "CycleRelief", "BreatheFree Inhaler", "How do I contact you?"];

  function add(role, text) {
    const d = document.createElement("div"); d.className = "tl-m " + (role === "user" ? "tl-user" : "tl-bot");
    d.textContent = text; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d;
  }
  function greet() {
    add("bot", "Hi! I'm the TranzLife assistant. I can tell you about our Energy Booster, Lung Booster, Liver Booster, Reviva, CycleRelief and BreatheFree. What would you like to know?");
    const c = document.createElement("div"); c.id = "tl-chips";
    chips.forEach(t => { const b = document.createElement("button"); b.className = "tl-chip"; b.type = "button"; b.textContent = t; b.onclick = () => { c.remove(); ask(t); }; c.appendChild(b); });
    msgs.appendChild(c);
  }
  async function ask(text) {
    add("user", text); history.push({ role: "user", content: text });
    const typing = add("bot", "…"); send.disabled = true;
    try {
      const r = await fetch(API + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history }) });
      const j = await r.json();
      const reply = j.reply || ((j.error || "Something went wrong.") + (j.debug ? "\n[debug] " + j.debug : ""));
      typing.textContent = reply; if (j.reply) history.push({ role: "assistant", content: reply });
    } catch (e) { typing.textContent = "Connection problem. Please try again."; }
    send.disabled = false; msgs.scrollTop = msgs.scrollHeight; input.focus();
  }
  form.onsubmit = e => { e.preventDefault(); const t = input.value.trim(); if (!t) return; input.value = ""; const c = msgs.querySelector("#tl-chips"); if (c) c.remove(); ask(t); };
  let greeted = false;
  btn.onclick = () => { box.classList.toggle("open"); if (!greeted) { greeted = true; greet(); } if (box.classList.contains("open")) input.focus(); };
})();
