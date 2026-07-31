// Test versioning.js
//1. Does countBlocks() correctly count the number of Blocks in the entire document.
//2. Does createSnapshot() generate truly independent snapshots.
import { createSampleDocument } from "../src/document";
import { countBlocks, createSnapshot } from "../src/versioning";
describe("document versioning", () => {
  it("counts blocks across rows and columns", () => {
    expect(countBlocks(createSampleDocument())).toBe(11);
  });
  it("creates an independent named snapshot", () => {
    const document = createSampleDocument();
    const snapshot = createSnapshot(document, "  Research checkpoint  ");
    expect(snapshot).toMatchObject({
      label: "Research checkpoint",
      reason: "manual",
    });
    document.title = "Changed after saving";
    expect(snapshot.document.title).toBe(
      "Writing with blocks, not hidden layout rules",
    );
  });
});
