/**
 * Local storage in IndexedDB. The device is the only copy until backup and sync
 * exist, so we ask the browser not to evict it.
 */
import type { BoardSet } from '@open-aac/core';
import Dexie, { type EntityTable } from 'dexie';

interface StoredSet {
  key: string;
  set: BoardSet;
  savedAt: number;
}

class Database extends Dexie {
  sets!: EntityTable<StoredSet, 'key'>;

  constructor() {
    super('open-aac');
    this.version(1).stores({ sets: 'key' });
  }
}

const db = new Database();
const CURRENT = 'current';

export async function loadBoards(): Promise<BoardSet | undefined> {
  return (await db.sets.get(CURRENT))?.set;
}

export async function saveBoards(set: BoardSet): Promise<void> {
  await db.sets.put({ key: CURRENT, set, savedAt: Date.now() });
}

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (await navigator.storage?.persisted?.()) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
