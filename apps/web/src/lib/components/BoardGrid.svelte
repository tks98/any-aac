<script lang="ts">
  import { cells, type ObfBoard } from '@open-aac/core';
  import { TouchSelector } from '../access/touch';
  import { imageSrc } from '../images';
  import { app } from '../state.svelte';
  import Cell from './Cell.svelte';

  let { board }: { board: ObfBoard } = $props();

  const grid = $derived(cells(board));
  let holding = $state<{ index: number; ms: number } | null>(null);
  /** Clicks right after a pointer lifts came from that pointer, which we already handled. */
  let lastPointerUp = -Infinity;

  const selector = new TouchSelector<number>(() => app.settings.touch, {
    select: (index) => {
      const button = grid[index]?.button;
      if (button) app.press(button);
    },
    holdStart: (index, ms) => (holding = { index, ms }),
    holdEnd: () => (holding = null),
  });

  function cellIndex(element: Element | null | undefined): number | null {
    const cell = element?.closest<HTMLElement>('[data-cell]');
    return cell?.dataset.cell === undefined ? null : Number(cell.dataset.cell);
  }

  const cellAt = (event: PointerEvent) =>
    cellIndex(document.elementFromPoint(event.clientX, event.clientY));

  function onpointerdown(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0) return;
    const index = cellIndex(event.target as Element);
    if (index !== null) selector.down(index);
  }

  function onpointermove(event: PointerEvent) {
    if (event.isPrimary && holding) selector.move(cellAt(event));
  }

  function onpointerup(event: PointerEvent) {
    if (!event.isPrimary) return;
    lastPointerUp = performance.now();
    selector.up(cellAt(event));
  }

  function onpointercancel() {
    lastPointerUp = performance.now();
    selector.cancel();
  }

  /** Keyboard, screen readers and system switch access arrive as plain clicks. */
  function onclick(index: number) {
    if (performance.now() - lastPointerUp > 500) selector.activate(index);
  }
</script>

<!-- Pointer handling is delegated here; each cell is a real <button> for keyboards and screen readers. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="grid"
  lang={app.language}
  style:--rows={board.grid.rows}
  style:--columns={board.grid.columns}
  style:--cell-gap="{app.settings.display.buttonGap}px"
  {onpointerdown}
  {onpointermove}
  {onpointerup}
  {onpointercancel}
>
  {#each grid as cell, index (`${cell.row}:${cell.column}`)}
    {@const button = cell.button}
    {#if button && !button.hidden}
      <Cell
        {button}
        {index}
        src={app.set ? imageSrc(app.set, board, button.image_id) : undefined}
        holdMs={holding?.index === index ? holding.ms : 0}
        labelAbove={app.settings.display.labelPosition === 'above'}
        showSymbol={app.settings.display.showSymbols}
        lang={app.language}
        onactivate={() => onclick(index)}
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
    gap: var(--cell-gap);
    padding-top: 8px;
    /* No browser gestures (scroll, zoom) on the board: they would cancel holds. */
    touch-action: none;
  }
</style>
