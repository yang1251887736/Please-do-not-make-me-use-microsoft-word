// Display the document versions saved by users
// Allow users to create new versions, view version information and restore previous versions
import { useState } from "react";
import { countBlocks } from "../versioning";
const reasonLabels = {
  manual: "Manual",
  "before-import": "Before import",
  "before-reset": "Before reset",
  "before-restore": "Before restore",
};

// Convert time into a readable format
function formatDate(value) {
  return new Intl.DateTimeFormat(void 0, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}


function VersionHistoryPanel({ snapshots, busy, onClose, onSave, onRestore }) {
  const [label, setLabel] = useState("");  // write name
  const submit = async (event) => {
    event.preventDefault();
    const saved = await onSave(label); // create new version
    if (saved) setLabel("");
  };
  return (
    <div className="history-backdrop" role="presentation">
      <aside
        className="history-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
      >
        <header className="history-header">
          <div>
            <p className="eyebrow">Local version control</p>
            <h2 id="history-title">Version history</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Close version history"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <form className="version-form" onSubmit={submit}>
          <label htmlFor="version-label">Name this version</label>
          <div>
            <input
              id="version-label"
              value={label}
              placeholder={`Version ${snapshots.length + 1}`}
              maxLength={80}
              onChange={(event) => setLabel(event.target.value)}
            />
            <button
              className="button button--primary"
              type="submit"
              disabled={busy}
            >
              {busy ? "Saving\u2026" : "Save version"}
            </button>
          </div>
          <small>
            Versions stay in this browser. The newest 30 snapshots are retained.
          </small>
        </form>

        <div className="history-list" aria-live="polite">
          {snapshots.length === 0 ? (
            <div className="history-empty">
              <span aria-hidden="true">↺</span>
              <h3>No saved versions yet</h3>
              <p>
                Create a named checkpoint before making a substantial change.
              </p>
            </div>
          ) : (
            snapshots.map((snapshot) => (     // show history version
              <article className="version-card" key={snapshot.id}>
                <div className="version-card__topline">
                  <span
                    className={`version-reason version-reason--${snapshot.reason}`}
                  >
                    {reasonLabels[snapshot.reason]}
                  </span>
                  <time dateTime={snapshot.createdAt}>
                    {formatDate(snapshot.createdAt)}
                  </time>
                </div>
                <h3>{snapshot.label}</h3>
                <p>
                  {snapshot.document.title || "Untitled document"} ·{" "}
                  {countBlocks(snapshot.document)} blocks
                </p>
                <button
                  className="button version-restore"
                  type="button"
                  disabled={busy}
                  aria-label={`Restore ${snapshot.label}`}
                  onClick={() => onRestore(snapshot)}
                >
                  Restore this version
                </button>
              </article>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
export { VersionHistoryPanel };
