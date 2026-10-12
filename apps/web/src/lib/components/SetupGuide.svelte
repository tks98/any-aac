<script lang="ts">
  import { onMount } from 'svelte';
  import { guide } from '../guide.svelte';
  import { ICONS } from '../icons';
  import { install } from '../install.svelte';
  import { isAppleMobile } from '../platform';
  import { app } from '../state.svelte';
  import { voiceById } from '../voice/catalog';
  import Icon from './Icon.svelte';

  const SETUP_GUIDE = 'https://github.com/tks98/any-aac/blob/main/docs/setup.md';
  /** The speech engine's download (ONNX Runtime and eSpeak, compressed), in MB. */
  const ENGINE_MB = 4.5;

  const t = $derived(app.t);
  let dialog: HTMLDialogElement;
  let primary: HTMLButtonElement;
  let step = $state(0);

  const steps = $derived([
    { title: t.guideBoardTitle, icon: ICONS.speak },
    { title: t.guideEditTitle, icon: ICONS.lock },
    { title: t.guideVoiceTitle, icon: ICONS.speak },
    { title: t.guideReadyTitle, icon: ICONS.export },
  ]);
  const last = $derived(step === steps.length - 1);

  /** The voice downloading by itself, if one is. */
  const voice = $derived(
    app.settings.speech.engine === 'app' && app.settings.speech.autoDownload
      ? voiceById(app.appVoiceId)
      : undefined,
  );

  onMount(() => {
    dialog.showModal();
    primary.focus();
  });

  function back() {
    step--;
    // Back disappears on the first step; keep the focus in the guide.
    if (step === 0) primary.focus();
  }
</script>

<dialog bind:this={dialog} aria-labelledby="guide-title" data-scan onclose={() => guide.close()}>
  <header>
    <div>
      <p class="kicker">
        {t.guideTitle} · <span class="nowrap">{t.guideStep(step + 1, steps.length)}</span>
      </p>
      <h2 id="guide-title">
        <Icon path={steps[step]!.icon} size={28} />
        {steps[step]!.title}
      </h2>
    </div>
    <button class="skip" onclick={() => dialog.close()}>{t.guideSkip}</button>
  </header>

  <div class="body" aria-live="polite">
    {#if step === 0}
      <p>{t.guideBoard}</p>
    {:else if step === 1}
      <p>{t.guideEdit}</p>
    {:else if step === 2}
      <p>
        {voice
          ? t.guideVoice(voice.name, Math.round(voice.sizeMB + ENGINE_MB))
          : t.guideVoiceChoose}
      </p>
      {#if isAppleMobile}<p>{t.guideVoiceIos}</p>{/if}
    {:else}
      {#if install.offer}
        <p>
          <strong>{t.installTitle}.</strong>
          {install.offer === 'ios' ? t.installIos : t.installHelp}
        </p>
        {#if install.offer === 'prompt'}
          <button class="secondary" onclick={() => install.install()}>{t.install}</button>
        {/if}
      {/if}
      <p>{t.guideReady}</p>
      <p><a href={SETUP_GUIDE} target="_blank" rel="noreferrer">{t.guideSetupLink}</a></p>
    {/if}
  </div>

  <footer>
    {#if step > 0}
      <button class="secondary" onclick={back}>{t.back}</button>
    {/if}
    <!-- One button for Next and Start, so the focus stays on it. -->
    <button bind:this={primary} class="primary" onclick={() => (last ? dialog.close() : step++)}>
      {last ? t.guideStart : t.guideNext}
    </button>
  </footer>
</dialog>

<style>
  dialog {
    width: min(620px, calc(100vw - 24px));
    max-width: none;
    max-height: calc(100dvh - 24px);
    /* Near the top, so it doesn't move as steps change length. */
    margin: max(12px, 12dvh) auto auto;
    padding: 0;
    border: none;
    border-radius: 16px;
    background: var(--surface);
    color: var(--ink);
  }

  dialog::backdrop {
    background: var(--backdrop);
  }

  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 18px 12px;
    border-bottom: 1px solid var(--divider);
  }

  .kicker {
    margin: 0 0 4px;
    color: var(--muted);
    font-weight: 700;
  }

  h2 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-size: 1.45rem;
  }

  .body {
    min-height: 9.5em;
    padding: 6px 18px;
  }

  .nowrap {
    white-space: nowrap;
  }

  p {
    margin: 12px 0;
    font-size: 1.15rem;
    line-height: 1.45;
  }

  a {
    color: var(--ink);
    font-weight: 700;
    text-decoration: underline;
  }

  footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 12px 18px 18px;
  }

  button {
    min-height: 48px;
    padding: 0 22px;
    border: 2px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    color: var(--ink);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-ink);
  }

  button:focus-visible,
  a:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
</style>
