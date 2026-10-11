<script lang="ts">
  import { boardName, cells, type ObfBoard } from '@open-aac/core';
  import { onMount, tick } from 'svelte';
  import { imageSrc } from '../images';
  import { app } from '../state.svelte';
  import Cell from './Cell.svelte';

  /** Boards to print, one per page; printing starts once their symbols have loaded. */
  let { boards, ondone }: { boards: ObfBoard[]; ondone: () => void } = $props();

  let root: HTMLElement;
  const date = new Date().toLocaleDateString(app.appLanguage);

  onMount(() => {
    const done = () => ondone();
    addEventListener('afterprint', done, { once: true });
    void (async () => {
      await tick();
      await Promise.all(
        [...root.querySelectorAll('img')].map((img) => img.decode().catch(() => undefined)),
      );
      print();
    })();
    return () => removeEventListener('afterprint', done);
  });
</script>

<div class="print" bind:this={root} lang={app.language}>
  {#each boards as board (board.id)}
    <section class="page" class:portrait={board.grid.rows > board.grid.columns}>
      <h1>{boardName(board, app.language)}</h1>
      <div class="grid" style:--rows={board.grid.rows} style:--columns={board.grid.columns}>
        {#each cells(board) as cell, index (`${cell.row}:${cell.column}`)}
          {#if cell.button && !cell.button.hidden}
            <Cell
              button={cell.button}
              {index}
              src={app.set ? imageSrc(app.set, board, cell.button.image_id) : undefined}
              labelAbove={app.settings.display.labelPosition === 'above'}
              showSymbol={app.settings.display.showSymbols}
              lang={app.language}
              onactivate={() => {}}
            />
          {:else}
            <div></div>
          {/if}
        {/each}
      </div>
      <p class="credit">{app.t.printCredit(date)}</p>
    </section>
  {/each}
</div>

<style>
  .print {
    display: none;
  }

  @media print {
    :global(.screen) {
      display: none !important;
    }

    :global(html),
    :global(body),
    :global(#app) {
      height: auto;
      background: #ffffff !important;
    }

    .print {
      display: block;
      color: #000000;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    .page {
      /* Fits A4 and US Letter, landscape, inside the page margins. */
      height: 184mm;
      display: flex;
      flex-direction: column;
      gap: 3mm;
      break-after: page;
      page: landscape;
    }

    /* Fits A4 and US Letter, portrait. */
    .page.portrait {
      height: 250mm;
      page: portrait;
    }

    .page:last-child {
      break-after: auto;
    }

    h1 {
      margin: 0;
      font-size: 16pt;
    }

    .grid {
      flex: 1;
      min-height: 0;
      display: grid;
      grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
      grid-template-rows: repeat(var(--rows), minmax(0, 1fr));
      gap: 2mm;
    }

    .credit {
      margin: 0;
      font-size: 7pt;
      color: #333333;
    }

    @page landscape {
      size: landscape;
      margin: 10mm;
    }

    @page portrait {
      size: portrait;
      margin: 10mm;
    }
  }
</style>
