/**
 * Voice lab: measures the offline Piper voices on this device. Not part of the
 * app; it exists to choose an approach with real numbers (see docs/plan.md, P0).
 */
import { preferPlaybackAudio } from './lib/speech';
import { VOICES } from './lib/voice/catalog';
import type { PiperVoice, Synthesized } from './lib/voice/piper';

const PHRASES: Record<string, string[]> = {
  en: [
    'want',
    'I want more.',
    'Can you help me with my coat, please?',
    'I would like to go outside and play with my friends after lunch, if that is okay.',
  ],
  es: [
    'quiero',
    'Quiero más.',
    '¿Me puedes ayudar con mi abrigo, por favor?',
    'Me gustaría salir a jugar con mis amigos después del almuerzo, si está bien.',
  ],
};
const phrasesFor = (lang: string) => PHRASES[lang.split('-')[0]!] ?? PHRASES.en!;

interface Row {
  text: string;
  audioSeconds: number;
  firstMs: number;
  medianMs: number;
  phonemesMs: number;
  realTimeFactor: number;
}

const results: { env: Record<string, unknown>; load?: Record<string, unknown>; rows: Row[] } = {
  env: {
    userAgent: navigator.userAgent,
    cores: navigator.hardwareConcurrency,
    deviceMemoryGB: (navigator as { deviceMemory?: number }).deviceMemory ?? null,
    crossOriginIsolated: globalThis.crossOriginIsolated,
  },
  rows: [],
};
Object.assign(window, { labResults: results });

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const select = el<HTMLSelectElement>('voice');
const status = (text: string) => (el('status').textContent = text);
const buttons = ['say', 'bench', 'copy'].map((id) => el<HTMLButtonElement>(id));

for (const v of VOICES) {
  select.add(
    new Option(`${v.name}: ${v.lang}, ${v.gender}${v.small ? ', small' : ''} (${v.license})`, v.id),
  );
}
el('env').textContent = JSON.stringify(results.env, null, 2);

let voice: PiperVoice | null = null;
let audio: AudioContext | null = null;

function play({ samples, sampleRate }: Synthesized) {
  preferPlaybackAudio();
  audio ??= new AudioContext();
  void audio.resume();
  const buffer = audio.createBuffer(1, samples.length, sampleRate);
  buffer.copyToChannel(new Float32Array(samples), 0);
  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.connect(audio.destination);
  source.start();
}

el('load').addEventListener('click', async () => {
  const entry = VOICES.find((v) => v.id === select.value)!;
  buttons.forEach((b) => (b.disabled = true));
  status('Loading…');
  try {
    const started = performance.now();
    const { PiperVoice } = await import('./lib/voice/piper');
    let downloaded = 0;
    voice = await PiperVoice.load(entry.source, (p) => {
      downloaded = p.loaded;
      status(`Downloading ${(p.loaded / 1e6).toFixed(1)} of ${(p.total / 1e6).toFixed(1)} MB`);
    });
    const loaded = performance.now();
    await voice.synthesize('Hello.');
    const warm = performance.now();
    results.load = {
      voice: entry.id,
      fromCache: downloaded === 0,
      downloadedMB: +(downloaded / 1e6).toFixed(1),
      loadMs: Math.round(loaded - started),
      firstSpeechMs: Math.round(warm - loaded),
    };
    status(
      `Ready. Load ${results.load.loadMs} ms${downloaded === 0 ? ' (from cache)' : ''}, first speech ${results.load.firstSpeechMs} ms.`,
    );
    buttons.forEach((b) => (b.disabled = false));
  } catch (error) {
    status(`Failed: ${error instanceof Error ? error.message : String(error)}`);
    console.error(error);
  }
});

el('say').addEventListener('click', async () => {
  if (!voice) return;
  const started = performance.now();
  const out = await voice.synthesize(el<HTMLInputElement>('text').value);
  status(`Synthesized in ${Math.round(performance.now() - started)} ms.`);
  play(out);
});

el('bench').addEventListener('click', async () => {
  if (!voice) return;
  results.rows = [];
  const body = el('rows');
  body.replaceChildren();
  const lang = VOICES.find((v) => v.id === select.value)?.lang ?? 'en';
  for (const text of phrasesFor(lang)) {
    status(`Measuring “${text}”`);
    const t0 = performance.now();
    await voice.phonemes(text);
    const phonemesMs = performance.now() - t0;
    const times: number[] = [];
    let out: Synthesized | undefined;
    for (let i = 0; i < 3; i++) {
      const start = performance.now();
      out = await voice.synthesize(text);
      times.push(performance.now() - start);
    }
    const audioSeconds = out!.samples.length / out!.sampleRate;
    const median = [...times].sort((a, b) => a - b)[1]!;
    const row: Row = {
      text,
      audioSeconds: +audioSeconds.toFixed(2),
      firstMs: Math.round(times[0]!),
      medianMs: Math.round(median),
      phonemesMs: Math.round(phonemesMs),
      realTimeFactor: +(median / 1000 / audioSeconds).toFixed(3),
    };
    results.rows.push(row);
    const tr = document.createElement('tr');
    for (const value of [
      row.text,
      row.audioSeconds,
      row.firstMs,
      row.medianMs,
      row.phonemesMs,
      row.realTimeFactor,
    ]) {
      const td = document.createElement('td');
      td.textContent = String(value);
      tr.append(td);
    }
    body.append(tr);
  }
  status('Benchmark done.');
});

el('copy').addEventListener('click', async () => {
  await navigator.clipboard.writeText(JSON.stringify(results, null, 2));
  status('Results copied.');
});
