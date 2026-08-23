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

export function DiceLogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<DiceLogEntry[]>([])

  const api = useMemo<DiceLogApi>(
    () => ({
      entries,
      record(result, source) {
        setEntries((prev) => [{ id: crypto.randomUUID(), source, result }, ...prev].slice(0, 16))
      },
      recordMany(items) {
        if (items.length === 0) return
        const next = items.map((item) => ({
          id: crypto.randomUUID(),
          source: item.source,
          result: item.result
        }))
        setEntries((prev) => [...next, ...prev].slice(0, 16))
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
    <section className="shrink-0 border-t border-line bg-panel px-2 py-2">
      <header className="mb-1.5 flex items-center justify-between">
        <h2 className="text-[10px] uppercase tracking-wider text-muted">Dice tray</h2>
        {entries.length > 0 ? (
          <button type="button" onClick={clear} className="text-[10px] text-muted hover:text-amber">
            Clear log
          </button>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-1">
        {TRAY_DICE.map((sides) => (
          <button
            key={sides}
            type="button"
            title={`Roll 1d${sides}`}
            onClick={() => record(rollExpr(`1d${sides}`), 'Tray')}
            className="min-w-8 rounded border border-line px-1.5 py-0.5 text-[11px] font-semibold hover:border-amber hover:text-amber"
          >
            d{sides}
          </button>
        ))}
      </div>

      <form
        className="mt-1.5 flex gap-1"
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

      {latest ? (
        <div className="mt-2 rounded border border-amber-dim/60 bg-ink px-2 py-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="min-w-0 truncate text-[11px] text-muted">
              {latest.source && latest.source !== 'Tray' ? `${latest.source} · ` : ''}
              {latest.result.expr}
            </p>
            <p className="font-display text-xl leading-none text-amber">{latest.result.total}</p>
          </div>
          {latest.result.rolls.length > 0 ? (
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {latest.result.rolls.map((value, i) => (
                <span
                  key={`${latest.id}-${i}`}
                  className={`inline-flex h-6 min-w-6 items-center justify-center rounded border px-1 text-[11px] font-semibold ${dieTone(value, latest.result.sides)}`}
                >
                  {value}
                </span>
              ))}
              {latest.result.bonus ? (
                <span className="text-[11px] text-muted">
                  {latest.result.bonus > 0 ? '+' : ''}
                  {latest.result.bonus}
                </span>
              ) : null}
            </div>
          ) : (
            <p className="mt-0.5 text-[11px] text-muted">{latest.result.detail}</p>
          )}
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-muted">Roll a die, or click a score on a sheet.</p>
      )}

      {entries.length > 1 ? (
        <ul className="mt-1 max-h-16 overflow-auto text-[11px] leading-snug text-muted">
          {entries.slice(1, 6).map((entry) => (
            <li key={entry.id} className="flex justify-between gap-2">
              <span className="min-w-0 truncate">
                {entry.source && entry.source !== 'Tray' ? `${entry.source} · ` : ''}
                {entry.result.expr}
              </span>
              <span className="shrink-0 text-parchment">{entry.result.total}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
