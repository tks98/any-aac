/**
 * The app voice as app state: which voices are downloaded, download and
 * load progress, and preparing every button's audio in the background.
 */
import { deleteVoiceFiles, isDownloaded, VOICES, type VoiceEntry } from './catalog';
import { VoiceEngine } from './engine';

type Status = 'off' | 'downloading' | 'loading' | 'ready' | 'error';

class AppVoice {
  readonly engine = new VoiceEngine();

  /** What's happening with `voiceId`. */
  status = $state<Status>('off');
  voiceId = $state<string | null>(null);
  progress = $state({ loaded: 0, total: 0 });
  error = $state('');
  downloaded = $state<Record<string, boolean>>({});
  preparing = $state({ done: 0, total: 0 });

  private prepareRun = 0;

  isReady(id: string | null) {
    return id !== null && this.status === 'ready' && this.voiceId === id;
  }

  async refreshDownloaded() {
    const entries = await Promise.all(
      VOICES.map(async (v) => [v.id, await isDownloaded(v).catch(() => false)] as const),
    );
    this.downloaded = Object.fromEntries(entries);
  }

  /**
   * Starts a voice. With `download: false` it only uses files already on the
   * device, so opening the app never starts a 60 MB download by itself.
   */
  async use(voice: VoiceEntry, { download }: { download: boolean }): Promise<boolean> {
    if (this.isReady(voice.id)) return true;
    if (!download && !(await isDownloaded(voice).catch(() => false))) {
      this.voiceId = voice.id;
      this.status = 'off';
      return false;
    }
    this.voiceId = voice.id;
    this.error = '';
    this.status = 'loading';
    this.progress = { loaded: 0, total: 0 };
    try {
      await this.engine.load(voice, (loaded, total) => {
        if (this.voiceId !== voice.id) return;
        this.status = 'downloading';
        this.progress = { loaded, total };
      });
      this.downloaded = { ...this.downloaded, [voice.id]: true };
      if (this.voiceId !== voice.id) return false;
      this.status = 'ready';
      return true;
    } catch (error) {
      if (this.voiceId === voice.id) {
        this.status = 'error';
        this.error = error instanceof Error ? error.message : String(error);
      }
      return false;
    }
  }

  async remove(voice: VoiceEntry) {
    if (this.voiceId === voice.id) {
      this.voiceId = null;
      this.status = 'off';
      this.prepareRun++;
    }
    await this.engine.forget(voice);
    await deleteVoiceFiles(voice);
    this.downloaded = { ...this.downloaded, [voice.id]: false };
  }

  /**
   * Renders and stores audio for every phrase in the background, one at a time
   * so a tap never waits behind more than one phrase. A newer call cancels this one.
   */
  async prepare(texts: string[], rate: number) {
    const run = ++this.prepareRun;
    const unique = [...new Set(texts.filter((t) => t.trim() !== ''))];
    this.preparing = { done: 0, total: unique.length };
    for (const text of unique) {
      if (run !== this.prepareRun || this.status !== 'ready') return;
      try {
        await this.engine.render(text, rate);
      } catch {
        // Skip it; it will render when tapped.
      }
      if (run === this.prepareRun)
        this.preparing = { ...this.preparing, done: this.preparing.done + 1 };
    }
  }
}

export const appVoice = new AppVoice();
