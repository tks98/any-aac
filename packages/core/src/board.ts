import { OBF_FORMAT, type ObfBoard, type ObfBoardRef, type ObfButton, type ObfImage } from './obf';

export interface Cell {
  row: number;
  column: number;
  button: ObfButton | null;
}

/** Every grid cell, row by row, with its button (or null when empty). */
export function cells(board: ObfBoard): Cell[] {
  const byId = new Map(board.buttons.map((b) => [b.id, b]));
  return board.grid.order.flatMap((row, r) =>
    row.map((id, c) => ({
      row: r,
      column: c,
      button: id === null ? null : (byId.get(id) ?? null),
    })),
  );
}

export function spokenText(button: ObfButton): string {
  return (button.vocalization ?? button.label ?? '').trim();
}

/** OBF "specialty" actions we act on. Others are kept but ignored. */
export const SPECIAL_ACTIONS = ['clear', 'backspace', 'speak', 'home', 'space', 'hush'] as const;
export type SpecialAction = (typeof SPECIAL_ACTIONS)[number];

export type ButtonBehavior =
  | { kind: 'navigate'; target: ObfBoardRef }
  | { kind: 'special'; action: SpecialAction }
  /** OBF "+text" actions add text to the end of the last word (spelling, suffixes). */
  | { kind: 'append'; text: string }
  | { kind: 'word' };

export function behaviorOf(button: ObfButton): ButtonBehavior {
  if (button.load_board) return { kind: 'navigate', target: button.load_board };
  const action = button.action ?? button.actions?.[0];
  if (typeof action === 'string') {
    if (action.startsWith(':')) {
      const name = action.slice(1);
      if ((SPECIAL_ACTIONS as readonly string[]).includes(name)) {
        return { kind: 'special', action: name as SpecialAction };
      }
    } else if (action.startsWith('+')) {
      return { kind: 'append', text: action.slice(1) };
    }
  }
  return { kind: 'word' };
}

export function createBoard(options: {
  id: string;
  name: string;
  rows: number;
  columns: number;
  locale?: string;
}): ObfBoard {
  return {
    format: OBF_FORMAT,
    id: options.id,
    name: options.name,
    locale: options.locale ?? 'en',
    buttons: [],
    grid: {
      rows: options.rows,
      columns: options.columns,
      order: Array.from({ length: options.rows }, () =>
        Array.from({ length: options.columns }, () => null),
      ),
    },
    images: [],
    sounds: [],
  };
}

/** Returns a copy of the board with the button (and its image) placed in a cell. */
export function placeButton(
  board: ObfBoard,
  row: number,
  column: number,
  button: ObfButton,
  image?: ObfImage,
): ObfBoard {
  const current = board.grid.order[row]?.[column];
  if (current === undefined) throw new RangeError(`Cell ${row},${column} is outside the grid.`);
  if (board.buttons.some((b) => b.id === button.id)) {
    throw new Error(`Button id "${button.id}" is already on board "${board.id}".`);
  }
  const order = board.grid.order.map((cellsInRow, r) =>
    r === row ? cellsInRow.map((id, c) => (c === column ? button.id : id)) : cellsInRow,
  );
  const buttons = board.buttons.filter((b) => b.id !== current).concat(button);
  const images =
    image && !board.images.some((i) => i.id === image.id) ? [...board.images, image] : board.images;
  return { ...board, buttons, images, grid: { ...board.grid, order } };
}
