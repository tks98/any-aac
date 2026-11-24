import { describe, expect, it, vi } from 'vitest';
import type { BoardSet } from '@any-aac/core';

// Edits save as they're made; here they only need to be noticed.
const saved: BoardSet[] = [];
vi.mock('../src/lib/storage', () => ({
  saveBoards: async (set: BoardSet) => void saved.push(set),
  SavedElsewhere: class extends Error {},
}));

const { app } = await import('../src/lib/state.svelte');
const { editor } = await import('../src/lib/editor.svelte');

/** A one-board set with a single word on it. */
function setOf(word: string): BoardSet {
  return {
    rootId: 'home',
    files: {},
    boards: [
      {
        format: 'open-board-0.1',
        id: 'home',
        name: 'Home',
        locale: 'en',
        grid: { rows: 1, columns: 2, order: [['a', null]] },
        buttons: [{ id: 'a', label: word }],
        images: [],
        sounds: [],
      },
    ],
  } as unknown as BoardSet;
}

const label = () => app.set?.boards[0]?.buttons[0]?.label;

function rename(word: string) {
  editor.select({ row: 0, column: 0 });
  editor.editButton((button) => ({ ...button, label: word }));
}

describe('undo', () => {
  it('goes back through edits', () => {
    app.load(setOf('old'));
    rename('new');
    expect(label()).toBe('new');
    expect(editor.canUndo).toBe(true);
    editor.undo();
    expect(label()).toBe('old');
    expect(editor.canRedo).toBe(true);
  });

  it.each([
    ['an import or start over', (set: BoardSet) => app.load(set)],
    ['boards saved in another tab', (set: BoardSet) => app.reload(set)],
  ])("doesn't reach back across %s", (_, replace) => {
    app.load(setOf('mine'));
    rename('edited');
    editor.undo();
    rename('again');
    expect(editor.canUndo).toBe(true);
    replace(setOf('imported'));
    expect(editor.canUndo).toBe(false);
    expect(editor.canRedo).toBe(false);
    const saves = saved.length;
    editor.undo();
    editor.redo();
    expect(label()).toBe('imported');
    expect(saved.length).toBe(saves);
  });
});
