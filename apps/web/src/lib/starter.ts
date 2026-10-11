/**
 * The starter vocabulary shown on first launch.
 *
 * This is a placeholder. The real starter set will be designed with
 * speech-language pathologists (see docs/plan.md). It does follow the rules the
 * real one must: word types run left to right, every position is locked, and core
 * words keep the same place on every topic board so motor plans carry over.
 */
import {
  createBoard,
  EXT_COMPACT_BOARD,
  EXT_LOCKED,
  EXT_NAME_TRANSLATIONS,
  EXT_PART_OF_SPEECH,
  EXT_PLACEHOLDER,
  placeButton,
  type BoardSet,
  type ObfBoard,
  type ObfButton,
  type ObfImage,
  type ObfLicense,
  type PartOfSpeech,
} from '@open-aac/core';
import { pictogramDataUri } from './pictograms';
import { STARTER_TRANSLATIONS } from './starter-translations';
import { starterSymbol } from './symbols';

const ROWS = 6;
const COLUMNS = 8;

const LICENSE: ObfLicense = {
  type: 'CC BY-SA 4.0',
  copyright_notice_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
  author_name: 'Open AAC contributors',
  source_url: 'https://github.com/tks98/open-aac',
};

interface Word {
  label: string;
  pic: string;
  pos?: PartOfSpeech;
  folder?: string;
}

const word = (label: string, pos: PartOfSpeech, pic = label): Word => ({ label, pos, pic });
const folder = (label: string, id: string): Word => ({ label, pic: id, folder: id });

/** Columns of the core board, left to right; each lists its six rows top to bottom. */
const CORE_COLUMNS: Word[][] = [
  [
    word('I', 'pronoun'),
    word('you', 'pronoun'),
    word('it', 'pronoun'),
    word('he', 'pronoun'),
    word('she', 'pronoun'),
    word('we', 'pronoun'),
  ],
  [
    word('want', 'verb'),
    word('like', 'verb'),
    word('go', 'verb'),
    word('stop', 'verb'),
    word('help', 'verb'),
    word('look', 'verb'),
  ],
  [
    word('get', 'verb'),
    word('put', 'verb'),
    word('make', 'verb'),
    word('open', 'verb'),
    word('play', 'verb'),
    word('feel', 'verb'),
  ],
  [
    word('is', 'verb'),
    word('can', 'verb'),
    word('do', 'verb'),
    word('have', 'verb'),
    word('eat', 'verb'),
    word('drink', 'verb'),
  ],
  [
    word('more', 'descriptor'),
    word('again', 'descriptor'),
    word('big', 'descriptor'),
    word('little', 'descriptor'),
    word('good', 'descriptor'),
    word('bad', 'descriptor'),
  ],
  [
    word('that', 'determiner'),
    word('in', 'preposition'),
    word('on', 'preposition'),
    word('up', 'preposition'),
    word('down', 'preposition'),
    word('all done', 'social', 'allDone'),
  ],
  [
    word('not', 'negation'),
    word('what', 'question'),
    word('where', 'question'),
    word('who', 'question'),
    word('yes', 'social'),
    word('no', 'social'),
  ],
  [
    folder('People', 'people'),
    folder('Food', 'food'),
    folder('Places', 'places'),
    folder('Feelings', 'feelings'),
    folder('Body', 'body'),
    folder('Things', 'things'),
  ],
];

/** Core words that stay in their home position on every topic board. */
const KEEP_ON_TOPICS = ['I', 'want', 'more', 'not', 'eat', 'drink', 'help', 'feel', 'all done'];

const TOPICS: { id: string; name: string; words: Word[] }[] = [
  {
    id: 'people',
    name: 'People',
    words: [
      word('Mom', 'pronoun', 'mom'),
      word('Dad', 'pronoun', 'dad'),
      word('teacher', 'pronoun'),
      word('friend', 'pronoun'),
      word('baby', 'pronoun'),
    ],
  },
  {
    id: 'food',
    name: 'Food',
    words: [
      'apple',
      'banana',
      'cookie',
      'pizza',
      'sandwich',
      'cereal',
      'juice',
      'milk',
      'water',
    ].map((w) => word(w, 'noun')),
  },
  {
    id: 'places',
    name: 'Places',
    words: ['home', 'school', 'park', 'store', 'outside', 'bathroom'].map((w) => word(w, 'noun')),
  },
  {
    id: 'feelings',
    name: 'Feelings',
    words: ['happy', 'sad', 'mad', 'scared', 'tired', 'sick', 'excited', 'hurt'].map((w) =>
      word(w, 'descriptor'),
    ),
  },
  {
    id: 'body',
    name: 'Body',
    words: ['head', 'hand', 'tummy', 'leg', 'mouth', 'eye'].map((w) => word(w, 'noun')),
  },
  {
    id: 'things',
    name: 'Things',
    words: ['ball', 'book', 'tablet', 'phone', 'blanket', 'teddy'].map((w) => word(w, 'noun')),
  },
];

const slug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/**
 * Bump when the starter boards change. Saved starter boards from an older
 * version are replaced on next launch, as long as nobody has edited them.
 */
export const STARTER_VERSION = 4;
const EXT_STARTER_VERSION = 'ext_openaac_starter_version';

const PHONE = ' (phone)';

/** A word or board name in every language the starter boards come in. */
function translated(english: string): Record<string, string> {
  const phone = english.endsWith(PHONE);
  const key = phone ? english.slice(0, -PHONE.length) : english;
  const out: Record<string, string> = {};
  for (const [lang, words] of Object.entries(STARTER_TRANSLATIONS)) {
    const word = words[key];
    const suffix = phone ? words[PHONE.trim()] : '';
    if (word === undefined || suffix === undefined) {
      throw new Error(`"${english}" has no ${lang} translation.`);
    }
    out[lang] = phone ? `${word} ${suffix}` : word;
  }
  return out;
}

/** Images by word key; real symbols where we have them, placeholders otherwise. */
type Images = Map<string, ObfImage>;

function placeholderImage(key: string): ObfImage {
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

function addWord(board: ObfBoard, row: number, column: number, w: Word, images: Images): ObfBoard {
  const image = images.get(w.pic) ?? placeholderImage(w.pic);
  const button: ObfButton = {
    id: slug(w.label),
    label: w.label,
    image_id: image.id,
    translations: Object.fromEntries(
      Object.entries(translated(w.label)).map(([lang, label]) => [lang, { label }]),
    ),
    [EXT_LOCKED]: true,
  };
  if (w.pos) button[EXT_PART_OF_SPEECH] = w.pos;
  if (w.folder) button.load_board = { id: w.folder, name: w.label };
  return placeButton(board, row, column, button, image);
}

/** A layout as rows of words, top to bottom. */
type Layout = Word[][];

const TABLET_CORE: Layout = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: COLUMNS }, (_, c) => CORE_COLUMNS[c]![r]!),
);

const coreWord = (label: string): Word => {
  const found = CORE_COLUMNS.flat().find((w) => w.label === label);
  if (!found) throw new Error(`"${label}" is not a core word.`);
  return found;
};

/**
 * The phone layout of the core board: the 24 words from the approved phone
 * mockup, with a row below them for the topics the mockup had no room for.
 */
const PHONE_CORE: Layout = [
  ['I', 'want', 'more', 'not'],
  ['you', 'go', 'like', 'what'],
  ['it', 'stop', 'big', 'that'],
  ['get', 'help', 'good', 'yes'],
  ['eat', 'play', 'up', 'no'],
  ['drink', 'all done', 'Food', 'Feelings'],
  ['People', 'Places', 'Body', 'Things'],
].map((row) => row.map(coreWord));

function newBoard(id: string, name: string, layout: Layout): ObfBoard {
  return {
    ...createBoard({ id, name, rows: layout.length, columns: layout[0]!.length }),
    license: LICENSE,
    [EXT_NAME_TRANSLATIONS]: translated(name),
    [EXT_PLACEHOLDER]: true,
    [EXT_STARTER_VERSION]: STARTER_VERSION,
  };
}

function coreBoard(id: string, name: string, layout: Layout, images: Images): ObfBoard {
  let board = newBoard(id, name, layout);
  layout.forEach((row, r) => row.forEach((w, c) => (board = addWord(board, r, c, w, images))));
  return board;
}

/**
 * A topic board keeps the layout's core words in their home cells and fills the
 * free cells from the second row onward with the topic's words.
 */
function topicBoard(
  id: string,
  name: string,
  layout: Layout,
  words: Word[],
  images: Images,
): ObfBoard {
  let board = newBoard(id, name, layout);
  layout.forEach((row, r) =>
    row.forEach((w, c) => {
      if (KEEP_ON_TOPICS.includes(w.label)) board = addWord(board, r, c, w, images);
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
    board = addWord(board, Math.floor(cell / columns), cell % columns, w, images);
    cell++;
  }
  return board;
}

/**
 * True when every board is unedited starter content from an older starter
 * version, so it's safe to replace with the current one. Editing a board must
 * clear its placeholder flag once the board editor exists.
 */
export function isOutdatedStarter(set: BoardSet): boolean {
  const untouched = set.boards.every((board) => board[EXT_PLACEHOLDER] === true);
  const root = set.boards.find((board) => board.id === set.rootId);
  const version = root?.[EXT_STARTER_VERSION];
  return untouched && (typeof version === 'number' ? version : 1) < STARTER_VERSION;
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

export async function starterSet(): Promise<BoardSet> {
  const keys = [
    ...new Set([...CORE_COLUMNS.flat(), ...TOPICS.flatMap((t) => t.words)].map((w) => w.pic)),
  ];
  const { images, files } = await loadImages(keys);

  const core = {
    ...coreBoard('core', 'Core words', TABLET_CORE, images),
    [EXT_COMPACT_BOARD]: 'core-phone',
  };
  const phoneCore = coreBoard('core-phone', `Core words${PHONE}`, PHONE_CORE, images);

  const topics = TOPICS.flatMap((topic) => {
    const board = topicBoard(topic.id, topic.name, TABLET_CORE, topic.words, images);
    const phoneId = `${topic.id}-phone`;
    return [
      { ...board, [EXT_COMPACT_BOARD]: phoneId },
      topicBoard(phoneId, `${topic.name}${PHONE}`, PHONE_CORE, topic.words, images),
    ];
  });

  return { rootId: core.id, boards: [core, phoneCore, ...topics], files };
}
