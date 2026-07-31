// Display a menu
// Select the type of block to insert(paragraphs, headings, images, lists, quote, code, divider)
const options = [
  { type: "paragraph", icon: "\xB6", label: "Text", hint: "Plain paragraph" },
  { type: "heading", icon: "H", label: "Heading", hint: "Section title" },
  { type: "image", icon: "\u25A7", label: "Image", hint: "Upload from device" },
  {
    type: "bulletList",
    icon: "\u2022",
    label: "Bulleted list",
    hint: "Simple list",
  },
  {
    type: "numberedList",
    icon: "1.",
    label: "Numbered list",
    hint: "Ordered steps",
  },
  {
    type: "todoList",
    icon: "\u2611",
    label: "To-do list",
    hint: "Checkable tasks",
  },
  {
    type: "quote",
    icon: "\u201C",
    label: "Quote",
    hint: "Quotation and source",
  },
  { type: "code", icon: "</>", label: "Code", hint: "Code with language" },
  { type: "callout", icon: "!", label: "Callout", hint: "Highlighted note" },
  {
    type: "divider",
    icon: "\u2014",
    label: "Divider",
    hint: "Visual separator",
  },
];
function AddBlockMenu({ onSelect, onClose }) {
  return (
    <div className="block-menu" role="menu" aria-label="Add a block">
      <div className="block-menu__header">
        <span>Add a block</span>
        <button
          className="icon-button compact"
          type="button"
          onClick={onClose}
          aria-label="Close block menu"
        >
          ×
        </button>
      </div>
      {/* generate a menu button for each block type
      When the user clicks a specific button, pass the corresponding block type to the parent component. */}
      {options.map((option) => (
        <button
          key={option.type}
          className="block-menu__item"
          type="button"
          role="menuitem"
          onClick={() => onSelect(option.type)}
        >
          <span className="block-menu__icon" aria-hidden="true">
            {option.icon}
          </span>
          <span>
            <strong>{option.label}</strong>
            <small>{option.hint}</small>
          </span>
        </button>
      ))}
    </div>
  );
}
export { AddBlockMenu };
