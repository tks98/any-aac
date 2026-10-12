/**
 * Bundled starter clips: every word and quick phrase on the starter boards,
 * rendered ahead of time in each language's default app voice (MP3, about
 * 0.8 MB in all; see scripts/render-clips.mjs). They're part of the app, so
 * the starter words speak from the first tap, offline, before any voice has
 * downloaded. Played through Web Audio, they also speak in silent mode on
 * iPhone and iPad, where the device voice doesn't.
 */
import index from './clips/index.json';

interface VoiceClips {
  lang: string;
  /** Text → [start, end) bytes in the voice's .bin file. */
  clips: Record<string, [number, number]>;
}

// JSON arrays type as number[]; each is a [start, end) pair.
const INDEX = index as unknown as Record<string, VoiceClips>;

/** Voice id → the URL of its clips file (hashed, and cached for offline use). */
const FILES = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('./clips/*.bin', { query: '?url', import: 'default', eager: true }),
  ).map(([path, url]) => [path.slice('./clips/'.length, -'.bin'.length), url]),
);

/**
 * Voices whose clips couldn't be loaded or played here (offline before they
 * were cached, or a browser that can't decode MP3). For the rest of the
 * session the device voice speaks at once, rather than after a failed try.
 */
const unavailable = new Set<string>();

/** Whether `text` has a bundled clip in this voice that can be played. */
export function hasBundled(voiceId: string | null, text: string): boolean {
  return voiceId !== null && !unavailable.has(voiceId) && INDEX[voiceId]?.clips[text] !== undefined;
}

const files = new Map<string, Promise<ArrayBuffer>>();
const decoded = new Map<string, Promise<AudioBuffer>>();

function file(voiceId: string): Promise<ArrayBuffer> {
  let bytes = files.get(voiceId);
  if (!bytes) {
    const url = FILES[voiceId];
    if (!url) return Promise.reject(new Error(`No bundled clips for ${voiceId}.`));
    bytes = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`Could not load bundled clips (${response.status}).`);
      return response.arrayBuffer();
    });
    bytes.catch(() => {
      files.delete(voiceId);
      unavailable.add(voiceId);
    });
    files.set(voiceId, bytes);
  }
  return bytes;
}

/** Starts loading a voice's clips, so the first tap doesn't wait for them. */
export function preloadBundled(voiceId: string | null) {
  if (voiceId && FILES[voiceId]) void file(voiceId).catch(() => {});
}

/** The decoded audio of a bundled clip. */
export function bundledAudio(
  context: BaseAudioContext,
  voiceId: string,
  text: string,
): Promise<AudioBuffer> {
  const key = `${voiceId}|${text}`;
  let audio = decoded.get(key);
  if (!audio) {
    const range = INDEX[voiceId]?.clips[text];
    if (!range) return Promise.reject(new Error(`"${text}" isn't bundled.`));
    audio = file(voiceId).then((bytes) => context.decodeAudioData(bytes.slice(...range)));
    audio.catch(() => {
      decoded.delete(key);
      unavailable.add(voiceId);
    });
    decoded.set(key, audio);
  }
  return audio;
}

/** Below this, a decoded sample counts as silence (decoders add a little at the start). */
const SILENCE = 0.015;

/** Where the sound in a buffer starts and ends. */
export function soundBounds(samples: Float32Array): [number, number] {
  let start = 0;
  let end = samples.length;
  while (start < end && Math.abs(samples[start]!) < SILENCE) start++;
  while (end > start && Math.abs(samples[end - 1]!) < SILENCE) end--;
  return [start, end];
}

/**
 * Joins clips into one phrase: each without the silence around it, with a
 * short pause between words.
 */
export function joinClips(
  context: BaseAudioContext,
  clips: AudioBuffer[],
  pauseSeconds = 0.09,
): AudioBuffer {
  const rate = context.sampleRate;
  const pause = Math.round(pauseSeconds * rate);
  const margin = Math.round(0.01 * rate);
  const parts = clips.map((clip) => {
    const samples = clip.getChannelData(0);
    const [start, end] = soundBounds(samples);
    return samples.subarray(Math.max(0, start - margin), Math.min(samples.length, end + margin));
  });
  const length = parts.reduce((sum, part) => sum + part.length, 0) + pause * (parts.length - 1);
  const joined = context.createBuffer(1, Math.max(1, length), rate);
  const out = joined.getChannelData(0);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length + pause;
  }
  return joined;
}
