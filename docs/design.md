# Design

The UI direction was approved on 2026-10-10 from an interactive mockup canvas covering eight screens: communicate (tablet and phone), keyboard with prediction, switch scanning, find-word modeling, visual scene display, edit mode and settings. The canvas is at https://claude.ai/artifact/JxK1rLoAqnKdu54JvsFZb4. It is private, so ask the maintainer for access.

## Approved decisions

1. **Layout.** The message bar runs across the top, with a large Speak button at its right. Navigation is a fixed rail on the left on tablets and a bar along the bottom on phones. Help is always visible. Editing sits behind a press-and-hold.
2. **Colour by word type.** The Modified Fitzgerald Key is the default, drawn as pale fills with a coloured edge. Colours come from each button's word type (`ext_openaac_part_of_speech`), so a theme can change them. Folders are marked by a tab shape, not a colour.
3. **Core words never move.** On topic boards (Food, Feelings, …) the core words that appear there sit in exactly the same cell as on the home board.
4. **Typeface.** Atkinson Hyperlegible Next, self-hosted so it works offline.
5. **Scanning highlight.** A thick yellow outline, with everything outside the scan dimmed. It defaults to a high-contrast theme.

## Tokens (light theme)

| Token       | Value     | Use                                |
| ----------- | --------- | ---------------------------------- |
| `--ground`  | `#E6EAEE` | App background                     |
| `--surface` | `#FFFFFF` | Bars, rail, plain buttons          |
| `--ink`     | `#15202B` | Text and symbols                   |
| `--muted`   | `#4D5B69` | Secondary text (~7:1 on white)     |
| `--line`    | `#C3CDD6` | Borders                            |
| `--accent`  | `#1D5BD6` | Speak button, focus, current place |
| `--help`    | `#B42318` | Help button                        |

| Word type            | Fill      | Edge      |
| -------------------- | --------- | --------- |
| Pronoun / person     | `#FFF1B8` | `#A67C00` |
| Verb                 | `#D5F2CC` | `#2E7A22` |
| Descriptor           | `#D6E7FF` | `#2A62C2` |
| Noun                 | `#FFDFC2` | `#B85A0C` |
| Preposition / social | `#FBDDEB` | `#B02D6B` |
| Question             | `#E7DDFB` | `#6741BC` |
| Negation             | `#FFD9D6` | `#BE2F28` |
| Determiner           | `#FFFFFF` | `#6F7F8F` |
| Folder               | `#F4F6F8` | `#4F5E6C` |

The dark and high-contrast themes from the mockups are not built yet.

## Placeholders

- **Symbols** in the starter boards come from Mulberry (most words) and OpenMoji (pronouns and other function words Mulberry lacks), both CC BY-SA 4.0. Each image records its licence and source. The choices are in `apps/web/src/assets/symbols/sources.json` and should be reviewed with SLPs. Five words (it, feel, is, do, tablet) still use the project's placeholder line drawings.
- **The starter vocabulary** (`apps/web/src/lib/starter.ts`) follows the rules above, but it is not a designed vocabulary. The real set will be built with SLPs and scored against RELAAACs.

## Phone layouts

Screens narrower than 600px show a board's compact layout when it has one. A board names its compact layout in `ext_openaac_compact_board`, and links always point at the full board, so Back and navigation behave the same on every device. The starter set has phone layouts for the core board (24 words, from the approved phone mockup) plus Food and Feelings. Core words keep fixed cells within each layout, but a phone cell is not in the same place as the tablet cell. How motor plans should carry between phone and tablet is a question for the vocabulary work with SLPs.

Labels wrap between words and never mid-word. A word too long for its cell shrinks until it fits (down to 0.6rem), rather than being cut off or split. Each button uses CSS size containment, so nothing inside it can resize the grid; symbol and label sizes come from the cell (container query units).

## Languages

Languages come in three layers, which can each be set separately:

1. **Board words.** A board's own words are in its language (`locale`); other languages come from each button's OBF `translations`, and board names from `ext_openaac_name_translations`. Every language uses the same boards with every word in the same cell, so a bilingual communicator's motor plans carry over. The starter boards come in English and Spanish (`apps/web/src/lib/starter-translations.ts`). Spanish verbs are a mix of first person (the ones most often said first: _quiero_, _puedo_, _tengo_) and infinitives that follow them (_quiero comer_), until there is grammar support.
2. **Speech.** Each language has its own chosen voice, device or Open AAC, and speaks with the right language tag.
3. **Buttons and menus.** The app's own words are in `apps/web/src/lib/i18n.ts` (English and Spanish). "Automatic" follows the board words when the app is translated into their language, then the browser's languages.

Settings → Language picks the words' language, an optional second language and the app's language. With a second language, a button with a globe and the other language's name appears next to Home and Back; one tap switches the words, the voice and, on Automatic, the buttons and menus. The message keeps the words already in it, so mixing languages works.

Still to do: a second language's own layout where word order or vocabulary needs it, and word forms and gender agreement (Spanish adjectives are masculine until there's a setting for the communicator's gender). Switching languages with Open AAC voices in both loads the other voice, which takes a second or two, while the device voice fills in. Import problems and some voice licence names are still shown in English. Every translation needs review by native-speaking SLPs.

## Known gaps

- **Phones in landscape** get the tablet board, which is very short at phone height.
- **People, Places, Body and Things** have no phone layout yet. The phone core board doesn't link to them.
