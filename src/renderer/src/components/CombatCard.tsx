import type { ReactNode } from 'react'

function CrossedSwords() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3.2 2.1 12 10.2l1.4-1.4 1.1 1.1-1.3 1.3 7.6 7.6-1.4 1.4-7.6-7.6-1.3 1.3-1.1-1.1 1.4-1.4L2.1 3.2zm17.6 0L13.3 9.6l1.1 1.1 1.4-1.4 7.1-7.2zM8.2 14.3l1.1 1.1-4 6.5H3.1l5.1-7.6zm7.6 0 5.1 7.6h-2.2l-4-6.5 1.1-1.1z"
      />
    </svg>
  )
}

export default function CombatCard({
  adding,
  onAdd,
  missing = [],
  children
}: {
  adding?: boolean
  onAdd?: () => void
  missing?: string[]
  children: ReactNode
}) {
  return (
    <section className="combat-card my-4">
      <div className="relative rounded-md border border-blood/45 bg-[#1a1416] px-4 pb-3 pt-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-md bg-blood" />
        <div className="absolute -top-3 left-3 flex items-center gap-1.5 bg-panel px-2">
          <span className="text-blood">
            <CrossedSwords />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blood">Combat</span>
        </div>
        {onAdd ? (
          <div className="absolute -top-3 right-3 bg-panel pl-2">
            <button
              type="button"
              title="Load these sheets plus every PC in PCs/party. Anyone already listed is skipped. NPCs/monsters at init 0 are rolled."
              onClick={onAdd}
              className="rounded bg-amber px-2 py-1 text-[11px] font-semibold text-ink"
            >
              {adding ? 'Adding…' : 'Add to initiative'}
            </button>
          </div>
        ) : null}
        <div className="combat-card-body markdown-body text-base">{children}</div>
        {missing.length > 0 ? (
          <p className="mt-2 rounded border border-blood/40 bg-blood/10 px-2 py-1.5 text-[12px] text-blood">
            Missing sheets: {missing.map((name) => `[[${name}]]`).join(' · ')} — create them under Party / NPCs /
            Bestiary or fix the wikilink names.
          </p>
        ) : null}
      </div>
    </section>
  )
}
