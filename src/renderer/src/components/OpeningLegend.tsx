import { useEffect, useState } from 'react'
import {
  LEGEND_FADE_OUT_MS,
  LEGEND_HOLD_MS,
  LEGEND_LOOK_DEFAULT,
  legendDurationMs,
  legendEndStillAtMs,
  parseLegendLook
} from '../../../shared/openingLegend'
import type { PlayerLegend } from '../../../shared/types'
import LegendParticles from './LegendParticles'

type LegendPhase = 'hold' | 'body' | 'end' | 'done'

export default function OpeningLegend({ legend }: { legend: PlayerLegend }) {
  const durationMs = legendDurationMs(legend.title, legend.body)
  const stopping = legend.stoppingAt != null
  const endSrc = legend.endSrc?.trim() || null
  const look = parseLegendLook(legend.look ?? LEGEND_LOOK_DEFAULT)
  const [phase, setPhase] = useState<LegendPhase>('hold')
  const paragraphs = legend.body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)

  useEffect(() => {
    if (stopping) return
    setPhase('hold')
    const timers: number[] = []
    const endAt = legendEndStillAtMs(legend.title, legend.body)
    timers.push(window.setTimeout(() => setPhase('body'), LEGEND_HOLD_MS))
    if (endSrc) {
      timers.push(window.setTimeout(() => setPhase('end'), endAt))
    } else {
      timers.push(window.setTimeout(() => setPhase('done'), endAt))
    }
    return () => {
      for (const timer of timers) window.clearTimeout(timer)
    }
  }, [legend.startedAt, durationMs, stopping, endSrc, look])

  const fadingOut = stopping || phase === 'done'
  const showEnd = Boolean(endSrc) && (phase === 'end' || (!stopping && phase === 'done'))
  const showBody = phase === 'body' || phase === 'end' || phase === 'done'

  return (
    <div
      className={`opening-legend${fadingOut ? ' is-done' : ' player-fade-in'}${phase === 'end' ? ' has-end' : ''}`}
      data-look={look}
      aria-label="Campfire chronicle"
      style={{ ['--legend-fade-ms' as string]: `${LEGEND_FADE_OUT_MS}ms` }}
    >
      <div className="opening-legend-night" />
      <div className="opening-legend-mist" />
      <LegendParticles look={look} />
      <div className="opening-legend-vignette" />
      <div className="opening-legend-corners" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      {showBody ? (
        <div className={`opening-legend-tapestry${phase === 'end' ? ' is-fading' : ''}`}>
          <div
            key={`${legend.startedAt}-${look}`}
            className="opening-legend-tapestry-track"
            style={{ ['--legend-ms' as string]: `${durationMs}ms` }}
          >
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="opening-legend-para">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {showEnd && endSrc ? (
        <div className="opening-legend-end" aria-hidden="true">
          <img src={endSrc} alt="" />
        </div>
      ) : null}
    </div>
  )
}
