/**
 * Local storage in IndexedDB. The device is the only copy until backup and sync
 * exist, so we ask the browser not to evict it.
 */
import type { BoardSet } from '@open-aac/core';
import Dexie, { type EntityTable } from 'dexie';
import { withDefaults, type Settings } from './settings';

interface StoredSet {
  key: string;
  set: BoardSet;
  savedAt: number;
}

interface StoredSettings {
  key: string;
  settings: Settings;
}

/** A phrase rendered by an Open AAC voice, kept so it plays instantly next time. */
export interface StoredAudio {
  /** voice id | rate | text */
  key: string;
  voice: string;
  pcm: Int16Array;
  sampleRate: number;
}

/** When the boards were last backed up (a backup file downloaded). */
interface StoredMeta {
  key: string;
  value: number;
}

class Database extends Dexie {
  sets!: EntityTable<StoredSet, 'key'>;
  meta!: EntityTable<StoredMeta, 'key'>;
  settings!: EntityTable<StoredSettings, 'key'>;
  audio!: EntityTable<StoredAudio, 'key'>;

  constructor() {
    super('open-aac');
    this.version(1).stores({ sets: 'key' });
    this.version(2).stores({ sets: 'key', settings: 'key' });
    this.version(3).stores({ sets: 'key', settings: 'key', audio: 'key, voice' });
    this.version(4).stores({ sets: 'key', settings: 'key', audio: 'key, voice', meta: 'key' });
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

/** When the boards were last saved and last backed up (ms since 1970), if ever. */
export async function loadBackupTimes(): Promise<{
  savedAt: number | null;
  backedUpAt: number | null;
}> {
  const [set, meta] = await Promise.all([db.sets.get(CURRENT), db.meta.get('backedUpAt')]);
  return { savedAt: set?.savedAt ?? null, backedUpAt: meta?.value ?? null };
}

export async function saveBackupTime(at: number): Promise<void> {
  await db.meta.put({ key: 'backedUpAt', value: at });
}

export async function loadSettings(): Promise<Settings> {
  return withDefaults((await db.settings.get(CURRENT))?.settings);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await db.settings.put({ key: CURRENT, settings });
}

export async function loadAudio(key: string): Promise<StoredAudio | undefined> {
  return db.audio.get(key);
}

export async function saveAudio(audio: StoredAudio): Promise<void> {
  await db.audio.put(audio);
}

export async function deleteAudioForVoice(voice: string): Promise<void> {
  await db.audio.where('voice').equals(voice).delete();
}

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (await navigator.storage?.persisted?.()) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
