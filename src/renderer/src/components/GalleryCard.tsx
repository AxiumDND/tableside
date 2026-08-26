import { useEffect, useState } from 'react'
import type { CampaignImage } from '../lib/images'

type GalleryFields = {
  title: string
  intervalSec: number | null
  imageRefs: string[]
}

const INTERVAL_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Manual (DM advances)', value: null },
  { label: 'Every 5 seconds', value: 5 },
  { label: 'Every 8 seconds', value: 8 },
  { label: 'Every 12 seconds', value: 12 }
]

export default function GalleryCard({
  title,
  intervalSec,
  imageRefs,
  images,
  imageUrls,
  disabled,
  onChange,
  onPlay,
  onStop,
  onPrev,
  onNext,
  galleryActive,
  slideIndex,
  slideCount
}: {
  title?: string
  intervalSec: number | null
  imageRefs: string[]
  images: CampaignImage[]
  imageUrls: (string | null)[]
  disabled?: boolean
  onChange: (next: GalleryFields) => void
  onPlay?: (fields: GalleryFields) => void
  onStop?: () => void
  onPrev?: () => void
  onNext?: () => void
  galleryActive?: boolean
  slideIndex?: number
  slideCount?: number
}) {
  const [titleValue, setTitleValue] = useState(title ?? '')
  const [intervalValue, setIntervalValue] = useState<number | null>(intervalSec)
  const [refs, setRefs] = useState(imageRefs)

  useEffect(() => {
    setTitleValue(title ?? '')
    setIntervalValue(intervalSec)
    setRefs(imageRefs)
  }, [title, intervalSec, imageRefs])

  function commit(partial?: {
    title?: string
    intervalSec?: number | null
    imageRefs?: string[]
  }): void {
    onChange({
      title: partial?.title ?? titleValue,
      intervalSec: partial && 'intervalSec' in partial ? partial.intervalSec ?? null : intervalValue,
      imageRefs: partial?.imageRefs ?? refs
    })
  }

  function move(index: number, dir: -1 | 1): void {
    const next = [...refs]
    const j = index + dir
    if (j < 0 || j >= next.length) return
    ;[next[index], next[j]] = [next[j], next[index]]
    setRefs(next)
    commit({ imageRefs: next })
  }

  function removeAt(index: number): void {
    const next = refs.filter((_, i) => i !== index)
    setRefs(next)
    commit({ imageRefs: next })
  }

  function addImage(path: string): void {
    if (!path || refs.includes(path)) return
    const next = [...refs, path]
    setRefs(next)
    commit({ imageRefs: next })
  }

  const fields = (): GalleryFields => ({
    title: titleValue,
    intervalSec: intervalValue,
    imageRefs: refs
  })

  const canPlay = refs.length > 0
  const atStart = (slideIndex ?? 0) <= 0
  const atEnd = (slideIndex ?? 0) >= Math.max(0, (slideCount ?? refs.length) - 1)

  return (
    <section className="player-gallery-card my-5">
      <div className="relative rounded-md border border-amber/40 bg-panel-2 px-4 pb-4 pt-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-md bg-amber" />
        <div className="absolute -top-3 left-3 flex items-center gap-1.5 bg-panel px-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber">Gallery</span>
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
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-muted">Advance</span>
            <select
              disabled={disabled || galleryActive}
              value={intervalValue ?? ''}
              onChange={(event) => {
                const raw = event.target.value
                const next = raw === '' ? null : Number(raw)
                setIntervalValue(next)
                commit({ intervalSec: next })
              }}
              className="mt-0.5 w-full rounded border border-line bg-ink px-1 py-1 text-[11px] text-parchment outline-none focus:border-amber disabled:opacity-50"
            >
              {INTERVAL_OPTIONS.map((opt) => (
                <option key={String(opt.value)} value={opt.value ?? ''}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted">Slides ({refs.length})</span>
            <ul className="mt-1 space-y-1.5">
              {refs.map((ref, index) => (
                <li key={`${ref}-${index}`} className="flex items-center gap-2">
                  <div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded border border-line bg-ink">
                    {imageUrls[index] ? (
                      <img src={imageUrls[index]!} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[9px] text-muted">?</span>
                    )}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-parchment">{ref}</span>
                  <button
                    type="button"
                    disabled={disabled || galleryActive || index === 0}
                    onClick={() => move(index, -1)}
                    className="rounded border border-line px-1.5 py-0.5 text-[10px] hover:border-amber disabled:text-muted"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={disabled || galleryActive || index === refs.length - 1}
                    onClick={() => move(index, 1)}
                    className="rounded border border-line px-1.5 py-0.5 text-[10px] hover:border-amber disabled:text-muted"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    disabled={disabled || galleryActive}
                    onClick={() => removeAt(index)}
                    className="rounded border border-line px-1.5 py-0.5 text-[10px] hover:border-amber disabled:text-muted"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <select
              disabled={disabled || galleryActive}
              value=""
              onChange={(event) => {
                addImage(event.target.value)
                event.target.value = ''
              }}
              className="mt-2 w-full rounded border border-line bg-ink px-1 py-1 text-[11px] text-parchment outline-none focus:border-amber disabled:opacity-50"
            >
              <option value="">Add image…</option>
              {images
                .filter((img) => !refs.includes(img.relativePath))
                .map((img) => (
                  <option key={img.relativePath} value={img.relativePath}>
                    {img.relativePath}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 pl-2">
          {galleryActive ? (
            <>
              <button
                type="button"
                onClick={() => onPrev?.()}
                disabled={atStart || !onPrev}
                className="rounded border border-line px-2.5 py-1 text-xs font-semibold hover:border-amber disabled:text-muted"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => onNext?.()}
                disabled={atEnd || !onNext}
                className="rounded border border-line px-2.5 py-1 text-xs font-semibold hover:border-amber disabled:text-muted"
              >
                Next
              </button>
              <span className="text-[11px] text-muted">
                {(slideIndex ?? 0) + 1} / {slideCount ?? refs.length}
              </span>
              <button
                type="button"
                onClick={() => onStop?.()}
                disabled={!onStop}
                className="rounded border border-line px-2.5 py-1 text-xs font-semibold hover:border-amber disabled:text-muted"
              >
                Stop
              </button>
            </>
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
          {!canPlay ? <span className="text-[11px] text-muted">Add at least one image</span> : null}
        </div>
      </div>
    </section>
  )
}
