import { useEffect, useState } from 'react'
import {
  LEGEND_FADE_OUT_MS,
  LEGEND_HERALD_MS,
  LEGEND_HOLD_MS,
  LEGEND_PREFACE_DEFAULT,
  LEGEND_PREFACE_MS,
  legendDurationMs
} from '../../../shared/openingLegend'
import type { PlayerLegend } from '../../../shared/types'
import LegendEmbers from './LegendEmbers'

type LegendPhase = 'hold' | 'preface' | 'herald' | 'body' | 'end' | 'done'

function Flourish() {
  return (
    <svg className="opening-legend-flourish" viewBox="0 0 120 12" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        d="M2 6 C22 6 28 2 40 2 C52 2 56 10 60 10 C64 10 68 2 80 2 C92 2 98 6 118 6"
      />
      <circle cx="60" cy="6" r="1.8" fill="currentColor" />
    </svg>
  )
}

function SealRays() {
  return (
    <svg className="opening-legend-seal-rays" viewBox="0 0 100 100" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        const x1 = 50 + Math.cos(a) * 18
        const y1 = 50 + Math.sin(a) * 18
        const x2 = 50 + Math.cos(a) * 46
        const y2 = 50 + Math.sin(a) * 46
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
      })}
    </svg>
  )
}

function splitDropCap(text: string): { cap: string; rest: string } | null {
  const match = /^([A-Za-zÀ-ÖØ-öø-ÿ])([\s\S]*)$/.exec(text.trim())
  if (!match) return null
  return { cap: match[1], rest: match[2] }
}

export default function OpeningLegend({ legend }: { legend: PlayerLegend }) {
  const durationMs = legendDurationMs(legend.title, legend.body)
  const stopping = legend.stoppingAt != null
  const endSrc = legend.endSrc?.trim() || null
  const [phase, setPhase] = useState<LegendPhase>('hold')
  const paragraphs = legend.body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
  const logoSrc = legend.logoSrc?.trim() || null
  const preface = legend.preface === undefined ? LEGEND_PREFACE_DEFAULT : legend.preface
  const prefaceMs = preface ? LEGEND_PREFACE_MS : 0
  const first = paragraphs[0] ? splitDropCap(paragraphs[0]) : null

  useEffect(() => {
    if (stopping) return
    setPhase('hold')
    const timers: number[] = []
    let at = LEGEND_HOLD_MS
    if (preface) {
      timers.push(window.setTimeout(() => setPhase('preface'), at))
      at += prefaceMs
    }
    timers.push(window.setTimeout(() => setPhase('herald'), at))
    at += LEGEND_HERALD_MS
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
  }, [legend.startedAt, durationMs, preface, prefaceMs, stopping, endSrc])

  const fadingOut = stopping || phase === 'done'
  const showEnd = Boolean(endSrc) && (phase === 'end' || (!stopping && phase === 'done'))
  const showBody = phase === 'body' || phase === 'end' || phase === 'done'

  return (
    <div
      className={`opening-legend${fadingOut ? ' is-done' : ''}${phase === 'end' ? ' has-end' : ''}`}
      aria-label="Opening legend"
      style={{ ['--legend-fade-ms' as string]: `${LEGEND_FADE_OUT_MS}ms` }}
    >
      <div className="opening-legend-night" />
      <div className="opening-legend-hearth" />
      <LegendEmbers />
      <div className="opening-legend-vignette" />
      <div className="opening-legend-corners" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      {phase === 'preface' && preface ? (
        <div
          className="opening-legend-preface"
          style={{ ['--legend-preface-ms' as string]: `${prefaceMs}ms` }}
        >
          <Flourish />
          <p>{preface}</p>
          <Flourish />
        </div>
      ) : null}

      {phase === 'herald' ? (
        <div
          className="opening-legend-herald"
          style={{ ['--legend-herald-ms' as string]: `${LEGEND_HERALD_MS}ms` }}
        >
          <div className="opening-legend-seal">
            <SealRays />
            <div className="opening-legend-seal-ring">
              {logoSrc ? (
                <img src={logoSrc} alt="" />
              ) : (
                <span className="opening-legend-seal-mark">
                  {(legend.title ?? 'L').trim().charAt(0).toUpperCase() || 'L'}
                </span>
              )}
            </div>
          </div>
          {legend.title ? <p className="opening-legend-seal-title">{legend.title}</p> : null}
        </div>
      ) : null}

      {showBody ? (
        <div className={`opening-legend-tapestry${phase === 'end' ? ' is-fading' : ''}`}>
          <div
            key={legend.startedAt}
            className="opening-legend-tapestry-track"
            style={{ ['--legend-ms' as string]: `${durationMs}ms` }}
          >
            {legend.title ? (
              <header className="opening-legend-chapter">
                <Flourish />
                <h2>{legend.title}</h2>
                <Flourish />
              </header>
            ) : null}
            {paragraphs.map((paragraph, index) => {
              if (index === 0 && first) {
                return (
                  <p key={index} className="opening-legend-para has-drop">
                    <span className="opening-legend-drop">{first.cap}</span>
                    {first.rest}
                  </p>
                )
              }
              return (
                <p key={index} className="opening-legend-para">
                  {paragraph}
                </p>
              )
            })}
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
