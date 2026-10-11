<script lang="ts">
  import { cells, type ObfBoard } from '@open-aac/core';
  import { imageSrc } from '../images';
  import { app } from '../state.svelte';
  import Cell from './Cell.svelte';

  let { board }: { board: ObfBoard } = $props();

  const grid = $derived(cells(board));
</script>

<div class="grid" style:--rows={board.grid.rows} style:--columns={board.grid.columns}>
  {#each grid as cell (`${cell.row}:${cell.column}`)}
    {@const button = cell.button}
    {#if button && !button.hidden}
      <Cell
        {button}
        src={app.set ? imageSrc(app.set, board, button.image_id) : undefined}
        onpress={() => app.press(button)}
      />
    {:else}
      <div aria-hidden="true"></div>
    {/if}
  {/each}
</div>

<style>
  .grid {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
    grid-template-rows: repeat(var(--rows), minmax(0, 1fr));
    gap: var(--gap);
    padding-top: 8px;
  }
</style>
