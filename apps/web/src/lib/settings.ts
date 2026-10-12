import type { Pronunciation } from '@any-aac/core';
import type { TouchSettings } from './access/touch';
import type { ScanMethod } from './access/scan';
import type { ColorStyle, Theme } from './theme';
import { isAppLanguage, type AppLanguage } from './i18n';

export interface SpeechSettings {
  /**
   * An app voice that runs offline (the default: it sounds the same everywhere
   * and, unlike device voices on iPhone and iPad, speaks in silent mode), or
   * the device's own voices.
   */
  engine: 'device' | 'app';
  /** Chosen device voice per language (base code → voiceKey in speech.ts); none = default. */
  deviceVoices: Record<string, string>;
  /**
   * Chosen app voice per language (base code → id in voice/catalog.ts). A
   * language with no entry uses its default voice; an empty entry, none.
   */
  appVoices: Record<string, string>;
  /** Download the app voice for the language in use when it isn't on this device. */
  autoDownload: boolean;
  rate: number;
  pitch: number;
  /** 0.1–1. */
  volume: number;
  /** Speak each word as it's tapped, not only when Speak is pressed. */
  speakEachWord: boolean;
  /** "Say X as Y", for names and words the voices get wrong. */
  pronunciations: Pronunciation[];
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
  theme: Theme;
  /** How word types show their colour. */
  colorStyle: ColorStyle;
  /** Label size, as a multiple of the size that fits the cell. */
  labelScale: number;
  labelPosition: 'below' | 'above';
  showSymbols: boolean;
  /** Space between buttons, in px. More space suits keyguards and tremor. */
  buttonGap: number;
  /** A Forms button that changes the last word: want → wants, wanting, wanted. */
  showWordForms: boolean;
  /** A Share button on the message bar, to send the message as text. */
  showShare: boolean;
  /** A Phrases button for quick phrases, spoken at once. */
  showPhrases: boolean;
  /** Outline a word for a moment when it's chosen. */
  selectionFlash: boolean;
  /**
   * Phone-sized screens show boards' smaller phone layouts. Off: every device
   * shows the same layout, so every word keeps one place everywhere.
   */
  phoneLayouts: boolean;
}

export interface ScanSettings {
  enabled: boolean;
  method: ScanMethod;
  /** Rows then words, columns then words, or one by one. */
  pattern: 'rows' | 'columns' | 'linear';
  speedMs: number;
  firstDelayMs: number;
  loops: number;
  autoRestart: boolean;
  /** Also scan the message bar and navigation (as groups after the board). */
  includeBars: boolean;
  /** Say each item as it's highlighted (auditory scanning). */
  cues: boolean;
  highlight: 'dim' | 'outline' | 'fill';
  /** Switch inputs: keys, a game controller, a tap anywhere, mouse buttons. */
  keyboard: boolean;
  gamepad: boolean;
  touch: boolean;
  mouse: boolean;
  ignoreRepeatMs: number;
}

export interface Settings {
  language: LanguageSettings;
  speech: SpeechSettings;
  touch: TouchSettings;
  display: DisplaySettings;
  scan: ScanSettings;
}

export const DEFAULT_SETTINGS: Settings = {
  language: { primary: null, second: null, usingSecond: false, app: 'auto' },
  speech: {
    engine: 'app',
    deviceVoices: {},
    appVoices: {},
    autoDownload: true,
    rate: 1,
    pitch: 1,
    volume: 1,
    speakEachWord: true,
    pronunciations: [],
  },
  touch: { holdMs: 0, selectOnRelease: false, ignoreRepeatMs: 0 },
  display: {
    theme: 'light',
    colorStyle: 'fill',
    labelScale: 1,
    labelPosition: 'below',
    showSymbols: true,
    buttonGap: 10,
    showWordForms: true,
    showShare: false,
    showPhrases: true,
    selectionFlash: true,
    phoneLayouts: true,
  },
  scan: {
    enabled: false,
    method: 'auto',
    pattern: 'rows',
    speedMs: 1500,
    firstDelayMs: 1000,
    loops: 3,
    autoRestart: true,
    includeBars: true,
    cues: false,
    highlight: 'dim',
    keyboard: true,
    gamepad: true,
    touch: false,
    mouse: false,
    ignoreRepeatMs: 300,
  },
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return (options as readonly unknown[]).includes(value) ? (value as T) : fallback;
}

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
  const scan = isRecord(root.scan) ? root.scan : {};

  // Settings saved before voices were chosen per language had one of each.
  const deviceVoices = voiceMap(speech.deviceVoices);
  if (typeof speech.voice === 'string' && speech.voice.includes('|')) {
    deviceVoices[languageOf(speech.voice.split('|')[1]!)] ??= speech.voice;
  }
  // App voices were "Open AAC voices" (openaacVoices, engine 'openaac') before
  // the app was renamed, and earlier still one voice (openaacVoice).
  const appVoices = voiceMap(speech.appVoices ?? speech.openaacVoices);
  if (typeof speech.openaacVoice === 'string') {
    appVoices[languageOf(speech.openaacVoice)] ??= speech.openaacVoice;
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
      engine: speech.engine === 'device' ? 'device' : 'app',
      deviceVoices,
      appVoices,
      autoDownload: bool(speech.autoDownload, d.speech.autoDownload),
      rate: num(speech.rate, d.speech.rate, 0.5, 2),
      pitch: num(speech.pitch, d.speech.pitch, 0.5, 1.5),
      volume: num(speech.volume, d.speech.volume, 0.1, 1),
      speakEachWord: bool(speech.speakEachWord, d.speech.speakEachWord),
      pronunciations: Array.isArray(speech.pronunciations)
        ? speech.pronunciations
            .filter(
              (e): e is Pronunciation =>
                isRecord(e) && typeof e.word === 'string' && typeof e.sayAs === 'string',
            )
            .map(({ word, sayAs }) => ({ word, sayAs }))
            .slice(0, 500)
        : [],
    },
    touch: {
      holdMs: num(touch.holdMs, d.touch.holdMs, 0, 3000),
      selectOnRelease: bool(touch.selectOnRelease, d.touch.selectOnRelease),
      ignoreRepeatMs: num(touch.ignoreRepeatMs, d.touch.ignoreRepeatMs, 0, 3000),
    },
    display: {
      theme: oneOf(display.theme, ['light', 'dark', 'contrast'] as const, d.display.theme),
      colorStyle: oneOf(
        display.colorStyle,
        ['fill', 'border', 'none'] as const,
        d.display.colorStyle,
      ),
      labelScale: num(display.labelScale, d.display.labelScale, 1, 1.5),
      labelPosition: display.labelPosition === 'above' ? 'above' : d.display.labelPosition,
      showSymbols: bool(display.showSymbols, d.display.showSymbols),
      buttonGap: num(display.buttonGap, d.display.buttonGap, 0, 32),
      showWordForms: bool(display.showWordForms, d.display.showWordForms),
      showShare: bool(display.showShare, d.display.showShare),
      showPhrases: bool(display.showPhrases, d.display.showPhrases),
      selectionFlash: bool(display.selectionFlash, d.display.selectionFlash),
      phoneLayouts: bool(display.phoneLayouts, d.display.phoneLayouts),
    },
    scan: {
      enabled: bool(scan.enabled, d.scan.enabled),
      method: oneOf(scan.method, ['auto', 'step', 'inverse'] as const, d.scan.method),
      pattern: oneOf(scan.pattern, ['rows', 'columns', 'linear'] as const, d.scan.pattern),
      speedMs: num(scan.speedMs, d.scan.speedMs, 300, 6000),
      firstDelayMs: num(scan.firstDelayMs, d.scan.firstDelayMs, 0, 5000),
      loops: num(scan.loops, d.scan.loops, 1, 10),
      autoRestart: bool(scan.autoRestart, d.scan.autoRestart),
      includeBars: bool(scan.includeBars, d.scan.includeBars),
      cues: bool(scan.cues, d.scan.cues),
      highlight: oneOf(scan.highlight, ['dim', 'outline', 'fill'] as const, d.scan.highlight),
      keyboard: bool(scan.keyboard, d.scan.keyboard),
      gamepad: bool(scan.gamepad, d.scan.gamepad),
      touch: bool(scan.touch, d.scan.touch),
      mouse: bool(scan.mouse, d.scan.mouse),
      ignoreRepeatMs: num(scan.ignoreRepeatMs, d.scan.ignoreRepeatMs, 0, 2000),
    },
  };
}
