<script lang="ts">
  import { wordForms } from '@open-aac/core';
  import { onMount } from 'svelte';
  import { app } from '../state.svelte';

  let { onclose }: { onclose: () => void } = $props();

  const t = $derived(app.t);
  const last = $derived(app.message.at(-1));
  const forms = $derived(last ? wordForms(last.text, last.lang ?? app.language, last.type) : []);
  let dialog: HTMLDialogElement;

  onMount(() => dialog.showModal());

  function choose(form: string) {
    app.useForm(form);
    dialog.close();
  }
</script>

<dialog bind:this={dialog} aria-labelledby="forms-title" data-scan onclose={() => onclose()}>
  <header>
    <h2 id="forms-title">{last ? t.formsOf(last.label) : t.wordForms}</h2>
    <button class="close" onclick={() => dialog.close()}>{t.cancel}</button>
  </header>
  {#if !last}
    <p>{t.chooseWordFirst}</p>
  {:else if forms.length === 0}
    <p>{t.noForms(last.label)}</p>
    <p class="help">{t.noFormsHelp}</p>
  {:else}
    <ul lang={last.lang ?? app.language}>
      {#each forms as form, i (i)}
        <li>
          <button
            aria-pressed={form.text === last.text}
            aria-label={form.hint ? `${form.text} (${form.hint})` : undefined}
            onclick={() => choose(form.text)}
          >
            <span class="form">{form.text}</span>
            {#if form.hint}<span class="hint">{form.hint}</span>{/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</dialog>

<style>
  dialog {
    width: min(720px, calc(100vw - 24px));
    max-width: none;
    max-height: calc(100dvh - 24px);
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
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--divider);
  }

  h2 {
    margin: 0;
    font-size: 1.4rem;
  }

  p {
    margin: 16px;
    font-size: 1.15rem;
  }

  .help {
    color: var(--muted);
    font-size: 1rem;
  }

  .close {
    min-height: 48px;
    padding: 0 20px;
    border: 2px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    font-weight: 700;
    cursor: pointer;
  }

  ul {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
    margin: 0;
    padding: 16px;
    list-style: none;
  }

  li button {
    width: 100%;
    min-height: 84px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px;
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    cursor: pointer;
    touch-action: manipulation;
  }

  li button[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--selected);
  }

  .form {
    font-size: 1.5rem;
    font-weight: 800;
  }

  .hint {
    color: var(--muted);
    font-weight: 600;
  }

  button:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
</style>
