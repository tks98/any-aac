/**
 * Open AAC's own OBF extension fields. Other apps ignore them; we round-trip them.
 */
import type { ObfBoard, ObfButton } from './obf';

/** Word type, which drives colour coding (Modified Fitzgerald Key by default). */
export const EXT_PART_OF_SPEECH = 'ext_openaac_part_of_speech';
/** The button's position is part of a motor plan and must not move. */
export const EXT_LOCKED = 'ext_openaac_locked';
/** Content that is a stand-in until real symbols or vocabulary replace it. */
export const EXT_PLACEHOLDER = 'ext_openaac_placeholder';
/**
 * On a board: the id of a smaller layout of the same board, shown instead on
 * phone-sized screens. Links keep pointing at the full board, so navigation and
 * Back work the same on every device.
 */
export const EXT_COMPACT_BOARD = 'ext_openaac_compact_board';

/**
 * On a board: its buttons are whole phrases ("I need a break"), spoken at once
 * rather than added to the message.
 */
export const EXT_PHRASES = 'ext_openaac_phrases';

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
