export function SessionNotesDiscardDialog({
  onKeepEditing,
  onDiscard,
  onSave
}: {
  onKeepEditing: () => void
  onDiscard: () => void
  onSave: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4" onClick={onKeepEditing}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="discard-edits-title"
        className="w-full max-w-sm rounded border border-line bg-panel p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="discard-edits-title" className="font-display text-lg text-amber">
          Discard edits?
        </h3>
        <p className="mt-2 text-sm text-parchment/90">
          You have unsaved changes to this file. Save them, or throw them away.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onKeepEditing}
            className="rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
          >
            Keep editing
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="rounded border border-line px-3 py-1.5 text-sm hover:border-blood"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded bg-amber px-3 py-1.5 text-sm font-semibold text-on-amber"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
