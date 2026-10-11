# 0001: Offline voice

Status: accepted for iPhone; budget Android still to measure. 2026-10-10.

## Context

The plan's first principle is that speaking always works. The browser's own voices (Web Speech) vary by device, some need the internet, and Firefox on Android has none. P0 called for testing a neural voice that runs in the browser and choosing an approach with measured numbers.

## Options

1. **Web Speech only.** Free and instant, but not reliable offline and different on every device. We keep it as the fallback.
2. **Piper through `@mintplex-labs/piper-tts-web`.** This works, but it rebuilds the eSpeak phonemizer (and its 18 MB of data) for every utterance. It also loads code from cdnjs and jsdelivr and voices from a hard-coded Hugging Face mirror.
3. **Piper through our own thin engine (chosen).** ONNX Runtime Web runs the voice model, and piper-phonemize (eSpeak NG in WebAssembly, from `@diffusionstudio/piper-wasm`) turns text into phonemes. We keep one instance and call it for every phrase, in any of eSpeak's languages, instead of rebuilding it each time. Both stay loaded between utterances, all code is served from our origin, and the engine is about 200 lines (`apps/web/src/lib/voice/piper.ts`). (We first used the `phonemizer` package, but it only contains English data.)
4. **sherpa-onnx in WebAssembly.** One runtime for Piper, Matcha and Kokoro. The prebuilt web builds bake the model in at build time, so loading voices at runtime means building it ourselves. Worth revisiting if we outgrow option 3.
5. **Kokoro (`kokoro-js`).** It sounds more natural, but it's mostly English, 86 MB or more, and brings in Transformers.js. It's a candidate for a premium voice later.

## Measurements

These used `voice-lab.html` with the Piper `en_US-ljspeech-medium` voice, single-threaded (no cross-origin isolation). The desktop and simulator runs were on an Apple-silicon Mac; the iPhone column is a real iPhone over the network.

| Phrase                      | Audio | Chromium | WebKit | iOS Safari (simulator) | iPhone (Safari) |
| --------------------------- | ----- | -------- | ------ | ---------------------- | --------------- |
| "want"                      | 0.5 s | 87 ms    | 85 ms  | 88 ms                  | 75 ms           |
| "I want more."              | 0.9 s | 145 ms   | 152 ms | 153 ms                 | 128 ms          |
| "Can you help me … please?" | 2.2 s | 369 ms   | 383 ms | 370 ms                 | 316 ms          |
| A 16-word sentence          | 4.2 s | 668 ms   | 708 ms | 687 ms                 | 596 ms          |

- Real-time factor (synthesis time divided by audio length) is about 0.16 to 0.17 on the Mac and 0.14 on the iPhone, so synthesis runs six to seven times faster than real time.
- Phonemizing takes 3 to 42 ms.
- Loading takes 4.3 to 5.3 s, including the 63.5 MB download. First speech then takes 130 to 145 ms.

**Still needed:** numbers from a budget Android tablet and an older iPad, which could be several times slower. That's acceptable for buttons, whose audio is rendered ahead and cached, but it matters for typed messages.

## Download sizes

All of these are fetched only when someone turns the voice on. None are in the app's precache.

| Part                                        | Size    | Gzipped |
| ------------------------------------------- | ------- | ------- |
| ONNX Runtime WebAssembly                    | 14.2 MB | 3.7 MB  |
| ONNX Runtime JavaScript                     | 71 KB   | 23 KB   |
| piper-phonemize (eSpeak NG, ~100 languages) | 18.7 MB | n/a     |
| One Piper voice (medium)                    | 63 MB   | n/a     |

## Licences

- eSpeak NG is GPL-3.0, which is compatible with our AGPL-3.0. ONNX Runtime is MIT.
- Piper voices are licensed one by one. **The popular hfc_female, hfc_male and ryan voices are CC BY-NC-SA, and lessac has a restrictive research licence.** We only offer voices trained on open data: ljspeech, kristin, norman and cori (public domain), joe (CC0) and alba (CC BY 4.0). See `apps/web/src/lib/voice/catalog.ts`.

## Decision

Use option 3, with these parts:

- The voice is an optional download in Settings. Web Speech stays the default until a voice is installed, and remains the fallback if the voice fails.
- **Each button's audio is rendered once and cached**, so a tap plays instantly whatever the device's speed. The message bar's "Speak" renders the whole sentence.
- Before release, voice files must be served from our own origin (or from a self-hoster's server), not from Hugging Face.

## Implementation

- `voice.worker.ts` runs the engine in a Web Worker, one job at a time, so synthesis never delays a tap.
- `engine.ts` keeps rendered phrases in memory (up to 400) and in IndexedDB as 16-bit audio, plays them with Web Audio, and lets a newer tap win over an older phrase that's still rendering.
- `voice.svelte.ts` handles download and load state, and prepares every word on the boards in the background, one phrase at a time (the current board first).
- The app starts the chosen voice from the files on the device. It only downloads when someone presses Download in Settings.
- If the voice isn't ready or fails, the device voice speaks instead.
- Measured end to end (Playwright, this Mac): taps on prepared words start speaking in 20 to 45 ms. Unprepared words take 130 to 260 ms. After a reload with the network off, the voice still starts and speaks.

## Open questions

- Real-device speed (iPhone, budget Android). The voice lab's "Copy results" button exists to collect this.
- Which voice sounds best for a default, as judged by AAC users.
- Multithreading needs cross-origin isolation (COOP/COEP headers), which would speed up synthesis on multi-core devices.
- Smaller models: quantized (int8) versions of the voices could be about a quarter of the size. Their quality needs testing.

## Recommended voices (2026-10-11)

Settings lists one voice per language first, marked Recommended: **Linda** (`en_US-ljspeech-medium`) for English, clear and natural from the public-domain LJ Speech recordings. The device voice stays the default until someone chooses to download a voice, since a voice is a 63 MB download.

## Voice lineage (2026-10-11)

A voice's licence depends on its recordings and, if it was fine-tuned, on the voice it started from. Checking each MODEL_CARD for the base model as well as the dataset ([research-check.md](../research-check.md)):

| Voice            | Recordings               | Started from                      | Clearly open? |
| ---------------- | ------------------------ | --------------------------------- | ------------- |
| Linda (ljspeech) | Public domain            | Trained from scratch              | Yes           |
| Kristin, Norman  | Public domain (LibriVox) | Trained from scratch              | Yes           |
| Cori             | Public domain (LibriVox) | Trained from scratch              | Yes           |
| Carlfm (es_ES)   | Public domain            | Trained from scratch              | Yes           |
| Joe              | CC0                      | lessac (research-only recordings) | No            |
| Alba             | CC BY 4.0                | lessac                            | No            |
| Davefx (es_ES)   | CC0                      | lessac                            | No            |
| Ald (es_MX)      | Unlicense                | Davefx, so lessac                 | No            |
| Claude (es_MX)   | Stated Apache 2.0        | Not documented                    | No            |

The lessac recordings are licensed for research only, excluding "developing … voice synthesis … products"; the licence doesn't say whether a model fine-tuned from them is a derived work. Until that's settled, the five are labelled in Settings and never recommended, so Spanish has no recommended voice. Before a public release: remove them or get clarity, and evaluate Kokoro-82M (Apache 2.0, with Spanish voices) for Spanish.
