import { useEffect, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  campaignFileUrl,
  markdownUrlTransform,
  portraitForNote,
  resolveImageRef,
  type CampaignImage
} from '../lib/images'
import { extractFacts, extractHook, extractTagline, type ParsedStatblock } from '../lib/statblock'
import RollableStatBlock from './RollableStatBlock'

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
  if (wiki) return resolveImageRef(wiki[1], path, images)
  const md = /!\[[^\]]*\]\(([^)]+)\)/.exec(markdown)
  if (md) return resolveImageRef(md[1], path, images)
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
  renderNotes?: (markdown: string) => ReactNode
}) {
  const title = titleFrom(path, markdown)
  const tagline = extractTagline(markdown)
  const hook = extractHook(markdown)
  const facts = extractFacts(markdown).slice(0, 8)
  const imagePath = firstImage(markdown, path, images)
  const notes = notesBody(markdown)

  useEffect(() => {
    if (imagePath && onSelectImage) onSelectImage(imagePath)
  }, [imagePath])

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-6">
      <div className="grid items-start gap-4 sm:grid-cols-[180px_1fr]">
        {imagePath ? (
          <button
            type="button"
            onClick={() => onSelectImage?.(imagePath)}
            className={`overflow-hidden rounded border ${
              selectedImage === imagePath ? 'border-amber' : 'border-line hover:border-amber-dim'
            }`}
          >
            <img src={campaignFileUrl(imagePath)} alt={title} className="aspect-[2/3] w-full object-cover" />
            <span className="block bg-ink px-2 py-1 text-[11px] text-muted">
              {selectedImage === imagePath ? 'Selected — Show to players' : 'Click portrait to select'}
            </span>
          </button>
        ) : (
          <div className="flex aspect-[2/3] items-center justify-center rounded border border-dashed border-line text-xs text-muted">
            No portrait
          </div>
        )}
        <div>
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
          <RollableStatBlock block={block} onAddToCombat={onAddToCombat} />
        </div>
      </section>
    </div>
  )
}
