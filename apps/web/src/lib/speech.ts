/**
 * Speech output. For now this is the browser's built-in Web Speech voice; the
 * offline neural voice (Piper or sherpa-onnx in WASM) will plug in behind the
 * same interface.
 */
export interface SpeechOutput {
  readonly available: boolean;
  speak(text: string): void;
  stop(): void;
}

class WebSpeech implements SpeechOutput {
  readonly available = true;
  private voice: SpeechSynthesisVoice | null = null;

  constructor(private readonly lang: string) {
    this.pickVoice();
    speechSynthesis.addEventListener('voiceschanged', () => this.pickVoice());
  }

  /** Prefer voices that run on the device, so speech keeps working offline. */
  private pickVoice() {
    const voices = speechSynthesis.getVoices();
    const want = this.lang.toLowerCase();
    const base = want.split('-')[0] ?? want;
    const sameLanguage = (v: SpeechSynthesisVoice) =>
      v.lang.toLowerCase().replace('_', '-').split('-')[0] === base;
    this.voice =
      voices.find((v) => v.localService && v.lang.toLowerCase() === want) ??
      voices.find((v) => v.localService && sameLanguage(v)) ??
      voices.find(sameLanguage) ??
      null;
  }

  speak(text: string) {
    if (text.trim() === '') return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.voice?.lang ?? this.lang;
    if (this.voice) utterance.voice = this.voice;
    speechSynthesis.speak(utterance);
  }

  stop() {
    speechSynthesis.cancel();
  }
}

const silent: SpeechOutput = { available: false, speak() {}, stop() {} };

export const speech: SpeechOutput =
  typeof speechSynthesis === 'undefined' ? silent : new WebSpeech(navigator.language || 'en');
