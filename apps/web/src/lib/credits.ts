/**
 * Who made the pictures in a set of boards, from the licence each image
 * carries, so the credits that CC BY-SA asks for are always complete.
 */
import { EXT_PLACEHOLDER, type BoardSet } from '@any-aac/core';

export interface Credit {
  author: string;
  url?: string;
  license?: string;
  licenseUrl?: string;
  count: number;
}

export function pictureCredits(set: BoardSet): { credits: Credit[]; ownPictures: number } {
  const seen = new Set<string>();
  const credits = new Map<string, Credit>();
  let ownPictures = 0;
  for (const board of set.boards) {
    for (const image of board.images) {
      const key = image.path ?? image.url ?? image.data ?? image.id;
      if (seen.has(key)) continue;
      seen.add(key);
      const license = image.license;
      if (!license?.author_name) {
        // Placeholders are ours; anything else without a licence is someone's own picture.
        if (image[EXT_PLACEHOLDER] !== true) ownPictures++;
        continue;
      }
      const id = `${license.author_name}|${license.type ?? ''}`;
      const credit = credits.get(id);
      if (credit) {
        credit.count++;
      } else {
        credits.set(id, {
          author: license.author_name,
          ...(license.author_url ? { url: license.author_url } : {}),
          ...(license.type ? { license: license.type } : {}),
          ...(license.copyright_notice_url ? { licenseUrl: license.copyright_notice_url } : {}),
          count: 1,
        });
      }
    }
  }
  return { credits: [...credits.values()].sort((a, b) => b.count - a.count), ownPictures };
}
