// Component Testing(app.jsx)
/*
1.loads the sample, edits a block and saves locally: Load the sample document, modify the content of the first paragraph, verify the text update, and confirm the auto-save is completed (marked as Saved locally)
2.adds a heading from the block menu: Click Add block → Heading on the toolbar, and confirm the number of heading blocks increases
3.adds and edits an extended code block: Insert a Code Block, input code content, switch the programming language to TypeScript, and verify both the content and language settings are updated correctly
4.saves a named version and restores it after later edits: Save a named version in the version history, make subsequent edits to the document, then restore the previously saved old version and verify the restoration succeeds
5.resizes the whole image block without metadata fields: Adjust the image width via keyboard inputs, confirm the width value changes, and check that the Caption and Alt Text editing boxes are not displayed
6.shows a confirmation before resetting the sample: Click Reset Sample, check whether the confirmation pop-up window pops up, then click Cancel to verify the confirmation window closes properly
7.resizes columns with the keyboard: Focus on the column divider bar, adjust column widths using directional keys, and confirm the gridTemplateColumns value changes from 44fr 18px 56fr to 49fr 18px 51fr
*/
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
beforeEach(async () => {
  await new Promise((resolve) => {
    const request = indexedDB.deleteDatabase("canvas-block-editor");
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
});
describe("App", () => {
  //1
  it("loads the sample, edits a block and saves locally", async () => {
    const user = userEvent.setup();
    render(<App />);
    const paragraphs = await screen.findAllByLabelText("Paragraph text");
    const paragraph = paragraphs[0];
    expect(paragraph).toHaveValue(
      "Every piece of content has a visible boundary, can be moved independently, and can be placed beside another block.",
    );
    await user.clear(paragraph);
    await user.type(paragraph, "My research paragraph");
    await waitFor(
      () => expect(screen.getByText("Saved locally")).toBeInTheDocument(),
      { timeout: 2500 },
    );
    expect(paragraph).toHaveValue("My research paragraph");
  });
  //2
  it("adds a heading from the block menu", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findAllByLabelText("Paragraph text");
    const initialHeadings = screen.getAllByLabelText("Heading text").length;
    await user.click(screen.getByRole("button", { name: "Add block" }));
    await user.click(screen.getByRole("menuitem", { name: /Heading/ }));
    expect(screen.getAllByLabelText("Heading text")).toHaveLength(
      initialHeadings + 1,
    );
  });
  //3
  it("adds and edits an extended code block", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findAllByLabelText("Paragraph text");
    const initialCodeBlocks = screen.getAllByLabelText("Code block").length;
    await user.click(screen.getByRole("button", { name: "Add block" }));
    await user.click(screen.getByRole("menuitem", { name: /Code/ }));
    const codeBlocks = screen.getAllByLabelText("Code block");
    const codeLanguages = screen.getAllByLabelText("Code language");
    expect(codeBlocks).toHaveLength(initialCodeBlocks + 1);
    const code = codeBlocks.at(-1);
    const language = codeLanguages.at(-1);
    if (!code || !language) throw new Error("Expected the added code block.");
    await user.type(code, "const answer = 42");
    await user.selectOptions(language, "typescript");
    expect(code).toHaveValue("const answer = 42");
    expect(language).toHaveValue("typescript");
  });
  //4
  it("saves a named version and restores it after later edits", async () => {
    const user = userEvent.setup();
    render(<App />);
    const paragraphs = await screen.findAllByLabelText("Paragraph text");
    const paragraph = paragraphs[0];
    await user.clear(paragraph);
    await user.type(paragraph, "Version one paragraph");
    await user.click(screen.getByRole("button", { name: "History" }));
    await user.type(screen.getByLabelText("Name this version"), "First draft");
    await user.click(screen.getByRole("button", { name: "Save version" }));
    expect(
      await screen.findByRole("heading", { name: "First draft" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Close version history" }),
    );
    await user.clear(paragraph);
    await user.type(paragraph, "Version two paragraph");
    await user.click(screen.getByRole("button", { name: /History/ }));
    await user.click(
      screen.getByRole("button", { name: "Restore First draft" }),
    );
    await user.click(screen.getByRole("button", { name: "Restore version" }));
    await waitFor(() =>
      expect(screen.getAllByLabelText("Paragraph text")[0]).toHaveValue(
        "Version one paragraph",
      ),
    );
    await user.click(screen.getByRole("button", { name: /History/ }));
    expect(screen.getAllByRole("button", { name: /^Restore / })).toHaveLength(
      1,
    );
  });
  //5
  it("resizes the whole image block without metadata fields", async () => {
    const user = userEvent.setup();
    render(<App />);
    const resizeHandle = await screen.findByRole("button", {
      name: "Resize image",
    });
    const image = screen.getByAltText(
      "A stylised landscape representing arranged ideas",
    );
    const block = image.closest(".block-shell");
    resizeHandle.focus();
    await user.keyboard("{ArrowLeft}");
    expect(block).toHaveStyle({ width: "95%" });
    expect(screen.queryByLabelText("Image caption")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Image alternative text"),
    ).not.toBeInTheDocument();
  });
  //6
  it("shows a confirmation before resetting the sample", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findAllByLabelText("Paragraph text");
    await user.click(screen.getByRole("button", { name: "Reset sample" }));
    expect(
      screen.getByRole("dialog", { name: "Reset the sample document?" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  //7
  it("resizes columns with the keyboard", async () => {
    const user = userEvent.setup();
    render(<App />);
    const divider = await screen.findByRole("button", {
      name: "Resize columns",
    });
    const row = divider.closest(".document-row");
    expect(row).toHaveStyle({
      gridTemplateColumns: "44fr 18px 56fr",
    });
    divider.focus();
    await user.keyboard("{ArrowRight}");
    expect(row).toHaveStyle({
      gridTemplateColumns: "49fr 18px 51fr",
    });
  });
});
/*
loads the sample, edits a block and saves locally：加载示例文档，修改第一个段落内容，确认文本更新，并检查自动保存成功（显示 Saved locally）
adds a heading from the block menu：点击工具栏 Add block → Heading，确认标题块数量增加
adds and edits an extended code block：添加 Code Block，输入代码，切换语言为 TypeScript，确认内容和语言都更新
saves a named version and restores it after later edits：保存一个版本历史，再修改文档，最后恢复旧版本，确认恢复成功
resizes the whole image block without metadata fields：用键盘调整图片宽度，确认宽度变化，同时确认没有显示 Caption 和 Alt Text 编辑框
shows a confirmation before resetting the sample：点击 Reset Sample，检查确认对话框是否出现，再点击 Cancel，确认对话框关闭
resizes columns with the keyboard：聚焦分栏拖拽条，按方向键调整宽度，确认 gridTemplateColumns 从 44fr 18px 56fr 变成 49fr 18px 51fr
*/
