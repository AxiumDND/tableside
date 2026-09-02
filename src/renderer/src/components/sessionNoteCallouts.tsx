import type { ReactNode } from 'react'
import type { CalloutBlock } from '../../../shared/callouts'
import { encounterSectionId } from '../lib/notes'
import {
  renderGmOnlyBlock,
  renderPartyBlock,
  renderReadAloudBlock,
  renderSceneBlock,
  renderTreasureBlock,
  type RenderSectionedMarkdown
} from './sessionNoteCards'
import { renderCombatCalloutBlock } from './sessionNoteCombat'
import {
  renderCrawlBlock,
  renderGalleryBlock,
  renderLegendBlock,
  renderHyperspaceBlock,
  renderPhoneBlock,
  renderVideoBlock
} from './sessionNoteOpening'
import {
  renderGenericCalloutBlock,
  renderLinksBlock,
  type MarkdownComponents,
  type WrapSheetBlock
} from './sessionNoteShell'
import type { SessionNoteMarkdownDeps } from './sessionNoteTypes'

export type SessionNoteRendererDeps = SessionNoteMarkdownDeps & {
  wrapSheetBlock: WrapSheetBlock
  markdownComponents: MarkdownComponents
}

export type MediaCounters = {
  crawl: number
  legend: number
  gallery: number
  video: number
  phone: number
  hyper: number
}

export function emptyMediaCounters(): MediaCounters {
  return { crawl: 0, legend: 0, gallery: 0, video: 0, phone: 0, hyper: 0 }
}

/** Route one fenced callout to its card renderer. Mutates `counters` for media indices. */
export function renderCalloutPart(
  deps: SessionNoteRendererDeps,
  args: {
    part: CalloutBlock
    key: string
    blockKey: string
    blockEditing: boolean
    counters: MediaCounters
    offsets: MediaCounters
    rawCrawls: CalloutBlock[]
    rawLegends: CalloutBlock[]
    rawGalleries: CalloutBlock[]
    rawVideos: CalloutBlock[]
    rawPhones: CalloutBlock[]
    rawHypers: CalloutBlock[]
    encounterScope?: string
    sectionIndex: number
    blockPath: number[]
    renderSectionedMarkdown: RenderSectionedMarkdown
  }
): ReactNode {
  const {
    wrapSheetBlock,
    markdownComponents,
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
    blockEditEnabled = false,
    images,
    onOpenNote,
    selectedImage,
    onSelectImage,
    theme,
    musicTracks,
    videos,
    currencies,
    onEnsureGear,
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
    activePhone,
    playerPhone,
    onStopPhone,
    onAnswerPhone,
    onPlayPhone,
    persistPhone,
    playPhoneCard,
    loadPhoneRing,
    activeHyperspace,
    playerHyperspace,
    onStopHyperspace,
    onArriveHyperspace,
    onPlayHyperspace,
    persistHyperspace,
    playHyperspaceCard,
    loadHyperspaceShip,
    loadHyperspacePlanet,
    loadHyperspaceSound
  } = deps
  const {
    part,
    key,
    blockKey,
    blockEditing,
    counters,
    offsets,
    rawCrawls,
    rawLegends,
    rawGalleries,
    rawVideos,
    rawPhones,
    rawHypers,
    encounterScope,
    sectionIndex,
    blockPath,
    renderSectionedMarkdown
  } = args

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
      crawlBase: offsets.crawl + counters.crawl,
      legendBase: offsets.legend + counters.legend,
      galleryBase: offsets.gallery + counters.gallery,
      videoBase: offsets.video + counters.video,
      phoneBase: offsets.phone + counters.phone,
      hyperBase: offsets.hyper + counters.hyper,
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
      crawlBase: offsets.crawl + counters.crawl,
      legendBase: offsets.legend + counters.legend,
      galleryBase: offsets.gallery + counters.gallery,
      videoBase: offsets.video + counters.video,
      phoneBase: offsets.phone + counters.phone,
      hyperBase: offsets.hyper + counters.hyper,
      sectionIndex,
      blockPath,
      renderSectionedMarkdown
    })
  }
  if (part.kind === 'crawl') {
    const crawlIndex = offsets.crawl + counters.crawl
    counters.crawl += 1
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
    const legendIndex = offsets.legend + counters.legend
    counters.legend += 1
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
    const galleryIndex = offsets.gallery + counters.gallery
    counters.gallery += 1
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
    const videoIndex = offsets.video + counters.video
    counters.video += 1
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
  if (part.kind === 'phone') {
    const phoneIndex = offsets.phone + counters.phone
    counters.phone += 1
    return renderPhoneBlock({
      part,
      raw: rawPhones[phoneIndex] ?? part,
      key,
      blockKey,
      blockEditing,
      phoneIndex,
      wrapSheetBlock,
      path,
      images,
      notes: noteIndex,
      disabled,
      activePhone,
      playerPhone,
      onStopPhone,
      onAnswerPhone,
      onPlayPhone,
      persistPhone,
      playPhoneCard,
      loadPhoneRing
    })
  }
  if (part.kind === 'hyperspace') {
    const hyperIndex = offsets.hyper + counters.hyper
    counters.hyper += 1
    return renderHyperspaceBlock({
      part,
      raw: rawHypers[hyperIndex] ?? part,
      key,
      blockKey,
      blockEditing,
      hyperIndex,
      wrapSheetBlock,
      path,
      images,
      disabled,
      activeHyperspace,
      playerHyperspace,
      onStopHyperspace,
      onArriveHyperspace,
      onPlayHyperspace,
      persistHyperspace,
      playHyperspaceCard,
      loadHyperspaceShip,
      loadHyperspacePlanet,
      loadHyperspaceSound
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
}
