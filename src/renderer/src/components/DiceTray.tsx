import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { rollExpr, type DiceResult } from '../lib/dice'

export interface DiceLogEntry {
  id: string
  source?: string
  result: DiceResult
}

interface DiceLogApi {
  entries: DiceLogEntry[]
  record: (result: DiceResult, source?: string) => void
  recordMany: (items: { result: DiceResult; source?: string }[]) => void
  clear: () => void
}

const DiceLogContext = createContext<DiceLogApi>({
  entries: [],
  record: () => undefined,
  recordMany: () => undefined,
  clear: () => undefined
})

export function useDiceLog(): DiceLogApi {
  return useContext(DiceLogContext)
}

/** Latest roll plus this many previous lines in the tray. */
export const DICE_HISTORY_SLOTS = 4
const LOG_CAP = 1 + DICE_HISTORY_SLOTS

export function DiceLogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<DiceLogEntry[]>([])

  const api = useMemo<DiceLogApi>(
    () => ({
      entries,
      record(result, source) {
        setEntries((prev) => [{ id: crypto.randomUUID(), source, result }, ...prev].slice(0, LOG_CAP))
      },
      recordMany(items) {
        if (items.length === 0) return
        const next = items.map((item) => ({
          id: crypto.randomUUID(),
          source: item.source,
          result: item.result
        }))
        setEntries((prev) => [...next, ...prev].slice(0, LOG_CAP))
      },
      clear() {
        setEntries([])
      }
    }),
    [entries]
  )

  return <DiceLogContext.Provider value={api}>{children}</DiceLogContext.Provider>
}

const TRAY_DICE = [4, 6, 8, 10, 12, 20, 100] as const

function dieTone(value: number, sides: number): string {
  if (sides === 20 && value === 20) return 'border-moss bg-moss/20 text-moss'
  if (sides === 20 && value === 1) return 'border-blood bg-blood/20 text-blood'
  return 'border-line bg-panel-2 text-amber'
}

function entryLabel(entry: DiceLogEntry): string {
  return `${entry.source && entry.source !== 'Tray' ? `${entry.source} · ` : ''}${entry.result.expr}`
}

export default function DiceTray() {
  const { entries, record, clear } = useDiceLog()
  const [expr, setExpr] = useState('')
  const latest = entries[0] ?? null

  function rollFormula(): void {
    const raw = expr.trim() || '1d20'
    record(rollExpr(raw), 'Tray')
    setExpr('')
  }

  return (
    <section className="flex h-48 shrink-0 flex-col overflow-hidden border-t border-line bg-panel px-2 py-2">
      <header className="mb-1 flex h-4 shrink-0 items-center justify-between">
        <h2 className="text-[10px] uppercase tracking-wider text-muted">Dice tray</h2>
        {entries.length > 0 ? (
          <button type="button" onClick={clear} className="text-[10px] text-muted hover:text-amber">
            Clear log
          </button>
        ) : null}
      </header>

      <div className="flex shrink-0 flex-nowrap gap-0.5">
        {TRAY_DICE.map((sides) => (
          <button
            key={sides}
            type="button"
            title={`Roll 1d${sides}`}
            onClick={() => record(rollExpr(`1d${sides}`), 'Tray')}
            className="min-w-0 flex-1 rounded border border-line px-0.5 py-0.5 text-[10px] font-semibold hover:border-amber hover:text-amber"
          >
            d{sides}
          </button>
        ))}
      </div>

      <form
        className="mt-1.5 flex shrink-0 gap-1"
        onSubmit={(e) => {
          e.preventDefault()
          rollFormula()
        }}
      >
        <input
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder="2d6+3"
          className="min-w-0 flex-1 rounded border border-line bg-ink px-2 py-0.5 text-[11px]"
        />
        <button type="submit" className="rounded bg-amber px-2 py-0.5 text-[11px] font-semibold text-on-amber">
          Roll
        </button>
      </form>

      <div className="mt-1.5 flex h-7 shrink-0 items-center gap-1.5 overflow-hidden rounded border border-amber-dim/60 bg-ink px-2">
        {latest ? (
          <>
            <p className="min-w-0 shrink truncate text-[11px] text-muted">{entryLabel(latest)}</p>
            {latest.result.rolls.length > 0 ? (
              <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden">
                {latest.result.rolls.map((value, i) => (
                  <span
                    key={`${latest.id}-${i}`}
                    className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded border px-0.5 text-[10px] font-semibold ${dieTone(value, latest.result.sides)}`}
                  >
                    {value}
                  </span>
                ))}
                {latest.result.bonus ? (
                  <span className="shrink-0 text-[11px] text-muted">
                    {latest.result.bonus > 0 ? '+' : ''}
                    {latest.result.bonus}
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="min-w-0 flex-1 truncate text-[11px] text-muted">{latest.result.detail}</p>
            )}
            <p className="shrink-0 font-display text-lg leading-none text-amber">{latest.result.total}</p>
          </>
        ) : (
          <p className="truncate text-[11px] text-muted">Roll a die, or click a score on a sheet.</p>
        )}
      </div>

      <ul className="mt-1 grid min-h-0 flex-1 grid-rows-4 text-[11px] leading-none text-muted">
        {Array.from({ length: DICE_HISTORY_SLOTS }, (_, index) => {
          const entry = entries[index + 1]
          return (
            <li key={entry?.id ?? `empty-${index}`} className="flex min-h-0 items-center justify-between gap-2">
              {entry ? (
                <>
                  <span className="min-w-0 truncate">{entryLabel(entry)}</span>
                  <span className="shrink-0 text-parchment">{entry.result.total}</span>
                </>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
