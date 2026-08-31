import type { CalloutKind } from '../../../shared/callouts'
import { BLOCK_KIND_LABELS, sheetBlockDomId } from './SheetBlockShell'

export type BlockNavEntry = {
  key: string
  kind: CalloutKind
  title?: string
  depth: number
}

function LinkMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10.6 13.4a1 1 0 0 1 0-1.4l2-2a1 1 0 1 1 1.4 1.4l-2 2a1 1 0 0 1-1.4 0zm-1.2-5.2 2-2a4 4 0 0 1 5.6 5.6l-2 2a1 1 0 1 1-1.4-1.4l2-2a2 2 0 1 0-2.8-2.8l-2 2a1 1 0 0 1-1.4-1.4zm-4.8 4.8 2-2a1 1 0 0 1 1.4 1.4l-2 2a2 2 0 1 0 2.8 2.8l2-2a1 1 0 1 1 1.4 1.4l-2 2a4 4 0 1 1-5.6-5.6z"
      />
    </svg>
  )
}

function entryLabel(entry: BlockNavEntry): string {
  const kindLabel = BLOCK_KIND_LABELS[entry.kind] ?? entry.kind
  const title = entry.title?.trim()
  return title ? `${kindLabel} — ${title}` : kindLabel
}

export default function LinksCard({
  title,
  entries,
  onJump
}: {
  title?: string
  entries: BlockNavEntry[]
  onJump?: (blockKey: string) => void
}) {
  return (
    <section className="links-card my-5">
      <div className="relative rounded-md border border-amber/30 bg-panel-2 px-4 pb-4 pt-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-md bg-amber-dim" />
        <div className="absolute -top-3 left-3 flex items-center gap-1.5 bg-panel px-2">
          <span className="text-amber-dim">
            <LinkMark />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-dim">Links</span>
          {title?.trim() ? (
            <span className="max-w-[14rem] truncate text-[11px] font-normal italic text-muted">{title.trim()}</span>
          ) : null}
        </div>
        <nav className="pl-2">
          {entries.length === 0 ? (
            <p className="text-[12px] text-muted">No other blocks on this sheet yet.</p>
          ) : (
            <ul className="space-y-1">
              {entries.map((entry) => (
                <li key={entry.key} style={{ paddingLeft: entry.depth * 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      onJump?.(entry.key)
                      document.getElementById(sheetBlockDomId(entry.key))?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                      })
                    }}
                    className="w-full truncate text-left text-[13px] text-parchment hover:text-amber"
                  >
                    {entryLabel(entry)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </div>
    </section>
  )
}
