import type { PartOfSpeech } from '@open-aac/core';

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

/**
 * A starter vocabulary: the core board, its phone layout, topic boards and
 * quick phrases, in one language, with translations into the others.
 */
export interface Vocabulary {
  id: 'en' | 'es';
  locale: string;
  /** Board names: the core board, the phone-layout suffix (" (phone)"), the phrases board. */
  names: { core: string; phone: string; phrases: string };
  /** Columns of the core board, left to right, each listing its rows top to bottom. */
  columns: Word[][];
  /** Core words that keep their home cell on every topic board. */
  keepOnTopics: string[];
  topics: { id: string; name: string; words: Word[] }[];
  /** The phone layout, as rows of core word labels. */
  phone: string[][];
  phrases: string[];
  /** Every label and board name in other languages: language → label → translation. */
  translations: Record<string, Record<string, string>>;
  /** Credit for the word list (HTML), kept on the core boards. */
  credit: string;
}
