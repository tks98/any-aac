/**
 * Main-thread side of the Open AAC voice: talks to the voice worker, keeps
 * rendered phrases (in memory and in IndexedDB) so they play instantly, and
 * plays audio with Web Audio.
 */
import { deleteAudioForVoice, loadAudio, saveAudio } from '../storage';
import type { VoiceEntry } from './catalog';
import type { WorkerRequest, WorkerResponse } from './voice.worker';

type Request = WorkerRequest extends infer R
  ? R extends { id: number }
    ? Omit<R, 'id'>
    : never
  : never;

interface Call {
  resolve(response: WorkerResponse): void;
  reject(error: Error): void;
  progress?(loaded: number, total: number): void;
}

/** Stored audio is 16-bit, half the size of the float samples the model makes. */
export function toPcm16(samples: Float32Array): Int16Array {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    out[i] = Math.round(Math.max(-1, Math.min(1, samples[i]!)) * 0x7fff);
  }
  return out;
}

export function fromPcm16(pcm: Int16Array): Float32Array {
  const out = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) out[i] = pcm[i]! / 0x7fff;
  return out;
}

/** How many decoded phrases to keep in memory; the rest come back from IndexedDB. */
const MEMORY_LIMIT = 400;

export class VoiceEngine {
  /** The voice that's loaded and ready, if any. */
  voiceId: string | null = null;

  private worker: Worker | null = null;
  private calls = new Map<number, Call>();
  private nextId = 1;
  private memory = new Map<string, AudioBuffer>();
  private context: AudioContext | null = null;
  private playing: AudioBufferSourceNode | null = null;
  private latest = 0;

  private startWorker(): Worker {
    const worker = new Worker(new URL('./voice.worker.ts', import.meta.url), { type: 'module' });
    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      const call = this.calls.get(message.id);
      if (!call) return;
      if (message.type === 'progress') {
        call.progress?.(message.loaded, message.total);
        return;
      }
      this.calls.delete(message.id);
      if (message.type === 'error') call.reject(new Error(message.message));
      else call.resolve(message);
    });
    worker.addEventListener('error', (event) => {
      for (const call of this.calls.values()) {
        call.reject(new Error(event.message || 'The voice stopped working.'));
      }
      this.calls.clear();
      this.worker = null;
      this.voiceId = null;
    });
    return worker;
  }

  private call(request: Request, progress?: Call['progress']): Promise<WorkerResponse> {
    this.worker ??= this.startWorker();
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.calls.set(id, { resolve, reject, progress });
      this.worker!.postMessage({ ...request, id });
    });
  }

  /** Loads a voice, downloading it first if it isn't on this device. */
  async load(voice: VoiceEntry, progress?: Call['progress']): Promise<void> {
    this.voiceId = null;
    await this.call({ type: 'load', source: voice.source }, progress);
    this.voiceId = voice.id;
    this.memory.clear();
  }

  /** Stops using the voice and frees the worker's memory. */
  unload() {
    this.stop();
    this.worker?.terminate();
    this.worker = null;
    this.voiceId = null;
    this.memory.clear();
  }

  async forget(voice: VoiceEntry) {
    if (this.voiceId === voice.id) this.unload();
    await deleteAudioForVoice(voice.id);
  }

  private key(text: string, rate: number) {
    return `${this.voiceId}|${rate.toFixed(2)}|${text}`;
  }

  private remember(key: string, buffer: AudioBuffer) {
    this.memory.set(key, buffer);
    if (this.memory.size > MEMORY_LIMIT) this.memory.delete(this.memory.keys().next().value!);
  }

  /** The audio for a phrase: from memory, from storage, or rendered now. */
  async render(text: string, rate: number): Promise<AudioBuffer> {
    const voice = this.voiceId;
    if (!voice) throw new Error('No voice is loaded.');
    const key = this.key(text, rate);
    const cached = this.memory.get(key);
    if (cached) return cached;

    let stored = await loadAudio(key).catch(() => undefined);
    if (!stored) {
      const response = await this.call({ type: 'synthesize', text, rate });
      if (response.type !== 'audio') throw new Error('The voice returned no audio.');
      stored = { key, voice, pcm: toPcm16(response.samples), sampleRate: response.sampleRate };
      void saveAudio(stored).catch(() => {});
    }
    const buffer = new AudioBuffer({
      length: Math.max(1, stored.pcm.length),
      sampleRate: stored.sampleRate,
      numberOfChannels: 1,
    });
    buffer.copyToChannel(fromPcm16(stored.pcm) as Float32Array<ArrayBuffer>, 0);
    this.remember(key, buffer);
    return buffer;
  }

  /**
   * Wakes audio output. Call it from a tap: browsers (iOS especially) only
   * allow sound to start in response to the person touching the screen.
   */
  unlock() {
    this.context ??= new AudioContext();
    if (this.context.state !== 'running') void this.context.resume();
  }

  /** Speaks a phrase. A newer call wins: an older phrase still rendering won't play. */
  async speak(text: string, rate: number, volume = 1): Promise<void> {
    this.unlock();
    const turn = ++this.latest;
    const buffer = await this.render(text, rate);
    if (turn !== this.latest) return;
    this.stop();
    const context = this.context!;
    const source = context.createBufferSource();
    source.buffer = buffer;
    const gain = context.createGain();
    gain.gain.value = volume;
    source.connect(gain).connect(context.destination);
    source.start();
    this.playing = source;
  }

  stop() {
    try {
      this.playing?.stop();
    } catch {
      // Already finished.
    }
    this.playing = null;
  }
}
