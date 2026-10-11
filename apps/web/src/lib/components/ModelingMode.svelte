<script lang="ts">
  import { boardName, cells, type ObfBoard } from '@any-aac/core';
  import { ICONS } from '../icons';
  import { imageSrc } from '../images';
  import { modeling } from '../modeling.svelte';
  import { app } from '../state.svelte';
  import Cell from './Cell.svelte';
  import Icon from './Icon.svelte';

  const t = $derived(app.t);
  const view = $derived(app.view);
  const grid = $derived(view ? cells(view) : []);
  const next = $derived(modeling.next);
  const target = $derived(modeling.target);
  const others = $derived(modeling.matches.filter((_, i) => i !== modeling.choice).slice(0, 6));

  const isNext = (board: ObfBoard, row: number, column: number) =>
    next !== null && next.boardId === board.id && next.row === row && next.column === column;

  const stepText = (kind: 'open' | 'tap', label: string) =>
    kind === 'open' ? t.stepOpen(label) : t.stepTap(label);
</script>

<div class="modeling" lang={app.appLanguage}>
  <header>
    <div class="title">
      <span class="name"><Icon path={ICONS.model} size={22} />{t.modeling}</span>
      <span class="help">{t.modelingHelp}</span>
    </div>
    <label class="find">
      <span class="visually-hidden">{t.findWord}</span>
      <Icon path={ICONS.find} size={22} />
      <input
        type="search"
        placeholder={t.findWord}
        value={modeling.query}
        oninput={(event) => modeling.search(event.currentTarget.value)}
        autocomplete="off"
      />
    </label>
    <div class="tools">
      <button onclick={() => app.home()}><Icon path={ICONS.home} size={22} />{t.home}</button>
      <button disabled={app.history.length === 0} onclick={() => app.back()}>
        <Icon path={ICONS.back} size={22} />{t.back}
      </button>
      <button class="exit" onclick={() => modeling.close()}>{t.exit}</button>
    </div>
  </header>

  <div class="body">
    <main>
      <p class="trail">{app.trail.join('  ›  ')}</p>
      {#if view}
        <div
          class="grid"
          lang={app.language}
          style:--rows={view.grid.rows}
          style:--columns={view.grid.columns}
          style:--cell-gap="{app.settings.display.buttonGap}px"
        >
          {#each grid as cell, index (`${cell.row}:${cell.column}`)}
            {@const button = cell.button && !cell.button.hidden ? cell.button : null}
            <div class="slot" class:next={isNext(view, cell.row, cell.column)}>
              {#if button}
                <Cell
                  {button}
                  {index}
                  src={app.set ? imageSrc(app.set, view, button.image_id) : undefined}
                  labelAbove={app.settings.display.labelPosition === 'above'}
                  showSymbol={app.settings.display.showSymbols}
                  lang={app.language}
                  onactivate={() => modeling.tap(button)}
                />
                {#if isNext(view, cell.row, cell.column)}
                  <span class="badge" aria-hidden="true">{modeling.step + 1}</span>
                {/if}
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </main>

    <aside
      class:idle={modeling.query.trim() === ''}
      aria-label={target ? t.pathToWord(target.label) : t.findWord}
    >
      {#if target}
        <p class="path-to">{t.pathTo}</p>
        <p class="word">{target.label}</p>
        <ol>
          {#each target.steps as step, i (i)}
            <li class:current={i === modeling.step} class:done={i < modeling.step}>
              <span class="n" aria-hidden="true">{i + 1}</span>
              <span>
                {stepText(step.kind, step.button.label ?? '')}
                {#if step.kind === 'open' && app.set}
                  {@const board = app.set.boards.find((b) => b.id === step.button.load_board?.id)}
                  {#if board && boardName(board, app.language) !== step.button.label}
                    ({boardName(board, app.language)})
                  {/if}
                {/if}
              </span>
            </li>
          {/each}
        </ol>
        {#if modeling.done}<p class="done-note" role="status">{t.stepDone} ✓</p>{/if}
        <div class="actions">
          <button onclick={() => modeling.restart()}>{t.startOver}</button>
          <button class="primary" onclick={() => modeling.sayTarget()}>
            <Icon path={ICONS.speak} size={20} />{t.sayIt}
          </button>
        </div>
      {:else if modeling.query.trim() !== ''}
        <p role="status">{t.noMatch(modeling.query.trim())}</p>
      {:else}
        <p class="hint">{t.findHint}</p>
      {/if}
      {#if others.length > 0}
        <p class="path-to">{t.otherMatches}</p>
        <div class="others">
          {#each others as match (match.label)}
            <button onclick={() => modeling.choose(modeling.matches.indexOf(match))}
              >{match.label}</button
            >
          {/each}
        </div>
      {/if}
    </aside>
  </div>
</div>

<style>
  .modeling {
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
    padding: 10px 14px;
    border-radius: 16px;
    background: var(--model);
    color: var(--model-ink);
  }

  .title {
    display: flex;
    flex-direction: column;
  }

  .name {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 1.3rem;
    font-weight: 800;
  }

  .help {
    font-size: 0.95rem;
  }

  .find {
    flex: 1 1 220px;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 0 12px;
    border-radius: 12px;
    background: var(--surface);
    color: var(--ink);
  }

  .find input {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    border: none;
    background: transparent;
    font: inherit;
    font-size: 1.1rem;
  }

  .find input:focus {
    outline: none;
  }

  .find:focus-within {
    outline: 3px solid var(--model-ink);
    outline-offset: 2px;
  }

  .tools {
    display: flex;
    gap: 6px;
  }

  .tools button {
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
    border: 2px solid currentColor;
    border-radius: 10px;
    background: transparent;
    color: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .tools button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .tools .exit {
    background: var(--surface);
    color: var(--ink);
    border-color: var(--surface);
  }

  .body {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: 16px;
  }

  main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .trail {
    margin: 0;
    min-height: 1.4rem;
    padding-left: 4px;
    font-weight: 700;
    color: var(--muted);
    white-space: pre;
    overflow: hidden;
    text-overflow: ellipsis;
  }

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

  .slot.next::after {
    content: '';
    position: absolute;
    inset: -6px;
    border: 6px solid var(--model);
    border-radius: calc(var(--radius) + 6px);
    pointer-events: none;
  }

  .badge {
    position: absolute;
    top: -12px;
    left: -12px;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    background: var(--model);
    color: var(--model-ink);
    font-weight: 800;
    pointer-events: none;
    z-index: 1;
  }

  aside {
    width: 300px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    border: 1px solid var(--divider);
    border-radius: 16px;
    background: var(--surface);
    overflow-y: auto;
  }

  aside p {
    margin: 0;
  }

  .path-to {
    color: var(--muted);
    font-weight: 700;
  }

  .word {
    font-size: 1.6rem;
    font-weight: 800;
  }

  ol {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 4px 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.1rem;
  }

  li.done {
    color: var(--muted);
    text-decoration: line-through;
  }

  li.current {
    font-weight: 800;
  }

  .n {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    border-radius: 14px;
    border: 2px solid var(--model);
    font-weight: 800;
  }

  li.current .n {
    background: var(--model);
    color: var(--model-ink);
  }

  .done-note {
    font-weight: 800;
  }

  .hint {
    color: var(--muted);
  }

  .actions,
  .others {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  aside button {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 14px;
    border: 2px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    font-weight: 700;
    cursor: pointer;
  }

  aside button.primary {
    border-color: var(--model);
    background: var(--model);
    color: var(--model-ink);
  }

  button:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }

  @media (max-width: 599px) {
    .body {
      flex-direction: column;
    }

    aside {
      width: auto;
      max-height: 30dvh;
      padding: 10px 12px;
      gap: 6px;
    }

    /* The board needs the room until there's a path to show. */
    aside.idle {
      display: none;
    }

    .word {
      font-size: 1.2rem;
    }

    ol {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 6px 14px;
    }

    li {
      font-size: 1rem;
    }

    .trail {
      display: none;
    }
  }
</style>
