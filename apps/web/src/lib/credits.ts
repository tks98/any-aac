/**
 * Who made the pictures in a set of boards, from the licence each image
 * carries, so the credits that CC BY-SA asks for are always complete.
 */
import { EXT_PLACEHOLDER, isRecord, type BoardSet } from '@any-aac/core';

export interface Credit {
  author: string;
  url?: string;
  license?: string;
  licenseUrl?: string;
  count: number;
}

/** A licence field as text, or nothing if it isn't text. */
const text = (value: unknown) => (typeof value === 'string' && value !== '' ? value : undefined);

/** A link we'd show: only http: and https: URLs, so a file can't make a link that runs or opens anything else. */
export function webLink(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:' ? value : undefined;
  } catch {
    return undefined;
  }
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
      const license = isRecord(image.license) ? image.license : undefined;
      const author = text(license?.author_name);
      if (!license || !author) {
        // Placeholders are ours; anything else without a licence is someone's own picture.
        if (image[EXT_PLACEHOLDER] !== true) ownPictures++;
        continue;
      }
      const type = text(license.type);
      const url = webLink(license.author_url);
      const licenseUrl = webLink(license.copyright_notice_url);
      const id = `${author}|${type ?? ''}`;
      const credit = credits.get(id);
      if (credit) {
        credit.count++;
      } else {
        credits.set(id, {
          author,
          ...(url ? { url } : {}),
          ...(type ? { license: type } : {}),
          ...(licenseUrl ? { licenseUrl } : {}),
          count: 1,
        });
      }
    }
  }
  return { credits: [...credits.values()].sort((a, b) => b.count - a.count), ownPictures };
}
