# Please do not make me use microsoft word

Canvas is a block-based word processor inspired by the original Notion editor.
Documents are arranged as movable blocks and rows can contain any number of
resizable columns.

# function
1. text editing and formatting, including paragraphs, headings, with formatting and text alignment;
2. drag-and-drop block reordering and keyboard-based navigation;
3. creation and adjustment of flexible multi-column layouts;
4. image and column resizing and responsive presentation;
5. local document persistence through IndexedDB;
6. validated JSON import and export, PDF document export;
7. named local version history and document recovery;
8. basic protection for destructive operations, including undo, confirmation and safety snapshots.

## Operation instruction
1. Click the '+add block' button or the '+' button built‑into the block to select a block type.
2. Use the toolbar built-in the block for text formatting and alignment.
3. Drag blocks to reorder them or use arrow keys to navigate between them.
4. Use Ctrl+Z to undo recent changes or restore deleted content.
5. Resize images using the button in the bottom‑right corner.
6. drag the vertical dividing line to adjust the column size when there are multiple columns in one row
7. Click 'import'/'export'/'export PDF' buttons to save or load documents.
8. Click 'history' button to save and restore previous versions.
9. Confirm destructive operations when prompted.

## Live Demo
https://yang1251887736.github.io/Please-do-not-make-me-use-microsoft-word/

## Local Development

Requirements: Node.js 22+ and pnpm 11.

```bash
pnpm install
pnpm dev
```

## Production Build

```bash
pnpm build
```
