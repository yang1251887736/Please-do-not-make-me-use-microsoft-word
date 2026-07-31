// Render the document data into pages
// Support interactions for Blocks(dragging, adding, deleting, moving, and resizing column widths)
import { Fragment, useEffect, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AddBlockMenu } from "./AddBlockMenu";
import { BlockEditor } from "./BlockEditor";

// Create a drop zone at a specific position when dragging a Block
// Get highlighted when the mouse moves to the drop zone
function DropZone({ blockId, position, visible }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${blockId}::${position}`,
    disabled: !visible,
  });
  return (
    <div
      ref={setNodeRef}
      className={`drop-zone drop-zone--${position} ${visible ? "is-visible" : ""} ${isOver ? "is-over" : ""}`}
      aria-hidden="true"
    >
      {isOver && (
        <span>
          {position === "left" || position === "right"
            ? "Create column"
            : `Place ${position}`}
        </span>
      )}
    </div>
  );
}

// Drag the Block to a new line
function NewRowDropZone({ rowId, visible }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${rowId}::new-row-after`,
    disabled: !visible,
  });
  return (
    <div
      ref={setNodeRef}
      className={`new-row-drop-zone ${visible ? "is-visible" : ""} ${isOver ? "is-over" : ""}`}
      aria-hidden="true"
    >
      <span>Move to a new full-width row</span>
    </div>
  );
}

// Combine drag, menus, editors, delete buttons and DropZones together
function SortableBlock({ block, isDraggingAny, onChange, onAdd, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(block.type === "image"
      ? {
          width: `${block.width ?? 100}%`,
          justifySelf: "start",
        }
      : null),
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`block-shell block-shell--${block.type} ${isDragging ? "is-dragging" : ""}`}
      data-block-id={block.id}
    >
      <div className="block-controls">
        <button
          className="block-control"
          type="button"
          aria-label="Add block after"
          onClick={() => setMenuOpen((open) => !open)}
        >
          +
        </button>
        <button
          className="block-control drag-handle"
          type="button"
          aria-label="Drag block"
          title="Drag to move or create a column"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        <button
          className="block-control delete-control"
          type="button"
          aria-label="Delete block"
          onClick={() => onDelete(block.id)}
        >
          ×
        </button>
      </div>
      {menuOpen && (
        <div className="block-menu-anchor">
          <AddBlockMenu       // AddBlockMenu.jsx
            onClose={() => setMenuOpen(false)}
            onSelect={(type) => {
              onAdd(type, block.id);
              setMenuOpen(false);
            }}
          />
        </div>
      )}
      <div className="block-surface">
        <BlockEditor     // BlockEditor.jsx
          block={block}
          onChange={onChange}
          onEnter={() => onAdd("paragraph", block.id)}
          onDeleteEmpty={() => onDelete(block.id)}
        />
      </div>
      {["before", "after", "left", "right"].map((position) => (
        <DropZone
          key={position}
          blockId={block.id}
          position={position}
          visible={isDraggingAny && !isDragging}
        />
      ))}
    </div>
  );
}

// Draggable divider between two columns (for adjusting the width of left and right columns)
function ColumnDivider({ row, onResize }) {
  const dividerRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  useEffect(() => {
    if (!isResizing) return;
    document.body.classList.add("is-resizing");
    return () => document.body.classList.remove("is-resizing");
  }, [isResizing]);
  const startResize = (event) => {
    const rowElement = dividerRef.current?.parentElement;
    if (!rowElement) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsResizing(true);
    const bounds = rowElement.getBoundingClientRect();
    const handleMove = (moveEvent) => {
      const width = ((moveEvent.clientX - bounds.left) / bounds.width) * 100;  // Percentage of the left column
      onResize(row.id, width);
    };
    const handleEnd = () => {
      setIsResizing(false);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
  };
  return (
    <button
      ref={dividerRef}
      className={`column-divider ${isResizing ? "is-active" : ""}`}
      type="button"
      aria-label="Resize columns"
      title="Drag to resize columns"
      onPointerDown={startResize}
      onKeyDown={(event) => {    // use keyboard
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const step = event.shiftKey ? 10 : 5;
          onResize(
            row.id,
            row.columns[0].width + (event.key === "ArrowRight" ? step : -step),
          );
        }
      }}
    >
      <span />
    </button>
  );
}

// the overall structure of the document

/*
EditorCanvas serves as the overall layout manager for this editor:
• Reads data from document.rows
• Instantiates each Row
• Instantiates each Column
• Utilizes SortableContext to govern the drag-and-drop sorting of Blocks
• Renders SortableBlock
• Embeds ColumnDivider to enable column width adjustment
• Embeds NewRowDropZone to support creating new rows via drag-and-drop operations
*/

/*
document
│
└── rows
     │
     └── columns
            │
            └── blocks
                    │
                    └── content
*/
function EditorCanvas({
  document: document2,
  activeBlockId,
  onBlockChange,
  onAddBlock,
  onDeleteBlock,
  onResizeRow,
}) {
  return (
    <main className="document-canvas" aria-label="Document editor">
      {document2.rows.map((row) => {
        const isTwoColumn = row.columns.length === 2;
        const rowStyle = isTwoColumn
          ? {
              gridTemplateColumns: `${row.columns[0].width}fr 18px ${row.columns[1].width}fr`,
            }
          : void 0;
        return (
          <Fragment key={row.id}>
            <section
              className={`document-row ${isTwoColumn ? "is-two-column" : ""}`}
              style={rowStyle}
              data-row-id={row.id}
            >
              {row.columns.map((column, columnIndex) => (
                <Fragment key={column.id}>
                  <div className="document-column">
                    <SortableContext
                      items={column.blocks.map((block) => block.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {column.blocks.map((block) => (
                        <SortableBlock
                          key={block.id}
                          block={block}
                          isDraggingAny={activeBlockId !== null}
                          onChange={onBlockChange}
                          onAdd={onAddBlock}
                          onDelete={onDeleteBlock}
                        />
                      ))}
                    </SortableContext>
                  </div>
                  {isTwoColumn && columnIndex === 0 && (
                    <ColumnDivider row={row} onResize={onResizeRow} />
                  )}
                </Fragment>
              ))}
            </section>
            {isTwoColumn && (
              <NewRowDropZone rowId={row.id} visible={activeBlockId !== null} />
            )}
          </Fragment>
        );
      })}
    </main>
  );
}
export { EditorCanvas };



/* 
EditorCanvas.jsx
│
├── ① DropZone（拖拽放置区域）
├── ② NewRowDropZone（新建一行的放置区域）
├── ③ SortableBlock（可拖拽Block）
├── ④ ColumnDivider（列宽拖动）
├── ⑤ EditorCanvas（整个编辑器）
└── ⑥ export
*/