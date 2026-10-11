<script lang="ts">
  import type { ObfImage } from '@any-aac/core';
  import { onMount } from 'svelte';
  import { app } from '../state.svelte';
  import { loadSymbols, searchSymbols, symbolImage, type LibrarySymbol } from '../symbol-library';

  let {
    query: initial,
    onpick,
    onclose,
  }: {
    /** What to search for first, usually the button's label. */
    query: string;
    onpick: (image: ObfImage, path: string, bytes: Uint8Array) => void;
    onclose: () => void;
  } = $props();

  const t = $derived(app.t);
  let dialog: HTMLDialogElement;
  let search: HTMLInputElement;
  // Starts from the label; after that it's the search box's own.
  let query = $state('');
  let symbols = $state.raw<LibrarySymbol[]>([]);
  let loading = $state(true);
  let error = $state('');
  const results = $derived(searchSymbols(symbols, query));

  onMount(() => {
    query = initial;
    dialog.showModal();
    search.focus();
    search.select();
    loadSymbols().then((loaded) => {
      symbols = loaded;
      loading = false;
    });
  });

  async function pick(symbol: LibrarySymbol) {
    error = '';
    try {
      const { image, path, bytes } = await symbolImage(symbol);
      onpick(image, path, bytes);
    } catch {
      error = t.photoError;
    }
  }
</script>

<dialog
  bind:this={dialog}
  lang={app.appLanguage}
  aria-labelledby="symbol-title"
  onclose={() => onclose()}
>
  <header>
    <h2 id="symbol-title">{t.findSymbol}</h2>
    <button class="close" onclick={() => dialog.close()}>{t.cancel}</button>
  </header>
  <input
    bind:this={search}
    type="search"
    bind:value={query}
    aria-label={t.searchSymbols}
    placeholder={t.searchSymbols}
    autocomplete="off"
  />
  <p class="status" role="status">
    {#if !loading && query.trim() !== ''}
      {results.length > 0 ? t.symbolResults(results.length) : t.noSymbolsFound}
    {/if}
  </p>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
  <ul>
    {#each results as symbol (symbol.key)}
      <li>
        <button aria-label={t.useSymbol(symbol.name)} onclick={() => pick(symbol)}>
          <img src={symbol.url} alt="" loading="lazy" draggable="false" />
          <span>{symbol.name}</span>
        </button>
      </li>
    {/each}
  </ul>
</dialog>

<style>
  dialog {
    width: min(760px, 100vw);
    max-width: none;
    height: min(720px, 100dvh);
    max-height: none;
    padding: 0;
    border: none;
    border-radius: 16px;
    background: var(--surface);
    color: var(--ink);
  }

  dialog[open] {
    display: flex;
    flex-direction: column;
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

  .close {
    min-height: 48px;
    padding: 0 20px;
    border: 2px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    font-weight: 700;
    cursor: pointer;
  }

  input {
    margin: 14px 16px 0;
    min-height: 52px;
    padding: 0 14px;
    border: 2px solid var(--line);
    border-radius: 12px;
    font: inherit;
    font-size: 1.15rem;
  }

  .status {
    min-height: 1.4em;
    margin: 8px 16px;
    color: var(--muted);
  }

  .error {
    margin: 0 16px;
    color: var(--help);
    font-weight: 700;
  }

  ul {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
    gap: 10px;
    margin: 0;
    padding: 4px 16px 16px;
    list-style: none;
  }

  li button {
    width: 100%;
    height: 124px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px;
    border: 2px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    font-weight: 700;
    cursor: pointer;
  }

  li img {
    width: 64px;
    height: 64px;
    object-fit: contain;
  }

  li span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  button:focus-visible,
  input:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }

  @media (max-width: 599px) {
    dialog {
      height: 100dvh;
      border-radius: 0;
    }
  }
</style>
