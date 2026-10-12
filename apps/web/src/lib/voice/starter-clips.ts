/**
 * What the bundled starter clips cover: every word and quick phrase on both
 * starter vocabularies, in all three sizes and each of their languages, and
 * the phrases the app itself says. scripts/render-clips.mjs renders these with each language's
 * default voice, and a unit test checks every one has a clip.
 */
import { behaviorOf, setLanguages, spokenText } from '@any-aac/core';
import { phrase } from '../phrases';
import { baseLanguage } from '../speech';
import { BOARD_SIZES, starterPhrases, starterSet, type StarterId } from '../starter';

const STARTERS: StarterId[] = ['en', 'es'];

/** Base language → texts, sorted. */
export async function starterClipTexts(): Promise<Record<string, string[]>> {
  const texts: Record<string, Set<string>> = {};
  const add = (lang: string, text: string) => {
    if (text.trim() !== '') (texts[baseLanguage(lang)] ??= new Set()).add(text);
  };
  for (const id of STARTERS) {
    const sets = await Promise.all(BOARD_SIZES.map((size) => starterSet(id, size)));
    const set = sets[0]!;
    const boards = [...sets.flatMap((s) => s.boards), starterPhrases(id)];
    for (const lang of setLanguages(set)) {
      for (const board of boards) {
        for (const button of board.buttons) {
          if (behaviorOf(button).kind === 'word') add(lang, spokenText(button, lang));
        }
      }
      add(lang, phrase('help', lang));
      add(lang, phrase('test', lang));
    }
  }
  return Object.fromEntries(
    Object.entries(texts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([lang, set]) => [lang, [...set].sort()]),
  );
}
