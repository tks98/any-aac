import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appVoiceIdFor,
  defaultVoiceFor,
  isDownloaded,
  tidyVoiceFiles,
  voiceById,
} from '../src/lib/voice/catalog';

describe('app voices for each language', () => {
  it('starts each language with its recommended voice, or its only one', () => {
    expect(defaultVoiceFor('en')?.name).toBe('Linda');
    expect(defaultVoiceFor('en-GB')?.name).toBe('Linda');
    expect(defaultVoiceFor('es-MX')?.name).toBe('Carlfm');
    expect(defaultVoiceFor('fr')).toBeUndefined();
  });

  it('uses the chosen voice, else the default, and none after a deletion', () => {
    expect(appVoiceIdFor({}, 'en')).toBe('en_US-ljspeech-medium');
    expect(appVoiceIdFor({ en: 'en_GB-cori-medium' }, 'en-US')).toBe('en_GB-cori-medium');
    expect(appVoiceIdFor({ en: '' }, 'en')).toBeNull();
    expect(appVoiceIdFor({}, 'fr')).toBeNull();
  });
});

describe('tidying downloaded voice files', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps a voice downloaded from an earlier address, and deletes withdrawn voices', async () => {
    const site = 'https://any-aac.com/';
    const files = new Map<string, Response>();
    const key = (request: Request | string) =>
      new URL(typeof request === 'string' ? request : request.url, site).href;
    vi.stubGlobal('location', { href: site });
    vi.stubGlobal('caches', {
      open: async () => ({
        keys: async () => [...files.keys()].map((url) => new Request(url)),
        match: async (request: Request | string) => files.get(key(request)),
        put: async (request: Request | string, response: Response) => {
          files.set(key(request), response);
        },
        delete: async (request: Request | string) => files.delete(key(request)),
      }),
    });
    // Linda as first self-hosted (before the half-precision copies), and a
    // voice that's no longer offered.
    const before = `${site}voices/en/en_US/ljspeech/medium/en_US-ljspeech-medium.onnx`;
    files.set(before, new Response('model'));
    files.set(`${before}.json`, new Response('config'));
    files.set(`${site}voices/en/en_US/lessac/medium/en_US-lessac-medium.onnx`, new Response(''));

    expect(await tidyVoiceFiles()).toEqual(['en_US-lessac-medium']);
    const linda = voiceById('en_US-ljspeech-medium')!;
    expect(await isDownloaded(linda)).toBe(true);
    expect([...files.keys()].sort()).toEqual([linda.source.model, linda.source.config].sort());
    expect(await files.get(linda.source.model)!.text()).toBe('model');
  });
});
