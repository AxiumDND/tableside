import { useEffect, useMemo, useState } from 'react'
import { portraitSrcForNote, type CampaignImage } from '../lib/images'
import { npcNotes, resolveNoteRef, sheetDisplayName, type CampaignNote } from '../lib/notes'

type PhoneFields = {
  npcRef: string | null
  ringRef: string | null
}

export default function PhoneCard({
  npcRef,
  ringRef,
  notes,
  images,
  fromPath,
  disabled,
  editing = false,
  onChange,
  onPlay,
  onStop,
  onAnswer,
  phoneActive,
  phoneAnswered,
  onLoadRing
}: {
  npcRef: string | null
  ringRef: string | null
  notes: CampaignNote[]
  images: CampaignImage[]
  fromPath: string
  disabled?: boolean
  editing?: boolean
  onChange: (next: PhoneFields) => void
  onPlay?: (fields: PhoneFields) => void
  onStop?: () => void
  onAnswer?: () => void
  phoneActive?: boolean
  phoneAnswered?: boolean
  onLoadRing?: () => Promise<string | null>
}) {
  const [npcValue, setNpcValue] = useState(npcRef)
  const [ringValue, setRingValue] = useState(ringRef)
  const [busy, setBusy] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    setNpcValue(npcRef)
    setRingValue(ringRef)
  }, [npcRef, ringRef])

  function commit(partial?: { npcRef?: string | null; ringRef?: string | null }): void {
    onChange({
      npcRef: partial && 'npcRef' in partial ? partial.npcRef ?? null : npcValue,
      ringRef: partial && 'ringRef' in partial ? partial.ringRef ?? null : ringValue
    })
  }

  async function loadRing(): Promise<void> {
    if (!onLoadRing) return
    setBusy(true)
    try {
      const next = await onLoadRing()
      if (next) {
        setRingValue(next)
        commit({ ringRef: next })
      }
    } finally {
      setBusy(false)
    }
  }

  const note = npcValue ? resolveNoteRef(npcValue, fromPath, notes) : null
  const callerName = note ? sheetDisplayName(note.stem) : npcValue?.trim() || ''
  const photoSrc = note ? portraitSrcForNote(note.relativePath, images) : null

  const fields = (): PhoneFields => ({
    npcRef: npcValue,
    ringRef: ringValue
  })

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase()
    return npcNotes(notes).filter((item) => {
      const name = sheetDisplayName(item.stem)
      if (!q) return true
      return name.toLowerCase().includes(q)
    })
  }, [notes, query])

  return (
    <section className="player-phone-card my-5">
      <div className="relative rounded-md border border-amber/40 bg-panel-2 px-4 pb-4 pt-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-md bg-amber" />
        <div className="absolute -top-3 left-3 flex items-center gap-1.5 bg-panel px-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber">Phone</span>
          {!editing && callerName ? (
            <span className="max-w-[14rem] truncate text-[11px] font-normal italic text-muted">{callerName}</span>
          ) : null}
        </div>
        {editing ? (
          <div className="space-y-3 pl-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted">Caller</span>
              <p className="mt-0.5 text-[11px] text-muted">Pick an NPC. Name and portrait come from that sheet.</p>
              <CallerPreview name={callerName} photoSrc={photoSrc} />
              <div className="mt-2">
                <button
                  type="button"
                  disabled={disabled || phoneActive}
                  onClick={() => setPickerOpen((open) => !open)}
                  className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
                >
                  {pickerOpen ? 'Close lookup' : npcValue ? 'Change NPC…' : 'Choose NPC…'}
                </button>
                {npcValue ? (
                  <button
                    type="button"
                    disabled={disabled || phoneActive}
                    onClick={() => {
                      setNpcValue(null)
                      commit({ npcRef: null })
                    }}
                    className="ml-1 rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              {pickerOpen ? (
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
                          : 'No NPC sheets — right-click NPCs/ → New NPC…'}
                      </p>
                    ) : (
                      hits.map((item) => (
                        <button
                          key={item.relativePath}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            setNpcValue(item.stem)
                            commit({ npcRef: item.stem })
                            setQuery('')
                            setPickerOpen(false)
                          }}
                          className="flex w-full items-baseline justify-between gap-3 rounded px-1 py-1 text-left text-sm hover:bg-panel disabled:opacity-50"
                        >
                          <span className="min-w-0 truncate text-parchment">{sheetDisplayName(item.stem)}</span>
                          <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted">NPC</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted">Ringtone</span>
              <p className="mt-0.5 text-[11px] text-muted">
                Optional. Empty uses a built-in ring (not a licensed phone tone).
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  disabled={disabled || busy || phoneActive || !onLoadRing}
                  onClick={() => void loadRing()}
                  className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
                >
                  {ringValue ? 'Change ring…' : 'Load ring…'}
                </button>
                {ringValue ? (
                  <button
                    type="button"
                    disabled={disabled || phoneActive}
                    onClick={() => {
                      setRingValue(null)
                      commit({ ringRef: null })
                    }}
                    className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
                  >
                    Use built-in
                  </button>
                ) : null}
              </div>
              {ringValue ? (
                <p className="mt-1 truncate text-[11px] text-muted">{ringValue.split(/[\\/]/).pop()}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="pl-2">
            <CallerPreview name={callerName} photoSrc={photoSrc} />
            <p className="mt-1 text-[11px] text-muted">
              {ringValue ? `Ring: ${ringValue.split(/[\\/]/).pop()}` : 'Built-in ring'}
            </p>
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 pl-2">
          {phoneActive ? (
            <>
              {!phoneAnswered ? (
                <button
                  type="button"
                  onClick={() => onAnswer?.()}
                  disabled={!onAnswer}
                  className="rounded bg-moss px-2.5 py-1 text-xs font-semibold text-ink disabled:bg-line disabled:text-muted"
                >
                  Answer
                </button>
              ) : (
                <span className="text-[11px] text-moss">Connected</span>
              )}
              <button
                type="button"
                onClick={() => onStop?.()}
                disabled={!onStop}
                className="rounded border border-line px-2.5 py-1 text-xs font-semibold hover:border-amber disabled:text-muted"
              >
                Hang up
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                const next = fields()
                onChange(next)
                onPlay?.(next)
              }}
              disabled={!npcValue?.trim() || !onPlay}
              className="rounded bg-amber px-2.5 py-1 text-xs font-semibold text-on-amber disabled:bg-line disabled:text-muted"
            >
              Play
            </button>
          )}
          {!npcValue?.trim() ? <span className="text-[11px] text-muted">Pick an NPC</span> : null}
        </div>
      </div>
    </section>
  )
}

function CallerPreview({ name, photoSrc }: { name: string; photoSrc?: string | null }) {
  return (
    <div className="mt-1 flex items-center gap-3">
      {photoSrc ? (
        <img src={photoSrc} alt="" className="h-12 w-12 rounded-full object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-xs text-muted">
          {callerInitials(name)}
        </div>
      )}
      <p className="min-w-0 truncate text-sm text-parchment">{name.trim() || 'No NPC selected'}</p>
    </div>
  )
}

function callerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts[parts.length - 1]!.slice(0, 1)}`.toUpperCase()
}
