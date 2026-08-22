import { useEffect, useRef, useState } from 'react'
import type { CreateNoteMapImage } from '../../../shared/types'
import type { StockArtItem } from '../../../shared/stockArt'
import { stockArtUrl } from '../../../shared/stockArt'
import type { CampaignImage } from '../lib/images'
import portraitBlank from '../assets/portrait-blank.png'

export default function SheetArtFrame({
  title,
  imageSrc,
  selectValue,
  selectedImage,
  images,
  stockArt = [],
  stockArtLabel = 'Type',
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
  stockArt?: StockArtItem[]
  stockArtLabel?: string
  aspect?: 'portrait' | 'square' | 'wide'
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

  async function useStockArt(id: string): Promise<void> {
    if (!onSetPortrait || busy) return
    setBusy(true)
    try {
      await onSetPortrait({ kind: 'stock', id })
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
          className={`w-full object-cover ${
            aspect === 'square' ? 'aspect-square' : aspect === 'wide' ? 'aspect-[4/3]' : 'aspect-[3/4]'
          }`}
          onError={() => {
            if (imageSrc) onSrdError()
          }}
        />
      </button>
      {open && onSetPortrait ? (
        <div className="absolute inset-x-0 bottom-0 z-10 max-h-[85%] space-y-1 overflow-y-auto rounded-b bg-ink/95 p-1.5">
          {stockArt.length > 0 ? (
            <div>
              <p className="px-0.5 text-[10px] text-muted">{stockArtLabel}</p>
              <div className="mt-0.5 grid grid-cols-3 gap-1">
                {stockArt.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={busy}
                    title={item.title}
                    onClick={() => void useStockArt(item.id)}
                    className="overflow-hidden rounded border border-line text-left hover:border-amber disabled:opacity-50"
                  >
                    <img src={stockArtUrl(item.id)} alt="" className="aspect-video w-full object-cover" />
                    <span className="block truncate px-0.5 py-0.5 text-[9px] text-parchment/90">{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
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
            ? stockArt.length > 0
              ? 'Pick a type, load a file, or use campaign art'
              : 'Load a file or pick art already in this campaign'
            : hasArt
              ? selectedImage === selectValue
                ? 'Selected — Show to players. Click for art options.'
                : 'Click for art options or to select'
              : 'Click the blank to load art or pick campaign art'}
      </p>
    </div>
  )
}
