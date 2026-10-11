import type { TouchSettings } from './access/touch';

export interface SpeechSettings {
  /** The device's own voices, or an Open AAC voice that runs offline. */
  engine: 'device' | 'openaac';
  /** Chosen device voice (see voiceKey in speech.ts), or null for the default. */
  voice: string | null;
  /** Chosen Open AAC voice (an id from voice/catalog.ts). */
  openaacVoice: string | null;
  rate: number;
  pitch: number;
  /** Speak each word as it's tapped, not only when Speak is pressed. */
  speakEachWord: boolean;
}

export interface DisplaySettings {
  labelPosition: 'below' | 'above';
  showSymbols: boolean;
  /** Space between buttons, in px. More space suits keyguards and tremor. */
  buttonGap: number;
}

export interface Settings {
  speech: SpeechSettings;
  touch: TouchSettings;
  display: DisplaySettings;
}

export const DEFAULT_SETTINGS: Settings = {
  speech: {
    engine: 'device',
    voice: null,
    openaacVoice: null,
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
  return {
    speech: {
      engine: speech.engine === 'openaac' ? 'openaac' : 'device',
      voice: typeof speech.voice === 'string' ? speech.voice : d.speech.voice,
      openaacVoice:
        typeof speech.openaacVoice === 'string' ? speech.openaacVoice : d.speech.openaacVoice,
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
