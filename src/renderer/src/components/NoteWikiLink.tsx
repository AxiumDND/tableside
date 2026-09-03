import { useEffect, useRef, useState, type ReactNode } from 'react'
import { notePreviewFromMarkdown, notePreviewImageUrl, type NotePreview } from '../lib/notePreview'
import type { CampaignImage } from '../lib/images'
import { useHideBundledArtwork } from '../hooks/useBundledArtwork'

const previewCache = new Map<string, NotePreview>()

export default function NoteWikiLink({
  notePath,
  onOpenNote,
  images,
  children
}: {
  notePath: string
  onOpenNote?: (path: string) => void
  images?: CampaignImage[]
  children?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<NotePreview | null>(() => previewCache.get(notePath) ?? null)
  const [loading, setLoading] = useState(false)
  const hideBundled = useHideBundledArtwork()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const aliveRef = useRef(true)

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    setPreview(previewCache.get(notePath) ?? null)
  }, [notePath])

  function clearTimer(): void {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function showSoon(): void {
    clearTimer()
    timerRef.current = setTimeout(() => {
      setOpen(true)
      if (previewCache.has(notePath) || loading) return
      setLoading(true)
      void window.tabledm
        .readFile(notePath)
        .then((text) => {
          const next = {
            ...notePreviewFromMarkdown(notePath, text),
            imageUrl: notePreviewImageUrl(notePath, text, images, { hideBundled })
          }
          previewCache.set(notePath, next)
          if (aliveRef.current) setPreview(next)
        })
        .catch(() => {
          if (aliveRef.current) setPreview(null)
        })
        .finally(() => {
          if (aliveRef.current) setLoading(false)
        })
    }, 220)
  }

  function hideSoon(): void {
    clearTimer()
    timerRef.current = setTimeout(() => setOpen(false), 120)
  }

  return (
    <span className="relative inline" onMouseEnter={showSoon} onMouseLeave={hideSoon}>
      <button
        type="button"
        onClick={() => onOpenNote?.(notePath)}
        className="text-amber underline decoration-amber-dim underline-offset-2 hover:text-parchment"
      >
        {children}
      </button>
      {open ? (
        <span
          role="tooltip"
          onMouseEnter={showSoon}
          onMouseLeave={hideSoon}
          className="absolute left-0 top-[calc(100%+0.35rem)] z-50 w-72 rounded border border-amber/40 bg-panel-2 p-3 shadow-lg"
        >
          {preview ? (
            <span className="block space-y-1.5 text-left">
              {preview.imageUrl ? (
                <img
                  src={preview.imageUrl}
                  alt=""
                  className="mb-1 max-h-36 w-full rounded object-cover object-top"
                />
              ) : null}
              <span className="block font-display text-[15px] text-amber">{preview.title}</span>
              {preview.tagline ? (
                <span className="block text-[11px] text-muted">{preview.tagline}</span>
              ) : null}
              {preview.facts.length > 0 ? (
                <span className="block space-y-0.5">
                  {preview.facts.map((fact) => (
                    <span key={fact.label} className="flex gap-2 text-[11px] leading-snug">
                      <span className="shrink-0 text-muted">{fact.label}</span>
                      <span className="text-parchment">{fact.value}</span>
                    </span>
                  ))}
                </span>
              ) : null}
              {preview.blurb ? (
                <span className="block text-[12px] leading-snug text-parchment/90">{preview.blurb}</span>
              ) : null}
              {!preview.tagline && preview.facts.length === 0 && !preview.blurb ? (
                <span className="block text-[11px] text-muted">Open to view this sheet.</span>
              ) : null}
            </span>
          ) : (
            <span className="block text-[11px] text-muted">{loading ? 'Loading…' : 'Open to view this sheet.'}</span>
          )}
        </span>
      ) : null}
    </span>
  )
}
