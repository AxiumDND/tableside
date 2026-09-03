import { useEffect, useState, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { CreateNoteMapImage } from '../../../shared/types'
import { pathHasFolder } from '../../../shared/campaignLayout'
import { hasBundledPortrait } from '../../../shared/bundledPortrait'
import {
  campaignFileUrl,
  markdownUrlTransform,
  portraitForNote,
  resolveImageRef,
  srdPortraitUrl,
  type CampaignImage
} from '../lib/images'
import { extractFacts, extractHook, extractTagline, type ParsedStatblock } from '../lib/statblock'
import { webSheetUrlFromMarkdown, isWebSheetFactLabel, parseWebSheetUrl } from '../../../shared/webSheet'
import { stripSheetHeader } from '../../../shared/sheetBlock'
import RollableStatBlock from './RollableStatBlock'
import SheetArtFrame from './SheetArtFrame'
import { useHideBundledArtwork } from '../hooks/useBundledArtwork'

function looksLikeEmbed(text: string): boolean {
  return /!\[\[|\]\]|\.(png|jpe?g|webp|gif|svg)\b/i.test(text)
}

function titleFrom(path: string, markdown: string): string {
  const heading = /^#\s+\*?(.+?)\*?\s*$/m.exec(markdown)
  if (heading) {
    const text = heading[1].replace(/\*/g, '').trim()
    if (text && !looksLikeEmbed(text)) return text
  }
  const infobox = /\[!(?:pc|npc|monster|creature|bestiary|player|character|infobox)\]\+?[^\S\n]*(.*)$/im.exec(
    markdown
  )
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
  return stripSheetHeader(markdown)
}

function notesBody(markdown: string): string {
  let text = stripInfobox(markdown)
    .replace(/^#\s+\*?.*$/m, '')
    .replace(/^(?:>\s*)?!?\[\[[^\]]+\]\]\s*$/gm, '')
    .replace(/!\[\[.*?\]\]/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/```statblock[\s\S]*?```/gi, '')
    .replace(/^##?\s+Stat block[\s\S]*?(?=^## |\n#\w|z)/im, '')
    .replace(/layout:\s*Basic (?:5e|PF2e|V5) Layout[\s\S]*?(?=\n#\w|z)/i, '')
    .replace(/^##?\s+Midjourney prompt[\s\S]*?(?=^## |z)/im, '')
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
  onSetPortrait,
  onLinkWebSheet,
  renderNotes,
  holo = false
}: {
  path: string
  markdown: string
  images: CampaignImage[]
  selectedImage?: string | null
  block: ParsedStatblock
  onSelectImage?: (path: string) => void
  onAddToCombat?: () => void
  onSetPortrait?: (image: CreateNoteMapImage) => Promise<void>
  onLinkWebSheet?: (url: string) => Promise<string | null>
  renderNotes?: (markdown: string) => ReactNode
  holo?: boolean
}) {
  const title = titleFrom(path, markdown)
  const tagline = extractTagline(markdown)
  const hook = extractHook(markdown)
  const facts = extractFacts(markdown)
    .filter((fact) => !isWebSheetFactLabel(fact.label))
    .slice(0, 8)
  const webSheetUrl = webSheetUrlFromMarkdown(markdown)
  const canLinkWebSheet =
    pathHasFolder(path, 'party') || pathHasFolder(path, 'npcs') || pathHasFolder(path, 'bestiary')
  const webSheetPlaceholder = pathHasFolder(path, 'party')
    ? 'https://www.dndbeyond.com/characters/…'
    : 'https://www.dndbeyond.com/monsters/…'
  const [webSheetDraft, setWebSheetDraft] = useState('')
  const [webSheetError, setWebSheetError] = useState('')
  const [webSheetBusy, setWebSheetBusy] = useState(false)
  const hideBundled = useHideBundledArtwork()
  const rawImagePath = firstImage(markdown, path, images)
  const imagePath = hideBundled && hasBundledPortrait(markdown) ? null : rawImagePath
  const srdSrc =
    !imagePath && pathHasFolder(path, 'bestiary') && !hideBundled ? srdPortraitUrl(title) : null
  const imageSrc = imagePath ? campaignFileUrl(imagePath) : srdSrc
  const selectValue = imagePath ?? srdSrc
  const notes = notesBody(markdown)
  const [srdFailed, setSrdFailed] = useState(false)
  const hasArt = Boolean(imageSrc && !(srdSrc && srdFailed))

  useEffect(() => {
    setSrdFailed(false)
  }, [srdSrc])

  useEffect(() => {
    setWebSheetDraft(webSheetUrl ?? '')
    setWebSheetError('')
  }, [webSheetUrl, path])

  useEffect(() => {
    if (selectValue && onSelectImage) onSelectImage(selectValue)
  }, [selectValue, onSelectImage])

  async function submitWebSheetLink(): Promise<void> {
    if (!onLinkWebSheet || webSheetBusy) return
    const parsed = parseWebSheetUrl(webSheetDraft)
    if (!parsed) {
      setWebSheetError(
        pathHasFolder(path, 'party')
          ? 'Paste a character sheet link (…/characters/…).'
          : 'Paste a monster page link (…/monsters/…).'
      )
      return
    }
    setWebSheetBusy(true)
    try {
      const error = await onLinkWebSheet(parsed.canonicalUrl)
      if (error) setWebSheetError(error)
      else setWebSheetError('')
    } finally {
      setWebSheetBusy(false)
    }
  }

  const webSheetUnchanged =
    Boolean(webSheetUrl) && parseWebSheetUrl(webSheetDraft)?.canonicalUrl === webSheetUrl

  const webSheetControls =
    canLinkWebSheet && onLinkWebSheet ? (
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void submitWebSheetLink()
        }}
      >
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          {webSheetUrl ? 'Web sheet link' : 'Add web sheet'}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={webSheetDraft}
            onChange={(event) => {
              setWebSheetDraft(event.target.value)
              setWebSheetError('')
            }}
            placeholder={webSheetPlaceholder}
            className="min-w-[16rem] flex-1 rounded border border-line bg-ink px-2 py-1.5 text-sm outline-none focus:border-amber"
          />
          <button
            type="submit"
            disabled={webSheetBusy || !webSheetDraft.trim() || webSheetUnchanged}
            className="rounded bg-amber px-3 py-1.5 text-xs font-semibold text-on-amber disabled:bg-line"
          >
            {webSheetBusy ? 'Saving…' : webSheetUrl ? 'Update link' : 'Add link'}
          </button>
        </div>
        {webSheetError ? <p className="text-[11px] text-blood">{webSheetError}</p> : null}
      </form>
    ) : null

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-6">
      <RollableStatBlock
        block={block}
        onAddToCombat={onAddToCombat}
        portrait={
          <SheetArtFrame
            title={title}
            imageSrc={hasArt ? imageSrc : null}
            selectValue={selectValue}
            selectedImage={selectedImage}
            images={images}
            onSelectImage={onSelectImage}
            onSetPortrait={onSetPortrait}
            holo={holo}
            onSrdError={() => {
              if (srdSrc) setSrdFailed(true)
            }}
          />
        }
      />

      {tagline || hook || facts.length > 0 || notes || webSheetControls ? (
        <section className="space-y-4">
          {webSheetControls}
          {tagline ? <p className="text-sm italic text-muted">{tagline}</p> : null}
          {hook ? <p className="text-base leading-relaxed text-parchment/95">{hook}</p> : null}
          {facts.length > 0 ? (
            <dl className="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-1.5 text-sm">
              {facts.map((fact) => (
                <div key={fact.label} className="contents">
                  <dt className="text-muted">{fact.label}</dt>
                  <dd>{cleanWiki(fact.value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {notes ? (
            <div className={renderNotes ? 'text-[15px]' : 'markdown-body text-[15px]'}>
              {renderNotes ? (
                renderNotes(notes)
              ) : (
                <Markdown remarkPlugins={[remarkGfm]} urlTransform={markdownUrlTransform}>
                  {notes}
                </Markdown>
              )}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
