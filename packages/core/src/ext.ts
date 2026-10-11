/**
 * Any AAC's own OBF extension fields. Other apps ignore them; we round-trip them.
 */
import type { ObfBoard, ObfButton } from './obf';

const PREFIX = 'ext_anyaac_';
/** Our fields' prefix while the app was called Open AAC (until 0.1.0). */
const OLD_PREFIX = 'ext_openaac_';
const OLD_CREDIT = 'Open AAC contributors';
const OLD_SOURCE = 'https://github.com/tks98/open-aac';

/**
 * Brings a board saved while the app was called Open AAC up to date: its
 * `ext_openaac_` fields get their current names, at any depth, and the credit
 * on our own pictures gets the current name. Anything else is returned as is.
 */
export function renameOldFields<T>(value: T): T {
  if (Array.isArray(value)) return value.map(renameOldFields) as T;
  if (
    typeof value !== 'object' ||
    value === null ||
    Object.getPrototypeOf(value) !== Object.prototype
  )
    return value;
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value)) {
    const name = key.startsWith(OLD_PREFIX) ? PREFIX + key.slice(OLD_PREFIX.length) : key;
    if (key === 'author_name' && inner === OLD_CREDIT) out[name] = 'Any AAC contributors';
    else if (key === 'source_url' && inner === OLD_SOURCE)
      out[name] = 'https://github.com/tks98/any-aac';
    else out[name] = renameOldFields(inner);
  }
  return out as T;
}

/** Word type, which drives colour coding (Modified Fitzgerald Key by default). */
export const EXT_PART_OF_SPEECH = 'ext_anyaac_part_of_speech';
/** The button's position is part of a motor plan and must not move. */
export const EXT_LOCKED = 'ext_anyaac_locked';
/** Content that is a stand-in until real symbols or vocabulary replace it. */
export const EXT_PLACEHOLDER = 'ext_anyaac_placeholder';
/**
 * On a board: the id of a smaller layout of the same board, shown instead on
 * phone-sized screens. Links keep pointing at the full board, so navigation and
 * Back work the same on every device.
 */
export const EXT_COMPACT_BOARD = 'ext_anyaac_compact_board';

/**
 * On a board: its buttons are whole phrases ("I need a break"), spoken at once
 * rather than added to the message.
 */
export const EXT_PHRASES = 'ext_anyaac_phrases';

export const isPhrasesBoard = (board: ObfBoard) => board[EXT_PHRASES] === true;

export function compactBoardId(board: ObfBoard): string | undefined {
  const value = board[EXT_COMPACT_BOARD];
  return typeof value === 'string' && value !== '' ? value : undefined;
}

export const PARTS_OF_SPEECH = [
  'pronoun',
  'verb',
  'descriptor',
  'noun',
  'preposition',
  'social',
  'question',
  'negation',
  'determiner',
] as const;

export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number];

export function partOfSpeech(button: ObfButton): PartOfSpeech | undefined {
  const value = button[EXT_PART_OF_SPEECH];
  return (PARTS_OF_SPEECH as readonly unknown[]).includes(value)
    ? (value as PartOfSpeech)
    : undefined;
}
