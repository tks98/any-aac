<script lang="ts">
  import { buttonWords, type ObfButton } from '@open-aac/core';
  import { app } from '../state.svelte';
  import { cellColors } from '../theme';

  let {
    button,
    index,
    src,
    holdMs = 0,
    labelAbove = false,
    showSymbol = true,
    lang,
    hidden = false,
    pressed,
    onactivate,
  }: {
    button: ObfButton;
    /** Position in the grid; the board's pointer handling finds cells by it. */
    index: number;
    src: string | undefined;
    /** Non-zero while a press-and-hold is under way on this button. */
    holdMs?: number;
    labelAbove?: boolean;
    showSymbol?: boolean;
    /** Language to show the button in, when it has a translation. */
    lang?: string;
    /** Edit mode: a button the communicator doesn't see. */
    hidden?: boolean;
    /** Edit mode: whether this is the selected cell. */
    pressed?: boolean;
    /** Activation that doesn't come from a pointer (keyboard, screen reader). */
    onactivate: () => void;
  } = $props();

  const colors = $derived(cellColors(button));
  const isFolder = $derived(button.load_board !== undefined);
  const label = $derived(buttonWords(button, lang).label);
  /** Letters in the label's longest word, so long words can shrink to fit. */
  const longest = $derived(Math.max(1, ...label.split(/\s+/).map((word) => [...word].length)));
</script>

<button
  class="cell"
  class:above={labelAbove}
  class:text-only={!showSymbol || !src}
  data-cell={index}
  style:--fill={colors.fill}
  style:--edge={colors.edge}
  style:--longest={longest}
  class:hidden
  aria-label={hidden ? app.t.hiddenButton(label) : isFolder ? app.t.folder(label) : undefined}
  aria-pressed={pressed}
  onclick={onactivate}
>
  {#if isFolder}
    <span class="tab" aria-hidden="true"></span>
  {/if}
  {#if holdMs > 0}
    <span class="hold" style:--hold-ms="{holdMs}ms" aria-hidden="true"></span>
  {/if}
  {#if src && showSymbol}
    <img {src} alt="" draggable="false" />
  {/if}
  <span class="label">{label}</span>
</button>

<style>
  .cell {
    /* Size containment: nothing inside a button can change the grid's row and
       column sizes, and the symbol and label size from the cell (cq units).
       cq units on .cell itself would measure the viewport, so use px here. */
    container-type: size;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 0;
    min-height: 0;
    padding: 3px;
    border-radius: var(--radius);
    border: 2px solid var(--edge);
    background: var(--fill);
    cursor: pointer;
    touch-action: manipulation;
  }

  .cell.hidden {
    opacity: 0.45;
    border-style: dashed;
  }

  .cell:active {
    filter: brightness(0.94);
  }

  .cell:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }

  img {
    width: min(54cqb, 62cqi);
    height: min(54cqb, 62cqi);
    flex-shrink: 0;
    object-fit: contain;
    pointer-events: none;
  }

  .label {
    max-width: 100%;
    /* A word wider than the cell shrinks until it fits (letters are about
       0.55em wide in this font), rather than being cut off or split. */
    font-size: min(clamp(0.75rem, min(17cqi, 19cqb), 1.3rem), max(0.6rem, 160cqi / var(--longest)));
    font-weight: 700;
    line-height: 1.05;
    text-align: center;
    /* Wrap between words only. Never split a word across lines. */
    overflow-wrap: normal;
    word-break: normal;
    overflow: hidden;
  }

  .above {
    flex-direction: column-reverse;
  }

  .text-only .label {
    font-size: min(clamp(0.9rem, min(20cqi, 30cqb), 2rem), max(0.6rem, 160cqi / var(--longest)));
  }

  /* Press-and-hold progress fills the button from the bottom. */
  .hold {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgb(29 91 214 / 0.25);
    transform-origin: bottom;
    animation: hold-fill var(--hold-ms) linear forwards;
    pointer-events: none;
  }

  @keyframes hold-fill {
    from {
      transform: scaleY(0);
    }
    to {
      transform: scaleY(1);
    }
  }

  .tab {
    position: absolute;
    top: -8px;
    left: 10px;
    width: 40%;
    max-width: 46px;
    height: 9px;
    border-radius: 6px 6px 0 0;
    background: var(--edge);
  }
</style>
