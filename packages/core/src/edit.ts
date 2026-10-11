/**
 * Editing boards. Every function returns a new board or set and leaves its
 * input alone, so an editor can keep old versions for undo.
 */
import { createBoard } from './board';
import { compactBoardId, EXT_COMPACT_BOARD, EXT_LOCKED, EXT_PLACEHOLDER } from './ext';
import { baseLanguage, EXT_NAME_TRANSLATIONS } from './language';
import { isRecord, type ObfBoard, type ObfButton, type ObfImage } from './obf';
import type { BoardSet } from './obz';

export interface CellRef {
  row: number;
  column: number;
}

export function buttonAt(board: ObfBoard, cell: CellRef): ObfButton | undefined {
  const id = board.grid.order[cell.row]?.[cell.column];
  return id == null ? undefined : board.buttons.find((b) => b.id === id);
}

export const isLocked = (button: ObfButton) => button[EXT_LOCKED] === true;

/** A copy of `object` without an optional field. */
export function without<T extends object>(object: T, key: keyof T & string): T {
  const copy = { ...object } as Record<string, unknown>;
  delete copy[key];
  return copy as T;
}

/** "Ice cream!" → "ice-cream", made unique among `taken`. */
export function uniqueId(base: string, taken: Iterable<string>): string {
  const slug =
    base
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'item';
  const used = new Set(taken);
  if (!used.has(slug)) return slug;
  for (let n = 2; ; n++) {
    if (!used.has(`${slug}-${n}`)) return `${slug}-${n}`;
  }
}

/** Images no button uses any more are dropped, so exports stay small. */
function withoutUnusedImages(board: ObfBoard): ObfBoard {
  const used = new Set(board.buttons.map((b) => b.image_id).filter((id) => id !== undefined));
  const images = board.images.filter((image) => used.has(image.id));
  return images.length === board.images.length ? board : { ...board, images };
}

/** Changes one button. An `image` is added to the board if it isn't there yet. */
export function updateButton(
  board: ObfBoard,
  id: string,
  change: (button: ObfButton) => ObfButton,
  image?: ObfImage,
): ObfBoard {
  if (!board.buttons.some((b) => b.id === id)) {
    throw new Error(`Board "${board.id}" has no button "${id}".`);
  }
  const buttons = board.buttons.map((b) => (b.id === id ? change(b) : b));
  const images =
    image && !board.images.some((i) => i.id === image.id) ? [...board.images, image] : board.images;
  return withoutUnusedImages({ ...board, buttons, images });
}

/** Puts a new button in an empty cell. */
export function addButton(
  board: ObfBoard,
  cell: CellRef,
  button: Partial<ObfButton>,
  image?: ObfImage,
): ObfBoard {
  if (board.grid.order[cell.row]?.[cell.column] !== null) {
    throw new Error(`Cell ${cell.row},${cell.column} is not an empty cell.`);
  }
  const id = uniqueId(
    button.id ?? button.label ?? 'button',
    board.buttons.map((b) => b.id),
  );
  const order = board.grid.order.map((row, r) =>
    r === cell.row ? row.map((current, c) => (c === cell.column ? id : current)) : row,
  );
  const images =
    image && !board.images.some((i) => i.id === image.id) ? [...board.images, image] : board.images;
  return {
    ...board,
    buttons: [...board.buttons, { ...button, id }],
    images,
    grid: { ...board.grid, order },
  };
}

/** Empties a cell. The button goes too, unless another cell also shows it. */
export function clearCell(board: ObfBoard, cell: CellRef): ObfBoard {
  const id = board.grid.order[cell.row]?.[cell.column];
  if (id == null) return board;
  const order = board.grid.order.map((row, r) =>
    r === cell.row ? row.map((current, c) => (c === cell.column ? null : current)) : row,
  );
  const stillShown = order.some((row) => row.includes(id));
  const buttons = stillShown ? board.buttons : board.buttons.filter((b) => b.id !== id);
  return withoutUnusedImages({ ...board, buttons, grid: { ...board.grid, order } });
}

/** Swaps what two cells hold (either may be empty). */
export function swapCells(board: ObfBoard, a: CellRef, b: CellRef): ObfBoard {
  const at = (cell: CellRef) => {
    const value = board.grid.order[cell.row]?.[cell.column];
    if (value === undefined)
      throw new RangeError(`Cell ${cell.row},${cell.column} is outside the grid.`);
    return value;
  };
  const first = at(a);
  const second = at(b);
  const order = board.grid.order.map((row, r) =>
    row.map((current, c) => {
      if (r === a.row && c === a.column) return second;
      if (r === b.row && c === b.column) return first;
      return current;
    }),
  );
  return { ...board, grid: { ...board.grid, order } };
}

/**
 * Sets a button's label in another language. An empty label removes that
 * language's translation.
 */
export function setTranslatedLabel(button: ObfButton, lang: string, label: string): ObfButton {
  const translations = isRecord(button.translations) ? { ...button.translations } : {};
  const key = Object.keys(translations).find((k) => baseLanguage(k) === baseLanguage(lang)) ?? lang;
  const existing = isRecord(translations[key]) ? translations[key] : {};
  if (label.trim() === '') {
    const rest = Object.fromEntries(Object.entries(existing).filter(([k]) => k !== 'label'));
    if (Object.keys(rest).length > 0) translations[key] = rest;
    else delete translations[key];
  } else {
    translations[key] = { ...existing, label };
  }
  const rest = without(button, 'translations');
  return Object.keys(translations).length > 0 ? { ...rest, translations } : rest;
}

/** Sets a board's name in another language; empty removes it. */
export function setTranslatedName(board: ObfBoard, lang: string, name: string): ObfBoard {
  const names = isRecord(board[EXT_NAME_TRANSLATIONS])
    ? { ...(board[EXT_NAME_TRANSLATIONS] as Record<string, unknown>) }
    : {};
  const key = Object.keys(names).find((k) => baseLanguage(k) === baseLanguage(lang)) ?? lang;
  if (name.trim() === '') delete names[key];
  else names[key] = name;
  return { ...board, [EXT_NAME_TRANSLATIONS]: names };
}

/** Replaces a board in the set. Edited boards are no longer placeholder content. */
export function replaceBoard(set: BoardSet, board: ObfBoard): BoardSet {
  if (!set.boards.some((b) => b.id === board.id)) {
    throw new Error(`The set has no board "${board.id}".`);
  }
  const edited = without(board, EXT_PLACEHOLDER);
  return { ...set, boards: set.boards.map((b) => (b.id === board.id ? edited : b)) };
}

/** A new, empty board the same size and language as `like`, added to the set. */
export function addEmptyBoard(
  set: BoardSet,
  name: string,
  like: ObfBoard,
): { set: BoardSet; board: ObfBoard } {
  const board = {
    ...createBoard({
      id: uniqueId(
        name,
        set.boards.map((b) => b.id),
      ),
      name,
      rows: like.grid.rows,
      columns: like.grid.columns,
      locale: like.locale ?? 'en',
    }),
    ...(like.license ? { license: like.license } : {}),
  };
  return { set: { ...set, boards: [...set.boards, board] }, board };
}

/**
 * The board's other layout: its phone layout, or the full board a phone
 * layout belongs to. The two share words but not positions.
 */
export function linkedLayout(set: BoardSet, board: ObfBoard): ObfBoard | undefined {
  const compact = compactBoardId(board);
  if (compact) return set.boards.find((b) => b.id === compact);
  return set.boards.find((b) => b[EXT_COMPACT_BOARD] === board.id);
}

/** Boards a button can open: full boards, not phone layouts (links always point at full boards). */
export function linkableBoards(set: BoardSet): ObfBoard[] {
  const compact = new Set(set.boards.map(compactBoardId).filter((id) => id !== undefined));
  return set.boards.filter((b) => !compact.has(b.id));
}

/** Drops files no image or sound uses any more, so backups don't grow forever. */
export function withoutUnusedFiles(set: BoardSet): BoardSet {
  const used = new Set(
    set.boards.flatMap((b) => [...b.images, ...b.sounds].map((media) => media.path)),
  );
  const files = Object.fromEntries(Object.entries(set.files).filter(([path]) => used.has(path)));
  return Object.keys(files).length === Object.keys(set.files).length ? set : { ...set, files };
}
