import { SYSTEM_PACKS, type SystemId } from '../../../shared/systemPack'

const ORDER: SystemId[] = ['dnd5e', 'pf2e', 'v5']

export default function SystemPicker({
  onPick,
  onCancel
}: {
  onPick: (system: SystemId) => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="system-picker-title"
        className="w-full max-w-lg rounded border border-line bg-panel p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="system-picker-title" className="font-display text-lg text-amber">
          Choose a system
        </h3>
        <p className="mt-2 text-sm text-parchment/90">
          Lookup, sheet templates, and the combat tracker follow this pack. You cannot change it later without starting
          a new folder.
        </p>
        <ul className="mt-3 space-y-2">
          {ORDER.map((id) => {
            const pack = SYSTEM_PACKS[id]
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onPick(id)}
                  className="w-full rounded border border-line px-3 py-2.5 text-left hover:border-amber"
                >
                  <span className="block text-sm font-semibold text-parchment">{pack.label}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-muted">{pack.blurb}</span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
