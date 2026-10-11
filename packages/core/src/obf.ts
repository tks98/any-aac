/**
 * Open Board Format (OBF) types and parsing.
 *
 * Any AAC keeps boards in OBF shape, so import and export are lossless: fields we
 * don't understand, including other apps' `ext_*` fields, are carried through as-is.
 * Our own extensions use the `ext_anyaac_` prefix (see ext.ts).
 *
 * Field names follow the spec at https://www.openboardformat.org/docs and the
 * reference implementation in https://github.com/CoughDrop/obf.
 */

import { renameOldFields } from './ext';

export const OBF_FORMAT = 'open-board-0.1';

export interface ObfLicense {
  type: string;
  copyright_notice_url?: string;
  source_url?: string;
  author_name?: string;
  author_url?: string;
  author_email?: string;
  [key: string]: unknown;
}

/** A link from a button to another board (`load_board`). */
export interface ObfBoardRef {
  id?: string;
  name?: string;
  path?: string;
  url?: string;
  data_url?: string;
  [key: string]: unknown;
}

export interface ObfButton {
  id: string;
  label?: string;
  vocalization?: string;
  image_id?: string;
  sound_id?: string;
  action?: string;
  actions?: string[];
  load_board?: ObfBoardRef;
  background_color?: string;
  border_color?: string;
  hidden?: boolean;
  [key: string]: unknown;
}

export interface ObfMedia {
  id: string;
  url?: string;
  data?: string;
  data_url?: string;
  path?: string;
  content_type?: string;
  license?: ObfLicense;
  [key: string]: unknown;
}

export interface ObfImage extends ObfMedia {
  width?: number;
  height?: number;
}

export interface ObfSound extends ObfMedia {
  duration?: number;
}

export interface ObfGrid {
  rows: number;
  columns: number;
  /** Button ids, row by row. `null` is an empty cell. */
  order: (string | null)[][];
  [key: string]: unknown;
}

export interface ObfBoard {
  format: string;
  id: string;
  locale?: string;
  name?: string;
  description_html?: string;
  license?: ObfLicense;
  buttons: ObfButton[];
  grid: ObfGrid;
  images: ObfImage[];
  sounds: ObfSound[];
  [key: string]: unknown;
}

export interface ObfManifest {
  format: string;
  root: string;
  paths: {
    boards?: Record<string, string>;
    images?: Record<string, string>;
    sounds?: Record<string, string>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/** Something odd in an imported file that we repaired or skipped. */
export interface Issue {
  message: string;
}

/** The file can't be used at all. */
export class ObfError extends Error {
  override name = 'ObfError';
}

export interface ParseOptions {
  /** Makes ids for items that have none. Defaults to random UUIDs. */
  makeId?: (kind: string) => string;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toId(value: unknown): string | undefined {
  if (typeof value === 'string' && value !== '') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function positiveInt(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
}

function randomId(): string {
  // randomUUID only exists in secure contexts; plain http:// on a LAN doesn't have it.
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

const defaultMakeId = (kind: string) => `${kind}-${randomId()}`;

/** OBF allows `buttons`, `images` and `sounds` as arrays or as objects keyed by id. */
function toList(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([id, item]) => (isRecord(item) ? [{ id, ...item }] : []));
  }
  return [];
}

function withIds(
  items: Record<string, unknown>[],
  kind: string,
  issues: Issue[],
  makeId: (kind: string) => string,
): (Record<string, unknown> & { id: string })[] {
  const seen = new Set<string>();
  const out: (Record<string, unknown> & { id: string })[] = [];
  for (const item of items) {
    let id = toId(item.id);
    if (id === undefined) {
      id = makeId(kind);
      issues.push({ message: `A ${kind} had no id; gave it "${id}".` });
    }
    if (seen.has(id)) {
      issues.push({ message: `Two ${kind}s share the id "${id}"; kept the first.` });
      continue;
    }
    seen.add(id);
    out.push({ ...item, id });
  }
  return out;
}

function normalizeButton(raw: Record<string, unknown> & { id: string }): ObfButton {
  const button: ObfButton = { ...raw };
  for (const key of ['image_id', 'sound_id'] as const) {
    const id = toId(raw[key]);
    if (id === undefined) delete button[key];
    else button[key] = id;
  }
  if (isRecord(raw.load_board)) {
    const ref: ObfBoardRef = { ...raw.load_board };
    const id = toId(raw.load_board.id);
    if (id === undefined) delete ref.id;
    else ref.id = id;
    button.load_board = ref;
  } else {
    delete button.load_board;
  }
  return button;
}

function normalizeGrid(raw: unknown, buttonIds: Set<string>, issues: Issue[]): ObfGrid {
  const grid = isRecord(raw) ? raw : {};
  const rawOrder: unknown[] = Array.isArray(grid.order) ? grid.order : [];
  const rows = positiveInt(grid.rows) ?? (rawOrder.length || 1);
  const columns =
    positiveInt(grid.columns) ??
    Math.max(1, ...rawOrder.map((row) => (Array.isArray(row) ? row.length : 0)));

  const outside = rawOrder.some(
    (row, r) =>
      Array.isArray(row) && row.some((cell, c) => cell != null && (r >= rows || c >= columns)),
  );
  if (outside) issues.push({ message: 'Some buttons sat outside the grid and were left out.' });

  const order = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: columns }, (_, c) => {
      const row = rawOrder[r];
      const id = toId(Array.isArray(row) ? row[c] : undefined);
      if (id === undefined) return null;
      if (!buttonIds.has(id)) {
        issues.push({ message: `The grid points to a missing button "${id}".` });
        return null;
      }
      return id;
    }),
  );
  return { ...grid, rows, columns, order };
}

export function parseJson(text: string, what: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new ObfError(`${what} is not valid JSON.`);
  }
}

/**
 * Reads one OBF board (a parsed object or its JSON text), repairing what can be
 * repaired. Unknown fields are kept. Throws ObfError if it isn't a board at all.
 */
export function parseObf(
  input: unknown,
  options: ParseOptions = {},
): { board: ObfBoard; issues: Issue[] } {
  const parsed = typeof input === 'string' ? parseJson(input, 'The board') : input;
  if (!isRecord(parsed)) throw new ObfError('A board must be a JSON object.');
  const json = renameOldFields(parsed);

  const issues: Issue[] = [];
  const makeId = options.makeId ?? defaultMakeId;

  let format = json.format;
  if (typeof format !== 'string' || !format.startsWith('open-board-')) {
    issues.push({ message: `The board has no OBF "format"; read it as ${OBF_FORMAT}.` });
    format = OBF_FORMAT;
  }

  let id = toId(json.id);
  if (id === undefined) {
    id = makeId('board');
    issues.push({ message: `The board had no id; gave it "${id}".` });
  }

  const images = withIds(toList(json.images), 'image', issues, makeId) as ObfImage[];
  const sounds = withIds(toList(json.sounds), 'sound', issues, makeId) as ObfSound[];
  const buttons = withIds(toList(json.buttons), 'button', issues, makeId).map(normalizeButton);
  const grid = normalizeGrid(json.grid, new Set(buttons.map((b) => b.id)), issues);

  const imageIds = new Set(images.map((i) => i.id));
  for (const button of buttons) {
    if (button.image_id !== undefined && !imageIds.has(button.image_id)) {
      issues.push({ message: `Button "${button.id}" uses a missing image "${button.image_id}".` });
    }
  }

  return {
    board: { ...json, format: format as string, id, buttons, grid, images, sounds },
    issues,
  };
}

export function serializeObf(board: ObfBoard): string {
  return JSON.stringify(board, null, 2);
}
