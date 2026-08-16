const MIN_COLUMN_WIDTH = 20;
const MAX_COLUMN_WIDTH = 80;
const createId = (prefix) =>
  `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
// In requestAddBlock() App.jsx
function createBlock(type) {
  const format = {
    bold: false,
    italic: false,
    underline: false,
    align: "left",
  };
  switch (type) {
    case "heading":
      return { id: createId("block"), type, level: 2, text: "", format };
    case "image":
      return {
        id: createId("block"),
        type,
        src: "",
        alt: "",
        caption: "",
        width: 100,
      };
    case "bulletList":
    case "numberedList":
      return {
        id: createId("block"),
        type,
        items: [{ id: createId("item"), text: "" }],
        format,
      };
    case "todoList":
      return {
        id: createId("block"),
        type,
        items: [{ id: createId("item"), text: "", checked: false }],
        format,
      };
    case "quote":
      return { id: createId("block"), type, text: "", attribution: "", format };
    case "code":
      return { id: createId("block"), type, code: "", language: "plain" };
    case "callout":
      return { id: createId("block"), type, text: "", tone: "info", format };
    case "divider":
      return { id: createId("block"), type };
    default:
      return { id: createId("block"), type: "paragraph", text: "", format };
  }
}

// A sample image 
const sampleArt = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#e8f4ef"/>
      <stop offset="1" stop-color="#f7ddcb"/>
    </linearGradient>
    <linearGradient id="hill" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#184e57"/>
      <stop offset="1" stop-color="#2f7670"/>
    </linearGradient>
  </defs>
  <rect width="900" height="620" rx="28" fill="url(#sky)"/>
  <circle cx="720" cy="128" r="68" fill="#ef8d62" opacity=".9"/>
  <path d="M0 480 220 258l102 113 112-161 219 270Z" fill="#98b9a9"/>
  <path d="M260 500 472 198l254 302Z" fill="url(#hill)"/>
  <path d="m420 273 52-75 62 74-45-20Z" fill="#fff8ef"/>
  <path d="M0 480c160-32 246-17 355 34 136 64 300 31 545-44v150H0Z" fill="#f5b36e"/>
  <path d="M0 520c164-35 291-5 404 47 112 51 296 28 496-32v85H0Z" fill="#db6f52"/>
  <g fill="#143f46">
    <path d="m124 458 22-98 22 98Z"/><rect x="142" y="443" width="8" height="54"/>
    <path d="m184 478 27-126 27 126Z"/><rect x="207" y="460" width="8" height="54"/>
    <path d="m780 486 24-113 24 113Z"/><rect x="800" y="470" width="8" height="50"/>
  </g>
  <text x="54" y="86" fill="#143f46" font-family="Georgia,serif" font-size="42"></text>
  <text x="54" y="132" fill="#143f46" font-family="Georgia,serif" font-size="42" font-style="italic"></text>
</svg>`;

// create sample document
const sampleArtDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sampleArt)}`;
function createSampleDocument() {
  return {
    version: 1,
    title: "Writing with blocks, not hidden layout rules",
    updatedAt: /* @__PURE__ */ new Date().toISOString(),
    rows: [
      {
        id: createId("row"),
        columns: [
          {
            id: createId("column"),
            width: 100,
            blocks: [
              {
                id: createId("block"),
                type: "paragraph",
                text: "Every piece of content has a visible boundary, can be moved independently, and can be placed beside another block.",
              },
            ],
          },
        ],
      },
      {
        id: createId("row"),
        columns: [
          {
            id: createId("column"),
            width: 44,
            blocks: [
              {
                id: createId("block"),
                type: "image",
                src: sampleArtDataUrl,
                alt: "A stylised landscape representing arranged ideas",
                caption:
                  "Resize this image, drag it to another position, or place content beside it.",
                width: 100,
              },
            ],
          },
          {
            id: createId("column"),
            width: 56,
            blocks: [
              {
                id: createId("block"),
                type: "heading",
                level: 2,
                text: "A sample document",
              },
              {
                id: createId("block"),
                type: "paragraph",
                text: "Drag a block above or below another one to reorder the document. Drop it on a side edge to create a column, then drag the divider to control the layout.",
              },
              {
                id: createId("block"),
                type: "todoList",
                items: [
                  {
                    id: createId("item"),
                    text: "This is a todoList",
                    checked: true,
                  },
                  {
                    id: createId("item"),
                    text: "Do homework",
                    checked: true,
                  },
                  {
                    id: createId("item"),
                    text: "Do homework",
                    checked: true,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: createId("row"),
        columns: [
          {
            id: createId("column"),
            width: 100,
            blocks: [
              {
                id: createId("block"),
                type: "callout",
                tone: "success",
                text: "Changes save automatically in this browser. Use History when you want to create a named checkpoint that can be restored later.",
              },
              {
                id: createId("block"),
                type: "divider",
              },
            ],
          },
        ],
      },
      {
        id: createId("row"),
        columns: [
          {
            id: createId("column"),
            width: 100,
            blocks: [
              {
                id: createId("block"),
                type: "quote",
                text: "Books are the ladder of human progress.",
                attribution: "Maxim Gorky",
              },
              {
                id: createId("block"),
                type: "numberedList",
                items: [
                  {
                    id: createId("item"),
                    text: "This is a numberedList",
                  },
                  {
                    id: createId("item"),
                    text: "Arrange blocks and resize columns or images",
                  },
                  {
                    id: createId("item"),
                    text: "Save a named version or export a portable JSON file",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: createId("row"),
        columns: [
          {
            id: createId("column"),
            width: 100,
            blocks: [
              {
                id: createId("block"),
                type: "code",
                language: "python",
                code: "name = input('Please write down your name：')\n\nprint('Hello, ' + name)",
              },
              {
                id: createId("block"),
                type: "bulletList",
                items: [
                  { id: createId("item"), text: "This is a bulletList" },
                  {
                    id: createId("item"),
                    text: "Ten supported block types",
                  },
                  {
                    id: createId("item"),
                    text: "Local autosave and named versions",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

// Locate the position of this block in the document according to the blockId (row index,column index, block index)
function findBlockLocation(document, blockId) {
  for (let rowIndex = 0; rowIndex < document.rows.length; rowIndex += 1) {
    const row = document.rows[rowIndex];
    for (
      let columnIndex = 0;
      columnIndex < row.columns.length;
      columnIndex += 1
    ) {
      const blockIndex = row.columns[columnIndex].blocks.findIndex(
        (block) => block.id === blockId,
      );
      if (blockIndex !== -1) return { rowIndex, columnIndex, blockIndex };
    }
  }
  return null;
}
function cloneDocument(document) {
  return structuredClone(document);
}

// Clean up the document structure to ensure the entire document remains valid at all times
function normaliseRows(rows) {
  const cleaned = rows
    .map((row) => ({
      ...row,
      columns: row.columns.filter((column) => column.blocks.length > 0),
    }))
    .filter((row) => row.columns.length > 0);
  if (cleaned.length === 0) {
    return [
      {
        id: createId("row"),   //block->column->row
        columns: [
          {
            id: createId("column"),
            width: 100,
            blocks: [createBlock("paragraph")],
          },
        ],
      },
    ];
  }
  return cleaned.map((row) => {
    if (row.columns.length === 1) {
      return { ...row, columns: [{ ...row.columns[0], width: 100 }] };
    }
    const total = row.columns.reduce(
      (sum, column) => sum + (Number.isFinite(column.width) ? column.width : 0),
      0,
    );
    const equalWidth = 100 / row.columns.length;
    return {
      ...row,
      columns: row.columns.map((column) => ({
        ...column,
        width: total > 0 ? (column.width / total) * 100 : equalWidth,
      })),
    };
  });
}

// clone->findLocation->update->touch
function updateBlock(document, blockId, updater) {
  const next = cloneDocument(document);
  const location = findBlockLocation(next, blockId);
  if (!location) return document;
  const { rowIndex, columnIndex, blockIndex } = location;
  const block = next.rows[rowIndex].columns[columnIndex].blocks[blockIndex];
  next.rows[rowIndex].columns[columnIndex].blocks[blockIndex] = updater(block);
  return touch(next);
}

// Add block
function insertBlockAfter(document, afterBlockId, block) {
  const next = cloneDocument(document);
  if (afterBlockId) {
    const location = findBlockLocation(next, afterBlockId);
    if (location) {
      next.rows[location.rowIndex].columns[location.columnIndex].blocks.splice(
        location.blockIndex + 1,
        0,
        block,
      );
      return touch(next);
    }
  }
  const lastRow = next.rows.at(-1);
  const lastColumn = lastRow?.columns.at(-1);
  if (lastColumn) {
    lastColumn.blocks.push(block);
  } else {
    next.rows.push({
      id: createId("row"),
      columns: [{ id: createId("column"), width: 100, blocks: [block] }],
    });
  }
  return touch(next);
}

// Delete block
function deleteBlock(document, blockId) {
  const next = cloneDocument(document);
  const location = findBlockLocation(next, blockId);
  if (!location) return document;
  next.rows[location.rowIndex].columns[location.columnIndex].blocks.splice(
    location.blockIndex,
    1,
  );
  next.rows = normaliseRows(next.rows);
  return touch(next);
}

// move block
function moveBlock(document, activeId, targetId, position) {
  if (activeId === targetId) return document;
  const next = cloneDocument(document);
  const activeLocation = findBlockLocation(next, activeId);
  if (!activeLocation) return document;
  const [activeBlock] = next.rows[activeLocation.rowIndex].columns[
    activeLocation.columnIndex
  ].blocks.splice(activeLocation.blockIndex, 1);
  next.rows = normaliseRows(next.rows);
  const targetLocation = findBlockLocation(next, targetId);
  if (!targetLocation) return document;
  const targetRow = next.rows[targetLocation.rowIndex];
  if (position === "before" || position === "after") {  //Drag to reorder vertically
    const insertAt = targetLocation.blockIndex + (position === "after" ? 1 : 0);
    targetRow.columns[targetLocation.columnIndex].blocks.splice(
      insertAt,
      0,
      activeBlock,
    );
  } else {    // A side drop always creates a column beside the target column.
    const columnCount = targetRow.columns.length + 1;
    const newWidth = 100 / columnCount;
    targetRow.columns.forEach((column) => {
      column.width *= (columnCount - 1) / columnCount;
    });
    const newColumn = {
      id: createId("column"),
      width: newWidth,
      blocks: [activeBlock],
    };
    const insertAt =
      targetLocation.columnIndex + (position === "right" ? 1 : 0);
    targetRow.columns.splice(insertAt, 0, newColumn);
  }
  next.rows = normaliseRows(next.rows);
  return touch(next);
}

// Drag a block to a new row, extend the drag target from 'blocks' to 'rows'
function moveBlockToNewRow(document, activeId, targetRowId) {
  const next = cloneDocument(document);
  const activeLocation = findBlockLocation(next, activeId);
  if (!activeLocation) return document;
  const [activeBlock] = next.rows[activeLocation.rowIndex].columns[
    activeLocation.columnIndex
  ].blocks.splice(activeLocation.blockIndex, 1);
  next.rows = normaliseRows(next.rows);
  const targetRowIndex = next.rows.findIndex((row) => row.id === targetRowId);
  if (targetRowIndex === -1) return document;
  next.rows.splice(targetRowIndex + 1, 0, {
    id: createId("row"),
    columns: [
      {
        id: createId("column"),
        width: 100,
        blocks: [activeBlock],
      },
    ],
  });
  return touch(next);
}

// Modify the widths of the two columns in the two-column layout
function resizeColumns(document, rowId, dividerIndexOrWidth, requestedWidth) {
  const next = cloneDocument(document);
  const row = next.rows.find((candidate) => candidate.id === rowId);
  if (!row || row.columns.length < 2) return document;
  // Keep the original three-argument API working for imported code and tests.
  const dividerIndex = requestedWidth === undefined ? 0 : dividerIndexOrWidth;
  const desiredWidth =
    requestedWidth === undefined ? dividerIndexOrWidth : requestedWidth;
  if (dividerIndex < 0 || dividerIndex >= row.columns.length - 1) {
    return document;
  }
  const pairTotal =
    row.columns[dividerIndex].width + row.columns[dividerIndex + 1].width;
  const minimum = Math.min(MIN_COLUMN_WIDTH, pairTotal / 2);
  const width = Math.min(pairTotal - minimum, Math.max(minimum, desiredWidth));
  row.columns[dividerIndex].width = width;
  row.columns[dividerIndex + 1].width = pairTotal - width;
  return touch(next);
}

// update time
function touch(document) {
  return { ...document, updatedAt: /* @__PURE__ */ new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// Selection-based formatting
//
// Text blocks keep a plain `text` string for the editor surface plus an
// optional array of `runs`. A run is { text, bold?, italic?, underline? }.
// Undefined flags inherit the block-level format, so legacy documents that
// have no runs keep working unchanged.
// ---------------------------------------------------------------------------

const RUN_FORMAT_KEYS = ["bold", "italic", "underline"];

const isRunFormatValue = (value) =>
  value === undefined || typeof value === "boolean";

function runFormat(run) {
  return {
    bold: run.bold,
    italic: run.italic,
    underline: run.underline,
  };
}

function runsMatchText(runs, text) {
  if (!Array.isArray(runs)) return false;
  return (
    runs.every(
      (run) =>
        run &&
        typeof run === "object" &&
        isString(run.text) &&
        run.text.length > 0 &&
        isRunFormatValue(run.bold) &&
        isRunFormatValue(run.italic) &&
        isRunFormatValue(run.underline),
    ) && runs.map((run) => run.text).join("") === text
  );
}

function isRuns(value, text) {
  if (value === undefined) return true;
  return runsMatchText(value, text);
}

function mergeAdjacentRuns(runs) {
  const merged = [];
  for (const run of runs) {
    const previous = merged.at(-1);
    if (
      previous &&
      previous.bold === run.bold &&
      previous.italic === run.italic &&
      previous.underline === run.underline
    ) {
      previous.text += run.text;
    } else {
      merged.push({ ...run });
    }
  }
  return merged.filter((run) => run.text.length > 0);
}

function collapseRuns(runs) {
  const merged = mergeAdjacentRuns(runs);
  const hasFormatting = merged.some(
    (run) =>
      run.bold !== undefined ||
      run.italic !== undefined ||
      run.underline !== undefined,
  );
  return hasFormatting ? merged : undefined;
}

// Keep run styles attached to their text while a single contiguous edit
// (typing, deleting a selection, or pasting) changes the plain text.
function editTextRuns(oldText, runs, newText) {
  if (!runsMatchText(runs, oldText)) return undefined;
  const sourceRuns = runs ?? [];
  let prefix = 0;
  const minLength = Math.min(oldText.length, newText.length);
  while (prefix < minLength && oldText[prefix] === newText[prefix]) prefix += 1;

  let oldSuffix = oldText.length;
  let newSuffix = newText.length;
  while (
    oldSuffix > prefix &&
    newSuffix > prefix &&
    oldText[oldSuffix - 1] === newText[newSuffix - 1]
  ) {
    oldSuffix -= 1;
    newSuffix -= 1;
  }

  const inserted = newText.slice(prefix, newSuffix);
  const before = [];
  const after = [];
  let styleAtPrefix = {};
  let styleFound = false;
  let position = 0;

  for (const run of sourceRuns) {
    const runStart = position;
    const runEnd = position + run.text.length;
    position = runEnd;
    if (runEnd <= prefix) {
      before.push(run);
      if (runEnd === prefix) {
        styleAtPrefix = runFormat(run);
        styleFound = true;
      }
      continue;
    }
    if (runStart >= oldSuffix) {
      after.push(run);
      continue;
    }
    const style = runFormat(run);
    const beforeText = run.text.slice(0, Math.max(0, prefix - runStart));
    const afterText = run.text.slice(Math.max(0, oldSuffix - runStart));
    if (beforeText) before.push({ ...style, text: beforeText });
    if (afterText) after.push({ ...style, text: afterText });
    if (!styleFound) {
      styleAtPrefix = style;
      styleFound = true;
    }
  }

  if (!styleFound) {
    const edgeRun = prefix === 0 ? sourceRuns[0] : sourceRuns.at(-1);
    styleAtPrefix = edgeRun ? runFormat(edgeRun) : {};
  }

  return collapseRuns([
    ...before,
    ...(inserted ? [{ ...styleAtPrefix, text: inserted }] : []),
    ...after,
  ]);
}

// Toggle one inline flag for the selected range. The effective value for the
// range comes from the run itself, falling back to the block-level format.
function toggleRunsFormat(text, runs, start, end, key, blockFormat) {
  if (!isString(text) || !RUN_FORMAT_KEYS.includes(key)) return runs;
  const safeStart = Math.max(0, Math.min(start, text.length));
  const safeEnd = Math.max(safeStart, Math.min(end, text.length));
  const sourceRuns =
    runsMatchText(runs, text) && runs?.length ? runs : text ? [{ text }] : [];
  const result = [];
  let position = 0;

  for (const run of sourceRuns) {
    const runStart = position;
    const runEnd = position + run.text.length;
    position = runEnd;
    if (runEnd <= safeStart || runStart >= safeEnd) {
      result.push(run);
      continue;
    }
    const beforeText = run.text.slice(0, Math.max(0, safeStart - runStart));
    const insideText = run.text.slice(
      Math.max(0, safeStart - runStart),
      Math.max(0, safeEnd - runStart),
    );
    const afterText = run.text.slice(Math.max(0, safeEnd - runStart));
    if (beforeText) result.push({ ...run, text: beforeText });
    if (insideText) {
      const current = run[key];
      const effective =
        current === undefined ? Boolean(blockFormat?.[key]) : current;
      result.push({ ...run, text: insideText, [key]: !effective });
    }
    if (afterText) result.push({ ...run, text: afterText });
  }

  return collapseRuns(result);
}

// Data validation(isString, isBlock, parseDocument)
const isString = (value) => typeof value === "string";

function isFormat(value) {
  if (value === undefined) return true;
  return (
    value &&
    typeof value === "object" &&
    typeof value.bold === "boolean" &&
    typeof value.italic === "boolean" &&
    typeof value.underline === "boolean" &&
    ["left", "center", "right", "justify"].includes(value.align)
  );
}

function isBlock(value) {
  if (!value || typeof value !== "object") return false;
  const block = value;
  if (!isString(block.id) || !isString(block.type)) return false;  // block must have id and type
  // different type of blocks have different requirements
  if (block.type === "paragraph") {
    return (
      isString(block.text) &&
      isFormat(block.format) &&
      isRuns(block.runs, block.text)
    );
  }
  if (block.type === "heading") {
    return (
      isString(block.text) &&
      (block.level === 1 || block.level === 2) &&
      isFormat(block.format) &&
      isRuns(block.runs, block.text)
    );
  }
  if (block.type === "image") {
    return (
      isString(block.src) &&
      isString(block.alt) &&
      isString(block.caption) &&
      block.src.startsWith("data:image/") &&
      (block.width === void 0 ||
        (typeof block.width === "number" &&
          Number.isFinite(block.width) &&
          block.width >= 20 &&
          block.width <= 100))
    );
  }
  if (block.type === "bulletList" || block.type === "numberedList") {
    return (
      Array.isArray(block.items) &&
      block.items.every((item) => {
        if (!item || typeof item !== "object") return false;
        const candidate = item;
        return (
          isString(candidate.id) &&
          isString(candidate.text) &&
          isRuns(candidate.runs, candidate.text)
        );
      }) &&
      isFormat(block.format)
    );
  }
  if (block.type === "todoList") {
    return (
      Array.isArray(block.items) &&
      block.items.every((item) => {
        if (!item || typeof item !== "object") return false;
        const candidate = item;
        return (
          isString(candidate.id) &&
          isString(candidate.text) &&
          typeof candidate.checked === "boolean" &&
          isRuns(candidate.runs, candidate.text)
        );
      }) &&
      isFormat(block.format)
    );
  }
  if (block.type === "quote") {
    return (
      isString(block.text) &&
      isString(block.attribution) &&
      isFormat(block.format) &&
      isRuns(block.runs, block.text)
    );
  }
  if (block.type === "code") {
    return (
      isString(block.code) &&
      (block.language === "plain" ||
        block.language === "javascript" ||
        block.language === "typescript" ||
        block.language === "python" ||
        block.language === "html" ||
        block.language === "css")
    );
  }
  if (block.type === "callout") {
    return (
      isString(block.text) &&
      isFormat(block.format) &&
      isRuns(block.runs, block.text) &&
      (block.tone === "info" ||
        block.tone === "warning" ||
        block.tone === "success")
    );
  }
  if (block.type === "divider") return true;
  return false;
}

// Verify the validity of documents during JSON import
function parseDocument(value) {
  if (!value || typeof value !== "object") {
    throw new Error("The selected file does not contain a document.");
  }
  const document = value;
  if (document.version !== 1) {
    throw new Error("This document version is not supported.");
  }
  if (
    !isString(document.title) ||
    !isString(document.updatedAt) ||
    !Array.isArray(document.rows) ||
    document.rows.length === 0
  ) {
    throw new Error("The document is missing required fields.");
  }
  const validRows = document.rows.every(
    (row) =>
      row &&
      isString(row.id) &&
      Array.isArray(row.columns) &&
      row.columns.length >= 1 &&
      row.columns.every(
        (column) =>
          column &&
          isString(column.id) &&
          typeof column.width === "number" &&
          Number.isFinite(column.width) &&
          Array.isArray(column.blocks) &&
          column.blocks.length > 0 &&
          column.blocks.every(isBlock),
      ),
  );
  if (!validRows) throw new Error("The document structure is invalid.");
  return cloneDocument(document);
}
export {
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  createBlock,
  createId,
  createSampleDocument,
  deleteBlock,
  editTextRuns,
  findBlockLocation,
  insertBlockAfter,
  moveBlock,
  moveBlockToNewRow,
  parseDocument,
  resizeColumns,
  sampleArtDataUrl,
  toggleRunsFormat,
  touch,
  updateBlock,
};


/*
document.js
│
├── ① 常量和ID生成
│      createId()
│
├── ② 创建数据
│      createBlock()
│      createSampleDocument()
│
├── ③ 查找
│      findBlockLocation()
│
├── ④ 更新
│      updateBlock()
│      insertBlockAfter()
│      deleteBlock()
│
├── ⑤ 拖拽
│      moveBlock()
│      moveBlockToNewRow()
│
├── ⑥ 调整布局
│      resizeColumns()
│      normaliseRows()
│
├── ⑦ 导入校验
│      isBlock()
│      parseDocument()
│
└── ⑧ 工具函数
       cloneDocument()
       touch()
*/

/*
createSampleDocument()：创建初始示例文档。
• createBlock()：新建一个指定类型的块。
• updateBlock()：修改块内容。
• insertBlockAfter()：在某个块后插入新块。
• deleteBlock()：删除块。
• moveBlock()：拖拽移动块（上下、左右分栏）。
• moveBlockToNewRow()：拖到 New Row Drop Zone，生成新的整行。
• resizeColumns()：调整双栏宽度。
• parseDocument()：导入 JSON 时验证文档是否合法。
• touch()：更新时间戳。
*/
