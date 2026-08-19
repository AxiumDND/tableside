import { useEffect, useRef, useState, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { CreateNoteMapImage } from '../../../shared/types'
import { pathHasFolder } from '../../../shared/campaignLayout'
import {
  campaignFileUrl,
  markdownUrlTransform,
  portraitForNote,
  resolveImageRef,
  srdPortraitUrl,
  type CampaignImage
} from '../lib/images'
import { extractFacts, extractHook, extractTagline, type ParsedStatblock } from '../lib/statblock'
import RollableStatBlock from './RollableStatBlock'
import portraitBlank from '../assets/portrait-blank.png'

function looksLikeEmbed(text: string): boolean {
  return /!\[\[|\]\]|\.(png|jpe?g|webp|gif|svg)\b/i.test(text)
}

function titleFrom(path: string, markdown: string): string {
  const heading = /^#\s+\*?(.+?)\*?\s*$/m.exec(markdown)
  if (heading) {
    const text = heading[1].replace(/\*/g, '').trim()
    if (text && !looksLikeEmbed(text)) return text
  }
  const infobox = /\[!infobox\]\+?[^\S\n]*(.*)$/im.exec(markdown)
  const extra = infobox?.[1]?.trim()
  if (extra && !looksLikeEmbed(extra)) return extra
  return (path.split('/').pop() ?? path).replace(/\.[^.]+$/, '')
}

function firstImage(markdown: string, path: string, images: CampaignImage[]): string | null {
  const wiki = /!\[\[([^\]\n]+)\]\]/.exec(markdown)
  if (wiki) {
    const found = resolveImageRef(wiki[1], path, images)
    if (found) return found
  }
  const md = /!\[[^\]]*\]\(([^)]+)\)/.exec(markdown)
  if (md) {
    const found = resolveImageRef(md[1], path, images)
    if (found) return found
  }
  return portraitForNote(path, images) ?? portraitForNote(titleFrom(path, markdown) + '.md', images)
}

function stripInfobox(markdown: string): string {
  const lines = markdown.replace(/\r/g, '').split('\n')
  const out: string[] = []
  let i = 0
  while (i < lines.length) {
    if (/^\s*>?\s*\[!infobox\]/i.test(lines[i])) {
      i += 1
      while (i < lines.length && /^>/.test(lines[i])) i += 1
      while (i < lines.length && !lines[i].trim()) i += 1
      continue
    }
    out.push(lines[i])
    i += 1
  }
  return out.join('\n')
}

function notesBody(markdown: string): string {
  let text = stripInfobox(markdown)
    .replace(/^#\s+\*?.*$/m, '')
    .replace(/^(?:>\s*)?!?\[\[[^\]]+\]\]\s*$/gm, '')
    .replace(/!\[\[.*?\]\]/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/```statblock[\s\S]*?```/gi, '')
    .replace(/^##?\s+Stat block[\s\S]*?(?=^## |\n#\w|\z)/im, '')
    .replace(/layout:\s*Basic 5e Layout[\s\S]*?(?=\n#\w|\z)/i, '')
    .replace(/^##?\s+Midjourney prompt[\s\S]*?(?=^## |\z)/im, '')
    .replace(/^#[a-z0-9_-]+(?:\s+#[a-z0-9_-]+)*\s*$/gim, '')
    .replace(/^(\*[^*\n][\s\S]*?\*)\s*$/m, '')
    .trim()

  const heading = text.search(/^##\s/m)
  if (heading > 0) {
    const before = text.slice(0, heading).replace(/^\|.*\|\s*\n\|[-| :]+\|\s*\n(?:\|.*\|\s*\n)*/gm, '')
    text = `${before}${text.slice(heading)}`
  }
  return text.trim()
}

function cleanWiki(value: string): string {
  return value.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_all, name: string, alias?: string) => alias || name)
}

export default function NpcSheet({
  path,
  markdown,
  images,
  selectedImage,
  block,
  onSelectImage,
  onAddToCombat,
  onEdit,
  onSetPortrait,
  renderNotes
}: {
  path: string
  markdown: string
  images: CampaignImage[]
  selectedImage?: string | null
  block: ParsedStatblock
  onSelectImage?: (path: string) => void
  onAddToCombat?: () => void
  onEdit?: () => void
  onSetPortrait?: (image: CreateNoteMapImage) => Promise<void>
  renderNotes?: (markdown: string) => ReactNode
}) {
  const title = titleFrom(path, markdown)
  const tagline = extractTagline(markdown)
  const hook = extractHook(markdown)
  const facts = extractFacts(markdown).slice(0, 8)
  const imagePath = firstImage(markdown, path, images)
  const srdSrc = !imagePath && pathHasFolder(path, 'bestiary') ? srdPortraitUrl(title) : null
  const imageSrc = imagePath ? campaignFileUrl(imagePath) : srdSrc
  const selectValue = imagePath ?? srdSrc
  const notes = notesBody(markdown)
  const [srdFailed, setSrdFailed] = useState(false)
  const hasArt = Boolean(imageSrc && !(srdSrc && srdFailed))

  useEffect(() => {
    setSrdFailed(false)
  }, [srdSrc])

  useEffect(() => {
    if (selectValue && onSelectImage) onSelectImage(selectValue)
  }, [selectValue])

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-6">
      <div className="flex items-start gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-display text-3xl text-amber">{title}</h1>
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="shrink-0 rounded border border-line px-2 py-1 text-xs hover:border-amber"
              >
                Edit markdown
              </button>
            ) : null}
          </div>
          {tagline ? <p className="mt-1 text-sm italic text-muted">{tagline}</p> : null}
          {hook ? <p className="mt-3 text-base leading-relaxed text-parchment/95">{hook}</p> : null}
          {facts.length > 0 ? (
            <dl className="mt-4 grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-1.5 text-sm">
              {facts.map((fact) => (
                <div key={fact.label} className="contents">
                  <dt className="text-muted">{fact.label}</dt>
                  <dd>{cleanWiki(fact.value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
        <SheetArtFrame
          title={title}
          imageSrc={hasArt ? imageSrc : null}
          selectValue={selectValue}
          selectedImage={selectedImage}
          images={images}
          onSelectImage={onSelectImage}
          onSetPortrait={onSetPortrait}
          onSrdError={() => {
            if (srdSrc) setSrdFailed(true)
          }}
        />
      </div>

      {notes ? (
        <section className={renderNotes ? 'text-[15px]' : 'markdown-body text-[15px]'}>
          {renderNotes ? renderNotes(notes) : (
            <Markdown remarkPlugins={[remarkGfm]} urlTransform={markdownUrlTransform}>
              {notes}
            </Markdown>
          )}
        </section>
      ) : null}

      <section>
        <h2 className="font-display text-lg text-amber">Stat block</h2>
        <div className="mt-2">
          <RollableStatBlock
            block={block}
            onAddToCombat={onAddToCombat}
            portrait={
              hasArt ? (
                <button
                  type="button"
                  onClick={() => selectValue && onSelectImage?.(selectValue)}
                  className={`block w-full ${
                    selectedImage === selectValue ? 'ring-2 ring-amber' : ''
                  }`}
                >
                  <img
                    src={imageSrc ?? portraitBlank}
                    alt={title}
                    className="aspect-[3/4] w-full object-cover"
                    onError={() => {
                      if (srdSrc) setSrdFailed(true)
                    }}
                  />
                  <span className="block bg-ink px-1.5 py-1 text-left text-[10px] leading-tight text-muted">
                    {selectedImage === selectValue ? 'Selected — Show to players' : 'Click to select'}
                  </span>
                </button>
              ) : undefined
            }
          />
        </div>
      </section>
    </div>
  )
}

function SheetArtFrame({
  title,
  imageSrc,
  selectValue,
  selectedImage,
  images,
  onSelectImage,
  onSetPortrait,
  onSrdError
}: {
  title: string
  imageSrc: string | null
  selectValue: string | null
  selectedImage?: string | null
  images: CampaignImage[]
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
    <div ref={rootRef} className="relative w-40 shrink-0">
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
          className="aspect-[3/4] w-full object-cover"
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
