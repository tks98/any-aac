# 0001: Offline voice

Status: proposed, pending real-device numbers. 2026-10-10.

## Context

The plan's first principle is that speaking always works. The browser's own voices (Web Speech) vary by device, some need the internet, and Firefox on Android has none. P0 called for testing a neural voice that runs in the browser and choosing an approach with measured numbers.

## Options

1. **Web Speech only.** Free and instant, but not reliable offline and different on every device. We keep it as the fallback.
2. **Piper through `@mintplex-labs/piper-tts-web`.** This works, but it rebuilds the eSpeak phonemizer (and its 18 MB of data) for every utterance. It also loads code from cdnjs and jsdelivr and voices from a hard-coded Hugging Face mirror.
3. **Piper through our own thin engine (chosen).** ONNX Runtime Web runs the voice model, and `phonemizer` (eSpeak NG in WebAssembly, by the Transformers.js author) turns text into phonemes. Both stay loaded between utterances, all code is served from our origin, and the engine is about 150 lines (`apps/web/src/lib/voice/piper.ts`).
4. **sherpa-onnx in WebAssembly.** One runtime for Piper, Matcha and Kokoro. The prebuilt web builds bake the model in at build time, so loading voices at runtime means building it ourselves. Worth revisiting if we outgrow option 3.
5. **Kokoro (`kokoro-js`).** It sounds more natural, but it's mostly English, 86 MB or more, and brings in Transformers.js. It's a candidate for a premium voice later.

## Measurements

These used `voice-lab.html` with the Piper `en_US-ljspeech-medium` voice, single-threaded (no cross-origin isolation). The machine is an Apple-silicon Mac, so treat these numbers as an upper bound on speed.

| Phrase                      | Audio | Chromium | WebKit | iOS Safari (simulator) |
| --------------------------- | ----- | -------- | ------ | ---------------------- |
| "want"                      | 0.5 s | 87 ms    | 85 ms  | 88 ms                  |
| "I want more."              | 0.9 s | 145 ms   | 152 ms | 153 ms                 |
| "Can you help me … please?" | 2.2 s | 369 ms   | 383 ms | 370 ms                 |
| A 16-word sentence          | 4.2 s | 668 ms   | 708 ms | 687 ms                 |

- Real-time factor (synthesis time divided by audio length) is about 0.16 to 0.17 everywhere, so synthesis runs about six times faster than real time.
- Phonemizing takes 3 to 42 ms.
- Loading takes 4.3 to 5.3 s, including the 63.5 MB download. First speech then takes 130 to 145 ms.

**Still needed:** numbers from a real iPhone and a budget Android tablet. A phone CPU could be several times slower. That's acceptable for buttons, whose audio is rendered ahead and cached, but it matters for typed messages.

## Download sizes

All of these are fetched only when someone turns the voice on. None are in the app's precache.

| Part                     | Size    | Gzipped |
| ------------------------ | ------- | ------- |
| ONNX Runtime WebAssembly | 14.2 MB | 3.7 MB  |
| ONNX Runtime JavaScript  | 71 KB   | 23 KB   |
| phonemizer (eSpeak NG)   | 1.3 MB  | 0.7 MB  |
| One Piper voice (medium) | 63 MB   | n/a     |

## Licences

- eSpeak NG is GPL-3.0, which is compatible with our AGPL-3.0. ONNX Runtime is MIT.
- Piper voices are licensed one by one. **The popular hfc_female, hfc_male and ryan voices are CC BY-NC-SA, and lessac has a restrictive research licence.** We only offer voices trained on open data: ljspeech, kristin, norman and cori (public domain), joe (CC0) and alba (CC BY 4.0). See `apps/web/src/lib/voice/catalog.ts`.

## Decision

Use option 3, with these parts:

- The voice is an optional download in Settings. Web Speech stays the default until a voice is installed, and remains the fallback if the voice fails.
- **Each button's audio is rendered once and cached**, so a tap plays instantly whatever the device's speed. The message bar's "Speak" renders the whole sentence.
- Before release, voice files must be served from our own origin (or from a self-hoster's server), not from Hugging Face.

## Open questions

- Real-device speed (iPhone, budget Android). The voice lab's "Copy results" button exists to collect this.
- Which voice sounds best for a default, as judged by AAC users.
- `phonemizer` drops punctuation that Piper's own phonemizer keeps, which flattens question intonation slightly.
- Multithreading needs cross-origin isolation (COOP/COEP headers), which would speed up synthesis on multi-core devices.
- Smaller models: quantized (int8) versions of the voices could be about a quarter of the size. Their quality needs testing.
