import { useEffect, useState, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { CreateNoteMapImage } from '../../../shared/types'
import { pathHasFolder } from '../../../shared/campaignLayout'
import {
  campaignFileUrl,
  markdownUrlTransform,
  portraitForNote,
  resolveImageRef,
  srdItemUrl,
  srdSchoolUrl,
  type CampaignImage
} from '../lib/images'
import { extraItemFacts, ITEM_FIELD_LABELS, cleanWikiText, isPlaceholderSheetValue, isPlaceholderTagline } from '../lib/itemFacts'
import { extractFacts, extractTagline } from '../lib/statblock'
import type { ShopStockOffer } from '../../../shared/shopCatalogs'
import { looksLikeShopNote, stripShopStockSection } from '../../../shared/shopStock'
import type { ShopStanding } from '../../../shared/shopStanding'
import { matchStockArt, stockArtForTemplate, stockArtUrl } from '../../../shared/stockArt'
import SheetArtFrame from './SheetArtFrame'
import ShopStockBoard from './ShopStockBoard'

function looksLikeEmbed(text: string): boolean {
  return /!\[\[|\]\]|\.(png|jpe?g|webp|gif|svg)\b/i.test(text)
}

function titleFrom(path: string, markdown: string): string {
  const heading = /^#\s+\*?(.+?)\*?\s*$/m.exec(markdown)
  if (heading) {
    const text = heading[1].replace(/\*/g, '').trim()
    if (text && !looksLikeEmbed(text)) return text
  }
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

function schoolFromMarkdown(markdown: string): string | null {
  const embed = /!\[\[(Abjuration|Conjuration|Divination|Enchantment|Evocation|Illusion|Necromancy|Transmutation)\.[^\]]+\]\]/i.exec(
    markdown
  )
  if (embed) return embed[1]
  const line = /(?:Cantrip|Level\s+\d+)\s+(Abjuration|Conjuration|Divination|Enchantment|Evocation|Illusion|Necromancy|Transmutation)\b/i.exec(
    markdown
  )
  return line?.[1] ?? null
}

function gazetteerBody(markdown: string): string {
  return stripInfobox(markdown)
    .replace(/^#\s+\*?.*$/m, '')
    .replace(/^(?:>\s*)?!?\[\[[^\]]+\]\]\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function itemNotes(markdown: string): { category: string; notes: string } {
  let text = stripInfobox(markdown)
    .replace(/^#\s+\*?.*$/m, '')
    .replace(/^(?:>\s*)?!?\[\[[^\]]+\]\]\s*$/gm, '')
    .replace(/!\[\[.*?\]\]/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/^\|.*\|\s*$/gm, '')
    .replace(/^[-| :]+\s*$/gm, '')
    .trim()

  const fieldAlt = ITEM_FIELD_LABELS.join('|')
  const fieldLine = new RegExp(`^(?:${fieldAlt}):\\s*.+$`, 'gim')
  text = text.replace(fieldLine, '').replace(/\n{3,}/g, '\n\n').trim()

  const lines = text.split('\n')
  let category = ''
  const body: string[] = []
  const prefixRe = new RegExp(`^(.+?)\\s+(?:${fieldAlt}):`, 'i')
  const startsField = new RegExp(`^(?:${fieldAlt}):`, 'i')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!category && trimmed) {
      const prefix = prefixRe.exec(trimmed)
      if (prefix?.[1] && !startsField.test(trimmed)) {
        category = prefix[1].trim()
        continue
      }
      if (
        !startsField.test(trimmed) &&
        !trimmed.includes(':') &&
        !/[.!?]/u.test(trimmed) &&
        !trimmed.startsWith('*') &&
        !trimmed.startsWith('#') &&
        !trimmed.startsWith('|') &&
        !trimmed.startsWith('>') &&
        !trimmed.startsWith('[!') &&
        trimmed.length < 80
      ) {
        category = trimmed
        continue
      }
    }
    body.push(line)
  }
  return { category, notes: body.join('\n').trim() }
}

export default function ItemSheet({
  path,
  markdown,
  images,
  selectedImage,
  onSelectImage,
  onSetPortrait,
  onRerollStock,
  onChangeStock,
  onChangeStanding,
  renderNotes,
  holo = false
}: {
  path: string
  markdown: string
  images: CampaignImage[]
  selectedImage?: string | null
  onSelectImage?: (path: string) => void
  onSetPortrait?: (image: CreateNoteMapImage) => Promise<void>
  onRerollStock?: () => Promise<void>
  onChangeStock?: (stock: ShopStockOffer[]) => Promise<void>
  onChangeStanding?: (standing: ShopStanding) => Promise<void>
  renderNotes?: (markdown: string) => ReactNode
  holo?: boolean
}) {
  const title = titleFrom(path, markdown)
  const rawTagline = extractTagline(markdown)
  const tagline = isPlaceholderTagline(rawTagline) ? '' : rawTagline
  const isPlace = pathHasFolder(path, 'places')
  const isFaction = pathHasFolder(path, 'factions')
  const isShop = isPlace && looksLikeShopNote(markdown)
  const isGazetteer = isPlace || isFaction
  const stockChoices = isFaction
    ? stockArtForTemplate('faction')
    : isShop
      ? stockArtForTemplate('shop')
      : isPlace
        ? stockArtForTemplate('place')
        : []
  const tableFacts = extractFacts(markdown)
    .map((fact) => ({ ...fact, value: cleanWikiText(fact.value) }))
    .filter((fact) => fact.value && !isPlaceholderSheetValue(fact.value))
    .filter((fact) => !(isShop && fact.label.toLowerCase() === 'standing'))
  const lineFacts = isGazetteer
    ? []
    : extraItemFacts(markdown).filter((fact) => fact.value && !isPlaceholderSheetValue(fact.value))
  const facts = [
    ...tableFacts,
    ...lineFacts.filter((fact) => !tableFacts.some((row) => row.label.toLowerCase() === fact.label.toLowerCase()))
  ]
  const { category, notes } = isGazetteer
    ? { category: '', notes: gazetteerBody(isShop ? stripShopStockSection(markdown) : markdown) }
    : itemNotes(markdown)
  const heading = tagline || (isGazetteer ? '' : category)
  const imagePath = firstImage(markdown, path, images)
  const school = pathHasFolder(path, 'spells') ? schoolFromMarkdown(markdown) : null
  const stock = isGazetteer
    ? isFaction
      ? matchStockArt(title, 'faction')
      : (matchStockArt(title, 'shop') ?? matchStockArt(title, 'place'))
    : null
  const srdSrc = imagePath
    ? null
    : pathHasFolder(path, 'spells')
      ? school
        ? srdSchoolUrl(school)
        : null
      : isGazetteer
        ? stock
          ? stockArtUrl(stock.id)
          : null
        : srdItemUrl(title)
  const imageSrc = imagePath ? campaignFileUrl(imagePath) : srdSrc
  const selectValue = imagePath ?? srdSrc
  const [srdFailed, setSrdFailed] = useState(false)
  const hasArt = Boolean(imageSrc && !srdFailed)
  const artAspect = isPlace ? 'wide' : pathHasFolder(path, 'spells') ? 'portrait' : 'square'

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
          <h1 className="font-display text-3xl text-amber">{title}</h1>
          {heading ? <p className="mt-1 text-sm italic text-muted">{heading}</p> : null}
          {facts.length > 0 ? (
            <dl className="mt-4 grid grid-cols-[8.5rem_1fr] gap-x-3 gap-y-1.5 text-sm">
              {facts.map((fact) => (
                <div key={fact.label} className="contents">
                  <dt className="text-muted">{fact.label}</dt>
                  <dd>{cleanWikiText(fact.value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {isShop && onRerollStock ? (
            <button
              type="button"
              onClick={() => void onRerollStock()}
              className="mt-4 rounded border border-line px-2.5 py-1 text-xs hover:border-amber"
            >
              Reroll stock
            </button>
          ) : null}
        </div>
        <div className={isPlace ? 'w-80 shrink-0' : 'w-40 shrink-0'}>
          <SheetArtFrame
            title={title}
            imageSrc={hasArt ? imageSrc : null}
            selectValue={selectValue}
            selectedImage={selectedImage}
            images={images}
            aspect={artAspect}
            onSelectImage={onSelectImage}
            onSetPortrait={onSetPortrait}
            holo={holo}
            stockArt={stockChoices}
            stockArtLabel={isShop ? 'Shop type' : isFaction ? 'Emblem' : 'Place type'}
            onSrdError={() => setSrdFailed(true)}
          />
        </div>
      </div>
      {isShop && onChangeStock ? (
        <ShopStockBoard markdown={markdown} onChangeStock={onChangeStock} onChangeStanding={onChangeStanding} />
      ) : null}
      {notes ? (
        <section className={renderNotes ? 'text-[15px]' : 'markdown-body text-[15px]'}>
          {renderNotes ? (
            renderNotes(notes)
          ) : (
            <Markdown remarkPlugins={[remarkGfm]} urlTransform={markdownUrlTransform}>
              {notes}
            </Markdown>
          )}
        </section>
      ) : null}
    </div>
  )
}
