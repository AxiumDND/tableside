import type { MutableRefObject } from 'react'
import type { CampaignInfo, LegendLookId } from '../../../shared/types'
import { campaignFileUrl, imageTitle, portraitSrcForNote, resolveMarkdownImageSrc, type CampaignImage } from '../lib/images'
import { useHideBundledArtwork } from './useBundledArtwork'
import { hyperspacePlanetSrc, hyperspaceShipSrc } from '../lib/hyperspaceDefaults'
import { resolveNoteRef, sheetDisplayName, type CampaignNote } from '../lib/notes'
import { replaceNthCrawlCallout, type CrawlCalloutFields } from '../../../shared/openingCrawl'
import { replaceNthLegendCallout, type LegendCalloutFields } from '../../../shared/openingLegend'
import { replaceNthGalleryCallout, type GalleryCalloutFields } from '../../../shared/playerGallery'
import { replaceNthVideoCallout, type VideoCalloutFields } from '../../../shared/playerVideo'
import { replaceNthPhoneCallout, type PhoneCalloutFields } from '../../../shared/playerPhone'
import { replaceNthHyperspaceCallout, type HyperspaceCalloutFields } from '../../../shared/playerHyperspace'

type PlayCrawl = (
  title: string | undefined,
  body: string,
  logoSrc?: string | null,
  preface?: string | null,
  musicPath?: string | null,
  endSrc?: string | null
) => void

type PlayLegend = (
  title: string | undefined,
  body: string,
  logoSrc?: string | null,
  preface?: string | null,
  musicPath?: string | null,
  endSrc?: string | null,
  look?: LegendLookId
) => void

type PlayGallery = (
  title: string | undefined,
  slides: { src: string; label?: string }[],
  imageRefs: string[],
  intervalSec?: number | null,
  loop?: boolean,
  showTitle?: boolean
) => void

type PlayVideo = (title: string | undefined, src: string, muted: boolean, videoRef: string) => void
type PlayPhone = (
  title: string | undefined,
  photoSrc: string | null,
  ringSrc: string | null,
  npcRef: string | null
) => void
type PlayHyperspace = (
  title: string | undefined,
  shipSrc: string | null,
  planetSrc: string | null,
  shipRef: string | null,
  planetRef: string | null,
  enterSound?: string | null,
  loopSound?: string | null,
  exitSound?: string | null
) => void

export interface OpeningSequenceCards {
  persistCrawl: (index: number, fields: CrawlCalloutFields) => Promise<void>
  playCrawlCard: (index: number, fields: CrawlCalloutFields) => Promise<void>
  loadCrawlLogo: () => Promise<string | null>
  loadCrawlEndImage: () => Promise<string | null>
  loadCrawlMusic: () => Promise<string | null>
  persistLegend: (index: number, fields: LegendCalloutFields) => Promise<void>
  playLegendCard: (index: number, fields: LegendCalloutFields) => Promise<void>
  loadLegendLogo: () => Promise<string | null>
  loadLegendEndImage: () => Promise<string | null>
  loadLegendMusic: () => Promise<string | null>
  persistGallery: (index: number, fields: GalleryCalloutFields) => Promise<void>
  playGalleryCard: (index: number, fields: GalleryCalloutFields) => Promise<void>
  persistVideo: (index: number, fields: VideoCalloutFields) => Promise<void>
  playVideoCard: (index: number, fields: VideoCalloutFields) => Promise<void>
  loadVideoFile: () => Promise<string | null>
  persistPhone: (index: number, fields: PhoneCalloutFields) => Promise<void>
  playPhoneCard: (index: number, fields: PhoneCalloutFields) => Promise<void>
  loadPhoneRing: () => Promise<string | null>
  persistHyperspace: (index: number, fields: HyperspaceCalloutFields) => Promise<void>
  playHyperspaceCard: (index: number, fields: HyperspaceCalloutFields) => Promise<void>
  loadHyperspaceShip: () => Promise<string | null>
  loadHyperspacePlanet: () => Promise<string | null>
  loadHyperspaceSound: () => Promise<string | null>
}

/**
 * The opening-sequence cards embedded in a note (crawl / legend / gallery /
 * video / phone / hyperspace): persist their callout edits back into the markdown and play them on
 * the player screen. Persisting is injected (`persistMarkdown`) so this hook
 * stays out of the note's editing/save state.
 */
export function useOpeningSequenceCards({
  path,
  images,
  notes,
  markdownRef,
  persistMarkdown,
  onCampaignChange,
  onPlayCrawl,
  onPlayLegend,
  onPlayGallery,
  onPlayVideo,
  onPlayPhone,
  onPlayHyperspace
}: {
  path: string
  images: CampaignImage[]
  notes?: CampaignNote[]
  markdownRef: MutableRefObject<string>
  persistMarkdown: (next: string) => Promise<void>
  onCampaignChange?: (campaign: CampaignInfo) => void
  onPlayCrawl?: PlayCrawl
  onPlayLegend?: PlayLegend
  onPlayGallery?: PlayGallery
  onPlayVideo?: PlayVideo
  onPlayPhone?: PlayPhone
  onPlayHyperspace?: PlayHyperspace
}): OpeningSequenceCards {
  const hideBundled = useHideBundledArtwork()

  async function loadCrawlLogo(): Promise<string | null> {
    if (!path) return null
    const picked = await window.tabledm.pickImageFile()
    if (!picked) return null
    const result = await window.tabledm.copyArtToNote(path, { kind: 'import', filePath: picked.filePath }, picked.fileName)
    if (!result) return null
    onCampaignChange?.(result.campaign)
    return result.fileName
  }

  async function loadCrawlMusic(): Promise<string | null> {
    const result = await window.tabledm.addFiles('Audio/Music/Crawl')
    if (!result?.paths?.length) return null
    onCampaignChange?.(result.campaign)
    return result.paths[0] ?? null
  }

  async function persistCrawl(index: number, fields: CrawlCalloutFields): Promise<void> {
    if (!path) return
    const next = replaceNthCrawlCallout(markdownRef.current, index, fields)
    if (next === markdownRef.current) return
    await persistMarkdown(next)
  }

  async function playCrawlCard(index: number, fields: CrawlCalloutFields): Promise<void> {
    await persistCrawl(index, fields)
    const logo = fields.logoRef ? resolveMarkdownImageSrc(fields.logoRef, path, images).url : null
    const endImage = fields.endImageRef ? resolveMarkdownImageSrc(fields.endImageRef, path, images).url : null
    onPlayCrawl?.(fields.title || undefined, fields.body, logo || null, fields.preface, fields.musicRef, endImage || null)
  }

  async function persistLegend(index: number, fields: LegendCalloutFields): Promise<void> {
    if (!path) return
    const next = replaceNthLegendCallout(markdownRef.current, index, fields)
    if (next === markdownRef.current) return
    await persistMarkdown(next)
  }

  async function playLegendCard(index: number, fields: LegendCalloutFields): Promise<void> {
    await persistLegend(index, fields)
    const logo = fields.logoRef ? resolveMarkdownImageSrc(fields.logoRef, path, images).url : null
    const endImage = fields.endImageRef ? resolveMarkdownImageSrc(fields.endImageRef, path, images).url : null
    onPlayLegend?.(
      fields.title || undefined,
      fields.body,
      logo || null,
      fields.preface,
      fields.musicRef,
      endImage || null,
      fields.look
    )
  }

  async function persistGallery(index: number, fields: GalleryCalloutFields): Promise<void> {
    if (!path) return
    const next = replaceNthGalleryCallout(markdownRef.current, index, fields)
    if (next === markdownRef.current) return
    await persistMarkdown(next)
  }

  async function playGalleryCard(index: number, fields: GalleryCalloutFields): Promise<void> {
    await persistGallery(index, fields)
    const slides = fields.imageRefs
      .map((ref) => {
        const resolved = resolveMarkdownImageSrc(ref, path, images)
        return resolved.url ? { src: resolved.url, label: imageTitle(ref) } : null
      })
      .filter((s): s is { src: string; label: string } => Boolean(s))
    if (slides.length === 0) return
    onPlayGallery?.(fields.title || undefined, slides, fields.imageRefs, fields.intervalSec, fields.loop, fields.showTitle)
  }

  async function persistVideo(index: number, fields: VideoCalloutFields): Promise<void> {
    if (!path) return
    const next = replaceNthVideoCallout(markdownRef.current, index, fields)
    if (next === markdownRef.current) return
    await persistMarkdown(next)
  }

  async function playVideoCard(index: number, fields: VideoCalloutFields): Promise<void> {
    await persistVideo(index, fields)
    const ref = fields.videoRef?.trim()
    if (!ref) return
    onPlayVideo?.(fields.title || undefined, campaignFileUrl(ref), fields.muted, ref)
  }

  async function loadVideoFile(): Promise<string | null> {
    const result = await window.tabledm.addFiles('Handouts')
    if (!result?.paths?.length) return null
    onCampaignChange?.(result.campaign)
    return result.paths[0] ?? null
  }

  async function persistPhone(index: number, fields: PhoneCalloutFields): Promise<void> {
    if (!path) return
    const next = replaceNthPhoneCallout(markdownRef.current, index, fields)
    if (next === markdownRef.current) return
    await persistMarkdown(next)
  }

  async function playPhoneCard(index: number, fields: PhoneCalloutFields): Promise<void> {
    await persistPhone(index, fields)
    const npc = fields.npcRef?.trim()
    if (!npc) return
    const sheet = resolveNoteRef(npc, path, notes ?? [])
    const title = sheet ? sheetDisplayName(sheet.stem) : npc
    const photo = sheet ? portraitSrcForNote(sheet.relativePath, images, undefined, { hideBundled }) : null
    const ring = fields.ringRef?.trim() ? campaignFileUrl(fields.ringRef.trim()) : null
    onPlayPhone?.(title, photo, ring, npc)
  }

  async function loadPhoneRing(): Promise<string | null> {
    const result = await window.tabledm.addFiles('Audio/Sfx')
    if (!result?.paths?.length) return null
    onCampaignChange?.(result.campaign)
    return result.paths[0] ?? null
  }

  async function persistHyperspace(index: number, fields: HyperspaceCalloutFields): Promise<void> {
    if (!path) return
    const next = replaceNthHyperspaceCallout(markdownRef.current, index, fields)
    if (next === markdownRef.current) return
    await persistMarkdown(next)
  }

  async function playHyperspaceCard(index: number, fields: HyperspaceCalloutFields): Promise<void> {
    await persistHyperspace(index, fields)
    const ship = fields.shipRef ? resolveMarkdownImageSrc(fields.shipRef, path, images) : { url: '', path: null }
    const planet = fields.planetRef ? resolveMarkdownImageSrc(fields.planetRef, path, images) : { url: '', path: null }
    onPlayHyperspace?.(
      fields.title || undefined,
      hyperspaceShipSrc(ship.path ? ship.url : null),
      hyperspacePlanetSrc(planet.path ? planet.url : null),
      fields.shipRef,
      fields.planetRef,
      fields.enterSoundRef,
      fields.loopSoundRef,
      fields.exitSoundRef
    )
  }

  return {
    persistCrawl,
    playCrawlCard,
    loadCrawlLogo,
    loadCrawlEndImage: loadCrawlLogo,
    loadCrawlMusic,
    persistLegend,
    playLegendCard,
    loadLegendLogo: loadCrawlLogo,
    loadLegendEndImage: loadCrawlLogo,
    loadLegendMusic: loadCrawlMusic,
    persistGallery,
    playGalleryCard,
    persistVideo,
    playVideoCard,
    loadVideoFile,
    persistPhone,
    playPhoneCard,
    loadPhoneRing,
    persistHyperspace,
    playHyperspaceCard,
    loadHyperspaceShip: loadCrawlLogo,
    loadHyperspacePlanet: loadCrawlLogo,
    loadHyperspaceSound: loadPhoneRing
  }
}
