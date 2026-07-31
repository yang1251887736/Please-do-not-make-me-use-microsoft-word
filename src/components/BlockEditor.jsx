import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { createId } from "../document";

// The text block will automatically recalculate its height
/*
resize()
   │
   ├── value change（useLayoutEffect）
   ├── class change（Heading shift）
   ├── width change（ResizeObserver）
   └── window change（window.resize）

*/
function AutoTextarea({
  value,
  className = "",
  placeholder,
  ariaLabel,
  onChange,
  onEnter,
  onDeleteEmpty,
}) {
  const textareaRef = useRef(null);
  const resize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  useLayoutEffect(() => {
    resize();
  }, [className, resize, value]);  // If any of these three items changes, run it again.

  useEffect(() => {  // Monitor width changes of the textarea
    const textarea = textareaRef.current;
    if (!textarea) return;

    let observedWidth = textarea.getBoundingClientRect().width;
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(([entry]) => {
          const nextWidth = entry.contentRect.width;
          if (Math.abs(nextWidth - observedWidth) < 0.5) return;
          observedWidth = nextWidth;
          resize();
        });

    observer?.observe(textarea);  // start to monitor
    window.addEventListener("resize", resize);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [resize]);
  return (
    <textarea
      ref={textareaRef}
      className={`block-textarea ${className}`}
      value={value}
      rows={1}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey && onEnter) {  // when press Enter create a new block
          event.preventDefault();
          onEnter();
        }
        if (event.key === "Backspace" && value === "" && onDeleteEmpty) {  // when the context of the block is empty, delete the block use backspace
          event.preventDefault();
          onDeleteEmpty();
        }
      }}
    />
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

// Paragraph: AutoTextarea
function ParagraphEditor({ block, onChange, onEnter, onDeleteEmpty }) {
  return (
    <AutoTextarea
      value={block.text}
      placeholder="Write something…"
      ariaLabel="Paragraph text"
      onChange={(text) => onChange({ ...block, text })}
      onEnter={onEnter}
      onDeleteEmpty={onDeleteEmpty}
    />
  );
}

// Heading: Select + AutoTextarea
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
      <AutoTextarea
        value={block.text}
        className={`heading-${block.level}`}
        placeholder="Heading"
        ariaLabel="Heading text"
        onChange={(text) => onChange({ ...block, text })}
        onEnter={onEnter}
        onDeleteEmpty={onDeleteEmpty}
      />
    </div>
  );
}

// List: Edit an array(update, addAfter)
function BulletListEditor({ block, onChange, onDeleteEmpty }) {
  const updateItem = (itemId, text) =>
    onChange({
      ...block,
      items: block.items.map((item) =>
        item.id === itemId ? { ...item, text } : item,
      ),
    });
  const addAfter = (itemId) => {
    const index = block.items.findIndex((item) => item.id === itemId);
    const items = [...block.items];
    items.splice(index + 1, 0, { id: createId("item"), text: "" });
    onChange({ ...block, items });
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
          <AutoTextarea
            value={item.text}
            placeholder="List item"
            ariaLabel="Bullet list item"
            onChange={(text) => updateItem(item.id, text)}
            onEnter={() => addAfter(item.id)}
            onDeleteEmpty={() => item.text === "" && removeItem(item.id)}
          />
        </li>
      ))}
    </ul>
  );
}

function NumberedListEditor({ block, onChange, onDeleteEmpty }) {
  const updateItem = (itemId, text) =>
    onChange({
      ...block,
      items: block.items.map((item) =>
        item.id === itemId ? { ...item, text } : item,
      ),
    });
  const addAfter = (itemId) => {
    const index = block.items.findIndex((item) => item.id === itemId);
    const items = [...block.items];
    items.splice(index + 1, 0, { id: createId("item"), text: "" });
    onChange({ ...block, items });
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
          <AutoTextarea
            value={item.text}
            placeholder="List item"
            ariaLabel="Numbered list item"
            onChange={(text) => updateItem(item.id, text)}
            onEnter={() => addAfter(item.id)}
            onDeleteEmpty={() => item.text === "" && removeItem(item.id)}
          />
        </li>
      ))}
    </ol>
  );
}


function TodoListEditor({ block, onChange, onDeleteEmpty }) {
  const updateItem = (itemId, patch) =>
    onChange({
      ...block,
      items: block.items.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    });
  const addAfter = (itemId) => {
    const index = block.items.findIndex((item) => item.id === itemId);
    const items = [...block.items];
    items.splice(index + 1, 0, {
      id: createId("item"),
      text: "",
      checked: false,
    });
    onChange({ ...block, items });
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
          <AutoTextarea
            value={item.text}
            className={item.checked ? "is-complete" : ""}
            placeholder="To-do"
            ariaLabel="To-do list item"
            onChange={(text) => updateItem(item.id, { text })}
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
      <AutoTextarea
        value={block.text}
        placeholder="Write a quotation…"
        ariaLabel="Quote text"
        onChange={(text) => onChange({ ...block, text })}
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
      <AutoTextarea
        value={block.code}
        className="code-textarea"
        placeholder="Write or paste code…"
        ariaLabel="Code block"
        onChange={(code) => onChange({ ...block, code })}
        onDeleteEmpty={onDeleteEmpty}
      />
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
      <AutoTextarea
        value={block.text}
        placeholder="Highlight an important note…"
        ariaLabel="Callout text"
        onChange={(text) => onChange({ ...block, text })}
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
├── AutoTextarea        自动伸缩文本框
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