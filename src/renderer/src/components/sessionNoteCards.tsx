import { type ComponentProps, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { CalloutBlock } from '../../../shared/callouts'
import { serializeCalloutBlock, type BlockIndex } from '../../../shared/blockIndex'
import type { CampaignCurrency } from '../../../shared/currencies'
import { serializeTreasureCallout, type TreasureFields } from '../../../shared/treasureFields'
import { markdownUrlTransform, resolveMarkdownImageSrc, type CampaignImage } from '../lib/images'
import { splitLeadingSceneArt, type CampaignNote } from '../lib/notes'
import { partyGlanceRemainder, appendPartyCompanionLink, removePartyGlanceLink } from '../lib/partyGlance'
import type { WrapSheetBlock } from './sessionNoteShell'
import GmOnly from './GmOnly'
import PartyCard from './PartyCard'
import ReadAloud from './ReadAloud'
import SceneCard from './SceneCard'
import SheetArtFrame from './SheetArtFrame'
import TreasureCard from './TreasureCard'

type MarkdownComponents = ComponentProps<typeof Markdown>['components']
type TreasureOnEnsure = ComponentProps<typeof TreasureCard>['onEnsureGear']

export type RenderSectionedMarkdown = (
  text: string,
  keyPrefix: string,
  encounterScope?: string,
  crawlOffset?: number,
  legendOffset?: number,
  galleryOffset?: number,
  videoOffset?: number,
  sectionIndex?: number,
  blockPathPrefix?: number[]
) => ReactNode

/** Fenced `[!readaloud]` — parchment read-aloud card. */
export function renderReadAloudBlock(opts: {
  part: CalloutBlock
  key: string
  blockKey: string
  wrapSheetBlock: WrapSheetBlock
  markdownComponents: MarkdownComponents
}): ReactNode {
  const read = (
    <ReadAloud title={opts.part.title}>
      <Markdown remarkPlugins={[remarkGfm]} urlTransform={markdownUrlTransform} components={opts.markdownComponents}>
        {opts.part.markdown || ''}
      </Markdown>
    </ReadAloud>
  )
  return (
    <div key={opts.key}>
      {opts.wrapSheetBlock(opts.blockKey, opts.part, 'readaloud', read)}
    </div>
  )
}

/** Fenced `[!gmonly]` — hidden from the player screen. The "what this page does" stub is dropped. */
export function renderGmOnlyBlock(opts: {
  part: CalloutBlock
  key: string
  blockKey: string
  wrapSheetBlock: WrapSheetBlock
  markdownComponents: MarkdownComponents
}): ReactNode {
  if (/^what this page does$/i.test(opts.part.title ?? '')) return null
  const read = (
    <GmOnly title={opts.part.title}>
      <Markdown remarkPlugins={[remarkGfm]} urlTransform={markdownUrlTransform} components={opts.markdownComponents}>
        {opts.part.markdown || ''}
      </Markdown>
    </GmOnly>
  )
  return (
    <div key={opts.key}>
      {opts.wrapSheetBlock(opts.blockKey, opts.part, 'gmonly', read)}
    </div>
  )
}

/** Fenced `[!treasure]` — coin / mundane / magic card. */
export function renderTreasureBlock(opts: {
  part: CalloutBlock
  key: string
  blockKey: string
  blockEditing: boolean
  wrapSheetBlock: WrapSheetBlock
  blockIndex?: BlockIndex
  disabled?: boolean
  onBlockSave?: (key: string, markdown: string) => void
  currencies?: CampaignCurrency[]
  markdownComponents: MarkdownComponents
  system?: string | null
  path: string
  noteIndex: CampaignNote[]
  gearNotes?: CampaignNote[]
  onEnsureGear?: TreasureOnEnsure
}): ReactNode {
  const rawTreasure = opts.blockIndex?.get(opts.blockKey)?.block ?? opts.part
  const card = (
    <TreasureCard
      title={rawTreasure.title}
      body={rawTreasure.markdown}
      currencies={opts.currencies}
      editing={opts.blockEditing}
      disabled={opts.disabled}
      onChange={(fields: TreasureFields) =>
        opts.onBlockSave?.(opts.blockKey, serializeTreasureCallout(fields, opts.currencies))
      }
      markdownComponents={opts.markdownComponents}
      urlTransform={markdownUrlTransform}
      system={opts.system}
      sheetPath={opts.path}
      gearNotes={opts.gearNotes ?? opts.noteIndex}
      onEnsureGear={opts.onEnsureGear}
    />
  )
  return (
    <div key={opts.key}>
      {opts.wrapSheetBlock(opts.blockKey, opts.part, 'treasure', card, opts.blockEditing ? card : undefined)}
    </div>
  )
}

/** Fenced `[!party]` — roster card; nested callouts render through the sectioned factory. */
export function renderPartyBlock(opts: {
  part: CalloutBlock
  key: string
  blockKey: string
  blockEditing: boolean
  wrapSheetBlock: WrapSheetBlock
  crawlBase: number
  legendBase: number
  galleryBase: number
  videoBase: number
  sectionIndex: number
  blockPath: number[]
  renderSectionedMarkdown: RenderSectionedMarkdown
  path: string
  images?: CampaignImage[]
  noteIndex: CampaignNote[]
  onOpenNote?: (path: string) => void
  disabled?: boolean
  onBlockSave?: (key: string, markdown: string) => void
  blockIndex?: BlockIndex
}): ReactNode {
  const raw = opts.blockIndex?.get(opts.blockKey)?.block ?? opts.part
  const remainder = partyGlanceRemainder(raw.markdown)
  const saveBody = (body: string) => {
    opts.onBlockSave?.(opts.blockKey, serializeCalloutBlock({ ...raw, markdown: body }))
  }
  const card = (
    <PartyCard
      title={raw.title}
      markdown={raw.markdown}
      fromPath={opts.path}
      notes={opts.noteIndex}
      images={opts.images}
      onOpenNote={opts.onOpenNote}
      editing={opts.blockEditing}
      disabled={opts.disabled}
      onAddNpc={(stem) => saveBody(appendPartyCompanionLink(raw.markdown, stem))}
      onRemoveNpc={(stem) => saveBody(removePartyGlanceLink(raw.markdown, stem))}
    >
      {remainder
        ? opts.renderSectionedMarkdown(
            remainder,
            `${opts.key}-body`,
            opts.part.title?.trim() || undefined,
            opts.crawlBase,
            opts.legendBase,
            opts.galleryBase,
            opts.videoBase,
            opts.sectionIndex,
            opts.blockPath
          )
        : null}
    </PartyCard>
  )
  return (
    <div key={opts.key}>
      {opts.wrapSheetBlock(opts.blockKey, opts.part, 'party', card, opts.blockEditing ? card : undefined)}
    </div>
  )
}

/** Fenced `[!scene]` — beat card with optional leading art. */
export function renderSceneBlock(opts: {
  part: CalloutBlock
  key: string
  blockKey: string
  blockEditing: boolean
  wrapSheetBlock: WrapSheetBlock
  path: string
  images: CampaignImage[]
  selectedImage?: string | null
  onSelectImage?: (path: string) => void
  crawlBase: number
  legendBase: number
  galleryBase: number
  videoBase: number
  sectionIndex: number
  blockPath: number[]
  renderSectionedMarkdown: RenderSectionedMarkdown
}): ReactNode {
  const { artSrc, artLabel, body } = splitLeadingSceneArt(opts.part.markdown)
  const resolved = artSrc ? resolveMarkdownImageSrc(artSrc, opts.path, opts.images) : { url: '', path: null }
  const showArt = Boolean(artSrc || artLabel)
  const read = (
    <SceneCard
      title={opts.part.title}
      art={
        showArt ? (
          <SheetArtFrame
            title={opts.part.title?.trim() || artLabel || 'Scene'}
            imageSrc={resolved.path ? resolved.url : null}
            selectValue={resolved.path}
            selectedImage={opts.selectedImage}
            images={opts.images}
            aspect="portrait"
            onSelectImage={opts.onSelectImage}
            onSrdError={() => undefined}
          />
        ) : undefined
      }
    >
      {body.trim() && !opts.blockEditing
        ? opts.renderSectionedMarkdown(
            body,
            `${opts.key}-body`,
            opts.part.title?.trim() || undefined,
            opts.crawlBase,
            opts.legendBase,
            opts.galleryBase,
            opts.videoBase,
            opts.sectionIndex,
            opts.blockPath
          )
        : null}
    </SceneCard>
  )
  return (
    <div key={opts.key}>
      {opts.wrapSheetBlock(opts.blockKey, opts.part, 'scene', read)}
    </div>
  )
}
