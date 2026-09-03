import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { BUILTIN_DICE_ROLL_PATH } from '../../../shared/diceRollSound'
import { SKIP_PLAYER_DICE_SOURCES } from '../../../shared/playerDiceShow'
import { rollExpr, type DiceMode, type DiceResult, formatDiceRollSummary } from '../lib/dice'

export interface DiceLogEntry {
  id: string
  source?: string
  result: DiceResult
}

export type D20Mode = 'normal' | 'advantage' | 'disadvantage'

interface DiceLogApi {
  entries: DiceLogEntry[]
  record: (result: DiceResult, source?: string) => void
  recordMany: (items: { result: DiceResult; source?: string }[]) => void
  clear: () => void
  d20Mode: D20Mode
  setD20Mode: (mode: D20Mode) => void
  allowCrit: boolean
}

const DiceLogContext = createContext<DiceLogApi>({
  entries: [],
  record: () => undefined,
  recordMany: () => undefined,
  clear: () => undefined,
  d20Mode: 'normal',
  setD20Mode: () => undefined,
  allowCrit: true
})

export function useDiceLog(): DiceLogApi {
  return useContext(DiceLogContext)
}

/** Latest roll plus this many previous lines in the tray. */
export const DICE_HISTORY_SLOTS = 4
const LOG_CAP = 1 + DICE_HISTORY_SLOTS

function announceRoll(result: DiceResult, source: string | undefined, opts: { show: boolean; sound: boolean }): void {
  if (SKIP_PLAYER_DICE_SOURCES.has(source ?? '')) return
  if (opts.sound) {
    void window.tabledm?.mixerOneshot?.(BUILTIN_DICE_ROLL_PATH)
  }
  if (!opts.show || !window.tabledm?.showPlayerDice) return
  void window.tabledm.showPlayerDice({
    source,
    expr: result.expr,
    total: result.total,
    groups: result.groups ?? [],
    bonus: result.bonus,
    mode: result.mode,
    kept: result.kept,
    rollLabel: result.rollLabel,
    damageType: result.damageType,
    nat20: result.nat20,
    nat1: result.nat1
  })
}

export function DiceLogProvider({
  children,
  allowCrit = true
}: {
  children: ReactNode
  allowCrit?: boolean
}) {
  const [entries, setEntries] = useState<DiceLogEntry[]>([])
  const [d20Mode, setD20Mode] = useState<D20Mode>('normal')
  const [showToPlayers, setShowToPlayers] = useState(true)
  const [playSound, setPlaySound] = useState(true)

  useEffect(() => {
    void window.tabledm?.getSettings?.().then((prefs) => {
      setShowToPlayers(prefs.showDiceToPlayers !== false)
      setPlaySound(prefs.diceCheckSound !== false)
    })
  }, [])

  const api = useMemo<DiceLogApi>(
    () => ({
      entries,
      d20Mode,
      setD20Mode,
      allowCrit,
      record(result, source) {
        setEntries((prev) => [{ id: crypto.randomUUID(), source, result }, ...prev].slice(0, LOG_CAP))
        announceRoll(result, source, { show: showToPlayers, sound: playSound })
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
    [allowCrit, d20Mode, entries, playSound, showToPlayers]
  )

  return (
    <DiceLogContext.Provider value={api}>
      <DicePrefsBridge
        showToPlayers={showToPlayers}
        playSound={playSound}
        onShowToPlayers={setShowToPlayers}
        onPlaySound={setPlaySound}
      >
        {children}
      </DicePrefsBridge>
    </DiceLogContext.Provider>
  )
}

const DicePrefsContext = createContext<{
  showToPlayers: boolean
  playSound: boolean
  setShowToPlayers: (on: boolean) => void
  setPlaySound: (on: boolean) => void
}>({
  showToPlayers: true,
  playSound: true,
  setShowToPlayers: () => undefined,
  setPlaySound: () => undefined
})

function DicePrefsBridge({
  children,
  showToPlayers,
  playSound,
  onShowToPlayers,
  onPlaySound
}: {
  children: ReactNode
  showToPlayers: boolean
  playSound: boolean
  onShowToPlayers: (on: boolean) => void
  onPlaySound: (on: boolean) => void
}) {
  const value = useMemo(
    () => ({
      showToPlayers,
      playSound,
      setShowToPlayers: onShowToPlayers,
      setPlaySound: onPlaySound
    }),
    [onPlaySound, onShowToPlayers, playSound, showToPlayers]
  )
  return <DicePrefsContext.Provider value={value}>{children}</DicePrefsContext.Provider>
}

function useDicePrefs() {
  return useContext(DicePrefsContext)
}

const TRAY_DICE = [4, 6, 8, 10, 12, 20, 100] as const

function dieTone(value: number, sides: number): string {
  if (sides === 20 && value === 20) return 'border-moss bg-moss/20 text-moss'
  if (sides === 20 && value === 1) return 'border-blood bg-blood/20 text-blood'
  return 'border-line bg-panel-2 text-amber'
}

function entryLabel(entry: DiceLogEntry): string {
  return formatDiceRollSummary(entry.result, entry.source)
}

function persistPref(partial: { showDiceToPlayers?: boolean; diceCheckSound?: boolean }): void {
  void window.tabledm?.saveSettings?.(partial)
}

export default function DiceTray() {
  const { entries, record, clear, d20Mode, setD20Mode } = useDiceLog()
  const prefs = useDicePrefs()
  const [expr, setExpr] = useState('')
  const latest = entries[0] ?? null

  function rollWithMode(raw: string, force?: DiceMode): void {
    const cleaned = raw.replace(/\s/g, '')
    const d20 = /^1?d20(?:[+-]\d+)?$/i.test(cleaned)
    const mode = force ?? (d20 ? d20Mode : 'normal')
    record(rollExpr(raw, mode), 'Dice Tray')
  }

  function rollFormula(): void {
    const raw = expr.trim() || '1d20'
    rollWithMode(raw)
    setExpr('')
  }

  const latestFaces =
    latest?.result.groups?.flatMap((group) => group.rolls.map((value) => ({ value, sides: group.sides }))) ??
    latest?.result.rolls.map((value) => ({ value, sides: latest.result.sides })) ??
    []

  return (
    <section className="flex h-60 shrink-0 flex-col overflow-hidden border-t border-line bg-panel px-2 py-2">
      <header className="mb-1.5 shrink-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="shrink-0 text-[10px] uppercase tracking-wider text-muted">Dice tray</h2>
          {entries.length > 0 ? (
            <button type="button" onClick={clear} className="shrink-0 text-[10px] text-muted hover:text-amber">
              Clear log
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <label className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[10px] text-muted">
            <input
              type="checkbox"
              checked={prefs.showToPlayers}
              onChange={(event) => {
                prefs.setShowToPlayers(event.target.checked)
                persistPref({ showDiceToPlayers: event.target.checked })
              }}
            />
            Show rolls to players
          </label>
          <label className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[10px] text-muted">
            <input
              type="checkbox"
              checked={prefs.playSound}
              onChange={(event) => {
                prefs.setPlaySound(event.target.checked)
                persistPref({ diceCheckSound: event.target.checked })
              }}
            />
            Play roll sound
          </label>
        </div>
      </header>

      <div className="mb-1 flex shrink-0 gap-1" role="group" aria-label="d20 mode">
        {(
          [
            ['normal', 'Normal'],
            ['advantage', 'Adv'],
            ['disadvantage', 'Dis']
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setD20Mode(id)}
            className={`rounded-full px-2 py-0.5 text-[10px] ${
              d20Mode === id ? 'bg-amber font-semibold text-on-amber' : 'bg-panel-2 text-muted hover:text-parchment'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex shrink-0 flex-nowrap gap-0.5">
        {TRAY_DICE.map((sides) => (
          <button
            key={sides}
            type="button"
            title={`Roll 1d${sides}`}
            onClick={() => rollWithMode(`1d${sides}`)}
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
            {latestFaces.length > 0 ? (
              <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden">
                {latestFaces.map((face, i) => (
                  <span
                    key={`${latest.id}-${i}`}
                    className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded border px-0.5 text-[10px] font-semibold ${dieTone(face.value, face.sides)}`}
                  >
                    {face.value}
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
