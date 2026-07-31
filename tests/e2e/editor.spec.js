// Simulate real user operations
/*
1. Edits paragraph content, inserts a Heading Block, verifies that data is successfully saved to IndexedDB, and confirms editable content can be recovered after page reload (to verify auto-save and data persistence functions).

2. Exports a self-contained JSON document
Trigger document export via the Export button, confirm the JSON file is downloaded successfully and the filename complies with the specified format.

3. Reorders blocks via pointer dragging
Drag blocks with the mouse to rearrange their sequence, and verify the blocks are displayed in the correct order within the document upon finishing the drag operation.

4. Moves a column block into a new full-width row
Drag a block from the two-column layout into the New Row Drop Zone, and verify the target block is moved into a new full-width row as expected.

5. Displays the default sample two-column layout and collapses into single column on mobile viewport
Check that the sample document loads with a native two-column layout; confirm image dimensions update accordingly after adjusting image width. Switch to the mobile viewport and validate the two-column layout automatically collapses into a single-column layout.

6. Creates and restores a named document version
Create a named version through Version History, modify the document content, then roll back to the previously saved named version. Confirm document content is fully restored and the version history records are retained properly.
*/
import { expect, test } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});
//1
test("edits, adds a block and restores work after reload", async ({ page }) => {
  const paragraph = page.getByLabel("Paragraph text").first();
  await expect(paragraph).toHaveValue(
    "This sample demonstrates the dissertation prototype as a complete editing workflow. Every piece of content has a visible boundary, can be moved independently, and can be placed beside another block.",
  );
  await paragraph.fill("An experimental paragraph");
  await page.getByRole("button", { name: "Add block", exact: true }).click();
  await page
    .getByRole("menuitem", { name: "Heading Section title", exact: true })
    .click();
  const headings = page.getByLabel("Heading text");
  await headings.last().fill("A new section");
  await expect(page.getByText("Saving\u2026", { exact: true })).toBeVisible();
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            new Promise((resolve, reject) => {
              const request = indexedDB.open("canvas-block-editor", 2);
              request.onsuccess = () => {
                const database = request.result;
                const transaction = database.transaction(
                  "documents",
                  "readonly",
                );
                const getRequest = transaction
                  .objectStore("documents")
                  .get("current");
                getRequest.onsuccess = () => {
                  resolve(
                    getRequest.result?.rows?.[0]?.columns?.[0]?.blocks?.[0]
                      ?.text ?? null,
                  );
                  database.close();
                };
                getRequest.onerror = () => reject(getRequest.error);
              };
              request.onerror = () => reject(request.error);
            }),
        ),
      { timeout: 5e3 },
    )
    .toBe("An experimental paragraph");
  await expect(page.getByText("Saved locally", { exact: true })).toBeVisible({
    timeout: 3e3,
  });
  await page.reload();
  await expect(paragraph).toHaveValue("An experimental paragraph");
  await expect(page.getByLabel("Heading text").last()).toHaveValue(
    "A new section",
  );
});
//2
test("exports a self-contained JSON document", async ({ page }) => {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.json$/);
});
//2
test("reorders blocks with a pointer drag", async ({ page }) => {
  const rightColumn = page.locator(
    ".document-row.is-two-column .document-column:last-child",
  );
  const source = rightColumn.locator(".block-shell--paragraph .drag-handle");
  const target = rightColumn.locator(".block-shell--heading");
  const sourceText = rightColumn.getByLabel("Paragraph text");
  const headingText = rightColumn.getByLabel("Heading text");
  await sourceText.fill(
    "This deliberately long paragraph verifies that a dragged block grows with its content instead of clipping wrapped text when the available width changes.",
  );
  await headingText.fill(
    "A longer heading that must remain completely visible at the larger size",
  );
  await rightColumn.getByLabel("Heading level").selectOption("1");
  await expect
    .poll(() =>
      headingText.evaluate(
        (element) => element.scrollHeight <= element.clientHeight + 1,
      ),
    )
    .toBe(true);
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  expect(sourceBox).not.toBeNull();
  expect(targetBox).not.toBeNull();
  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2 + 10,
    sourceBox.y + sourceBox.height / 2,
    { steps: 3 },
  );
  await expect(rightColumn.locator(".block-shell--paragraph")).toHaveCSS(
    "opacity",
    "1",
  );
  await expect
    .poll(() =>
      sourceText.evaluate(
        (element) => element.scrollHeight <= element.clientHeight + 1,
      ),
    )
    .toBe(true);
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 4, {
    steps: 12,
  });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await expect
    .poll(() =>
      rightColumn
        .locator(".block-shell")
        .evaluateAll((blocks) =>
          blocks.map((block) =>
            block.classList.contains("block-shell--paragraph")
              ? "paragraph"
              : block.classList.contains("block-shell--heading")
                ? "heading"
                : "other",
          ),
        ),
    )
    .toEqual(["paragraph", "heading", "other"]);
});
//4
test("moves a column block into a new full-width row", async ({ page }) => {
  const rightColumn = page.locator(
    ".document-row.is-two-column .document-column:last-child",
  );
  const source = rightColumn.locator(".block-shell--paragraph .drag-handle");
  const sourceBox = await source.boundingBox();
  expect(sourceBox).not.toBeNull();

  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2 + 10,
    sourceBox.y + sourceBox.height / 2,
    { steps: 3 },
  );

  const newRowZone = page.locator(".new-row-drop-zone");
  await expect(newRowZone).toBeVisible();
  const zoneBox = await newRowZone.boundingBox();
  expect(zoneBox).not.toBeNull();
  await page.mouse.move(
    zoneBox.x + zoneBox.width / 2,
    zoneBox.y + zoneBox.height / 2,
    { steps: 12 },
  );
  await page.mouse.up();

  const movedParagraph = page.locator(
    '.document-row.is-two-column + .new-row-drop-zone + .document-row:not(.is-two-column) textarea[aria-label="Paragraph text"]',
  );
  await expect(movedParagraph).toHaveValue(
    "Drag a block above or below another one to reorder the document. Drop it on a side edge to create a column, then drag the divider to control the layout.",
  );
});
//5
test("shows the sample two-column layout and collapses it on mobile", async ({
  page,
}) => {
  await expect(page.locator(".document-row.is-two-column")).toHaveCount(1);
  const imageBlock = page.locator(".block-shell--image");
  const sampleImage = imageBlock.locator("img");
  const resizeHandle = page.getByRole("button", { name: "Resize image" });
  await expect(page.getByLabel("Image caption")).toHaveCount(0);
  await expect(page.getByLabel("Image alternative text")).toHaveCount(0);
  const handleBox = await resizeHandle.boundingBox();
  expect(handleBox).not.toBeNull();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(handleBox.x - 50, handleBox.y + handleBox.height / 2, {
    steps: 6,
  });
  await page.mouse.up();
  await expect
    .poll(() => imageBlock.evaluate((element) => element.style.width))
    .not.toBe("100%");
  const blockBox = await imageBlock.boundingBox();
  const imageBox = await sampleImage.boundingBox();
  expect(blockBox).not.toBeNull();
  expect(imageBox).not.toBeNull();
  expect(Math.abs(blockBox.width - imageBox.width)).toBeLessThan(3);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".column-divider")).toBeHidden();
  await expect(page.locator(".document-row.is-two-column")).toHaveCSS(
    "flex-direction",
    "column",
  );
});
//6
test("creates and restores a named document version", async ({ page }) => {
  const paragraph = page.getByLabel("Paragraph text").first();
  await paragraph.fill("Before the experiment");
  await page.getByRole("button", { name: "History" }).click();
  await page.getByLabel("Name this version").fill("Baseline");
  await page.getByRole("button", { name: "Save version" }).click();
  await expect(page.getByRole("heading", { name: "Baseline" })).toBeVisible();
  await page.getByRole("button", { name: "Close version history" }).click();
  await paragraph.fill("After the experiment");
  await page.getByRole("button", { name: /History/ }).click();
  await page.getByRole("button", { name: "Restore Baseline" }).click();
  await page.getByRole("button", { name: "Restore version" }).click();
  await expect(paragraph).toHaveValue("Before the experiment");
  await page.getByRole("button", { name: /History/ }).click();
  await expect(page.locator(".version-card")).toHaveCount(1);
});


/*
1.edits, adds a block and restores work after reload
修改段落内容，新增一个 Heading Block，确认数据成功保存到 IndexedDB，并在刷新页面后仍能恢复编辑内容（验证自动保存与持久化功能）。

2.exports a self-contained JSON document
点击 Export 导出文档，确认成功下载 JSON 文件，并验证文件名格式正确。

3.reorders blocks with a pointer drag
使用鼠标拖拽 Block，调整 Block 顺序，确认拖拽完成后文档中的 Block 排列顺序正确。

4.moves a column block into a new full-width row
将双栏中的 Block 拖到 New Row Drop Zone，确认该 Block 被移动到新的全宽 Row 中。

5.shows the sample two-column layout and collapses it on mobile
验证示例文档默认显示双栏布局，调整图片宽度后确认图片尺寸同步变化，再切换到移动端视口，确认双栏自动折叠为单栏布局。

6.creates and restores a named document version
创建一个命名版本（Version History），修改文档后恢复该版本，确认内容恢复成功且版本历史正确保留。
*/