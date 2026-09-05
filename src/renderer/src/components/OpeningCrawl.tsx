import { useEffect, useState } from 'react'
import {
  CRAWL_FADE_OUT_MS,
  CRAWL_HOLD_MS,
  CRAWL_LOGO_MS,
  CRAWL_PREFACE_DEFAULT,
  CRAWL_PREFACE_MS,
  crawlDurationMs,
  crawlEndStillAtMs
} from '../../../shared/openingCrawl'
import type { PlayerCrawl } from '../../../shared/types'
import crawlEmblem from '../assets/crawl-emblem.webp'
import Starfield from './Starfield'

type CrawlPhase = 'hold' | 'preface' | 'logo' | 'crawl' | 'end' | 'done'

export default function OpeningCrawl({ crawl }: { crawl: PlayerCrawl }) {
  const durationMs = crawlDurationMs(crawl.title, crawl.body)
  const stopping = crawl.stoppingAt != null
  const endSrc = crawl.endSrc?.trim() || null
  const [phase, setPhase] = useState<CrawlPhase>('hold')
  const paragraphs = crawl.body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
  const logoSrc = crawl.logoSrc || crawlEmblem
  const preface = crawl.preface === undefined ? CRAWL_PREFACE_DEFAULT : crawl.preface
  const prefaceMs = preface ? CRAWL_PREFACE_MS : 0

  useEffect(() => {
    if (stopping) return
    setPhase('hold')
    const timers: number[] = []
    let at = CRAWL_HOLD_MS
    if (preface) {
      timers.push(window.setTimeout(() => setPhase('preface'), at))
      at += prefaceMs
    }
    timers.push(window.setTimeout(() => setPhase('logo'), at))
    at += CRAWL_LOGO_MS
    timers.push(window.setTimeout(() => setPhase('crawl'), at))
    const endAt = crawlEndStillAtMs(preface)
    if (endSrc) {
      timers.push(window.setTimeout(() => setPhase('end'), endAt))
    } else {
      timers.push(window.setTimeout(() => setPhase('done'), endAt))
    }
    return () => {
      for (const timer of timers) window.clearTimeout(timer)
    }
  }, [crawl.startedAt, durationMs, preface, prefaceMs, stopping, endSrc])

  const fadingOut = stopping || phase === 'done'
  const showEnd = Boolean(endSrc) && (phase === 'end' || (!stopping && phase === 'done'))

  return (
    <div
      className={`opening-crawl${fadingOut ? ' is-done' : ''}${phase === 'end' ? ' has-end' : ''}`}
      aria-label="Opening crawl"
      style={{ ['--crawl-fade-ms' as string]: `${CRAWL_FADE_OUT_MS}ms` }}
    >
      <Starfield />
      {phase === 'preface' && preface ? (
        <p
          className="opening-crawl-preface"
          style={{ ['--crawl-preface-ms' as string]: `${prefaceMs}ms` }}
        >
          {preface}
        </p>
      ) : null}
      {phase === 'logo' ? (
        <div
          className="opening-crawl-logo"
          style={{ ['--crawl-logo-ms' as string]: `${CRAWL_LOGO_MS}ms` }}
        >
          <img src={logoSrc} alt="" />
        </div>
      ) : null}
      {phase === 'crawl' || phase === 'done' || phase === 'end' ? (
        <div className={`opening-crawl-perspective${phase === 'end' ? ' is-fading' : ''}`}>
          <div className="opening-crawl-track">
            <div
              key={crawl.startedAt}
              className="opening-crawl-text"
              style={{ ['--crawl-ms' as string]: `${durationMs}ms` }}
            >
              {crawl.title ? <p className="opening-crawl-title">{crawl.title}</p> : null}
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {showEnd && endSrc ? (
        <div className="opening-crawl-end" aria-hidden="true">
          <img src={endSrc} alt="" />
        </div>
      ) : null}
    </div>
  )
}
