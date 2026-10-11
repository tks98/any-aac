/**
 * A pronunciation dictionary: "say X as Y", for names and words a voice gets
 * wrong. Whole words only, ignoring case, in any alphabet.
 */
export interface Pronunciation {
  word: string;
  sayAs: string;
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function applyPronunciations(text: string, entries: readonly Pronunciation[]): string {
  const usable = entries
    .filter((e) => e.word.trim() !== '' && e.sayAs.trim() !== '')
    // Longer entries first, so "ice cream" wins over "ice".
    .sort((a, b) => b.word.length - a.word.length);
  if (usable.length === 0) return text;
  const byWord = new Map(usable.map((e) => [e.word.trim().toLocaleLowerCase(), e.sayAs.trim()]));
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(${usable.map((e) => escape(e.word.trim())).join('|')})(?![\\p{L}\\p{N}])`,
    'giu',
  );
  return text.replace(pattern, (match) => byWord.get(match.toLocaleLowerCase()) ?? match);
}
