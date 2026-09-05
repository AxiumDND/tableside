import { useEffect, useState } from 'react'
import type { PlayerHourglass } from '../../../shared/types'
import {
  HOURGLASS_FADE_IN_MS,
  HOURGLASS_FADE_LEAD_MS,
  formatHourglassClock,
  hourglassIsUrgent,
  hourglassPhase,
  hourglassProgress,
  hourglassRemainingMs
} from '../../../shared/hourglass'

export default function OpeningHourglass({ glass }: { glass: PlayerHourglass }) {
  const [now, setNow] = useState(() => Date.now())
  const [visible, setVisible] = useState(false)
  const fadingOut = Boolean(glass.stoppingAt)
  const phase = hourglassPhase(glass, now)
  const remaining = hourglassRemainingMs(glass, now)
  const progress = hourglassProgress(glass, now)
  const urgent = hourglassIsUrgent(glass, now)
  const running = phase === 'running'
  const clock = formatHourglassClock(remaining)

  useEffect(() => {
    setVisible(false)
    const t = window.setTimeout(() => setVisible(true), HOURGLASS_FADE_LEAD_MS)
    return () => window.clearTimeout(t)
  }, [glass.shownAt])

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
  }, [running, glass.endsAt])

  const upper = progress
  const lower = 1 - progress
  const stream = running && progress > 0.01 && progress < 0.99
  let status = 'Hourglass — waiting'
  if (fadingOut) status = 'Hourglass — fading out'
  else if (phase === 'expired') status = 'Hourglass — time'
  else if (phase === 'running') status = `Hourglass — ${clock}`
  else if (phase === 'paused') status = `Hourglass — paused ${clock}`
  else status = `Hourglass — ${clock}`

  return (
    <div
      className={`hourglass${visible && !fadingOut ? ' is-in' : ''}${fadingOut ? ' is-out' : ''}${
        urgent ? ' is-urgent' : ''
      }${phase === 'expired' ? ' is-expired' : ''}${running ? ' is-running' : ''}${
        phase === 'paused' ? ' is-paused' : ''
      }`}
      aria-label={status}
      style={{
        transitionDuration: fadingOut ? undefined : `${HOURGLASS_FADE_IN_MS}ms`
      }}
    >
      <p className="hourglass-kicker">Time</p>
      <HourglassMark upper={upper} lower={lower} stream={stream} />
      <p className="hourglass-clock">{clock}</p>
    </div>
  )
}

function HourglassMark({
  upper,
  lower,
  stream
}: {
  upper: number
  lower: number
  stream: boolean
}) {
  const upperTop = 46 + 108 * (1 - upper)
  const upperHeight = 108 * upper
  const lowerHeight = 108 * lower
  const lowerTop = 206 + (108 - lowerHeight)

  return (
    <svg className="hourglass-mark" viewBox="0 0 220 360" aria-hidden="true">
      <defs>
        <linearGradient id="hg-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5a3d1c" />
          <stop offset="45%" stopColor="#3a2612" />
          <stop offset="100%" stopColor="#1c1208" />
        </linearGradient>
        <linearGradient id="hg-brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0d592" />
          <stop offset="40%" stopColor="#c4a05a" />
          <stop offset="100%" stopColor="#7a5c28" />
        </linearGradient>
        <linearGradient id="hg-glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="35%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
        </linearGradient>
        <linearGradient id="hg-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--hourglass-sand-hi)" />
          <stop offset="100%" stopColor="var(--hourglass-sand)" />
        </linearGradient>
        <clipPath id="hg-upper-bulb">
          <path d="M54 42 L166 42 L118 154 L102 154 Z" />
        </clipPath>
        <clipPath id="hg-lower-bulb">
          <path d="M102 206 L118 206 L166 318 L54 318 Z" />
        </clipPath>
        <clipPath id="hg-upper-sand">
          <rect x="48" y={upperTop} width="124" height={Math.max(0, upperHeight)} />
        </clipPath>
        <clipPath id="hg-lower-sand">
          <rect x="48" y={lowerTop} width="124" height={Math.max(0, lowerHeight)} />
        </clipPath>
      </defs>

      <ellipse className="hourglass-glow" cx="110" cy="180" rx="86" ry="118" />

      <rect x="28" y="10" width="164" height="26" rx="5" fill="url(#hg-wood)" />
      <rect x="36" y="28" width="148" height="10" rx="2" fill="url(#hg-brass)" />
      <rect x="32" y="36" width="14" height="288" rx="4" fill="url(#hg-wood)" />
      <rect x="174" y="36" width="14" height="288" rx="4" fill="url(#hg-wood)" />
      <rect x="28" y="324" width="164" height="26" rx="5" fill="url(#hg-wood)" />
      <rect x="36" y="322" width="148" height="10" rx="2" fill="url(#hg-brass)" />

      <path className="hourglass-glass-fill" d="M54 42 L166 42 L118 154 L102 154 Z" fill="url(#hg-glass)" />
      <path className="hourglass-glass-fill" d="M102 206 L118 206 L166 318 L54 318 Z" fill="url(#hg-glass)" />
      <rect x="100" y="154" width="20" height="52" rx="6" fill="url(#hg-glass)" />

      <g clipPath="url(#hg-upper-bulb)">
        <g clipPath="url(#hg-upper-sand)">
          <path d="M54 42 L166 42 L118 154 L102 154 Z" fill="url(#hg-sand)" />
        </g>
      </g>
      <g clipPath="url(#hg-lower-bulb)">
        <g clipPath="url(#hg-lower-sand)">
          <path d="M102 206 L118 206 L166 318 L54 318 Z" fill="url(#hg-sand)" />
          <ellipse cx="110" cy={lowerTop + 6} rx={22 + lower * 28} ry="10" fill="var(--hourglass-sand-hi)" />
        </g>
      </g>

      {stream ? (
        <g className="hourglass-stream">
          <rect x="107.5" y="150" width="5" height="62" rx="2" fill="url(#hg-sand)" />
          <rect className="hourglass-stream-spark" x="108.5" y="156" width="3" height="18" rx="1.5" />
        </g>
      ) : null}

      <path
        className="hourglass-rim"
        d="M54 42 L166 42 L118 154 L110 180 L102 154 Z M102 206 L118 206 L166 318 L54 318 L110 180 Z"
        fill="none"
        stroke="url(#hg-brass)"
        strokeWidth="3.2"
      />
      <path className="hourglass-shine" d="M68 52 L78 52 L108 146 L102 150 Z" />
    </svg>
  )
}
