import { imageTitle } from '../lib/images'
import { looksLikeShopNote } from '../../../shared/shopStock'
import { pathHasFolder } from '../../../shared/campaignLayout'
import type { NoteHeading } from '../lib/noteHeadings'
import type { FileKind } from './CampaignFiles'

export function SessionNotesHeader({
  path,
  kind,
  sheetChrome,
  mapMode,
  editing,
  dirty,
  headings,
  showLinks,
  onToggleLinks,
  onJump,
  onBack,
  backLabel,
  onNext,
  nextLabel,
  disabled,
  shopsEnabled,
  markdown,
  onCancel,
  onSave,
  onEdit,
  onRerollStock,
  canShowArt,
  canShowItem,
  itemMode,
  onShowToPlayers,
  handoutLabel
}: {
  path: string
  kind: FileKind
  sheetChrome: boolean
  mapMode: boolean
  editing: boolean
  dirty: boolean
  headings: NoteHeading[]
  showLinks: boolean
  onToggleLinks: () => void
  onJump: (id: string) => void
  onBack?: () => void
  backLabel?: string
  onNext?: () => void
  nextLabel?: string
  disabled?: boolean
  shopsEnabled?: boolean
  markdown: string
  onCancel: () => void
  onSave: () => void
  onEdit: () => void
  onRerollStock?: () => void
  canShowArt: boolean
  canShowItem: boolean
  itemMode: boolean
  onShowToPlayers?: (options?: {
    includeSecrets?: boolean
    markdown?: string
    mode?: 'art' | 'handout'
  }) => void
  handoutLabel: string
}) {
  return (
    <>
      <header className="border-b border-line bg-panel px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {onBack ? (
              <button
                type="button"
                title={backLabel ? `Back to ${backLabel}` : 'Back'}
                onClick={onBack}
                className="shrink-0 rounded border border-line px-2 py-1 text-xs hover:border-amber"
              >
                ← Back
              </button>
            ) : null}
            {onNext ? (
              <button
                type="button"
                title={nextLabel ? `Next: ${nextLabel}` : 'Next'}
                onClick={onNext}
                className="shrink-0 rounded border border-line px-2 py-1 text-xs hover:border-amber"
              >
                Next →
              </button>
            ) : null}
            {sheetChrome ? (
              path ? (
                <span className="min-w-0 truncate text-[11px] text-muted">{path.split(/[\\/]/)[0]}</span>
              ) : null
            ) : (
              <h2 className="min-w-0 truncate font-display text-lg text-amber">
                {path ? imageTitle(path).replace(/^PC\s+[—–-]\s+/i, '') : 'Notes'}
                {dirty ? <span className="ml-2 text-xs font-sans text-amber-dim">unsaved</span> : null}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            {kind === 'note' && path && headings.length > 0 && !editing && !sheetChrome && !mapMode ? (
              <button
                type="button"
                onClick={onToggleLinks}
                className={`rounded px-2.5 py-1 text-xs ${
                  showLinks ? 'bg-amber font-semibold text-on-amber' : 'border border-line hover:border-amber'
                }`}
              >
                Links
              </button>
            ) : null}
            {kind === 'note' && path ? (
              editing ? (
                <>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="rounded border border-line px-2.5 py-1 text-xs hover:border-amber"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={onSave}
                    className="rounded bg-amber px-2.5 py-1 text-xs font-semibold text-on-amber disabled:bg-line"
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  {shopsEnabled && pathHasFolder(path, 'places') && looksLikeShopNote(markdown) ? (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onRerollStock?.()}
                      className="rounded border border-line px-2.5 py-1 text-xs hover:border-amber"
                    >
                      Reroll stock
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={onEdit}
                    className="rounded border border-line px-2.5 py-1 text-xs hover:border-amber"
                  >
                    Edit
                  </button>
                </>
              )
            ) : null}
            {canShowArt ? (
              <button
                type="button"
                title="Show the selected art only (Alt+S)"
                onClick={() => onShowToPlayers?.({ mode: 'art', markdown })}
                className="rounded bg-amber px-2.5 py-1 text-xs font-semibold text-on-amber"
              >
                {itemMode ? 'Show art to players' : 'Show to players'}
              </button>
            ) : null}
            {canShowItem ? (
              <button
                type="button"
                title="Show art and item details. Shift+click includes GM-only notes (Alt+I)."
                onClick={(event) =>
                  onShowToPlayers?.({
                    mode: 'handout',
                    includeSecrets: event.shiftKey,
                    markdown
                  })
                }
                className="rounded border border-amber px-2.5 py-1 text-xs font-semibold text-amber hover:bg-amber/10"
              >
                {handoutLabel}
              </button>
            ) : null}
          </div>
        </div>
        {path && !sheetChrome ? <div className="truncate text-[11px] text-muted">{path}</div> : null}
      </header>

      {kind === 'note' && headings.length > 0 && !editing && !sheetChrome && !mapMode && showLinks ? (
        <nav className="max-h-28 overflow-auto border-b border-line px-3 py-2 text-xs">
          {headings.map((heading) => (
            <button
              key={heading.id}
              type="button"
              onClick={() => onJump(heading.id)}
              className="block w-full truncate text-left text-muted hover:text-amber"
              style={{ paddingLeft: (heading.level - 1) * 10 }}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      ) : null}
    </>
  )
}
