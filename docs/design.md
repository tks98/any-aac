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

Labels wrap between words and never mid-word. Each button uses CSS size containment, so nothing inside it can resize the grid; symbol and label sizes come from the cell (container query units).

## Known gaps

- **Phones in landscape** get the tablet board, which is very short at phone height.
- **People, Places, Body and Things** have no phone layout yet. The phone core board doesn't link to them.
