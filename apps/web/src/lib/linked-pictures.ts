/**
 * Pictures that boards only link to, on another website. Other AAC apps export
 * boards this way (CoughDrop's single boards, page sets built from OpenSymbols).
 * Any AAC contacts no other site, and its security policy wouldn't let it, so
 * it doesn't load them: those buttons show their words. But Mulberry symbols
 * linked from OpenSymbols are in Any AAC's own library, so on import they're
 * copied in from there, and work offline.
 */
import type { BoardSet, ObfBoard, ObfImage } from '@any-aac/core';
import { isElsewhere } from './images';
import { loadSymbols, symbolImage, type LibrarySymbol } from './symbol-library';

/** OpenSymbols keeps each library under /libraries/<name>/<file>. */
const MULBERRY = /\/libraries\/mulberry\/([^/]+)\.(?:svg|png)$/i;

const fold = (name: string) => name.toLowerCase().replace(/_/g, ' ').trim();

/** A picture that's only a link: no inline data, and no file in the set. */
const onlyLinked = (set: BoardSet, image: ObfImage) =>
  !image.data && !(image.path && set.files[image.path]) && isElsewhere(image.url);

export function hasLinkedPictures(set: BoardSet): boolean {
  return set.boards.some((board) => board.images.some((image) => onlyLinked(set, image)));
}

/** The Mulberry symbol a linked picture is, if it's one from OpenSymbols. */
function mulberryName(url: string): string | undefined {
  try {
    const match = MULBERRY.exec(decodeURIComponent(new URL(url).pathname));
    return match?.[1] ? fold(match[1]) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Copies linked Mulberry symbols in from the library. Returns the new set and
 * how many buttons' pictures now come from the library, and how many are
 * still only on another site.
 */
export async function localizeLinkedPictures(
  set: BoardSet,
): Promise<{ set: BoardSet; fromLibrary: number; elsewhere: number }> {
  if (!hasLinkedPictures(set)) return { set, fromLibrary: 0, elsewhere: 0 };
  const symbols = await loadSymbols();
  const byName = new Map<string, LibrarySymbol>();
  for (const symbol of symbols) {
    if (symbol.set !== 'mulberry') continue;
    byName.set(fold(symbol.name), symbol);
    byName.set(fold(symbol.file), symbol);
  }

  const files = { ...set.files };
  const copied = new Map<LibrarySymbol, { path: string; image: ObfImage }>();
  async function fromLibrary(image: ObfImage): Promise<ObfImage> {
    if (!onlyLinked(set, image)) return image;
    const name = mulberryName(image.url!);
    const symbol = name ? byName.get(name) : undefined;
    if (!symbol) return image;
    let local = copied.get(symbol);
    if (!local) {
      try {
        const { image: picked, path, bytes } = await symbolImage(symbol);
        files[path] = bytes;
        local = { path, image: picked };
        copied.set(symbol, local);
      } catch {
        return image;
      }
    }
    // Keeps the board's own id (buttons point to it), licence and link.
    return {
      ...image,
      path: local.path,
      content_type: local.image.content_type,
      license: image.license ?? local.image.license,
    };
  }

  let fromLibraryCount = 0;
  let elsewhere = 0;
  const boards: ObfBoard[] = [];
  for (const board of set.boards) {
    const images = await Promise.all(board.images.map(fromLibrary));
    const changed = new Set(
      images.filter((image, i) => image !== board.images[i]).map((i) => i.id),
    );
    const stillLinked = new Set(
      images.filter((image) => onlyLinked({ ...set, files }, image)).map((i) => i.id),
    );
    for (const button of board.buttons) {
      if (button.image_id === undefined) continue;
      if (changed.has(button.image_id)) fromLibraryCount++;
      else if (stillLinked.has(button.image_id)) elsewhere++;
    }
    boards.push({ ...board, images });
  }
  return { set: { ...set, boards, files }, fromLibrary: fromLibraryCount, elsewhere };
}
