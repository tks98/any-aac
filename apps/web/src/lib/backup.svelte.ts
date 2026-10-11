/**
 * Backups: one .obz file with every board, picture and setting. It's a normal
 * board package, so other AAC apps can open the boards; the settings ride
 * along in a file of their own that those apps ignore.
 */
import { EXT_PLACEHOLDER, writeObz, type BoardSet, type Issue } from '@open-aac/core';
import { download, readBoardFile, today } from './files';
import { withDefaults, type Settings } from './settings';
import { saveBackupTime } from './storage';

export const SETTINGS_FILE = 'open-aac/settings.json';
const FORMAT = 'open-aac-settings-1';

/** Remind after a week of changes that haven't been backed up. */
const REMIND_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

class Backups {
  /** When the boards were last saved on this device, and last backed up. */
  savedAt = $state<number | null>(null);
  backedUpAt = $state<number | null>(null);

  /** True when someone has changed the boards and hasn't backed them up for a while. */
  due(set: BoardSet | null, now = Date.now()): boolean {
    const changed = set?.boards.some((board) => board[EXT_PLACEHOLDER] !== true) ?? false;
    if (!changed || this.savedAt === null) return false;
    if (this.backedUpAt === null) return true;
    return this.savedAt > this.backedUpAt && now - this.backedUpAt > REMIND_AFTER_MS;
  }

  /** Downloads a backup of the boards and settings. */
  async backUp(set: BoardSet, settings: Settings) {
    const json = JSON.stringify({ format: FORMAT, settings }, null, 2);
    const bytes = writeObz(set, { [SETTINGS_FILE]: new TextEncoder().encode(json) });
    download(bytes, `open-aac-backup-${today()}.obz`);
    const now = Date.now();
    this.backedUpAt = now;
    await saveBackupTime(now).catch(() => undefined);
  }
}

export const backups = new Backups();

/** Downloads the boards alone, for sharing with someone else or another app. */
export function exportBoards(set: BoardSet) {
  download(writeObz(set), `open-aac-boards-${today()}.obz`);
}

/** Reads boards from a file; a backup made here also gives back its settings. */
export async function readBackup(
  file: Blob,
): Promise<{ set: BoardSet; issues: Issue[]; settings?: Settings }> {
  const { set, issues } = await readBoardFile(file);
  const bytes = set.files[SETTINGS_FILE];
  if (!bytes) return { set, issues };
  const files = { ...set.files };
  delete files[SETTINGS_FILE];
  let settings: Settings | undefined;
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof parsed === 'object' && parsed !== null && 'settings' in parsed) {
      settings = withDefaults(parsed.settings);
    }
  } catch {
    issues.push({ message: 'The settings in this backup could not be read; the boards are fine.' });
  }
  return { set: { ...set, files }, issues, ...(settings ? { settings } : {}) };
}
