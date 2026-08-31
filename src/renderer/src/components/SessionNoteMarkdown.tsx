import { type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  blockKeyFromPath,
  insertableBlockKinds,
  insertableBlockKindsForParent,
  serializeCalloutBlock,
  type BlockIndex
} from '../../../shared/blockIndex'
import type { CalloutBlock, CalloutKind } from '../../../shared/callouts'
import {
  crawlLogoRef,
  crawlPlainText,
  crawlPreface,
  crawlMusicRef,
  crawlEndImageRef,
  type CrawlCalloutFields
} from '../../../shared/openingCrawl'
import {
  legendLogoRef,
  legendLook,
  legendPlainText,
  legendPreface,
  legendMusicRef,
  legendEndImageRef,
  type LegendCalloutFields
} from '../../../shared/openingLegend'
import {
  galleryImageRefs,
  galleryIntervalSec,
  galleryLoops,
  galleryShowTitle,
  type GalleryCalloutFields
} from '../../../shared/playerGallery'
import { parseVideoFields, type VideoCalloutFields } from '../../../shared/playerVideo'
import { legendPlayEnabled, type ThemeId } from '../../../shared/theme'
import type { AudioTrack } from '../../../shared/audio'
import type {
  PlayerCrawl,
  PlayerGallery,
  PlayerLegend,
  PlayerVideo
} from '../../../shared/types'
import {
  markdownUrlTransform,
  resolveMarkdownImageSrc,
  type CampaignImage,
  type CampaignVideo
} from '../lib/images'
import {
  childText,
  encounterSectionId,
  headingId,
  splitLeadingSceneArt,
  splitMarkdownSections,
  splitCombatCardContent,
  splitCalloutBlocks,
  isCombatHeading,
  missingCombatantTokens,
  type CampaignNote,
  type NightEncounter
} from '../lib/notes'
import CalloutCard from './CalloutCard'
import CrawlCard from './CrawlCard'
import LegendCard from './LegendCard'
import GalleryCard from './GalleryCard'
import VideoCard from './VideoCard'
import CombatCard from './CombatCard'
import TreasureCard from './TreasureCard'
import NoteWikiLink from './NoteWikiLink'
import GmOnly from './GmOnly'
import ReadAloud from './ReadAloud'
import PartyCard from './PartyCard'
import SceneCard from './SceneCard'
import SheetArtFrame from './SheetArtFrame'
import SheetBlockShell, { BLOCK_KIND_LABELS } from './SheetBlockShell'
import BlockMarkdownEditor from './BlockMarkdownEditor'
import LinksCard, { type BlockNavEntry } from './LinksCard'
import {
  serializeTreasureCallout,
  type TreasureFields
} from '../../../shared/treasureFields'
import {
  serializeCombatCallout,
  type CombatFields
} from '../../../shared/combatFields'

export type SessionNoteMarkdownDeps = {
  markdown: string
  path: string
  images: CampaignImage[]
  noteIndex: CampaignNote[]
  selectedImage?: string | null
  theme?: ThemeId
  disabled?: boolean
  musicTracks?: AudioTrack[]
  videos?: CampaignVideo[]
  encounters: NightEncounter[]
  addingId: string | null
  onOpenNote?: (path: string) => void
  onSelectImage?: (path: string) => void
  onAddEncounter?: unknown
  onAddEncounterClick: (encounter: NightEncounter) => void
  activeCrawl?: { title?: string; body: string } | null
  playerCrawl?: PlayerCrawl | null
  onStopCrawl?: () => void
  onPlayCrawl?: unknown
  persistCrawl: (index: number, fields: CrawlCalloutFields) => void | Promise<void>
  playCrawlCard: (index: number, fields: CrawlCalloutFields) => void | Promise<void>
  loadCrawlLogo: () => Promise<string | null>
  loadCrawlEndImage: () => Promise<string | null>
  loadCrawlMusic: () => Promise<string | null>
  activeLegend?: { title?: string; body: string } | null
  playerLegend?: PlayerLegend | null
  onStopLegend?: () => void
  onPlayLegend?: unknown
  persistLegend: (index: number, fields: LegendCalloutFields) => void | Promise<void>
  playLegendCard: (index: number, fields: LegendCalloutFields) => void | Promise<void>
  loadLegendLogo: () => Promise<string | null>
  loadLegendEndImage: () => Promise<string | null>
  loadLegendMusic: () => Promise<string | null>
  activeGallery?: { title?: string; imageRefs: string[] } | null
  playerGallery?: PlayerGallery | null
  onStopGallery?: () => void
  onGalleryPrev?: () => void
  onGalleryNext?: () => void
  onPlayGallery?: unknown
  persistGallery: (index: number, fields: GalleryCalloutFields) => void | Promise<void>
  playGalleryCard: (index: number, fields: GalleryCalloutFields) => void | Promise<void>
  activeVideo?: { title?: string; videoRef: string } | null
  playerVideo?: PlayerVideo | null
  onStopVideo?: () => void
  onPlayVideo?: unknown
  persistVideo: (index: number, fields: VideoCalloutFields) => void | Promise<void>
  playVideoCard: (index: number, fields: VideoCalloutFields) => void | Promise<void>
  loadVideoFile: () => Promise<string | null>
  blockEditEnabled?: boolean
  blockIndex?: BlockIndex
  editingBlocks?: ReadonlySet<string>
  onBlockEdit?: (key: string) => void
  onBlockDone?: (key: string) => void
  onBlockSave?: (key: string, markdown: string) => void
  onBlockInsert?: (key: string, position: 'above' | 'below', kind: CalloutKind) => void
  onBlockDelete?: (key: string) => void
  currencies?: import('../../../shared/currencies').CampaignCurrency[]
  system?: string | null
  onEnsureGear?: (
    record: import('../lib/srd').SrdRecord
  ) => Promise<'added' | 'exists' | void> | 'added' | 'exists' | void
  onEnsureMonster?: (
    record: import('../lib/srd').SrdRecord
  ) => Promise<'added' | 'exists' | void> | 'added' | 'exists' | void
  gearNotes?: CampaignNote[]
}

export function createSessionNoteMarkdown(deps: SessionNoteMarkdownDeps): {
  renderMarkdown: (
    text: string,
    keyPrefix: string,
    crawlOffset?: number,
    legendOffset?: number,
    galleryOffset?: number,
    videoOffset?: number,
    encounterScope?: string
  ) => ReactNode
  renderSectionedMarkdown: (
    text: string,
    keyPrefix: string,
    encounterScope?: string,
    crawlOffset?: number,
    legendOffset?: number,
    galleryOffset?: number,
    videoOffset?: number
  ) => ReactNode
  renderDocument: (text: string, keyPrefix: string) => ReactNode
} {
  const {
    markdown,
    path,
    images,
    noteIndex,
    selectedImage,
    theme,
    disabled,
    musicTracks,
    videos,
    encounters,
    addingId,
    onOpenNote,
    onSelectImage,
    onAddEncounter,
    onAddEncounterClick,
    activeCrawl,
    playerCrawl,
    onStopCrawl,
    onPlayCrawl,
    persistCrawl,
    playCrawlCard,
    loadCrawlLogo,
    loadCrawlEndImage,
    loadCrawlMusic,
    activeLegend,
    playerLegend,
    onStopLegend,
    onPlayLegend,
    persistLegend,
    playLegendCard,
    loadLegendLogo,
    loadLegendEndImage,
    loadLegendMusic,
    activeGallery,
    playerGallery,
    onStopGallery,
    onGalleryPrev,
    onGalleryNext,
    onPlayGallery,
    persistGallery,
    playGalleryCard,
    activeVideo,
    playerVideo,
    onStopVideo,
    onPlayVideo,
    persistVideo,
    playVideoCard,
    loadVideoFile,
    blockEditEnabled = false,
    blockIndex,
    editingBlocks = new Set(),
    onBlockEdit,
    onBlockDone,
    onBlockSave,
    onBlockInsert,
    onBlockDelete,
    currencies,
    system,
    onEnsureGear,
    onEnsureMonster,
    gearNotes
  } = deps

  const markdownComponents = {
    h1: ({ children }: { children?: ReactNode }) => {
      const text = childText(children)
      return <h1 id={headingId(text)}>{children}</h1>
    },
    h2: ({ children }: { children?: ReactNode }) => {
      const text = childText(children)
      return (
        <h2 id={headingId(text)} className="mt-0">
          {children}
        </h2>
      )
    },
    h3: ({ children }: { children?: ReactNode }) => {
      const text = childText(children)
      return <h3 id={headingId(text)}>{children}</h3>
    },
    p: ({ children }: { children?: ReactNode }) => {
      const text = childText(children)
      if (/^Combatants:/i.test(text)) {
        return <p className="combat-roster">{children}</p>
      }
      return <p>{children}</p>
    },
    a: ({ href, children }: { href?: string; children?: ReactNode }) => {
      if (href?.startsWith('#note:')) {
        const notePath = decodeURIComponent(href.slice(6))
        return (
          <NoteWikiLink notePath={notePath} onOpenNote={onOpenNote}>
            {children}
          </NoteWikiLink>
        )
      }
      return (
        <a href={href} className="text-amber underline">
          {children}
        </a>
      )
    },
    img: ({ src, alt }: { src?: string; alt?: string }) => {
      const resolved = resolveMarkdownImageSrc(src, path, images)
      const active = resolved.path != null && resolved.path === selectedImage
      return (
        <button
          type="button"
          onClick={() => resolved.path && onSelectImage?.(resolved.path)}
          className={`inline-block max-w-full rounded border p-1 text-left align-top ${
            active ? 'border-amber bg-amber/10' : 'border-transparent hover:border-amber-dim'
          }`}
        >
          <img src={resolved.url} alt={alt ?? ''} className="max-h-40 max-w-full object-contain" />
          <span className="mt-1 block max-w-[12rem] truncate text-[11px] text-muted">
            {active ? 'Selected — Show to players' : alt || 'Click to select'}
          </span>
        </button>
      )
    }
  }

  function sheetBlockKind(kind: CalloutKind): CalloutKind {
    return insertableBlockKinds().includes(kind) ? kind : 'note'
  }

  function blockNavEntries(excludeKey: string): BlockNavEntry[] {
    if (!blockIndex) return []
    return [...blockIndex.entries()]
      .filter(([key, item]) => key !== excludeKey && item.block.kind !== 'links')
      .sort((a, b) => a[1].range.from - b[1].range.from)
      .map(([key, item]) => ({
        key,
        kind: item.block.kind,
        title: item.block.title,
        depth: Math.max(0, key.split(':').length - 2)
      }))
  }

  function wrapSheetBlock(
    blockKey: string,
    part: CalloutBlock,
    defaultKind: CalloutKind,
    readContent: ReactNode,
    editContent?: ReactNode,
    headerRight?: ReactNode
  ): ReactNode {
    if (!blockEditEnabled || !onBlockEdit || !onBlockDone) {
      return (
        <div id={`sheet-block-${blockKey.replace(/:/g, '-')}`} className="scroll-mt-3">
          {readContent}
        </div>
      )
    }
    const editing = editingBlocks.has(blockKey)
    const keyParts = blockKey.split(':')
    const parentKey = keyParts.length > 2 ? keyParts.slice(0, -1).join(':') : null
    const parentKind = parentKey ? blockIndex?.get(parentKey)?.block.kind : null
    const insertKinds = insertableBlockKindsForParent(parentKind)
    return (
      <SheetBlockShell
        blockKey={blockKey}
        editing={editing}
        disabled={disabled}
        defaultKind={defaultKind}
        insertKinds={insertKinds}
        onEdit={() => onBlockEdit(blockKey)}
        onDone={() => onBlockDone(blockKey)}
        onInsertAbove={onBlockInsert ? (kind) => onBlockInsert(blockKey, 'above', kind) : undefined}
        onInsertBelow={onBlockInsert ? (kind) => onBlockInsert(blockKey, 'below', kind) : undefined}
        onDelete={onBlockDelete ? () => onBlockDelete(blockKey) : undefined}
        headerRight={headerRight}
      >
        {editing
          ? editContent ?? (
              <BlockMarkdownEditor
                title={part.title ?? ''}
                body={part.markdown}
                kindLabel={BLOCK_KIND_LABELS[defaultKind] ?? defaultKind}
                disabled={disabled}
                onChange={({ title, body }) =>
                  onBlockSave?.(
                    blockKey,
                    serializeCalloutBlock({
                      ...part,
                      title: title.trim() || undefined,
                      markdown: body
                    })
                  )
                }
              />
            )
          : readContent}
      </SheetBlockShell>
    )
  }

  function renderMarkdown(
    text: string,
    keyPrefix: string,
    crawlOffset = 0,
    legendOffset = 0,
    galleryOffset = 0,
    videoOffset = 0,
    encounterScope?: string,
    sectionIndex = 0,
    blockPathPrefix: number[] = []
  ) {
    const rawCrawls = splitCalloutBlocks(markdown).filter((block) => block.kind === 'crawl')
    const rawLegends = splitCalloutBlocks(markdown).filter((block) => block.kind === 'legend')
    const rawGalleries = splitCalloutBlocks(markdown).filter((block) => block.kind === 'gallery')
    const rawVideos = splitCalloutBlocks(markdown).filter((block) => block.kind === 'video')
    let crawlLocal = 0
    let legendLocal = 0
    let galleryLocal = 0
    let videoLocal = 0
    let calloutLocal = 0
    return splitCalloutBlocks(text).map((part, i) => {
      const key = `${keyPrefix}-${i}`
      if (part.kind === 'prose') {
        if (!part.markdown.trim()) return null
        return (
          <Markdown key={key} remarkPlugins={[remarkGfm]} urlTransform={markdownUrlTransform} components={markdownComponents}>
            {part.markdown}
          </Markdown>
        )
      }

      const blockPath = [...blockPathPrefix, calloutLocal]
      calloutLocal += 1
      const blockKey = blockKeyFromPath(sectionIndex, blockPath)
      const blockEditing = blockEditEnabled && editingBlocks.has(blockKey)

      if (part.kind === 'readaloud') {
        const read = (
          <ReadAloud title={part.title}>
            <Markdown remarkPlugins={[remarkGfm]} urlTransform={markdownUrlTransform} components={markdownComponents}>
              {part.markdown || ''}
            </Markdown>
          </ReadAloud>
        )
        return (
          <div key={key}>
            {wrapSheetBlock(blockKey, part, 'readaloud', read)}
          </div>
        )
      }
      if (part.kind === 'combat') {
        const heading = part.title?.trim() || 'Combat'
        const sectionId = encounterSectionId(heading, encounterScope)
        const encounter = encounters.find((item) => item.id === sectionId)
        const canAdd = Boolean(encounter && onAddEncounter)
        const initiativeAction = canAdd ? (
          <button
            type="button"
            title="Load these sheets plus every PC in PCs/party. Anyone already listed is skipped. NPCs/monsters at init 0 are rolled."
            onClick={() => onAddEncounterClick(encounter!)}
            className="rounded bg-amber px-2 py-0.5 text-[11px] font-semibold text-on-amber"
          >
            {addingId === encounter!.id ? 'Adding…' : 'Add to initiative'}
          </button>
        ) : null
        const rawCombat = blockIndex?.get(blockKey)?.block ?? part
        const card = (
          <CombatCard
            title={rawCombat.title}
            body={rawCombat.markdown}
            editing={blockEditing}
            disabled={disabled}
            onChange={(fields: CombatFields) => onBlockSave?.(blockKey, serializeCombatCallout(fields))}
            adding={Boolean(encounter && addingId === encounter.id)}
            onAdd={blockEditEnabled ? undefined : canAdd ? () => onAddEncounterClick(encounter!) : undefined}
            missing={missingCombatantTokens(rawCombat.markdown, path, noteIndex)}
            sheetPath={path}
            notes={gearNotes ?? noteIndex}
            system={system}
            onEnsureMonster={onEnsureMonster}
            markdownComponents={markdownComponents}
            urlTransform={markdownUrlTransform}
          />
        )
        return (
          <div key={key}>
            {wrapSheetBlock(blockKey, part, 'combat', card, blockEditing ? card : undefined, initiativeAction)}
          </div>
        )
      }
      if (part.kind === 'party') {
        const read = (
          <PartyCard title={part.title}>
            {part.markdown.trim() && !blockEditing
              ? renderSectionedMarkdown(
                  part.markdown,
                  `${key}-body`,
                  part.title?.trim() || undefined,
                  crawlOffset + crawlLocal,
                  legendOffset + legendLocal,
                  galleryOffset + galleryLocal,
                  videoOffset + videoLocal,
                  sectionIndex,
                  blockPath
                )
              : null}
          </PartyCard>
        )
        return (
          <div key={key}>
            {wrapSheetBlock(blockKey, part, 'party', read)}
          </div>
        )
      }
      if (part.kind === 'scene') {
        const { artSrc, artLabel, body } = splitLeadingSceneArt(part.markdown)
        const resolved = artSrc ? resolveMarkdownImageSrc(artSrc, path, images) : { url: '', path: null }
        const showArt = Boolean(artSrc || artLabel)
        const read = (
          <SceneCard
            title={part.title}
            art={
              showArt ? (
                <SheetArtFrame
                  title={part.title?.trim() || artLabel || 'Scene'}
                  imageSrc={resolved.path ? resolved.url : null}
                  selectValue={resolved.path}
                  selectedImage={selectedImage}
                  images={images}
                  aspect="portrait"
                  onSelectImage={onSelectImage}
                  onSrdError={() => undefined}
                />
              ) : undefined
            }
          >
            {body.trim() && !blockEditing
              ? renderSectionedMarkdown(
                  body,
                  `${key}-body`,
                  part.title?.trim() || undefined,
                  crawlOffset + crawlLocal,
                  legendOffset + legendLocal,
                  galleryOffset + galleryLocal,
                  videoOffset + videoLocal,
                  sectionIndex,
                  blockPath
                )
              : null}
          </SceneCard>
        )
        return (
          <div key={key}>
            {wrapSheetBlock(blockKey, part, 'scene', read)}
          </div>
        )
      }
      if (part.kind === 'crawl') {
        const crawlIndex = crawlOffset + crawlLocal
        crawlLocal += 1
        const raw = rawCrawls[crawlIndex] ?? part
        const logoRef = crawlLogoRef(raw.markdown)
        const logoUrl = logoRef ? resolveMarkdownImageSrc(logoRef, path, images).url : null
        const musicRef = crawlMusicRef(raw.markdown)
        const endImageRef = crawlEndImageRef(raw.markdown)
        const endImageUrl = endImageRef ? resolveMarkdownImageSrc(endImageRef, path, images).url : null
        const crawlBody = crawlPlainText(raw.markdown)
        const crawlTitle = raw.title
        const isActiveCrawl =
          activeCrawl != null &&
          (activeCrawl.title ?? '') === (crawlTitle ?? '') &&
          activeCrawl.body === crawlBody
        const card = (
          <CrawlCard
            title={crawlTitle}
            preface={crawlPreface(raw.markdown)}
            body={crawlBody}
            logoRef={logoRef}
            logoUrl={logoUrl}
            endImageRef={endImageRef}
            endImageUrl={endImageUrl}
            musicRef={musicRef}
            musicTracks={musicTracks}
            images={images}
            canPlay={theme === 'scifi'}
            disabled={disabled}
            editing={blockEditing}
            onChange={(fields) => void persistCrawl(crawlIndex, fields)}
            onPlay={onPlayCrawl ? (fields) => void playCrawlCard(crawlIndex, fields) : undefined}
            onStop={onStopCrawl}
            crawlActive={isActiveCrawl && Boolean(playerCrawl)}
            crawlStopping={isActiveCrawl && playerCrawl?.stoppingAt != null}
            onLoadLogo={() => loadCrawlLogo()}
            onLoadEndImage={() => loadCrawlEndImage()}
            onLoadMusic={() => loadCrawlMusic()}
          />
        )
        return (
          <div key={key}>
            {wrapSheetBlock(blockKey, part, 'crawl', card, blockEditing ? card : undefined)}
          </div>
        )
      }
      if (part.kind === 'legend') {
        const legendIndex = legendOffset + legendLocal
        legendLocal += 1
        const raw = rawLegends[legendIndex] ?? part
        const logoRef = legendLogoRef(raw.markdown)
        const logoUrl = logoRef ? resolveMarkdownImageSrc(logoRef, path, images).url : null
        const musicRef = legendMusicRef(raw.markdown)
        const endImageRef = legendEndImageRef(raw.markdown)
        const endImageUrl = endImageRef ? resolveMarkdownImageSrc(endImageRef, path, images).url : null
        const legendBody = legendPlainText(raw.markdown)
        const legendTitle = raw.title
        const look = legendLook(raw.markdown)
        const isActiveLegend =
          activeLegend != null &&
          (activeLegend.title ?? '') === (legendTitle ?? '') &&
          activeLegend.body === legendBody
        const card = (
          <LegendCard
            title={legendTitle}
            preface={legendPreface(raw.markdown)}
            body={legendBody}
            look={look}
            logoRef={logoRef}
            logoUrl={logoUrl}
            endImageRef={endImageRef}
            endImageUrl={endImageUrl}
            musicRef={musicRef}
            musicTracks={musicTracks}
            images={images}
            canPlay={legendPlayEnabled(theme)}
            disabled={disabled}
            editing={blockEditing}
            onChange={(fields) => void persistLegend(legendIndex, fields)}
            onPlay={onPlayLegend ? (fields) => void playLegendCard(legendIndex, fields) : undefined}
            onStop={onStopLegend}
            legendActive={isActiveLegend && Boolean(playerLegend)}
            legendStopping={isActiveLegend && playerLegend?.stoppingAt != null}
            onLoadLogo={() => loadLegendLogo()}
            onLoadEndImage={() => loadLegendEndImage()}
            onLoadMusic={() => loadLegendMusic()}
          />
        )
        return (
          <div key={key}>
            {wrapSheetBlock(blockKey, part, 'legend', card, blockEditing ? card : undefined)}
          </div>
        )
      }
      if (part.kind === 'gallery') {
        const galleryIndex = galleryOffset + galleryLocal
        galleryLocal += 1
        const raw = rawGalleries[galleryIndex] ?? part
        const refs = galleryImageRefs(raw.markdown)
        const intervalSec = galleryIntervalSec(raw.markdown)
        const urls = refs.map((ref) => resolveMarkdownImageSrc(ref, path, images).url || null)
        const refsKey = refs.join('\n')
        const isActiveGallery =
          activeGallery != null &&
          (activeGallery.title ?? '') === (raw.title ?? '') &&
          activeGallery.imageRefs.join('\n') === refsKey
        const card = (
          <GalleryCard
            title={raw.title}
            intervalSec={intervalSec}
            loop={galleryLoops(raw.markdown)}
            showTitle={galleryShowTitle(raw.markdown)}
            imageRefs={refs}
            images={images}
            imageUrls={urls}
            disabled={disabled}
            editing={blockEditing}
            onChange={(fields) => void persistGallery(galleryIndex, fields)}
            onPlay={onPlayGallery ? (fields) => void playGalleryCard(galleryIndex, fields) : undefined}
            onStop={onStopGallery}
            onPrev={onGalleryPrev}
            onNext={onGalleryNext}
            galleryActive={isActiveGallery && Boolean(playerGallery)}
            slideIndex={isActiveGallery ? playerGallery?.index : undefined}
            slideCount={isActiveGallery ? playerGallery?.slides.length : undefined}
          />
        )
        return (
          <div key={key}>
            {wrapSheetBlock(blockKey, part, 'gallery', card, blockEditing ? card : undefined)}
          </div>
        )
      }
      if (part.kind === 'video') {
        const videoIndex = videoOffset + videoLocal
        videoLocal += 1
        const raw = rawVideos[videoIndex] ?? part
        const fields = parseVideoFields(raw.title, raw.markdown)
        const isActiveVideo =
          activeVideo != null &&
          (activeVideo.title ?? '') === (fields.title ?? '') &&
          activeVideo.videoRef === (fields.videoRef ?? '')
        const card = (
          <VideoCard
            title={fields.title}
            videoRef={fields.videoRef}
            muted={fields.muted}
            videos={videos ?? []}
            disabled={disabled}
            editing={blockEditing}
            onChange={(next) => void persistVideo(videoIndex, next)}
            onPlay={onPlayVideo ? (next) => void playVideoCard(videoIndex, next) : undefined}
            onStop={onStopVideo}
            videoActive={isActiveVideo && Boolean(playerVideo)}
            onLoadVideo={() => loadVideoFile()}
          />
        )
        return (
          <div key={key}>
            {wrapSheetBlock(blockKey, part, 'video', card, blockEditing ? card : undefined)}
          </div>
        )
      }
      if (part.kind === 'gmonly') {
        if (/^what this page does$/i.test(part.title ?? '')) return null
        const read = (
          <GmOnly title={part.title}>
            <Markdown remarkPlugins={[remarkGfm]} urlTransform={markdownUrlTransform} components={markdownComponents}>
              {part.markdown || ''}
            </Markdown>
          </GmOnly>
        )
        return (
          <div key={key}>
            {wrapSheetBlock(blockKey, part, 'gmonly', read)}
          </div>
        )
      }
      if (part.kind === 'treasure') {
        const rawTreasure = blockIndex?.get(blockKey)?.block ?? part
        const card = (
          <TreasureCard
            title={rawTreasure.title}
            body={rawTreasure.markdown}
            currencies={currencies}
            editing={blockEditing}
            disabled={disabled}
            onChange={(fields: TreasureFields) =>
              onBlockSave?.(blockKey, serializeTreasureCallout(fields, currencies))
            }
            markdownComponents={markdownComponents}
            urlTransform={markdownUrlTransform}
            system={system}
            sheetPath={path}
            gearNotes={gearNotes ?? noteIndex}
            onEnsureGear={onEnsureGear}
          />
        )
        return (
          <div key={key}>
            {wrapSheetBlock(blockKey, part, 'treasure', card, blockEditing ? card : undefined)}
          </div>
        )
      }
      if (part.kind === 'links') {
        const read = <LinksCard title={part.title} entries={blockNavEntries(blockKey)} />
        const edit = (
          <div className="space-y-2">
            <LinksCard title={part.title} entries={blockNavEntries(blockKey)} />
            <p className="pl-2 text-[11px] text-muted">
              Links update automatically from every other block on this sheet.
            </p>
            <BlockMarkdownEditor
              title={part.title ?? ''}
              body=""
              kindLabel="Links"
              titleOnly
              disabled={disabled}
              onChange={({ title }) =>
                onBlockSave?.(
                  blockKey,
                  serializeCalloutBlock({
                    ...part,
                    title: title.trim() || undefined,
                    markdown: ''
                  })
                )
              }
            />
          </div>
        )
        return (
          <div key={key}>
            {wrapSheetBlock(blockKey, part, 'links', read, edit)}
          </div>
        )
      }
      const read = (
        <CalloutCard type={part.kind === 'other' ? (part.type ?? 'note') : part.kind} title={part.title}>
          {part.markdown.trim() ? (
            <Markdown remarkPlugins={[remarkGfm]} urlTransform={markdownUrlTransform} components={markdownComponents}>
              {part.markdown}
            </Markdown>
          ) : null}
        </CalloutCard>
      )
      return (
        <div key={key}>
          {wrapSheetBlock(blockKey, part, sheetBlockKind(part.kind), read)}
        </div>
      )
    })
  }

  function renderSectionedMarkdown(
    text: string,
    keyPrefix: string,
    encounterScope?: string,
    crawlOffset = 0,
    legendOffset = 0,
    galleryOffset = 0,
    videoOffset = 0,
    sectionIndex = 0,
    blockPathPrefix: number[] = []
  ) {
    const docSections = splitMarkdownSections(text)
    if (docSections.length === 0) {
      return renderMarkdown(
        text || '_This file is empty._',
        keyPrefix,
        crawlOffset,
        legendOffset,
        galleryOffset,
        videoOffset,
        encounterScope,
        sectionIndex,
        blockPathPrefix
      )
    }
    let crawlsBefore = 0
    let legendsBefore = 0
    let galleriesBefore = 0
    let videosBefore = 0
    return docSections.map((section, index) => {
      const sectionId = encounterScope
        ? encounterSectionId(section.heading, encounterScope)
        : section.id
      const encounter = encounters.find((item) => item.id === sectionId)
      const boxed = Boolean(encounter) || isCombatHeading(section.heading)
      const key = `${keyPrefix}-${section.id || index}`
      const parts = splitCalloutBlocks(section.markdown)
      const sectionCrawls = parts.filter((block) => block.kind === 'crawl').length
      const sectionLegends = parts.filter((block) => block.kind === 'legend').length
      const sectionGalleries = parts.filter((block) => block.kind === 'gallery').length
      const sectionVideos = parts.filter((block) => block.kind === 'video').length
      const crawlOff = crawlOffset + crawlsBefore
      const legendOff = legendOffset + legendsBefore
      const galleryOff = galleryOffset + galleriesBefore
      const videoOff = videoOffset + videosBefore
      crawlsBefore += sectionCrawls
      legendsBefore += sectionLegends
      galleriesBefore += sectionGalleries
      videosBefore += sectionVideos
      if (!boxed) {
        return (
          <div key={key} className="markdown-body">
            {renderMarkdown(
              section.markdown || '_This file is empty._',
              key,
              crawlOff,
              legendOff,
              galleryOff,
              videoOff,
              encounterScope,
              sectionIndex,
              blockPathPrefix
            )}
          </div>
        )
      }
      const { card, rest } = splitCombatCardContent(section.markdown)
      const cardParts = splitCalloutBlocks(card)
      const cardCrawls = cardParts.filter((block) => block.kind === 'crawl').length
      const cardLegends = cardParts.filter((block) => block.kind === 'legend').length
      const cardGalleries = cardParts.filter((block) => block.kind === 'gallery').length
      const cardVideos = cardParts.filter((block) => block.kind === 'video').length
      return (
        <div key={key}>
          <CombatCard
            title={section.heading}
            adding={Boolean(encounter && addingId === encounter.id)}
            onAdd={encounter && onAddEncounter ? () => onAddEncounterClick(encounter) : undefined}
            missing={missingCombatantTokens(section.markdown, path, noteIndex)}
          >
            {renderMarkdown(
              card.replace(/^#{1,2}\s+[^\n]+\n?/, ''),
              `${key}-card`,
              crawlOff,
              legendOff,
              galleryOff,
              videoOff,
              encounterScope,
              sectionIndex,
              blockPathPrefix
            )}
          </CombatCard>
          {rest.trim() ? (
            <div className="markdown-body">
              {renderMarkdown(
                rest,
                `${key}-rest`,
                crawlOff + cardCrawls,
                legendOff + cardLegends,
                galleryOff + cardGalleries,
                videoOff + cardVideos,
                encounterScope,
                sectionIndex,
                blockPathPrefix
              )}
            </div>
          ) : null}
        </div>
      )
    })
  }

  function renderDocument(text: string, keyPrefix: string) {
    const docSections = splitMarkdownSections(text)
    if (docSections.length === 0) {
      return <div className="markdown-body">{renderMarkdown(text || '_This file is empty._', keyPrefix)}</div>
    }
    let crawlsBefore = 0
    let legendsBefore = 0
    let galleriesBefore = 0
    let videosBefore = 0
    return docSections.map((section, index) => {
      const encounter = encounters.find((item) => item.id === section.id)
      const boxed = Boolean(encounter) || isCombatHeading(section.heading)
      const key = `${keyPrefix}-${section.id || index}`
      const parts = splitCalloutBlocks(section.markdown)
      const sectionCrawls = parts.filter((block) => block.kind === 'crawl').length
      const sectionLegends = parts.filter((block) => block.kind === 'legend').length
      const sectionGalleries = parts.filter((block) => block.kind === 'gallery').length
      const sectionVideos = parts.filter((block) => block.kind === 'video').length
      const crawlOff = crawlsBefore
      const legendOff = legendsBefore
      const galleryOff = galleriesBefore
      const videoOff = videosBefore
      crawlsBefore += sectionCrawls
      legendsBefore += sectionLegends
      galleriesBefore += sectionGalleries
      videosBefore += sectionVideos
      if (!boxed) {
        return (
          <div key={key} className="markdown-body">
            {renderMarkdown(
              section.markdown || '_This file is empty._',
              key,
              crawlOff,
              legendOff,
              galleryOff,
              videoOff,
              undefined,
              index
            )}
          </div>
        )
      }
      const { card, rest } = splitCombatCardContent(section.markdown)
      const cardParts = splitCalloutBlocks(card)
      const cardCrawls = cardParts.filter((block) => block.kind === 'crawl').length
      const cardLegends = cardParts.filter((block) => block.kind === 'legend').length
      const cardGalleries = cardParts.filter((block) => block.kind === 'gallery').length
      const cardVideos = cardParts.filter((block) => block.kind === 'video').length
      return (
        <div key={key}>
          <CombatCard
            title={section.heading}
            adding={Boolean(encounter && addingId === encounter.id)}
            onAdd={encounter && onAddEncounter ? () => onAddEncounterClick(encounter) : undefined}
            missing={missingCombatantTokens(section.markdown, path, noteIndex)}
          >
            {renderMarkdown(
              card.replace(/^#{1,2}\s+[^\n]+\n?/, ''),
              `${key}-card`,
              crawlOff,
              legendOff,
              galleryOff,
              videoOff,
              undefined,
              index
            )}
          </CombatCard>
          {rest.trim() ? (
            <div className="markdown-body">
              {renderMarkdown(
                rest,
                `${key}-rest`,
                crawlOff + cardCrawls,
                legendOff + cardLegends,
                galleryOff + cardGalleries,
                videoOff + cardVideos,
                undefined,
                index
              )}
            </div>
          ) : null}
        </div>
      )
    })
  }

  return { renderMarkdown, renderSectionedMarkdown, renderDocument }
}
