import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VOICES } from '../src/lib/voice/catalog';
import { fetchCached, matchesPin, type FilePin } from '../src/lib/voice/piper';
import catalog from '../src/lib/voice/voices.json';

vi.mock('../src/lib/voice/phonemizer/piper_phonemize.js', () => ({ default: async () => ({}) }));

const bytes = (text: string) => new TextEncoder().encode(text);
const sha256 = (data: Uint8Array) => createHash('sha256').update(data).digest('hex');
const gitOid = (data: Uint8Array) =>
  createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');

const model = bytes('model bytes');
const MODEL: FilePin = { size: model.length, sha256: sha256(model) };

describe('checking voice files against their pins', () => {
  it('accepts the pinned file by sha256 or git blob hash', async () => {
    expect(await matchesPin(model, [MODEL])).toBe(true);
    const config = bytes('{"audio":{}}');
    expect(await matchesPin(config, [{ size: config.length, gitOid: gitOid(config) }])).toBe(true);
  });

  it('refuses a file of the wrong size or hash, and a pin with no hash', async () => {
    expect(await matchesPin(bytes('model bytez'), [MODEL])).toBe(false);
    expect(await matchesPin(bytes('model'), [MODEL])).toBe(false);
    expect(await matchesPin(model, [{ size: model.length }])).toBe(false);
  });

  it('accepts any of several pins (a full-size or half-precision model)', async () => {
    expect(await matchesPin(model, [{ size: 1, sha256: 'x' }, MODEL])).toBe(true);
  });

  it('pins every offered voice file, both model copies included', () => {
    for (const voice of VOICES) {
      const entry = catalog.voices.find((v) => v.id === voice.id)!;
      expect(voice.source.pins).toEqual({
        model: [entry.fp16, entry.model],
        config: [entry.config],
      });
    }
  });
});

describe('caching voice files', () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubCache(files: Map<string, Uint8Array<ArrayBuffer>>) {
    vi.stubGlobal('caches', {
      open: async () => ({
        match: async (url: string) => {
          const file = files.get(url);
          return file && new Response(file);
        },
        put: async (url: string, response: Response) => {
          files.set(url, new Uint8Array(await response.arrayBuffer()));
        },
        delete: async (url: string) => files.delete(url),
      }),
    });
  }
  const serve = (body: Uint8Array<ArrayBuffer>) =>
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(body)),
    );

  it('caches a download that matches its pin', async () => {
    const files = new Map<string, Uint8Array<ArrayBuffer>>();
    stubCache(files);
    serve(model);
    expect(new Uint8Array(await fetchCached('/m.onnx', [MODEL]))).toEqual(model);
    expect(files.get('/m.onnx')).toEqual(model);
  });

  it("refuses and doesn't cache a download that doesn't match", async () => {
    const files = new Map<string, Uint8Array<ArrayBuffer>>();
    stubCache(files);
    serve(bytes('model bytez'));
    await expect(fetchCached('/m.onnx', [MODEL])).rejects.toThrow(/expected voice file/);
    expect(files.has('/m.onnx')).toBe(false);
  });

  it('replaces a damaged cached copy with a fresh download', async () => {
    const files = new Map([['/m.onnx', bytes('model bytez')]]);
    stubCache(files);
    serve(model);
    expect(new Uint8Array(await fetchCached('/m.onnx', [MODEL]))).toEqual(model);
    expect(files.get('/m.onnx')).toEqual(model);
  });

  it('keeps a cached copy that fails its pin when the new download fails', async () => {
    const old = bytes('last release model');
    const files = new Map([['/m.onnx', old]]);
    stubCache(files);
    // Offline.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    await expect(fetchCached('/m.onnx', [MODEL])).rejects.toThrow('Failed to fetch');
    expect(files.get('/m.onnx')).toEqual(old);
    // A download that doesn't match doesn't replace it either.
    serve(bytes('model bytez'));
    await expect(fetchCached('/m.onnx', [MODEL])).rejects.toThrow(/expected voice file/);
    expect(files.get('/m.onnx')).toEqual(old);
  });

  it('uses a cached copy that matches without downloading', async () => {
    const files = new Map([['/m.onnx', model]]);
    stubCache(files);
    serve(bytes('other'));
    expect(new Uint8Array(await fetchCached('/m.onnx', [MODEL]))).toEqual(model);
    expect(fetch).not.toHaveBeenCalled();
  });
});
