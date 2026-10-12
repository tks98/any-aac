/**
 * Renders the bundled starter clips with the app's own voice engine, for
 * scripts/render-clips.mjs (served by the dev server; not part of the build).
 */
import { defaultVoiceFor } from '../lib/voice/catalog';
import { PiperVoice } from '../lib/voice/piper';
import { starterClipTexts } from '../lib/voice/starter-clips';

interface Rendered {
  voiceId: string;
  sampleRate: number;
  /** Text → 16-bit mono PCM, base64. */
  clips: Record<string, string>;
}

function base64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

const texts = starterClipTexts();

Object.assign(window, {
  clipLanguages: async () => Object.keys(await texts),
  async renderVoice(lang: string): Promise<Rendered> {
    const voice = defaultVoiceFor(lang);
    if (!voice) throw new Error(`No voice for ${lang}.`);
    const piper = await PiperVoice.load(voice.source);
    const clips: Record<string, string> = {};
    for (const text of (await texts)[lang] ?? []) {
      const { samples } = await piper.synthesize(text);
      const pcm = new Int16Array(samples.length);
      for (let i = 0; i < samples.length; i++) {
        pcm[i] = Math.round(Math.max(-1, Math.min(1, samples[i]!)) * 0x7fff);
      }
      clips[text] = base64(pcm);
    }
    return { voiceId: voice.id, sampleRate: piper.sampleRate, clips };
  },
});
