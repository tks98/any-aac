import { partOfSpeech, type ObfButton, type PartOfSpeech } from '@open-aac/core';

export interface CellColors {
  fill: string;
  edge: string;
}

/**
 * Word-type colours (Modified Fitzgerald Key), light theme. Fills are pale so
 * dark labels keep strong contrast; edges carry the colour.
 */
export const WORD_TYPE_COLORS: Record<PartOfSpeech, CellColors> = {
  pronoun: { fill: '#FFF1B8', edge: '#A67C00' },
  verb: { fill: '#D5F2CC', edge: '#2E7A22' },
  descriptor: { fill: '#D6E7FF', edge: '#2A62C2' },
  noun: { fill: '#FFDFC2', edge: '#B85A0C' },
  preposition: { fill: '#FBDDEB', edge: '#B02D6B' },
  social: { fill: '#FBDDEB', edge: '#B02D6B' },
  question: { fill: '#E7DDFB', edge: '#6741BC' },
  negation: { fill: '#FFD9D6', edge: '#BE2F28' },
  determiner: { fill: '#FFFFFF', edge: '#6F7F8F' },
};

const FOLDER: CellColors = { fill: '#F4F6F8', edge: '#4F5E6C' };
const PLAIN: CellColors = { fill: '#FFFFFF', edge: '#C3CDD6' };

export function cellColors(button: ObfButton): CellColors {
  const type = partOfSpeech(button);
  if (type) return WORD_TYPE_COLORS[type];
  if (button.load_board) return FOLDER;
  // Boards imported from other apps bring their own colours.
  if (button.background_color || button.border_color) {
    return {
      fill: button.background_color ?? PLAIN.fill,
      edge: button.border_color ?? PLAIN.edge,
    };
  }
  return PLAIN;
}
