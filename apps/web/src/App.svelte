<script lang="ts">
  import { onMount } from 'svelte';
  import BoardGrid from './lib/components/BoardGrid.svelte';
  import MessageBar from './lib/components/MessageBar.svelte';
  import NavRail from './lib/components/NavRail.svelte';
  import SettingsPanel from './lib/components/SettingsPanel.svelte';
  import { isUntouchedStarter, starterSet } from './lib/starter';
  import { app } from './lib/state.svelte';
  import {
    loadBoards,
    loadSettings,
    requestPersistentStorage,
    saveBoards,
    saveSettings,
  } from './lib/storage';

  /** Must match the phone breakpoint in the components' CSS. */
  const PHONE = '(max-width: 599px)';

  let settingsOpen = $state(false);
  let notSaved = $state(false);
  let settingsLoaded = $state(false);

  $effect(() => {
    const query = matchMedia(PHONE);
    const update = () => (app.compact = query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  });

  // Save settings whenever they change, once the saved ones have been read.
  $effect(() => {
    const settings = $state.snapshot(app.settings);
    if (!settingsLoaded) return;
    saveSettings(settings).catch(() => (notSaved = true));
  });

  onMount(async () => {
    void requestPersistentStorage();
    try {
      app.settings = await loadSettings();
    } catch {
      // Defaults are fine; the save effect will report if storage is unavailable.
    }
    settingsLoaded = true;
    try {
      const saved = await loadBoards();
      if (saved && !isUntouchedStarter(saved)) {
        app.load(saved);
      } else {
        const starter = starterSet();
        app.load(starter);
        await saveBoards(starter);
      }
    } catch {
      // Storage can be unavailable (private browsing, blocked site data).
      // Speaking must still work, so carry on with the starter boards in memory.
      if (!app.set) app.load(starterSet());
      notSaved = true;
    }
  });
</script>

<div class="app">
  <MessageBar />
  <div class="body">
    <NavRail onunlock={() => (settingsOpen = true)} />
    <main>
      <p class="trail">
        {app.trail.join('  ›  ')}
        {#if notSaved}<span class="warning">· Not saved on this device</span>{/if}
      </p>
      {#if app.view}
        <BoardGrid board={app.view} />
      {/if}
    </main>
  </div>
</div>

<SettingsPanel bind:open={settingsOpen} />

<style>
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
