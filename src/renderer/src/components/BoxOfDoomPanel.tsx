import { useState } from 'react'
import { resolveBoxOfDoom, type BoxOfDoomMode } from '../../../shared/boxOfDoom'
import { builtinDiceRollPath } from '../../../shared/diceRollSound'
import type { PlayerBoxOfDoom } from '../../../shared/types'
import type { DiceResult } from '../lib/dice'
import { rollBoxOfDoomD20s } from '../lib/dice'
import { useDiceLog } from './DiceTray'

const MODES: { id: BoxOfDoomMode; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'advantage', label: 'Advantage' },
  { id: 'disadvantage', label: 'Disadvantage' }
]

function doomDiceLog(
  resolved: ReturnType<typeof resolveBoxOfDoom>
): DiceResult {
  const signed = resolved.modifier >= 0 ? `+${resolved.modifier}` : String(resolved.modifier)
  const keptNote = resolved.rolls.length > 1 ? ` keep ${resolved.d20}` : ''
  const bonusText = resolved.modifier ? signed : ''
  const outcome = resolved.success ? 'success' : 'failure'
  return {
    expr: `Dice check DC ${resolved.dc}`,
    total: resolved.total,
    detail: `[${resolved.rolls.join(', ')}]${keptNote}${bonusText} vs DC ${resolved.dc} — ${outcome}`,
    rolls: resolved.rolls,
    sides: 20,
    bonus: resolved.modifier,
    groups: [{ sides: 20, rolls: resolved.rolls }],
    mode: resolved.mode === 'normal' ? undefined : resolved.mode,
    kept: resolved.d20
  }
}

export default function BoxOfDoomPanel({
  overlay,
  soundEnabled,
  onSoundEnabled
}: {
  overlay: PlayerBoxOfDoom | null
  soundEnabled: boolean
  onSoundEnabled: (on: boolean) => void
}) {
  const { record } = useDiceLog()
  const [dc, setDc] = useState('15')
  const [mod, setMod] = useState('0')
  const [mode, setMode] = useState<BoxOfDoomMode>('normal')
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState<ReturnType<typeof resolveBoxOfDoom> | null>(null)

  const showing = Boolean(overlay && overlay.stoppingAt == null)
  const waiting = showing && overlay?.rolledAt == null
  const holding = showing && overlay?.rolledAt != null
  const fading = Boolean(overlay?.stoppingAt)

  async function show(nextMode = mode): Promise<void> {
    setBusy(true)
    try {
      await window.tabledm.showBoxOfDoom({
        dc: Number(dc),
        modifier: Number(mod),
        mode: nextMode
      })
    } finally {
      setBusy(false)
    }
  }

  async function pickMode(next: BoxOfDoomMode): Promise<void> {
    setMode(next)
    if (!waiting) return
    await window.tabledm.showBoxOfDoom({
      dc: Number(dc),
      modifier: Number(mod),
      mode: next
    })
  }

  async function roll(): Promise<void> {
    const { first, second } = rollBoxOfDoomD20s(mode)
    const resolved = resolveBoxOfDoom(Number(dc), first, Number(mod), {
      mode,
      d20b: second
    })
    record(doomDiceLog(resolved), 'Dice check')
    setLast(resolved)
    setBusy(true)
    try {
      if (soundEnabled) void window.tabledm.mixerOneshot(builtinDiceRollPath(resolved.rolls.length))
      await window.tabledm.rollBoxOfDoom({
        dc: resolved.dc,
        modifier: resolved.modifier,
        d20: resolved.rolls[0] ?? resolved.d20,
        d20b: resolved.rolls[1],
        mode: resolved.mode,
        sound: soundEnabled
      })
    } finally {
      setBusy(false)
    }
  }

  async function fadeOut(): Promise<void> {
    setBusy(true)
    try {
      await window.tabledm.stopBoxOfDoom()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 overflow-auto px-3 py-2 text-sm">
      <p className="text-[11px] text-muted">
        Fade the check over whatever is on the player TV, roll when you are ready, then fade back
        to that picture. If you do not click Fade out, the result auto-fades after the timer under{' '}
        <strong>Help & settings → Settings → Dice</strong>. Advantage and disadvantage show two dice. Natural 20 always
        succeeds,
        natural 1 always fails. Roll sound plays on the Music panel Sfx layer.
      </p>
      <div className="flex flex-wrap gap-2">
        <label className="min-w-[5.5rem] flex-1 text-[11px] uppercase tracking-wider text-muted">
          DC
          <input
            type="number"
            min={1}
            max={40}
            value={dc}
            onChange={(event) => setDc(event.target.value)}
            className="mt-1 w-full rounded border border-line bg-ink px-2 py-1.5 text-sm text-parchment outline-none focus:border-amber"
          />
        </label>
        <label className="min-w-[5.5rem] flex-1 text-[11px] uppercase tracking-wider text-muted">
          Modifier
          <input
            type="number"
            min={-20}
            max={20}
            value={mod}
            onChange={(event) => setMod(event.target.value)}
            className="mt-1 w-full rounded border border-line bg-ink px-2 py-1.5 text-sm text-parchment outline-none focus:border-amber"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Roll mode">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={busy || holding}
            onClick={() => void pickMode(item.id)}
            className={`rounded-full px-2.5 py-1 text-[11px] ${
              mode === item.id ? 'bg-amber font-semibold text-on-amber' : 'bg-panel-2 text-muted hover:text-parchment'
            } disabled:opacity-50`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={busy || showing}
        onClick={() => void show()}
        className="w-full rounded bg-amber px-3 py-2 text-sm font-semibold text-on-amber disabled:opacity-50"
      >
        Show
      </button>
      <label className="flex items-center gap-2 text-[11px] text-muted">
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={(event) => onSoundEnabled(event.target.checked)}
        />
        Play sound on Roll
      </label>
      <button
        type="button"
        disabled={busy || !waiting}
        onClick={() => void roll()}
        className="w-full rounded border border-amber px-3 py-2 text-sm font-semibold text-amber disabled:opacity-50"
      >
        {holding && !fading ? 'Holding result' : 'Roll'}
      </button>
      {last ? (
        <p className={`text-sm ${last.success ? 'text-moss' : 'text-blood'}`}>
          {last.rolls.length > 1 ? `${last.rolls.join(' / ')} → ${last.d20}` : last.d20}
          {last.modifier >= 0 ? '+' : ''}
          {last.modifier} = {last.total} vs DC {last.dc} — {last.success ? 'success' : 'failure'}
          {last.nat20 ? ' (nat 20)' : last.nat1 ? ' (nat 1)' : ''}
          {last.mode !== 'normal' ? ` (${last.mode})` : ''}
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy || !showing}
        onClick={() => void fadeOut()}
        className="w-full rounded border border-line px-3 py-1.5 text-[11px] hover:border-amber disabled:opacity-50"
      >
        Fade out
      </button>
    </div>
  )
}
