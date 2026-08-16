import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-python";
import "prismjs/components/prism-typescript";
import { createId, toggleRunsFormat } from "../document";

// A line-leading `//` is commonly used as an informal comment even in Python
// documents. Real Python floor division always has a left-hand operand, so
// this extra token can never shadow valid `a // b` code.
Prism.languages.insertBefore("python", "operator", {
  "slash-comment": {
    pattern: /(^|\n[ \t]*)\/\/.*/,
    lookbehind: true,
    greedy: true,
    alias: "comment",
  },
});

const defaultFormat = {
  bold: false,
  italic: false,
  underline: false,
  align: "left",
};

function withTextRuns(target, text, runs) {
  if (runs !== undefined) return { ...target, text, runs };
  const next = { ...target, text };
  delete next.runs;
  return next;
}

function editorTextLength(editor) {
  if (editor instanceof HTMLTextAreaElement || editor instanceof HTMLInputElement) {
    return editor.value.length;
  }
  return plainTextFromRoot(editor);
}

function placeEditorCaret(editor, caret) {
  editor.focus();
  if (editor instanceof HTMLTextAreaElement || editor instanceof HTMLInputElement) {
    editor.setSelectionRange?.(caret, caret);
    return;
  }
  if (editor instanceof HTMLElement && editor.isContentEditable) {
    setSelectionOffsets(editor, caret, caret);
  }
}

function focusAdjacentEditor(current, direction) {
  const editors = [...document.querySelectorAll("[data-editor-field]")];
  const index = editors.indexOf(current);
  const target = editors[index + direction];
  if (!target) return;
  const caret = direction < 0 ? editorTextLength(target) : 0;
  placeEditorCaret(target, caret);
}

function focusPreviousEditor(current) {
  const editors = [...document.querySelectorAll("[data-editor-field]")];
  const index = editors.indexOf(current);
  const target = editors[index - 1];
  if (!target) return;
  placeEditorCaret(target, editorTextLength(target));
}

function plainTextFromRoot(root) {
  const units = collectTextUnits(root);
  let text = units.map((unit) => unit.text).join("");
  text = text.replace(/\r\n?/g, "\n");
  if (text.endsWith("\n")) text = text.slice(0, -1);
  return text;
}

function collectTextUnits(root) {
  const units = [];
  const visit = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.data) units.push({ node, text: node.data });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.tagName === "BR") {
      units.push({ node, text: "\n" });
      return;
    }
    for (const child of node.childNodes) visit(child);
  };
  visit(root);
  return units;
}

function pointToOffset(root, container, offset) {
  const units = collectTextUnits(root);
  if (container.nodeType === Node.TEXT_NODE) {
    const unit = units.find((candidate) => candidate.node === container);
    if (!unit) return 0;
    return unitOffset(units, unit) + Math.min(Math.max(0, offset), unit.text.length);
  }
  if (container.nodeType === Node.ELEMENT_NODE && container.tagName === "BR") {
    const unit = units.find((candidate) => candidate.node === container);
    return unit ? unitOffset(units, unit) + Math.min(offset, 1) : 0;
  }
  if (container.nodeType === Node.ELEMENT_NODE) {
    if (offset >= container.childNodes.length) {
      let end = 0;
      for (const unit of units) {
        if (container.contains(unit.node)) {
          end = Math.max(end, unitOffset(units, unit) + unit.text.length);
        }
      }
      return end;
    }
    const child = container.childNodes[offset];
    const first = units.find(
      (unit) => unit.node === child || child?.contains(unit.node),
    );
    return first ? unitOffset(units, first) : 0;
  }
  return 0;
}

function unitOffset(units, unit) {
  let total = 0;
  for (const candidate of units) {
    if (candidate === unit) return total;
    total += candidate.text.length;
  }
  return total;
}

function getSelectionOffsets(root) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return { start: 0, end: 0 };
  }
  const range = selection.getRangeAt(0);
  return {
    start: pointToOffset(root, range.startContainer, range.startOffset),
    end: pointToOffset(root, range.endContainer, range.endOffset),
  };
}

function setSelectionOffsets(root, start, end) {
  const selection = window.getSelection();
  if (!selection) return;
  const units = collectTextUnits(root);
  const pointAt = (offset) => {
    let position = 0;
    for (const unit of units) {
      const unitEnd = position + unit.text.length;
      if (offset <= unitEnd) {
        if (unit.node.nodeType === Node.TEXT_NODE) {
          return { node: unit.node, offset: Math.max(0, offset - position) };
        }
        return { node: unit.node, offset: offset > position ? 1 : 0 };
      }
      position = unitEnd;
    }
    return { node: root, offset: root.childNodes.length };
  };
  const range = document.createRange();
  const startPoint = pointAt(start);
  const endPoint = pointAt(end);
  range.setStart(startPoint.node, startPoint.offset);
  range.setEnd(endPoint.node, endPoint.offset);
  selection.removeAllRanges();
  selection.addRange(range);
}

function TextToolbar({ format = defaultFormat, onChange }) {
  return (
    <div className="text-format-toolbar" role="toolbar" aria-label="Text formatting">
      {[
        ["bold", "B", "Bold"],
        ["italic", "I", "Italic"],
        ["underline", "U", "Underline"],
      ].map(([key, label, title]) => (
        <button
          key={key}
          type="button"
          className={format[key] ? "is-active" : ""}
          aria-label={title}
          aria-pressed={Boolean(format[key])}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onChange?.({ [key]: !format[key] })}
        >
          {label}
        </button>
      ))}
      <span className="toolbar-separator" aria-hidden="true" />
      {[
        ["left", "≡", "Align left"],
        ["center", "≣", "Align center"],
        ["right", "≡", "Align right"],
        ["justify", "☰", "Justify"],
      ].map(([align, label, title]) => (
        <button
          key={align}
          type="button"
          className={(format.align ?? "left") === align ? "is-active" : ""}
          aria-label={title}
          aria-pressed={(format.align ?? "left") === align}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onChange?.({ align })}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rich text editing surface
// Allow users to input text, and enable setting bold, italic, and underline for selected text while preserving these local formats

// Read text formatting
function collectStyledUnits(root, blockFormat) {
  const units = [];
  const walk = (node, state) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.data) units.push({ text: node.data, ...state });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.tagName === "BR") {
      units.push({ text: "\n", ...state });
      return;
    }
    const next = { ...state };
    const tag = node.tagName;
    if (tag === "B" || tag === "STRONG") next.bold = true;
    if (tag === "I" || tag === "EM") next.italic = true;
    if (tag === "U") next.underline = true;
    const style = node.style;
    if (style) {
      const weight = style.fontWeight;
      if (weight === "bold" || weight === "700") next.bold = true;
      else if (weight === "normal" || weight === "400") next.bold = false;
      const fontStyle = style.fontStyle;
      if (fontStyle === "italic" || fontStyle === "oblique") next.italic = true;
      else if (fontStyle === "normal") next.italic = false;
      const decoration = style.textDecorationLine || style.textDecoration;
      if (decoration && decoration !== "none") next.underline = true;
      else if (decoration === "none") next.underline = false;
    }
    for (const child of node.childNodes) walk(child, next);
  };
  walk(root, {
    bold: Boolean(blockFormat?.bold),
    italic: Boolean(blockFormat?.italic),
    underline: Boolean(blockFormat?.underline),
  });
  return units;
}

// Organize the format into runs
/*example:
[
  { text: "Hello ", bold: undefined },
  { text: "World", bold: true }
]
*/
function parseRunsFromRoot(root, text, blockFormat) {
  const units = collectStyledUnits(root, blockFormat);
  if (units.length && units.at(-1).text === "\n") units.pop();
  const runs = [];
  for (const unit of units) {
    const bold = unit.bold === Boolean(blockFormat?.bold) ? undefined : unit.bold;
    const italic =
      unit.italic === Boolean(blockFormat?.italic) ? undefined : unit.italic;
    const underline =
      unit.underline === Boolean(blockFormat?.underline)
        ? undefined
        : unit.underline;
    const previous = runs.at(-1);
    if (
      previous &&
      previous.bold === bold &&
      previous.italic === italic &&
      previous.underline === underline
    ) {
      previous.text += unit.text;
    } else {
      runs.push({ text: unit.text, bold, italic, underline });
    }
  }
  if (runs.map((run) => run.text).join("") !== text) return undefined;
  return runs.some(
    (run) =>
      run.bold !== undefined ||
      run.italic !== undefined ||
      run.underline !== undefined,
  )
    ? runs
    : undefined;
}

// Convert the data back into HTML
function renderValueToDom(root, text, runs, format) {
  root.replaceChildren();
  const segments =
    Array.isArray(runs) && runs.length > 0
      ? runs
      : text
        ? [{ text }]
        : [];
  for (const run of segments) {
    const parts = run.text.split("\n");
    parts.forEach((part, index) => {
      if (index > 0) root.appendChild(document.createElement("br"));
      if (!part) return;
      const bold = run.bold ?? Boolean(format?.bold);
      const italic = run.italic ?? Boolean(format?.italic);
      const underline = run.underline ?? Boolean(format?.underline);
      const span = document.createElement("span");
      if (run.bold !== undefined && run.bold !== Boolean(format?.bold)) {
        span.style.fontWeight = bold ? "700" : "400";
      }
      if (run.italic !== undefined && run.italic !== Boolean(format?.italic)) {
        span.style.fontStyle = italic ? "italic" : "normal";
      }
      if (underline) span.style.textDecoration = "underline";
      if (span.style.length === 0) {
        root.appendChild(document.createTextNode(part));
      } else {
        span.appendChild(document.createTextNode(part));
        root.appendChild(span);
      }
    });
  }
  root.classList.toggle("is-empty", text === "");
}

// Editor
function RichTextEditor({
  value,
  runs,
  className = "",
  placeholder,
  ariaLabel,
  onChange,
  onEnter,
  onDeleteEmpty,
  format,
  onFormatChange,
  editorId,
}) {
  const rootRef = useRef(null);
  const lastSyncedRef = useRef(null);

  const rebuild = useCallback((root, nextValue, nextRuns, nextFormat) => {
    const wasFocused = document.activeElement === root;
    const caret = wasFocused ? getSelectionOffsets(root) : { start: 0, end: 0 };
    renderValueToDom(root, nextValue, nextRuns, nextFormat ?? defaultFormat);
    if (wasFocused) {
      const length = nextValue.length;
      setSelectionOffsets(
        root,
        Math.min(caret.start, length),
        Math.min(caret.end, length),
      );
    }
    lastSyncedRef.current = {
      text: nextValue,
      runs: nextRuns,
      format: nextFormat,
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const last = lastSyncedRef.current;
    if (
      last &&
      last.text === value &&
      last.runs === runs &&
      last.format === format
    ) {
      return;
    }
    rebuild(root, value, runs, format);
  }, [format, rebuild, runs, value]);

  const applyFormat = (patch) => {
    if (!patch) return;
    if (patch.align !== undefined) {
      onFormatChange?.({ ...defaultFormat, ...format, align: patch.align });
      return;
    }
    const key = Object.keys(patch)[0];
    const root = rootRef.current;
    if (!root || !key) return;
    const selection = getSelectionOffsets(root);
    if (selection.start !== selection.end) {
      const nextRuns = toggleRunsFormat(
        value,
        runs,
        selection.start,
        selection.end,
        key,
        format ?? defaultFormat,
      );
      rebuild(root, value, nextRuns, format);
      onChange?.(value, nextRuns);
      return;
    }
    onFormatChange?.({ ...defaultFormat, ...format, ...patch });
  };

  const handleInput = (event) => {
    const root = event.currentTarget;
    const nextText = plainTextFromRoot(root);
    const nextRuns = parseRunsFromRoot(root, nextText, format ?? defaultFormat);
    lastSyncedRef.current = {
      text: nextText,
      runs: nextRuns,
      format,
    };
    onChange?.(nextText, nextRuns);
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData("text/plain") ?? "";
    document.execCommand("insertText", false, text);
  };

  // shift+enter:change the line, enter: create a new block
  return (
    <div className="editable-text-wrap">
      {onFormatChange && (
        <TextToolbar format={format} onChange={applyFormat} />
      )}
      <div
        ref={rootRef}
        className={`rich-text ${className} ${value === "" ? "is-empty" : ""}`}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        data-placeholder={placeholder}
        data-editor-field
        data-editor-id={editorId}
        spellCheck="true"
        style={{
          textAlign: format?.align ?? "left",
          fontWeight: format?.bold ? 700 : undefined,
          fontStyle: format?.italic ? "italic" : undefined,
        }}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && onEnter) {
            event.preventDefault();
            onEnter();
          }
          if (
            event.key === "Backspace" &&
            plainTextFromRoot(event.currentTarget) === "" &&
            onDeleteEmpty
          ) {
            event.preventDefault();
            focusPreviousEditor(event.currentTarget);
            onDeleteEmpty();
          }
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            const selection = getSelectionOffsets(event.currentTarget);
            const length = plainTextFromRoot(event.currentTarget).length;
            if (event.key === "ArrowUp" && selection.start === 0) {
              event.preventDefault();
              focusAdjacentEditor(event.currentTarget, -1);
            }
            if (event.key === "ArrowDown" && selection.end === length) {
              event.preventDefault();
              focusAdjacentEditor(event.currentTarget, 1);
            }
          }
        }}
      />
    </div>
  );
}

// Resize the image
const clampImageWidth = (width) => Math.min(100, Math.max(20, width));

function ImageEditor({ block, onChange }) {
  const figureRef = useRef(null);
  const imageWidth = block.width ?? 100;  // initial:100%

  const updateWidth = (width) => {
    onChange({ ...block, width: Math.round(clampImageWidth(width)) });
  };

  const startResize = (event) => {  // strat when drag the image
    event.preventDefault();
    event.stopPropagation();

    const blockElement = figureRef.current?.closest(".block-shell");
    const columnElement = blockElement?.parentElement;  // Calculate the width of parentElement
    if (!blockElement || !columnElement) return;

    const startX = event.clientX;
    const startWidth = imageWidth;
    const columnWidth = columnElement.getBoundingClientRect().width;
    if (columnWidth === 0) return;

    document.body.classList.add("is-resizing-image");
    const handleMove = (moveEvent) => {
      const delta = ((moveEvent.clientX - startX) / columnWidth) * 100;  // Calculate the moving distance
      updateWidth(startWidth + delta);
    };
    const handleEnd = () => {
      document.body.classList.remove("is-resizing-image");
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
  };

  return (
    <figure ref={figureRef} className="image-block">
      <img src={block.src} alt={block.alt} draggable="false" />
      <button
        className="image-resize-handle"
        type="button"
        aria-label="Resize image"
        aria-valuetext={`${imageWidth}% width`}
        title="Drag to resize image"
        onPointerDown={startResize}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const step = event.shiftKey ? 10 : 5;
          updateWidth(imageWidth + (event.key === "ArrowRight" ? step : -step));
        }}
      >
        <span aria-hidden="true" />
      </button>
    </figure>
  );
}

// Paragraph: RichTextEditor
function ParagraphEditor({ block, onChange, onEnter, onDeleteEmpty }) {
  return (
    <RichTextEditor
      value={block.text}
      runs={block.runs}
      placeholder="Write something…"
      ariaLabel="Paragraph text"
      onChange={(text, runs) => onChange(withTextRuns(block, text, runs))}
      format={block.format}
      onFormatChange={(format) => onChange({ ...block, format })}
      onEnter={onEnter}
      onDeleteEmpty={onDeleteEmpty}
    />
  );
}

// Heading: Select + RichTextEditor
function HeadingEditor({ block, onChange, onEnter, onDeleteEmpty }) {
  return (
    <div className="heading-editor">
      <select
        className="heading-level"
        aria-label="Heading level"
        value={block.level}
        onChange={(event) =>
          onChange({ ...block, level: Number(event.target.value) })
        }
      >
        <option value={1}>H1</option>
        <option value={2}>H2</option>
      </select>
      <RichTextEditor
        value={block.text}
        runs={block.runs}
        className={`heading-${block.level}`}
        placeholder="Heading"
        ariaLabel="Heading text"
        onChange={(text, runs) => onChange(withTextRuns(block, text, runs))}
        format={block.format}
        onFormatChange={(format) => onChange({ ...block, format })}
        onEnter={onEnter}
        onDeleteEmpty={onDeleteEmpty}
      />
    </div>
  );
}

// List: Edit an array(update, addAfter)
function BulletListEditor({ block, onChange, onDeleteEmpty }) {
  const updateItem = (itemId, text, runs) =>
    onChange({
      ...block,
      items: block.items.map((item) =>
        item.id === itemId ? withTextRuns(item, text, runs) : item,
      ),
    });
  const addAfter = (itemId) => {
    const index = block.items.findIndex((item) => item.id === itemId);
    const items = [...block.items];
    const newItem = { id: createId("item"), text: "" };
    items.splice(index + 1, 0, newItem);
    onChange({ ...block, items });
    requestAnimationFrame(() =>
      document.querySelector(`[data-editor-id="${newItem.id}"]`)?.focus(),
    );
  };
  const removeItem = (itemId) => {
    if (block.items.length === 1) {
      onDeleteEmpty();
      return;
    }
    onChange({
      ...block,
      items: block.items.filter((item) => item.id !== itemId),
    });
  };
  return (
    <ul className="editable-list bullet-list">
      {block.items.map((item) => (
        <li key={item.id}>
          <span className="list-marker" aria-hidden="true">
            •
          </span>
          <RichTextEditor
            value={item.text}
            runs={item.runs}
            placeholder="List item"
            ariaLabel="Bullet list item"
            editorId={item.id}
            onChange={(text, runs) => updateItem(item.id, text, runs)}
            format={block.format}
            onFormatChange={(format) => onChange({ ...block, format })}
            onEnter={() => addAfter(item.id)}
            onDeleteEmpty={() => item.text === "" && removeItem(item.id)}
          />
        </li>
      ))}
    </ul>
  );
}

function NumberedListEditor({ block, onChange, onDeleteEmpty }) {
  const updateItem = (itemId, text, runs) =>
    onChange({
      ...block,
      items: block.items.map((item) =>
        item.id === itemId ? withTextRuns(item, text, runs) : item,
      ),
    });
  const addAfter = (itemId) => {
    const index = block.items.findIndex((item) => item.id === itemId);
    const items = [...block.items];
    const newItem = { id: createId("item"), text: "" };
    items.splice(index + 1, 0, newItem);
    onChange({ ...block, items });
    requestAnimationFrame(() =>
      document.querySelector(`[data-editor-id="${newItem.id}"]`)?.focus(),
    );
  };
  const removeItem = (itemId) => {
    if (block.items.length === 1) {
      onDeleteEmpty();
      return;
    }
    onChange({
      ...block,
      items: block.items.filter((item) => item.id !== itemId),
    });
  };
  return (
    <ol className="editable-list numbered-list">
      {block.items.map((item) => (
        <li key={item.id}>
          <span className="list-marker numbered-marker" aria-hidden="true">
            {block.items.indexOf(item) + 1}.
          </span>
          <RichTextEditor
            value={item.text}
            runs={item.runs}
            placeholder="List item"
            ariaLabel="Numbered list item"
            editorId={item.id}
            onChange={(text, runs) => updateItem(item.id, text, runs)}
            format={block.format}
            onFormatChange={(format) => onChange({ ...block, format })}
            onEnter={() => addAfter(item.id)}
            onDeleteEmpty={() => item.text === "" && removeItem(item.id)}
          />
        </li>
      ))}
    </ol>
  );
}


function TodoListEditor({ block, onChange, onDeleteEmpty }) {
  const updateItem = (itemId, patch, text, runs) =>
    onChange({
      ...block,
      items: block.items.map((item) =>
        item.id === itemId
          ? text === undefined
            ? { ...item, ...patch }
            : withTextRuns({ ...item, ...patch }, text, runs)
          : item,
      ),
    });
  const addAfter = (itemId) => {
    const index = block.items.findIndex((item) => item.id === itemId);
    const items = [...block.items];
    const newItem = {
      id: createId("item"),
      text: "",
      checked: false,
    };
    items.splice(index + 1, 0, newItem);
    onChange({ ...block, items });
    requestAnimationFrame(() =>
      document.querySelector(`[data-editor-id="${newItem.id}"]`)?.focus(),
    );
  };
  const removeItem = (itemId) => {
    if (block.items.length === 1) {
      onDeleteEmpty();
      return;
    }
    onChange({
      ...block,
      items: block.items.filter((item) => item.id !== itemId),
    });
  };
  return (
    <ul className="editable-list todo-list">
      {block.items.map((item) => (
        <li key={item.id}>
          <label className="todo-check">
            <input
              type="checkbox"
              checked={item.checked}  // checkbox
              aria-label={`Mark \u201C${item.text || "task"}\u201D complete`}
              onChange={(event) =>
                updateItem(item.id, { checked: event.target.checked })
              }
            />
            <span aria-hidden="true" />
          </label>
          <RichTextEditor
            value={item.text}
            runs={item.runs}
            className={item.checked ? "is-complete" : ""}
            placeholder="To-do"
            ariaLabel="To-do list item"
            editorId={item.id}
            onChange={(text, runs) => updateItem(item.id, { text }, text, runs)}
            format={block.format}
            onFormatChange={(format) => onChange({ ...block, format })}
            onEnter={() => addAfter(item.id)}
            onDeleteEmpty={() => item.text === "" && removeItem(item.id)}
          />
        </li>
      ))}
    </ul>
  );
}

// Quote: text + attribution
function QuoteEditor({ block, onChange, onDeleteEmpty }) {
  return (
    <blockquote className="quote-block">
      <RichTextEditor
        value={block.text}
        runs={block.runs}
        placeholder="Write a quotation…"
        ariaLabel="Quote text"
        onChange={(text, runs) => onChange(withTextRuns(block, text, runs))}
        format={block.format}
        onFormatChange={(format) => onChange({ ...block, format })}
        onDeleteEmpty={onDeleteEmpty}
      />
      <input
        value={block.attribution}
        placeholder="Source or attribution"
        aria-label="Quote attribution"
        onChange={(event) =>
          onChange({ ...block, attribution: event.target.value })
        }
      />
    </blockquote>
  );
}

// Code: language + code
function CodeEditor({ block, onChange, onDeleteEmpty }) {
  const codeRef = useRef(null);
  const grammarName = block.language === "html" ? "markup" : block.language;
  // Find the corresponding grammar rules according to the current language
  const grammar = Prism.languages[grammarName] ?? Prism.languages.plain;
  const highlighted = Prism.highlight(block.code, grammar, grammarName); //highlight

  const resizeCode = useCallback(() => {
    const textarea = codeRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  useLayoutEffect(() => {
    resizeCode();
  }, [block.code, resizeCode]);

  useEffect(() => {
    const textarea = codeRef.current;
    if (!textarea) return;
    let observedWidth = textarea.getBoundingClientRect().width;
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(([entry]) => {
            const nextWidth = entry.contentRect.width;
            if (Math.abs(nextWidth - observedWidth) < 0.5) return;
            observedWidth = nextWidth;
            resizeCode();
          });
    observer?.observe(textarea);
    window.addEventListener("resize", resizeCode);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", resizeCode);
    };
  }, [resizeCode]);

  return (
    <div className="code-block">
      <select
        value={block.language}
        aria-label="Code language"
        onChange={(event) =>
          onChange({
            ...block,
            language: event.target.value,
          })
        }
      >
        <option value="plain">Plain text</option>
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
        <option value="python">Python</option>
        <option value="html">HTML</option>
        <option value="css">CSS</option>
      </select>
      <div className="code-editor-layer">
        <pre aria-hidden="true">
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
        <textarea
          ref={codeRef}
          className="code-textarea"
          value={block.code}
          rows={Math.max(4, block.code.split("\n").length)}
          placeholder="Write or paste code…"
          aria-label="Code block"
          data-editor-field
          spellCheck="false"
          onChange={(event) => onChange({ ...block, code: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && block.code === "" && onDeleteEmpty) {
              event.preventDefault();
              focusPreviousEditor(event.currentTarget);
              onDeleteEmpty();
            }
            if (event.key === "Tab") {
              event.preventDefault();
              const { selectionStart, selectionEnd, value } = event.currentTarget;
              const code = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
              onChange({ ...block, code });
              requestAnimationFrame(() => event.currentTarget.setSelectionRange(selectionStart + 2, selectionStart + 2));
            }
          }}
        />
      </div>
    </div>
  );
}

// callout: tone + text
const calloutIcons = {
  info: "i",
  warning: "!",
  success: "\u2713",
};
function CalloutEditor({ block, onChange, onEnter, onDeleteEmpty }) {
  return (
    <div className={`callout-block callout-block--${block.tone}`}>
      <span className="callout-icon" aria-hidden="true">
        {calloutIcons[block.tone]}
      </span>
      <RichTextEditor
        value={block.text}
        runs={block.runs}
        placeholder="Highlight an important note…"
        ariaLabel="Callout text"
        onChange={(text, runs) => onChange(withTextRuns(block, text, runs))}
        format={block.format}
        onFormatChange={(format) => onChange({ ...block, format })}
        onEnter={onEnter}
        onDeleteEmpty={onDeleteEmpty}
      />
      <select
        value={block.tone}
        aria-label="Callout style"
        onChange={(event) =>
          onChange({
            ...block,
            tone: event.target.value,
          })
        }
      >
        <option value="info">Info</option>
        <option value="warning">Warning</option>
        <option value="success">Success</option>
      </select>
    </div>
  );
}

// Determine which editor to render according to block.type
function BlockEditor({ block, onChange, onEnter, onDeleteEmpty }) {
  switch (block.type) {
    case "heading":
      return (
        <HeadingEditor
          block={block}
          onChange={onChange}
          onEnter={onEnter}
          onDeleteEmpty={onDeleteEmpty}
        />
      );
    case "image":
      return <ImageEditor block={block} onChange={onChange} />;
    case "bulletList":
      return (
        <BulletListEditor
          block={block}
          onChange={onChange}
          onDeleteEmpty={onDeleteEmpty}
        />
      );
    case "numberedList":
      return (
        <NumberedListEditor
          block={block}
          onChange={onChange}
          onDeleteEmpty={onDeleteEmpty}
        />
      );
    case "todoList":
      return (
        <TodoListEditor
          block={block}
          onChange={onChange}
          onDeleteEmpty={onDeleteEmpty}
        />
      );
    case "quote":
      return (
        <QuoteEditor
          block={block}
          onChange={onChange}
          onDeleteEmpty={onDeleteEmpty}
        />
      );
    case "code":
      return (
        <CodeEditor
          block={block}
          onChange={onChange}
          onDeleteEmpty={onDeleteEmpty}
        />
      );
    case "callout":
      return (
        <CalloutEditor
          block={block}
          onChange={onChange}
          onEnter={onEnter}
          onDeleteEmpty={onDeleteEmpty}
        />
      );
    case "divider":
      return (
        <div className="divider-block" role="separator">
          <span>Section divider</span>
        </div>
      );
    default:
      return (
        <ParagraphEditor
          block={block}
          onChange={onChange}
          onEnter={onEnter}
          onDeleteEmpty={onDeleteEmpty}
        />
      );
  }
}
export { BlockEditor };


/*
BlockEditor.jsx

│
├── RichTextEditor       富文本编辑区
│
├── ImageEditor         图片编辑
│
├── ParagraphEditor     段落
│
├── HeadingEditor       标题
│
├── BulletListEditor    无序列表
│
├── NumberedListEditor  有序列表
│
├── TodoListEditor      待办列表
│
├── QuoteEditor         引用
│
├── CodeEditor          代码块
│
├── CalloutEditor       提示框
│
└── BlockEditor         最后的总入口
*/
