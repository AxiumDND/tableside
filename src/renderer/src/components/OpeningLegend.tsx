import { useEffect, useState } from 'react'
import { LEGEND_FADE_OUT_MS, LEGEND_HOLD_MS, legendDurationMs } from '../../../shared/openingLegend'
import type { PlayerLegend } from '../../../shared/types'
import LegendSmoke from './LegendSmoke'

type LegendPhase = 'hold' | 'body' | 'end' | 'done'

export default function OpeningLegend({ legend }: { legend: PlayerLegend }) {
  const durationMs = legendDurationMs(legend.title, legend.body)
  const stopping = legend.stoppingAt != null
  const endSrc = legend.endSrc?.trim() || null
  const [phase, setPhase] = useState<LegendPhase>('hold')
  const paragraphs = legend.body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)

  useEffect(() => {
    if (stopping) return
    setPhase('hold')
    const timers: number[] = []
    let at = LEGEND_HOLD_MS
    timers.push(window.setTimeout(() => setPhase('body'), at))
    at += durationMs
    if (endSrc) {
      timers.push(window.setTimeout(() => setPhase('end'), at))
    } else {
      timers.push(window.setTimeout(() => setPhase('done'), at))
    }
    return () => {
      for (const timer of timers) window.clearTimeout(timer)
    }
  }, [legend.startedAt, durationMs, stopping, endSrc])

  const fadingOut = stopping || phase === 'done'
  const showEnd = Boolean(endSrc) && (phase === 'end' || (!stopping && phase === 'done'))
  const showBody = phase === 'body' || phase === 'end' || phase === 'done'

  return (
    <div
      className={`opening-legend${fadingOut ? ' is-done' : ''}${phase === 'end' ? ' has-end' : ''}`}
      aria-label="Campfire chronicle"
      style={{ ['--legend-fade-ms' as string]: `${LEGEND_FADE_OUT_MS}ms` }}
    >
      <div className="opening-legend-night" />
      <div className="opening-legend-mist" />
      <LegendSmoke />
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
            key={legend.startedAt}
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
