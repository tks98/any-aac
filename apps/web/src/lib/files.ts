import { readObf, readObz, writeObz, type BoardSet, type Issue } from '@open-aac/core';

/** Reads an .obz package or a single .obf board, telling them apart by content. */
export async function readBoardFile(file: Blob): Promise<{ set: BoardSet; issues: Issue[] }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK"
  return isZip ? readObz(bytes) : readObf(new TextDecoder().decode(bytes));
}

export function downloadBoards(set: BoardSet) {
  const bytes = writeObz(set);
  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `open-aac-boards-${new Date().toISOString().slice(0, 10)}.obz`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
