import { useEffect, useMemo, useState } from 'react'
import { allPartyNotes, sheetDisplayName, type CampaignNote } from '../lib/notes'
import {
  filterQuickConditions,
  lookupConditions,
  quickCalendarNotes,
  quickPartyRows
} from '../lib/quickLinks'
import QuickMenu from './QuickMenu'

function dash(value: string): string {
  return value.trim() || '—'
}

export default function QuickLinksBar({
  notes,
  system,
  onOpenNote
}: {
  notes: CampaignNote[]
  system?: string | null
  onOpenNote: (path: string) => void
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [sheets, setSheets] = useState<Record<string, string>>({})
  const [conditionQuery, setConditionQuery] = useState('')
  const [pickedCondition, setPickedCondition] = useState<string | null>(null)

  const party = useMemo(() => quickPartyRows(notes, sheets), [notes, sheets])
  const calendars = useMemo(() => quickCalendarNotes(notes), [notes])
  const conditions = useMemo(() => lookupConditions(system), [system])
  const shownConditions = useMemo(
    () => filterQuickConditions(conditions, conditionQuery),
    [conditions, conditionQuery]
  )
  const partyPaths = useMemo(() => allPartyNotes(notes).map((note) => note.relativePath), [notes])
  const loadKey = partyPaths.join('|')

  useEffect(() => {
    if (!loadKey) {
      setSheets({})
      return
    }
    const paths = loadKey.split('|')
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
      if (!cancelled) setSheets(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [loadKey])

  useEffect(() => {
    if (openId !== 'conditions') {
      setConditionQuery('')
      setPickedCondition(null)
    }
  }, [openId])

  return (
    <nav
      aria-label="Quick links"
      className="flex h-9 shrink-0 items-center gap-2 border-b border-line bg-panel px-4"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Quick</span>
      <QuickMenu id="party" label="Party" openId={openId} onOpenId={setOpenId} menuClassName="w-[26rem]">
        {party.length === 0 ? (
          <p className="px-3 py-2 text-[13px] text-muted">No Party sheets yet.</p>
        ) : (
          <div className="max-h-80 overflow-auto">
            <div className="grid grid-cols-[minmax(0,1fr)_3rem_3rem_3rem] gap-x-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
              <span>Name</span>
              <span className="text-right">AC</span>
              <span className="text-right" title="Spell save DC">
                DC
              </span>
              <span className="text-right" title="Passive Perception">
                PP
              </span>
            </div>
            {party.map((row) => (
              <button
                key={row.notePath}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpenId(null)
                  onOpenNote(row.notePath)
                }}
                className="grid w-full grid-cols-[minmax(0,1fr)_3rem_3rem_3rem] gap-x-2 px-3 py-1.5 text-left text-[13px] text-parchment/90 hover:bg-panel-2 hover:text-amber"
              >
                <span className="truncate font-semibold">{row.name}</span>
                <span className="text-right tabular-nums">{dash(row.ac)}</span>
                <span className="text-right tabular-nums">{dash(row.saveDc)}</span>
                <span className="text-right tabular-nums">{dash(row.pp)}</span>
              </button>
            ))}
          </div>
        )}
      </QuickMenu>
      <QuickMenu
        id="conditions"
        label="Conditions"
        openId={openId}
        onOpenId={setOpenId}
        menuClassName="w-[22rem]"
      >
        <div className="px-2 pb-1">
          <input
            type="search"
            value={conditionQuery}
            onChange={(event) => setConditionQuery(event.target.value)}
            placeholder="Filter…"
            aria-label="Filter conditions"
            className="w-full rounded border border-line bg-ink px-2 py-1 text-[13px] outline-none focus:border-amber"
          />
        </div>
        <ul className="max-h-72 overflow-auto">
          {shownConditions.length === 0 ? (
            <li className="px-3 py-2 text-[13px] text-muted">No matching conditions</li>
          ) : (
            shownConditions.map((item) => {
              const selected = pickedCondition === item.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="menuitem"
                    aria-expanded={selected}
                    onClick={() => setPickedCondition(selected ? null : item.id)}
                    className="w-full px-3 py-1.5 text-left text-[13px] text-parchment/90 hover:bg-panel-2 hover:text-amber"
                  >
                    <span className="font-semibold">{item.name}</span>
                    {selected && item.desc ? (
                      <span className="mt-1 block text-[12px] font-normal leading-snug text-muted">
                        {item.desc}
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </QuickMenu>
      <QuickMenu id="calendar" label="Calendar" openId={openId} onOpenId={setOpenId}>
        {calendars.length === 0 ? (
          <p className="px-3 py-2 text-[13px] leading-snug text-muted">
            No calendar notes yet. Add one in <span className="text-parchment/80">Reference/</span> — an in-world
            date tracker is planned.
          </p>
        ) : (
          <ul className="max-h-64 overflow-auto">
            {calendars.map((note) => (
              <li key={note.relativePath}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpenId(null)
                    onOpenNote(note.relativePath)
                  }}
                  className="w-full truncate px-3 py-1.5 text-left text-[13px] text-parchment/90 hover:bg-panel-2 hover:text-amber"
                >
                  {sheetDisplayName(note.stem)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </QuickMenu>
    </nav>
  )
}
