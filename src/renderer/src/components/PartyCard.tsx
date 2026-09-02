import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CampaignImage } from '../lib/images'
import { npcNotes, sheetDisplayName, type CampaignNote } from '../lib/notes'
import {
  partyBlockHasLink,
  partyGlanceRows,
  type PartyGlanceRow
} from '../lib/partyGlance'
import NoteWikiLink from './NoteWikiLink'

function PartyMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
      />
    </svg>
  )
}

function GlanceTable({
  rows,
  onOpenNote,
  images
}: {
  rows: PartyGlanceRow[]
  onOpenNote?: (path: string) => void
  images?: CampaignImage[]
}) {
  if (rows.length === 0) return null
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className="text-[10px] uppercase tracking-[0.14em] text-muted">
            <th className="border-b border-line py-1 pr-3 font-semibold">Name</th>
            <th className="border-b border-line py-1 pr-3 font-semibold">Race</th>
            <th className="border-b border-line py-1 pr-3 font-semibold">Class</th>
            <th className="border-b border-line py-1 pr-3 font-semibold">AC</th>
            <th className="border-b border-line py-1 font-semibold">HP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.notePath} className="text-fg">
              <td className="border-b border-line/60 py-1.5 pr-3">
                <span className="inline-flex flex-wrap items-baseline gap-2">
                  <NoteWikiLink notePath={row.notePath} onOpenNote={onOpenNote} images={images}>
                    {row.name}
                  </NoteWikiLink>
                  {row.beyondUrl ? (
                    <button
                      type="button"
                      onClick={() => onOpenNote?.(row.notePath)}
                      className="text-[10px] uppercase tracking-wider text-amber hover:underline"
                      title="Open the live web sheet"
                    >
                      Web
                    </button>
                  ) : null}
                </span>
              </td>
              <td className="border-b border-line/60 py-1.5 pr-3">{row.race}</td>
              <td className="border-b border-line/60 py-1.5 pr-3">{row.className}</td>
              <td className="border-b border-line/60 py-1.5 pr-3">{row.ac}</td>
              <td className="border-b border-line/60 py-1.5">{row.hp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CompanionLinks({
  rows,
  editing,
  disabled,
  onOpenNote,
  onRemove,
  images
}: {
  rows: PartyGlanceRow[]
  editing?: boolean
  disabled?: boolean
  onOpenNote?: (path: string) => void
  onRemove?: (stem: string) => void
  images?: CampaignImage[]
}) {
  if (rows.length === 0 && !editing) return null
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted">Travelling with</p>
      {rows.length === 0 ? (
        <p className="mt-1 text-[12px] text-muted">No companions linked yet.</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {rows.map((row) => (
            <li key={row.notePath} className="flex flex-wrap items-baseline gap-2 text-sm">
              <NoteWikiLink notePath={row.notePath} onOpenNote={onOpenNote} images={images}>
                {row.name}
              </NoteWikiLink>
              {editing && onRemove ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRemove(row.stem)}
                  className="text-[11px] text-muted hover:text-blood disabled:opacity-50"
                >
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PartyNpcPicker({
  notes,
  listed,
  disabled,
  onPick
}: {
  notes: CampaignNote[]
  listed: string
  disabled?: boolean
  onPick: (stem: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const hits = useMemo(() => {
    const q = query.trim().toLowerCase()
    return npcNotes(notes).filter((note) => {
      if (partyBlockHasLink(listed, note.stem)) return false
      const name = sheetDisplayName(note.stem)
      if (!q) return true
      return name.toLowerCase().includes(q)
    })
  }, [notes, listed, query])

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted">Companions</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((value) => !value)}
          className="rounded border border-line px-2.5 py-1 text-xs hover:border-amber disabled:opacity-50"
        >
          {open ? 'Close lookup' : 'Add NPC…'}
        </button>
      </div>
      {open ? (
        <div className="mt-1.5 rounded border border-line bg-ink/40 p-2">
          <input
            autoFocus
            value={query}
            disabled={disabled}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search NPCs…"
            className="w-full rounded border border-line bg-ink px-2 py-1 text-sm text-parchment outline-none focus:border-amber disabled:opacity-50"
          />
          <div className="mt-2 max-h-48 overflow-auto">
            {hits.length === 0 ? (
              <p className="px-1 py-1 text-[11px] text-muted">
                {query.trim()
                  ? 'No matching NPCs.'
                  : 'No NPC sheets left to add — right-click NPCs/ → New NPC…'}
              </p>
            ) : (
              hits.map((note) => (
                <button
                  key={note.relativePath}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onPick(note.stem)
                    setQuery('')
                  }}
                  className="flex w-full items-baseline justify-between gap-3 rounded px-1 py-1 text-left text-sm hover:bg-panel disabled:opacity-50"
                >
                  <span className="min-w-0 truncate text-parchment">{sheetDisplayName(note.stem)}</span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted">NPC</span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function PartyCard({
  title,
  children,
  markdown,
  fromPath,
  notes,
  onOpenNote,
  images,
  editing,
  disabled,
  onAddNpc,
  onRemoveNpc
}: {
  title?: string
  children: ReactNode
  markdown?: string
  fromPath?: string
  notes?: CampaignNote[]
  onOpenNote?: (path: string) => void
  images?: CampaignImage[]
  editing?: boolean
  disabled?: boolean
  onAddNpc?: (stem: string) => void
  onRemoveNpc?: (stem: string) => void
}) {
  const [sheets, setSheets] = useState<Record<string, string>>({})
  const rows = useMemo(
    () =>
      markdown && fromPath && notes
        ? partyGlanceRows(markdown, fromPath, notes, sheets)
        : [],
    [markdown, fromPath, notes, sheets]
  )
  const pcs = rows.filter((row) => !row.companion)
  const companions = rows.filter((row) => row.companion)
  const loadKey = rows.map((row) => row.notePath).join('|')

  useEffect(() => {
    if (!loadKey) {
      setSheets({})
      return
    }
    const paths = loadKey.split('|').filter(Boolean)
    let cancelled = false
    void Promise.all(
      paths.map(async (path) => {
        try {
          const body = await window.tabledm.readFile(path)
          return [path, body] as const
        } catch {
          return [path, ''] as const
        }
      })
    ).then((entries) => {
      if (cancelled) return
      setSheets(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [loadKey])

  return (
    <section className="party-card my-5">
      <div className="relative rounded-md border border-amber/30 bg-panel-2 px-4 pb-4 pt-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-md bg-amber-dim" />
        <div className="absolute -top-3 left-3 flex items-center gap-1.5 bg-panel px-2">
          <span className="text-amber-dim">
            <PartyMark />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-dim">Party</span>
          {title ? (
            <span className="max-w-[18rem] truncate font-display text-[13px] font-normal text-amber">{title}</span>
          ) : null}
        </div>
        <div className="party-card-body space-y-3 pl-2">
          <GlanceTable rows={pcs} onOpenNote={onOpenNote} images={images} />
          <CompanionLinks
            rows={companions}
            editing={editing}
            disabled={disabled}
            onOpenNote={onOpenNote}
            onRemove={onRemoveNpc}
            images={images}
          />
          {editing && notes && markdown != null && onAddNpc ? (
            <PartyNpcPicker notes={notes} listed={markdown} disabled={disabled} onPick={onAddNpc} />
          ) : null}
          {children}
        </div>
      </div>
    </section>
  )
}
