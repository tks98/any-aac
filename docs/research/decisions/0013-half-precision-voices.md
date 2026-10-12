# 0013: Voices stored in half precision

Status: accepted. 2026-10-11.

## Context

App voices are the default, so every new device downloads one ([0012](0012-app-voice-by-default.md)). A medium Piper voice is 63.5 MB, almost all of it convolution weights stored as 32-bit floats, and Carlfm (Spanish, x_low) is 28.1 MB. A smaller file means less waiting and less mobile data before the full voice speaks.

An ONNX model can store its weights in fewer bits and turn them back into 32-bit floats when it loads, so the voice still computes as before.

## Options

Linda, converted four ways. Sizes are of the file. The difference from the original was measured in ONNX Runtime with Piper's random noise turned off, so that each run gives the same result, and is given as a signal-to-noise ratio (higher is closer):

| Weights stored as                                                             | Size    | Compared with the original         |
| ----------------------------------------------------------------------------- | ------- | ---------------------------------- |
| 32-bit floats (as published)                                                  | 63.5 MB | —                                  |
| **16-bit floats (fp16)**                                                      | 32.5 MB | 37–43 dB, same timing              |
| fp16 for the text encoder and duration predictor, 8-bit integers for the rest | 23.8 MB | 20–26 dB, same timing              |
| 8-bit integers, scaled per output channel                                     | 17.1 MB | Timing shifts by a frame in places |

All four synthesise at the same speed in the browser. The maintainer listened to each, rendered by the app's own engine saying the same four sentences.

## Decision

**fp16.** Every offered voice's Conv and ConvTranspose weights are stored in half precision, and a Cast turns each back into 32 bits when the voice loads.

| Voice   | Original | fp16    | Compared with the original |
| ------- | -------- | ------- | -------------------------- |
| Linda   | 63.5 MB  | 32.5 MB | 37.0–39.9 dB               |
| Kristin | 63.5 MB  | 32.5 MB | 31.4–50.4 dB               |
| Norman  | 63.5 MB  | 32.5 MB | 35.3–41.9 dB               |
| Cori    | 63.5 MB  | 32.5 MB | 38.6–54.0 dB               |
| Carlfm  | 28.1 MB  | 18.2 MB | 39.0–42.9 dB               |

Three English sentences or two Spanish ones each; the timing was identical in every one. The 8-bit options save another 9–15 MB but change the sound measurably. A voice is part of how someone is heard, so it should sound as it did.

- `apps/web/scripts/half-precision.mjs` converts a voice. It edits the model's protobuf directly, so it needs only Node, not Python or ONNX tools. The same voice always gives the same file, so `voices.json` pins each converted voice's size and hash next to the original's. `scripts/self-host-voices.mjs` converts and checks every voice when a site is built, on GitHub Pages and for anyone self-hosting.
- Self-hosted builds serve the converted voices from `voices/fp16/`. A new folder rather than new files under the old names, so that no cache (Cloudflare keeps voices for 7 days) hands out a mix of the two. Development builds still download the originals from Hugging Face.

## Consequences

- A first launch in English downloads about 37 MB instead of about 70: Linda (32.5 MB) and the speech engine (4.5 MB compressed). In Spanish, about 23 MB.
- Voices already downloaded keep working offline: the app moves them to the new address (`tidyVoiceFiles` in `catalog.ts`). They stay full size until deleted and downloaded again.
- The bundled starter clips were rendered with the original models. fp16 sounds the same, so they weren't rendered again.
- If the converter changes what it writes, its pinned hashes in `voices.json` must change too, or the Pages build stops.
