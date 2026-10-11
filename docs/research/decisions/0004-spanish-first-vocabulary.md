# 0004: A Spanish-first vocabulary

Status: accepted as a draft for review by Spanish-speaking SLPs. 2026-10-11.

## Context

The English-first starter boards come with Spanish translations, which suits bilingual communicators: the same places in both languages and one-tap switching ([findings/languages.md](../findings/languages.md)). But word lists don't transfer between languages: Spanish-speaking children use different words, mostly conjugated verbs, and articles from early on (Soto & Cooper, [2021](https://doi.org/10.1080/07434618.2021.1881822)). A Spanish-dominant communicator needs a vocabulary chosen in Spanish.

## Decision

A second starter vocabulary, chosen in Spanish (`apps/web/src/lib/starter/spanish.ts`), with English translations:

- **Same structure** as the English board (6 × 8, word types left to right, topic folders on the right, a phone subset in matching order), so SLPs see one system in two languages.
- **Words from Soto and Cooper's early Spanish list**, with its highest-frequency words: _yo, mamá, papá, mi, esto, más, mucho, grande, aquí, ahí, no, el, la, un, tomar_, and verbs in the forms young speakers use: _quiero, voy, mira, dame_, first person and commands, rarely infinitives. _Me gusta_, never "yo gusto".
- **Articles** _el, la, un_ as words alone: article + noun is among the first word combinations in Spanish.
- **_No_ once**, for both "no" and "not".
- **Spanish topic words** from the same list where it has them (_abuela, helado, papa, playa, calle, muñeca, camión, globo…_).

|     | 1    | 2        | 3     | 4     | 5      | 6    | 7       | 8         |
| --- | ---- | -------- | ----- | ----- | ------ | ---- | ------- | --------- |
| 1   | yo   | quiero   | para  | es    | más    | el   | no      | Personas  |
| 2   | tú   | me gusta | abre  | está  | otro   | la   | sí      | Comida    |
| 3   | mamá | voy      | pon   | comer | mucho  | un   | qué     | Lugares   |
| 4   | papá | mira     | hay   | tomar | grande | en   | dónde   | Emociones |
| 5   | mi   | dame     | tengo | jugar | bueno  | aquí | quién   | Cuerpo    |
| 6   | esto | ayuda    | puedo | hacer | ya     | ahí  | por qué | Cosas     |

Devices set to Spanish start with these boards; either vocabulary can be chosen when starting over (Settings → Boards & backup). Updates keep whichever vocabulary a set came from.

## Consequences

- It is a draft: Spanish-speaking SLPs need to review the words, their places, and the regional choices (Mexican _jugo, carro, camión_).
- _Hay_ has no symbol yet; _mi_ and _esto_ use placeholder drawings.
- Gender agreement (_contento/contenta_) is through the Forms button until there's a setting for the communicator's gender.
