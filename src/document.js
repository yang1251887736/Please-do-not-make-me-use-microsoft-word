const MIN_COLUMN_WIDTH = 20;
const MAX_COLUMN_WIDTH = 80;
const createId = (prefix) =>
  `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
// In requestAddBlock() App.jsx
function createBlock(type) {
  switch (type) {
    case "heading":
      return { id: createId("block"), type, level: 2, text: "" };
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
      };
    case "todoList":
      return {
        id: createId("block"),
        type,
        items: [{ id: createId("item"), text: "", checked: false }],
      };
    case "quote":
      return { id: createId("block"), type, text: "", attribution: "" };
    case "code":
      return { id: createId("block"), type, code: "", language: "plain" };
    case "callout":
      return { id: createId("block"), type, text: "", tone: "info" };
    case "divider":
      return { id: createId("block"), type };
    default:
      return { id: createId("block"), type: "paragraph", text: "" };
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
    const first = Math.min(  // Width Correction
      MAX_COLUMN_WIDTH,
      Math.max(MIN_COLUMN_WIDTH, row.columns[0].width),  
    );
    return {
      ...row,
      columns: [
        { ...row.columns[0], width: first },
        { ...row.columns[1], width: 100 - first },
      ],
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
  } else if (targetRow.columns.length === 1) {    // Drag horizontally to create columns
    const targetColumn = targetRow.columns[0];
    const newColumn = {
      id: createId("column"),
      width: 50,
      blocks: [activeBlock],
    };
    targetColumn.width = 50;
    targetRow.columns =
      position === "left"
        ? [newColumn, targetColumn]
        : [targetColumn, newColumn];
  } else { 
    const sideIndex = position === "left" ? 0 : 1;   // Drag onto an existing column to append content
    targetRow.columns[sideIndex].blocks.push(activeBlock);
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
function resizeColumns(document, rowId, firstColumnWidth) {
  const next = cloneDocument(document);
  const row = next.rows.find((candidate) => candidate.id === rowId);
  if (!row || row.columns.length !== 2) return document;
  const width = Math.min(
    MAX_COLUMN_WIDTH,
    Math.max(MIN_COLUMN_WIDTH, firstColumnWidth),
  );
  row.columns[0].width = width;
  row.columns[1].width = 100 - width;
  return touch(next);
}

// update time
function touch(document) {
  return { ...document, updatedAt: /* @__PURE__ */ new Date().toISOString() };
}

// Data validation(isString, isBlock, parseDocument)
const isString = (value) => typeof value === "string";

function isBlock(value) {
  if (!value || typeof value !== "object") return false;
  const block = value;
  if (!isString(block.id) || !isString(block.type)) return false;  // block must have id and type
  // different type of blocks have different requirements
  if (block.type === "paragraph") return isString(block.text);
  if (block.type === "heading") {
    return isString(block.text) && (block.level === 1 || block.level === 2);
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
        return isString(candidate.id) && isString(candidate.text);
      })
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
          typeof candidate.checked === "boolean"
        );
      })
    );
  }
  if (block.type === "quote") {
    return isString(block.text) && isString(block.attribution);
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
      row.columns.length <= 2 &&
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
  findBlockLocation,
  insertBlockAfter,
  moveBlock,
  moveBlockToNewRow,
  parseDocument,
  resizeColumns,
  sampleArtDataUrl,
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