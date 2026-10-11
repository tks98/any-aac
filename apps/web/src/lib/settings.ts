import type { TouchSettings } from './access/touch';
import { isAppLanguage, type AppLanguage } from './i18n';

export interface SpeechSettings {
  /** The device's own voices, or an Open AAC voice that runs offline. */
  engine: 'device' | 'openaac';
  /** Chosen device voice per language (base code → voiceKey in speech.ts); none = default. */
  deviceVoices: Record<string, string>;
  /** Chosen Open AAC voice per language (base code → id in voice/catalog.ts). */
  openaacVoices: Record<string, string>;
  rate: number;
  pitch: number;
  /** Speak each word as it's tapped, not only when Speak is pressed. */
  speakEachWord: boolean;
}

export interface LanguageSettings {
  /** The boards' language (base code); null shows the boards in their own language. */
  primary: string | null;
  /** A second language for bilingual communicators. Adds a switch button; buttons stay put. */
  second: string | null;
  /** The second language is showing right now. */
  usingSecond: boolean;
  /** Language of buttons, menus and settings; "auto" follows the words (see i18n.ts). */
  app: 'auto' | AppLanguage;
}

export interface DisplaySettings {
  labelPosition: 'below' | 'above';
  showSymbols: boolean;
  /** Space between buttons, in px. More space suits keyguards and tremor. */
  buttonGap: number;
}

export interface Settings {
  language: LanguageSettings;
  speech: SpeechSettings;
  touch: TouchSettings;
  display: DisplaySettings;
}

export const DEFAULT_SETTINGS: Settings = {
  language: { primary: null, second: null, usingSecond: false, app: 'auto' },
  speech: {
    engine: 'device',
    deviceVoices: {},
    openaacVoices: {},
    rate: 1,
    pitch: 1,
    speakEachWord: true,
  },
  touch: { holdMs: 0, selectOnRelease: false, ignoreRepeatMs: 0 },
  display: { labelPosition: 'below', showSymbols: true, buttonGap: 10 },
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function num(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

const bool = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);

const isLanguage = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z]{2,3}$/.test(value);

const languageOf = (code: string) => code.toLowerCase().split(/[-_|]/)[0] ?? '';

/** A record of language → string, keeping only well-formed entries. */
function voiceMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => isLanguage(entry[0]) && typeof entry[1] === 'string',
    ),
  );
}

/**
 * Settings read from storage, checked field by field. Anything missing or out of
 * range falls back to the default, so older saved settings keep working.
 */
export function withDefaults(saved: unknown): Settings {
  const d = DEFAULT_SETTINGS;
  const root = isRecord(saved) ? saved : {};
  const speech = isRecord(root.speech) ? root.speech : {};
  const touch = isRecord(root.touch) ? root.touch : {};
  const display = isRecord(root.display) ? root.display : {};
  const language = isRecord(root.language) ? root.language : {};

  // Settings saved before voices were chosen per language had one of each.
  const deviceVoices = voiceMap(speech.deviceVoices);
  if (typeof speech.voice === 'string' && speech.voice.includes('|')) {
    deviceVoices[languageOf(speech.voice.split('|')[1]!)] ??= speech.voice;
  }
  const openaacVoices = voiceMap(speech.openaacVoices);
  if (typeof speech.openaacVoice === 'string') {
    openaacVoices[languageOf(speech.openaacVoice)] ??= speech.openaacVoice;
  }

  return {
    language: {
      primary: isLanguage(language.primary) ? language.primary : d.language.primary,
      second: isLanguage(language.second) ? language.second : d.language.second,
      usingSecond: bool(language.usingSecond, d.language.usingSecond),
      app:
        typeof language.app === 'string' && isAppLanguage(language.app)
          ? language.app
          : d.language.app,
    },
    speech: {
      engine: speech.engine === 'openaac' ? 'openaac' : 'device',
      deviceVoices,
      openaacVoices,
      rate: num(speech.rate, d.speech.rate, 0.5, 2),
      pitch: num(speech.pitch, d.speech.pitch, 0.5, 1.5),
      speakEachWord: bool(speech.speakEachWord, d.speech.speakEachWord),
    },
    touch: {
      holdMs: num(touch.holdMs, d.touch.holdMs, 0, 3000),
      selectOnRelease: bool(touch.selectOnRelease, d.touch.selectOnRelease),
      ignoreRepeatMs: num(touch.ignoreRepeatMs, d.touch.ignoreRepeatMs, 0, 3000),
    },
    display: {
      labelPosition: display.labelPosition === 'above' ? 'above' : d.display.labelPosition,
      showSymbols: bool(display.showSymbols, d.display.showSymbols),
      buttonGap: num(display.buttonGap, d.display.buttonGap, 0, 32),
    },
  };
}
