import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasBundled, soundBounds } from '../src/lib/voice/bundled';
import { defaultVoiceFor } from '../src/lib/voice/catalog';
import index from '../src/lib/voice/clips/index.json';
import { starterClipTexts } from '../src/lib/voice/starter-clips';

describe('bundled starter clips', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('cover every starter word and phrase, in the default voice of each language', async () => {
    // Offline: symbols fall back to placeholders; only the words matter here.
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    const texts = await starterClipTexts();
    expect(Object.keys(texts)).toEqual(['en', 'es']);
    for (const [lang, list] of Object.entries(texts)) {
      const voice = defaultVoiceFor(lang)!.id;
      const missing = list.filter((text) => !hasBundled(voice, text));
      // If this fails, run: node scripts/render-clips.mjs
      expect(missing, `${lang} texts without a clip`).toEqual([]);
    }
    expect(hasBundled('en_US-ljspeech-medium', 'want')).toBe(true);
    expect(hasBundled('en_US-ljspeech-medium', 'wanted')).toBe(false);
    expect(hasBundled(null, 'want')).toBe(false);
  });

  it('are small, and each clip is an MP3', () => {
    for (const [voice, { clips }] of Object.entries(index)) {
      const bytes = readFileSync(new URL(`../src/lib/voice/clips/${voice}.bin`, import.meta.url));
      expect(bytes.length).toBeLessThan(500_000);
      for (const [start, end] of Object.values(clips) as [number, number][]) {
        // An MP3 frame starts with 11 set bits (or the file with an ID3 tag).
        const frame = bytes[start] === 0xff && (bytes[start + 1]! & 0xe0) === 0xe0;
        const id3 = bytes.subarray(start, start + 3).toString() === 'ID3';
        expect(frame || id3).toBe(true);
        expect(end).toBeGreaterThan(start);
      }
    }
  });

  it('finds where the sound in a clip starts and ends', () => {
    const samples = new Float32Array([0, 0.001, 0.2, -0.5, 0.3, 0.002, 0]);
    expect(soundBounds(samples)).toEqual([2, 5]);
    // All silence: no sound left.
    const [start, end] = soundBounds(new Float32Array(4));
    expect(end - start).toBe(0);
  });
});
