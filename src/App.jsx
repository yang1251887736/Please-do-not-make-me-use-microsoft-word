// save
import { useEffect, useLayoutEffect, useRef, useState } from "react";
// drag and drop
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { AddBlockMenu } from "./components/AddBlockMenu";
import { EditorCanvas } from "./components/EditorCanvas";
import { VersionHistoryPanel } from "./components/VersionHistoryPanel";
import {
  createBlock,
  createSampleDocument,
  deleteBlock,
  findBlockLocation,
  insertBlockAfter,
  moveBlock,
  moveBlockToNewRow,
  parseDocument,
  resizeColumns,
  touch,
  updateBlock,
} from "./document";
import {
  loadDocument,
  loadSnapshots,
  saveDocument,
  saveSnapshot,
} from "./storage";
import { createSnapshot } from "./versioning";

// Restrict the image size(20MB) and the image format
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

// Where to drag and drop
const collisionDetectionStrategy = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
};

// Display name during dragging
function blockLabel(block) {
  if (!block) return "Moving block";
  if (block.type === "heading" || block.type === "paragraph") {
    return (
      block.text ||
      (block.type === "heading" ? "Untitled heading" : "Empty paragraph")
    );
  }
  if (block.type === "image") return block.caption || "Image";
  if (block.type === "bulletList")
    return `Bulleted list \xB7 ${block.items.length} items`;
  if (block.type === "numberedList")
    return `Numbered list \xB7 ${block.items.length} items`;
  if (block.type === "todoList")
    return `To-do list \xB7 ${block.items.length} items`;
  if (block.type === "quote") return block.text || "Empty quote";
  if (block.type === "code") return `${block.language} code block`;
  if (block.type === "callout") return block.text || `${block.tone} callout`;
  return "Section divider";
}

// Parse the dragged target
function parseDropId(value) {
  const [targetId, position] = value.split("::");
  if (
    position === "before" ||
    position === "after" ||
    position === "left" ||
    position === "right" ||
    position === "new-row-after"
  ) {
    return { targetId, position };
  }
  return { targetId: value, position: "after" };  // move it behind by default
}

/*
App
│
├── document          当前文档(current document)
├── saveState         保存状态
├── activeBlockId     当前拖动的块(current dragged block)
├── dragMode          鼠标拖还是键盘拖(how to drag)
├── toolbarMenuOpen   添加菜单是否打开(if the barmenu is opened)
├── resetOpen         Reset 弹窗是否打开(if the Reset pop-up is opened)
├── historyOpen       历史版本是否打开(if the history version is opened)
├── historyBusy       是否正在保存历史版本(if it's saving history version)
├── snapshots         所有历史版本(all history version)
├── restoreCandidate  准备恢复的版本(restore the history version)
└── notice            页面提示信息(notice)
*/

function App() {
  const [document, setDocument] = useState(null);
  const [saveState, setSaveState] = useState("loading");
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [dragMode, setDragMode] = useState(null);
  const [toolbarMenuOpen, setToolbarMenuOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [restoreCandidate, setRestoreCandidate] = useState(null);
  const [notice, setNotice] = useState(null);
  // useState is used to control page rendering
  // useRef is used to store some internal data
  const imageInputRef = useRef(null);
  const importInputRef = useRef(null);
  const imageInsertAfterRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const saveSequenceRef = useRef(0);
  const sensors = useSensors(  // two drag methods
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  // Read documents and history when open it
  useEffect(() => {
    let cancelled = false;
    void loadDocument()  //first
      .then((saved) => {
        if (cancelled) return;
        setDocument(saved ? parseDocument(saved) : createSampleDocument());
        setSaveState("saved");
        hasLoadedRef.current = true;
      })
      .catch(() => {
        if (cancelled) return;
        setDocument(createSampleDocument());
        setSaveState("error");
        hasLoadedRef.current = true;
      });
    void loadSnapshots()  //second
      .then((savedSnapshots) => {
        if (!cancelled) setSnapshots(savedSnapshots);
      })
      .catch(() => {
        if (!cancelled)
          setNotice("Version history is unavailable in this browser.");
      });
    return () => {
      cancelled = true;
    };
  }, []);
  // save automatically for each change
  useLayoutEffect(() => {
    if (!document || !hasLoadedRef.current) return;
    const sequence = saveSequenceRef.current + 1;
    saveSequenceRef.current = sequence;
    setSaveState("saving");
    const timeout = window.setTimeout(() => {
      void saveDocument(document)
        .then(() => {
          if (saveSequenceRef.current === sequence) setSaveState("saved");
        })
        .catch(() => {
          if (saveSequenceRef.current === sequence) setSaveState("error");
        });
    }, 550);
    return () => window.clearTimeout(timeout);
  }, [document]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  const persistSnapshot = async (source, label, reason, showSuccess = true) => {
    setHistoryBusy(true);
    try {
      await saveSnapshot(createSnapshot(source, label, reason));
      setSnapshots(await loadSnapshots());
      if (showSuccess) setNotice("Version saved to local history.");
      return true;
    } catch {
      setNotice("This version could not be saved locally.");
      return false;
    } finally {
      setHistoryBusy(false);
    }
  };

  // Modify the existing Block
  const changeBlock = (block) => {
    setDocument((current) =>
      current ? updateBlock(current, block.id, () => block) : current,
    );
  };

  // Add a new Block
  const requestAddBlock = (type, afterBlockId) => {
    if (type === "image") {
      imageInsertAfterRef.current = afterBlockId;
      imageInputRef.current?.click();
      return;
    }
    setDocument((current) =>
      current
        ? insertBlockAfter(current, afterBlockId, createBlock(type))
        : current,
    );
  };

  // Add a new Image Block
  const readImage = (file) => {
    if (!IMAGE_TYPES.includes(file.type)) {
      setNotice("Please choose a PNG, JPEG, WebP or GIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setNotice("That image is larger than the 20 MB limit.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const block = createBlock("image");
      if (block.type !== "image") return;
      block.src = reader.result;
      block.alt = file.name.replace(/\.[^.]+$/, "").replaceAll(/[-_]/g, " ");
      setDocument((current) =>
        current
          ? insertBlockAfter(current, imageInsertAfterRef.current, block)
          : current,
      );
      setNotice("Image added to the document.");
    };
    reader.onerror = () => setNotice("The image could not be read.");
    reader.readAsDataURL(file);
  };

  // which block is dragged
  const activeBlock = (() => {
    if (!document || !activeBlockId) return null;
    const location = findBlockLocation(document, activeBlockId);
    return location
      ? document.rows[location.rowIndex].columns[location.columnIndex].blocks[
      location.blockIndex
      ]
      : null;
  })();
  // when it will start
  const handleDragStart = (event) => {
    setToolbarMenuOpen(false);
    setDragMode(
      event.activatorEvent.type === "keydown" ? "keyboard" : "pointer",
    );
    setActiveBlockId(String(event.active.id));
  };
  // when it will end
  const handleDragEnd = (event) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    setActiveBlockId(null);
    setDragMode(null);
    if (!overId) return;
    const { targetId, position } = parseDropId(overId);
    setDocument((current) => {
      if (!current) return current;
      return position === "new-row-after"
        ? moveBlockToNewRow(current, activeId, targetId)
        : moveBlock(current, activeId, targetId, position);
    });
  };

  // export document to json
  const exportDocument = () => {
    if (!document) return;
    const blob = new Blob([JSON.stringify(document, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${document.title
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "canvas-document"
      }.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Document exported as JSON.");
  };
  // Import json to document
  const importDocument = (file) => {
    if (!document) return;
    const reader = new FileReader();
    reader.onload = () => {
      void (async () => {
        try {
          const parsed = parseDocument(JSON.parse(String(reader.result)));
          const preserved = await persistSnapshot(
            document,
            `Before importing ${file.name}`,
            "before-import",
            false,
          );
          setDocument(touch(parsed));
          setNotice(
            preserved
              ? "Document imported successfully. The previous version was preserved."
              : "Document imported, but the previous version could not be saved.",
          );
        } catch (error) {
          setNotice(
            error instanceof Error
              ? error.message
              : "The document could not be imported.",
          );
        }
      })();
    };
    reader.onerror = () => setNotice("The selected file could not be read.");
    reader.readAsText(file);
  };

  if (!document) {  //Display a loading page if the document has not finished loading
    return (
      <div className="loading-screen">
        <div className="brand-mark">C</div>
        <p>Opening your document…</p>
      </div>
    );
  }
  return (
    /*
    App
    │
    └── DndContext
    │
    ├── app-shell
    │   ├── Header
    │   ├── Document
    │   ├── Footer
    │   ├── Hidden Inputs
    │   ├── Reset Dialog
    │   ├── History Panel
    │   ├── Restore Dialog
    │   └── Toast
    │
    └── DragOverlay
    */

    // DndContext：drag operation
    <DndContext
      sensors={sensors}
      collisionDetection={
        dragMode === "keyboard" ? closestCenter : collisionDetectionStrategy
      }
      onDragStart={handleDragStart}
      onDragCancel={() => {
        setActiveBlockId(null);
        setDragMode(null);
      }}
      onDragEnd={handleDragEnd}
    >
      <div className="app-shell">
        {/* 
        Header
        │
        ├── Logo
        ├── SaveIndicator
        └── Buttons(add block, import, export, history, reset sample)
        */}
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">C</span>
            <span className="brand-copy">
              <strong>Canvas</strong>
              <small>Block-based word processor</small>
            </span>
          </div>
          <div className={`save-indicator save-indicator--${saveState}`}>
            <span aria-hidden="true" />
            {saveState === "loading" && "Loading\u2026"}
            {saveState === "saving" && "Saving\u2026"}
            {saveState === "saved" && "Saved locally"}
            {saveState === "error" && "Local save unavailable"}
          </div>
          <nav className="topbar-actions" aria-label="Document actions">
            <div className="toolbar-add-wrap">
              <button
                className="button button--primary"
                type="button"
                onClick={() => setToolbarMenuOpen((open) => !open)}
              >
                <span aria-hidden="true">＋</span> Add block
              </button>
              {toolbarMenuOpen && (
                <div className="toolbar-menu">
                  <AddBlockMenu
                    onClose={() => setToolbarMenuOpen(false)}
                    onSelect={(type) => {
                      requestAddBlock(type, null);
                      setToolbarMenuOpen(false);
                    }}
                  />
                </div>
              )}
            </div>
            <button
              className="button"
              type="button"
              onClick={() => importInputRef.current?.click()}
            >
              Import
            </button>
            <button className="button" type="button" onClick={exportDocument}>
              Export
            </button>
            <button
              className="button history-button"
              type="button"
              onClick={() => setHistoryOpen(true)}
            >
              History
              {snapshots.length > 0 && (
                <span aria-label={`${snapshots.length} saved versions`}>
                  {snapshots.length}
                </span>
              )}
            </button>
            <button
              className="button button--quiet"
              type="button"
              onClick={() => setResetOpen(true)}
            >
              Reset sample
            </button>
          </nav>
        </header>

        <div className="document-wrap">
          {/* Passe data and functions(Add/modify/delete Blocks, adjust layouts) to EditorCanvas for display and manipulation */}
          <EditorCanvas   // EditorCanvas.jsx
            document={document}
            activeBlockId={dragMode === "pointer" ? activeBlockId : null}
            onBlockChange={changeBlock}
            onAddBlock={requestAddBlock}
            onDeleteBlock={(blockId) =>
              setDocument((current) =>
                current ? deleteBlock(current, blockId) : current,
              )
            }
            onResizeRow={(rowId, width) =>
              setDocument((current) =>
                current ? resizeColumns(current, rowId, width) : current,
              )
            }
          />

          {/* Add a Paragraph and insert it at the end */}
          <button
            className="end-add"
            type="button"
            onClick={() => requestAddBlock("paragraph", null)}
          >
            <span>＋</span> Continue writing
          </button>
        </div>

        <footer className="app-footer">
          <span>Please don’t make me use Microsoft Word</span>
        </footer>

        {/* Upload image */}
        <input
          ref={imageInputRef}
          className="visually-hidden"
          type="file"
          accept={IMAGE_TYPES.join(",")}
          aria-label="Upload image"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) readImage(file);
            event.target.value = "";
          }}
        />

        {/* Import JSON document */}
        <input
          ref={importInputRef}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          aria-label="Import JSON document"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) importDocument(file);
            event.target.value = "";
          }}
        />

        {/* Display the "Reset Document" pop-up window */}
        {resetOpen && (
          <div className="modal-backdrop" role="presentation">
            <section
              className="confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="reset-title"
            >
              <span className="dialog-icon" aria-hidden="true">
                ↺
              </span>
              <h2 id="reset-title">Reset the sample document?</h2>
              <p>
                Your current local document will be replaced by the original
                example.
              </p>
              <div className="dialog-actions">
                <button
                  className="button"
                  type="button"
                  onClick={() => setResetOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="button button--danger"
                  type="button"
                  onClick={() => {
                    void (async () => {
                      const preserved = await persistSnapshot(
                        document,
                        "Before resetting the sample",
                        "before-reset",
                        false,
                      );
                      setDocument(createSampleDocument());
                      setResetOpen(false);
                      setNotice(
                        preserved
                          ? "Sample restored. The previous document is in version history."
                          : "Sample restored, but the previous version could not be saved.",
                      );
                    })();
                  }}
                >
                  Reset document
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Display the "Version History" panel */}
        {historyOpen && (
          <VersionHistoryPanel  // VersionHistoryPanel.jsx
            snapshots={snapshots}
            busy={historyBusy}
            onClose={() => setHistoryOpen(false)}
            onSave={(label) =>
              persistSnapshot(
                document,
                label || `Version ${snapshots.length + 1}`,
                "manual",
              )
            }
            onRestore={setRestoreCandidate}
          />
        )}

        {/* Display the confirmation dialog box for "Restore Version" */}
        {restoreCandidate && (
          <div className="modal-backdrop restore-backdrop" role="presentation">
            <section
              className="confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="restore-title"
            >
              <span
                className="dialog-icon dialog-icon--history"
                aria-hidden="true"
              >
                ↶
              </span>
              <h2 id="restore-title">Restore “{restoreCandidate.label}”?</h2>
              <p>
                This replaces the current document with the selected snapshot.
                Create a separate named version first if you need to keep the
                current state.
              </p>
              <div className="dialog-actions">
                <button
                  className="button"
                  type="button"
                  onClick={() => setRestoreCandidate(null)}
                >
                  Cancel
                </button>
                <button
                  className="button button--primary"
                  type="button"
                  disabled={historyBusy}
                  onClick={() => {
                    const candidate = restoreCandidate;
                    setDocument(touch(parseDocument(candidate.document)));
                    setRestoreCandidate(null);
                    setHistoryOpen(false);
                    setNotice(`Restored \u201C${candidate.label}\u201D.`);
                  }}
                >
                  Restore version
                </button>
              </div>
            </section>
          </div>
        )}

        {/* pop-up notification */}
        {notice && (
          <div className="toast" role="status">
            <span aria-hidden="true">✓</span>
            {notice}
          </div>
        )}
      </div>

      {/* Display a preview that follows the mouse movement
      it automatically adapts according to different Blocks */}
      <DragOverlay>
        {activeBlockId && (
          <div className="drag-overlay">
            <span aria-hidden="true">⠿</span>
            {blockLabel(activeBlock)}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
export { App as default };


/*
App.jsx
│
├── 1. 定义状态（useState）
│      document
│      snapshots
│      notice
│      historyOpen
│      restoreCandidate
│
├── 2. 副作用（useEffect）
│      加载文档
│      自动保存
│      Toast 自动消失
│
├── 3. 定义业务函数
│      addBlock()
│      changeBlock()
│      deleteBlock()
│      importDocument()
│      exportDocument()
│      persistSnapshot()
│      handleDragEnd()
│
├── 4. 返回页面（JSX）
│      Header
│      EditorCanvas
│      Footer
│      Hidden Input
│      Reset Dialog
│      History Panel
│      Restore Dialog
│      Toast
│      DragOverlay
│
└── 5. 导出 App
*/
