# Findings: access

## Touch

Hold-to-select, select-on-release, ignoring repeated taps, and gaps for keyguards are standard ([foundations.md §2.7](../foundations.md#27-access-methods)). Open AAC has all of them.

## Switch scanning

- Expected: one or two switches; automatic, step and hold-to-move scanning; linear, row/column and block patterns; speed, first-item delay, loops, skipping empty cells, auto-restart, scanning the message bar ([PRC-Saltillo](https://documentation.prc-saltillo.com/docs/switch-scanning)). In-app scanning beats the operating system's Switch Control because highlighting, cues and speech can be designed together ([AbleNet](https://support.ablenetinc.com/aac-education-and-resources/speech-apps-with-in-app-switch-scanning/)).
- Switch interfaces send keys (usually Space and Enter), mouse clicks or game controller buttons ([foundations.md §4.3](../foundations.md#43-switch-input)).

**What we do:** all of the above except block scanning; keys, game controllers, tap anywhere and mouse buttons. Untested with switch users so far.

## Auditory scanning

- Group cues should hint at what a group holds, and can shrink to "row 1, row 2" as people learn the layout; repeating the choices gives people time to respond ([Bridge School](https://communication.bridgeschool.org/intervention/aac-system-design-guiding-principles/aac-system-design-examples-of-aac-tools-and-techniques/)).
- A distinct cue voice, with cues in headphones and the message out loud, keeps cues private ([Saltillo](https://saltillo.com/support/article/scan-prompts-8), [Ace Centre Pasco](https://acecentre.org.uk/page/pasco-support/)).

**What we do:** each item said as it's highlighted (a group by its first word), in the device voice, never over the message. Cue voice and headphone routing are still to do.

## High contrast and CVI

- Dark backgrounds reduce clutter, but extreme contrast, multicoloured symbols and coloured boxes on black can add complexity; recommendations must be individual and made with a vision specialist ([PrAACtical AAC](https://praacticalaac.org/praactical/aac-cvi-can-we-chat/), [Global Symbols](https://globalsymbols.com/news/2024-06-28-aac-symbols-for-individuals-with-cerebral-visual-impairment-cvi?locale=en), [TIES](https://publications.ici.umn.edu/ties/communicative-competence-tips/learners-with-cvi-and-aac)).

**What we do:** a general High contrast theme with symbols on light cards (so black outlines show). It isn't a CVI preset; one should be designed with a CVI specialist.
