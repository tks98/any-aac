/**
 * Runs the Piper voice off the main thread, so synthesis never delays a tap.
 * One job at a time: an ONNX session doesn't run concurrently.
 */
import { PiperVoice, type VoiceSource } from './piper';

export type WorkerRequest =
  | { id: number; type: 'load'; source: VoiceSource }
  | { id: number; type: 'synthesize'; text: string; rate: number };

export type WorkerResponse =
  | { id: number; type: 'progress'; loaded: number; total: number }
  | { id: number; type: 'loaded' }
  | { id: number; type: 'audio'; samples: Float32Array; sampleRate: number }
  | { id: number; type: 'error'; message: string };

const scope = self as unknown as {
  postMessage(message: WorkerResponse, transfer?: Transferable[]): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<WorkerRequest>) => void): void;
};

let voice: PiperVoice | null = null;
let queue = Promise.resolve();

async function handle(request: WorkerRequest) {
  try {
    if (request.type === 'load') {
      voice = await PiperVoice.load(request.source, (p) =>
        scope.postMessage({ id: request.id, type: 'progress', ...p }),
      );
      scope.postMessage({ id: request.id, type: 'loaded' });
      return;
    }
    if (!voice) throw new Error('No voice is loaded.');
    const out = await voice.synthesize(request.text, { rate: request.rate });
    const samples = new Float32Array(out.samples);
    scope.postMessage({ id: request.id, type: 'audio', samples, sampleRate: out.sampleRate }, [
      samples.buffer,
    ]);
  } catch (error) {
    scope.postMessage({
      id: request.id,
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

scope.addEventListener('message', (event) => {
  const request = event.data;
  queue = queue.then(() => handle(request));
});
