<script lang="ts">
  import { boardName, buttonAt, linkableBoards, type ObfBoard } from '@any-aac/core';
  import { backups } from '../backup.svelte';
  import { install } from '../install.svelte';
  import { modeling } from '../modeling.svelte';
  import { silentMode } from '../silent-mode.svelte';
  import { speech } from '../speech';
  import { appVoice } from '../voice/voice.svelte';
  import { editor } from '../editor.svelte';
  import { ICONS } from '../icons';
  import { app } from '../state.svelte';
  import ButtonPanel from './ButtonPanel.svelte';
  import EditGrid from './EditGrid.svelte';
  import Icon from './Icon.svelte';

  let { onsettings, onprint }: { onsettings: () => void; onprint: (boards: ObfBoard[]) => void } =
    $props();

  let printDialog: HTMLDialogElement;
  const allBoards = $derived(app.set ? linkableBoards(app.set) : []);

  const backupDue = $derived(backups.due(app.set));
  /** No device speech (Firefox on Android) and no app voice: nothing can be said. */
  const mute = $derived(!speech.available && !appVoice.isReady(app.appVoiceId));
  /** On iPhone and iPad, the device voice is muted in silent mode; app voices aren't. */
  const silentModeRisk = $derived(
    silentMode.mutesDeviceVoice && !silentMode.dismissed && !appVoice.isReady(app.appVoiceId),
  );

  function backUpNow() {
    if (app.set) void backups.backUp(app.set, $state.snapshot(app.settings));
  }

  function printBoards(boards: ObfBoard[]) {
    printDialog.close();
    onprint(boards);
  }

  const t = $derived(app.t);
  const name = $derived(app.board ? boardName(app.board, app.language) : '');
  const status = $derived.by(() => {
    if (editor.notice) return editor.notice;
    if (!editor.swapping) return '';
    const from = editor.swapFrom && editor.board ? buttonAt(editor.board, editor.swapFrom) : null;
    return from ? t.swapNext(from.label ?? '') : t.swapHelp;
  });

  function onkeydown(event: KeyboardEvent) {
    const mod = event.metaKey || event.ctrlKey;
    if (!mod || event.key.toLowerCase() !== 'z') return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
      return;
    }
    event.preventDefault();
    if (event.shiftKey) editor.redo();
    else editor.undo();
  }
</script>

<svelte:window {onkeydown} />

<div class="edit">
  <header>
    <button class="done" onclick={() => editor.close()}>
      <Icon path={ICONS.done} size={24} />
      {t.done}
    </button>
    <div class="title">
      <h2>{t.editing(name)}</h2>
      <span class="saved" class:warning={editor.saveFailed}>
        {editor.saveFailed ? t.notSavedEdit : t.savesHere}
      </span>
      {#if mute}
        <span class="due warning">{t.appIsMute}</span>
      {:else if silentModeRisk}
        <span class="due warning">
          {t.silentModeNotice}
          <button class="link" onclick={onsettings}>{t.chooseVoice}</button>
          <button class="link" onclick={() => silentMode.dismiss()}>{t.notNow}</button>
        </span>
      {:else if backupDue}
        <span class="due">
          {t.backupDue}
          <button class="link" onclick={backUpNow}>{t.backUpNow}</button>
        </span>
      {:else if install.offer}
        <span class="due">
          {t.installTitle}. {install.offer === 'ios' ? t.installIos : t.installHelp}
          {#if install.offer === 'prompt'}
            <button class="link" onclick={() => install.install()}>{t.install}</button>
          {/if}
          <button class="link" onclick={() => install.dismiss()}>{t.notNow}</button>
        </span>
      {/if}
    </div>
    <div class="tools" role="toolbar" aria-label={t.editTools}>
      {#if app.history.length > 0}
        <button onclick={() => editor.back()}>
          <Icon path={ICONS.back} size={22} />
          {t.back}
        </button>
      {/if}
      <button aria-label={t.undo} disabled={!editor.canUndo} onclick={() => editor.undo()}>
        <Icon path={ICONS.undo} size={22} />
      </button>
      <button aria-label={t.redo} disabled={!editor.canRedo} onclick={() => editor.redo()}>
        <Icon path={ICONS.redo} size={22} />
      </button>
      <button aria-pressed={editor.swapping} onclick={() => editor.toggleSwap()}>
        <Icon path={ICONS.swap} size={22} />
        {t.swap}
      </button>
      <button
        aria-pressed={editor.showHidden}
        onclick={() => (editor.showHidden = !editor.showHidden)}
      >
        <Icon path={editor.showHidden ? ICONS.eye : ICONS.eyeOff} size={22} />
        {t.showHidden}
      </button>
      <button
        onclick={() => {
          editor.close();
          modeling.open();
        }}
      >
        <Icon path={ICONS.model} size={22} />
        {t.model}
      </button>
      <button onclick={() => printDialog.showModal()}>
        <Icon path={ICONS.print} size={22} />
        {t.print}
      </button>
      <button onclick={onsettings}>
        <Icon path={ICONS.settings} size={22} />
        {t.settings}
      </button>
    </div>
  </header>

  <p class="status" role="status">{status}</p>

  <div class="body">
    {#if editor.board}
      <EditGrid board={editor.board} />
    {/if}
    <ButtonPanel />
  </div>
</div>

<dialog bind:this={printDialog} class="print-choice" aria-labelledby="print-title">
  <h2 id="print-title">{t.printWhat}</h2>
  <div class="choices">
    <button onclick={() => editor.board && printBoards([editor.board])}>{t.printThisBoard}</button>
    <button onclick={() => printBoards(allBoards)}>{t.printAllBoards(allBoards.length)}</button>
  </div>
  <p>{t.printHelp}</p>
  <button class="cancel" onclick={() => printDialog.close()}>{t.cancel}</button>
</dialog>

<style>
  .edit {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: max(var(--gap), env(safe-area-inset-top)) max(var(--gap), env(safe-area-inset-right))
      max(var(--gap), env(safe-area-inset-bottom)) max(var(--gap), env(safe-area-inset-left));
  }

  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 14px;
  }

  .done {
    min-height: 52px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 22px;
    border: none;
    border-radius: 12px;
    background: var(--accent);
    color: var(--accent-ink);
    font-size: 1.1rem;
    font-weight: 800;
    cursor: pointer;
  }

  .title {
    flex: 1 1 200px;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  h2 {
    margin: 0;
    font-size: 1.3rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .saved {
    color: var(--muted);
    font-size: 0.95rem;
  }

  .warning {
    color: var(--help);
    font-weight: 700;
  }

  .due {
    font-size: 0.95rem;
    font-weight: 700;
  }

  .link {
    padding: 0;
    border: none;
    background: none;
    color: var(--accent);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }

  .tools {
    display: flex;
    gap: 6px;
    overflow-x: auto;
  }

  .tools button {
    min-height: 48px;
    min-width: 48px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 12px;
    border: 2px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
  }

  .tools button[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--selected);
  }

  .tools button:disabled {
    opacity: 0.45;
    cursor: default;
  }

  button:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }

  .status {
    min-height: 1.4em;
    margin: 0;
    padding-left: 4px;
    font-weight: 700;
  }

  .print-choice {
    width: min(480px, calc(100vw - 24px));
    padding: 20px;
    border: none;
    border-radius: 16px;
    background: var(--surface);
    color: var(--ink);
  }

  .print-choice::backdrop {
    background: var(--backdrop);
  }

  .print-choice h2 {
    white-space: normal;
  }

  .choices {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 16px 0;
  }

  .choices button,
  .cancel {
    min-height: 52px;
    padding: 0 18px;
    border: 2px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    font-size: 1.05rem;
    font-weight: 700;
    cursor: pointer;
  }

  .print-choice p {
    margin: 0 0 16px;
    color: var(--muted);
  }

  .body {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: 16px;
  }

  @media (max-width: 599px) {
    .done {
      padding: 0 16px;
    }

    .tools {
      width: 100%;
      flex-wrap: wrap;
    }

    .body {
      flex-direction: column;
      gap: 10px;
    }
  }
</style>
