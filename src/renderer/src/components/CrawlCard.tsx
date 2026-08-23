import { useEffect, useState } from 'react'
import { CRAWL_PREFACE_DEFAULT } from '../../../shared/openingCrawl'
import type { CampaignImage } from '../lib/images'
import crawlEmblem from '../assets/crawl-emblem.webp'

function FilmMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm2 2v2h2V7H6zm0 4v2h2v-2H6zm0 4v2h2v-2H6zm10-8v2h2V7h-2zm0 4v2h2v-2h-2zm0 4v2h2v-2h-2zM9 8.5 16 12l-7 3.5V8.5z"
      />
    </svg>
  )
}

export default function CrawlCard({
  title,
  preface,
  body,
  logoRef,
  logoUrl,
  images,
  canPlay,
  disabled,
  onChange,
  onPlay,
  onLoadLogo
}: {
  title?: string
  preface: string | null
  body: string
  logoRef: string | null
  logoUrl?: string | null
  images: CampaignImage[]
  canPlay?: boolean
  disabled?: boolean
  onChange: (next: { title: string; preface: string | null; body: string; logoRef: string | null }) => void
  onPlay?: (fields: { title: string; preface: string | null; body: string; logoRef: string | null }) => void
  onLoadLogo?: () => Promise<string | null>
}) {
  const [titleValue, setTitleValue] = useState(title ?? '')
  const [prefaceOn, setPrefaceOn] = useState(preface != null)
  const [prefaceValue, setPrefaceValue] = useState(preface ?? CRAWL_PREFACE_DEFAULT)
  const [bodyValue, setBodyValue] = useState(body)
  const [logoValue, setLogoValue] = useState(logoRef)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setTitleValue(title ?? '')
    setPrefaceOn(preface != null)
    setPrefaceValue(preface ?? CRAWL_PREFACE_DEFAULT)
    setBodyValue(body)
    setLogoValue(logoRef)
  }, [title, preface, body, logoRef])

  function commit(partial?: {
    title?: string
    prefaceOn?: boolean
    preface?: string
    body?: string
    logoRef?: string | null
  }): void {
    const nextTitle = partial?.title ?? titleValue
    const nextOn = partial?.prefaceOn ?? prefaceOn
    const nextPreface = partial?.preface ?? prefaceValue
    const nextBody = partial?.body ?? bodyValue
    const nextLogo = partial && 'logoRef' in partial ? partial.logoRef ?? null : logoValue
    onChange({
      title: nextTitle,
      preface: nextOn ? nextPreface : null,
      body: nextBody,
      logoRef: nextLogo
    })
  }

  async function loadLogo(): Promise<void> {
    if (!onLoadLogo) return
    setBusy(true)
    try {
      const next = await onLoadLogo()
      if (next) {
        setLogoValue(next)
        commit({ logoRef: next })
      }
    } finally {
      setBusy(false)
    }
  }

  const preview = logoValue ? logoUrl || crawlEmblem : crawlEmblem

  return (
    <section className="opening-crawl-card my-5">
      <div className="relative rounded-md border border-amber/40 bg-panel-2 px-4 pb-4 pt-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-md bg-amber" />
        <div className="absolute -top-3 left-3 flex items-center gap-1.5 bg-panel px-2">
          <span className="text-amber">
            <FilmMark />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber">Opening crawl</span>
        </div>
        <div className="space-y-3 pl-2">
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-muted">Title</span>
            <input
              value={titleValue}
              disabled={disabled}
              onChange={(event) => setTitleValue(event.target.value)}
              onBlur={() => commit()}
              className="mt-0.5 w-full rounded border border-line bg-ink px-2 py-1 text-sm text-parchment outline-none focus:border-amber disabled:opacity-50"
            />
          </label>
          <label className="flex items-center gap-2 text-[12px] text-parchment">
            <input
              type="checkbox"
              checked={prefaceOn}
              disabled={disabled}
              onChange={(event) => {
                const nextOn = event.target.checked
                setPrefaceOn(nextOn)
                commit({ prefaceOn: nextOn })
              }}
            />
            Far-off line
          </label>
          {prefaceOn ? (
            <textarea
              value={prefaceValue}
              disabled={disabled}
              rows={2}
              onChange={(event) => setPrefaceValue(event.target.value)}
              onBlur={() => commit()}
              className="w-full resize-y rounded border border-line bg-ink px-2 py-1 text-sm text-parchment outline-none focus:border-amber disabled:opacity-50"
            />
          ) : null}
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted">Emblem</span>
            <div className="mt-1 flex items-start gap-2">
              <img src={preview} alt="" className="h-14 w-24 rounded border border-line bg-ink object-contain" />
              <div className="min-w-0 flex-1 space-y-1">
                <select
                  disabled={disabled || busy}
                  value={
                    images.find((img) => img.relativePath === logoValue || img.name === logoValue)
                      ?.relativePath ??
                    logoValue ??
                    ''
                  }
                  onChange={(event) => {
                    const value = event.target.value || null
                    setLogoValue(value)
                    commit({ logoRef: value })
                  }}
                  className="w-full rounded border border-line bg-ink px-1 py-1 text-[11px] text-parchment outline-none focus:border-amber disabled:opacity-50"
                >
                  <option value="">Generic emblem</option>
                  {images.map((img) => (
                    <option key={img.relativePath} value={img.relativePath}>
                      {img.relativePath}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={disabled || busy || !onLoadLogo}
                  onClick={() => void loadLogo()}
                  className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
                >
                  {busy ? 'Saving…' : 'Load image…'}
                </button>
              </div>
            </div>
          </div>
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-muted">Crawl</span>
            <textarea
              value={bodyValue}
              disabled={disabled}
              rows={6}
              onChange={(event) => setBodyValue(event.target.value)}
              onBlur={() => commit()}
              className="mt-0.5 w-full resize-y rounded border border-line bg-ink px-2 py-1 text-sm text-parchment outline-none focus:border-amber disabled:opacity-50"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 pl-2">
          <button
            type="button"
            onClick={() => {
              const fields = {
                title: titleValue,
                preface: prefaceOn ? prefaceValue : null,
                body: bodyValue,
                logoRef: logoValue
              }
              onChange(fields)
              onPlay?.(fields)
            }}
            disabled={!canPlay || !onPlay}
            className="rounded bg-amber px-2.5 py-1 text-xs font-semibold text-on-amber disabled:bg-line disabled:text-muted"
          >
            Play
          </button>
          {!canPlay ? <span className="text-[11px] text-muted">Sci-fi look required</span> : null}
        </div>
      </div>
    </section>
  )
}
