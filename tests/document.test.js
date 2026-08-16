// Operation functions testing(document.jsx)
/*
# Document Operations
1. Insert and update blocks without modifying the original document
Insert a new Block and edit its content, verify that the new document is updated successfully while the original document remains unchanged (to verify immutable updates).

2. Move blocks to positions before or after a target block across different rows
Drag a Block to the front or rear of another Block across Rows, and verify that both the sequence of Blocks and their affiliated Rows are updated correctly.

3. Generate a two-column row via side placement dragging
Drag a Block to the left side of the target Block, verify that the original single-column Row is automatically converted into a two-column layout with each column occupying 50% of the total width.

4. Place dragged blocks into the corresponding column for existing two-column layouts
When the target Row already features a two-column layout, drag a Block to either the left or right side and confirm the Block is placed into the matched column instead of generating additional new columns.

5. Move a block from a column layout to a new full-width row
Drag a Block out from a two-column layout into the New Row Drop Zone, verify the Block is transferred to a new full-width Row (100% width), and the original Row automatically reverts to a single-column layout.

6. Restrict column widths within the range of 20% to 80%
Adjust column widths and confirm the width value of each column is always clamped between 20% and 80% to avoid excessively wide or narrow columns.

7. Retain an empty paragraph upon deletion of the final block
Delete the last Block in the document, verify the system automatically generates a blank Paragraph to prevent the document from being empty.

8. Instantiate all supported block types
Create each supported Block type one by one (Paragraph, Heading, Image, List, Quote, Code, Callout, Divider), and verify the default data structure of each Block is correct.

# Document Import Validation
1. Properly parse and import valid Version 1 documents
Import a standard valid Version 1 document, confirm the parseDocument() function parses the file and returns the document data normally.

2. Block imports of unsupported document versions and documents containing remote image URLs
Attempt to import documents with invalid version numbers or files embedded with remote image URLs, verify the import process terminates with error exceptions thrown.

3. Support legacy image resources and validate configurable image width values
Confirm legacy image assets (entries without a width attribute) can be imported normally, and validate that image width values are constrained to the valid range of 20% to 100%.

4. Perform validity checks on extended block fields
Validate the field validity of extended Block types (Quote, Code, Callout, Divider). For instance, the language attribute of Code blocks must correspond to officially supported languages; otherwise, the import process will fail.
*/
import {
  createBlock,
  deleteBlock,
  insertBlockAfter,
  moveBlock,
  moveBlockToNewRow,
  parseDocument,
  resizeColumns,
  updateBlock,
} from "../src/document";
const paragraph = (id, text) => ({
  id,
  type: "paragraph",
  text,
});
function fixture() {
  return {
    version: 1,
    title: "Test",
    updatedAt: "2026-01-01T00:00:00.000Z",
    rows: [
      {
        id: "row-1",
        columns: [
          {
            id: "column-1",
            width: 100,
            blocks: [paragraph("a", "Alpha"), paragraph("b", "Beta")],
          },
        ],
      },
      {
        id: "row-2",
        columns: [
          {
            id: "column-2",
            width: 100,
            blocks: [paragraph("c", "Gamma")],
          },
        ],
      },
    ],
  };
}
describe("document operations", () => {
  //1
  it("inserts and updates blocks without mutating the original document", () => {
    const original = fixture();
    const inserted = insertBlockAfter(original, "a", paragraph("new", "New"));
    const updated = updateBlock(inserted, "new", (block) => ({
      ...block,
      text: "Updated",
    }));
    expect(original.rows[0].columns[0].blocks.map((block) => block.id)).toEqual(
      ["a", "b"],
    );
    expect(updated.rows[0].columns[0].blocks.map((block) => block.id)).toEqual([
      "a",
      "new",
      "b",
    ]);
    expect(updated.rows[0].columns[0].blocks[1]).toMatchObject({
      text: "Updated",
    });
  });
  //2
  it("moves blocks before and after a target across rows", () => {
    const before = moveBlock(fixture(), "c", "a", "before");
    expect(before.rows).toHaveLength(1);
    expect(before.rows[0].columns[0].blocks.map((block) => block.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
    const after = moveBlock(fixture(), "a", "c", "after");
    expect(after.rows[0].columns[0].blocks.map((block) => block.id)).toEqual([
      "b",
    ]);
    expect(after.rows[1].columns[0].blocks.map((block) => block.id)).toEqual([
      "c",
      "a",
    ]);
  });
  //3
  it("creates a two-column row by dropping on a side", () => {
    const moved = moveBlock(fixture(), "c", "a", "left");
    expect(moved.rows).toHaveLength(1);
    expect(moved.rows[0].columns).toHaveLength(2);
    expect(moved.rows[0].columns[0].blocks[0].id).toBe("c");
    expect(moved.rows[0].columns[1].blocks.map((block) => block.id)).toEqual([
      "a",
      "b",
    ]);
    expect(moved.rows[0].columns.map((column) => column.width)).toEqual([
      50, 50,
    ]);
  });
  //4
  it("creates a third column beside the targeted column", () => {
    const twoColumns = moveBlock(fixture(), "c", "a", "right");
    const movedAgain = moveBlock(twoColumns, "b", "c", "left");
    expect(movedAgain.rows[0].columns).toHaveLength(3);
    expect(
      movedAgain.rows[0].columns.map((column) =>
        column.blocks.map((block) => block.id),
      ),
    ).toEqual([["a"], ["b"], ["c"]]);
    expect(
      movedAgain.rows[0].columns.reduce((sum, column) => sum + column.width, 0),
    ).toBeCloseTo(100);
  });
  //5
  it("moves a block out of columns into a new full-width row", () => {
    const twoColumns = moveBlock(fixture(), "c", "a", "right");
    const targetRowId = twoColumns.rows[0].id;
    const moved = moveBlockToNewRow(twoColumns, "c", targetRowId);
    expect(moved.rows).toHaveLength(2);
    expect(moved.rows[0].columns).toHaveLength(1);
    expect(moved.rows[0].columns[0].width).toBe(100);
    expect(moved.rows[0].columns[0].blocks.map((block) => block.id)).toEqual([
      "a",
      "b",
    ]);
    expect(moved.rows[1].columns).toHaveLength(1);
    expect(moved.rows[1].columns[0].width).toBe(100);
    expect(moved.rows[1].columns[0].blocks.map((block) => block.id)).toEqual([
      "c",
    ]);
  });
  //6
  it("clamps column widths between 20 and 80 percent", () => {
    const twoColumns = moveBlock(fixture(), "c", "a", "right");
    const rowId = twoColumns.rows[0].id;
    expect(
      resizeColumns(twoColumns, rowId, 4).rows[0].columns.map(
        (column) => column.width,
      ),
    ).toEqual([20, 80]);
    expect(
      resizeColumns(twoColumns, rowId, 96).rows[0].columns.map(
        (column) => column.width,
      ),
    ).toEqual([80, 20]);
  });
  //7
  it("keeps one empty paragraph when the last block is deleted", () => {
    const single = {
      ...fixture(),
      rows: [
        {
          id: "row-only",
          columns: [
            { id: "column-only", width: 100, blocks: [paragraph("only", "")] },
          ],
        },
      ],
    };
    const deleted = deleteBlock(single, "only");
    expect(deleted.rows).toHaveLength(1);
    expect(deleted.rows[0].columns[0].blocks[0].type).toBe("paragraph");
  });
  //8
  it("creates every supported block shape", () => {
    expect(createBlock("paragraph")).toMatchObject({
      type: "paragraph",
      text: "",
    });
    expect(createBlock("heading")).toMatchObject({ type: "heading", level: 2 });
    expect(createBlock("image")).toMatchObject({
      type: "image",
      src: "",
      width: 100,
    });
    expect(createBlock("bulletList")).toMatchObject({
      type: "bulletList",
      items: [{ text: "" }],
    });
    expect(createBlock("numberedList")).toMatchObject({
      type: "numberedList",
      items: [{ text: "" }],
    });
    expect(createBlock("todoList")).toMatchObject({
      type: "todoList",
      items: [{ text: "", checked: false }],
    });
    expect(createBlock("quote")).toMatchObject({
      type: "quote",
      text: "",
      attribution: "",
    });
    expect(createBlock("code")).toMatchObject({
      type: "code",
      code: "",
      language: "plain",
    });
    expect(createBlock("callout")).toMatchObject({
      type: "callout",
      text: "",
      tone: "info",
    });
    expect(createBlock("divider")).toMatchObject({ type: "divider" });
  });
});
describe("document import validation", () => {
  //1
  it("accepts a valid version 1 document", () => {
    expect(parseDocument(fixture())).toEqual(fixture());
  });
  //2
  it("rejects unsupported versions and remote image URLs", () => {
    expect(() => parseDocument({ ...fixture(), version: 2 })).toThrow(
      "not supported",
    );
    const invalidImage = fixture();
    invalidImage.rows[0].columns[0].blocks[0] = {
      id: "image",
      type: "image",
      src: "https://example.com/image.png",
      alt: "",
      caption: "",
    };
    expect(() => parseDocument(invalidImage)).toThrow("structure is invalid");
  });
  //3
  it("accepts legacy images and validates adjustable image widths", () => {
    const legacyImage = fixture();
    legacyImage.rows[0].columns[0].blocks[0] = {
      id: "image",
      type: "image",
      src: "data:image/png;base64,AA==",
      alt: "Sample",
      caption: "",
    };
    expect(parseDocument(legacyImage)).toEqual(legacyImage);
    const invalidWidth = structuredClone(legacyImage);
    const image = invalidWidth.rows[0].columns[0].blocks[0];
    if (image.type !== "image") throw new Error("Expected an image fixture.");
    image.width = 10;
    expect(() => parseDocument(invalidWidth)).toThrow("structure is invalid");
  });
  //4
  it("validates extended block fields", () => {
    const extended = fixture();
    extended.rows[0].columns[0].blocks = [
      {
        id: "quote",
        type: "quote",
        text: "Visible structure matters.",
        attribution: "Research note",
      },
      {
        id: "code",
        type: "code",
        code: "const block = true",
        language: "typescript",
      },
      {
        id: "callout",
        type: "callout",
        text: "Remember this.",
        tone: "warning",
      },
      { id: "divider", type: "divider" },
    ];
    expect(parseDocument(extended)).toEqual(extended);
    const invalidCode = structuredClone(extended);
    invalidCode.rows[0].columns[0].blocks[1].language = "brainfuck";
    expect(() => parseDocument(invalidCode)).toThrow("structure is invalid");
  });
});

/*
document operations
1.inserts and updates blocks without mutating the original document
插入一个新的 Block，并修改其内容，确认新文档更新成功，同时原始 document 保持不变（验证不可变更新）。

2.moves blocks before and after a target across rows
将 Block 拖动到另一个 Block 前面或后面（跨 Row），确认 Block 顺序和所在 Row 都正确更新。

3.creates a two-column row by dropping on a side
将 Block 拖到目标 Block 左侧，确认原来的单列 Row 自动变成双列布局，两列宽度均为 50%。

4.moves side drops into the matching column when two columns exist
当目标 Row 已经是双列时，再拖动 Block 到左侧或右侧，确认 Block 被放入对应的 Column，而不会重新创建新的列。

5.moves a block out of columns into a new full-width row
将双列中的 Block 拖到 New Row Drop Zone，确认该 Block 被移到一个新的全宽 Row（100%），原来的 Row 自动恢复为单列布局。

6.clamps column widths between 20 and 80 percent
调整分栏宽度，确认列宽始终限制在 20%～80% 之间，防止某一列过宽或过窄。

7.keeps one empty paragraph when the last block is deleted
删除文档中的最后一个 Block，确认系统自动创建一个空的 Paragraph，避免文档为空。

8.creates every supported block shape
依次创建所有支持的 Block 类型（Paragraph、Heading、Image、List、Quote、Code、Callout、Divider），确认每种 Block 的默认数据结构正确。

document import validation
1.accepts a valid version 1 document
导入一个合法的 Version 1 文档，确认 parseDocument() 能正确解析并返回文档。

2.rejects unsupported versions and remote image URLs
导入版本号错误的文档，或包含网络图片 URL 的文档，确认导入失败并抛出错误。

3.accepts legacy images and validates adjustable image widths
确认旧版本图片（没有 width 字段）仍可导入，同时验证图片宽度必须位于合法范围（20%～100%）。

4.validates extended block fields
验证新增 Block 类型（Quote、Code、Callout、Divider）的字段是否合法，例如 Code 的语言必须是支持的类型，否则导入失败。
*/
