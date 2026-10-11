/**
 * A Piper (VITS) voice running on the device: eSpeak NG turns text into
 * phonemes, and ONNX Runtime (WebAssembly) turns phonemes into audio.
 *
 * Both stay loaded between utterances, so after the first load each phrase
 * costs only the model run. This module is loaded on demand; nothing here is in
 * the main bundle.
 */
import type { InferenceSession, Tensor } from 'onnxruntime-web';

/** The parts of a Piper voice's .onnx.json we use. */
export interface PiperConfig {
  audio: { sample_rate: number };
  espeak: { voice: string };
  inference: { noise_scale: number; length_scale: number; noise_w: number };
  num_speakers: number;
  phoneme_id_map: Record<string, number[]>;
}

export interface VoiceSource {
  /** URL of the .onnx model. */
  model: string;
  /** URL of the .onnx.json config. */
  config: string;
}

export interface Progress {
  loaded: number;
  total: number;
}

export interface Synthesized {
  samples: Float32Array;
  sampleRate: number;
}

const CACHE = 'open-aac-voices-v1';

/** Fetches a file, from the voice cache when it's there, reporting download progress. */
async function fetchCached(url: string, onProgress?: (p: Progress) => void): Promise<ArrayBuffer> {
  const cache = 'caches' in globalThis ? await caches.open(CACHE) : undefined;
  const hit = await cache?.match(url);
  if (hit) return hit.arrayBuffer();

  const response = await fetch(url);
  if (!response.ok || !response.body)
    throw new Error(`Could not download ${url} (${response.status}).`);
  const total = Number(response.headers.get('Content-Length') ?? 0);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress?.({ loaded, total });
  }
  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  await cache?.put(
    url,
    new Response(bytes, { headers: { 'Content-Type': 'application/octet-stream' } }),
  );
  return bytes.buffer;
}

/**
 * Piper's phoneme-to-id rule: start marker, then each phoneme followed by the
 * pad id, then the end marker. Phonemes the voice doesn't know are skipped.
 */
export function phonemeIds(phonemes: string, map: Record<string, number[]>): number[] {
  const pad = map['_'] ?? [0];
  const ids = [...(map['^'] ?? []), ...pad];
  for (const phoneme of Array.from(phonemes.normalize('NFD'))) {
    const id = map[phoneme];
    if (!id) continue;
    ids.push(...id, ...pad);
  }
  ids.push(...(map['$'] ?? []));
  return ids;
}

export class PiperVoice {
  private constructor(
    private readonly session: InferenceSession,
    private readonly config: PiperConfig,
    private readonly ort: typeof import('onnxruntime-web'),
    private readonly phonemize: (text: string, language?: string) => Promise<string[]>,
  ) {}

  /** Downloads (or reads from cache) and starts a voice. */
  static async load(source: VoiceSource, onProgress?: (p: Progress) => void): Promise<PiperVoice> {
    const [ort, { phonemize }, configBytes, modelBytes] = await Promise.all([
      import('onnxruntime-web/wasm'),
      import('phonemizer'),
      fetchCached(source.config),
      fetchCached(source.model, onProgress),
    ]);
    // Threads need cross-origin isolation (SharedArrayBuffer); otherwise run on one.
    ort.env.wasm.numThreads = globalThis.crossOriginIsolated
      ? Math.min(4, navigator.hardwareConcurrency || 1)
      : 1;
    const config = JSON.parse(new TextDecoder().decode(configBytes)) as PiperConfig;
    const session = await ort.InferenceSession.create(new Uint8Array(modelBytes), {
      executionProviders: ['wasm'],
    });
    return new PiperVoice(session, config, ort as typeof import('onnxruntime-web'), phonemize);
  }

  get sampleRate() {
    return this.config.audio.sample_rate;
  }

  async phonemes(text: string): Promise<string> {
    const clauses = await this.phonemize(text, this.config.espeak.voice);
    return clauses.join(' ');
  }

  async synthesize(text: string, options: { rate?: number } = {}): Promise<Synthesized> {
    const ids = phonemeIds(await this.phonemes(text), this.config.phoneme_id_map);
    const { Tensor } = this.ort;
    const { noise_scale, length_scale, noise_w } = this.config.inference;
    const feeds: Record<string, Tensor> = {
      input: new Tensor('int64', BigInt64Array.from(ids, BigInt), [1, ids.length]),
      input_lengths: new Tensor('int64', BigInt64Array.from([BigInt(ids.length)]), [1]),
      // A higher speaking rate means shorter phonemes.
      scales: new Tensor(
        'float32',
        Float32Array.from([noise_scale, length_scale / (options.rate ?? 1), noise_w]),
        [3],
      ),
    };
    if (this.config.num_speakers > 1) {
      feeds.sid = new Tensor('int64', BigInt64Array.from([0n]), [1]);
    }
    const output = await this.session.run(feeds);
    const audio = output[this.session.outputNames[0]!]!;
    return { samples: audio.data as Float32Array, sampleRate: this.sampleRate };
  }
}
