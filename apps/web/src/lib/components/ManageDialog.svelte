<script lang="ts">
  import { ObfError, type BoardSet } from '@open-aac/core';
  import { downloadBoards, readBoardFile } from '../files';
  import { ICONS } from '../icons';
  import { starterSet } from '../starter';
  import { app } from '../state.svelte';
  import { saveBoards } from '../storage';
  import Icon from './Icon.svelte';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  let dialog: HTMLDialogElement;
  let status = $state('');
  let fixes = $state<string[]>([]);

  $effect(() => {
    if (open && !dialog.open) {
      status = '';
      fixes = [];
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });

  async function replaceBoards(set: BoardSet, done: string) {
    app.load(set);
    try {
      await saveBoards(set);
      status = done;
    } catch {
      status = `${done} They could not be saved on this device, so they will be gone when the app closes.`;
    }
  }

  async function importFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    fixes = [];
    try {
      const { set, issues } = await readBoardFile(file);
      const count = set.boards.length === 1 ? '1 board' : `${set.boards.length} boards`;
      if (!confirm(`Replace all boards on this device with ${count} from “${file.name}”?`)) return;
      await replaceBoards(set, `Imported ${count}.`);
      fixes = issues.map((issue) => issue.message);
    } catch (error) {
      status = error instanceof ObfError ? error.message : 'That file could not be read.';
    }
  }

  function exportAll() {
    if (!app.set) return;
    downloadBoards(app.set);
    status = 'Exported a copy of all boards.';
  }

  async function reset() {
    if (!confirm('Replace all boards on this device with the starter boards?')) return;
    await replaceBoards(starterSet(), 'Starter boards restored.');
  }
</script>

<dialog bind:this={dialog} aria-labelledby="manage-title" onclose={() => (open = false)}>
  <h2 id="manage-title">Boards</h2>
  <p class="note">
    Boards are stored on this device only. Export a copy now and then so they can't be lost.
  </p>

  <div class="actions">
    <label class="action">
      <Icon path={ICONS.import} size={28} />
      Import boards
      <input
        class="visually-hidden"
        type="file"
        accept=".obz,.obf,application/zip,application/json"
        onchange={importFile}
      />
    </label>
    <button class="action" onclick={exportAll}>
      <Icon path={ICONS.export} size={28} />
      Export all boards
    </button>
    <button class="action" onclick={reset}>
      <Icon path={ICONS.reset} size={28} />
      Reset to starter boards
    </button>
  </div>

  {#if status}
    <p class="status" role="status">{status}</p>
  {/if}
  {#if fixes.length > 0}
    <details>
      <summary>{fixes.length} small problems were fixed while importing</summary>
      <ul>
        {#each fixes.slice(0, 50) as fix, i (i)}
          <li>{fix}</li>
        {/each}
      </ul>
    </details>
  {/if}

  <div class="footer">
    <button class="close" onclick={() => (open = false)}>Done</button>
  </div>
</dialog>

<style>
  dialog {
    width: min(560px, calc(100vw - 32px));
    padding: 28px;
    border: none;
    border-radius: 20px;
    background: var(--surface);
    color: var(--ink);
    user-select: text;
  }

  dialog::backdrop {
    background: rgb(21 32 43 / 0.55);
  }

  h2 {
    margin: 0 0 6px;
    font-size: 1.6rem;
  }

  .note {
    margin: 0 0 20px;
    color: var(--muted);
    line-height: 1.4;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .action {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 60px;
    padding: 0 18px;
    border-radius: var(--radius);
    border: 2px solid var(--line);
    background: var(--surface);
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
  }

  .action:focus-visible,
  .action:focus-within,
  .close:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }

  .status {
    margin: 18px 0 0;
    font-weight: 700;
  }

  details {
    margin-top: 10px;
    color: var(--muted);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;
  }

  .close {
    min-height: 52px;
    padding: 0 28px;
    border: none;
    border-radius: 12px;
    background: var(--accent);
    color: var(--accent-ink);
    font-size: 1.1rem;
    font-weight: 800;
    cursor: pointer;
  }
</style>
