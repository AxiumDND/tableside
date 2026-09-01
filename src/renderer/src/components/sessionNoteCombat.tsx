import { type ComponentProps, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import type { CalloutBlock } from '../../../shared/callouts'
import type { BlockIndex } from '../../../shared/blockIndex'
import { serializeCombatCallout, type CombatFields } from '../../../shared/combatFields'
import {
  missingCombatantTokens,
  splitCalloutBlocks,
  splitCombatCardContent,
  type CampaignNote,
  type NightEncounter
} from '../lib/notes'
import { markdownUrlTransform } from '../lib/images'
import CombatCard from './CombatCard'
import type { WrapSheetBlock } from './sessionNoteShell'

type MarkdownComponents = ComponentProps<typeof Markdown>['components']
type CombatCardOnEnsure = ComponentProps<typeof CombatCard>['onEnsureMonster']

export type { WrapSheetBlock }

export type RenderNoteMarkdown = (
  text: string,
  keyPrefix: string,
  crawlOffset?: number,
  legendOffset?: number,
  galleryOffset?: number,
  videoOffset?: number,
  phoneOffset?: number,
  hyperOffset?: number,
  encounterScope?: string,
  sectionIndex?: number,
  blockPathPrefix?: number[]
) => ReactNode

/** Fenced `[!combat]` block — CombatCard plus optional Add to initiative. */
export function renderCombatCalloutBlock(opts: {
  part: CalloutBlock
  key: string
  blockKey: string
  blockEditing: boolean
  encounterScope?: string
  encounters: NightEncounter[]
  addingId: string | null
  onAddEncounter?: unknown
  onAddEncounterClick: (encounter: NightEncounter) => void
  blockIndex?: BlockIndex
  disabled?: boolean
  onBlockSave?: (key: string, markdown: string) => void
  path: string
  noteIndex: CampaignNote[]
  gearNotes?: CampaignNote[]
  system?: string | null
  onEnsureMonster?: CombatCardOnEnsure
  markdownComponents: MarkdownComponents
  wrapSheetBlock: WrapSheetBlock
  blockEditEnabled: boolean
  encounterSectionId: (heading: string, scope?: string) => string
}): ReactNode {
  const heading = opts.part.title?.trim() || 'Combat'
  const sectionId = opts.encounterSectionId(heading, opts.encounterScope)
  const encounter = opts.encounters.find((item) => item.id === sectionId)
  const canAdd = Boolean(encounter && opts.onAddEncounter)
  const initiativeAction = canAdd ? (
    <button
      type="button"
      title="Load these sheets plus every PC in PCs/party. Anyone already listed is skipped. NPCs/monsters at init 0 are rolled."
      onClick={() => opts.onAddEncounterClick(encounter!)}
      className="rounded bg-amber px-2 py-0.5 text-[11px] font-semibold text-on-amber"
    >
      {opts.addingId === encounter!.id ? 'Adding…' : 'Add to initiative'}
    </button>
  ) : null
  const rawCombat = opts.blockIndex?.get(opts.blockKey)?.block ?? opts.part
  const card = (
    <CombatCard
      title={rawCombat.title}
      body={rawCombat.markdown}
      editing={opts.blockEditing}
      disabled={opts.disabled}
      onChange={(fields: CombatFields) => opts.onBlockSave?.(opts.blockKey, serializeCombatCallout(fields))}
      adding={Boolean(encounter && opts.addingId === encounter.id)}
      onAdd={opts.blockEditEnabled ? undefined : canAdd ? () => opts.onAddEncounterClick(encounter!) : undefined}
      missing={missingCombatantTokens(rawCombat.markdown, opts.path, opts.noteIndex)}
      sheetPath={opts.path}
      notes={opts.gearNotes ?? opts.noteIndex}
      system={opts.system}
      onEnsureMonster={opts.onEnsureMonster}
      markdownComponents={opts.markdownComponents}
      urlTransform={markdownUrlTransform}
    />
  )
  return (
    <div key={opts.key}>
      {opts.wrapSheetBlock(opts.blockKey, opts.part, 'combat', card, opts.blockEditing ? card : undefined, initiativeAction)}
    </div>
  )
}

/**
 * ## Combat / Encounter heading: wrap the roster in CombatCard and leave
 * trailing prose outside the card. Shared by document and nested-section renders.
 */
export function renderBoxedCombatSection(opts: {
  key: string
  heading: string
  markdown: string
  encounter?: NightEncounter
  addingId: string | null
  onAddEncounter?: unknown
  onAddEncounterClick: (encounter: NightEncounter) => void
  path: string
  noteIndex: CampaignNote[]
  crawlOff: number
  legendOff: number
  galleryOff: number
  videoOff: number
  phoneOff: number
  hyperOff: number
  encounterScope?: string
  sectionIndex: number
  blockPathPrefix?: number[]
  renderMarkdown: RenderNoteMarkdown
}): ReactNode {
  const { card, rest } = splitCombatCardContent(opts.markdown)
  const cardParts = splitCalloutBlocks(card)
  const cardCrawls = cardParts.filter((block) => block.kind === 'crawl').length
  const cardLegends = cardParts.filter((block) => block.kind === 'legend').length
  const cardGalleries = cardParts.filter((block) => block.kind === 'gallery').length
  const cardVideos = cardParts.filter((block) => block.kind === 'video').length
  const cardPhones = cardParts.filter((block) => block.kind === 'phone').length
  const cardHypers = cardParts.filter((block) => block.kind === 'hyperspace').length
  return (
    <div key={opts.key}>
      <CombatCard
        title={opts.heading}
        adding={Boolean(opts.encounter && opts.addingId === opts.encounter.id)}
        onAdd={
          opts.encounter && opts.onAddEncounter
            ? () => opts.onAddEncounterClick(opts.encounter!)
            : undefined
        }
        missing={missingCombatantTokens(opts.markdown, opts.path, opts.noteIndex)}
      >
        {opts.renderMarkdown(
          card.replace(/^#{1,2}\s+[^\n]+\n?/, ''),
          `${opts.key}-card`,
          opts.crawlOff,
          opts.legendOff,
          opts.galleryOff,
          opts.videoOff,
          opts.phoneOff,
          opts.hyperOff,
          opts.encounterScope,
          opts.sectionIndex,
          opts.blockPathPrefix
        )}
      </CombatCard>
      {rest.trim() ? (
        <div className="markdown-body">
          {opts.renderMarkdown(
            rest,
            `${opts.key}-rest`,
            opts.crawlOff + cardCrawls,
            opts.legendOff + cardLegends,
            opts.galleryOff + cardGalleries,
            opts.videoOff + cardVideos,
            opts.phoneOff + cardPhones,
            opts.hyperOff + cardHypers,
            opts.encounterScope,
            opts.sectionIndex,
            opts.blockPathPrefix
          )}
        </div>
      ) : null}
    </div>
  )
}
