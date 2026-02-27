// app.js — hoofdcontroller: spraak → AI webhook → UI

// ── DOM-elementen ────────────────────────────────────────────────────────────
const micBtn         = document.getElementById('mic-btn');
const pulseRing      = document.getElementById('pulse-ring');
const statusIcon     = document.getElementById('status-icon');
const statusText     = document.getElementById('status-text');
const transcriptCard = document.getElementById('transcript-card');
const transcriptText = document.getElementById('transcript-text');
const resultCard     = document.getElementById('result-card');
const resultIcon     = document.getElementById('result-icon');
const resultTxt      = document.getElementById('result-text');
const appTitle       = document.getElementById('app-title');
const micHint        = document.getElementById('mic-hint');

// Settings panel
const settingsBtn     = document.getElementById('settings-btn');
const settingsPanel   = document.getElementById('settings-panel');
const settingsOverlay = document.getElementById('settings-overlay');
const settingsClose   = document.getElementById('settings-close');
const saveSettings_   = document.getElementById('save-settings');

const cfgAppName    = document.getElementById('cfg-app-name');
const cfgAiWebhook  = document.getElementById('cfg-ai-webhook');
const cfgLang       = document.getElementById('cfg-lang');

// History
const historyList  = document.getElementById('history-list');
const clearHistory = document.getElementById('clear-history');

// ── Toestand ─────────────────────────────────────────────────────────────────
let voice    = null;
let settings = getSettings();

// ── Push-to-talk ──────────────────────────────────────────────────────────────
let holdTimer    = null;
const HOLD_MS    = 200; // ms ingedrukt houden voor push-to-talk modus
let pushToTalk   = false;

micBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (!voice) return;

  holdTimer = setTimeout(() => {
    pushToTalk = true;
    if (!voice.active) {
      transcriptCard.classList.add('hidden');
      voice.start(settings.lang);
    }
  }, HOLD_MS);
});

micBtn.addEventListener('pointerup', () => {
  clearTimeout(holdTimer);
  if (pushToTalk) {
    // Loslaten → stop opname
    pushToTalk = false;
    if (voice?.active) voice.stop();
  } else {
    // Korte tik → toggle aan/uit
    if (!voice) return;
    if (voice.active) {
      voice.stop();
      setState('idle');
    } else {
      transcriptCard.classList.add('hidden');
      voice.start(settings.lang);
    }
  }
});

micBtn.addEventListener('pointerleave', () => {
  clearTimeout(holdTimer);
  if (pushToTalk) {
    pushToTalk = false;
    if (voice?.active) voice.stop();
  }
});

// ── Spraakherkenning initialiseren ───────────────────────────────────────────
function initVoice() {
  try {
    voice = new VoiceRecognition({
      onStart() {
        setState('listening');
      },
      onInterim(text) {
        showTranscript(text, true);
      },
      onFinal(text) {
        handleFinal(text);
      },
      onEnd() {
        if (micBtn.classList.contains('listening')) {
          setState('idle');
        }
      },
      onError(err) {
        const msgs = {
          'not-allowed': 'Microfoontoestemming geweigerd. Sta toegang toe in je browser.',
          'network':     'Netwerkfout. Controleer je internetverbinding.',
          'aborted':     null
        };
        const msg = msgs[err] ?? `Fout: ${err}`;
        if (msg) setState('error', msg);
        else     setState('idle');
      }
    });
    voice.setLang(settings.lang);
  } catch (e) {
    setState('error', e.message);
    micBtn.disabled = true;
  }
}

// ── Verwerk definitieve transcriptie ─────────────────────────────────────────
async function handleFinal(text) {
  setState('processing');
  showTranscript(text, false);

  try {
    const result = await sendToDestination(text);

    // Make.com kan optioneel terugsturen welke bestemming de AI heeft gekozen
    const label = result?.label || 'AI';
    const color = result?.color || '#6366f1';

    setState('success', `Verstuurd via ${label} ✓`);
    addHistory({ label, color, content: text });
  } catch (e) {
    setState('error', e.message);
  }
}

// ── UI-toestand ───────────────────────────────────────────────────────────────
function setState(state, message) {
  micBtn.className = 'mic-btn';
  pulseRing.classList.add('hidden');
  resultCard.classList.add('hidden');

  const icons = {
    idle:       '🎤',
    listening:  '🎤',
    processing: '🤖',
    success:    '✅',
    error:      '❌'
  };

  let text;
  if      (state === 'idle')       text = 'Tik of houd ingedrukt om in te spreken';
  else if (state === 'listening')  text = 'Luisteren… laat los of tik om te stoppen';
  else if (state === 'processing') text = 'AI verwerkt je bericht…';
  else if (state === 'success')    text = message ?? 'Verstuurd!';
  else if (state === 'error')      text = message ?? 'Er ging iets mis';

  statusIcon.textContent = icons[state] ?? '🎤';
  statusText.textContent = text;

  if (state === 'listening') {
    micBtn.classList.add('listening');
    pulseRing.classList.remove('hidden');
  }

  if (state === 'success' || state === 'error') {
    resultCard.classList.remove('hidden');
    resultCard.className   = `result-card ${state}`;
    resultIcon.textContent = state === 'success' ? '✓' : '✕';
    resultTxt.textContent  = message ?? '';
    setTimeout(() => {
      resultCard.classList.add('hidden');
      setState('idle');
    }, 3000);
  }
}

function showTranscript(text, interim) {
  transcriptCard.classList.remove('hidden');
  transcriptText.textContent = text;
  transcriptText.classList.toggle('interim', interim);
}

// ── Geschiedenis ─────────────────────────────────────────────────────────────
function addHistory(item) {
  const history = JSON.parse(localStorage.getItem('voiceroute_history') || '[]');
  history.unshift({
    label:   item.label,
    color:   item.color,
    content: item.content,
    time:    new Date().toISOString()
  });
  localStorage.setItem('voiceroute_history', JSON.stringify(history.slice(0, 50)));
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem('voiceroute_history') || '[]');
  if (!history.length) {
    historyList.innerHTML = '<p class="history-empty">Nog geen items</p>';
    return;
  }
  historyList.innerHTML = history.map(item => {
    const d    = new Date(item.time);
    const time = d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
               + ' ' + d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    return `
      <div class="history-item">
        <span class="history-badge" style="background:${item.color}">${item.label}</span>
        <span class="history-content">${escHtml(item.content)}</span>
        <span class="history-time">${time}</span>
      </div>`;
  }).join('');
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

clearHistory.addEventListener('click', () => {
  localStorage.removeItem('voiceroute_history');
  renderHistory();
});

// ── Instellingen ─────────────────────────────────────────────────────────────
function openSettings() {
  settings = getSettings();
  cfgAppName.value   = settings.appName   || '';
  cfgAiWebhook.value = settings.aiWebhook || '';
  cfgLang.value      = settings.lang      || 'nl-NL';

  settingsPanel.classList.remove('hidden');
  settingsOverlay.classList.remove('hidden');
}

function closeSettings_() {
  settingsPanel.classList.add('hidden');
  settingsOverlay.classList.add('hidden');
}

settingsBtn.addEventListener('click', openSettings);
settingsClose.addEventListener('click', closeSettings_);
settingsOverlay.addEventListener('click', closeSettings_);

saveSettings_.addEventListener('click', () => {
  settings = {
    appName:   cfgAppName.value.trim() || 'VoiceRoute',
    lang:      cfgLang.value,
    aiWebhook: cfgAiWebhook.value.trim()
  };
  saveSettings(settings);
  if (voice) voice.setLang(settings.lang);
  appTitle.textContent = settings.appName;
  closeSettings_();
  setState('success', 'Instellingen opgeslagen');
});

// ── Opstarten ────────────────────────────────────────────────────────────────
(function init() {
  appTitle.textContent = settings.appName || 'VoiceRoute';
  initVoice();
  renderHistory();

  // Eerste keer: direct instellingen openen als er geen webhook is
  const s = getSettings();
  if (!s.aiWebhook) {
    setTimeout(openSettings, 600);
  }
})();
