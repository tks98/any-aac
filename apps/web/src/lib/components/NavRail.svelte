<script lang="ts">
  import { ICONS } from '../icons';
  import { nativeName } from '../languages';
  import { app } from '../state.svelte';
  import Icon from './Icon.svelte';
  import WordForms from './WordForms.svelte';

  /** Editing sits behind a press-and-hold so a tap can't open it by accident. */
  const HOLD_MS = 1000;

  let { onunlock }: { onunlock: () => void } = $props();

  let holding = $state(false);
  let showingForms = $state(false);

  /** The other language of a bilingual communicator, which the switch button changes to. */
  const otherLanguage = $derived.by(() => {
    const { primary, second, usingSecond } = app.settings.language;
    if (!second) return null;
    return usingSecond ? (primary ?? app.boardsLanguage) : second;
  });
  let timer: ReturnType<typeof setTimeout> | undefined;

  function startHold() {
    if (holding) return;
    holding = true;
    timer = setTimeout(() => {
      holding = false;
      onunlock();
    }, HOLD_MS);
  }

  function cancelHold() {
    holding = false;
    clearTimeout(timer);
  }

  function onkeydown(event: KeyboardEvent) {
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
      event.preventDefault();
      startHold();
    }
  }
</script>

<nav class="rail" aria-label={app.t.boardNavigation}>
  <button class:current={app.atHome} onclick={() => app.home()}>
    <Icon path={ICONS.home} />
    {app.t.home}
  </button>
  <button disabled={app.history.length === 0} onclick={() => app.back()}>
    <Icon path={ICONS.back} />
    {app.t.back}
  </button>
  {#if otherLanguage}
    <button
      class="language"
      lang={otherLanguage}
      aria-label={app.t.switchLanguage(nativeName(otherLanguage))}
      onclick={() => app.switchLanguage()}
    >
      <Icon path={ICONS.language} />
      {nativeName(otherLanguage)}
    </button>
  {/if}
  {#if app.settings.display.showWordForms}
    <button aria-label={app.t.wordForms} onclick={() => (showingForms = true)}>
      <Icon path={ICONS.forms} />
      {app.t.forms}
    </button>
  {/if}
  {#if app.settings.display.showPhrases}
    <button
      class:current={app.view !== null && app.view === app.phrases}
      onclick={() => app.openPhrases()}
    >
      <Icon path={ICONS.phrases} />
      {app.t.phrases}
    </button>
  {/if}
  <span class="spacer"></span>
  <button class="help" onclick={() => app.askForHelp()}>
    <Icon path={ICONS.help} />
    {app.t.help}
  </button>
  <button
    class="edit"
    class:holding
    style:--hold-ms="{HOLD_MS}ms"
    aria-label={app.t.editHold}
    onpointerdown={startHold}
    onpointerup={cancelHold}
    onpointerleave={cancelHold}
    onpointercancel={cancelHold}
    {onkeydown}
    onkeyup={cancelHold}
    oncontextmenu={(event) => event.preventDefault()}
  >
    <span class="progress" aria-hidden="true"></span>
    <Icon path={ICONS.lock} size={28} />
    {app.t.edit}
  </button>
</nav>

{#if showingForms}
  <WordForms onclose={() => (showingForms = false)} />
{/if}

<style>
  .rail {
    width: 104px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: var(--gap);
  }

  button {
    position: relative;
    overflow: hidden;
    height: clamp(64px, 11vh, 92px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0;
    border-radius: var(--radius);
    border: 2px solid var(--line);
    background: var(--surface);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    touch-action: manipulation;
  }

  button:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }

  button:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .current {
    border: 3px solid var(--accent);
  }

  .spacer {
    flex: 1;
  }

  .help {
    border: 3px solid var(--help);
    color: var(--help);
    font-weight: 800;
  }

  .edit {
    color: var(--muted);
  }

  .progress {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 0;
    height: 6px;
    background: var(--accent);
  }

  .holding .progress {
    width: 100%;
    transition: width var(--hold-ms) linear;
  }

  @media (max-width: 599px) {
    .rail {
      width: auto;
      flex-direction: row;
    }

    button {
      flex: 1;
      height: 68px;
      gap: 3px;
      font-size: 0.8rem;
    }

    .spacer {
      display: none;
    }
  }
</style>
