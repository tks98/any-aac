# AAC research notes

This file covers three things: what an AAC (augmentative and alternative communication) system has to do well, what already exists, and what a browser can and can't do. [plan.md](plan.md) builds on it.

Researched 2026-10-10. Where a source was a vendor blog or a secondary write-up, the text says so. Claims marked _(unverified)_ come from general knowledge and still need checking.

---

## 1. Who uses AAC

AAC users don't share one profile, and their needs pull the design in different directions.

| Group                                    | Examples                                                                                       | What they need most                                                                                                                                      |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Developmental, emergent communicators    | Young autistic children, Down syndrome, cerebral palsy, Rett syndrome, intellectual disability | Symbols, simple layouts that can grow, visual scene displays, support for partner modeling, word positions that never move                               |
| Developmental, more advanced or literate | Autistic teens and adults, adults with CP                                                      | A full vocabulary plus a keyboard, an adult look, speed, privacy                                                                                         |
| Acquired, progressive                    | ALS/MND, MS, Parkinson's                                                                       | Typing with prediction, phrase banks, voice and message banking, access methods that can change as movement declines (touch, then switch, then eye gaze) |
| Acquired, sudden                         | Aphasia after stroke, brain injury                                                             | Picture-supported phrases, topic boards, partner-assisted use                                                                                            |
| Temporary or situational                 | ICU patients, laryngectomy, situational mutism, autistic shutdowns                             | Quick setup, text entry, quick phrases                                                                                                                   |

**Design implication:** one app has to run everything from a 4-button board to a full keyboard with prediction. It also has to support every access method, and switching between modes must not cost the user their vocabulary.

---

## 2. What an AAC system needs (field consensus)

### 2.1 A full vocabulary: core plus fringe

- A small set of high-frequency **core words** (want, go, stop, more, not, that, you, I, like) makes up most of what people say. Sources put it at roughly **80–85% of everyday utterances**, though the exact figures vary ([intervention study guide](https://open-exam-prep.com/study-guides/praxis-slp/treatment-cognition-motor-speech-aac/intervention-implementation-aac)).
- **Fringe words** are topic-specific nouns and names, and they get paired with core words.
- A vocabulary limited to requests ("I want cookie") is a known failure mode. Users need to comment, ask, refuse, joke, and tell stories.
- **RELAAACs** is a published rubric for judging the _language_ inside an AAC app, used alongside feature checklists ([PrAACtical AAC](https://praacticalaac.org/praactical/introducing-relaaacs-rubric-for-evaluating-the-language-of-apps-for-aac/)). We should score our own vocabulary sets against it.

### 2.2 Motor planning consistency

- LAMP (Language Acquisition through Motor Planning) rests on one principle: **every word keeps one fixed motor pattern**, which over time lets users select words automatically, much as speakers produce speech ([LAMP research](https://www.aacandautism.com/lamp/research), [LAMP WFL](https://www.liberator.co.uk/resources/vocabulary/lamp-words-for-life)).
- LAMP WFL's "Vocabulary Builder" **hides words for teaching without moving them**. Its levels go from 84 one-hit words to a transition level of about 200 words to thousands of words, and positions stay the same throughout.
- **Implication:** buttons never move unless an editor moves them deliberately. Growing a vocabulary means revealing hidden cells, not reflowing the layout. Smaller and larger versions of a vocabulary set should share positions.

### 2.3 Colour coding by part of speech

- The Modified Fitzgerald Key colours word classes (for example, verbs green, pronouns yellow, nouns orange, adjectives blue) and orders them left to right in sentence order ([PrAACtical AAC](https://praacticalaac.org/strategy/communication-boards-colorful-considerations/), [Inclusive TLC](https://www.inclusive.com/blogs/inclusive-insights/what-do-the-colours-on-a-communication-board-mean)).
- Different systems use different colours (WordPower follows the PCS scheme). **Implication:** store part of speech on each button and apply colours from a theme the user can configure, rather than hardcoding colours.

### 2.4 Grammar and morphology

- Users need word forms such as plurals, tenses, -ing, comparatives, and possessives. Proloquo2Go's grammar popups offer every inflection, can be limited by word class or tense, and infer the verb's subject from the message ([AssistiveWare](https://assistiveware.com/support/proloquo2go/vocabulary-grammar/grammar-support-popups)).
- Bilingual AAC must not be a translation of an English layout. Each language needs its own word order and its own morphology; Spanish has about 42 verb forms ([Closing the Gap, 2025](https://www.closingthegap.com/wp-content/uploads/2025/10/BeyondTranslationBuildingAACMinspeak.pdf)).
- **Implication:** word forms need a model that can vary by language (a morphology engine for each language), not English-only rules.

### 2.5 Visual scene displays (VSDs) and just-in-time programming

- A VSD is a photo of a real scene with "hotspots" that speak. Penn State's research group (Light, Drager, Holyfield) finds them promising for beginning communicators. The studies are small and mostly single-case.
- Adding vocabulary **in the moment** ("just-in-time" programming) increased symbolic communication turns for students aged 8–20 ([AJSLP 2017](https://pubs.asha.org/doi/10.1044/2017_AJSLP-15-0197)). A 2025 study found the same for autistic children with minimal speech ([AJSLP 2025](https://pubs.asha.org/doi/10.1044/2025_AJSLP-24-00450)).
- **Implication:** going from taking a photo to having a talking hotspot should take seconds and work from a phone.

### 2.6 Aided language modeling

- Communication partners are taught to _model_ language on the user's own system, pointing to symbols while they speak. This is standard AAC teaching practice _(standard practice; not separately sourced here)_.
- **Implication:** we need a partner-facing "where is this word?" feature that shows the navigation path to any word. We also need a modeling mode that highlights selections without speaking or logging them as the user's own words.

### 2.7 Access methods

Commercial apps treat each of these as standard:

- **Direct touch, with accommodations:** select after holding for a set time, select on release, ignore repeated taps, larger targets, and gaps between cells for keyguards.
- **Switch scanning:** one or two switches; auto, step, or hold-to-move ("inverse") scanning; linear, row/column, and group/block patterns; adjustable scan speed, initial delay, and number of loops; skipping empty cells; auto-restart; scanning the message bar ([PRC-Saltillo](https://documentation.prc-saltillo.com/docs/switch-scanning), [TouchChat guide](https://www.liberator.co.uk/product-support/downloads/touchchat/touchchat_using_wired_1_and_2_switch_scanning.pdf), [Wikipedia](https://en.wikipedia.org/wiki/Switch_access_scanning)).
- **Auditory scanning:** each option is spoken as it's highlighted, for users with low vision or cortical visual impairment. The prompt voice is separate from the speaking voice, and prompts ideally play into headphones while the message goes to the speaker ([Zyteq](https://www.zyteq.com.au/selection-guide/auditory_scanning), [Ace Centre Pasco](https://acecentre.org.uk/projects/pasco)).
- **AbleNet recommends in-app scanning over OS-level Switch Control**, because highlighting, audio cues, and speech can then be designed to work together ([AbleNet](https://support.ablenetinc.com/aac-education-and-resources/speech-apps-with-in-app-switch-scanning/)).
- **Dwell selection** with eye trackers, head mice, or webcam tracking (see §4.2).

### 2.8 Speed

- Spoken conversation runs well over 100 words per minute, and AAC is far slower. In a Sheffield prototype, fine-tuned language-model prediction raised AAC rates by about 20%, to around 30 wpm ([Yusufali et al., ICASSP 2024](https://staffwww.dcs.shef.ac.uk/people/S.Goetze/papers/2024_Yusufali_ICASSP24_Refining_Text_Input_for_Augmentative_and_Alternative_Communication_AAC_Devices_-_Analysing_Language_Model_Layers_for_Optimisation.pdf)).
- Google's SpeakFaster expands abbreviations into phrases using conversation context. In simulation it cut motor actions by 57%, and two eye-gaze users with ALS typed 29–60% faster ([arXiv 2312.01532](https://arxiv.org/abs/2312.01532)). The sample was small, but the signal is strong.
- **Implication:** word and phrase prediction matter a lot for users who type. AI prediction must stay optional, run locally or on a self-hosted endpoint, and only ever _suggest_. It should never speak for the user.

### 2.9 Why AAC systems get abandoned

Commonly cited causes are a poor fit with the user (physical access, cognition, voice), too little training for users and their support network, no structured way of teaching, negative attitudes, systems that aren't updated as needs change, and inconsistent support across settings ([SEN Magazine](https://senmagazine.co.uk/content/tech/assistive-tech/28585/aac-abandonment/), [Smartbox](https://thinksmartbox.com/?p=35699), [UNH thesis](https://scholars.unh.edu/thesis/385)).

**Product implications:**

- Editing has to be fast and forgiving, because a vocabulary that isn't updated gets abandoned.
- Teaching and modeling aids should be built in.
- Defaults must be good on day one.
- Printing low-tech backup boards should be easy.
- The voice has to be one the user is willing to be heard in.

### 2.10 Privacy and data logging

- Language Activity Monitoring (LAM) logs every word with a timestamp. Clinicians value it for tracking progress, and the AAC Institute argues that language samples are needed. AssistiveWare holds that users have "an absolute right to privacy" over what they say, and leaves LAM out of its products ([AssistiveWare](https://www.assistiveware.com/blog/aac-data-collection-and-privacy), [PrAACtical AAC](https://praacticalaac.org/praactical/privacy-and-aac-a-few-reflections/)).
- In one study, autistic adult AAC users worried about companies logging their speech, about apps collecting data they had no reason to collect (such as location), and about partners snooping on a device that had been handed to them ([arXiv 2404.17730](https://arxiv.org/pdf/2404.17730)).
- AssistiveWare's proposed middle ground: analyse on the device, aggregate over at least 7 days, and skip fringe-word frequency data because fringe words are personal.
- **Implication:** logging is off by default, opt-in, analysed on the device, protected by a passcode, and the user can pause it. There's no telemetry.

### 2.11 What clinicians check in a feature match

Clinicians compare systems using published checklists (Gosnell 2011; Marfilius & Fonner 2012) together with RELAAACs ([PrAACtical AAC](https://praacticalaac.org/praactical/5-features-to-look-for-in-sgds-and-aac-apps/), [USSAAC handout](https://praacticalaac.org/wp-content/uploads/filebase/organizations-and-handouts/USSAAC%20AAC%20App%20Selection%20for%20Students%20with%20Autism%20Handout.pdf)). The categories they cover:

- Vocabulary organization and symbol set
- Grid size and density, and how many levels deep navigation goes
- Access methods
- Voices
- Editing
- Data collection
- Portability, durability, and cost

During trials they also look at **response time** and at visual and motor barriers. Our settings and documentation should map onto these categories so an SLP (speech-language pathologist) can do a feature match against our app.

---

## 3. What already exists

### Commercial products (the quality bar)

Proloquo2Go (AssistiveWare), TD Snap (Tobii Dynavox), TouchChat and LAMP WFL (PRC-Saltillo), and Grid 3 (Smartbox) set the bar:

- Vocabulary systems designed by SLPs at several sizes
- Grammar support
- Dedicated hardware
- Eye-gaze integration
- Help with insurance funding

They cost hundreds of dollars for an app and thousands for a dedicated device, and their vocabulary layouts are proprietary. **We must not copy their layouts.**

### Open-source projects

| Project                                                                                                                                                     | Shape                                 | Strengths                                                                                                                                                                                                                              | Gaps                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [AsTeRICS Grid](https://github.com/asterics/AsTeRICS-Grid)                                                                                                  | Browser PWA, Vue + PouchDB, AGPL-3.0  | Works offline in any browser; optional end-to-end-encrypted CouchDB sync; scanning, hover, and keyboard input; word prediction and word forms; ARASAAC and OpenSymbols; smart home, media, and a Matrix messenger. Funded through 2028 | Speech uses device voices plus ResponsiveVoice (non-commercial licence); its developer docs say they are "not finished, maybe outdated"; eye and head tracking need the separate AsTeRICS framework; no releases are published |
| [Cboard](https://acecentre.org.uk/language-library/cboard-aac)                                                                                              | React web app, GPL-3.0                | ~50 languages, Mulberry symbols, scanning, OBF import and export, an AI board builder ("Cbuilder")                                                                                                                                     | Offline only in Chrome according to Ace Centre; the main repo's last recorded push was April 2024 ([ecosyste.ms](https://awesome.ecosyste.ms/projects/github.com%2Fcboard-org%2Fcboard)); ~160 open issues                     |
| CoughDrop                                                                                                                                                   | Ember web app plus Rails; created OBF | Mature, cloud-based, OBF, open symbols                                                                                                                                                                                                 | Sold to Forbes AAC (MavWare) in 2023 ([blog](https://blog.mycoughdrop.com/coughdrop-has-joined-forbes-aac/)); its open-source future is unclear                                                                                |
| [Pasco](https://acecentre.org.uk/projects/pasco) / [Echo](https://acecentre.org.uk/blog/introducing-echo-the-aac-app-for-easier-communication) (Ace Centre) | Auditory scanning                     | The best reference for auditory scanning: separate cue and speech voices, cues split between headphones and speaker, switch, gamepad, and swipe input                                                                                  | Narrow scope; Pasco is no longer developed and Echo's source status is unclear                                                                                                                                                 |
| [LibreAAC](https://f-droid.org/eu/packages/org.libreaac.app/)                                                                                               | Native Android, offline               | OBF/OBZ import and export                                                                                                                                                                                                              | Android only                                                                                                                                                                                                                   |
| [Voxa](https://github.com/madfam-org/voxa/pull/35)                                                                                                          | Web, OBF 0.1 interop                  | JSON Schemas for OBF and OBZ; stores motor-plan locks in `ext_` fields                                                                                                                                                                 | Early stage                                                                                                                                                                                                                    |

**Where the open-source field falls short:**

1. None of these projects offers a **research-grounded, open-licensed vocabulary** at several sizes with stable motor plans. This is the biggest gap and the hardest one to fill.
2. None of them ships an **offline neural voice that sounds the same on every device**. All of them rely on whatever voices the OS provides.
3. Advanced access (webcam head tracking, facial-gesture switches, full auditory scanning) isn't **built in and working in a plain browser**.
4. None of them has **tools for partners modeling language** (find-word paths, a modeling mode).

---

## 4. Browser technical findings

### 4.1 Speech output

**The Web Speech API (`speechSynthesis`)** is free and built in, but unreliable as the only engine ([Readium notes](https://readium.org/speech/docs/WebSpeech.html), [MDN mirror](https://docs.w3cub.com/dom/speechsynthesisvoice/localservice)):

- Voices differ by OS and browser, and `voiceURI` isn't unique, so a voice can't be stored by ID.
- Some voices are cloud-based (`localService: false`) and fail offline.
- Chrome on Android lists languages instead of real voices, and falls back to English when a voice pack isn't downloaded.
- Firefox for Android reportedly has no speech synthesis at all.
- iOS requires speech to start from a user gesture.

**Neural TTS running in the browser via WASM or WebGPU works today:**

| Engine       | How                                                                                                                                        | Size                                    | Notes                                                                                                                                                                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Piper (VITS) | [piper-tts-web](https://github.com/Mintplex-Labs/piper-tts-web), [vits-web](https://github.com/diffusionstudio/vits-web) (onnxruntime-web) | ~60–75 MB per medium voice              | Runs on the CPU, reportedly 3–5× real time ([vendor benchmark](https://offlinetts.com/blog/browser-tts-showdown-kokoro-piper-kitten/)); many languages. **The engine is now GPL-3.0** (OHF-Voice/piper1-gpl; the MIT rhasspy/piper was archived in Oct 2025) and phonemizes with espeak-ng (GPL-3.0). Voice licences differ, so check each MODEL_CARD |
| Kokoro-82M   | kokoro-js (WebGPU or WASM)                                                                                                                 | ~86 MB and up depending on quantization | Sounds more natural, but heavier; sources disagree on whether q8 output is clean; mostly English                                                                                                                                                                                                                                                      |
| sherpa-onnx  | [WASM TTS demo](https://huggingface.co/spaces/k2-fsa/web-assembly-tts-sherpa-onnx-en)                                                      | Depends on the model                    | One runtime for Piper, Matcha, and other models; worth evaluating as a single engine                                                                                                                                                                                                                                                                  |

**Implications:**

- Ship a neural voice as an optional, downloadable "voice pack".
- Run TTS in a Web Worker.
- **Pre-render and cache audio for every button** so taps play instantly and don't depend on CPU speed.
- Keep Web Speech as a fallback and a zero-download default.

### 4.2 Head and eye tracking in a webcam

- **MediaPipe Face Landmarker** (`@mediapipe/tasks-vision`, WASM) gives face landmarks, head pose, and blendshapes for facial expressions in real time. Google's **Project GameFace** used it to drive a pointer from the forehead and iris and to "click" with facial gestures ([Google blog](https://developers.googleblog.com/2023/06/project-gameface.html)). Tracking degrades when the head turns more than ~45°.
- **WebGazer** (webcam eye gaze) self-calibrates, but its error is around 4° of visual angle, roughly the width of a large key, and it is noisier than lab trackers ([IJCAI 2016](https://mlanthology.org/ijcai/2016/papoutsaki2016ijcai-webgazer), [PMC comparison](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11627531/)).
- Dedicated eye trackers (Tobii and others) usually drive the OS mouse, so **mouse dwell support covers them** _(unverified per device)_.
- **Implication:** build webcam head tracking with dwell and facial-gesture "switches" as a real feature. Treat webcam eye gaze as experimental, used only with very large targets.

### 4.3 Switch input

Switch interfaces usually present themselves as keyboard keys (Space or Enter by default), as mouse clicks, or as gamepad buttons _(general knowledge)_. A browser can read all three: `keydown`, `pointerdown`, and the Gamepad API. A touchscreen can also act as a switch (tap anywhere, or left half versus right half).

### 4.4 Running offline and where data lives

- A **PWA with a service worker** gives offline use after the first load. Service workers need a secure context, meaning HTTPS or `localhost`, and **don't run from `file://`**.
- **iOS Safari:** the old ~50 MB limits have mostly been replaced by quotas based on disk size, but **eviction** is still the risk. Installed Home Screen apps are reportedly exempt from the 7-day rule for script-writable storage. `navigator.storage.persist()` helps but isn't guaranteed ([Apple forums](https://developer.apple.com/forums/thread/710157), [MagicBell guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)). The sources conflict, so we need to test on real devices.
- **Implications:**
  - Ask for persistent storage.
  - Encourage installing to the Home Screen.
  - Keep **backups to a file or to sync as a first-class feature**, so the device is never the only copy of someone's voice.
  - Keep large model files in OPFS or the Cache API and board data in IndexedDB.

### 4.5 Board interchange: Open Board Format (OBF/OBZ)

- OBF was released by CoughDrop as an open-licensed JSON format for boards: grid, buttons, images, sounds, and links to other boards ([CoughDrop](https://blog.mycoughdrop.com/unlocking-board-files)). It is implemented by Cboard ([import/export](https://www.cboard.io/cboard/openboard/open-source/2018/06/30/cboard-openboard-support/)), LibreAAC, Voxa, and others.
- An `.obz` file is a package holding a `manifest.json`, `boards/*.obf`, images, and sounds.
- App-specific data goes in `ext_`-prefixed fields; Voxa, for example, stores motor-plan locks and part of speech there.
- An `.obl` logging format exists too.
- Field-level details (`format`, `grid.order`, `load_board`, the special actions) _(need checking against the spec at openboardformat.org, which didn't render for me)_.
- **Implication:** make OBF/OBZ our native import and export format, store our extras in `ext_openaac_*`, and test that every board round-trips without loss.

### 4.6 Locking down the device

A web page can't lock a device. That job falls to the OS: iOS Guided Access, Android screen pinning or kiosk apps, ChromeOS kiosk mode, Windows Assigned Access. The app should have its own **edit lock** (PIN or hold-to-unlock) and should document how to set up the OS lock on each platform.

---

## 5. Licensing findings

### Symbol sets

| Set                               | Licence                                                                                                                                                                               | Fit                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Mulberry (~3,400 symbols)         | CC BY-SA 4.0 ([OpenSymbols](https://www.opensymbols.org/repositories/mulberry))                                                                                                       | **Bundle by default.** Adult-friendly, allows commercial use with attribution and share-alike      |
| OpenMoji                          | CC BY-SA 4.0 ([FAQ](https://openmoji.org/faq))                                                                                                                                        | Bundle as a supplement                                                                             |
| Tawasol (Arabic)                  | CC BY-SA 4.0 ([terms](https://tawasol.mada.org.qa/terms-and-conditions/?lang=en))                                                                                                     | Optional pack for Arabic                                                                           |
| ARASAAC (~13k+, very widely used) | **CC BY-NC-SA** ([terms](https://aulaabierta.arasaac.org/en/terms-of-use))                                                                                                            | **Optional download only.** The non-commercial clause would block anyone selling preloaded devices |
| Sclera                            | Conflicting: its own site says CC with consent needed for commercial use, while Global Symbols lists CC BY-NC 4.0 ([Sclera](https://sclera.be/fr/picto/copyright))                    | Optional; check before including                                                                   |
| OpenSymbols (aggregator, 50k+)    | Varies per symbol ([site](https://www.opensymbols.org/))                                                                                                                              | Search integration; track the licence on every image                                               |
| Global Symbols                    | Hosts many sets; share-alike sets can be used commercially, but you can't charge for the symbols themselves ([terms](https://globalsymbols.com/about/terms-and-conditions?locale=en)) | Search integration                                                                                 |

**Implication:** store licence and attribution metadata **on every image**, and generate an attribution screen automatically.

### Vocabulary sets

- Project Core's Universal Core is a free and popular core set, possibly under CC BY 4.0 _(unverified)_ ([Speechy Musings list](https://speechymusings.com/where-to-find-free-core-vocabulary-low-tech-aac-boards/)).
- No open robust vocabulary covers several sizes. We'll need to **create our own with SLPs** and release it under CC BY-SA 4.0 or CC0.

### TTS

Piper's current engine and espeak-ng are both GPL-3.0. If we bundle them, our app's licence has to be GPL-compatible. Voice models are licensed one by one.

---

## 6. Funding (later)

In the US, Medicare covers speech-generating devices under HCPCS E2510 (the device) and E2511 (software for a PC or PDA), under LCD L33739. Coverage requires a written order before delivery and goes through a DME supplier ([ASHA](https://asha.org/practice/reimbursement/medicare/sgd_policy)). An open-source browser app won't fit this path at first. Partnering with a supplier to sell preloaded hardware could come later, which is another reason to keep NC-licensed content out of the default bundle.
