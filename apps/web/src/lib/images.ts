import type { BoardSet, ObfBoard } from '@any-aac/core';

const objectUrls = new WeakMap<Uint8Array, string>();

/** True for a picture's address on another website (not this one, and not inline). */
export function isElsewhere(url: string | undefined): boolean {
  if (!url || /^(data|blob):/i.test(url)) return false;
  try {
    return new URL(url, location.href).origin !== location.origin;
  } catch {
    return false;
  }
}

/** A URL the <img> tag can show for one of a board's images, if it has one. */
export function imageSrc(set: BoardSet, board: ObfBoard, imageId: string | undefined) {
  if (imageId === undefined) return undefined;
  const image = board.images.find((i) => i.id === imageId);
  if (!image) return undefined;
  if (image.data) return image.data;
  if (image.path) {
    const bytes = set.files[image.path];
    if (bytes) {
      let url = objectUrls.get(bytes);
      if (!url) {
        const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], {
          type: image.content_type ?? '',
        });
        url = URL.createObjectURL(blob);
        objectUrls.set(bytes, url);
      }
      return url;
    }
  }
  // Any AAC contacts no other site (see linked-pictures.ts): the button shows its word.
  return isElsewhere(image.url) ? undefined : image.url;
}
