import { partOfSpeech, type ObfButton, type PartOfSpeech } from '@any-aac/core';

export type Theme = 'light' | 'dark' | 'contrast';
/** How word types show their colour: a pale fill with a coloured edge, the edge alone, or not at all. */
export type ColorStyle = 'fill' | 'border' | 'none';

export interface CellColors {
  fill: string;
  edge: string;
  /** Border width in px. */
  width: number;
}

interface Swatch {
  fill: string;
  edge: string;
  /** The colour on dark backgrounds. */
  bright: string;
}

/**
 * Word-type colours (Modified Fitzgerald Key), from the approved design. Fills
 * are pale so dark labels keep strong contrast; edges carry the colour.
 */
export const WORD_TYPE_COLORS: Record<PartOfSpeech, Swatch> = {
  pronoun: { fill: '#FFF1B8', edge: '#A67C00', bright: '#F2C94C' },
  verb: { fill: '#D5F2CC', edge: '#2E7A22', bright: '#72D05E' },
  descriptor: { fill: '#D6E7FF', edge: '#2A62C2', bright: '#76AEFF' },
  noun: { fill: '#FFDFC2', edge: '#B85A0C', bright: '#FFA457' },
  preposition: { fill: '#FBDDEB', edge: '#B02D6B', bright: '#F27DB4' },
  social: { fill: '#FBDDEB', edge: '#B02D6B', bright: '#F27DB4' },
  question: { fill: '#E7DDFB', edge: '#6741BC', bright: '#AE91F7' },
  negation: { fill: '#FFD9D6', edge: '#BE2F28', bright: '#FF6E64' },
  determiner: { fill: '#FFFFFF', edge: '#6F7F8F', bright: '#A9B6C3' },
};

const FOLDER: Swatch = { fill: '#F4F6F8', edge: '#4F5E6C', bright: '#C3CDD6' };

/** The theme's own surface and line colours, for buttons without a word type. */
const PLAIN: Record<Theme, { surface: string; line: string }> = {
  light: { surface: '#FFFFFF', line: '#C3CDD6' },
  dark: { surface: '#18212A', line: '#2E3B48' },
  contrast: { surface: '#000000', line: '#FFFFFF' },
};

function swatch(button: ObfButton): Swatch | undefined {
  const type = partOfSpeech(button);
  if (type) return WORD_TYPE_COLORS[type];
  if (button.load_board) return FOLDER;
  return undefined;
}

export function cellColors(
  button: ObfButton,
  theme: Theme = 'light',
  style: ColorStyle = 'fill',
): CellColors {
  const plain = PLAIN[theme];
  const color = swatch(button);
  if (!color) {
    // Boards imported from other apps bring their own colours (light themes only).
    if (theme === 'light' && (button.background_color || button.border_color)) {
      return {
        fill: button.background_color ?? plain.surface,
        edge: button.border_color ?? plain.line,
        width: 2,
      };
    }
    return { fill: plain.surface, edge: plain.line, width: theme === 'contrast' ? 3 : 2 };
  }
  if (theme === 'contrast') {
    return { fill: '#000000', edge: style === 'none' ? '#FFFFFF' : color.bright, width: 3 };
  }
  if (style === 'none') return { fill: plain.surface, edge: plain.line, width: 2 };
  if (theme === 'dark') {
    return style === 'fill'
      ? { fill: `${color.bright}24`, edge: color.bright, width: 2 }
      : { fill: plain.surface, edge: color.bright, width: 3 };
  }
  return style === 'fill'
    ? { fill: color.fill, edge: color.edge, width: 2 }
    : { fill: plain.surface, edge: color.edge, width: 3 };
}
