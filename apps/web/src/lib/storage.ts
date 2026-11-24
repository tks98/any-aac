/**
 * Local storage in IndexedDB. The device is the only copy until backup and sync
 * exist, so we ask the browser not to evict it.
 */
import { cleanBoardSet, renameOldFields, type BoardSet } from '@any-aac/core';
import Dexie, { type EntityTable } from 'dexie';
import { withDefaults, type Settings } from './settings';

interface StoredSet {
  key: string;
  set: BoardSet;
  savedAt: number;
  /** Goes up by one with every save, so a tab can tell another tab saved since it read. */
  revision?: number;
}

interface StoredSettings {
  key: string;
  settings: Settings;
  revision?: number;
}

/** A phrase rendered by an app voice, kept so it plays instantly next time. */
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
    // Storage names keep the app's first name (Open AAC), so everything saved
    // before it was renamed is still found.
    super('open-aac');
    this.version(1).stores({ sets: 'key' });
    this.version(2).stores({ sets: 'key', settings: 'key' });
    this.version(3).stores({ sets: 'key', settings: 'key', audio: 'key, voice' });
    this.version(4).stores({ sets: 'key', settings: 'key', audio: 'key, voice', meta: 'key' });
  }
}

const db = new Database();
const CURRENT = 'current';

/** Writes still in progress, so the app doesn't reload (to update) in the middle of one. */
const writing = new Set<Promise<unknown>>();

function tracked<T>(write: Promise<T>): Promise<T> {
  writing.add(write);
  const done = () => writing.delete(write);
  write.then(done, done);
  return write;
}

/** Resolves once every write started so far has finished, saved or not. */
export async function writesFinished(): Promise<void> {
  while (writing.size > 0) await Promise.allSettled([...writing]);
}

/** The boards as they were before the last import, start over or restore. One copy only. */
const PREVIOUS = 'previous';

/** Saving was refused because the saved boards (or settings) haven't been read yet. */
export class NotReadYet extends Error {
  constructor() {
    super('The saved data has not been read, so it was not overwritten.');
  }
}

/** Saving was refused because another tab saved newer data; this tab is told to reload. */
export class SavedElsewhere extends Error {
  constructor() {
    super('Another tab saved newer data, so it was not overwritten.');
  }
}

export type Stored = 'boards' | 'settings';

/**
 * The revision this tab last read or wrote, or null before a read has worked.
 * Until one has, nothing is saved: a failed read at startup shows the starter
 * boards, and saving them would replace the real ones.
 */
const revisions: Record<Stored, number | null> = { boards: null, settings: null };

/** Settings as last read or saved, so unchanged settings aren't saved again. */
let storedSettings = '';

const listeners = new Set<(what: Stored) => void>();

/**
 * Calls `listener` when another tab has saved newer boards or settings, so
 * this tab can read them again instead of saving over them.
 */
export function onSavedElsewhere(listener: (what: Stored) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function newer(what: Stored) {
  for (const listener of listeners) listener(what);
}

/** Tells the app's other tabs (the installed app and a browser tab, say) about a save. */
const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('any-aac');
channel?.addEventListener('message', (event: MessageEvent<{ what: Stored; revision: number }>) => {
  const { what, revision } = event.data;
  const mine = revisions[what];
  if (mine !== null && revision > mine) newer(what);
});

function announce(what: Stored, revision: number) {
  try {
    channel?.postMessage({ what, revision });
  } catch {
    // Another tab will still notice when it next saves.
  }
}

/** The next revision to save, or throws if this tab hasn't read the data or another tab saved since. */
function checkRevision(what: Stored, stored: number | undefined): number {
  const mine = revisions[what];
  if (mine === null) throw new NotReadYet();
  if ((stored ?? 0) > mine) throw new SavedElsewhere();
  return mine + 1;
}

/**
 * This tab's reads and saves of each kind, run one after another. A save's
 * revision is only kept once its transaction has committed (a commit can still
 * fail, Safari's quota errors among them), so the next save has to wait for it
 * or it would take this tab's own save for another tab's.
 */
const queues: Record<Stored, Promise<unknown>> = {
  boards: Promise.resolve(),
  settings: Promise.resolve(),
};

function inTurn<T>(what: Stored, run: () => Promise<T>): Promise<T> {
  const result = queues[what].then(run, run);
  queues[what] = result.catch(() => undefined);
  return result;
}

/**
 * Runs a save (a transaction resolving to the revision it wrote) in turn, and
 * keeps that revision once it has committed. If another tab saved first, tells
 * the listeners so this tab reads its data.
 */
async function save(what: Stored, write: () => Promise<number>): Promise<void> {
  try {
    const revision = await tracked(inTurn(what, write));
    revisions[what] = revision;
    announce(what, revision);
  } catch (error) {
    if (error instanceof SavedElsewhere) newer(what);
    throw error;
  }
}

// Boards saved before imports were checked can hold words that aren't text,
// which would stop the board showing, so they're cleaned up as they're read.
const upgrade = (set: BoardSet): BoardSet =>
  cleanBoardSet({ ...set, boards: set.boards.map(renameOldFields) });

/** Whether the saved boards have been read, so saving is allowed. */
export const boardsRead = () => revisions.boards !== null;

export async function loadBoards(): Promise<BoardSet | undefined> {
  return inTurn('boards', async () => {
    const stored = await db.sets.get(CURRENT);
    const set = stored && upgrade(stored.set);
    // Only once they've been read in full: boards that can't be shown mustn't
    // let the starter boards on screen be saved over them.
    revisions.boards = stored?.revision ?? 0;
    return set;
  });
}

/** The boards from before the last import, start over or restore, if there are any. */
export async function loadPreviousBoards(): Promise<BoardSet | undefined> {
  const stored = await db.sets.get(PREVIOUS);
  return stored && upgrade(stored.set);
}

/**
 * Saves the boards. `replacing` (an import, start over or restore) keeps the
 * boards being replaced as the previous set, so they can be put back; edits
 * have Undo instead, and keeping a copy before each one would leave the
 * previous set only one edit old. Refuses (throwing NotReadYet or
 * SavedElsewhere) rather than overwrite boards this tab hasn't read.
 *
 * `unread` is for an adult who has confirmed replacing every board after the
 * saved ones couldn't be read: it saves even though they haven't been. What
 * couldn't be read isn't kept as the previous set (it would push out a copy
 * that can be put back).
 */
export async function saveBoards(
  set: BoardSet,
  { replacing = false, unread = false }: { replacing?: boolean; unread?: boolean } = {},
): Promise<void> {
  await save('boards', () =>
    db.transaction('rw', db.sets, db.meta, async () => {
      const overUnread = unread && revisions.boards === null;
      const stored = overUnread
        ? await db.sets.get(CURRENT).catch(() => undefined)
        : await db.sets.get(CURRENT);
      const revision = overUnread
        ? (typeof stored?.revision === 'number' ? stored.revision : 0) + 1
        : checkRevision('boards', stored?.revision);
      const savedAt = Date.now();
      if (replacing && stored && !overUnread) {
        await db.sets.put({ key: PREVIOUS, set: stored.set, savedAt: stored.savedAt });
        await db.meta.put({ key: 'previousAt', value: savedAt });
      }
      await db.sets.put({ key: CURRENT, set, savedAt, revision });
      return revision;
    }),
  );
}

/** When the boards were last saved and last backed up (ms since 1970), if ever. */
export async function loadBackupTimes(): Promise<{
  savedAt: number | null;
  backedUpAt: number | null;
  /** When the previous boards were replaced (by an import, start over or restore). */
  previousAt: number | null;
}> {
  const [set, backedUp, previous] = await Promise.all([
    db.sets.get(CURRENT),
    db.meta.get('backedUpAt'),
    db.meta.get('previousAt'),
  ]);
  return {
    savedAt: set?.savedAt ?? null,
    backedUpAt: backedUp?.value ?? null,
    previousAt: previous?.value ?? null,
  };
}

export async function saveBackupTime(at: number): Promise<void> {
  await tracked(db.meta.put({ key: 'backedUpAt', value: at }));
}

export async function loadSettings(): Promise<Settings> {
  return inTurn('settings', async () => {
    const stored = await db.settings.get(CURRENT);
    const settings = withDefaults(stored?.settings);
    revisions.settings = stored?.revision ?? 0;
    storedSettings = JSON.stringify(settings);
    return settings;
  });
}

/**
 * Saves the settings, unless they're the ones last read or saved (so settings
 * read from another tab's save aren't saved straight back). Refuses, like
 * saveBoards, before a read has worked or when another tab saved newer ones.
 */
export async function saveSettings(settings: Settings): Promise<void> {
  const json = JSON.stringify(settings);
  if (revisions.settings !== null && json === storedSettings) return;
  // Straight away, so changing a setting and changing it back saves both.
  storedSettings = json;
  try {
    await save('settings', () =>
      db.transaction('rw', db.settings, async () => {
        const stored = await db.settings.get(CURRENT);
        const revision = checkRevision('settings', stored?.revision);
        await db.settings.put({ key: CURRENT, settings, revision });
        return revision;
      }),
    );
  } catch (error) {
    storedSettings = '';
    throw error;
  }
}

export async function loadAudio(key: string): Promise<StoredAudio | undefined> {
  return db.audio.get(key);
}

export async function saveAudio(audio: StoredAudio): Promise<void> {
  await tracked(db.audio.put(audio));
}

export async function deleteAudioForVoice(voice: string): Promise<void> {
  await tracked(db.audio.where('voice').equals(voice).delete());
}

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (await navigator.storage?.persisted?.()) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
