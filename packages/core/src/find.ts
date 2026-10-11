/**
 * Find word: the path to any word on the boards, so a communication partner
 * can model it ("open Food, then tap apple"). Paths follow the layouts on
 * screen: on a phone, a board's phone layout when it has one.
 */
import type { Cell } from './board';
import { cells } from './board';
import { compactBoardId } from './ext';
import { buttonWords } from './language';
import type { ObfBoard, ObfButton } from './obf';
import type { BoardSet } from './obz';

export interface PathStep {
  /** The board (layout on screen) where this step happens. */
  boardId: string;
  button: ObfButton;
  row: number;
  column: number;
  /** Open a folder, or tap the word itself (the last step). */
  kind: 'open' | 'tap';
}

export interface WordMatch {
  label: string;
  steps: PathStep[];
}

export interface FindOptions {
  /** Language words are shown in. */
  lang?: string;
  /** Use boards' phone layouts, as phones do. */
  compact?: boolean;
  /** At most this many matches. */
  limit?: number;
}

const fold = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/** Every board path from the home board, shortest first (breadth-first). */
export function findWord(set: BoardSet, query: string, options: FindOptions = {}): WordMatch[] {
  const q = fold(query);
  if (q === '') return [];
  const byId = new Map(set.boards.map((b) => [b.id, b]));
  const shown = (board: ObfBoard): ObfBoard => {
    const compact = options.compact ? compactBoardId(board) : undefined;
    return (compact && byId.get(compact)) || board;
  };
  const labelOf = (button: ObfButton) => buttonWords(button, options.lang).label;

  const root = byId.get(set.rootId);
  if (!root) return [];
  const found: { match: WordMatch; score: number }[] = [];
  const seenWords = new Set<string>();
  const visited = new Set<string>([root.id]);
  const queue: { board: ObfBoard; steps: PathStep[] }[] = [{ board: root, steps: [] }];

  while (queue.length > 0) {
    const { board, steps } = queue.shift()!;
    const view = shown(board);
    const grid: Cell[] = cells(view).filter((c) => c.button && !c.button.hidden);
    for (const cell of grid) {
      const button = cell.button!;
      const step = { boardId: view.id, button, row: cell.row, column: cell.column };
      const target = button.load_board?.id;
      if (target !== undefined) {
        const next = byId.get(target);
        if (next && !visited.has(next.id)) {
          visited.add(next.id);
          queue.push({ board: next, steps: [...steps, { ...step, kind: 'open' }] });
        }
        continue;
      }
      const label = labelOf(button);
      const name = fold(label);
      const score =
        name === q
          ? 3
          : name.startsWith(q)
            ? 2
            : name.split(/\s+/).some((w) => w === q)
              ? 2
              : name.includes(q)
                ? 1
                : 0;
      // The first (shortest) path to each word is the one to model.
      if (score === 0 || seenWords.has(name)) continue;
      seenWords.add(name);
      found.push({ match: { label, steps: [...steps, { ...step, kind: 'tap' }] }, score });
    }
  }

  return found
    .sort((a, b) => b.score - a.score || a.match.steps.length - b.match.steps.length)
    .slice(0, options.limit ?? 12)
    .map((f) => f.match);
}
