// app.js — hoofdcontroller: verbindt spraak → router → API → UI

// ── DOM-elementen ────────────────────────────────────────────────────────────
const micBtn         = document.getElementById('mic-btn');
const pulseRing      = document.getElementById('pulse-ring');
const statusIcon     = document.getElementById('status-icon');
const statusText     = document.getElementById('status-text');
const transcriptCard = document.getElementById('transcript-card');
const transcriptText = document.getElementById('transcript-text');
const routeBadge     = document.getElementById('route-badge');
const resultCard     = document.getElementById('result-card');
const resultIcon     = document.getElementById('result-icon');
const resultTxt      = document.getElementById('result-text');
const appTitle       = document.getElementById('app-title');

// Settings panel
const settingsBtn     = document.getElementById('settings-btn');
const settingsPanel   = document.getElementById('settings-panel');
const settingsOverlay = document.getElementById('settings-overlay');
const settingsClose   = document.getElementById('settings-close');
const saveSettings_   = document.getElementById('save-settings');

const cfgAppName      = document.getElementById('cfg-app-name');
const cfgTodoist      = document.getElementById('cfg-todoist');
const cfgOutlookTodo  = document.getElementById('cfg-outlook-todo');
const cfgGmail        = document.getElementById('cfg-gmail');
const cfgOutlookMail  = document.getElementById('cfg-outlook-mail');
const cfgObsidian     = document.getElementById('cfg-obsidian');
const cfgLang         = document.getElementById('cfg-lang');

// History
const historyList  = document.getElementById('history-list');
const clearHistory = document.getElementById('clear-history');

// Bestemming iconen
const destBtns = document.querySelectorAll('.dest-icon-btn');

// ── Toestand ─────────────────────────────────────────────────────────────────
let voice        = null;
let settings     = getSettings();
let selectedDest = null; // ROUTES-entry van gekozen bestemming

// ── Bestemming selecteren ─────────────────────────────────────────────────────
function setSelectedDest(route) {
  selectedDest = route;
  destBtns.forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.dest === route?.dest);
    btn.classList.remove('listening');
  });
}

destBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const route = getRouteByDest(btn.dataset.dest);
    if (!route) return;

    // Als mic actief is: stop eerst
    if (voice?.active) {
      voice.stop();
    }

    setSelectedDest(route);
    transcriptCard.classList.add('hidden');

    // Kleine vertraging zodat stop verwerkt is voor we opnieuw starten
    setTimeout(() => {
      if (!voice?.active) voice?.start(settings.lang);
    }, 80);
  });
});

// ── Spraakherkenning initialiseren ───────────────────────────────────────────
function initVoice() {
  try {
    voice = new VoiceRecognition({
      onStart() {
        setState('listening');
      },
      onInterim(text) {
        showTranscript(text, selectedDest, true);
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
  showTranscript(text, selectedDest, false);

  // Gebruik geselecteerde bestemming; val terug op trefwoord-detectie als er geen is
  const route = selectedDest
    ? { ...selectedDest, content: text }
    : detectRoute(text);

  if (!route) {
    setState('error', 'Kies eerst een bestemming (of begin met "todoist", "werk taak" enz.)');
    return;
  }

  try {
    await sendToDestination(route);
    setState('success', `Verstuurd naar ${route.label} ✓`);
    addHistory(route);
  } catch (e) {
    setState('error', e.message);
  }
}

// ── UI-toestand ───────────────────────────────────────────────────────────────
function setState(state, message) {
  micBtn.className = 'mic-btn';
  pulseRing.classList.add('hidden');
  resultCard.classList.add('hidden');
  destBtns.forEach(btn => btn.classList.remove('listening'));

  const icons = { idle: '💬', listening: '🎤', processing: '⏳', success: '✅', error: '❌' };

  let text;
  if (state === 'idle') {
    text = selectedDest
      ? `Tik op ${selectedDest.label} om opnieuw in te spreken`
      : 'Kies een bestemming';
  } else if (state === 'listening') {
    text = selectedDest
      ? `Luisteren voor ${selectedDest.label}…`
      : 'Luisteren… spreek je bericht in';
  } else if (state === 'processing') {
    text = 'Verwerken…';
  } else if (state === 'success') {
    text = message ?? 'Verstuurd!';
  } else if (state === 'error') {
    text = message ?? 'Er ging iets mis';
  }

  statusIcon.textContent = icons[state] ?? '💬';
  statusText.textContent = text;

  if (state === 'listening') {
    micBtn.classList.add('listening');
    pulseRing.classList.remove('hidden');
    // Laat het geselecteerde icoon pulsen
    if (selectedDest) {
      const activeBtn = document.querySelector(`.dest-icon-btn[data-dest="${selectedDest.dest}"]`);
      activeBtn?.classList.add('listening');
    }
  }

  if (state === 'success' || state === 'error') {
    resultCard.classList.remove('hidden');
    resultCard.className = `result-card ${state}`;
    resultIcon.textContent = state === 'success' ? '✓' : '✕';
    resultTxt.textContent  = message ?? '';
    setTimeout(() => {
      resultCard.classList.add('hidden');
      setState('idle');
    }, 3000);
  }
}

function showTranscript(text, route, interim) {
  transcriptCard.classList.remove('hidden');
  transcriptText.textContent = text;
  transcriptText.classList.toggle('interim', interim);

  if (route) {
    routeBadge.textContent      = route.label;
    routeBadge.style.background = route.color;
    routeBadge.classList.remove('hidden');
  } else {
    routeBadge.classList.add('hidden');
  }
}

// ── Mic-knop (handmatig stoppen / starten) ────────────────────────────────────
micBtn.addEventListener('click', () => {
  if (!voice) return;
  if (voice.active) {
    voice.stop();
    setState('idle');
  } else {
    if (!selectedDest) {
      setState('error', 'Kies eerst een bestemming.');
      return;
    }
    transcriptCard.classList.add('hidden');
    voice.start(settings.lang);
  }
});

// ── Geschiedenis ─────────────────────────────────────────────────────────────
function addHistory(route) {
  const history = JSON.parse(localStorage.getItem('voiceroute_history') || '[]');
  history.unshift({
    dest:    route.dest,
    label:   route.label,
    color:   route.color,
    content: route.content,
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
    const d = new Date(item.time);
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
  cfgAppName.value     = settings.appName                        || '';
  cfgTodoist.value     = settings.webhooks['todoist']            || '';
  cfgOutlookTodo.value = settings.webhooks['outlook-todo']       || '';
  cfgGmail.value       = settings.webhooks['gmail']              || '';
  cfgOutlookMail.value = settings.webhooks['outlook-mail']       || '';
  cfgObsidian.value    = settings.webhooks['obsidian']           || '';
  cfgLang.value        = settings.lang                           || 'nl-NL';

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
    appName: cfgAppName.value.trim() || 'VoiceRoute',
    lang: cfgLang.value,
    webhooks: {
      'todoist':      cfgTodoist.value.trim(),
      'outlook-todo': cfgOutlookTodo.value.trim(),
      'gmail':        cfgGmail.value.trim(),
      'outlook-mail': cfgOutlookMail.value.trim(),
      'obsidian':     cfgObsidian.value.trim()
    }
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

  // Eerste keer: direct instellingen openen als er geen webhooks zijn
  const s = getSettings();
  const hasAny = Object.values(s.webhooks).some(v => v);
  if (!hasAny) {
    setTimeout(openSettings, 600);
  }
})();
