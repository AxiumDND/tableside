import { useEffect, useRef, useState } from 'react'
import type { CreateNoteMapImage } from '../../../shared/types'
import type { CampaignImage } from '../lib/images'
import portraitBlank from '../assets/portrait-blank.png'

export default function SheetArtFrame({
  title,
  imageSrc,
  selectValue,
  selectedImage,
  images,
  aspect = 'portrait',
  onSelectImage,
  onSetPortrait,
  onSrdError
}: {
  title: string
  imageSrc: string | null
  selectValue: string | null
  selectedImage?: string | null
  images: CampaignImage[]
  aspect?: 'portrait' | 'square'
  onSelectImage?: (path: string) => void
  onSetPortrait?: (image: CreateNoteMapImage) => Promise<void>
  onSrdError: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const hasArt = Boolean(imageSrc)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  async function loadFromDisk(): Promise<void> {
    if (!onSetPortrait || busy) return
    const picked = await window.tabledm.pickImageFile()
    if (!picked) return
    setBusy(true)
    try {
      await onSetPortrait({ kind: 'import', filePath: picked.filePath })
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  async function useCampaignArt(relativePath: string): Promise<void> {
    if (!onSetPortrait || busy || !relativePath) return
    setBusy(true)
    try {
      await onSetPortrait({ kind: 'existing', path: relativePath })
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        onClick={() => {
          if (hasArt && selectValue) onSelectImage?.(selectValue)
          if (onSetPortrait) setOpen((value) => !value)
        }}
        className={`block w-full overflow-hidden rounded border border-line ${
          hasArt && selectedImage === selectValue ? 'ring-2 ring-amber' : ''
        }`}
      >
        <img
          src={imageSrc ?? portraitBlank}
          alt={hasArt ? title : ''}
          className={`w-full object-cover ${aspect === 'square' ? 'aspect-square' : 'aspect-[3/4]'}`}
          onError={() => {
            if (imageSrc) onSrdError()
          }}
        />
      </button>
      {open && onSetPortrait ? (
        <div className="absolute inset-x-0 bottom-0 space-y-1 rounded-b bg-ink/95 p-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => void loadFromDisk()}
            className="w-full rounded border border-line px-2 py-1 text-[11px] hover:border-amber disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Load art…'}
          </button>
          <select
            disabled={busy}
            value=""
            onChange={(event) => {
              const value = event.target.value
              event.target.value = ''
              if (value) void useCampaignArt(value)
            }}
            className="w-full rounded border border-line bg-ink px-1 py-1 text-[11px] text-parchment outline-none focus:border-amber disabled:opacity-50"
          >
            <option value="">Campaign art…</option>
            {images.map((img) => (
              <option key={img.relativePath} value={img.relativePath}>
                {img.relativePath}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <p className="mt-1.5 text-[10px] leading-tight text-muted">
        {busy
          ? 'Saving…'
          : open
            ? 'Load a file or pick art already in this campaign'
            : hasArt
              ? selectedImage === selectValue
                ? 'Selected — Show to players. Click for art options.'
                : 'Click for art options or to select'
              : 'Click the blank to load art or pick campaign art'}
      </p>
    </div>
  )
}
