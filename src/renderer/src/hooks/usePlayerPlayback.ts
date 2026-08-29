import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { PlayerMapView, PlayerState } from '../../../shared/types'
import { emptyPlayerState } from '../../../shared/types'
import type { MixerState } from '../../../shared/audio'
import { crawlMusicStartDelayMs, CRAWL_SYNC_MS, CRAWL_FADE_OUT_MS } from '../../../shared/openingCrawl'
import { legendMusicStartDelayMs, LEGEND_SYNC_MS } from '../../../shared/openingLegend'
import { campaignFileUrl, type FileKind } from '../components/CampaignFiles'
import { imageTitle } from '../lib/images'

export type ActiveCrawl = { title?: string; body: string }
export type ActiveLegend = { title?: string; body: string }
export type ActiveGallery = { title?: string; imageRefs: string[] }
export type ActiveVideo = { title?: string; videoRef: string }

/** Owns DM → player-output playback (image, crawl, legend, gallery, video) and related timers. */
export function usePlayerPlayback(setMixer: Dispatch<SetStateAction<MixerState>>) {
  const [player, setPlayer] = useState<PlayerState>(emptyPlayerState())
  const [activeCrawl, setActiveCrawl] = useState<ActiveCrawl | null>(null)
  const [activeLegend, setActiveLegend] = useState<ActiveLegend | null>(null)
  const [activeGallery, setActiveGallery] = useState<ActiveGallery | null>(null)
  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(null)

  const playerSrcRef = useRef(player.imageSrc)
  const mapLiveRef = useRef<{ src: string; title: string; view: PlayerMapView } | null>(null)
  const playerLiveRef = useRef(false)
  const crawlMusicTimerRef = useRef<number | null>(null)
  const crawlMusicEndTimerRef = useRef<number | null>(null)
  const crawlSettleTimerRef = useRef<number | null>(null)
  const galleryAdvanceTimerRef = useRef<number | null>(null)
  const prologueHasEndImageRef = useRef(false)
  playerSrcRef.current = player.imageSrc

  function clearCrawlMusicTimer(): void {
    if (crawlMusicTimerRef.current != null) {
      window.clearTimeout(crawlMusicTimerRef.current)
      crawlMusicTimerRef.current = null
    }
    if (crawlMusicEndTimerRef.current != null) {
      window.clearTimeout(crawlMusicEndTimerRef.current)
      crawlMusicEndTimerRef.current = null
    }
    if (crawlSettleTimerRef.current != null) {
      window.clearTimeout(crawlSettleTimerRef.current)
      crawlSettleTimerRef.current = null
    }
  }

  function clearGalleryAdvanceTimer(): void {
    if (galleryAdvanceTimerRef.current != null) {
      window.clearInterval(galleryAdvanceTimerRef.current)
      galleryAdvanceTimerRef.current = null
    }
  }

  useEffect(() => {
    if (!player.crawl) setActiveCrawl(null)
  }, [player.crawl])

  useEffect(() => {
    playerLiveRef.current = false
    void window.tabledm.clearPlayer().then(setPlayer)
  }, [])

  async function showSelectedToPlayers(
    selectedImage: string | null,
    openPath: string,
    openKind: FileKind
  ): Promise<void> {
    const path = selectedImage ?? (openKind === 'image' ? openPath : null)
    if (!path) return
    const src = path.startsWith('tabledm://') ? path : campaignFileUrl(path)
    const title =
      path.startsWith('tabledm://srd-portrait') ||
      path.startsWith('tabledm://srd-item') ||
      path.startsWith('tabledm://srd-school')
        ? decodeURIComponent(new URL(path).searchParams.get('name') ?? 'Image')
        : imageTitle(path)
    const live = mapLiveRef.current
    const mapView = live?.src === src ? live.view : null
    playerLiveRef.current = true
    setPlayer(await window.tabledm.showImage(src, title, mapView))
  }

  function handleMapLiveView(imagePath: string, view: PlayerMapView): void {
    const src = campaignFileUrl(imagePath)
    const title = imageTitle(imagePath)
    mapLiveRef.current = { src, title, view }
    if (!playerLiveRef.current || playerSrcRef.current !== src) return
    void window.tabledm.showImage(src, title, view).then(setPlayer)
  }

  async function playCrawl(
    title: string | undefined,
    body: string,
    logoSrc?: string | null,
    preface?: string | null,
    musicPath?: string | null,
    endSrc?: string | null
  ): Promise<void> {
    playerLiveRef.current = false
    clearCrawlMusicTimer()
    const hasEnd = Boolean(endSrc?.trim())
    prologueHasEndImageRef.current = hasEnd
    setActiveLegend(null)
    setActiveGallery(null)
    setActiveVideo(null)
    clearGalleryAdvanceTimer()
    setMixer(await window.tabledm.mixerArmCrawlMusic())
    const track = musicPath?.trim()
    const musicDelay = crawlMusicStartDelayMs(preface)
    if (track) {
      crawlMusicTimerRef.current = window.setTimeout(() => {
        crawlMusicTimerRef.current = null
        void window.tabledm.mixerPlayCrawlMusic(track).then(setMixer)
      }, musicDelay)
    }
    crawlMusicEndTimerRef.current = window.setTimeout(() => {
      crawlMusicEndTimerRef.current = null
      void window.tabledm.mixerStopCrawlMusic().then(setMixer)
    }, musicDelay + CRAWL_SYNC_MS)
    crawlSettleTimerRef.current = window.setTimeout(() => {
      crawlSettleTimerRef.current = null
      setActiveCrawl(null)
      if (!prologueHasEndImageRef.current) {
        void window.tabledm.clearPlayer().then(setPlayer)
      }
    }, musicDelay + CRAWL_SYNC_MS + CRAWL_FADE_OUT_MS)
    setActiveCrawl({ title, body })
    setPlayer(await window.tabledm.showCrawl({ title, body, logoSrc, preface, endSrc }))
  }

  async function playLegend(
    title: string | undefined,
    body: string,
    logoSrc?: string | null,
    preface?: string | null,
    musicPath?: string | null,
    endSrc?: string | null
  ): Promise<void> {
    playerLiveRef.current = false
    clearCrawlMusicTimer()
    const hasEnd = Boolean(endSrc?.trim())
    prologueHasEndImageRef.current = hasEnd
    setActiveCrawl(null)
    setActiveGallery(null)
    setActiveVideo(null)
    clearGalleryAdvanceTimer()
    setMixer(await window.tabledm.mixerArmCrawlMusic())
    const track = musicPath?.trim()
    const musicDelay = legendMusicStartDelayMs(preface)
    if (track) {
      crawlMusicTimerRef.current = window.setTimeout(() => {
        crawlMusicTimerRef.current = null
        void window.tabledm.mixerPlayCrawlMusic(track).then(setMixer)
      }, musicDelay)
    }
    crawlMusicEndTimerRef.current = window.setTimeout(() => {
      crawlMusicEndTimerRef.current = null
      void window.tabledm.mixerStopCrawlMusic().then(setMixer)
    }, musicDelay + LEGEND_SYNC_MS)
    crawlSettleTimerRef.current = window.setTimeout(() => {
      crawlSettleTimerRef.current = null
      setActiveLegend(null)
      if (!prologueHasEndImageRef.current) {
        void window.tabledm.clearPlayer().then(setPlayer)
      }
    }, musicDelay + LEGEND_SYNC_MS + CRAWL_FADE_OUT_MS)
    setActiveLegend({ title, body })
    setPlayer(await window.tabledm.showLegend({ title, body, logoSrc, preface, endSrc }))
  }

  async function stopCrawl(): Promise<void> {
    clearCrawlMusicTimer()
    prologueHasEndImageRef.current = false
    setActiveCrawl(null)
    setMixer(await window.tabledm.mixerStopCrawlMusic())
    setPlayer(await window.tabledm.stopCrawl())
  }

  async function stopLegend(): Promise<void> {
    clearCrawlMusicTimer()
    prologueHasEndImageRef.current = false
    setActiveLegend(null)
    setMixer(await window.tabledm.mixerStopCrawlMusic())
    setPlayer(await window.tabledm.stopLegend())
  }

  async function playGallery(
    title: string | undefined,
    slides: { src: string; label?: string }[],
    imageRefs: string[],
    intervalSec?: number | null,
    loop = true,
    showTitle = false
  ): Promise<void> {
    playerLiveRef.current = false
    clearCrawlMusicTimer()
    clearGalleryAdvanceTimer()
    setActiveCrawl(null)
    setActiveLegend(null)
    setActiveVideo(null)
    setActiveGallery({ title, imageRefs })
    setMixer(await window.tabledm.mixerStopCrawlMusic())
    const state = await window.tabledm.showGallery({
      title,
      slides,
      intervalSec: intervalSec && intervalSec > 0 ? intervalSec : null,
      loop,
      showTitle
    })
    setPlayer(state)
    const sec = intervalSec && intervalSec > 0 ? intervalSec : null
    if (sec && slides.length > 1) {
      galleryAdvanceTimerRef.current = window.setInterval(() => {
        void window.tabledm.getPlayerState().then((current) => {
          const g = current.gallery
          if (!g) {
            clearGalleryAdvanceTimer()
            return
          }
          const last = g.slides.length - 1
          if (g.index >= last) {
            if (g.loop !== false) {
              void window.tabledm.gallerySetIndex(0).then(setPlayer)
              return
            }
            clearGalleryAdvanceTimer()
            return
          }
          void window.tabledm.gallerySetIndex(g.index + 1).then(setPlayer)
        })
      }, sec * 1000)
    }
  }

  async function galleryPrev(): Promise<void> {
    const g = player.gallery
    if (!g || g.slides.length === 0) return
    if (g.index <= 0) {
      if (g.loop === false) return
      setPlayer(await window.tabledm.gallerySetIndex(g.slides.length - 1))
      return
    }
    setPlayer(await window.tabledm.gallerySetIndex(g.index - 1))
  }

  async function galleryNext(): Promise<void> {
    const g = player.gallery
    if (!g || g.slides.length === 0) return
    if (g.index >= g.slides.length - 1) {
      if (g.loop === false) return
      setPlayer(await window.tabledm.gallerySetIndex(0))
      return
    }
    setPlayer(await window.tabledm.gallerySetIndex(g.index + 1))
  }

  async function stopGallery(): Promise<void> {
    clearGalleryAdvanceTimer()
    setActiveGallery(null)
    setPlayer(await window.tabledm.stopGallery())
  }

  async function playVideo(
    title: string | undefined,
    src: string,
    muted: boolean,
    videoRef: string
  ): Promise<void> {
    playerLiveRef.current = false
    clearCrawlMusicTimer()
    clearGalleryAdvanceTimer()
    setActiveCrawl(null)
    setActiveLegend(null)
    setActiveGallery(null)
    setActiveVideo({ title, videoRef })
    if (!muted) {
      setMixer(await window.tabledm.mixerArmCrawlMusic())
    } else {
      setMixer(await window.tabledm.mixerStopCrawlMusic())
    }
    setPlayer(await window.tabledm.showVideo({ title, src, muted }))
  }

  async function stopVideo(): Promise<void> {
    setActiveVideo(null)
    setMixer(await window.tabledm.mixerStopCrawlMusic())
    setPlayer(await window.tabledm.stopVideo())
  }

  async function clearPlayer(): Promise<void> {
    playerLiveRef.current = false
    clearCrawlMusicTimer()
    clearGalleryAdvanceTimer()
    setActiveCrawl(null)
    setActiveLegend(null)
    setActiveGallery(null)
    setActiveVideo(null)
    setMixer(await window.tabledm.mixerStopCrawlMusic())
    setPlayer(await window.tabledm.clearPlayer())
  }

  return {
    player,
    setPlayer,
    activeCrawl,
    activeLegend,
    activeGallery,
    activeVideo,
    showSelectedToPlayers,
    handleMapLiveView,
    playCrawl,
    playLegend,
    stopCrawl,
    stopLegend,
    playGallery,
    galleryPrev,
    galleryNext,
    stopGallery,
    playVideo,
    stopVideo,
    clearPlayer
  }
}
