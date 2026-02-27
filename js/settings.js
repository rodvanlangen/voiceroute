// settings.js — laadt en slaat instellingen op in localStorage

const STORAGE_KEY = 'voiceroute_settings';

const DEFAULTS = {
  appName: 'VoiceRoute',
  lang: 'nl-NL',
  webhooks: {
    todoist: '',
    'outlook-todo': '',
    gmail: '',
    'outlook-mail': '',
    obsidian: ''
  }
};

function getSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return structuredClone(DEFAULTS);
    return Object.assign(structuredClone(DEFAULTS), JSON.parse(stored));
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
