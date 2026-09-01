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
import type { CrawlCalloutFields } from '../../../shared/openingCrawl'
import type { LegendCalloutFields } from '../../../shared/openingLegend'
import type { GalleryCalloutFields } from '../../../shared/playerGallery'
import type { VideoCalloutFields } from '../../../shared/playerVideo'
import type { ThemeId } from '../../../shared/theme'
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
  splitCalloutBlocks,
  isCombatHeading,
  type CampaignNote,
  type NightEncounter
} from '../lib/notes'
import CalloutCard from './CalloutCard'
import NoteWikiLink from './NoteWikiLink'
import PartyCard from './PartyCard'
import SceneCard from './SceneCard'
import SheetArtFrame from './SheetArtFrame'
import SheetBlockShell, { BLOCK_KIND_LABELS } from './SheetBlockShell'
import BlockMarkdownEditor from './BlockMarkdownEditor'
import LinksCard, { type BlockNavEntry } from './LinksCard'
import { renderBoxedCombatSection, renderCombatCalloutBlock } from './sessionNoteCombat'
import {
  renderCrawlBlock as renderCrawlCalloutBlock,
  renderGalleryBlock as renderGalleryCalloutBlock,
  renderLegendBlock as renderLegendCalloutBlock,
  renderVideoBlock as renderVideoCalloutBlock
} from './sessionNoteOpening'
import {
  renderGmOnlyBlock as renderGmOnlyCalloutBlock,
  renderReadAloudBlock as renderReadAloudCalloutBlock,
  renderTreasureBlock as renderTreasureCalloutBlock
} from './sessionNoteCards'

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

  function renderReadAloudBlock(part: CalloutBlock, key: string, blockKey: string): ReactNode {
    return renderReadAloudCalloutBlock({
      part,
      key,
      blockKey,
      wrapSheetBlock,
      markdownComponents
    })
  }

  function renderCombatBlock(
    part: CalloutBlock,
    key: string,
    blockKey: string,
    blockEditing: boolean,
    encounterScope?: string
  ): ReactNode {
    return renderCombatCalloutBlock({
      part,
      key,
      blockKey,
      blockEditing,
      encounterScope,
      encounters,
      addingId,
      onAddEncounter,
      onAddEncounterClick,
      blockIndex,
      disabled,
      onBlockSave,
      path,
      noteIndex,
      gearNotes,
      system,
      onEnsureMonster,
      markdownComponents,
      wrapSheetBlock,
      blockEditEnabled,
      encounterSectionId
    })
  }

  function renderPartyBlock(
    part: CalloutBlock,
    key: string,
    blockKey: string,
    blockEditing: boolean,
    crawlBase: number,
    legendBase: number,
    galleryBase: number,
    videoBase: number,
    sectionIndex: number,
    blockPath: number[]
  ): ReactNode {
    const read = (
      <PartyCard title={part.title}>
        {part.markdown.trim() && !blockEditing
          ? renderSectionedMarkdown(
              part.markdown,
              `${key}-body`,
              part.title?.trim() || undefined,
              crawlBase,
              legendBase,
              galleryBase,
              videoBase,
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

  function renderSceneBlock(
    part: CalloutBlock,
    key: string,
    blockKey: string,
    blockEditing: boolean,
    crawlBase: number,
    legendBase: number,
    galleryBase: number,
    videoBase: number,
    sectionIndex: number,
    blockPath: number[]
  ): ReactNode {
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
              crawlBase,
              legendBase,
              galleryBase,
              videoBase,
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

  function renderCrawlBlock(
    part: CalloutBlock,
    raw: CalloutBlock,
    key: string,
    blockKey: string,
    blockEditing: boolean,
    crawlIndex: number
  ): ReactNode {
    return renderCrawlCalloutBlock({
      part,
      raw,
      key,
      blockKey,
      blockEditing,
      crawlIndex,
      wrapSheetBlock,
      path,
      images,
      theme,
      disabled,
      musicTracks,
      activeCrawl,
      playerCrawl,
      onStopCrawl,
      onPlayCrawl,
      persistCrawl,
      playCrawlCard,
      loadCrawlLogo,
      loadCrawlEndImage,
      loadCrawlMusic
    })
  }

  function renderLegendBlock(
    part: CalloutBlock,
    raw: CalloutBlock,
    key: string,
    blockKey: string,
    blockEditing: boolean,
    legendIndex: number
  ): ReactNode {
    return renderLegendCalloutBlock({
      part,
      raw,
      key,
      blockKey,
      blockEditing,
      legendIndex,
      wrapSheetBlock,
      path,
      images,
      theme,
      disabled,
      musicTracks,
      activeLegend,
      playerLegend,
      onStopLegend,
      onPlayLegend,
      persistLegend,
      playLegendCard,
      loadLegendLogo,
      loadLegendEndImage,
      loadLegendMusic
    })
  }

  function renderGalleryBlock(
    part: CalloutBlock,
    raw: CalloutBlock,
    key: string,
    blockKey: string,
    blockEditing: boolean,
    galleryIndex: number
  ): ReactNode {
    return renderGalleryCalloutBlock({
      part,
      raw,
      key,
      blockKey,
      blockEditing,
      galleryIndex,
      wrapSheetBlock,
      path,
      images,
      disabled,
      activeGallery,
      playerGallery,
      onStopGallery,
      onGalleryPrev,
      onGalleryNext,
      onPlayGallery,
      persistGallery,
      playGalleryCard
    })
  }

  function renderVideoBlock(
    part: CalloutBlock,
    raw: CalloutBlock,
    key: string,
    blockKey: string,
    blockEditing: boolean,
    videoIndex: number
  ): ReactNode {
    return renderVideoCalloutBlock({
      part,
      raw,
      key,
      blockKey,
      blockEditing,
      videoIndex,
      wrapSheetBlock,
      disabled,
      videos,
      activeVideo,
      playerVideo,
      onStopVideo,
      onPlayVideo,
      persistVideo,
      playVideoCard,
      loadVideoFile
    })
  }

  function renderGmOnlyBlock(part: CalloutBlock, key: string, blockKey: string): ReactNode {
    return renderGmOnlyCalloutBlock({
      part,
      key,
      blockKey,
      wrapSheetBlock,
      markdownComponents
    })
  }

  function renderTreasureBlock(
    part: CalloutBlock,
    key: string,
    blockKey: string,
    blockEditing: boolean
  ): ReactNode {
    return renderTreasureCalloutBlock({
      part,
      key,
      blockKey,
      blockEditing,
      wrapSheetBlock,
      blockIndex,
      disabled,
      onBlockSave,
      currencies,
      markdownComponents,
      system,
      path,
      noteIndex,
      gearNotes,
      onEnsureGear
    })
  }

  function renderLinksBlock(part: CalloutBlock, key: string, blockKey: string): ReactNode {
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

  function renderGenericCalloutBlock(part: CalloutBlock, key: string, blockKey: string): ReactNode {
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
        return renderReadAloudBlock(part, key, blockKey)
      }
      if (part.kind === 'combat') {
        return renderCombatBlock(part, key, blockKey, blockEditing, encounterScope)
      }
      if (part.kind === 'party') {
        return renderPartyBlock(
          part,
          key,
          blockKey,
          blockEditing,
          crawlOffset + crawlLocal,
          legendOffset + legendLocal,
          galleryOffset + galleryLocal,
          videoOffset + videoLocal,
          sectionIndex,
          blockPath
        )
      }
      if (part.kind === 'scene') {
        return renderSceneBlock(
          part,
          key,
          blockKey,
          blockEditing,
          crawlOffset + crawlLocal,
          legendOffset + legendLocal,
          galleryOffset + galleryLocal,
          videoOffset + videoLocal,
          sectionIndex,
          blockPath
        )
      }
      if (part.kind === 'crawl') {
        const crawlIndex = crawlOffset + crawlLocal
        crawlLocal += 1
        return renderCrawlBlock(part, rawCrawls[crawlIndex] ?? part, key, blockKey, blockEditing, crawlIndex)
      }
      if (part.kind === 'legend') {
        const legendIndex = legendOffset + legendLocal
        legendLocal += 1
        return renderLegendBlock(part, rawLegends[legendIndex] ?? part, key, blockKey, blockEditing, legendIndex)
      }
      if (part.kind === 'gallery') {
        const galleryIndex = galleryOffset + galleryLocal
        galleryLocal += 1
        return renderGalleryBlock(part, rawGalleries[galleryIndex] ?? part, key, blockKey, blockEditing, galleryIndex)
      }
      if (part.kind === 'video') {
        const videoIndex = videoOffset + videoLocal
        videoLocal += 1
        return renderVideoBlock(part, rawVideos[videoIndex] ?? part, key, blockKey, blockEditing, videoIndex)
      }
      if (part.kind === 'gmonly') {
        return renderGmOnlyBlock(part, key, blockKey)
      }
      if (part.kind === 'treasure') {
        return renderTreasureBlock(part, key, blockKey, blockEditing)
      }
      if (part.kind === 'links') {
        return renderLinksBlock(part, key, blockKey)
      }
      return renderGenericCalloutBlock(part, key, blockKey)
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
      return renderBoxedCombatSection({
        key,
        heading: section.heading,
        markdown: section.markdown,
        encounter,
        addingId,
        onAddEncounter,
        onAddEncounterClick,
        path,
        noteIndex,
        crawlOff,
        legendOff,
        galleryOff,
        videoOff,
        encounterScope,
        sectionIndex,
        blockPathPrefix,
        renderMarkdown
      })
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
      return renderBoxedCombatSection({
        key,
        heading: section.heading,
        markdown: section.markdown,
        encounter,
        addingId,
        onAddEncounter,
        onAddEncounterClick,
        path,
        noteIndex,
        crawlOff,
        legendOff,
        galleryOff,
        videoOff,
        sectionIndex: index,
        renderMarkdown
      })
    })
  }

  return { renderMarkdown, renderSectionedMarkdown, renderDocument }
}
