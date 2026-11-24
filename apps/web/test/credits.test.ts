import { createBoard, type BoardSet, type ObfImage } from '@any-aac/core';
import { describe, expect, it } from 'vitest';
import { pictureCredits, webLink } from '../src/lib/credits';

const mulberry = (id: string): ObfImage => ({
  id,
  path: `images/${id}.svg`,
  license: {
    type: 'CC BY-SA 4.0',
    author_name: 'Steve Lee (Mulberry Symbols)',
    author_url: 'https://mulberrysymbols.org',
  },
});

describe('pictureCredits', () => {
  it('counts each picture once, by who made it, and the device’s own photos', () => {
    const board = createBoard({ id: 'b', name: 'B', rows: 1, columns: 1 });
    const set: BoardSet = {
      rootId: 'a',
      boards: [
        {
          ...board,
          id: 'a',
          images: [mulberry('dog'), mulberry('cat'), { id: 'photo-1', path: 'p.jpg' }],
        },
        { ...board, id: 'b', images: [mulberry('dog')] },
      ],
      files: {},
    };
    expect(pictureCredits(set)).toEqual({
      credits: [
        {
          author: 'Steve Lee (Mulberry Symbols)',
          url: 'https://mulberrysymbols.org',
          license: 'CC BY-SA 4.0',
          count: 2,
        },
      ],
      ownPictures: 1,
    });
  });
});

describe('webLink', () => {
  it('keeps http: and https: links only', () => {
    expect(webLink('https://mulberrysymbols.org')).toBe('https://mulberrysymbols.org');
    expect(webLink('http://example.org/a')).toBe('http://example.org/a');
    expect(webLink('javascript:alert(1)')).toBeUndefined();
    expect(webLink('data:text/html,hi')).toBeUndefined();
    expect(webLink('mailto:a@example.org')).toBeUndefined();
    expect(webLink('example.org')).toBeUndefined();
    expect(webLink(5)).toBeUndefined();
  });
});

describe('pictureCredits with odd licences', () => {
  it('shows the credit without a link when the link isn’t a web address, and skips non-text', () => {
    const board = createBoard({ id: 'a', name: 'A', rows: 1, columns: 1 });
    const set: BoardSet = {
      rootId: 'a',
      boards: [
        {
          ...board,
          images: [
            {
              id: 'x',
              path: 'x.png',
              license: {
                type: 'CC BY 4.0',
                author_name: 'Someone',
                author_url: 'javascript:alert(1)',
                copyright_notice_url: 'https://creativecommons.org/licenses/by/4.0/',
              },
            },
            {
              id: 'y',
              path: 'y.png',
              license: { type: 3, author_name: { not: 'text' } } as unknown as ObfImage['license'],
            },
          ],
        },
      ],
      files: {},
    };
    expect(pictureCredits(set)).toEqual({
      credits: [
        {
          author: 'Someone',
          license: 'CC BY 4.0',
          licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
          count: 1,
        },
      ],
      ownPictures: 1,
    });
  });
});
