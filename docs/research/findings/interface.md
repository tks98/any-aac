# Findings: interface design

What makes an AAC interface easy to use, and how Any AAC's measures up. The short answer from the evidence: plain, consistent and legible, with personalisation for appeal, not decoration.

## AAC displays

- The state-of-the-science review of AAC display design ([Light, Wilkinson, Thiessen, Beukelman & Fager 2019](https://pure.psu.edu/en/publications/designing-effective-aac-displays-for-individuals-with-development/)): for grid displays, spatial cues and clustering symbols by colour help children search; colour **backgrounds** don't help on smaller displays and may draw children's attention away from the symbols; for adults with acquired conditions, the number, types and pairing of symbols affect performance.
- Colour backgrounds did speed search in large (60-symbol) arrays ([Thistle 2019](https://pubs.asha.org/doi/abs/10.1044/2019_PERSP-19-00017)); see [vocabulary.md](vocabulary.md#colour).
- **Appeal matters, especially for children.** Children designing AAC for a peer made it a companion, with play, bright colours, humour and personal themes ([Light, Page, Curran & Pitkin 2007](https://pure.psu.edu/en/publications/childrens-ideas-for-the-design-of-aac-assistive-technologies-for-/)); AAC devices contrasted sharply with popular toys (Light, Drager & Nemser 2004). The evidence points to a plain, usable base that families can personalise (photos, themes), not a stylised one.

## Cognitive accessibility

W3C's [Making Content Usable for People with Cognitive and Learning Disabilities](https://www.w3.org/TR/coga-usable/) (COGA) gives design patterns that fit AAC users and their partners closely. How Any AAC meets them:

| Pattern (abridged)                                       | Any AAC                                                                                                    |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Use a consistent visual design; familiar hierarchy       | One layout everywhere: message bar on top, navigation at the side (bottom on phones), board in the middle  |
| Ensure controls and content don't move unexpectedly      | Words locked in place; hidden words keep their cell; optional buttons only appear when turned on           |
| Clearly identify controls; use icons that help the user  | Every button has an icon **and** a word (Delete and Clear gained words in this check)                      |
| Provide help for non-standard controls                   | Tapping Edit, which needs a hold, now says so                                                              |
| Provide feedback                                         | The chosen word is outlined for a moment (can be turned off); words are said as they're tapped             |
| Let users go back; make it easy to undo                  | Back, Delete, Clear; Undo and Redo in edit mode                                                            |
| Make it easy to find the most important tasks            | Speak and Help are always visible and largest                                                              |
| Limit interruptions                                      | Reminders (backup, install) only appear in edit mode, never on the communicator's screen                   |
| Use clear words; keep text succinct                      | Plain wording throughout, in English and Spanish                                                           |
| Avoid data loss                                          | Changes save immediately; one-file backups                                                                 |
| Provide search                                           | Find word (modeling mode)                                                                                  |
| Support simplification; personalised, familiar interface | Optional buttons can be hidden; text-only mode; themes, label size, photos                                 |
| Provide human help                                       | **In part:** a getting-started guide for the adult opens on the first launch; no way yet to reach a person |

## Legibility, contrast and size

- Text is set in **Atkinson Hyperlegible**, designed by the Braille Institute so that easily confused characters are distinct, for readers with low vision ([Braille Institute](https://www.brailleinstitute.org/freefont/)).
- **WCAG 2.2 AA**, checked with axe-core on every screen (the communication screen in all three themes, edit mode, every settings section, modeling, word forms, symbol search): no violations.
- **Targets:** every control on the communication screen is at least 44 × 44 px on a phone and a tablet, double WCAG 2.2 AA's 24 px minimum and the size WCAG's AAA level and Apple recommend; board cells are much larger. Settings and edit mode controls meet AA.

## What we do

[0009](../decisions/0009-plain-interface.md). The checks run in the browser tests (`apps/web/e2e/accessibility.spec.ts`), so they keep holding.
