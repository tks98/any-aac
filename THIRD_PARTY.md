# Third-party content and software

Any AAC's own code is licensed under the [GNU AGPL v3 or later](LICENSE), and its vocabulary arrangements and translations under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). It includes the work of others, listed here with their licences. The app's **Settings → About** shows the same credits, and counts the pictures from each source on the boards in use.

## Symbols

| What                                           | Licence                                                         | Source                                             |
| ---------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------- |
| Mulberry Symbols v3.6.1, © 2018–2026 Steve Lee | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [mulberrysymbols.org](https://mulberrysymbols.org) |
| OpenMoji 17.0.0                                | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [openmoji.org](https://openmoji.org)               |
| A few line-drawn pictograms                    | CC BY-SA 4.0                                                    | Any AAC contributors                               |

Each picture on the starter boards carries its author and licence in its OBF `license` field, so the credit travels with exported boards. Versions are pinned in [`apps/web/src/assets/symbols/sources.json`](apps/web/src/assets/symbols/sources.json) and [`apps/web/scripts/symbol-library.mjs`](apps/web/scripts/symbol-library.mjs).

## Vocabulary

- **Universal Core vocabulary**, Center for Literacy and Disability Studies, UNC-Chapel Hill, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) ([source](https://www.med.unc.edu/ahs/clds/universal-core-vocabulary/)): the core words of the English starter boards and the concepts of the Spanish ones ([decision 0003](docs/research/decisions/0003-core-vocabulary.md)).
- The Spanish-first word choices follow Soto, G., & Cooper, B. (2021), an early Spanish vocabulary for AAC, _Augmentative and Alternative Communication_ ([doi:10.1080/07434618.2021.1881822](https://doi.org/10.1080/07434618.2021.1881822)). No text from the paper is reproduced ([decision 0004](docs/research/decisions/0004-spanish-first-vocabulary.md)).

## Voices

App voices, the voices that come with Any AAC, are optional downloads. They're [Piper](https://github.com/rhasspy/piper) models from the [rhasspy/piper-voices v1.0.0](https://huggingface.co/rhasspy/piper-voices/tree/v1.0.0) release, and we only offer voices trained from scratch on public-domain recordings ([decision 0002](docs/research/decisions/0002-only-clearly-licensed-voices.md)):

| Voice   | Language         | Recordings                                                          |
| ------- | ---------------- | ------------------------------------------------------------------- |
| Linda   | American English | [LJ Speech](https://keithito.com/LJ-Speech-Dataset/), public domain |
| Kristin | American English | LibriVox, public domain                                             |
| Norman  | American English | LibriVox, public domain                                             |
| Cori    | British English  | LibriVox, public domain                                             |
| Carlfm  | Spanish (Spain)  | Public domain                                                       |

Each voice's model card is in its folder of the Piper release. The files and their hashes are pinned in [`apps/web/src/lib/voice/voices.json`](apps/web/src/lib/voice/voices.json).

## Speech engine

| What                                                                                                                                                                                                 | Licence                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) 1.30.0, which runs the voice models                                                                                                     | MIT                                                                                   |
| [piper-wasm](https://github.com/diffusion-studio/piper-wasm) 1.0.0 (`piper_phonemize.wasm`), which turns text into phonemes                                                                          | MIT, and it contains eSpeak NG (below)                                                |
| [eSpeak NG](https://github.com/rhasspy/espeak-ng) (rhasspy's fork) and its language data, compiled into `piper_phonemize.wasm` with [piper-phonemize](https://github.com/wide-video/piper-phonemize) | [GPL-3.0-or-later](https://www.gnu.org/licenses/gpl-3.0.html); piper-phonemize is MIT |

eSpeak NG is GPL-3.0-or-later, which is compatible with Any AAC's AGPL. Its source code is at the links above, and the build steps are in piper-wasm's README.

## Typeface

[Atkinson Hyperlegible Next](https://www.brailleinstitute.org/freefont/), Braille Institute of America, [SIL Open Font License 1.1](https://openfontlicense.org), served from the app through [Fontsource](https://fontsource.org).

## Libraries

Included in the built app:

| Library                                                                                                | Licence    |
| ------------------------------------------------------------------------------------------------------ | ---------- |
| [Svelte](https://svelte.dev)                                                                           | MIT        |
| [Dexie.js](https://dexie.org) (IndexedDB storage)                                                      | Apache-2.0 |
| [fflate](https://github.com/101arrowz/fflate) (OBZ zip files)                                          | MIT        |
| [Workbox](https://developer.chrome.com/docs/workbox) (offline service worker, through vite-plugin-pwa) | MIT        |

Development tools (Vite, Vitest, Playwright, axe-core, ESLint, Prettier, TypeScript and others) aren't included in the app; their licences are in their packages.
