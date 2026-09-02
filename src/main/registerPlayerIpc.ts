import { ipcMain, screen } from 'electron'
import type { PlayerState } from '../shared/types'
import { IPC } from '../shared/ipc'
import { patchSettings } from './appSettings'
import {
  arrivePlayerHyperspace,
  clearPlayerMedia,
  clearPlayerOverlays,
  closePlayerWindow,
  getPlayerState,
  hasSecondDisplay,
  hidePlayerWindow,
  listDisplays,
  playerWindowVisible,
  setPlayerState,
  showPlayerWindow,
  stopPlayerCrawl,
  stopPlayerGallery,
  stopPlayerHyperspace,
  stopPlayerLegend,
  stopPlayerPhone
} from './playerOutput'

export function registerPlayerIpc(): void {
  ipcMain.handle(
    IPC.playerShowImage,
    (
      _e,
      payload: {
        src: string
        title: string
        mapView?: PlayerState['mapView']
        handout?: PlayerState['handout']
      }
    ) => {
      return setPlayerState(
        {
          ...getPlayerState(),
          imageSrc: payload.src || null,
          imageTitle: payload.title,
          mapView: payload.mapView ?? null,
          handout: payload.handout ?? null,
          crawl: null,
          legend: null,
          gallery: null,
          video: null,
          phone: null,
          hyperspace: null
        },
        { show: true }
      )
    }
  )

  ipcMain.handle(
    IPC.playerShowCrawl,
    (
      _e,
      payload: {
        title?: string
        body?: string
        logoSrc?: string | null
        endSrc?: string | null
        preface?: string | null
      }
    ) => {
      const title = typeof payload?.title === 'string' ? payload.title.trim() : ''
      const body = typeof payload?.body === 'string' ? payload.body : ''
      const logoSrc =
        typeof payload?.logoSrc === 'string' && payload.logoSrc.trim() ? payload.logoSrc.trim() : null
      const endSrc =
        typeof payload?.endSrc === 'string' && payload.endSrc.trim() ? payload.endSrc.trim() : null
      const preface =
        payload?.preface === null
          ? null
          : typeof payload?.preface === 'string'
            ? payload.preface
            : undefined
      return setPlayerState(
        {
          ...getPlayerState(),
          imageSrc: null,
          imageTitle: title || 'Opening crawl',
          mapView: null,
          crawl: {
            title: title || undefined,
            body,
            logoSrc,
            endSrc,
            preface,
            startedAt: Date.now()
          },
          legend: null,
          gallery: null,
          video: null,
          phone: null,
          hyperspace: null,
          handout: null
        },
        { show: true }
      )
    }
  )

  ipcMain.handle(
    IPC.playerShowLegend,
    (
      _e,
      payload: {
        title?: string
        body?: string
        logoSrc?: string | null
        endSrc?: string | null
        preface?: string | null
        look?: string | null
      }
    ) => {
      const title = typeof payload?.title === 'string' ? payload.title.trim() : ''
      const body = typeof payload?.body === 'string' ? payload.body : ''
      const logoSrc =
        typeof payload?.logoSrc === 'string' && payload.logoSrc.trim() ? payload.logoSrc.trim() : null
      const endSrc =
        typeof payload?.endSrc === 'string' && payload.endSrc.trim() ? payload.endSrc.trim() : null
      const preface =
        payload?.preface === null
          ? null
          : typeof payload?.preface === 'string'
            ? payload.preface
            : undefined
      const lookRaw = typeof payload?.look === 'string' ? payload.look.trim().toLowerCase() : ''
      const look =
        lookRaw === 'embers' || lookRaw === 'crimson' || lookRaw === 'neon' || lookRaw === 'mist'
          ? lookRaw
          : 'mist'
      const prev = getPlayerState()
      return setPlayerState(
        {
          ...prev,
          imageTitle: prev.imageSrc ? prev.imageTitle : title || 'Campfire chronicle',
          crawl: null,
          legend: {
            title: title || undefined,
            body,
            logoSrc,
            endSrc,
            preface,
            look,
            startedAt: Date.now()
          },
          gallery: null,
          video: null,
          phone: null,
          hyperspace: null,
          handout: null
        },
        { show: true }
      )
    }
  )

  ipcMain.handle(IPC.playerClear, () => clearPlayerMedia())
  ipcMain.handle(IPC.playerClearOverlays, () => clearPlayerOverlays())
  ipcMain.handle(IPC.playerStopCrawl, () => stopPlayerCrawl())
  ipcMain.handle(IPC.playerStopLegend, () => stopPlayerLegend())

  ipcMain.handle(
    IPC.playerShowGallery,
    (
      _e,
      payload: {
        title?: string
        slides?: { src: string; label?: string }[]
        intervalSec?: number | null
        loop?: boolean
        showTitle?: boolean
      }
    ) => {
      const title = typeof payload?.title === 'string' ? payload.title.trim() : ''
      const slides = Array.isArray(payload?.slides)
        ? payload.slides
            .filter((s) => s && typeof s.src === 'string' && s.src.trim())
            .map((s) => ({
              src: s.src.trim(),
              label: typeof s.label === 'string' && s.label.trim() ? s.label.trim() : undefined
            }))
        : []
      if (slides.length === 0) return getPlayerState()
      const intervalRaw = payload?.intervalSec
      const intervalSec =
        typeof intervalRaw === 'number' && Number.isFinite(intervalRaw) && intervalRaw > 0
          ? Math.min(120, Math.round(intervalRaw))
          : null
      const loop = payload?.loop !== false
      const showTitle = Boolean(payload?.showTitle) && Boolean(title)
      const prev = getPlayerState()
      return setPlayerState(
        {
          ...prev,
          imageTitle: prev.imageSrc ? prev.imageTitle : title || 'Gallery',
          crawl: null,
          legend: null,
          gallery: {
            title: title || undefined,
            slides,
            index: 0,
            startedAt: Date.now(),
            intervalSec,
            loop,
            showTitle
          },
          video: null,
          phone: null,
          hyperspace: null,
          handout: null
        },
        { show: true }
      )
    }
  )

  ipcMain.handle(IPC.playerGallerySetIndex, (_e, index: number) => {
    const gallery = getPlayerState().gallery
    if (!gallery) return getPlayerState()
    const next = Math.max(0, Math.min(gallery.slides.length - 1, Math.floor(Number(index) || 0)))
    if (next === gallery.index) return getPlayerState()
    return setPlayerState({ ...getPlayerState(), gallery: { ...gallery, index: next } })
  })

  ipcMain.handle(IPC.playerStopGallery, () => stopPlayerGallery())

  ipcMain.handle(
    IPC.playerShowVideo,
    (_e, payload: { title?: string; src?: string; muted?: boolean }) => {
      const title = typeof payload?.title === 'string' ? payload.title.trim() : ''
      const src = typeof payload?.src === 'string' ? payload.src.trim() : ''
      if (!src) return getPlayerState()
      return setPlayerState(
        {
          ...getPlayerState(),
          imageSrc: null,
          imageTitle: title || 'Video',
          mapView: null,
          crawl: null,
          legend: null,
          gallery: null,
          video: {
            title: title || undefined,
            src,
            muted: Boolean(payload?.muted),
            startedAt: Date.now()
          },
          phone: null,
          hyperspace: null,
          handout: null
        },
        { show: true }
      )
    }
  )

  ipcMain.handle(IPC.playerStopVideo, () => {
    if (!getPlayerState().video) return getPlayerState()
    return setPlayerState({ ...getPlayerState(), video: null, imageTitle: '' })
  })

  ipcMain.handle(
    IPC.playerShowPhone,
    (_e, payload: { title?: string; photoSrc?: string | null; ringSrc?: string | null }) => {
      const title = typeof payload?.title === 'string' ? payload.title.trim() : ''
      const photoSrc =
        typeof payload?.photoSrc === 'string' && payload.photoSrc.trim() ? payload.photoSrc.trim() : null
      const ringSrc =
        typeof payload?.ringSrc === 'string' && payload.ringSrc.trim() ? payload.ringSrc.trim() : null
      return setPlayerState(
        {
          ...getPlayerState(),
          imageSrc: null,
          imageTitle: title || 'Incoming call',
          mapView: null,
          crawl: null,
          legend: null,
          gallery: null,
          video: null,
          phone: {
            title: title || undefined,
            photoSrc,
            ringSrc,
            startedAt: Date.now()
          },
          hyperspace: null,
          handout: null
        },
        { show: true }
      )
    }
  )

  ipcMain.handle(IPC.playerAnswerPhone, () => {
    const phone = getPlayerState().phone
    if (!phone || phone.answeredAt || phone.stoppingAt) return getPlayerState()
    return setPlayerState({ ...getPlayerState(), phone: { ...phone, answeredAt: Date.now() } })
  })

  ipcMain.handle(IPC.playerStopPhone, () => stopPlayerPhone())

  ipcMain.handle(
    IPC.playerShowHyperspace,
    (_e, payload: { title?: string; shipSrc?: string | null; planetSrc?: string | null }) => {
      const title = typeof payload?.title === 'string' ? payload.title.trim() : ''
      const shipSrc =
        typeof payload?.shipSrc === 'string' && payload.shipSrc.trim() ? payload.shipSrc.trim() : null
      const planetSrc =
        typeof payload?.planetSrc === 'string' && payload.planetSrc.trim() ? payload.planetSrc.trim() : null
      return setPlayerState(
        {
          ...getPlayerState(),
          imageSrc: null,
          imageTitle: title || 'Hyperspace',
          mapView: null,
          crawl: null,
          legend: null,
          gallery: null,
          video: null,
          phone: null,
          hyperspace: {
            title: title || undefined,
            shipSrc,
            planetSrc,
            startedAt: Date.now()
          },
          handout: null
        },
        { show: true }
      )
    }
  )

  ipcMain.handle(IPC.playerArriveHyperspace, () => arrivePlayerHyperspace())
  ipcMain.handle(IPC.playerStopHyperspace, () => stopPlayerHyperspace())

  ipcMain.handle(
    IPC.playerSetInitiative,
    (_e, payload: { entries: PlayerState['initiative']; show: boolean; round?: number }) => {
      return setPlayerState({
        ...getPlayerState(),
        initiative: payload.entries ?? [],
        showInitiative: Boolean(payload.show),
        initiativeRound: Number(payload.round ?? 0)
      })
    }
  )

  ipcMain.handle(IPC.playerGetState, () => getPlayerState())
  ipcMain.handle(IPC.playerWindowOpen, () => playerWindowVisible())
  ipcMain.handle(IPC.playerCloseWindow, () => {
    closePlayerWindow()
    return playerWindowVisible()
  })

  ipcMain.handle(IPC.playerPlaceOnDisplay, async (_e, displayId: number) => {
    const display = screen.getAllDisplays().find((d) => d.id === displayId)
    if (!display) return listDisplays()
    await patchSettings({ playerDisplayId: displayId })
    if (hasSecondDisplay()) showPlayerWindow(display, true)
    else hidePlayerWindow()
    return listDisplays()
  })
}
