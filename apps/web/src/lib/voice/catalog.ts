import type { VoiceSource } from './piper';

/**
 * Piper voices we can offer: only voices whose licence is clearly open, from
 * their recordings and, if they were fine-tuned, from the voice they started
 * from. Popular Piper voices that are non-commercial (hfc_female, lessac, ryan)
 * or fine-tuned from lessac, whose recordings are research-only (joe, alba,
 * davefx, ald, daniela, sharvard, the mls voices), are left out, as are voices
 * whose training isn't documented (es_MX claude).
 * See docs/research/decisions/0002-only-clearly-licensed-voices.md.
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
    id: 'en_GB-cori-medium',
    name: 'Cori',
    lang: 'en-GB',
    gender: 'female',
    license: 'Public domain (LibriVox)',
    sizeMB: 63.5,
    source: piper('en_GB', 'cori'),
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

/**
 * Deletes downloaded files of voices no longer offered (e.g. withdrawn for
 * their licence), so they don't keep using space. Returns the ids removed.
 */
export async function forgetWithdrawnVoices(): Promise<string[]> {
  if (!('caches' in globalThis)) return [];
  const cache = await caches.open(VOICE_CACHE);
  const offered = new Set(VOICES.flatMap((v) => [v.source.model, v.source.config]));
  const withdrawn = new Set<string>();
  for (const request of await cache.keys()) {
    if (offered.has(request.url)) continue;
    await cache.delete(request);
    // …/<lang>/<locale>/<name>/<quality>/<id>.onnx(.json)
    const file = request.url.split('/').at(-1) ?? '';
    withdrawn.add(file.replace(/\.onnx(\.json)?$/, ''));
  }
  return [...withdrawn];
}

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
