/**
 * Speech output. For now this is the browser's built-in Web Speech voice; the
 * offline neural voice (Piper or sherpa-onnx in WASM) will plug in behind the
 * same interface.
 */

export interface VoiceInfo {
  /** Stable id for settings. voiceURI isn't unique across browsers, so name + language. */
  key: string;
  name: string;
  lang: string;
  /** Runs on the device, so it keeps working offline. */
  local: boolean;
  /** A joke voice (Apple's Bells, Bubbles, Zarvox…); not offered as a main choice. */
  novelty: boolean;
}

export interface SpeakOptions {
  voice: string | null;
  rate: number;
  pitch: number;
  /** 0–1. */
  volume: number;
  /** Language of the text; picks the default voice when none is chosen. */
  lang: string;
}

export interface SpeechOutput {
  readonly available: boolean;
  speak(text: string, options?: Partial<SpeakOptions>): void;
  stop(): void;
  /** True while something is being said. */
  readonly speaking: boolean;
  /** The device's voices, ranked for a language (default: the device's language). */
  voices(lang?: string): VoiceInfo[];
  /** Calls back when the browser's voice list changes; returns an unsubscribe. */
  onVoicesChanged(callback: () => void): () => void;
}

/** The parts of SpeechSynthesisVoice we rank by. */
export interface RawVoice {
  name: string;
  lang: string;
  localService: boolean;
  default?: boolean;
}

export const voiceKey = (voice: { name: string; lang: string }) => `${voice.name}|${voice.lang}`;

export const baseLanguage = (lang: string) =>
  lang.toLowerCase().replace('_', '-').split('-')[0] ?? '';

const NOVELTY = new Set([
  'Albert',
  'Bad News',
  'Bahh',
  'Bells',
  'Boing',
  'Bubbles',
  'Cellos',
  'Good News',
  'Jester',
  'Organ',
  'Superstar',
  'Trinoids',
  'Whisper',
  'Wobble',
  'Zarvox',
]);

const isNovelty = (name: string) => NOVELTY.has(name.replace(/\s*\(.*\)\s*$/, ''));

/** Apple marks its better voices "(Enhanced)" and "(Premium)". */
const quality = (name: string) => (/premium/i.test(name) ? 2 : /enhanced/i.test(name) ? 1 : 0);

/**
 * The app's language first, then better quality, then by name. Browsers can
 * list the same voice twice, so duplicates (same name and language) are dropped.
 */
export function rankVoices(voices: RawVoice[], lang: string): VoiceInfo[] {
  const base = baseLanguage(lang);
  const seen = new Set<string>();
  return voices
    .filter((v) => {
      const key = voiceKey(v);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((v) => ({
      key: voiceKey(v),
      name: v.name,
      lang: v.lang,
      local: v.localService,
      novelty: isNovelty(v.name),
    }))
    .sort(
      (a, b) =>
        Number(baseLanguage(b.lang) === base) - Number(baseLanguage(a.lang) === base) ||
        quality(b.name) - quality(a.name) ||
        a.name.localeCompare(b.name),
    );
}

/**
 * The voice to use when none is chosen: on-device first (so it works offline),
 * then the exact regional language, better quality, and the system default.
 */
export function pickDefaultVoice<V extends RawVoice>(voices: V[], lang: string): V | null {
  const want = lang.toLowerCase();
  const score = (v: V) =>
    (v.localService ? 8 : 0) +
    (v.lang.toLowerCase().replace('_', '-') === want ? 4 : 0) +
    quality(v.name) +
    (v.default ? 0.5 : 0);
  const candidates = voices.filter(
    (v) => baseLanguage(v.lang) === baseLanguage(want) && !isNovelty(v.name),
  );
  return candidates.sort((a, b) => score(b) - score(a))[0] ?? null;
}

/**
 * Ask for "playback" audio, which iOS Safari plays even when the ring/silent
 * switch is on silent. A voice that goes quiet in silent mode is no voice at all.
 */
export function preferPlaybackAudio() {
  const session = (navigator as { audioSession?: { type: string } }).audioSession;
  if (session && session.type !== 'playback') session.type = 'playback';
}

/**
 * iOS reads a capital letter on its own as a character ("capital I"). In
 * lower case it's read as the letter, which for "I" is the word.
 */
export function asWord(text: string, lang: string): string {
  const word = text.trim();
  return /^\p{Lu}$/u.test(word) ? word.toLocaleLowerCase(lang) : text;
}

/** Events every browser counts as a tap or key press that may start speech. */
const GESTURES = ['touchend', 'click', 'keydown', 'mouseup'] as const;
/** How long a word that didn't start waits for the rest of its tap. */
const RETRY_MS = 1000;

/**
 * The browser's built-in voices. iOS only starts speech from an event it
 * counts as a tap (touchend or click), not from pointerdown, where words are
 * chosen; a word spoken there is silently dropped. Chrome on Android is
 * similar. So until speech has started once, a word that didn't start is said
 * again from the same tap's touchend or click, and a tap with nothing to say
 * unlocks speech with a silent utterance. After that, speech starts from
 * anywhere.
 */
export class WebSpeech implements SpeechOutput {
  readonly available = true;
  /** Speech has started once, so the browser lets it start at any time. */
  private started = false;
  private waiting: { utterance: SpeechSynthesisUtterance; at: number } | null = null;

  constructor(
    private readonly lang: string,
    private readonly synth: SpeechSynthesis = speechSynthesis,
    events: EventTarget = globalThis,
  ) {
    for (const type of GESTURES) {
      events.addEventListener(type, this.unlock, { capture: true, passive: true });
    }
  }

  private readonly markStarted = () => {
    this.started = true;
    this.waiting = null;
  };

  private readonly unlock = () => {
    if (this.started || this.synth.speaking || this.synth.pending) return;
    const waiting = this.waiting;
    this.waiting = null;
    let utterance: SpeechSynthesisUtterance;
    if (waiting && Date.now() - waiting.at < RETRY_MS) {
      utterance = waiting.utterance;
    } else {
      utterance = new SpeechSynthesisUtterance(' ');
      utterance.volume = 0;
      utterance.addEventListener('start', this.markStarted);
    }
    this.synth.speak(utterance);
  };

  speak(text: string, options: Partial<SpeakOptions> = {}) {
    if (text.trim() === '') return;
    preferPlaybackAudio();
    this.synth.cancel();
    const voices = this.synth.getVoices();
    const chosen =
      options.voice != null ? voices.find((v) => voiceKey(v) === options.voice) : undefined;
    const lang = options.lang ?? this.lang;
    const voice = chosen ?? pickDefaultVoice(voices, lang);
    const utterance = new SpeechSynthesisUtterance(asWord(text, voice?.lang ?? lang));
    utterance.lang = voice?.lang ?? lang;
    if (voice) utterance.voice = voice;
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;
    utterance.addEventListener('start', this.markStarted);
    if (!this.started) this.waiting = { utterance, at: Date.now() };
    this.synth.speak(utterance);
  }

  stop() {
    this.synth.cancel();
  }

  get speaking() {
    return this.synth.speaking === true;
  }

  voices(lang = this.lang): VoiceInfo[] {
    return rankVoices(this.synth.getVoices(), lang);
  }

  onVoicesChanged(callback: () => void) {
    this.synth.addEventListener('voiceschanged', callback);
    return () => this.synth.removeEventListener('voiceschanged', callback);
  }
}

const silent: SpeechOutput = {
  available: false,
  speak() {},
  stop() {},
  speaking: false,
  voices: () => [],
  onVoicesChanged: () => () => {},
};

export const appLanguage = typeof navigator === 'undefined' ? 'en' : navigator.language || 'en';

export const speech: SpeechOutput =
  typeof speechSynthesis === 'undefined' ? silent : new WebSpeech(appLanguage);
