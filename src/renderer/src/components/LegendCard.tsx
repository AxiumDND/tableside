import { useEffect, useState } from 'react'
import type { AudioTrack } from '../../../shared/audio'
import type { CampaignImage } from '../lib/images'

function ScrollMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 3h8a3 3 0 0 1 3 3v11.5a1.5 1.5 0 0 0 3 0V6h2v11.5a3.5 3.5 0 1 1-7 0V6a5 5 0 0 0-5-5H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h9v-2H7V3z"
      />
    </svg>
  )
}

type LegendFields = {
  title: string
  preface: string | null
  body: string
  logoRef: string | null
  endImageRef: string | null
  musicRef: string | null
}

export default function LegendCard({
  title,
  body,
  endImageRef,
  endImageUrl,
  musicRef,
  musicTracks,
  images,
  canPlay,
  disabled,
  onChange,
  onPlay,
  onStop,
  legendActive,
  legendStopping,
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
  onChange: (next: LegendFields) => void
  onPlay?: (fields: LegendFields) => void
  onStop?: () => void
  legendActive?: boolean
  legendStopping?: boolean
  onLoadLogo?: () => Promise<string | null>
  onLoadEndImage?: () => Promise<string | null>
  onLoadMusic?: () => Promise<string | null>
}) {
  const [titleValue, setTitleValue] = useState(title ?? '')
  const [bodyValue, setBodyValue] = useState(body)
  const [endValue, setEndValue] = useState(endImageRef)
  const [musicValue, setMusicValue] = useState(musicRef)
  const [endBusy, setEndBusy] = useState(false)
  const [musicBusy, setMusicBusy] = useState(false)

  useEffect(() => {
    setTitleValue(title ?? '')
    setBodyValue(body)
    setEndValue(endImageRef)
    setMusicValue(musicRef)
  }, [title, body, endImageRef, musicRef])

  function fields(partial?: {
    title?: string
    body?: string
    endImageRef?: string | null
    musicRef?: string | null
  }): LegendFields {
    return {
      title: partial?.title ?? titleValue,
      preface: null,
      body: partial?.body ?? bodyValue,
      logoRef: null,
      endImageRef: partial && 'endImageRef' in partial ? partial.endImageRef ?? null : endValue,
      musicRef: partial && 'musicRef' in partial ? partial.musicRef ?? null : musicValue
    }
  }

  function commit(partial?: {
    title?: string
    body?: string
    endImageRef?: string | null
    musicRef?: string | null
  }): void {
    onChange(fields(partial))
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

  const endPreview = endValue ? endImageUrl : null
  const tracks = musicTracks ?? []
  const musicKnown = tracks.some((track) => track.relativePath === musicValue)

  function imageSelectValue(ref: string | null): string {
    return (
      images.find((img) => img.relativePath === ref || img.name === ref)?.relativePath ?? ref ?? ''
    )
  }

  return (
    <section className="opening-legend-card my-5">
      <div className="relative rounded-md border border-amber/40 bg-panel-2 px-4 pb-4 pt-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-md bg-amber" />
        <div className="absolute -top-3 left-3 flex items-center gap-1.5 bg-panel px-2">
          <span className="text-amber">
            <ScrollMark />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber">Campfire chronicle</span>
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
            <p className="mt-0.5 text-[11px] text-muted">DM label only — the player sees the scrolling text.</p>
          </label>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted">End image</span>
            <p className="mt-0.5 text-[11px] text-muted">Fades in when the scroll finishes (landscape, keep, etc.).</p>
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
            <span className="text-[10px] uppercase tracking-wider text-muted">Legend music</span>
            <p className="mt-0.5 text-[11px] text-muted">
              Mood fades out on Play. Legend track runs for 1:32 from when it starts (fades out if longer), then mood
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
                <option value="">Silent (no legend track)</option>
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
            <span className="text-[10px] uppercase tracking-wider text-muted">Legend</span>
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
          {legendActive ? (
            <button
              type="button"
              onClick={() => onStop?.()}
              disabled={legendStopping || !onStop}
              className="rounded border border-line px-2.5 py-1 text-xs font-semibold hover:border-amber disabled:text-muted"
            >
              {legendStopping ? 'Stopping…' : 'Stop'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const next = fields()
                onChange(next)
                onPlay?.(next)
              }}
              disabled={!canPlay || !onPlay}
              className="rounded bg-amber px-2.5 py-1 text-xs font-semibold text-on-amber disabled:bg-line disabled:text-muted"
            >
              Play
            </button>
          )}
          {!canPlay ? (
            <span className="text-[11px] text-muted">Classic, Light, or Vampire look required</span>
          ) : null}
        </div>
      </div>
    </section>
  )
}
