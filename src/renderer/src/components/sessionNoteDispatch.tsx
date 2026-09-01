import { type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { blockKeyFromPath } from '../../../shared/blockIndex'
import { markdownUrlTransform } from '../lib/images'
import {
  encounterSectionId,
  isCombatHeading,
  splitCalloutBlocks,
  splitMarkdownSections
} from '../lib/notes'
import {
  renderGmOnlyBlock,
  renderPartyBlock,
  renderReadAloudBlock,
  renderSceneBlock,
  renderTreasureBlock
} from './sessionNoteCards'
import { renderBoxedCombatSection, renderCombatCalloutBlock, type RenderNoteMarkdown } from './sessionNoteCombat'
import {
  renderCrawlBlock,
  renderGalleryBlock,
  renderLegendBlock,
  renderVideoBlock
} from './sessionNoteOpening'
import {
  renderGenericCalloutBlock,
  renderLinksBlock,
  type MarkdownComponents,
  type WrapSheetBlock
} from './sessionNoteShell'
import type { SessionNoteMarkdownDeps } from './sessionNoteTypes'

export type SessionNoteRenderers = {
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
}

export function createSessionNoteRenderers(
  deps: SessionNoteMarkdownDeps & {
    wrapSheetBlock: WrapSheetBlock
    markdownComponents: MarkdownComponents
  }
): SessionNoteRenderers {
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
    onSelectImage,
    onOpenNote,
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
    onBlockSave,
    currencies,
    system,
    onEnsureGear,
    onEnsureMonster,
    gearNotes,
    wrapSheetBlock,
    markdownComponents
  } = deps

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
  ): ReactNode {
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
        return renderReadAloudBlock({ part, key, blockKey, wrapSheetBlock, markdownComponents })
      }
      if (part.kind === 'combat') {
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
      if (part.kind === 'party') {
        return renderPartyBlock({
          part,
          key,
          blockKey,
          blockEditing,
          wrapSheetBlock,
          crawlBase: crawlOffset + crawlLocal,
          legendBase: legendOffset + legendLocal,
          galleryBase: galleryOffset + galleryLocal,
          videoBase: videoOffset + videoLocal,
          sectionIndex,
          blockPath,
          renderSectionedMarkdown,
          path,
          images,
          noteIndex,
          onOpenNote,
          disabled,
          onBlockSave,
          blockIndex
        })
      }
      if (part.kind === 'scene') {
        return renderSceneBlock({
          part,
          key,
          blockKey,
          blockEditing,
          wrapSheetBlock,
          path,
          images,
          selectedImage,
          onSelectImage,
          crawlBase: crawlOffset + crawlLocal,
          legendBase: legendOffset + legendLocal,
          galleryBase: galleryOffset + galleryLocal,
          videoBase: videoOffset + videoLocal,
          sectionIndex,
          blockPath,
          renderSectionedMarkdown
        })
      }
      if (part.kind === 'crawl') {
        const crawlIndex = crawlOffset + crawlLocal
        crawlLocal += 1
        return renderCrawlBlock({
          part,
          raw: rawCrawls[crawlIndex] ?? part,
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
      if (part.kind === 'legend') {
        const legendIndex = legendOffset + legendLocal
        legendLocal += 1
        return renderLegendBlock({
          part,
          raw: rawLegends[legendIndex] ?? part,
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
      if (part.kind === 'gallery') {
        const galleryIndex = galleryOffset + galleryLocal
        galleryLocal += 1
        return renderGalleryBlock({
          part,
          raw: rawGalleries[galleryIndex] ?? part,
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
      if (part.kind === 'video') {
        const videoIndex = videoOffset + videoLocal
        videoLocal += 1
        return renderVideoBlock({
          part,
          raw: rawVideos[videoIndex] ?? part,
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
      if (part.kind === 'gmonly') {
        return renderGmOnlyBlock({ part, key, blockKey, wrapSheetBlock, markdownComponents })
      }
      if (part.kind === 'treasure') {
        return renderTreasureBlock({
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
      if (part.kind === 'links') {
        return renderLinksBlock({
          part,
          key,
          blockKey,
          wrapSheetBlock,
          blockIndex,
          disabled,
          onBlockSave
        })
      }
      return renderGenericCalloutBlock({ part, key, blockKey, wrapSheetBlock, markdownComponents })
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
  ): ReactNode {
    return renderNoteSections({
      text,
      keyPrefix,
      encounterScope,
      crawlOffset,
      legendOffset,
      galleryOffset,
      videoOffset,
      sectionIndexAt: () => sectionIndex,
      blockPathPrefix,
      wrapEmpty: false,
      renderMarkdown,
      encounters,
      addingId,
      onAddEncounter,
      onAddEncounterClick,
      path,
      noteIndex
    })
  }

  function renderDocument(text: string, keyPrefix: string): ReactNode {
    return renderNoteSections({
      text,
      keyPrefix,
      crawlOffset: 0,
      legendOffset: 0,
      galleryOffset: 0,
      videoOffset: 0,
      sectionIndexAt: (index) => index,
      blockPathPrefix: [],
      wrapEmpty: true,
      renderMarkdown,
      encounters,
      addingId,
      onAddEncounter,
      onAddEncounterClick,
      path,
      noteIndex
    })
  }

  return { renderMarkdown, renderSectionedMarkdown, renderDocument }
}

function renderNoteSections(opts: {
  text: string
  keyPrefix: string
  encounterScope?: string
  crawlOffset: number
  legendOffset: number
  galleryOffset: number
  videoOffset: number
  sectionIndexAt: (index: number) => number
  blockPathPrefix: number[]
  wrapEmpty: boolean
  renderMarkdown: RenderNoteMarkdown
  encounters: SessionNoteMarkdownDeps['encounters']
  addingId: string | null
  onAddEncounter: unknown
  onAddEncounterClick: SessionNoteMarkdownDeps['onAddEncounterClick']
  path: string
  noteIndex: SessionNoteMarkdownDeps['noteIndex']
}): ReactNode {
  const docSections = splitMarkdownSections(opts.text)
  if (docSections.length === 0) {
    const body = opts.renderMarkdown(
      opts.text || '_This file is empty._',
      opts.keyPrefix,
      opts.crawlOffset,
      opts.legendOffset,
      opts.galleryOffset,
      opts.videoOffset,
      opts.encounterScope,
      opts.sectionIndexAt(0),
      opts.blockPathPrefix
    )
    return opts.wrapEmpty ? <div className="markdown-body">{body}</div> : body
  }
  let crawlsBefore = 0
  let legendsBefore = 0
  let galleriesBefore = 0
  let videosBefore = 0
  return docSections.map((section, index) => {
    const sectionId = opts.encounterScope
      ? encounterSectionId(section.heading, opts.encounterScope)
      : section.id
    const encounter = opts.encounters.find((item) => item.id === sectionId)
    const boxed = Boolean(encounter) || isCombatHeading(section.heading)
    const key = `${opts.keyPrefix}-${section.id || index}`
    const parts = splitCalloutBlocks(section.markdown)
    const sectionCrawls = parts.filter((block) => block.kind === 'crawl').length
    const sectionLegends = parts.filter((block) => block.kind === 'legend').length
    const sectionGalleries = parts.filter((block) => block.kind === 'gallery').length
    const sectionVideos = parts.filter((block) => block.kind === 'video').length
    const crawlOff = opts.crawlOffset + crawlsBefore
    const legendOff = opts.legendOffset + legendsBefore
    const galleryOff = opts.galleryOffset + galleriesBefore
    const videoOff = opts.videoOffset + videosBefore
    crawlsBefore += sectionCrawls
    legendsBefore += sectionLegends
    galleriesBefore += sectionGalleries
    videosBefore += sectionVideos
    const sectionIndex = opts.sectionIndexAt(index)
    if (!boxed) {
      return (
        <div key={key} className="markdown-body">
          {opts.renderMarkdown(
            section.markdown || '_This file is empty._',
            key,
            crawlOff,
            legendOff,
            galleryOff,
            videoOff,
            opts.encounterScope,
            sectionIndex,
            opts.blockPathPrefix
          )}
        </div>
      )
    }
    return renderBoxedCombatSection({
      key,
      heading: section.heading,
      markdown: section.markdown,
      encounter,
      addingId: opts.addingId,
      onAddEncounter: opts.onAddEncounter,
      onAddEncounterClick: opts.onAddEncounterClick,
      path: opts.path,
      noteIndex: opts.noteIndex,
      crawlOff,
      legendOff,
      galleryOff,
      videoOff,
      encounterScope: opts.encounterScope,
      sectionIndex,
      blockPathPrefix: opts.blockPathPrefix,
      renderMarkdown: opts.renderMarkdown
    })
  })
}
