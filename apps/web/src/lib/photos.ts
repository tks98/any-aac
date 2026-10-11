/**
 * Photos and pictures from the device, made small enough to keep with the
 * boards: at most 512 px on the longest side, as JPEG (or PNG when the picture
 * has transparency, like a drawing or a cut-out).
 */

const MAX_SIDE = 512;

export interface Picture {
  bytes: Uint8Array;
  contentType: 'image/jpeg' | 'image/png';
  width: number;
  height: number;
}

export async function shrinkPicture(file: Blob): Promise<Picture> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No 2D canvas.');
    context.drawImage(bitmap, 0, 0, width, height);
    const transparent = hasTransparency(context.getImageData(0, 0, width, height).data);
    const contentType = transparent ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, contentType, 0.85),
    );
    if (!blob) throw new Error('The picture could not be encoded.');
    return { bytes: new Uint8Array(await blob.arrayBuffer()), contentType, width, height };
  } finally {
    bitmap.close();
  }
}

function hasTransparency(pixels: Uint8ClampedArray): boolean {
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i]! < 250) return true;
  }
  return false;
}
