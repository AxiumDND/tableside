import { useEffect, useRef, useState } from 'react'
import {
  BUILTIN_HOURGLASS_CHIME_PATH,
  clampHourglassMinutes,
  formatHourglassClock,
  hourglassPhase,
  hourglassRemainingMs,
  HOURGLASS_DEFAULT_MINUTES
} from '../../../shared/hourglass'
import type { PlayerHourglass } from '../../../shared/types'

const PRESETS = [1, 3, 5, 10] as const

export default function HourglassPanel({ overlay }: { overlay: PlayerHourglass | null }) {
  const [minutes, setMinutes] = useState(String(HOURGLASS_DEFAULT_MINUTES))
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const chimedFor = useRef<number | null>(null)

  const showing = Boolean(overlay && overlay.stoppingAt == null)
  const fading = Boolean(overlay?.stoppingAt)
  const phase = overlay ? hourglassPhase(overlay, now) : 'wait'
  const remaining = overlay ? hourglassRemainingMs(overlay, now) : hourglassDurationMsSafe(minutes)
  const waiting = showing && phase === 'wait'
  const running = showing && phase === 'running'
  const paused = showing && phase === 'paused'
  const expired = showing && phase === 'expired'

  useEffect(() => {
    if (!running) {
      setNow(Date.now())
      return
    }
    let frame = 0
    const tick = (): void => {
      setNow(Date.now())
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [running, overlay?.endsAt])

  useEffect(() => {
    if (!overlay || !soundEnabled || overlay.sound === false || overlay.stoppingAt) return
    if (hourglassPhase(overlay, Date.now()) !== 'expired') return
    if (chimedFor.current === overlay.shownAt) return
    chimedFor.current = overlay.shownAt
    void window.tabledm.mixerOneshot(BUILTIN_HOURGLASS_CHIME_PATH)
  }, [overlay, now, soundEnabled])

  useEffect(() => {
    if (!overlay) chimedFor.current = null
  }, [overlay])

  async function show(): Promise<void> {
    setBusy(true)
    try {
      await window.tabledm.showHourglass({
        minutes: clampHourglassMinutes(minutes),
        sound: soundEnabled
      })
    } finally {
      setBusy(false)
    }
  }

  async function start(): Promise<void> {
    setBusy(true)
    try {
      await window.tabledm.startHourglass({ sound: soundEnabled })
    } finally {
      setBusy(false)
    }
  }

  async function pause(): Promise<void> {
    setBusy(true)
    try {
      await window.tabledm.pauseHourglass()
    } finally {
      setBusy(false)
    }
  }

  async function resume(): Promise<void> {
    setBusy(true)
    try {
      await window.tabledm.resumeHourglass({ sound: soundEnabled })
    } finally {
      setBusy(false)
    }
  }

  async function reset(): Promise<void> {
    setBusy(true)
    try {
      chimedFor.current = null
      await window.tabledm.resetHourglass({ minutes: clampHourglassMinutes(minutes) })
    } finally {
      setBusy(false)
    }
  }

  async function fadeOut(): Promise<void> {
    setBusy(true)
    try {
      await window.tabledm.stopHourglass()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 overflow-auto px-3 py-2 text-sm">
      <p className="text-[11px] text-muted">
        Fade a full hourglass over whatever is on the player TV, then start the countdown when the
        table is ready. Pause, reset, or fade back to that picture. The glass stays empty at zero
        until you fade out. Optional chime plays on the Music panel Sfx layer.
      </p>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Timer presets">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            disabled={busy || running}
            onClick={() => setMinutes(String(preset))}
            className={`rounded-full px-2.5 py-1 text-[11px] ${
              Number(minutes) === preset
                ? 'bg-amber font-semibold text-on-amber'
                : 'bg-panel-2 text-muted hover:text-parchment'
            } disabled:opacity-50`}
          >
            {preset} min
          </button>
        ))}
      </div>
      <label className="block text-[11px] uppercase tracking-wider text-muted">
        Minutes
        <input
          type="number"
          min={1}
          max={120}
          value={minutes}
          disabled={busy || running}
          onChange={(event) => setMinutes(event.target.value)}
          className="mt-1 w-full rounded border border-line bg-ink px-2 py-1.5 text-sm text-parchment outline-none focus:border-amber disabled:opacity-50"
        />
      </label>
      <p className="font-display text-2xl tracking-wide text-amber" aria-live="polite">
        {formatHourglassClock(remaining)}
        {showing ? (
          <span className="ml-2 text-[11px] uppercase tracking-wider text-muted">
            {fading ? 'fading' : phase}
          </span>
        ) : null}
      </p>
      <button
        type="button"
        disabled={busy || showing}
        onClick={() => void show()}
        className="w-full rounded bg-amber px-3 py-2 text-sm font-semibold text-on-amber disabled:opacity-50"
      >
        Show
      </button>
      <button
        type="button"
        disabled={busy || !waiting}
        onClick={() => void start()}
        className="w-full rounded border border-amber px-3 py-2 text-sm font-semibold text-amber disabled:opacity-50"
      >
        Start
      </button>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !running}
          onClick={() => void pause()}
          className="min-w-[6rem] flex-1 rounded border border-line px-3 py-1.5 text-[11px] hover:border-amber disabled:opacity-50"
        >
          Pause
        </button>
        <button
          type="button"
          disabled={busy || !paused}
          onClick={() => void resume()}
          className="min-w-[6rem] flex-1 rounded border border-line px-3 py-1.5 text-[11px] hover:border-amber disabled:opacity-50"
        >
          Resume
        </button>
        <button
          type="button"
          disabled={busy || !showing}
          onClick={() => void reset()}
          className="min-w-[6rem] flex-1 rounded border border-line px-3 py-1.5 text-[11px] hover:border-amber disabled:opacity-50"
        >
          Reset
        </button>
      </div>
      <label className="flex items-center gap-2 text-[11px] text-muted">
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={(event) => setSoundEnabled(event.target.checked)}
        />
        Chime at zero
      </label>
      {expired ? <p className="text-sm text-blood">Time.</p> : null}
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

function hourglassDurationMsSafe(minutes: string): number {
  return clampHourglassMinutes(minutes) * 60_000
}
