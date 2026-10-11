<script lang="ts">
  import { cells, type CellRef, type ObfBoard } from '@open-aac/core';
  import { editor } from '../editor.svelte';
  import { ICONS } from '../icons';
  import { imageSrc } from '../images';
  import { app } from '../state.svelte';
  import Cell from './Cell.svelte';
  import Icon from './Icon.svelte';

  let { board }: { board: ObfBoard } = $props();

  const grid = $derived(cells(board));
  const same = (a: CellRef | null, b: CellRef) =>
    a !== null && a.row === b.row && a.column === b.column;
</script>

<!-- In edit mode a tap selects a cell; nothing is said or opened. -->
<div
  class="grid"
  class:swapping={editor.swapping}
  style:--rows={board.grid.rows}
  style:--columns={board.grid.columns}
  style:--cell-gap="{app.settings.display.buttonGap}px"
>
  {#each grid as cell, index (`${cell.row}:${cell.column}`)}
    {@const button = cell.button && (editor.showHidden || !cell.button.hidden) ? cell.button : null}
    {@const selected = same(editor.selected, cell)}
    <div class="slot" class:selected class:from={same(editor.swapFrom, cell)}>
      {#if button}
        <Cell
          {button}
          {index}
          src={app.set ? imageSrc(app.set, board, button.image_id) : undefined}
          labelAbove={app.settings.display.labelPosition === 'above'}
          showSymbol={app.settings.display.showSymbols}
          lang={app.language}
          hidden={button.hidden === true}
          pressed={selected}
          onactivate={() => editor.select(cell)}
        />
      {:else}
        <button
          class="empty"
          aria-label={app.t.emptyCellAt(cell.row + 1, cell.column + 1)}
          aria-pressed={selected}
          onclick={() => editor.select(cell)}
        >
          {#if selected}<Icon path={ICONS.plus} size={28} />{/if}
        </button>
      {/if}
    </div>
  {/each}
</div>

<style>
  .grid {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
    grid-template-rows: repeat(var(--rows), minmax(0, 1fr));
    gap: var(--cell-gap);
  }

  .slot {
    position: relative;
    min-width: 0;
    min-height: 0;
    display: grid;
  }

  .slot > :global(button) {
    min-width: 0;
    min-height: 0;
  }

  .slot.selected::after,
  .slot.from::after {
    content: '';
    position: absolute;
    inset: -4px;
    border: 4px solid var(--accent);
    border-radius: calc(var(--radius) + 4px);
    pointer-events: none;
  }

  .slot.from::after {
    border-style: dashed;
  }

  .empty {
    border: 2px dashed var(--line);
    border-radius: var(--radius);
    background: transparent;
    color: var(--accent);
    cursor: pointer;
  }

  .empty:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
</style>
