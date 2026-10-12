import type { PartOfSpeech } from '@any-aac/core';

export interface Word {
  label: string;
  /** Symbol key (see assets/symbols/sources.json); none shows the word alone. */
  pic?: string;
  pos?: PartOfSpeech;
  /** For folders: the id of the board it opens. */
  folder?: string;
}

export const word = (label: string, pos: PartOfSpeech, pic: string | null = label): Word => ({
  label,
  pos,
  ...(pic === null ? {} : { pic }),
});

export const folder = (label: string, id: string): Word => ({ label, pic: id, folder: id });

export interface Topic {
  id: string;
  name: string;
  words: Word[];
}

/**
 * A starter vocabulary: the core board in three sizes, its phone layout, topic
 * boards and quick phrases, in one language, with translations into the others.
 *
 * The medium board is the reference. The small and large boards put each of
 * its words in the cell covering the same part of the screen, so moving
 * between sizes keeps every word where the hand expects it; see
 * docs/research/decisions/0015-three-sizes.md and starter.test.ts, which
 * checks it.
 */
export interface Vocabulary {
  id: 'en' | 'es';
  locale: string;
  /**
   * Board names: the core board, the phone-layout suffix (" (phone)"), the
   * phrases board, and the small set's board of the core words it leaves out.
   */
  names: { core: string; phone: string; phrases: string; more: string };
  /** Columns of the medium core board (6 × 8), left to right, each listing its rows top to bottom. */
  columns: Word[][];
  /** Words only some sizes have: the large board's extra words, and their folders. */
  extraWords: Word[];
  /** The large core board (7 × 12), as rows of labels, and its extra topics. */
  large: { rows: string[][]; topics: Topic[] };
  /**
   * The small core board (4 × 6), as rows of labels, and the board its "more
   * words" folder opens, holding the core words the small board leaves out.
   */
  small: { rows: string[][]; more: string[][] };
  /** Core words that keep their home cell on every topic board. */
  keepOnTopics: string[];
  topics: Topic[];
  /** The phone layout, as rows of core word labels. */
  phone: string[][];
  phrases: string[];
  /** Every label and board name in other languages: language → label → translation. */
  translations: Record<string, Record<string, string>>;
  /** Credit for the word list (HTML), kept on the core boards. */
  credit: string;
}
