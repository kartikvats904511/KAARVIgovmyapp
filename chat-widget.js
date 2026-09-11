// Kaarvi floating chat widget — a small circular button on every page that
// opens a compact Kaarvi Assistant panel (text + voice), backed by /api/chat.
(function () {
  "use strict";

  const BCP47 = { English: "en-IN", Hindi: "hi-IN", Bengali: "bn-IN", Tamil: "ta-IN", Telugu: "te-IN", Marathi: "mr-IN" };
  const LANG_OPTIONS = [
    ["English", "English"], ["Hindi", "हिन्दी"], ["Bengali", "বাংলা"],
    ["Tamil", "தமிழ்"], ["Telugu", "తెలుగు"], ["Marathi", "मराठी"]
  ];

  function injectStyles() {
    if (document.getElementById("kaarviWidgetStyles")) return;
    const style = document.createElement("style");
    style.id = "kaarviWidgetStyles";
    style.textContent = `
.kw-fab{position:fixed;right:20px;bottom:20px;width:60px;height:60px;border-radius:50%;
  background:linear-gradient(135deg,var(--green,#16833b),var(--navy,#003478));color:#fff;border:none;
  box-shadow:0 10px 28px rgba(0,43,92,.32);cursor:pointer;z-index:9998;display:flex;align-items:center;
  justify-content:center;font-size:26px;transition:transform .18s, box-shadow .18s}
.kw-fab:hover{transform:translateY(-2px) scale(1.04);box-shadow:0 14px 34px rgba(0,43,92,.4)}
.kw-fab.kw-attn{animation:kw-pulse 1.8s ease-out 1}
@keyframes kw-pulse{0%{box-shadow:0 0 0 0 rgba(22,131,59,.55)}70%{box-shadow:0 0 0 16px rgba(22,131,59,0)}100%{box-shadow:0 0 0 0 rgba(22,131,59,0)}}
.kw-fab .kw-badge{position:absolute;top:-2px;right:-2px;width:14px;height:14px;border-radius:50%;background:var(--saffron,#f28c28);border:2px solid #fff}
body.kw-has-cartbar .kw-fab{bottom:78px}
body.kw-has-cartbar .kw-panel{bottom:150px}
@media (prefers-reduced-motion:reduce){
  .kw-fab.kw-attn,.kw-mic.kw-listening,.kw-panel,.kw-bubble{animation:none!important;transition:none!important}
}
.kw-panel{position:fixed;right:20px;bottom:92px;width:min(370px,92vw);max-height:min(560px,75vh);
  background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(0,43,92,.28);border:1px solid #e2e8f0;
  display:flex;flex-direction:column;overflow:hidden;z-index:9998;
  opacity:0;transform:translateY(14px) scale(.98);pointer-events:none;transition:opacity .16s, transform .16s}
.kw-panel.kw-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}
.kw-head{background:linear-gradient(90deg,var(--navy2,#002b5c),var(--navy,#003478));color:#fff;
  padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-shrink:0}
.kw-head-title{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:16px;line-height:1.15}
.kw-head-sub{font-size:11px;opacity:.85;margin-top:2px}
.kw-head-actions{display:flex;align-items:center;gap:6px}
.kw-icon-btn{background:rgba(255,255,255,.14);border:none;color:#fff;width:30px;height:30px;border-radius:8px;
  cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px}
.kw-icon-btn[aria-pressed="true"]{background:var(--saffron,#f28c28)}
.kw-lang{border:none;background:rgba(255,255,255,.14);color:#fff;border-radius:8px;padding:5px 6px;font-size:12px}
.kw-lang option{color:#17283b}
.kw-body{flex:1;overflow-y:auto;padding:14px;background:#f6f9fc;display:flex;flex-direction:column;gap:8px}
.kw-bubble{max-width:84%;padding:9px 12px;border-radius:13px;font-size:13.5px;line-height:1.45;white-space:pre-wrap}
.kw-bubble.user{align-self:flex-end;background:var(--green,#16833b);color:#fff;border-bottom-right-radius:4px}
.kw-bubble.bot{align-self:flex-start;background:#e7edf4;color:#17202a;border-bottom-left-radius:4px}
.kw-prompts{display:flex;gap:6px;flex-wrap:wrap;padding:0 14px 10px;flex-shrink:0}
.kw-prompts button{border:1px solid #ccd9e5;background:#fff;border-radius:999px;padding:5px 10px;
  font-size:11.5px;color:var(--navy,#003478);cursor:pointer}
.kw-form{display:flex;gap:6px;padding:10px;border-top:1px solid #e6ecf2;flex-shrink:0;background:#fff}
.kw-form input{flex:1;min-width:0;border:1px solid #ccd6df;border-radius:10px;padding:9px 11px;font-size:13.5px}
.kw-mic{width:38px;height:38px;min-width:38px;border-radius:50%;border:1px solid #dbe3ea;background:#fff;
  color:var(--navy,#003478);font-size:15px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
.kw-mic.kw-listening{background:var(--maroon,#7b2430);color:#fff;border-color:var(--maroon,#7b2430);animation:kw-mic-pulse 1.1s ease-in-out infinite}
@keyframes kw-mic-pulse{0%,100%{box-shadow:0 0 0 0 rgba(123,36,48,.45)}50%{box-shadow:0 0 0 8px rgba(123,36,48,0)}}
.kw-send{width:38px;height:38px;min-width:38px;border-radius:50%;border:none;background:var(--green,#16833b);
  color:#fff;font-size:15px;cursor:pointer;flex-shrink:0}
.kw-foot-link{font-size:11px;text-align:center;padding:0 12px 10px;color:#5f6e7d}
.kw-foot-link a{color:var(--navy,#003478);font-weight:600}
.kw-typing{display:inline-flex;gap:3px;align-items:center;padding:2px 0}
.kw-typing span{width:6px;height:6px;border-radius:50%;background:#8ea0b3;animation:kw-typing-bounce 1s infinite ease-in-out}
.kw-typing span:nth-child(2){animation-delay:.15s}
.kw-typing span:nth-child(3){animation-delay:.3s}
@keyframes kw-typing-bounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-4px);opacity:1}}
@media (prefers-reduced-motion:reduce){.kw-typing span{animation:none;opacity:.8}}
@media (max-width:480px){.kw-panel{right:10px;left:10px;width:auto;bottom:84px}.kw-fab{right:16px;bottom:16px}}
`;
    document.head.appendChild(style);
  }

  function buildDom() {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <button type="button" class="kw-fab kw-attn" id="kwFab" aria-haspopup="dialog" aria-expanded="false" aria-controls="kwPanel" aria-label="Open Kaarvi Assistant">
        💬<span class="kw-badge"></span>
      </button>
      <section class="kw-panel" id="kwPanel" role="dialog" aria-label="Kaarvi Assistant" aria-hidden="true">
        <div class="kw-head">
          <div>
            <div class="kw-head-title">Kaarvi Assistant</div>
            <div class="kw-head-sub" id="kwStatus">Demo assistant active</div>
          </div>
          <div class="kw-head-actions">
            <select class="kw-lang" id="kwLang" aria-label="Chat language"></select>
            <button type="button" class="kw-icon-btn" id="kwSpeak" aria-pressed="false" title="Toggle voice replies">🔊</button>
            <button type="button" class="kw-icon-btn" id="kwClose" title="Close" aria-label="Close assistant">✕</button>
          </div>
        </div>
        <div class="kw-body" id="kwBody" aria-live="polite"></div>
        <div class="kw-prompts">
          <button type="button" data-prompt="How does dynamic pricing work?">Pricing</button>
          <button type="button" data-prompt="How do I create a product listing?">Listing</button>
          <button type="button" data-prompt="How do I place an order?">Orders</button>
        </div>
        <form class="kw-form" id="kwForm">
          <button type="button" class="kw-mic" id="kwMic" title="Speak your question" aria-label="Speak your question">🎤</button>
          <input id="kwInput" maxlength="2000" placeholder="Ask Kaarvi Assistant…" autocomplete="off" required>
          <button type="submit" class="kw-send" aria-label="Send">➤</button>
        </form>
        <div class="kw-foot-link">Full assistant: <a href="chatbot.html">open Help page</a></div>
      </section>
    `;
    document.body.appendChild(wrap);
  }

  function init() {
    injectStyles();
    if (document.querySelector(".cartbar")) document.body.classList.add("kw-has-cartbar");
    buildDom();

    const fab = document.getElementById("kwFab");
    const badge = fab.querySelector(".kw-badge");
    if (localStorage.getItem("kaarvi_widget_seen") === "1") {
      fab.classList.remove("kw-attn");
      badge.style.display = "none";
    }
    const panel = document.getElementById("kwPanel");
    const closeBtn = document.getElementById("kwClose");
    const body = document.getElementById("kwBody");
    const form = document.getElementById("kwForm");
    const input = document.getElementById("kwInput");
    const langSel = document.getElementById("kwLang");
    const speakBtn = document.getElementById("kwSpeak");
    const micBtn = document.getElementById("kwMic");
    const statusEl = document.getElementById("kwStatus");

    LANG_OPTIONS.forEach(([value, label]) => {
      const o = document.createElement("option");
      o.value = value; o.textContent = label;
      langSel.appendChild(o);
    });
    const savedLang = localStorage.getItem("kaarvi_chat_lang");
    if (savedLang) langSel.value = savedLang;
    langSel.addEventListener("change", () => localStorage.setItem("kaarvi_chat_lang", langSel.value));

    function bubble(text, who) {
      const d = document.createElement("div");
      d.className = "kw-bubble " + who;
      d.textContent = text;
      body.appendChild(d);
      body.scrollTop = body.scrollHeight;
      return d;
    }
    function typingBubble() {
      const d = document.createElement("div");
      d.className = "kw-bubble bot";
      d.innerHTML = '<span class="kw-typing"><span></span><span></span><span></span></span>';
      body.appendChild(d);
      body.scrollTop = body.scrollHeight;
      return d;
    }
    bubble("Hi! I’m Kaarvi Assistant. Ask me anything about Kaarvi, or tap 🎤 to speak.", "bot");

    fetch("/api/health").then(r => r.json()).then(d => {
      statusEl.textContent = d.chatbotConfigured ? "Gemini AI connected" : "Demo assistant active";
    }).catch(() => { statusEl.textContent = "Demo assistant active"; });

    let open = false;
    function setOpen(next) {
      open = next;
      panel.classList.toggle("kw-open", open);
      panel.setAttribute("aria-hidden", String(!open));
      fab.setAttribute("aria-expanded", String(open));
      if (open) {
        fab.classList.remove("kw-attn");
        badge.style.display = "none";
        localStorage.setItem("kaarvi_widget_seen", "1");
        input.focus(); body.scrollTop = body.scrollHeight;
      }
    }
    fab.addEventListener("click", () => setOpen(!open));
    closeBtn.addEventListener("click", () => setOpen(false));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) setOpen(false); });
    document.addEventListener("click", (e) => {
      if (open && !panel.contains(e.target) && !fab.contains(e.target)) setOpen(false);
    });

    // Voice replies (text-to-speech)
    const synthSupported = "speechSynthesis" in window;
    let speakEnabled = localStorage.getItem("kaarvi_voice_out") === "1";
    function refreshSpeak() {
      speakBtn.setAttribute("aria-pressed", String(speakEnabled));
      speakBtn.title = speakEnabled ? "Voice replies on" : "Voice replies off";
    }
    refreshSpeak();
    if (!synthSupported) { speakBtn.disabled = true; speakBtn.style.opacity = ".4"; }
    speakBtn.addEventListener("click", () => {
      if (!synthSupported) return;
      speakEnabled = !speakEnabled;
      localStorage.setItem("kaarvi_voice_out", speakEnabled ? "1" : "0");
      refreshSpeak();
      if (!speakEnabled) window.speechSynthesis.cancel();
    });
    function speak(text) {
      if (!synthSupported || !speakEnabled || !text) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = BCP47[langSel.value] || "en-IN";
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => v.lang === u.lang) || voices.find(v => v.lang && v.lang.startsWith(u.lang.slice(0, 2)));
      if (match) u.voice = match;
      window.speechSynthesis.speak(u);
    }

    // Voice input (speech-to-text)
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => { micBtn.classList.add("kw-listening"); micBtn.textContent = "●"; };
      recognition.onend = () => { micBtn.classList.remove("kw-listening"); micBtn.textContent = "🎤"; };
      recognition.onerror = () => { micBtn.classList.remove("kw-listening"); micBtn.textContent = "🎤"; };
      recognition.onresult = (e) => { const t = e.results[0][0].transcript; input.value = t; sendMessage(t); };
      micBtn.addEventListener("click", () => {
        recognition.lang = BCP47[langSel.value] || "en-IN";
        try { recognition.start(); } catch (_) { /* already starting */ }
      });
    } else {
      micBtn.disabled = true; micBtn.style.opacity = ".4";
      micBtn.title = "Voice input isn't supported in this browser";
    }

    async function sendMessage(text) {
      text = (text || "").trim();
      if (!text) return;
      bubble(text, "user");
      input.value = "";
      const typing = typingBubble();
      try {
        const r = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, language: langSel.value })
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Request failed");
        const reply = d.reply || "Sorry, I couldn't answer that.";
        typing.textContent = reply;
        speak(reply);
      } catch (err) {
        typing.textContent = "Sorry, the assistant could not be reached. Please try again.";
      }
      body.scrollTop = body.scrollHeight;
    }

    form.addEventListener("submit", (e) => { e.preventDefault(); sendMessage(input.value); });
    document.querySelectorAll("#kwPanel [data-prompt]").forEach(b =>
      b.addEventListener("click", () => sendMessage(b.dataset.prompt))
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
