/**
 * Edit mode: changes to the boards, with undo, saved on this device as they're made.
 *
 * A board and its phone layout share words but not positions. Changing a word
 * (its label, symbol, colour, link…) changes it on both. Adding or removing a
 * word does too, where there's room; moving one only moves it on the layout
 * being edited.
 */
import {
  addButton,
  addEmptyBoard,
  buttonAt,
  cells,
  clearCell,
  EXT_COMPACT_BOARD,
  isLocked,
  linkedLayout,
  replaceBoard,
  swapCells,
  updateButton,
  without,
  withoutUnusedFiles,
  type BoardSet,
  type CellRef,
  type ObfBoard,
  type ObfButton,
  type ObfImage,
} from '@any-aac/core';
import { backups } from './backup.svelte';
import { app } from './state.svelte';
import { saveBoards } from './storage';

/** What a button and its copy on the other layout have in common. */
const SHARED = [
  'label',
  'vocalization',
  'translations',
  'image_id',
  'load_board',
  'ext_anyaac_part_of_speech',
] as const;

/** How many versions Undo can go back through. */
const UNDO_LIMIT = 100;

export interface Copied {
  button: ObfButton;
  image?: ObfImage;
}

class Editor {
  active = $state(false);
  selected = $state<CellRef | null>(null);
  /** Swap mode: the first cell picked, or null before one is. */
  swapping = $state(false);
  swapFrom = $state<CellRef | null>(null);
  showHidden = $state(true);
  copied = $state.raw<Copied | null>(null);
  /** A short message about the last change, e.g. why it couldn't be made. */
  notice = $state('');
  saveFailed = $state(false);
  private undoStack = $state.raw<BoardSet[]>([]);
  private redoStack = $state.raw<BoardSet[]>([]);

  canUndo = $derived(this.undoStack.length > 0);
  canRedo = $derived(this.redoStack.length > 0);
  /** The layout being edited: the one on screen. */
  board = $derived(app.view);
  selectedButton = $derived(
    this.board && this.selected ? buttonAt(this.board, this.selected) : undefined,
  );
  /** The board's other layout (phone or full), which shares its words. */
  linked = $derived(app.set && this.board ? linkedLayout(app.set, this.board) : undefined);

  open() {
    this.active = true;
    this.selected = null;
    this.notice = '';
  }

  close() {
    this.active = false;
    this.selected = null;
    this.swapping = false;
    this.swapFrom = null;
    this.notice = '';
  }

  select(cell: CellRef) {
    this.notice = '';
    if (!this.swapping) {
      this.selected = cell;
      return;
    }
    if (!this.swapFrom) {
      if (this.lockedAt(cell)) return;
      this.swapFrom = cell;
      this.selected = cell;
      return;
    }
    const from = this.swapFrom;
    this.swapFrom = null;
    if (from.row === cell.row && from.column === cell.column) return;
    if (this.lockedAt(cell)) return;
    this.change((set, board) => replaceBoard(set, swapCells(board, from, cell)));
    this.selected = cell;
  }

  toggleSwap() {
    this.swapping = !this.swapping;
    this.swapFrom = null;
    this.notice = '';
  }

  /** True (with a notice) when the cell holds a button locked in place. */
  private lockedAt(cell: CellRef): boolean {
    const button = this.board ? buttonAt(this.board, cell) : undefined;
    if (button && isLocked(button)) {
      this.notice = app.t.lockedNotice(button.label ?? '');
      return true;
    }
    return false;
  }

  /** Applies a change to the board on screen and saves it. */
  change(edit: (set: BoardSet, board: ObfBoard) => BoardSet) {
    if (!app.set || !this.board) return;
    this.commit(edit(app.set, this.board));
  }

  private commit(next: BoardSet) {
    if (!app.set) return;
    this.undoStack = [...this.undoStack, app.set].slice(-UNDO_LIMIT);
    this.redoStack = [];
    this.show(withoutUnusedFiles(next));
  }

  private show(set: BoardSet) {
    app.replaceSet(set);
    if (this.selected && this.board && !this.cellExists(this.board, this.selected)) {
      this.selected = null;
    }
    saveBoards(set).then(
      () => {
        this.saveFailed = false;
        backups.savedAt = Date.now();
      },
      () => (this.saveFailed = true),
    );
  }

  private cellExists(board: ObfBoard, cell: CellRef) {
    return cell.row < board.grid.rows && cell.column < board.grid.columns;
  }

  undo() {
    const previous = this.undoStack.at(-1);
    if (!previous || !app.set) return;
    this.undoStack = this.undoStack.slice(0, -1);
    this.redoStack = [...this.redoStack, app.set];
    this.show(previous);
  }

  redo() {
    const next = this.redoStack.at(-1);
    if (!next || !app.set) return;
    this.redoStack = this.redoStack.slice(0, -1);
    this.undoStack = [...this.undoStack, app.set];
    this.show(next);
  }

  /** Changes the selected button, and the same word on the other layout. */
  editButton(change: (button: ObfButton) => ObfButton, image?: ObfImage) {
    const button = this.selectedButton;
    if (!button) return;
    this.change((set, board) => withButton(set, board, change(button), image));
  }

  /** Gives the selected button a picture whose bytes are kept with the boards. */
  setPicture(image: ObfImage, path: string, bytes: Uint8Array) {
    const button = this.selectedButton;
    if (!button) return;
    this.change((set, board) =>
      withButton(
        { ...set, files: { ...set.files, [path]: bytes } },
        board,
        { ...button, image_id: image.id },
        image,
      ),
    );
  }

  /** Adds a button to the selected empty cell, and to the other layout if it has room. */
  addButton(button: Partial<ObfButton>, image?: ObfImage) {
    const cell = this.selected;
    if (!cell || !this.board || buttonAt(this.board, cell)) return;
    this.change((set, board) => {
      const added = addButton(board, cell, button, image);
      const id = buttonAt(added, cell)!.id;
      let next = replaceBoard(set, added);
      const linked = linkedLayout(next, added);
      if (linked && !linked.buttons.some((b) => b.id === id)) {
        const free = cells(linked).find((c) => c.button === null);
        if (free) {
          next = replaceBoard(next, addButton(linked, free, { ...button, id }, image));
        } else {
          this.notice = app.t.noRoomOnOtherLayout;
        }
      }
      return next;
    });
  }

  /** Removes the selected button, here and from the other layout. */
  removeSelected() {
    const cell = this.selected;
    const button = this.selectedButton;
    if (!cell || !button) return;
    this.change((set, board) => {
      let next = replaceBoard(set, clearCell(board, cell));
      const linked = linkedLayout(next, board);
      const there = linked && cells(linked).find((c) => c.button?.id === button.id);
      if (linked && there) next = replaceBoard(next, clearCell(linked, there));
      return next;
    });
  }

  copy() {
    const button = this.selectedButton;
    if (!button || !this.board) return;
    const image = this.board.images.find((i) => i.id === button.image_id);
    this.copied = { button, ...(image ? { image } : {}) };
    this.notice = app.t.copiedNotice(button.label ?? '');
  }

  paste() {
    if (!this.copied) return;
    const { button, image } = this.copied;
    this.addButton(without(button, 'id'), image);
  }

  /** Makes the selected button open a new, empty board, and opens it for editing. */
  linkToNewBoard(name: string) {
    const button = this.selectedButton;
    const full = app.board;
    if (!button || !full || !app.set) return;
    let { set, board } = addEmptyBoard(app.set, name, full);
    const phone = this.board !== full ? this.board : undefined;
    if (phone) {
      const added = addEmptyBoard(set, `${name} (phone)`, phone);
      set = {
        ...added.set,
        boards: added.set.boards.map((b) =>
          b.id === board.id ? { ...b, [EXT_COMPACT_BOARD]: added.board.id } : b,
        ),
      };
      board = set.boards.find((b) => b.id === board.id)!;
    }
    const view = set.boards.find((b) => b.id === this.board?.id)!;
    this.commit(withButton(set, view, { ...button, load_board: { id: board.id, name } }));
    this.openBoard(board.id);
  }

  openBoard(id: string) {
    app.open(id);
    this.selected = null;
    this.swapFrom = null;
  }

  back() {
    app.back();
    this.selected = null;
    this.swapFrom = null;
  }
}

/** The set with `button` changed on `board`, and the same word on the board's other layout. */
function withButton(set: BoardSet, board: ObfBoard, button: ObfButton, image?: ObfImage) {
  let next = replaceBoard(
    set,
    updateButton(board, button.id, () => button, image),
  );
  const linked = linkedLayout(next, board);
  if (linked?.buttons.some((b) => b.id === button.id)) {
    next = replaceBoard(
      next,
      updateButton(linked, button.id, (other) => share(button, other), image),
    );
  }
  return next;
}

/** `other` with the shared fields of `button`. */
function share(button: ObfButton, other: ObfButton): ObfButton {
  let result = { ...other };
  for (const key of SHARED) {
    result = button[key] === undefined ? without(result, key) : { ...result, [key]: button[key] };
  }
  return result;
}

export const editor = new Editor();
