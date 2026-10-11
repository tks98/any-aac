import type { BoardSet, ObfBoard } from '@open-aac/core';

const objectUrls = new WeakMap<Uint8Array, string>();

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
  return image.url;
}
