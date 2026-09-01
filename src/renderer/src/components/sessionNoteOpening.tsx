import { type ReactNode } from 'react'
import type { CalloutBlock } from '../../../shared/callouts'
import {
  crawlEndImageRef,
  crawlLogoRef,
  crawlMusicRef,
  crawlPlainText,
  crawlPreface,
  type CrawlCalloutFields
} from '../../../shared/openingCrawl'
import {
  legendEndImageRef,
  legendLogoRef,
  legendLook,
  legendMusicRef,
  legendPlainText,
  legendPreface,
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
import { resolveMarkdownImageSrc, type CampaignImage, type CampaignVideo } from '../lib/images'
import type { WrapSheetBlock } from './sessionNoteCombat'
import CrawlCard from './CrawlCard'
import LegendCard from './LegendCard'
import GalleryCard from './GalleryCard'
import VideoCard from './VideoCard'

function wrapOpeningCard(
  wrapSheetBlock: WrapSheetBlock,
  blockKey: string,
  part: CalloutBlock,
  kind: 'crawl' | 'legend' | 'gallery' | 'video',
  key: string,
  blockEditing: boolean,
  card: ReactNode
): ReactNode {
  return (
    <div key={key}>
      {wrapSheetBlock(blockKey, part, kind, card, blockEditing ? card : undefined)}
    </div>
  )
}

/** Fenced `[!crawl]` — Opening crawl card on the DM sheet. */
export function renderCrawlBlock(opts: {
  part: CalloutBlock
  raw: CalloutBlock
  key: string
  blockKey: string
  blockEditing: boolean
  crawlIndex: number
  wrapSheetBlock: WrapSheetBlock
  path: string
  images: CampaignImage[]
  theme?: ThemeId
  disabled?: boolean
  musicTracks?: AudioTrack[]
  activeCrawl?: { title?: string; body: string } | null
  playerCrawl?: PlayerCrawl | null
  onStopCrawl?: () => void
  onPlayCrawl?: unknown
  persistCrawl: (index: number, fields: CrawlCalloutFields) => void | Promise<void>
  playCrawlCard: (index: number, fields: CrawlCalloutFields) => void | Promise<void>
  loadCrawlLogo: () => Promise<string | null>
  loadCrawlEndImage: () => Promise<string | null>
  loadCrawlMusic: () => Promise<string | null>
}): ReactNode {
  const logoRef = crawlLogoRef(opts.raw.markdown)
  const logoUrl = logoRef ? resolveMarkdownImageSrc(logoRef, opts.path, opts.images).url : null
  const musicRef = crawlMusicRef(opts.raw.markdown)
  const endImageRef = crawlEndImageRef(opts.raw.markdown)
  const endImageUrl = endImageRef ? resolveMarkdownImageSrc(endImageRef, opts.path, opts.images).url : null
  const crawlBody = crawlPlainText(opts.raw.markdown)
  const crawlTitle = opts.raw.title
  const isActiveCrawl =
    opts.activeCrawl != null &&
    (opts.activeCrawl.title ?? '') === (crawlTitle ?? '') &&
    opts.activeCrawl.body === crawlBody
  const card = (
    <CrawlCard
      title={crawlTitle}
      preface={crawlPreface(opts.raw.markdown)}
      body={crawlBody}
      logoRef={logoRef}
      logoUrl={logoUrl}
      endImageRef={endImageRef}
      endImageUrl={endImageUrl}
      musicRef={musicRef}
      musicTracks={opts.musicTracks}
      images={opts.images}
      canPlay={opts.theme === 'scifi'}
      disabled={opts.disabled}
      editing={opts.blockEditing}
      onChange={(fields) => void opts.persistCrawl(opts.crawlIndex, fields)}
      onPlay={opts.onPlayCrawl ? (fields) => void opts.playCrawlCard(opts.crawlIndex, fields) : undefined}
      onStop={opts.onStopCrawl}
      crawlActive={isActiveCrawl && Boolean(opts.playerCrawl)}
      crawlStopping={isActiveCrawl && opts.playerCrawl?.stoppingAt != null}
      onLoadLogo={() => opts.loadCrawlLogo()}
      onLoadEndImage={() => opts.loadCrawlEndImage()}
      onLoadMusic={() => opts.loadCrawlMusic()}
    />
  )
  return wrapOpeningCard(
    opts.wrapSheetBlock,
    opts.blockKey,
    opts.part,
    'crawl',
    opts.key,
    opts.blockEditing,
    card
  )
}

/** Fenced `[!legend]` — Campfire chronicle card. */
export function renderLegendBlock(opts: {
  part: CalloutBlock
  raw: CalloutBlock
  key: string
  blockKey: string
  blockEditing: boolean
  legendIndex: number
  wrapSheetBlock: WrapSheetBlock
  path: string
  images: CampaignImage[]
  theme?: ThemeId
  disabled?: boolean
  musicTracks?: AudioTrack[]
  activeLegend?: { title?: string; body: string } | null
  playerLegend?: PlayerLegend | null
  onStopLegend?: () => void
  onPlayLegend?: unknown
  persistLegend: (index: number, fields: LegendCalloutFields) => void | Promise<void>
  playLegendCard: (index: number, fields: LegendCalloutFields) => void | Promise<void>
  loadLegendLogo: () => Promise<string | null>
  loadLegendEndImage: () => Promise<string | null>
  loadLegendMusic: () => Promise<string | null>
}): ReactNode {
  const logoRef = legendLogoRef(opts.raw.markdown)
  const logoUrl = logoRef ? resolveMarkdownImageSrc(logoRef, opts.path, opts.images).url : null
  const musicRef = legendMusicRef(opts.raw.markdown)
  const endImageRef = legendEndImageRef(opts.raw.markdown)
  const endImageUrl = endImageRef ? resolveMarkdownImageSrc(endImageRef, opts.path, opts.images).url : null
  const legendBody = legendPlainText(opts.raw.markdown)
  const legendTitle = opts.raw.title
  const look = legendLook(opts.raw.markdown)
  const isActiveLegend =
    opts.activeLegend != null &&
    (opts.activeLegend.title ?? '') === (legendTitle ?? '') &&
    opts.activeLegend.body === legendBody
  const card = (
    <LegendCard
      title={legendTitle}
      preface={legendPreface(opts.raw.markdown)}
      body={legendBody}
      look={look}
      logoRef={logoRef}
      logoUrl={logoUrl}
      endImageRef={endImageRef}
      endImageUrl={endImageUrl}
      musicRef={musicRef}
      musicTracks={opts.musicTracks}
      images={opts.images}
      canPlay={legendPlayEnabled(opts.theme)}
      disabled={opts.disabled}
      editing={opts.blockEditing}
      onChange={(fields) => void opts.persistLegend(opts.legendIndex, fields)}
      onPlay={opts.onPlayLegend ? (fields) => void opts.playLegendCard(opts.legendIndex, fields) : undefined}
      onStop={opts.onStopLegend}
      legendActive={isActiveLegend && Boolean(opts.playerLegend)}
      legendStopping={isActiveLegend && opts.playerLegend?.stoppingAt != null}
      onLoadLogo={() => opts.loadLegendLogo()}
      onLoadEndImage={() => opts.loadLegendEndImage()}
      onLoadMusic={() => opts.loadLegendMusic()}
    />
  )
  return wrapOpeningCard(
    opts.wrapSheetBlock,
    opts.blockKey,
    opts.part,
    'legend',
    opts.key,
    opts.blockEditing,
    card
  )
}

/** Fenced `[!gallery]` — player-screen image sequence. */
export function renderGalleryBlock(opts: {
  part: CalloutBlock
  raw: CalloutBlock
  key: string
  blockKey: string
  blockEditing: boolean
  galleryIndex: number
  wrapSheetBlock: WrapSheetBlock
  path: string
  images: CampaignImage[]
  disabled?: boolean
  activeGallery?: { title?: string; imageRefs: string[] } | null
  playerGallery?: PlayerGallery | null
  onStopGallery?: () => void
  onGalleryPrev?: () => void
  onGalleryNext?: () => void
  onPlayGallery?: unknown
  persistGallery: (index: number, fields: GalleryCalloutFields) => void | Promise<void>
  playGalleryCard: (index: number, fields: GalleryCalloutFields) => void | Promise<void>
}): ReactNode {
  const refs = galleryImageRefs(opts.raw.markdown)
  const intervalSec = galleryIntervalSec(opts.raw.markdown)
  const urls = refs.map((ref) => resolveMarkdownImageSrc(ref, opts.path, opts.images).url || null)
  const refsKey = refs.join('\n')
  const isActiveGallery =
    opts.activeGallery != null &&
    (opts.activeGallery.title ?? '') === (opts.raw.title ?? '') &&
    opts.activeGallery.imageRefs.join('\n') === refsKey
  const card = (
    <GalleryCard
      title={opts.raw.title}
      intervalSec={intervalSec}
      loop={galleryLoops(opts.raw.markdown)}
      showTitle={galleryShowTitle(opts.raw.markdown)}
      imageRefs={refs}
      images={opts.images}
      imageUrls={urls}
      disabled={opts.disabled}
      editing={opts.blockEditing}
      onChange={(fields) => void opts.persistGallery(opts.galleryIndex, fields)}
      onPlay={opts.onPlayGallery ? (fields) => void opts.playGalleryCard(opts.galleryIndex, fields) : undefined}
      onStop={opts.onStopGallery}
      onPrev={opts.onGalleryPrev}
      onNext={opts.onGalleryNext}
      galleryActive={isActiveGallery && Boolean(opts.playerGallery)}
      slideIndex={isActiveGallery ? opts.playerGallery?.index : undefined}
      slideCount={isActiveGallery ? opts.playerGallery?.slides.length : undefined}
    />
  )
  return wrapOpeningCard(
    opts.wrapSheetBlock,
    opts.blockKey,
    opts.part,
    'gallery',
    opts.key,
    opts.blockEditing,
    card
  )
}

/** Fenced `[!video]` — local campaign clip on the player screen. */
export function renderVideoBlock(opts: {
  part: CalloutBlock
  raw: CalloutBlock
  key: string
  blockKey: string
  blockEditing: boolean
  videoIndex: number
  wrapSheetBlock: WrapSheetBlock
  disabled?: boolean
  videos?: CampaignVideo[]
  activeVideo?: { title?: string; videoRef: string } | null
  playerVideo?: PlayerVideo | null
  onStopVideo?: () => void
  onPlayVideo?: unknown
  persistVideo: (index: number, fields: VideoCalloutFields) => void | Promise<void>
  playVideoCard: (index: number, fields: VideoCalloutFields) => void | Promise<void>
  loadVideoFile: () => Promise<string | null>
}): ReactNode {
  const fields = parseVideoFields(opts.raw.title, opts.raw.markdown)
  const isActiveVideo =
    opts.activeVideo != null &&
    (opts.activeVideo.title ?? '') === (fields.title ?? '') &&
    opts.activeVideo.videoRef === (fields.videoRef ?? '')
  const card = (
    <VideoCard
      title={fields.title}
      videoRef={fields.videoRef}
      muted={fields.muted}
      videos={opts.videos ?? []}
      disabled={opts.disabled}
      editing={opts.blockEditing}
      onChange={(next) => void opts.persistVideo(opts.videoIndex, next)}
      onPlay={opts.onPlayVideo ? (next) => void opts.playVideoCard(opts.videoIndex, next) : undefined}
      onStop={opts.onStopVideo}
      videoActive={isActiveVideo && Boolean(opts.playerVideo)}
      onLoadVideo={() => opts.loadVideoFile()}
    />
  )
  return wrapOpeningCard(
    opts.wrapSheetBlock,
    opts.blockKey,
    opts.part,
    'video',
    opts.key,
    opts.blockEditing,
    card
  )
}
