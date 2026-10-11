import { createBoard, type BoardSet } from '@open-aac/core';
import { describe, expect, it } from 'vitest';
import { backups } from '../src/lib/backup.svelte';

const DAY = 24 * 60 * 60 * 1000;
const set = (placeholder: boolean): BoardSet => ({
  rootId: 'b',
  boards: [
    {
      ...createBoard({ id: 'b', name: 'B', rows: 1, columns: 1 }),
      ext_openaac_placeholder: placeholder,
    },
  ],
  files: {},
});

describe('backup reminders', () => {
  it('never nag about untouched starter boards', () => {
    Object.assign(backups, { savedAt: 1000, backedUpAt: null });
    expect(backups.due(set(true))).toBe(false);
  });

  it('remind at once when edited boards have never been backed up', () => {
    Object.assign(backups, { savedAt: 1000, backedUpAt: null });
    expect(backups.due(set(false))).toBe(true);
  });

  it('remind a week after a backup, if the boards changed since', () => {
    const backedUpAt = 10 * DAY;
    Object.assign(backups, { savedAt: backedUpAt + DAY, backedUpAt });
    expect(backups.due(set(false), backedUpAt + 2 * DAY)).toBe(false);
    expect(backups.due(set(false), backedUpAt + 8 * DAY)).toBe(true);
    Object.assign(backups, { savedAt: backedUpAt - DAY, backedUpAt });
    expect(backups.due(set(false), backedUpAt + 30 * DAY)).toBe(false);
  });
});
