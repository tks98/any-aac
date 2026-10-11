/**
 * OBZ packages: a zip holding `manifest.json`, one or more .obf boards, and the
 * image and sound files they point to by `path`.
 */
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate';
import {
  isRecord,
  OBF_FORMAT,
  ObfError,
  parseJson,
  parseObf,
  type Issue,
  type ObfBoard,
  type ObfManifest,
  type ParseOptions,
} from './obf';

/** A set of linked boards plus the binary files their images and sounds use. */
export interface BoardSet {
  rootId: string;
  boards: ObfBoard[];
  /** Image and sound bytes, keyed by the `path` used in the boards. */
  files: Record<string, Uint8Array>;
}

function stringMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

/** Reads a single .obf board as a one-board set. */
export function readObf(
  input: string | unknown,
  options?: ParseOptions,
): { set: BoardSet; issues: Issue[] } {
  const { board, issues } = parseObf(input, options);
  return { set: { rootId: board.id, boards: [board], files: {} }, issues };
}

export function readObz(
  bytes: Uint8Array,
  options?: ParseOptions,
): { set: BoardSet; issues: Issue[] } {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(bytes);
  } catch {
    throw new ObfError('This file is not a valid .obz package.');
  }
  const manifestBytes = entries['manifest.json'];
  if (!manifestBytes) throw new ObfError('The package has no manifest.json.');
  const manifest = parseJson(strFromU8(manifestBytes), 'manifest.json');
  if (!isRecord(manifest) || typeof manifest.root !== 'string') {
    throw new ObfError('manifest.json does not name a root board.');
  }
  const paths = isRecord(manifest.paths) ? manifest.paths : {};
  const boardPaths = stringMap(paths.boards);
  const imagePaths = stringMap(paths.images);
  const soundPaths = stringMap(paths.sounds);

  const issues: Issue[] = [];
  const byPath = new Map<string, ObfBoard>();
  const queue = [manifest.root, ...Object.values(boardPaths)];
  while (queue.length > 0) {
    const path = queue.shift() as string;
    if (byPath.has(path)) continue;
    const file = entries[path];
    if (!file) {
      issues.push({ message: `The package is missing ${path}.` });
      continue;
    }
    const parsed = parseObf(parseJson(strFromU8(file), path), options);
    issues.push(...parsed.issues.map((i) => ({ message: `${path}: ${i.message}` })));
    byPath.set(path, parsed.board);
    for (const button of parsed.board.buttons) {
      const ref = button.load_board;
      const next = ref?.path ?? (ref?.id !== undefined ? boardPaths[ref.id] : undefined);
      if (next !== undefined && !byPath.has(next)) queue.push(next);
    }
  }

  const root = byPath.get(manifest.root);
  if (!root) throw new ObfError('The root board could not be read.');

  const idByPath = new Map([...byPath].map(([path, board]) => [path, board.id]));
  const seen = new Set<string>();
  const boards: ObfBoard[] = [];
  for (const [path, board] of byPath) {
    if (seen.has(board.id)) {
      issues.push({
        message: `${path}: another board already uses the id "${board.id}"; skipped.`,
      });
      continue;
    }
    seen.add(board.id);
    boards.push({
      ...board,
      buttons: board.buttons.map((button) => {
        const ref = button.load_board;
        if (!ref) return button;
        const path = ref.path ?? (ref.id !== undefined ? boardPaths[ref.id] : undefined);
        const id = path !== undefined ? idByPath.get(path) : undefined;
        return id !== undefined ? { ...button, load_board: { ...ref, id } } : button;
      }),
      // Some exporters list media paths only in the manifest.
      images: board.images.map((image) =>
        image.path === undefined && image.data === undefined && imagePaths[image.id]
          ? { ...image, path: imagePaths[image.id] }
          : image,
      ),
      sounds: board.sounds.map((sound) =>
        sound.path === undefined && sound.data === undefined && soundPaths[sound.id]
          ? { ...sound, path: soundPaths[sound.id] }
          : sound,
      ),
    });
  }

  const files: Record<string, Uint8Array> = {};
  for (const [path, data] of Object.entries(entries)) {
    if (path === 'manifest.json' || byPath.has(path) || path.endsWith('/')) continue;
    files[path] = data;
  }

  return { set: { rootId: root.id, boards, files }, issues };
}

function boardFileNames(boards: ObfBoard[]): Map<string, string> {
  const used = new Set<string>();
  const names = new Map<string, string>();
  for (const board of boards) {
    const base = board.id.replace(/[^A-Za-z0-9._-]+/g, '_') || 'board';
    let name = `boards/${base}.obf`;
    for (let n = 2; used.has(name); n++) name = `boards/${base}-${n}.obf`;
    used.add(name);
    names.set(board.id, name);
  }
  return names;
}

/**
 * Packs a set as .obz. `extras` are more files for the zip (e.g. an app's own
 * settings); other apps ignore them, and readObz returns them in `files`.
 */
export function writeObz(set: BoardSet, extras: Record<string, Uint8Array> = {}): Uint8Array {
  const pathFor = boardFileNames(set.boards);
  const rootPath = pathFor.get(set.rootId);
  if (!rootPath) throw new ObfError('The root board is not in the set.');

  const manifest: ObfManifest = {
    format: OBF_FORMAT,
    root: rootPath,
    paths: { boards: {}, images: {}, sounds: {} },
  };
  const zip: Zippable = {};

  for (const board of set.boards) {
    const path = pathFor.get(board.id) as string;
    const out: ObfBoard = {
      ...board,
      buttons: board.buttons.map((button) => {
        const target = button.load_board?.id;
        const targetPath = target !== undefined ? pathFor.get(target) : undefined;
        return targetPath
          ? { ...button, load_board: { ...button.load_board, path: targetPath } }
          : button;
      }),
    };
    zip[path] = [strToU8(JSON.stringify(out, null, 2)), { level: 6 }];
    manifest.paths.boards![board.id] = path;
    for (const image of board.images) {
      if (image.path !== undefined) manifest.paths.images![image.id] = image.path;
    }
    for (const sound of board.sounds) {
      if (sound.path !== undefined) manifest.paths.sounds![sound.id] = sound.path;
    }
  }

  // Images and sounds are usually compressed already.
  for (const [path, data] of Object.entries(set.files)) zip[path] = [data, { level: 0 }];
  for (const [path, data] of Object.entries(extras)) zip[path] = [data, { level: 6 }];
  zip['manifest.json'] = [strToU8(JSON.stringify(manifest, null, 2)), { level: 6 }];
  return zipSync(zip);
}
