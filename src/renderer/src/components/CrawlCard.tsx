import { useEffect, useState } from 'react'
import { CRAWL_PREFACE_DEFAULT } from '../../../shared/openingCrawl'
import type { AudioTrack } from '../../../shared/audio'
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
type CrawlFields = {
  title: string
  preface: string | null
  body: string
  logoRef: string | null
  endImageRef: string | null
  musicRef: string | null
}
export default function CrawlCard({
  title,
  preface,
  body,
  logoRef,
  logoUrl,
  endImageRef,
  endImageUrl,
  musicRef,
  musicTracks,
  images,
  canPlay,
  disabled,
  editing = false,
  onChange,
  onPlay,
  onStop,
  crawlActive,
  crawlStopping,
  onLoadLogo,
  onLoadEndImage,
  onLoadMusic
}: {
  title?: string
  preface: string | null
  body: string
  logoRef: string | null
  logoUrl?: string | null
  endImageRef: string | null
  endImageUrl?: string | null
  musicRef: string | null
  musicTracks?: AudioTrack[]
  images: CampaignImage[]
  canPlay?: boolean
  disabled?: boolean
  editing?: boolean
  onChange: (next: CrawlFields) => void
  onPlay?: (fields: CrawlFields) => void
  onStop?: () => void
  crawlActive?: boolean
  crawlStopping?: boolean
  onLoadLogo?: () => Promise<string | null>
  onLoadEndImage?: () => Promise<string | null>
  onLoadMusic?: () => Promise<string | null>
}) {
  const [titleValue, setTitleValue] = useState(title ?? '')
  const [prefaceOn, setPrefaceOn] = useState(preface != null)
  const [prefaceValue, setPrefaceValue] = useState(preface ?? CRAWL_PREFACE_DEFAULT)
  const [bodyValue, setBodyValue] = useState(body)
  const [logoValue, setLogoValue] = useState(logoRef)
  const [endValue, setEndValue] = useState(endImageRef)
  const [musicValue, setMusicValue] = useState(musicRef)
  const [busy, setBusy] = useState(false)
  const [endBusy, setEndBusy] = useState(false)
  const [musicBusy, setMusicBusy] = useState(false)
  useEffect(() => {
    setTitleValue(title ?? '')
    setPrefaceOn(preface != null)
    setPrefaceValue(preface ?? CRAWL_PREFACE_DEFAULT)
    setBodyValue(body)
    setLogoValue(logoRef)
    setEndValue(endImageRef)
    setMusicValue(musicRef)
  }, [title, preface, body, logoRef, endImageRef, musicRef])
  function commit(partial?: {
    title?: string
    prefaceOn?: boolean
    preface?: string
    body?: string
    logoRef?: string | null
    endImageRef?: string | null
    musicRef?: string | null
  }): void {
    const nextTitle = partial?.title ?? titleValue
    const nextOn = partial?.prefaceOn ?? prefaceOn
    const nextPreface = partial?.preface ?? prefaceValue
    const nextBody = partial?.body ?? bodyValue
    const nextLogo = partial && 'logoRef' in partial ? partial.logoRef ?? null : logoValue
    const nextEnd = partial && 'endImageRef' in partial ? partial.endImageRef ?? null : endValue
    const nextMusic = partial && 'musicRef' in partial ? partial.musicRef ?? null : musicValue
    onChange({
      title: nextTitle,
      preface: nextOn ? nextPreface : null,
      body: nextBody,
      logoRef: nextLogo,
      endImageRef: nextEnd,
      musicRef: nextMusic
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
  async function loadEndImage(): Promise<void> {
    if (!onLoadEndImage) return
    setEndBusy(true)
    try {
      const next = await onLoadEndImage()
      if (next) {
        setEndValue(next)
        commit({ endImageRef: next })
      }
    } finally {
      setEndBusy(false)
    }
  }
  async function loadMusic(): Promise<void> {
    if (!onLoadMusic) return
    setMusicBusy(true)
    try {
      const next = await onLoadMusic()
      if (next) {
        setMusicValue(next)
        commit({ musicRef: next })
      }
    } finally {
      setMusicBusy(false)
    }
  }
  const preview = logoValue ? logoUrl || crawlEmblem : crawlEmblem
  const endPreview = endValue ? endImageUrl : null
  const tracks = musicTracks ?? []
  const musicKnown = tracks.some((track) => track.relativePath === musicValue)
  function imageSelectValue(ref: string | null): string {
    return (
      images.find((img) => img.relativePath === ref || img.name === ref)?.relativePath ?? ref ?? ''
    )
  }
  const playFooter = (
    <div className="mt-3 flex flex-wrap items-center gap-2 pl-2">
      {crawlActive ? (
        <button
          type="button"
          onClick={() => onStop?.()}
          disabled={crawlStopping || !onStop}
          className="rounded border border-line px-2.5 py-1 text-xs font-semibold hover:border-amber disabled:text-muted"
        >
          {crawlStopping ? 'Stopping…' : 'Stop'}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            const nextFields = {
              title: titleValue,
              preface: prefaceOn ? prefaceValue : null,
              body: bodyValue,
              logoRef: logoValue,
              endImageRef: endValue,
              musicRef: musicValue
            }
            onChange(nextFields)
            onPlay?.(nextFields)
          }}
          disabled={!canPlay || !onPlay}
          className="rounded bg-amber px-2.5 py-1 text-xs font-semibold text-on-amber disabled:bg-line disabled:text-muted"
        >
          Play
        </button>
      )}
      {!canPlay ? <span className="text-[11px] text-muted">Sci-fi look required</span> : null}
    </div>
  )

  return (
    <section className="opening-crawl-card my-5">
      <div className="relative rounded-md border border-amber/40 bg-panel-2 px-4 pb-4 pt-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-md bg-amber" />
        <div className="absolute -top-3 left-3 flex items-center gap-1.5 bg-panel px-2">
          <span className="text-amber">
            <FilmMark />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber">Opening crawl</span>
          {!editing && titleValue.trim() ? (
            <span className="max-w-[14rem] truncate text-[11px] font-normal italic text-muted">{titleValue}</span>
          ) : null}
        </div>
        {editing ? (
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
              spellCheck
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
                  value={imageSelectValue(logoValue)}
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
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted">End image</span>
            <p className="mt-0.5 text-[11px] text-muted">Fades in when the crawl finishes (planet, ship, etc.).</p>
            <div className="mt-1 flex items-start gap-2">
              <div className="flex h-14 w-24 items-center justify-center rounded border border-line bg-ink text-[10px] text-muted">
                {endPreview ? <img src={endPreview} alt="" className="h-full w-full object-contain" /> : 'None'}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <select
                  disabled={disabled || endBusy}
                  value={imageSelectValue(endValue)}
                  onChange={(event) => {
                    const value = event.target.value || null
                    setEndValue(value)
                    commit({ endImageRef: value })
                  }}
                  className="w-full rounded border border-line bg-ink px-1 py-1 text-[11px] text-parchment outline-none focus:border-amber disabled:opacity-50"
                >
                  <option value="">None (fade to black)</option>
                  {images.map((img) => (
                    <option key={img.relativePath} value={img.relativePath}>
                      {img.relativePath}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={disabled || endBusy || !onLoadEndImage}
                  onClick={() => void loadEndImage()}
                  className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
                >
                  {endBusy ? 'Saving…' : 'Load image…'}
                </button>
              </div>
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted">Crawl music</span>
            <p className="mt-0.5 text-[11px] text-muted">
              Mood fades out on Play. Crawl track runs for 1:32 from when it starts (fades out if longer), then mood
              resumes.
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <select
                disabled={disabled || musicBusy}
                value={musicValue ?? ''}
                onChange={(event) => {
                  const value = event.target.value || null
                  setMusicValue(value)
                  commit({ musicRef: value })
                }}
                className="min-w-0 flex-1 rounded border border-line bg-ink px-1 py-1 text-[11px] text-parchment outline-none focus:border-amber disabled:opacity-50"
              >
                <option value="">Silent (no crawl track)</option>
                {musicValue && !musicKnown ? <option value={musicValue}>{musicValue}</option> : null}
                {tracks.map((track) => (
                  <option key={track.relativePath} value={track.relativePath}>
                    {track.relativePath}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={disabled || musicBusy || !onLoadMusic}
                onClick={() => void loadMusic()}
                className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
              >
                {musicBusy ? 'Saving…' : 'Load audio…'}
              </button>
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
              spellCheck
              className="mt-0.5 w-full resize-y rounded border border-line bg-ink px-2 py-1 text-sm text-parchment outline-none focus:border-amber disabled:opacity-50"
            />
          </label>
        </div>
        ) : (
          <div className="space-y-3 pl-2">
            <div className="flex items-start gap-3">
              <img src={preview} alt="" className="h-16 w-28 rounded border border-line bg-ink object-contain" />
              {endPreview ? (
                <img src={endPreview} alt="" className="h-16 w-28 rounded border border-line bg-ink object-contain" />
              ) : null}
            </div>
            {prefaceOn && prefaceValue.trim() ? (
              <p className="text-[12px] italic text-muted">{prefaceValue}</p>
            ) : null}
            <div className="whitespace-pre-wrap rounded border border-line/60 bg-ink/40 px-3 py-2 text-sm leading-relaxed text-parchment">
              {bodyValue.trim() || 'No crawl text yet.'}
            </div>
          </div>
        )}
        {playFooter}
      </div>
    </section>
  )
}
