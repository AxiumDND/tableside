import { useEffect, useMemo, useState } from 'react'
import { getSystemPack } from '../../../shared/systemPack'
import { parseBookFiles } from '../lib/bookParse'
import type { CampaignNote } from '../lib/notes'
import type { SrdRecord } from '../lib/srd'
import { getExtraRecords, setExtraRecords } from '../lib/srd'
import { activateSystemLookup } from '../lib/systemLookup'
import { searchCombatants, type CombatantHit } from '../lib/combatantLookup'

export default function CombatantPicker({
  notes,
  system,
  disabled,
  onEnsureMonster,
  onPick
}: {
  notes: CampaignNote[]
  system?: string | null
  disabled?: boolean
  onEnsureMonster?: (
    record: SrdRecord
  ) => Promise<'added' | 'exists' | void> | 'added' | 'exists' | void
  onPick: (hit: CombatantHit) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [booksReady, setBooksReady] = useState(0)
  const pack = getSystemPack(system)

  useEffect(() => {
    if (!open) return
    activateSystemLookup(system)
    if (!pack.bookLookup) return
    if (getExtraRecords().length > 0) {
      setBooksReady((n) => n + 1)
      return
    }
    void window.tabledm.loadBookLibrary().then((library) => {
      setExtraRecords(parseBookFiles(library.files))
      setBooksReady((n) => n + 1)
    })
  }, [open, system, pack.bookLookup])

  const hits = useMemo(
    () => searchCombatants(query, notes),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, notes, booksReady]
  )

  async function pick(hit: CombatantHit): Promise<void> {
    setBusy(true)
    try {
      if (hit.record && onEnsureMonster) {
        await Promise.resolve(onEnsureMonster(hit.record))
      }
      onPick(hit)
      setQuery('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted">Combatants</span>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => setOpen((value) => !value)}
          className="rounded border border-line px-2.5 py-1 text-xs hover:border-amber disabled:opacity-50"
        >
          {open ? 'Close lookup' : 'Add combatant…'}
        </button>
      </div>
      {open ? (
        <div className="mt-1.5 rounded border border-line bg-ink/40 p-2">
          <input
            autoFocus
            value={query}
            disabled={disabled || busy}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search NPCs, Bestiary, SRD, and books…"
            className="w-full rounded border border-line bg-ink px-2 py-1 text-sm text-parchment outline-none focus:border-amber disabled:opacity-50"
          />
          <div className="mt-2 max-h-48 overflow-auto">
            {hits.length === 0 ? (
              <p className="px-1 py-1 text-[11px] text-muted">
                {query.trim()
                  ? 'No matching combatants.'
                  : 'No NPC/Bestiary notes yet — type to search the SRD and books.'}
              </p>
            ) : (
              hits.map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  disabled={disabled || busy}
                  onClick={() => void pick(hit)}
                  className="flex w-full items-baseline justify-between gap-3 rounded px-1 py-1 text-left text-sm hover:bg-panel disabled:opacity-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-parchment">{hit.name}</span>
                    {hit.summary ? (
                      <span className="block truncate text-[11px] text-muted">{hit.summary}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted">
                    {hit.kind === 'npc' ? 'NPC' : 'Monster'}
                    {hit.notePath ? '' : ' · SRD'}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
