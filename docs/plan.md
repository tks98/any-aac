# Any AAC: product and technical plan

This plan is for a free, open-source AAC app that runs in any modern browser, keeps working with no connection, and can be self-hosted by serving one folder. The evidence behind it is in [foundations.md](research/foundations.md).

Status: draft for discussion, 2026-10-10.

---

## 1. What "best" means here

Commercial apps already set a high bar, and AsTeRICS Grid and Cboard already exist. We win only if we're clearly better where it matters. Our bets:

1. **A real, open, robust vocabulary.** We'll build core-vocabulary sets with SLPs (speech-language pathologists) at several sizes that share stable motor plans, and score them against RELAAACs. No open project has this, and it matters more than any other feature.
2. **A voice that's always there.** Neural TTS runs on the device, sounds the same on every browser, works offline, and plays each button instantly from cached audio.
3. **Every access method built into the browser.** Touch accommodations, full switch scanning, auditory scanning, dwell, and webcam head tracking with facial-gesture switches, with nothing extra to install.
4. **Tools for teaching.** A "find word" path, a partner modeling mode, and photo hotspots (visual scene displays) that can be added in the moment.
5. **Private by default.** The app is local-first and sends no telemetry. Logging is opt-in and analysed on the device. Sync is optional, end-to-end encrypted, and self-hostable.
6. **Open formats.** OBF/OBZ import and export are lossless, so nobody is locked in, including locked into us.
7. **Fast on cheap hardware.** Budget Android tablets, school Chromebooks, and old iPads.

## 2. Principles (non-negotiable)

1. **Speaking always works.** The fallback order is cached audio, then the neural voice, then Web Speech, then large on-screen text for the partner. An update, a sync conflict, or a full disk must never leave the user unable to speak.
2. **Vocabulary never moves unless an editor moves it.** No automatic reflow, and no "smart" reordering by frequency. Growing a vocabulary means revealing hidden buttons.
3. **This is the user's voice.** No telemetry, no third-party scripts, no ads, and nothing leaves the device without explicit opt-in.
4. **Every access method is first-class.** Each feature has to work by touch, switch, dwell, and keyboard before it ships.
5. **Open in, open out.** Everything a user creates can be exported in an open format.
6. **Nothing about us without us.** AAC users and SLPs review every phase. We'll recruit paid advisors (see §9).

## 3. Who uses it

| Role                                                               | Needs                                                                           |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| **Communicator** (the AAC user)                                    | Speak quickly and reliably; the vocabulary looks and feels like theirs; privacy |
| **Communication partner**                                          | Understand the message (partner display); model language on the device          |
| **Supporter / editor** (parent, SLP, teacher, the user themselves) | Fast editing; vocabulary setup; printing backups; progress data, with consent   |
| **Self-hoster / admin** (a school, clinic, or family)              | One-command deploy, offline install, backups, multiple users                    |

---

## 4. Features

Phases are defined in §6. **P1** is the MVP.

### 4.1 Communication view

- [P1] Grid boards with configurable rows and columns, linked boards (folders), and Home and Back. _Done:_ rows and columns are changed in edit mode (added at the bottom and right; removed only when empty).
- [P1] Message bar: words build a sentence, and the user taps the bar to speak it. Choose whether each button speaks immediately or only adds to the message. Backspace, clear, copy, and share (Web Share API). _Done:_ Share is an optional button (Display settings); it copies where the device can't share.
- [P1] Buttons show a symbol, a label, or both. The spoken text can differ from the label. Background colour comes from the part of speech plus a colour theme (Modified Fitzgerald by default, configurable).
- [P1] Quick phrases and an always-visible "help" or attention button. _Done:_ a Phrases button opens a board of phrases that are said at once (they don't join the message); they're edited like any board.
- [P2] A keyboard page (QWERTY or ABC) with word prediction.
- [P2] A partner display: large text shown to the partner, rotatable, or mirrored to a second screen.
- [P3] Visual scene displays (a photo with hotspots), plus just-in-time creation from the camera.
- [P3] Word forms: a long-press or "grammar" button for plural, tense, -ing, and so on, starting with English and built on a morphology engine that each language plugs into. _Started:_ a Forms button for the last word, English and Spanish engines; see [design.md](design.md#word-forms).
- [P3] Multilingual and bilingual use: switch languages without losing your place, with each language having its own layout where needed. _Started:_ one shared layout with OBF translations, a one-tap language switch, per-language voices, and the app in English and Spanish (see [design.md](design.md#languages)).
- [P4] Sentence history and favourites (stored locally).

### 4.2 Vocabulary content

- [P1] One starter core-vocabulary set (to be designed with SLPs) at **3 sizes that share motor plans**. Sizes around 24, 48, and 84+ cells are placeholders. _Done as a draft:_ small (4 × 6), medium (6 × 8) and large (7 × 12), in English and Spanish, with each word in the same part of the screen in every size ([decision 0015](research/decisions/0015-three-sizes.md)).
- [P1] Mulberry and OpenMoji symbols bundled. Licence and attribution metadata is stored on every image, and an attributions screen is generated from it. _Done:_ Settings → About lists every picture source in the boards.
- [P1] Custom images from the camera or files, cropped and compressed on the device.
- [P2] Symbol search across optional packs: ARASAAC as an opt-in download because of its NC licence; Global Symbols and OpenSymbols search when online.
- [P2] Vocabulary masking: hide or show buttons without moving them, plus a "reveal next level" workflow for teaching.
- [P3] Topic and fringe templates (school, meals, medical, ICU/hospital, aphasia phrases).
- [P4] More languages, each with its own vocabulary design, not a translation. The Spanish translation of the starter set is a stop-gap that lets bilingual families try it now.

### 4.3 Speech and audio

- [P1] TTS layer with two engines: Web Speech (no download) and one neural voice pack (Piper via onnxruntime-web or sherpa-onnx, running in a Web Worker).
- [P1] Audio for each button is **pre-rendered and cached** and re-rendered when the button is edited.
- [P1] Rate, pitch, and volume; a pronunciation dictionary ("say X as Y"). _Done_ (pitch is device voices only).
- [P2] A recorded audio clip on any button (message banking).
- [P2] A separate cue voice for auditory scanning; route it to headphones via `setSinkId` where the browser supports it.
- [P3] More voice packs and languages; evaluate Kokoro for higher quality where WebGPU is available.
- [P5] Import a personal voice: a custom Piper or ONNX voice trained elsewhere (voice banking for ALS).

### 4.4 Access

- [P1] Touch accommodations: hold-to-select time, select on release, debounce repeats, adjustable cell gap and padding for keyguards, and a choice of visual and audio feedback. _Done:_ visual feedback (the chosen word is outlined, optional) and spoken feedback (each word said as it's tapped, optional).
- [P1] Keyboard navigation for the whole app. _Partly checked:_ controls are real buttons and every screen passes axe-core's WCAG 2.2 AA rules ([0009](research/decisions/0009-plain-interface.md)); a full keyboard walkthrough is still to do.
- [P2] **Switch scanning:** _Started:_ auto, two-switch step and hold-to-move scanning; rows, columns or one at a time; speed, first-item delay, loops, auto-restart, the message bar and buttons, three highlight styles; keys, game controllers, tap anywhere and mouse buttons. See [design.md](design.md#switch-scanning). Still to do: block scanning, scanning settings and edit mode, switch-press timing beyond repeat filtering, and testing with switch users.
  - 1 or 2 switches
  - Auto, step, or inverse (hold-to-move) scanning
  - Linear, row/column, column/row, and block scan patterns
  - Speed, initial delay, number of loops, skip empty cells, auto-restart, scanning the message bar
  - Highlight styles
  - Input from keyboard keys, mouse buttons, the Gamepad API, or touch-anywhere
- [P2] **Auditory scanning:** prompts spoken in the cue voice, with grouped prompts. _Started:_ each item can be said as it's highlighted (device voice, skipped while the message is being spoken). Separate cue voice and headphone routing still to do.
- [P2] **Dwell selection** with any pointer (head mouse, eye tracker in mouse mode, webcam tracking). Shows dwell progress, with adjustable time and a lock-on radius.
- [P2] **Webcam head pointer** with MediaPipe Face Landmarker (WASM), plus facial gestures (eyebrow raise, mouth open, blink) as switches.
- [P4] Experimental webcam eye gaze with very large targets and easy recalibration.

### 4.5 Visual customization

- [P1] Grid size, font and size, label position, high contrast, dark mode, and reduced motion. _Done except grid size and font choice:_ Light, Dark and High contrast themes and Fill, Border or None colour styles (from the approved design), label size, and the system's reduced-motion setting.
- [P2] CVI-friendly presets: black background, a single bright highlight colour, less clutter, and dimming of everything outside the scan focus.
- [P2] Text-only mode for literate adults, with an age-appropriate look.

### 4.6 Editing and teaching

- [P1] Edit mode in place: add or edit buttons, drag to swap, copy and paste, link boards, and undo. _Started:_ everything but drag (Swap is two taps for now); see [design.md](design.md#edit-mode).
- [P1] **Edit lock** (PIN or hold-to-unlock) so the user can't change things by accident. _Hold-to-unlock done._
- [P1] **Print boards to PDF** as a low-tech backup, from the browser's own print. _Done:_ Print in the edit toolbar prints this board or all of them, one per page, with symbol credits.
- [P2] **Find word:** search any word and see the path to it highlighted. This is for partners modeling language and for new users. _Done_ ([0006](research/decisions/0006-partner-modeling.md)).
- [P2] **Modeling mode:** a partner's selections are highlighted without being spoken or logged as the user's own. _Done:_ taps are said but never added to the message.
- [P2] Board version snapshots, with restore.
- [P3] Bulk edit (change many buttons at once), board templates, and "copy a board and keep it linked to updates" or "fork it".

### 4.7 Data, privacy, and backup

- [P1] Everything is stored locally. `navigator.storage.persist()` is requested. A prompt encourages installing to the Home Screen. _Done:_ the prompt is in edit mode, so the communicator never sees it.
- [P1] **Export and import the whole profile** (OBZ plus a settings JSON), with periodic reminders to back up. _Done:_ Back up everything (in Settings, or from the reminder in edit mode) saves one .obz with the settings inside; importing it offers to restore them. Edit mode reminds when edited boards were never backed up, or changed and the last backup is over a week old.
- [P1] Import and export single boards and sets as OBF/OBZ. _Done,_ and tested with files Cboard's and CoughDrop's own exporters made ([decision 0014](research/decisions/0014-real-imports.md)).
- [P4] Opt-in usage logging:
  - Off by default and pausable
  - Passcode-protected
  - Analysed on the device into core-word use, utterance length, and new words, aggregated over at least 7 days
  - Raw logs exported only on purpose, in OBL format
- [P4] Several profiles on one device (classrooms).

### 4.8 Sync and collaboration (optional server)

- [P4] A small self-hostable sync server (Docker).
- [P4] **End-to-end encryption:** the server stores only ciphertext.
- [P4] Several devices per user. Supporters edit remotely, and changes arrive when the user's device next syncs. Edits never land mid-sentence.
- [P5] A shared board library, publishable and searchable.

### 4.9 Smart features (opt-in, local first)

- [P2] An n-gram word predictor that learns from the user's own text on the device.
- [P5] LLM phrase or abbreviation expansion (SpeakFaster-style) using a small on-device model on WebGPU, or an endpoint the user configures (self-hosted or a provider of their choice). It only offers suggestions; nothing is spoken automatically.
- [P5] Symbol suggestions when creating a button.

### 4.10 Beyond speech (later and maybe)

- [P5] Smart-home actions (Home Assistant webhooks), as AsTeRICS Grid does.
- [P5] A desktop wrapper (Tauri) for kiosk installs and fully offline installs from USB with no HTTPS setup.

---

## 5. Architecture

### 5.1 Shape

```
┌─────────────────────────────── Browser (PWA) ───────────────────────────────┐
│  UI (communicate view · editor · settings)        ← lazy-load editor        │
│        │                                                                    │
│  ┌─────▼─────────┐ ┌──────────────┐ ┌─────────────────┐ ┌───────────────┐   │
│  │ core          │ │ access       │ │ speech          │ │ predict       │   │
│  │ board model,  │ │ scan/dwell   │ │ engine router,  │ │ n-gram,       │   │
│  │ OBF/OBZ io,   │ │ state        │ │ audio cache,    │ │ (later) LLM   │   │
│  │ morphology    │ │ machines,    │ │ Web Speech      │ │               │   │
│  │               │ │ input adapt. │ │                 │ │               │   │
│  └─────┬─────────┘ └──────┬───────┘ └───────┬─────────┘ └──────┬────────┘   │
│        │                  │ worker          │ worker           │ worker     │
│        │           MediaPipe (WASM)   Piper/sherpa (WASM)  ONNX/WebGPU      │
│  ┌─────▼──────────────────────────────────────────────────────────────┐     │
│  │ storage: IndexedDB (boards, settings) · OPFS/Cache (models, audio) │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│  service worker: offline app shell, updates applied when the app is away    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ optional, E2E-encrypted
                              ┌────────▼────────┐
                              │ sync server     │  (self-host, Docker, P4)
                              └─────────────────┘
```

**Where WASM fits:** WASM is used where the work is heavy (TTS inference, face tracking, prediction models), not for the UI. The UI, the board model, and the scanning logic are plain TypeScript, which is easier to contribute to and fast enough. The `core` and `access` packages have no framework dependencies, so they can be tested exhaustively and reused if we ever ship a native shell.

### 5.2 Recommended stack

| Concern       | Choice                                                                                                | Why                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Language      | TypeScript (strict)                                                                                   | Widest contributor pool; types for the board schema                                                                          |
| UI            | **Svelte 5 + Vite**                                                                                   | Small bundles and fast rendering on cheap tablets. React is a fine alternative if the contributor pool matters more; see §10 |
| PWA           | vite-plugin-pwa (Workbox)                                                                             | Proven way to cache the app shell                                                                                            |
| Local data    | IndexedDB via Dexie; OPFS for large files                                                             | Mature, and works in Safari                                                                                                  |
| TTS           | onnxruntime-web + Piper voices (evaluate sherpa-onnx WASM as the single runtime); Web Speech fallback | Offline and consistent                                                                                                       |
| Head tracking | `@mediapipe/tasks-vision` Face Landmarker                                                             | Runs in WASM, gives blendshapes for gestures                                                                                 |
| Board format  | OBF/OBZ, with extras under `ext_anyaac_*`                                                             | Interoperability                                                                                                             |
| Tests         | Vitest (unit), Playwright (Chromium, WebKit, Firefox), axe-core                                       | Cross-engine end-to-end tests matter here                                                                                    |
| Sync (P4)     | Decide in P3: CouchDB/PouchDB (the AsTeRICS route) or a CRDT (Yjs/Automerge) with a thin relay        | Keep the data model sync-ready from P1                                                                                       |

### 5.3 Repo layout

```
packages/core      board model, OBF/OBZ, schema, migrations, morphology
packages/access    scanning, dwell, input adapters (keys, pointer, gamepad, face)
packages/speech    TTS router, workers, audio cache
packages/predict   word prediction
apps/web           the PWA
apps/sync          optional server (P4)
content/vocab      vocabulary sets as source (built to OBZ), CC BY-SA
content/symbols    build scripts for symbol packs + license metadata
docs/
```

### 5.4 Data model (sketch)

- **Profile:** settings for access, speech, and visuals, plus vocabulary sets and an optional log store.
- **Board:** `id`, `name`, `locale`, `grid {rows, cols, order[][]}`, `buttons[]`, `version`, `updatedAt`.
- **Button:** `id`, `label`, `vocalization?`, `imageId?`, `soundId?`, `action` (speak · append · navigate · back · home · special), `partOfSpeech?`, `wordForms?`, `hidden` (masking), `locked` (motor plan).
- **Asset:** content-addressed by hash (`image`, `sound`, `voice model`), with `license {type, author, source_url}`.
- **The model maps 1:1 to OBF.** Anything extra goes in `ext_anyaac_*`, and CI tests that boards round-trip without loss.
- All IDs are stable UUIDs, and each record carries a version so sync can be added later without a migration that rewrites everything.

### 5.5 Offline and self-hosting modes

1. **Hosted:** use our public instance once and install it; after that it runs offline. It's at [any-aac.com](https://any-aac.com/), on GitHub Pages behind Cloudflare, with the voices on the same site ([decision 0010](research/decisions/0010-hosting.md)).
2. **Static self-host:** `dist/` is plain static files, servable by nginx, Caddy, GitHub Pages, or a school web server. HTTPS is required for offline mode (or `localhost`). Document Caddy's automatic TLS and an internal CA for LAN setups.
3. **Docker:** static app plus optional sync server in one `docker compose up` (P4).
4. **Desktop wrapper:** Tauri for kiosks or air-gapped installs (P5).

---

## 6. Roadmap

Phases end when their exit criteria are met, not on a calendar.

**Where things stand (0.1.0, 2026-10-11).** P1 is built, with the starter vocabulary in three sizes as a draft for SLPs to review ([decision 0015](research/decisions/0015-three-sizes.md)). Of P1's exit criteria, Cboard and CoughDrop imports are tested with their own exporters' files ([decision 0014](research/decisions/0014-real-imports.md)); a full day offline on a budget tablet and SLP sign-off are still to come. From later phases, switch scanning (without block scanning), auditory scanning, find word, modeling mode, symbol search, word forms in English and Spanish, and a Spanish-first vocabulary are in. See the [changelog](../CHANGELOG.md).

### P0: Foundations

- Make the decisions in §10 (licence, framework, first users, name).
- Recruit advisors: at least 2 SLPs and at least 3 AAC users (paid).
- Write the board schema and OBF mapping; set up the repo, CI, and test device lab (§8).
- Run a TTS spike: Piper vs sherpa-onnx WASM, measuring cold start, render time per word, and memory on a cheap Android tablet and an old iPad.
- **Exit:** schema reviewed; TTS approach chosen with measured numbers; advisors on board.

### P1: MVP, a voice that works offline

- Grid boards, message bar, Web Speech plus one neural voice with pre-rendered button audio, starter vocabulary at 3 sizes, Mulberry and OpenMoji, touch accommodations, edit mode with edit lock, OBF/OBZ import and export, full-profile backup, print to PDF, PWA offline, persistent storage.
- **Exit:**
  - An AAC user can communicate for a full day offline on a budget tablet.
  - Boards from Cboard and CoughDrop import correctly.
  - SLP advisors sign off on the starter vocabulary.

### P2: Access for everyone

- Switch scanning (the full set), auditory scanning, dwell, webcam head pointer and facial switches, keyboard page with n-gram prediction, CVI presets, find word, modeling mode, masking, message banking, symbol search, board snapshots.
- **Exit:** a switch user, a head-pointer user, and an auditory-scanning user each complete a scripted conversation task. Scan timing is accurate to ±10 ms.

### P3: Language depth

- Word forms and morphology (English, then one more language), visual scene displays with just-in-time creation, a second language with its own layout, topic templates, bulk editing, more voices. Choose the sync approach.
- **Exit:** the vocabulary scores well on RELAAACs (SLP-reviewed); the second language is reviewed by native-speaking SLPs.

### P4: Sync, teams, and data

- Self-hostable end-to-end-encrypted sync server, multiple devices, remote editing, multiple profiles, opt-in logging with on-device analysis and OBL export, Docker deploy.
- **Exit:** a clinic or school pilot runs on its own server.

### P5: Advanced

- LLM phrase prediction (opt-in), personal voice import, experimental webcam eye gaze, smart home, desktop wrapper, shared board library, more languages.

---

## 7. Quality bars

| Metric                                        | Target                                                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Tap to start of audio (cached audio)          | < 100 ms on a budget Android tablet                                                             |
| Tap to start of audio (uncached neural voice) | < 400 ms, then cached                                                                           |
| Cold start offline to a usable board          | < 2 s on reference low-end hardware                                                             |
| JS for the communication view                 | < 200 KB gzip (editor and models lazy-loaded)                                                   |
| Data loss                                     | Zero. Every write is transactional; schema migrations are tested on real exported profiles      |
| Editor and settings accessibility             | WCAG 2.2 AA; the communication view is usable with VoiceOver and TalkBack                       |
| Updates                                       | Never applied mid-use; never change vocabulary positions; release notes shown in plain language |

## 8. Testing and validation

- **Device lab:**
  - The oldest supported iPad in Safari
  - A budget Android tablet in Chrome
  - A school Chromebook
  - A Windows PC with a Tobii eye tracker in mouse mode
  - A USB/Bluetooth switch interface and a gamepad
  - Firefox desktop
- **Automated:**
  - Unit tests for the `core` and `access` state machines, with property-based tests for scanning order and for grid round-trips
  - Playwright across all three browser engines
  - OBF fixtures exported from other apps
- **Human:** each phase ends with sessions with AAC users and an SLP review. Pay advisors. Publish findings (anonymized) in `docs/`.

## 9. Risks

| Risk                                                                     | Mitigation                                                                                                                                                       |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The vocabulary is weak, and the project becomes "another free board app" | Make the vocabulary a funded workstream led by SLPs from P0; score it against RELAAACs                                                                           |
| iOS evicts storage or restricts audio                                    | Encourage installing to the Home Screen, call `persist()`, back up and sync, start audio from user gestures, test on devices every release                       |
| GPL licensing from Piper and espeak-ng limits licence choice             | Pick a GPL-compatible licence (§10), or isolate TTS behind a swappable engine interface                                                                          |
| The NC licence on ARASAAC blocks commercial redistribution               | Ship ARASAAC as an optional download only, and track the licence on every asset                                                                                  |
| Copying proprietary layouts invites legal trouble                        | Design our own vocabulary from scratch; contributors confirm their content is original                                                                           |
| Inaccurate webcam tracking frustrates users                              | Prefer head pointing over eye gaze; big targets; label eye gaze experimental                                                                                     |
| The name clashed with the existing "OpenAAC" non-profit (openaac.org)    | Renamed to Any AAC before release ([decision 0011](research/decisions/0011-name.md))                                                                             |
| Maintainers burn out (like Cboard's apparent slowdown)                   | Keep scope tight per phase; seek grant funding (AsTeRICS is grant-funded through 2028); consider collaborating with AsTeRICS and Ace Centre instead of competing |

## 10. Decisions

### Made (2026-10-10)

- **Licence:** AGPL-3.0-or-later for the code; CC BY-SA 4.0 for vocabulary content.
- **UI framework:** Svelte 5 with TypeScript and Vite.
- **Name:** "Open AAC" at first; renamed **Any AAC** before release, to avoid confusion with the OpenAAC non-profit ([decision 0011](research/decisions/0011-name.md)).
- **Build fresh** rather than fork AsTeRICS Grid. Still worth talking to them and to Ace Centre.
- **UI design:** approved from the mockups. See [design.md](design.md).
- **Spanish is the first language after English.** Board words, speech, and the app's own buttons and menus are separate layers, so each can be added on its own. See [design.md](design.md#languages).

### Still open

Decisions since then are recorded in [research/](research/README.md#decisions).

1. **Who comes first?** My recommendation: **emergent and developing communicators using touch, plus their SLPs and parents.** That's the largest group, and it forces the vocabulary work. ALS and literate-adult features (keyboard, prediction, voice banking) follow in P2 and P5.
