# 0015: Starter boards in three sizes, with every word in the same part of the screen

Status: accepted as a draft for SLP review. 2026-10-12.

## Context

The plan calls for the starter vocabulary "at 3 sizes that share motor plans", around 24, 48 and 84 cells ([plan.md](../../plan.md)). There was one size: the 6 × 8 board ([0003](0003-core-vocabulary.md)).

What practitioners say about grid sizes ([findings/vocabulary.md](../findings/vocabulary.md#motor-planning-and-grid-size)):

- **Changing grid size makes people relearn where words are.** Liberator calls it learning a new system from scratch ([Liberator](https://liberator.net.au/support/education/aac/grid-sizes)). AbleNet advises choosing the grid a person will need, not the one that seems easiest now ([AbleNet](https://support.ablenetinc.com/aac-education-and-resources/ableteams/understanding-aac-grid-sizes-and-motor-planning/)). Within one size, vocabulary should grow by revealing hidden words, not by moving them.
- **Systems that come in several sizes do one of two things.** Some keep the same vocabulary in each size, with more behind folders in the smaller ones (TD Snap Motor Plan, in 30 and 66 cells). Others grow the vocabulary with the grid (TD Snap Core First) ([Tobii Dynavox](https://www.tobiidynavox.com/pages/td-snap-motor-plan)).

This is practitioner guidance, not trials: we found no study comparing a small grid that grows with starting large.

## Decision

**Three sizes: small (4 × 6), medium (6 × 8, as before) and large (7 × 12).** A size is for the person's hands and eyes, chosen when starting over (Settings → Boards & backup → Size of the starter boards). Within a size, words are hidden and revealed in place, as before.

**Every word stays in the same part of the screen in every size.** The medium board is the reference. A board fills the same screen in every size, so a word's place on screen is its cell's centre as a fraction of the board's width and height:

- **Large**: every medium word is in the large cell covering its medium place, within half a cell. Medium columns 1–8 become large columns 1, 3, 4, 6, 7, 9, 10 and 12; medium rows 4–6 become rows 5–7. The new columns and row hold 35 more core words, each beside its word type and its partner where it has one (in/out, on/off, up/down, hot/cold, here/there), and a seventh topic, Animals.
- **Small**: 20 medium words, each in the small cell that covers its medium place. Where two medium words share a small cell, the one kept is the more essential (_I, want, go, stop, help, eat, yes, no, more, not, all done_). The other 21 are on a **More words** board, one tap away, and _who_ joins the People topic in every size, so all 42 are reachable.
- **Phones** use the same phone layout in every size ([0005](0005-phone-layouts.md)): on a phone the sizes would be about the same anyway.

`apps/web/test/starter.test.ts` checks these rules for both vocabularies, so a later change can't quietly break them.

### English

Large (new words in **bold**):

|     | 1      | 2        | 3        | 4        | 5         | 6        | 7         | 8          | 9        | 10      | 11        | 12          |
| --- | ------ | -------- | -------- | -------- | --------- | -------- | --------- | ---------- | -------- | ------- | --------- | ----------- |
| 1   | I      | **me**   | want     | get      | **play**  | is       | more      | **big**    | that     | not     | **and**   | People      |
| 2   | you    | **your** | like     | put      | **know**  | can      | all       | **little** | here     | what    | **there** | Food        |
| 3   | it     | **they** | go       | make     | **come**  | eat      | some      | **hot**    | in       | where   | **with**  | Places      |
| 4   | **we** | **this** | **need** | **give** | **say**   | **have** | **again** | **cold**   | **out**  | **how** | **to**    | **Animals** |
| 5   | he     | **him**  | stop     | open     | **wait**  | drink    | good      | **bad**    | on       | who     | **off**   | Feelings    |
| 6   | she    | **her**  | help     | turn     | **think** | yes      | same      | **fast**   | up       | when    | **down**  | Body        |
| 7   | my     | **mine** | look     | do       | **see**   | no       | different | **slow**   | all done | why     | **now**   | Things      |

Most of the new words were left off the medium board when it took on Universal Core (_we, have, again, big, little, bad, down_; [0003](0003-core-vocabulary.md)), or are on Banajee et al.'s toddler core list (_mine, out, off_; [2003](https://doi.org/10.1080/0743461031000112034)). The rest complete pairs and word types.

Small, and More words:

|     | 1   | 2    | 3   | 4         | 5        | 6          |
| --- | --- | ---- | --- | --------- | -------- | ---------- |
| 1   | I   | want | is  | more      | not      | People     |
| 2   | you | go   | eat | all       | what     | Food       |
| 3   | he  | stop | yes | good      | up       | Feelings   |
| 4   | my  | help | no  | different | all done | More words |

|     | 1    | 2    | 3     | 4    | 5     | 6      |
| --- | ---- | ---- | ----- | ---- | ----- | ------ |
| 1   | like | get  | put   | here | that  | Places |
| 2   | it   | make | can   | some | where | Body   |
| 3   | she  | open | drink | same | on    | Things |
| 4   | look | do   | turn  | in   | why   | when   |

### Spanish

Large, chosen in Spanish like the rest of the Spanish-first boards ([0004](0004-spanish-first-vocabulary.md)): verbs in the forms children use (_ven, vamos, espera, duele_), and pairs (_abre/cierra, aquí/ahí, arriba/abajo_).

|     | 1            | 2         | 3            | 4          | 5          | 6          | 7        | 8             | 9       | 10       | 11         | 12           |
| --- | ------------ | --------- | ------------ | ---------- | ---------- | ---------- | -------- | ------------- | ------- | -------- | ---------- | ------------ |
| 1   | yo           | **me**    | quiero       | para       | **ven**    | es         | más      | **todo**      | el      | no       | **y**      | Personas     |
| 2   | tú           | **tu**    | me gusta     | abre       | **vamos**  | está       | otro     | **caliente**  | la      | sí       | **con**    | Comida       |
| 3   | mamá         | **ella**  | voy          | pon        | **veo**    | comer      | mucho    | **frío**      | un      | qué      | **de**     | Lugares      |
| 4   | **nosotros** | **ellos** | **necesito** | **cierra** | **sé**     | **dormir** | **poco** | **igual**     | **una** | **cómo** | **cuándo** | **Animales** |
| 5   | papá         | **él**    | mira         | hay        | **espera** | tomar      | grande   | **pequeño**   | en      | dónde    | **arriba** | Emociones    |
| 6   | mi           | **mío**   | dame         | tengo      | **duele**  | jugar      | bueno    | **malo**      | aquí    | quién    | **abajo**  | Cuerpo       |
| 7   | esto         | **eso**   | ayuda        | puedo      | **lee**    | hacer      | ya       | **diferente** | ahí     | por qué  | **ahora**  | Cosas        |

Small, and Más palabras:

|     | 1    | 2        | 3     | 4     | 5     | 6            |
| --- | ---- | -------- | ----- | ----- | ----- | ------------ |
| 1   | yo   | quiero   | es    | más   | no    | Personas     |
| 2   | mamá | me gusta | comer | otro  | sí    | Comida       |
| 3   | papá | dame     | tomar | bueno | dónde | Emociones    |
| 4   | esto | ayuda    | jugar | ya    | aquí  | Más palabras |

|     | 1     | 2     | 3     | 4      | 5       | 6       |
| --- | ----- | ----- | ----- | ------ | ------- | ------- |
| 1   | tú    | para  | está  | la     | el      | Lugares |
| 2   | abre  | voy   | pon   | mucho  | qué     | Cuerpo  |
| 3   | mi    | mira  | hay   | grande | en      | Cosas   |
| 4   | tengo | puedo | hacer | un     | por qué | ahí     |

## Consequences

- **The medium board doesn't move.** Existing boards keep their words in place; People gains _who_ (_quién_). Starter version 10: unedited starter boards update, edited ones don't, and an update keeps the size.
- **The small boards leave out words the medium board has together at the top.** Each small cell covers two or three medium cells, so _like, it, she, drink_ and _that_ (English), and _tú, para, voy, qué_ and _mi_ (Spanish), are on More words. That's the cost of keeping places; SLPs may prefer different choices for the 20.
- **More words isn't held to the same places**: there are more words than cells in some regions. It keeps the word types in order.
- **The large board is for landscape tablets.** In portrait, its twelve columns make tall, narrow buttons.
- In bilingual mode, the large English board's _him_ and _her_ read _él_ and _ella_ in Spanish, like _he_ and _she_: Spanish uses the same word.
- 89 more words have bundled audio (350 clips, 0.8 MB in all), and 29 more symbols are bundled; pronouns and small grammar words show as words, like the articles.
- Still to do with SLPs: whether these 35 large words and these 20 small ones are the right ones, and RELAAACs scoring for each size.
