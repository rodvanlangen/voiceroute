// voice.js — wrapper om de Web Speech API

class VoiceRecognition {
  constructor({ onInterim, onFinal, onStart, onEnd, onError }) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      throw new Error(
        'Spraakherkenning wordt niet ondersteund. Gebruik Chrome op Android.'
      );
    }

    this.recognition = new SR();
    this.onInterim = onInterim;
    this.onFinal   = onFinal;
    this.onStart   = onStart;
    this.onEnd     = onEnd;
    this.onError   = onError;
    this.active    = false;

    this._setup();
  }

  _setup() {
    const r = this.recognition;
    r.continuous      = false;
    r.interimResults  = true;
    r.maxAlternatives = 1;

    r.onstart = () => {
      this.active = true;
      this.onStart?.();
    };

    r.onend = () => {
      this.active = false;
      this.onEnd?.();
    };

    r.onerror = (e) => {
      this.active = false;
      // 'no-speech' is niet echt een fout, gewoon stilte
      if (e.error === 'no-speech') {
        this.onEnd?.();
      } else {
        this.onError?.(e.error);
      }
    };

    r.onresult = (e) => {
      let interim = '';
      let final   = '';

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }

      if (interim) this.onInterim?.(interim);
      if (final)   this.onFinal?.(final);
    };
  }

  setLang(lang) {
    this.recognition.lang = lang || 'nl-NL';
  }

  start(lang) {
    if (this.active) return;
    if (lang) this.recognition.lang = lang;
    this.recognition.start();
  }

  stop() {
    if (!this.active) return;
    this.recognition.stop();
  }
}
