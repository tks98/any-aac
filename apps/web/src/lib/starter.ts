/**
 * The starter vocabularies shown on first launch: English-first (with Spanish
 * translations) and Spanish-first (with English translations).
 *
 * These are placeholders. The real starter set will be designed with
 * speech-language pathologists (see docs/plan.md). They do follow the rules the
 * real one must: word types run left to right, every position is locked, and core
 * words keep the same place on every topic board so motor plans carry over.
 */
import {
  createBoard,
  EXT_COMPACT_BOARD,
  EXT_LOCKED,
  EXT_NAME_TRANSLATIONS,
  EXT_PART_OF_SPEECH,
  EXT_PHRASES,
  EXT_PLACEHOLDER,
  placeButton,
  type BoardSet,
  type ObfBoard,
  type ObfButton,
  type ObfImage,
  type ObfLicense,
} from '@any-aac/core';
import { hasPictogram, pictogramDataUri } from './pictograms';
import { ENGLISH } from './starter/english';
import { SPANISH } from './starter/spanish';
import type { Vocabulary, Word } from './starter/types';
import { starterSymbol } from './symbols';

export type StarterId = Vocabulary['id'];
const VOCABULARIES: Record<StarterId, Vocabulary> = { en: ENGLISH, es: SPANISH };

/**
 * The core board's size: small (4 × 6, the biggest buttons), medium (6 × 8)
 * or large (7 × 12, the most words). Every word keeps its part of the screen
 * in each size (see starter/types.ts).
 */
export type BoardSize = 'small' | 'medium' | 'large';
export const BOARD_SIZES: readonly BoardSize[] = ['small', 'medium', 'large'];

/** Spanish-first on devices set to Spanish, English-first otherwise. */
export function defaultStarter(): StarterId {
  const lang = typeof navigator === 'undefined' ? 'en' : navigator.language;
  return lang.toLowerCase().startsWith('es') ? 'es' : 'en';
}

const LICENSE: ObfLicense = {
  type: 'CC BY-SA 4.0',
  copyright_notice_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
  author_name: 'Any AAC contributors',
  source_url: 'https://github.com/tks98/any-aac',
};

const slug = (label: string) =>
  label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-');

/**
 * Bump when the starter boards change. Saved starter boards from an older
 * version are replaced on next launch, as long as nobody has edited them.
 */
export const STARTER_VERSION = 10;
const EXT_STARTER_VERSION = 'ext_anyaac_starter_version';
/** Which starter vocabulary a set came from, so an update keeps it. */
const EXT_STARTER = 'ext_anyaac_starter';
/** And its size. */
const EXT_STARTER_SIZE = 'ext_anyaac_starter_size';

/** A label or board name in every other language the vocabulary comes in. */
function translated(vocab: Vocabulary, label: string): Record<string, string> {
  const suffix = vocab.names.phone;
  const phone = label.endsWith(suffix);
  const key = phone ? label.slice(0, -suffix.length) : label;
  const out: Record<string, string> = {};
  for (const [lang, words] of Object.entries(vocab.translations)) {
    const word = words[key];
    const phoneWord = phone ? words[suffix.trim()] : '';
    if (word === undefined || phoneWord === undefined) {
      throw new Error(`"${label}" has no ${lang} translation.`);
    }
    out[lang] = phone ? `${word} ${phoneWord}` : word;
  }
  return out;
}

/** Images by word key; real symbols where we have them, placeholders otherwise. */
type Images = Map<string, ObfImage>;

function placeholderImage(key: string): ObfImage | undefined {
  if (!hasPictogram(key)) return undefined;
  return {
    id: `pic-${key}`,
    data: pictogramDataUri(key),
    content_type: 'image/svg+xml',
    width: 48,
    height: 48,
    license: LICENSE,
    [EXT_PLACEHOLDER]: true,
  };
}

function addWord(
  vocab: Vocabulary,
  board: ObfBoard,
  row: number,
  column: number,
  w: Word,
  images: Images,
): ObfBoard {
  const image = w.pic === undefined ? undefined : (images.get(w.pic) ?? placeholderImage(w.pic));
  // Words that differ only by an accent (tú and tu, él and el) need their own ids.
  let id = slug(w.label);
  for (let n = 2; board.buttons.some((b) => b.id === id); n++) id = `${slug(w.label)}-${n}`;
  const button: ObfButton = {
    id,
    label: w.label,
    ...(image ? { image_id: image.id } : {}),
    translations: Object.fromEntries(
      Object.entries(translated(vocab, w.label)).map(([lang, label]) => [lang, { label }]),
    ),
    [EXT_LOCKED]: true,
  };
  if (w.pos) button[EXT_PART_OF_SPEECH] = w.pos;
  if (w.folder) button.load_board = { id: w.folder, name: w.label };
  return placeButton(board, row, column, button, image);
}

/** A layout as rows of words, top to bottom. */
type Layout = Word[][];

/** A size's core board, its phone layout, and (small) the board of the core words it leaves out. */
function layouts(
  vocab: Vocabulary,
  size: BoardSize,
): { core: Layout; phone: Layout; more: Layout | null } {
  const words = [...vocab.columns.flat(), ...vocab.extraWords];
  const find = (label: string): Word => {
    const found = words.find((w) => w.label === label);
    if (!found) throw new Error(`"${label}" is not a core word.`);
    return found;
  };
  const rowsOf = (rows: string[][]) => rows.map((row) => row.map(find));
  const height = vocab.columns[0]!.length;
  const medium = Array.from({ length: height }, (_, r) =>
    vocab.columns.map((column) => column[r]!),
  );
  return {
    core:
      size === 'small'
        ? rowsOf(vocab.small.rows)
        : size === 'large'
          ? rowsOf(vocab.large.rows)
          : medium,
    // One phone layout for every size: on a phone, they're all the same.
    phone: rowsOf(vocab.phone),
    more: size === 'small' ? rowsOf(vocab.small.more) : null,
  };
}

function newBoard(vocab: Vocabulary, id: string, name: string, layout: Layout): ObfBoard {
  return {
    ...createBoard({
      id,
      name,
      rows: layout.length,
      columns: layout[0]!.length,
      locale: vocab.locale,
    }),
    license: LICENSE,
    [EXT_NAME_TRANSLATIONS]: translated(vocab, name),
    [EXT_PLACEHOLDER]: true,
    [EXT_STARTER_VERSION]: STARTER_VERSION,
    [EXT_STARTER]: vocab.id,
  };
}

function coreBoard(
  vocab: Vocabulary,
  id: string,
  name: string,
  layout: Layout,
  images: Images,
): ObfBoard {
  // The credit the word lists' licences ask for travels with exports.
  let board: ObfBoard = { ...newBoard(vocab, id, name, layout), description_html: vocab.credit };
  layout.forEach((row, r) =>
    row.forEach((w, c) => (board = addWord(vocab, board, r, c, w, images))),
  );
  return board;
}

/**
 * A topic board keeps the layout's core words in their home cells and fills the
 * free cells from the second row onward with the topic's words.
 */
function topicBoard(
  vocab: Vocabulary,
  id: string,
  name: string,
  layout: Layout,
  words: Word[],
  images: Images,
): ObfBoard {
  let board = newBoard(vocab, id, name, layout);
  layout.forEach((row, r) =>
    row.forEach((w, c) => {
      if (vocab.keepOnTopics.includes(w.label)) board = addWord(vocab, board, r, c, w, images);
    }),
  );
  const columns = layout[0]!.length;
  const size = layout.length * columns;
  let cell = columns;
  for (const w of words) {
    while (cell < size && board.grid.order[Math.floor(cell / columns)]![cell % columns] !== null) {
      cell++;
    }
    if (cell >= size) throw new Error(`Board "${id}" has no room left for "${w.label}".`);
    board = addWord(vocab, board, Math.floor(cell / columns), cell % columns, w, images);
    cell++;
  }
  return board;
}

/**
 * True when every board is unedited starter content from an older starter
 * version, so it's safe to replace with the current one.
 */
export function isOutdatedStarter(set: BoardSet): boolean {
  const untouched = set.boards.every((board) => board[EXT_PLACEHOLDER] === true);
  const root = set.boards.find((board) => board.id === set.rootId);
  const version = root?.[EXT_STARTER_VERSION];
  return untouched && (typeof version === 'number' ? version : 1) < STARTER_VERSION;
}

/** Which starter vocabulary a set came from (English-first if it doesn't say). */
export function starterOf(set: BoardSet | null): StarterId {
  const root = set?.boards.find((board) => board.id === set.rootId);
  return root?.[EXT_STARTER] === 'es' ? 'es' : 'en';
}

/** The size of the starter boards a set came from (medium if it doesn't say). */
export function sizeOf(set: BoardSet | null): BoardSize {
  const root = set?.boards.find((board) => board.id === set.rootId);
  const size = root?.[EXT_STARTER_SIZE];
  return size === 'small' || size === 'large' ? size : 'medium';
}

/** Loads each word's symbol file; words without one (or that fail to load) get a placeholder. */
async function loadImages(
  keys: string[],
): Promise<{ images: Images; files: Record<string, Uint8Array> }> {
  const images: Images = new Map();
  const files: Record<string, Uint8Array> = {};
  await Promise.all(
    keys.map(async (key) => {
      const symbol = starterSymbol(key);
      if (!symbol) return;
      try {
        const response = await fetch(symbol.url);
        if (!response.ok) return;
        const path = `images/${symbol.set}/${key}.svg`;
        files[path] = new Uint8Array(await response.arrayBuffer());
        images.set(key, {
          id: `sym-${key}`,
          path,
          content_type: 'image/svg+xml',
          license: symbol.license,
        });
      } catch {
        // Offline before the symbols were cached: the placeholder will do.
      }
    }),
  );
  return { images, files };
}

/** Quick phrases, opened from the Phrases button and spoken at once. */
export function starterPhrases(id: StarterId = 'en'): ObfBoard {
  const vocab = VOCABULARIES[id];
  const layout = { rows: 4, columns: 3 };
  let board: ObfBoard = {
    ...createBoard({ id: 'phrases', name: vocab.names.phrases, ...layout, locale: vocab.locale }),
    license: LICENSE,
    [EXT_NAME_TRANSLATIONS]: translated(vocab, vocab.names.phrases),
    [EXT_PHRASES]: true,
    [EXT_PLACEHOLDER]: true,
    [EXT_STARTER_VERSION]: STARTER_VERSION,
    [EXT_STARTER]: vocab.id,
  };
  vocab.phrases.forEach((phrase, i) => {
    board = placeButton(board, Math.floor(i / layout.columns), i % layout.columns, {
      id: slug(phrase),
      label: phrase,
      translations: Object.fromEntries(
        Object.entries(translated(vocab, phrase)).map(([lang, label]) => [lang, { label }]),
      ),
    });
  });
  return board;
}

export async function starterSet(
  id: StarterId = 'en',
  size: BoardSize = 'medium',
): Promise<BoardSet> {
  const vocab = VOCABULARIES[id];
  const { core: layout, phone, more } = layouts(vocab, size);
  const topicList = size === 'large' ? [...vocab.topics, ...vocab.large.topics] : vocab.topics;
  const keys = [
    ...new Set(
      [
        ...layout.flat(),
        ...(more?.flat() ?? []),
        ...phone.flat(),
        ...topicList.flatMap((t) => t.words),
      ]
        .map((w) => w.pic)
        .filter((pic) => pic !== undefined),
    ),
  ];
  const { images, files } = await loadImages(keys);

  const core = {
    ...coreBoard(vocab, 'core', vocab.names.core, layout, images),
    [EXT_COMPACT_BOARD]: 'core-phone',
  };
  const phoneCore = coreBoard(
    vocab,
    'core-phone',
    `${vocab.names.core}${vocab.names.phone}`,
    phone,
    images,
  );
  // The small set's other core words. A phone shows its own layout instead,
  // which has every topic, so this board has no phone version.
  const moreWords = more ? [coreBoard(vocab, 'more-words', vocab.names.more, more, images)] : [];

  const topics = topicList.flatMap((topic) => {
    const board = topicBoard(vocab, topic.id, topic.name, layout, topic.words, images);
    const phoneId = `${topic.id}-phone`;
    return [
      { ...board, [EXT_COMPACT_BOARD]: phoneId },
      topicBoard(vocab, phoneId, `${topic.name}${vocab.names.phone}`, phone, topic.words, images),
    ];
  });

  const boards = [core, phoneCore, ...moreWords, ...topics, starterPhrases(id)];
  return {
    rootId: core.id,
    boards: boards.map((board) => ({ ...board, [EXT_STARTER_SIZE]: size })),
    files,
  };
}
