/// <reference types="node" />
// The tests read fixture files; the package itself runs in browsers.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { ObfError, readObf, readObz, writeObz, type BoardSet } from '../src';

/** Files made by other apps' own exporters; see fixtures/real-exports/README.md. */
const fixture = (path: string) =>
  new Uint8Array(readFileSync(new URL(`fixtures/real-exports/${path}`, import.meta.url)));
const text = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

/** Every folder button opens a board that's in the set. */
function linksResolve(set: BoardSet) {
  const ids = new Set(set.boards.map((b) => b.id));
  const targets = set.boards.flatMap((b) =>
    b.buttons.flatMap((button) => (button.load_board ? [button.load_board.id] : [])),
  );
  return { targets: targets.length, missing: targets.filter((id) => !id || !ids.has(id)) };
}

describe('Cboard exports', () => {
  it('reads a single board, with its pictures inlined', () => {
    const { set, issues } = readObf(text(gunzipSync(fixture('cboard/classic-home.obf.gz'))));
    expect(issues).toEqual([]);
    const [board] = set.boards;
    expect(board?.name).toBe('Cboard Classic Home');
    expect(board?.grid).toMatchObject({ rows: 5, columns: 6 });
    expect(board?.buttons).toHaveLength(29);
    expect(board?.buttons.slice(0, 3).map((b) => b.label)).toEqual(['yes', 'no', 'quick chat']);
    expect(board?.buttons.every((b) => b.image_id !== undefined)).toBe(true);
    expect(board?.images.every((i) => i.data?.startsWith('data:image/svg+xml;base64,'))).toBe(true);
    // Cboard's own fields come through, so a board can go back to Cboard.
    expect(board?.buttons[0]?.ext_cboard_label_key).toBe('cboard.symbol.yes');

    const again = readObz(writeObz(set)).set;
    expect(again.boards[0]?.buttons).toEqual(board?.buttons);
    expect(again.boards[0]?.images).toEqual(board?.images);
  });

  it('says plainly that an empty export has no boards', () => {
    expect(() => readObz(fixture('cboard/empty-all-boards.obz'))).toThrow(ObfError);
    expect(() => readObz(fixture('cboard/empty-all-boards.obz'))).toThrow(
      'There are no boards in this file.',
    );
  });
});

describe('CoughDrop exports', () => {
  it('follows links between boards by path', () => {
    const { set, issues } = readObz(fixture('coughdrop/links.obz'));
    expect(issues).toEqual([]);
    expect(set.boards).toHaveLength(3);
    expect(linksResolve(set)).toEqual({ targets: 2, missing: [] });
  });

  it('finds pictures stored in the package', () => {
    const { set } = readObz(fixture('coughdrop/path_images.obz'));
    const images = set.boards.flatMap((b) => b.images);
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) expect(set.files[image.path ?? '']?.length).toBeGreaterThan(0);
  });

  it('keeps labels in any script', () => {
    const { set } = readObf(text(fixture('coughdrop/foreign.obf')));
    expect(set.boards[0]?.buttons.map((b) => b.label)).toEqual([
      'हेर्नुहोस्',
      'यो',
      'صرخة',
      '水很酷哟',
    ]);
  });

  it('reads a big set without formats, and says so once', () => {
    const { set, issues } = readObz(fixture('coughdrop/deep_simple.zip'));
    expect(set.boards).toHaveLength(98);
    expect(linksResolve(set).missing).toEqual([]);
    expect(issues.map((i) => i.message)).toEqual([
      '98 boards: The board has no OBF "format"; read it as open-board-0.1.',
    ]);
    // macOS's zip folder isn't part of the boards.
    expect(Object.keys(set.files).filter((path) => path.startsWith('__MACOSX'))).toEqual([]);
  });

  it('reads a converted page set, and counts what it lacks in one notice each', () => {
    const { set, issues } = readObz(fixture('coughdrop/pageset.obz'));
    expect(set.boards).toHaveLength(81);
    // Links to boards the converter never wrote (some are the other app's
    // commands, like "print::ice cream;goto::flavors") become words.
    expect(linksResolve(set)).toEqual({ targets: 159, missing: [] });
    expect(issues).toHaveLength(2);
    expect(issues[1]?.message).toBe(
      "15 folder buttons opened boards that aren't in the file; they now say their words.",
    );
    expect(issues[0]).toEqual({
      message:
        "926 buttons on 81 boards use pictures that aren't in the file; they show only their words.",
      missingImages: 926,
    });
  });
});
