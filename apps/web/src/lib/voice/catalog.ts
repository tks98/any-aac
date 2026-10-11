import type { VoiceSource } from './piper';

/**
 * Piper voices we can offer: only ones trained on openly licensed recordings.
 * (Several popular Piper voices, such as hfc_female, lessac and ryan, are
 * non-commercial, so they're left out.)
 *
 * The files currently come from the Piper project on Hugging Face. Before this
 * ships, they must be served from the app's own origin like everything else.
 */
export interface VoiceEntry {
  id: string;
  name: string;
  lang: string;
  gender: 'female' | 'male';
  /** A smaller, lower-quality model that's quicker to download and run. */
  small?: boolean;
  /** The one to suggest first for its language. */
  recommended?: boolean;
  license: string;
  sizeMB: number;
  source: VoiceSource;
}

/** Cache Storage bucket that holds downloaded voice files. */
export const VOICE_CACHE = 'open-aac-voices-v1';

const HF = 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0';

const piper = (locale: string, name: string, quality = 'medium'): VoiceSource => {
  const base = `${HF}/${locale.split('_')[0]}/${locale}/${name}/${quality}/${locale}-${name}-${quality}`;
  return { model: `${base}.onnx`, config: `${base}.onnx.json` };
};

export const VOICES: VoiceEntry[] = [
  {
    id: 'en_US-ljspeech-medium',
    name: 'Linda',
    lang: 'en-US',
    gender: 'female',
    // Clear and natural, from the widely used, public-domain LJ Speech recordings.
    recommended: true,
    license: 'Public domain (LJ Speech)',
    sizeMB: 63.5,
    source: piper('en_US', 'ljspeech'),
  },
  {
    id: 'en_US-kristin-medium',
    name: 'Kristin',
    lang: 'en-US',
    gender: 'female',
    license: 'Public domain (LibriVox)',
    sizeMB: 63.5,
    source: piper('en_US', 'kristin'),
  },
  {
    id: 'en_US-norman-medium',
    name: 'Norman',
    lang: 'en-US',
    gender: 'male',
    license: 'Public domain (LibriVox)',
    sizeMB: 63.5,
    source: piper('en_US', 'norman'),
  },
  {
    id: 'en_US-joe-medium',
    name: 'Joe',
    lang: 'en-US',
    gender: 'male',
    license: 'CC0 (Nabu Casa)',
    sizeMB: 63.2,
    source: piper('en_US', 'joe'),
  },
  {
    id: 'en_GB-cori-medium',
    name: 'Cori',
    lang: 'en-GB',
    gender: 'female',
    license: 'Public domain (LibriVox)',
    sizeMB: 63.5,
    source: piper('en_GB', 'cori'),
  },
  {
    id: 'en_GB-alba-medium',
    name: 'Alba',
    lang: 'en-GB',
    gender: 'female',
    license: 'CC BY 4.0 (University of Edinburgh)',
    sizeMB: 63.2,
    source: piper('en_GB', 'alba'),
  },
  {
    id: 'es_MX-claude-high',
    name: 'Claude',
    lang: 'es-MX',
    gender: 'male',
    // The only high-quality Spanish model, and Latin American like the starter words.
    recommended: true,
    license: 'Apache 2.0',
    sizeMB: 63.1,
    source: piper('es_MX', 'claude', 'high'),
  },
  {
    id: 'es_MX-ald-medium',
    name: 'Ald',
    lang: 'es-MX',
    gender: 'male',
    license: 'Public domain (Unlicense)',
    sizeMB: 63.2,
    source: piper('es_MX', 'ald'),
  },
  {
    id: 'es_ES-davefx-medium',
    name: 'Davefx',
    lang: 'es-ES',
    gender: 'male',
    license: 'CC0',
    sizeMB: 63.2,
    source: piper('es_ES', 'davefx'),
  },
  {
    id: 'es_ES-carlfm-x_low',
    name: 'Carlfm',
    lang: 'es-ES',
    gender: 'male',
    small: true,
    license: 'Public domain',
    sizeMB: 28.1,
    source: piper('es_ES', 'carlfm', 'x_low'),
  },
];

export const voiceById = (id: string | null | undefined) => VOICES.find((v) => v.id === id);

/** True when the voice's files are on this device (so it works offline). */
export async function isDownloaded(voice: VoiceEntry): Promise<boolean> {
  if (!('caches' in globalThis)) return false;
  const cache = await caches.open(VOICE_CACHE);
  return Boolean(
    (await cache.match(voice.source.model)) && (await cache.match(voice.source.config)),
  );
}

export async function deleteVoiceFiles(voice: VoiceEntry): Promise<void> {
  if (!('caches' in globalThis)) return;
  const cache = await caches.open(VOICE_CACHE);
  await Promise.all([cache.delete(voice.source.model), cache.delete(voice.source.config)]);
}
