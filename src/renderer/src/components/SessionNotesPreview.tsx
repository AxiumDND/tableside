import type { ReactNode } from 'react'
import { isHoloPortraitPath, isStartHerePath } from '../../../shared/campaignLayout'
import { holoPortraitsEnabled, type ThemeId } from '../../../shared/theme'
import type { Character, CreateNoteMapImage } from '../../../shared/types'
import type { ShopStanding } from '../../../shared/shopStanding'
import type { ShopStockOffer } from '../../../shared/shopCatalogs'
import { imageTitle, prepareNoteMarkdown, type CampaignImage } from '../lib/images'
import { linkWikiNotes, type CampaignNote } from '../lib/notes'
import type { ParsedStatblock } from '../lib/statblock'
import GettingStarted from './GettingStarted'
import StartHereTheme from './StartHereTheme'
import ItemSheet from './ItemSheet'
import NpcSheet from './NpcSheet'
import { CharacterCard } from './StatBlock'
import type { FileKind } from './CampaignFiles'

export function SessionNotesPreview({
  path,
  kind,
  imageUrl,
  images,
  noteIndex,
  selectedImage,
  character,
  markdown,
  rendered,
  npcMode,
  parsedNpc,
  itemMode,
  disabled,
  onSelectImage,
  onAddNpcToCombat,
  onNewCampaign,
  onOpenCampaign,
  onOpenSample,
  recentCampaigns,
  onOpenRecent,
  shopsEnabled,
  theme,
  onThemeChange,
  holoPortraits,
  digitalRain,
  onHoloPortraitsChange,
  onDigitalRainChange,
  onSetPortrait,
  onLinkBeyond,
  onRerollStock,
  onChangeStock,
  onChangeStanding,
  renderDocument
}: {
  path: string
  kind: FileKind
  imageUrl?: string
  images: CampaignImage[]
  noteIndex: CampaignNote[]
  selectedImage?: string | null
  character: Character | null
  markdown: string
  rendered: string
  npcMode: boolean
  parsedNpc: { block: ParsedStatblock; rest: string } | null
  itemMode: boolean
  disabled?: boolean
  onSelectImage?: (path: string) => void
  onAddNpcToCombat?: (block: ParsedStatblock, notePath: string) => void
  onNewCampaign?: () => void
  onOpenCampaign?: () => void
  onOpenSample?: () => void
  recentCampaigns?: import('../../../shared/types').RecentCampaign[]
  onOpenRecent?: (folder: string) => void
  shopsEnabled?: boolean
  theme?: ThemeId
  onThemeChange?: (theme: ThemeId) => void
  holoPortraits?: boolean
  digitalRain?: boolean
  onHoloPortraitsChange?: (enabled: boolean) => void
  onDigitalRainChange?: (enabled: boolean) => void
  onSetPortrait: (image: CreateNoteMapImage) => Promise<void>
  onLinkBeyond?: (url: string) => Promise<string | null>
  onRerollStock?: () => Promise<void>
  onChangeStock?: (stock: ShopStockOffer[]) => Promise<void>
  onChangeStanding?: (standing: ShopStanding) => Promise<void>
  renderDocument: (text: string, keyPrefix: string) => ReactNode
}) {
  function renderSheetNotes(body: string): ReactNode {
    return renderDocument(
      linkWikiNotes(prepareNoteMarkdown(body, path, images, { injectPortrait: false }), path, noteIndex),
      'sheet'
    )
  }

  if (!path) {
    return (
      <GettingStarted
        hasCampaign={!disabled}
        onNewCampaign={onNewCampaign}
        onOpenCampaign={onOpenCampaign}
        onOpenSample={onOpenSample}
        recentCampaigns={recentCampaigns}
        onOpenRecent={onOpenRecent}
      />
    )
  }
  if (kind === 'image' && imageUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <img src={imageUrl} alt={imageTitle(path)} className="max-h-[70vh] max-w-full object-contain" />
        <p className="text-xs text-muted">Selected — press Show to players to put this on the second monitor.</p>
      </div>
    )
  }
  if (kind === 'pdf' && imageUrl) {
    return (
      <iframe
        title={imageTitle(path)}
        src={`${imageUrl}#navpanes=0&pagemode=none`}
        className="h-full min-h-[70vh] w-full rounded border border-line bg-ink"
      />
    )
  }
  if (kind === 'audio' && imageUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-parchment">{imageTitle(path)}</p>
        <audio controls src={imageUrl} className="w-full max-w-md" />
        <p className="text-xs text-muted">Preview only — play table audio from the Music panel.</p>
      </div>
    )
  }
  if (kind === 'other') {
    return <p className="text-sm text-muted">No preview for this file type.</p>
  }
  if (kind === 'character' && character) {
    return (
      <div className="mx-auto max-w-sm space-y-3">
        <CharacterCard character={character} />
        {character.notes ? <p className="text-sm text-parchment/90">{character.notes}</p> : null}
      </div>
    )
  }
  if (npcMode && parsedNpc) {
    return (
      <NpcSheet
        path={path}
        markdown={markdown}
        images={images}
        selectedImage={selectedImage}
        block={parsedNpc.block}
        onSelectImage={onSelectImage}
        onAddToCombat={onAddNpcToCombat ? () => onAddNpcToCombat(parsedNpc.block, path) : undefined}
        onSetPortrait={onSetPortrait}
        onLinkBeyond={onLinkBeyond}
        holo={holoPortraitsEnabled(theme, holoPortraits) && isHoloPortraitPath(path)}
        renderNotes={renderSheetNotes}
      />
    )
  }
  if (itemMode) {
    return (
      <ItemSheet
        path={path}
        markdown={markdown}
        images={images}
        selectedImage={selectedImage}
        onSelectImage={onSelectImage}
        onSetPortrait={onSetPortrait}
        onRerollStock={shopsEnabled ? onRerollStock : undefined}
        onChangeStock={shopsEnabled ? onChangeStock : undefined}
        onChangeStanding={onChangeStanding}
        holo={holoPortraitsEnabled(theme, holoPortraits) && isHoloPortraitPath(path)}
        renderNotes={renderSheetNotes}
      />
    )
  }
  return (
    <div className="mx-auto max-w-3xl text-base">
      {theme && onThemeChange && isStartHerePath(path) ? (
        <StartHereTheme
          theme={theme}
          onChange={onThemeChange}
          holoPortraits={holoPortraits}
          onHoloPortraitsChange={onHoloPortraitsChange}
          digitalRain={digitalRain}
          onDigitalRainChange={onDigitalRainChange}
        />
      ) : null}
      {renderDocument(rendered || '_This file is empty._', 'note')}
    </div>
  )
}
