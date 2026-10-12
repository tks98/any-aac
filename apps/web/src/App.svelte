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
  import { editor } from './lib/editor.svelte';
  import { install } from './lib/install.svelte';
  import { defaultStarter, isOutdatedStarter, starterOf, starterSet } from './lib/starter';
  import { app } from './lib/state.svelte';
  import { backups } from './lib/backup.svelte';
  import {
    deleteAudioForVoice,
    loadBackupTimes,
    loadBoards,
    loadSettings,
    requestPersistentStorage,
    saveBoards,
    saveSettings,
  } from './lib/storage';
  import { phrase } from './lib/phrases';
  import { tidyVoiceFiles, voiceById } from './lib/voice/catalog';
  import { appVoice } from './lib/voice/voice.svelte';

  /** Must match the phone breakpoint in the components' CSS. */
  const PHONE = '(max-width: 599px)';

  let settingsOpen = $state(false);
  let printing = $state.raw<ObfBoard[] | null>(null);
  let notSaved = $state(false);
  let settingsLoaded = $state(false);

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
    saveSettings(settings).catch(() => (notSaved = true));
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
      // Defaults are fine; the save effect will report if storage is unavailable.
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
    try {
      const saved = await loadBoards();
      if (saved && !isOutdatedStarter(saved)) {
        app.load(saved);
      } else {
        // A first launch gets the vocabulary for the device's language; an
        // update keeps the vocabulary the boards came from.
        const starter = await starterSet(saved ? starterOf(saved) : defaultStarter());
        app.load(starter);
        await saveBoards(starter);
      }
      Object.assign(backups, await loadBackupTimes());
    } catch {
      // Storage can be unavailable (private browsing, blocked site data).
      // Speaking must still work, so carry on with the starter boards in memory.
      if (!app.set) app.load(await starterSet(defaultStarter()));
      notSaved = true;
    }
  });
</script>

<div class="screen">
  {#if editor.active}
    <EditMode onsettings={() => (settingsOpen = true)} onprint={(boards) => (printing = boards)} />
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
