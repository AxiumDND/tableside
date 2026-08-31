import { useState, type ReactNode } from 'react'
import type { CalloutKind } from '../../../shared/callouts'
import { defaultBlockTemplate, insertableBlockKinds } from '../../../shared/blockIndex'

export const BLOCK_KIND_LABELS: Partial<Record<CalloutKind, string>> = {
  text: 'Text',
  abstract: 'Summary',
  links: 'Links',
  scene: 'Scene',
  readaloud: 'Read aloud',
  gmonly: 'GM only',
  combat: 'Combat',
  treasure: 'Treasure',
  legend: 'Campfire chronicle',
  crawl: 'Opening crawl',
  gallery: 'Gallery',
  video: 'Video',
  party: 'Party',
  note: 'Note'
}

export function sheetBlockDomId(blockKey: string): string {
  return `sheet-block-${blockKey.replace(/:/g, '-')}`
}

export default function SheetBlockShell({
  blockKey,
  editing,
  disabled,
  defaultKind = 'text',
  insertKinds,
  onEdit,
  onDone,
  onInsertAbove,
  onInsertBelow,
  onDelete,
  headerRight,
  children,
  footer
}: {
  blockKey?: string
  editing: boolean
  disabled?: boolean
  defaultKind?: CalloutKind
  insertKinds?: CalloutKind[]
  onEdit: () => void
  onDone: () => void
  onInsertAbove?: (kind: CalloutKind) => void
  onInsertBelow?: (kind: CalloutKind) => void
  onDelete?: () => void
  headerRight?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  const kinds = insertKinds ?? insertableBlockKinds()
  const selectDefault = kinds.includes(defaultKind) ? defaultKind : (kinds[0] ?? 'text')
  const [confirmDelete, setConfirmDelete] = useState(false)

  function insertControl(position: 'above' | 'below', handler?: (kind: CalloutKind) => void): ReactNode {
    if (!editing || !handler) return null
    const selectId = `block-insert-${position}`
    return (
      <div className="inline-flex items-center gap-1 text-[11px] text-muted">
        <label htmlFor={selectId}>{position === 'above' ? 'Add above' : 'Add below'}</label>
        <select
          id={selectId}
          defaultValue={selectDefault}
          disabled={disabled || confirmDelete}
          className="rounded border border-line bg-ink px-1 py-0.5 text-[11px] text-parchment outline-none focus:border-amber disabled:opacity-50"
        >
          {kinds.map((kind) => (
            <option key={kind} value={kind}>
              {BLOCK_KIND_LABELS[kind] ?? kind}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={disabled || confirmDelete}
          onClick={() => {
            const select = document.getElementById(selectId) as HTMLSelectElement | null
            const kind = (select?.value ?? selectDefault) as CalloutKind
            if (!kinds.includes(kind)) return
            handler(kind)
          }}
          className="rounded border border-line px-1.5 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
        >
          Add
        </button>
      </div>
    )
  }

  return (
    <div
      id={blockKey ? sheetBlockDomId(blockKey) : undefined}
      className="sheet-block-shell relative scroll-mt-3"
    >
      <div className="absolute -top-3 right-3 z-10 flex items-center gap-1.5 bg-panel pl-2">
        {headerRight}
        {editing ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setConfirmDelete(false)
              // Let any focused block editor blur/flush before leaving edit mode.
              window.setTimeout(() => onDone(), 0)
            }}
            className="rounded border border-amber/60 px-2 py-0.5 text-[11px] font-semibold text-amber hover:border-amber disabled:text-muted"
          >
            Done
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={onEdit}
            className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
          >
            Edit
          </button>
        )}
      </div>
      {editing && (onInsertAbove || onInsertBelow || onDelete) ? (
        <div className="mb-2 flex flex-wrap items-center gap-3 border-b border-line/60 pb-2 pl-2 pt-1">
          {insertControl('above', onInsertAbove)}
          {insertControl('below', onInsertBelow)}
          {onDelete ? (
            confirmDelete ? (
              <div className="inline-flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-blood">Delete this block?</span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setConfirmDelete(false)
                    onDelete()
                  }}
                  className="rounded border border-blood/60 bg-blood/15 px-1.5 py-0.5 font-semibold text-blood hover:border-blood disabled:text-muted"
                >
                  Yes, delete
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setConfirmDelete(false)}
                  className="rounded border border-line px-1.5 py-0.5 hover:border-amber disabled:text-muted"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={disabled}
                onClick={() => setConfirmDelete(true)}
                className="rounded border border-line px-1.5 py-0.5 text-[11px] text-muted hover:border-blood hover:text-blood disabled:opacity-50"
              >
                Delete block
              </button>
            )
          ) : null}
        </div>
      ) : null}
      {children}
      {footer}
    </div>
  )
}

export function blockTemplateForKind(kind: CalloutKind): string {
  return defaultBlockTemplate(kind)
}
