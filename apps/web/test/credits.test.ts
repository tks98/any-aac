import { createBoard, type BoardSet, type ObfImage } from '@open-aac/core';
import { describe, expect, it } from 'vitest';
import { pictureCredits } from '../src/lib/credits';

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
