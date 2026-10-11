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

class WebSpeech implements SpeechOutput {
  readonly available = true;

  constructor(private readonly lang: string) {}

  speak(text: string, options: Partial<SpeakOptions> = {}) {
    if (text.trim() === '') return;
    preferPlaybackAudio();
    speechSynthesis.cancel();
    const voices = speechSynthesis.getVoices();
    const chosen =
      options.voice != null ? voices.find((v) => voiceKey(v) === options.voice) : undefined;
    const lang = options.lang ?? this.lang;
    const voice = chosen ?? pickDefaultVoice(voices, lang);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice?.lang ?? lang;
    if (voice) utterance.voice = voice;
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;
    speechSynthesis.speak(utterance);
  }

  stop() {
    speechSynthesis.cancel();
  }

  voices(lang = this.lang): VoiceInfo[] {
    return rankVoices(speechSynthesis.getVoices(), lang);
  }

  onVoicesChanged(callback: () => void) {
    speechSynthesis.addEventListener('voiceschanged', callback);
    return () => speechSynthesis.removeEventListener('voiceschanged', callback);
  }
}

const silent: SpeechOutput = {
  available: false,
  speak() {},
  stop() {},
  voices: () => [],
  onVoicesChanged: () => () => {},
};

export const appLanguage = typeof navigator === 'undefined' ? 'en' : navigator.language || 'en';

export const speech: SpeechOutput =
  typeof speechSynthesis === 'undefined' ? silent : new WebSpeech(appLanguage);
