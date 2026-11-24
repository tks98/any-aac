<script lang="ts">
  import { applyPronunciations, behaviorOf, spokenText, type ObfBoard } from '@any-aac/core';
  import { onMount, untrack } from 'svelte';
  import BoardGrid from './lib/components/BoardGrid.svelte';
  import EditMode from './lib/components/EditMode.svelte';
  import ModelingMode from './lib/components/ModelingMode.svelte';
  import { modeling } from './lib/modeling.svelte';
  import MessageBar from './lib/components/MessageBar.svelte';
  import NavRail from './lib/components/NavRail.svelte';
  import PrintView from './lib/components/PrintView.svelte';
  import ScanLayer from './lib/components/ScanLayer.svelte';
  import { scanning } from './lib/access/scanning.svelte';
  import { listenForSwitches } from './lib/access/switches';
  import SettingsPanel from './lib/components/SettingsPanel.svelte';
  import SetupGuide from './lib/components/SetupGuide.svelte';
  import { guide } from './lib/guide.svelte';
  import { hasLinkedPictures, localizeLinkedPictures } from './lib/linked-pictures';
  import { editor } from './lib/editor.svelte';
  import { install } from './lib/install.svelte';
  import { updates } from './lib/updates.svelte';
  import { defaultStarter, isOutdatedStarter, sizeOf, starterOf, starterSet } from './lib/starter';
  import { app } from './lib/state.svelte';
  import { backups } from './lib/backup.svelte';
  import {
    deleteAudioForVoice,
    loadBackupTimes,
    loadBoards,
    loadSettings,
    onSavedElsewhere,
    requestPersistentStorage,
    saveBoards,
    SavedElsewhere,
    saveSettings,
  } from './lib/storage';
  import { phrase } from './lib/phrases';
  import { tidyVoiceFiles, voiceById } from './lib/voice/catalog';
  import { preloadBundled } from './lib/voice/bundled';
  import { appVoice } from './lib/voice/voice.svelte';

  /** Must match the phone breakpoint in the components' CSS. */
  const PHONE = '(max-width: 599px)';

  let settingsOpen = $state(false);
  let printing = $state.raw<ObfBoard[] | null>(null);
  let notSaved = $state(false);
  /** Shown in Settings, e.g. when another tab's newer settings replaced a change made here. */
  let settingsNotice = $state('');
  let settingsLoaded = $state(false);
  /** The saved settings couldn't be read, so the defaults are in use and nothing is saved. */
  let settingsUnreadable = false;

  $effect(() => {
    const query = matchMedia(PHONE);
    const phoneLayouts = app.settings.display.phoneLayouts;
    const update = () => (app.compact = phoneLayouts && query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  });

  // Screen readers read the buttons and menus in this language.
  $effect(() => {
    document.documentElement.lang = app.appLanguage;
  });

  // Switch scanning follows the screen: a new board, a dialog, changed settings.
  $effect(() => {
    void app.view;
    void $state.snapshot(app.settings.scan);
    void app.settings.display.showWordForms;
    void app.settings.display.showPhrases;
    void scanning.active;
    requestAnimationFrame(() => scanning.refresh());
  });

  $effect(() => {
    if (!scanning.active) return;
    const stop = listenForSwitches();
    // Dialogs opening and closing, and other changes made outside Svelte state.
    let pending = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => scanning.refresh());
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['open', 'disabled'],
    });
    return () => {
      stop();
      observer.disconnect();
      scanning.stop();
    };
  });

  // The theme and label size apply to everything, dialogs included.
  $effect(() => {
    const { theme, labelScale } = app.settings.display;
    const root = document.documentElement;
    if (theme === 'light') delete root.dataset.theme;
    else root.dataset.theme = theme;
    root.style.setProperty('--label-scale', String(labelScale));
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', getComputedStyle(root).getPropertyValue('--ground').trim());
  });

  // Save settings whenever they change, once the saved ones have been read.
  $effect(() => {
    const settings = $state.snapshot(app.settings);
    if (!settingsLoaded) return;
    saveSettings(settings).catch((error: unknown) => {
      if (!(error instanceof SavedElsewhere)) {
        notSaved = true;
        return;
      }
      // Settings saved in another tab are read in instead; say so where the
      // change was made, so it doesn't just quietly undo itself.
      if (settingsOpen) settingsNotice = app.t.settingsSavedElsewhere;
      else if (editor.active) editor.notice = app.t.settingsSavedElsewhere;
    });
  });

  // Start the app voice for the language in use. If it isn't on this device,
  // it downloads in the background (unless that's turned off in Settings);
  // until it's ready, bundled starter words and then the device voice speak.
  $effect(() => {
    const { engine, autoDownload } = app.settings.speech;
    const id = app.appVoiceId;
    if (!settingsLoaded || engine !== 'app') return;
    const voice = voiceById(id);
    if (!voice || appVoice.voiceId === id) return;
    void appVoice.use(voice, { download: autoDownload });
  });

  // Load the bundled starter clips for the voice in use, so the first tap
  // speaks at once even before the voice itself is ready.
  $effect(() => {
    if (app.settings.speech.engine === 'app') preloadBundled(app.appVoiceId);
  });

  // Once the voice is ready, render every word's audio in the background
  // (current board first) so taps play instantly.
  $effect(() => {
    const set = app.set;
    const { engine, rate } = app.settings.speech;
    const lang = app.language;
    if (!set || engine !== 'app' || !appVoice.isReady(app.appVoiceId)) return;
    const first = untrack(() => app.view?.buttons ?? []);
    const pronunciations = app.settings.speech.pronunciations;
    const texts = [...first, ...set.boards.flatMap((board) => board.buttons)]
      .filter((button) => behaviorOf(button).kind === 'word')
      .map((button) => applyPronunciations(spokenText(button, lang), pronunciations));
    // Wait for the rate slider to settle before rendering everything again.
    const timer = setTimeout(
      () =>
        void appVoice.prepare(
          [applyPronunciations(phrase('help', lang), pronunciations), ...texts],
          rate,
        ),
      600,
    );
    return () => clearTimeout(timer);
  });

  onMount(async () => {
    install.listen();
    // A new version is installed only when it can't interrupt: nothing in the
    // message, and nothing being edited, set up or printed.
    updates.start(
      () =>
        app.message.length === 0 &&
        !editor.active &&
        !settingsOpen &&
        printing === null &&
        !guide.open,
    );
    void requestPersistentStorage();
    void appVoice.refreshDownloaded();
    // Browsers only let audio start from a tap, and iOS only from a tap's
    // touchend or click (not pointerdown or pointerup); keep the voice's audio awake.
    const wake = () => {
      if (app.settings.speech.engine === 'app') appVoice.engine.unlock();
    };
    for (const type of ['pointerup', 'touchend', 'click', 'keydown']) {
      addEventListener(type, wake, { capture: true, passive: true });
    }
    try {
      app.settings = await loadSettings();
    } catch {
      // Defaults are fine for now. They aren't saved over the real settings
      // (see storage.ts); reading is tried again with the boards.
      settingsUnreadable = true;
    }
    // Voices withdrawn (e.g. for their licence) give way to the device voice,
    // and their files and prepared audio are deleted.
    for (const [lang, id] of Object.entries(app.settings.speech.appVoices)) {
      if (id !== '' && !voiceById(id)) delete app.settings.speech.appVoices[lang];
    }
    void tidyVoiceFiles().then((ids) =>
      Promise.all(ids.map((id) => deleteAudioForVoice(id).catch(() => undefined))),
    );
    settingsLoaded = true;
    onSavedElsewhere((what) => void (what === 'boards' ? readBoardsAgain() : readSettingsAgain()));
    addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void tryReadingAgain();
    });
    try {
      await readBoards();
    } catch {
      // Storage can be unavailable (private browsing, blocked site data), or
      // fail for a moment. Speaking must still work, so carry on with the
      // starter boards in memory. Nothing is saved until the saved boards can
      // be read, or the starter boards would replace them.
      if (!app.set) app.load(await starterSet(defaultStarter()));
      app.boardsUnreadable = true;
      notSaved = true;
    }
  });

  /**
   * Reads the saved boards at startup, or shows the starter boards on a first
   * launch. Throws only when the saved boards can't be read; a save that fails
   * afterwards shows "Not saved" instead, as edits do.
   */
  async function readBoards({ retry = false } = {}) {
    const saved = await loadBoards();
    // Replaced on purpose (an import, say) while this read was under way.
    if (retry && !app.boardsUnreadable) return;
    if (saved && !isOutdatedStarter(saved)) {
      if (app.set) app.reload(saved);
      else app.load(saved);
      // Boards imported before linked Mulberry symbols were copied in.
      if (hasLinkedPictures(saved)) {
        void localizeLinkedPictures(saved).then(async ({ set, fromLibrary }) => {
          if (fromLibrary === 0 || app.set !== saved) return;
          app.replaceSet(set);
          await saveBoards(set).catch(() => undefined);
        });
      }
    } else {
      // A first launch gets the vocabulary for the device's language; an
      // update keeps the vocabulary the boards came from.
      const starter = await starterSet(
        saved ? starterOf(saved) : defaultStarter(),
        saved ? sizeOf(saved) : 'medium',
      );
      if (app.set) app.reload(starter);
      else app.load(starter);
      if (!saved) guide.firstLaunch();
      // Not `replacing`: nobody edited these boards, and keeping them as the
      // previous set would push out boards an adult replaced (by starting
      // over, say) and may want back.
      await saveBoards(starter).catch((error: unknown) => {
        // Boards another tab saved meanwhile are read in instead.
        if (!(error instanceof SavedElsewhere)) notSaved = true;
      });
    }
    await readBackupTimes();
  }

  /** When the boards were saved and backed up, for Settings; not knowing isn't a reason to stop. */
  async function readBackupTimes() {
    try {
      Object.assign(backups, await loadBackupTimes());
    } catch {
      // Settings shows the boards as never backed up until they can be read.
    }
  }

  let retrying = false;

  /** After a failed read: tries again (when the app is shown again, or the adult asks). */
  async function tryReadingAgain() {
    if (settingsUnreadable) await readSettingsAgain();
    // Boards that were read (or replaced on purpose since) are never read over.
    if (!app.boardsUnreadable || retrying) return;
    retrying = true;
    try {
      await readBoards({ retry: true });
      app.boardsUnreadable = false;
      notSaved = false;
    } catch {
      // Still unreadable; the message stays up.
    } finally {
      retrying = false;
    }
  }

  /** The adult replaced the boards that couldn't be read (an import, say), and they saved. */
  function replacedUnreadable() {
    app.boardsUnreadable = false;
    notSaved = false;
  }

  /** Another tab saved the boards: show its version rather than save over it. */
  async function readBoardsAgain() {
    try {
      const saved = await loadBoards();
      if (saved) app.reload(saved);
    } catch {
      // Saving stays refused until this tab has read the newer boards.
      return;
    }
    await readBackupTimes();
  }

  async function readSettingsAgain() {
    try {
      app.settings = await loadSettings();
      settingsUnreadable = false;
    } catch {
      // Keep the settings in use.
    }
  }
</script>

<div class="screen">
  {#if editor.active}
    <div class="editing">
      {#if app.boardsUnreadable}
        <div class="unreadable" role="alert">
          <p>{app.t.boardsUnreadable}</p>
          <button onclick={() => void tryReadingAgain()}>{app.t.tryAgain}</button>
        </div>
      {/if}
      <div class="fill">
        <!-- A board the editor can't show mustn't take Settings with it:
             Settings is where boards are imported, restored or started over. -->
        <svelte:boundary
          onerror={(error) => console.error('The editor could not be shown.', error)}
        >
          <EditMode
            onsettings={() => (settingsOpen = true)}
            onprint={(boards) => (printing = boards)}
          />
          {#snippet failed()}
            <div class="unreadable" role="alert">
              <p>{app.t.editorBroken}</p>
              <button onclick={() => (settingsOpen = true)}>{app.t.settings}</button>
              <button onclick={() => editor.close()}>{app.t.done}</button>
            </div>
          {/snippet}
        </svelte:boundary>
      </div>
    </div>
  {:else if modeling.active}
    <ModelingMode />
  {:else}
    <div class="app">
      <MessageBar />
      <div class="body">
        <NavRail onunlock={() => editor.open()} />
        <main>
          <p class="trail">
            {app.trail.join('  ›  ')}
            {#if app.boardsUnreadable}
              <span class="warning">· {app.t.boardsUnreadableShort}</span>
            {:else if notSaved}<span class="warning">· {app.t.notSaved}</span>{/if}
          </p>
          {#if app.view}
            <BoardGrid board={app.view} />
          {/if}
        </main>
      </div>
    </div>
  {/if}

  <SettingsPanel
    bind:open={settingsOpen}
    bind:notice={settingsNotice}
    onretry={tryReadingAgain}
    onreplaced={replacedUnreadable}
  />
  {#if guide.open}<SetupGuide />{/if}
</div>

<ScanLayer />

{#if printing}
  <PrintView boards={printing} ondone={() => (printing = null)} />
{/if}

<style>
  /* Everything on screen; printing swaps it for the print view. */
  .screen {
    display: contents;
  }

  .app {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    padding: max(var(--gap), env(safe-area-inset-top)) max(var(--gap), env(safe-area-inset-right))
      max(var(--gap), env(safe-area-inset-bottom)) max(var(--gap), env(safe-area-inset-left));
  }

  .body {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: var(--gap);
  }

  main {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .trail {
    margin: 0;
    min-height: 1.4rem;
    padding-left: 4px;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--muted);
    white-space: pre;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .warning {
    color: var(--help);
  }

  /* Edit mode, with room above it for the message when the boards can't be read. */
  .editing {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .fill {
    flex: 1;
    min-height: 0;
  }

  .unreadable {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    margin: max(var(--gap), env(safe-area-inset-top)) max(var(--gap), env(safe-area-inset-right)) 0
      max(var(--gap), env(safe-area-inset-left));
    padding: 12px 16px;
    border: 2px solid var(--help);
    border-radius: var(--radius);
    background: var(--surface);
    font-weight: 700;
  }

  .unreadable p {
    flex: 1 1 20rem;
    margin: 0;
  }

  .unreadable button {
    min-height: 48px;
    padding: 0 20px;
    border: 2px solid var(--accent);
    border-radius: var(--radius);
    background: var(--accent);
    color: var(--accent-ink);
    font: inherit;
    cursor: pointer;
  }

  .unreadable button:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }

  @media (max-width: 599px) {
    .body {
      flex-direction: column;
    }

    /* Board above the nav bar. Using order, not column-reverse, means any
       overflow runs down off the screen rather than up over the message bar. */
    main {
      order: -1;
    }

    /* Height is scarce on a phone; Back and the board itself show where you are. */
    .trail {
      display: none;
    }
  }
</style>
