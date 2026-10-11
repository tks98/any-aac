<script lang="ts">
  import { boardName, buttonAt } from '@open-aac/core';
  import { editor } from '../editor.svelte';
  import { ICONS } from '../icons';
  import { app } from '../state.svelte';
  import ButtonPanel from './ButtonPanel.svelte';
  import EditGrid from './EditGrid.svelte';
  import Icon from './Icon.svelte';

  let { onsettings }: { onsettings: () => void } = $props();

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
    background: #e8effc;
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
