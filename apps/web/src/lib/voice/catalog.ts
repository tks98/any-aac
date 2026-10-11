import type { VoiceSource } from './piper';
import catalog from './voices.json';

/**
 * Piper voices we can offer: only voices whose licence is clearly open, from
 * their recordings and, if they were fine-tuned, from the voice they started
 * from. Popular Piper voices that are non-commercial (hfc_female, lessac, ryan)
 * or fine-tuned from lessac, whose recordings are research-only (joe, alba,
 * davefx, ald, daniela, sharvard, the mls voices), are left out, as are voices
 * whose training isn't documented (es_MX claude).
 * See docs/research/decisions/0002-only-clearly-licensed-voices.md.
 *
 * The list, with pinned sizes and hashes, is voices.json, which the
 * self-hosting script reads too.
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
/** Keeps the app's first name, so voices downloaded before the rename are found. */
export const VOICE_CACHE = 'open-aac-voices-v1';

/**
 * Where voice files come from: this site's own voices/ folder when the build
 * serves them (VITE_SELF_HOST_VOICES, as on GitHub Pages; see
 * scripts/self-host-voices.mjs), so no request leaves the app's origin.
 * Otherwise the pinned Piper release on Hugging Face (development).
 */
const VOICE_BASE =
  import.meta.env.VITE_SELF_HOST_VOICES === 'true'
    ? `${import.meta.env.BASE_URL}voices`
    : catalog.piper;

const sourceOf = (dir: string): VoiceSource => {
  const base = `${VOICE_BASE}/${dir}/${dir.split('/').slice(1).join('-')}`;
  return { model: `${base}.onnx`, config: `${base}.onnx.json` };
};

export const VOICES: VoiceEntry[] = catalog.voices.map((v) => ({
  id: v.id,
  name: v.name,
  lang: v.lang,
  gender: v.gender as VoiceEntry['gender'],
  ...('small' in v && v.small ? { small: true } : {}),
  ...('recommended' in v && v.recommended ? { recommended: true } : {}),
  license: v.license,
  sizeMB: v.model.size / 1e6,
  source: sourceOf(v.dir),
}));

export const voiceById = (id: string | null | undefined) => VOICES.find((v) => v.id === id);

/**
 * Tidies the downloaded voice files. Files of a voice still offered but now at
 * a different address (e.g. moved from Hugging Face to this site) are kept
 * under the new address; files of voices no longer offered (e.g. withdrawn for
 * their licence) are deleted. Returns the ids of withdrawn voices.
 */
export async function tidyVoiceFiles(): Promise<string[]> {
  if (!('caches' in globalThis)) return [];
  const cache = await caches.open(VOICE_CACHE);
  const absolute = (url: string) => new URL(url, location.href).href;
  const fileName = (url: string) => url.split('/').at(-1) ?? '';
  const offered = new Map(
    VOICES.flatMap((v) => [v.source.model, v.source.config]).map((url) => [
      fileName(url),
      absolute(url),
    ]),
  );
  const withdrawn = new Set<string>();
  for (const request of await cache.keys()) {
    const name = fileName(request.url);
    const current = offered.get(name);
    if (current === request.url) continue;
    if (current) {
      const response = await cache.match(request);
      if (response) await cache.put(current, response);
    } else {
      withdrawn.add(name.replace(/\.onnx(\.json)?$/, ''));
    }
    await cache.delete(request);
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
