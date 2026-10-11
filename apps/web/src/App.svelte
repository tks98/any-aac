<script lang="ts">
  import { applyPronunciations, behaviorOf, spokenText, type ObfBoard } from '@open-aac/core';
  import { onMount, untrack } from 'svelte';
  import BoardGrid from './lib/components/BoardGrid.svelte';
  import EditMode from './lib/components/EditMode.svelte';
  import MessageBar from './lib/components/MessageBar.svelte';
  import NavRail from './lib/components/NavRail.svelte';
  import PrintView from './lib/components/PrintView.svelte';
  import SettingsPanel from './lib/components/SettingsPanel.svelte';
  import { editor } from './lib/editor.svelte';
  import { install } from './lib/install.svelte';
  import { isOutdatedStarter, starterSet } from './lib/starter';
  import { app } from './lib/state.svelte';
  import { backups } from './lib/backup.svelte';
  import {
    loadBackupTimes,
    loadBoards,
    loadSettings,
    requestPersistentStorage,
    saveBoards,
    saveSettings,
  } from './lib/storage';
  import { phrase } from './lib/phrases';
  import { voiceById } from './lib/voice/catalog';
  import { openaacVoice } from './lib/voice/voice.svelte';

  /** Must match the phone breakpoint in the components' CSS. */
  const PHONE = '(max-width: 599px)';

  let settingsOpen = $state(false);
  let printing = $state.raw<ObfBoard[] | null>(null);
  let notSaved = $state(false);
  let settingsLoaded = $state(false);

  $effect(() => {
    const query = matchMedia(PHONE);
    const update = () => (app.compact = query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  });

  // Screen readers read the buttons and menus in this language.
  $effect(() => {
    document.documentElement.lang = app.appLanguage;
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
    saveSettings(settings).catch(() => (notSaved = true));
  });

  // Start the chosen Open AAC voice from the files on this device. This never
  // downloads: downloading only happens when someone asks for it in Settings.
  $effect(() => {
    const engine = app.settings.speech.engine;
    const id = app.openaacVoiceId;
    if (!settingsLoaded || engine !== 'openaac') return;
    const voice = voiceById(id);
    if (!voice || openaacVoice.voiceId === id) return;
    void openaacVoice.use(voice, { download: false });
  });

  // Once the voice is ready, render every word's audio in the background
  // (current board first) so taps play instantly.
  $effect(() => {
    const set = app.set;
    const { engine, rate } = app.settings.speech;
    const lang = app.language;
    if (!set || engine !== 'openaac' || !openaacVoice.isReady(app.openaacVoiceId)) return;
    const first = untrack(() => app.view?.buttons ?? []);
    const pronunciations = app.settings.speech.pronunciations;
    const texts = [...first, ...set.boards.flatMap((board) => board.buttons)]
      .filter((button) => behaviorOf(button).kind === 'word')
      .map((button) => applyPronunciations(spokenText(button, lang), pronunciations));
    // Wait for the rate slider to settle before rendering everything again.
    const timer = setTimeout(
      () =>
        void openaacVoice.prepare(
          [applyPronunciations(phrase('help', lang), pronunciations), ...texts],
          rate,
        ),
      600,
    );
    return () => clearTimeout(timer);
  });

  onMount(async () => {
    install.listen();
    void requestPersistentStorage();
    void openaacVoice.refreshDownloaded();
    // Browsers only let audio start from a tap; keep the voice's audio awake.
    const wake = () => {
      if (app.settings.speech.engine === 'openaac') openaacVoice.engine.unlock();
    };
    addEventListener('pointerup', wake, { capture: true });
    addEventListener('keydown', wake, { capture: true });
    try {
      app.settings = await loadSettings();
    } catch {
      // Defaults are fine; the save effect will report if storage is unavailable.
    }
    settingsLoaded = true;
    try {
      const saved = await loadBoards();
      if (saved && !isOutdatedStarter(saved)) {
        app.load(saved);
      } else {
        const starter = await starterSet();
        app.load(starter);
        await saveBoards(starter);
      }
      Object.assign(backups, await loadBackupTimes());
    } catch {
      // Storage can be unavailable (private browsing, blocked site data).
      // Speaking must still work, so carry on with the starter boards in memory.
      if (!app.set) app.load(await starterSet());
      notSaved = true;
    }
  });
</script>

<div class="screen">
  {#if editor.active}
    <EditMode onsettings={() => (settingsOpen = true)} onprint={(boards) => (printing = boards)} />
  {:else}
    <div class="app">
      <MessageBar />
      <div class="body">
        <NavRail onunlock={() => editor.open()} />
        <main>
          <p class="trail">
            {app.trail.join('  ›  ')}
            {#if notSaved}<span class="warning">· {app.t.notSaved}</span>{/if}
          </p>
          {#if app.view}
            <BoardGrid board={app.view} />
          {/if}
        </main>
      </div>
    </div>
  {/if}

  <SettingsPanel bind:open={settingsOpen} />
</div>

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
