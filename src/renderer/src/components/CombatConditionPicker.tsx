import { useMemo, useState } from 'react'
import {
  combatStatusesFor,
  orderedStatuses,
  statusLabel,
  type CombatStatus
} from '../../../shared/combatConditions'

export function CombatConditionPicker({
  name,
  selected,
  system,
  onToggle,
  onClose
}: {
  name: string
  selected: string[]
  system?: string | null
  onToggle: (id: string) => void
  onClose: () => void
}) {
  const catalog = useMemo(() => combatStatusesFor(system), [system])
  const [query, setQuery] = useState('')
  const active = new Set(orderedStatuses(selected, catalog))
  const filtered = filterCatalog(catalog, query)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="combat-conditions-title"
        className="w-full max-w-md rounded border border-line bg-panel p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="combat-conditions-title" className="font-display text-lg text-amber">
          {name}
        </h3>
        <p className="mt-1 text-sm text-muted">Toggle conditions. Click again to clear.</p>
        {catalog.length > 12 ? (
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter…"
            aria-label={`Filter conditions for ${name}`}
            className="mt-3 w-full rounded border border-line bg-ink px-2 py-1 text-sm"
          />
        ) : null}
        <div className="mt-3 flex max-h-64 flex-wrap gap-1.5 overflow-auto">
          {filtered.map((item) => {
            const on = active.has(item.id)
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={on}
                onClick={() => onToggle(item.id)}
                className={
                  on
                    ? 'rounded bg-amber px-2 py-1 text-[11px] font-semibold text-on-amber'
                    : 'rounded border border-line px-2 py-1 text-[11px] hover:border-amber'
                }
              >
                {item.name}
              </button>
            )
          })}
          {filtered.length === 0 ? <p className="text-xs text-muted">No matching conditions</p> : null}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export function CombatConditionChips({
  ids,
  catalog,
  onToggle,
  onOpen
}: {
  ids: string[]
  catalog: readonly CombatStatus[]
  onToggle: (id: string) => void
  onOpen: () => void
}) {
  const ordered = orderedStatuses(ids, catalog)
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {ordered.map((id) => (
        <button
          key={id}
          type="button"
          title={`Clear ${statusLabel(id, catalog)}`}
          aria-label={`Clear ${statusLabel(id, catalog)}`}
          onClick={() => onToggle(id)}
          className="rounded bg-panel-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber hover:bg-blood/20 hover:text-blood"
        >
          {statusLabel(id, catalog)}
        </button>
      ))}
      <button
        type="button"
        onClick={onOpen}
        aria-label="Add condition"
        className="rounded border border-line px-1.5 py-0.5 text-[10px] text-muted hover:border-amber hover:text-amber"
      >
        +
      </button>
    </div>
  )
}

function filterCatalog(catalog: CombatStatus[], query: string): CombatStatus[] {
  const q = query.trim().toLowerCase()
  if (!q) return catalog
  return catalog.filter((item) => item.name.toLowerCase().includes(q) || item.id.includes(q))
}
