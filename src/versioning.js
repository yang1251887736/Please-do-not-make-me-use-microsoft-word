import { createId } from "./document";

// countBlocks(): Count the number of Blocks contained within a document
function countBlocks(document) {
  return document.rows.reduce(
    (rowTotal, row) =>
      rowTotal +
      row.columns.reduce(
        (columnTotal, column) => columnTotal + column.blocks.length,
        0,
      ),
    0,
  );
}

// createSnapshot(): Creates a snapshot for version history
function createSnapshot(document, label, reason = "manual") {
  return {
    id: createId("version"),
    label: label.trim() || "Untitled version",
    createdAt: /* @__PURE__ */ new Date().toISOString(),
    reason,
    document: structuredClone(document),
  };
}
export { countBlocks, createSnapshot };
