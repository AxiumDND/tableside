import { type ComponentProps, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { CalloutBlock } from '../../../shared/callouts'
import type { BlockIndex } from '../../../shared/blockIndex'
import type { CampaignCurrency } from '../../../shared/currencies'
import { serializeTreasureCallout, type TreasureFields } from '../../../shared/treasureFields'
import { markdownUrlTransform } from '../lib/images'
import type { CampaignNote } from '../lib/notes'
import type { WrapSheetBlock } from './sessionNoteCombat'
import GmOnly from './GmOnly'
import ReadAloud from './ReadAloud'
import TreasureCard from './TreasureCard'

type MarkdownComponents = ComponentProps<typeof Markdown>['components']
type TreasureOnEnsure = ComponentProps<typeof TreasureCard>['onEnsureGear']

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
