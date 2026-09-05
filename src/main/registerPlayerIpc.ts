import { ipcMain, screen } from 'electron'
import type { PlayerState } from '../shared/types'
import { IPC } from '../shared/ipc'
import {
  clampBoxOfDoomDc,
  clampBoxOfDoomMod,
  normalizeBoxOfDoomMode,
  resolveBoxOfDoom
} from '../shared/boxOfDoom'
import { hourglassDurationMs, hourglassRemainingMs } from '../shared/hourglass'
import { patchSettings, getSettings } from './appSettings'
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
  clearBoxOfDoomTimers,
  clearHourglassTimers,
  scheduleBoxOfDoomAutoFade,
  showPlayerDice,
  stopPlayerBoxOfDoom,
  stopPlayerHourglass,
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
          hyperspace: null,
          boxOfDoom: null,
          hourglass: null,
          diceShow: null
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
          boxOfDoom: null,
          hourglass: null,
          diceShow: null,
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
          boxOfDoom: null,
          hourglass: null,
          diceShow: null,
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
          boxOfDoom: null,
          hourglass: null,
          diceShow: null,
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
          boxOfDoom: null,
          hourglass: null,
          diceShow: null,
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
          handout: null,
          boxOfDoom: null,
          hourglass: null,
          diceShow: null
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
          handout: null,
          boxOfDoom: null,
          hourglass: null,
          diceShow: null
        },
        { show: true }
      )
    }
  )

  ipcMain.handle(IPC.playerArriveHyperspace, () => arrivePlayerHyperspace())
  ipcMain.handle(IPC.playerStopHyperspace, () => stopPlayerHyperspace())

  ipcMain.handle(
    IPC.playerShowBoxOfDoom,
    (_e, payload: { dc?: number; modifier?: number; mode?: string; label?: string }) => {
      clearBoxOfDoomTimers()
      clearHourglassTimers()
      const dc = clampBoxOfDoomDc(Number(payload?.dc))
      const modifier = clampBoxOfDoomMod(Number(payload?.modifier))
      const mode = normalizeBoxOfDoomMode(payload?.mode)
      const label = typeof payload?.label === 'string' ? payload.label.trim() : ''
      const prev = getPlayerState().boxOfDoom
      const reuseFade = Boolean(prev && prev.stoppingAt == null && prev.rolledAt == null)
      return setPlayerState(
        {
          ...getPlayerState(),
          crawl: null,
          legend: null,
          gallery: null,
          video: null,
          phone: null,
          hyperspace: null,
          hourglass: null,
          boxOfDoom: {
            dc,
            modifier,
            mode,
            startedAt: reuseFade && prev ? prev.startedAt : Date.now(),
            label: label || undefined
          }
        },
        { show: true }
      )
    }
  )

  ipcMain.handle(
    IPC.playerRollBoxOfDoom,
    (
      _e,
      payload: {
        dc?: number
        modifier?: number
        d20?: number
        d20b?: number
        mode?: string
        sound?: boolean
      }
    ) => {
      const current = getPlayerState().boxOfDoom
      if (!current || current.stoppingAt != null || current.rolledAt != null) {
        return getPlayerState()
      }
      const resolved = resolveBoxOfDoom(
        Number(payload?.dc ?? current.dc),
        Number(payload?.d20),
        Number(payload?.modifier ?? current.modifier),
        { mode: normalizeBoxOfDoomMode(payload?.mode ?? current.mode), d20b: payload?.d20b }
      )
      const next = setPlayerState({
        ...getPlayerState(),
        boxOfDoom: {
          ...current,
          dc: resolved.dc,
          modifier: resolved.modifier,
          mode: resolved.mode,
          d20: resolved.d20,
          rolls: resolved.rolls,
          total: resolved.total,
          success: resolved.success,
          sound: payload?.sound !== false,
          rolledAt: Date.now()
        }
      })
      scheduleBoxOfDoomAutoFade(getSettings())
      return next
    }
  )

  ipcMain.handle(IPC.playerStopBoxOfDoom, () => stopPlayerBoxOfDoom())

  ipcMain.handle(
    IPC.playerShowHourglass,
    (_e, payload: { minutes?: number; sound?: boolean }) => {
      clearHourglassTimers()
      clearBoxOfDoomTimers()
      const durationMs = hourglassDurationMs(payload?.minutes)
      return setPlayerState(
        {
          ...getPlayerState(),
          crawl: null,
          legend: null,
          gallery: null,
          video: null,
          phone: null,
          hyperspace: null,
          boxOfDoom: null,
          hourglass: {
            durationMs,
            shownAt: Date.now(),
            sound: payload?.sound !== false
          }
        },
        { show: true }
      )
    }
  )

  ipcMain.handle(IPC.playerStartHourglass, (_e, payload?: { sound?: boolean }) => {
    const current = getPlayerState().hourglass
    if (!current || current.stoppingAt != null || current.endsAt != null) return getPlayerState()
    const remaining = hourglassRemainingMs(current)
    if (remaining <= 0) return getPlayerState()
    return setPlayerState({
      ...getPlayerState(),
      hourglass: {
        durationMs: current.durationMs,
        shownAt: current.shownAt,
        endsAt: Date.now() + remaining,
        sound: payload?.sound ?? current.sound
      }
    })
  })

  ipcMain.handle(IPC.playerPauseHourglass, () => {
    const current = getPlayerState().hourglass
    if (!current || current.stoppingAt != null || current.endsAt == null) return getPlayerState()
    const remaining = hourglassRemainingMs(current)
    if (remaining <= 0) {
      return setPlayerState({
        ...getPlayerState(),
        hourglass: {
          durationMs: current.durationMs,
          shownAt: current.shownAt,
          remainingMs: 0,
          expiredAt: Date.now(),
          sound: current.sound
        }
      })
    }
    return setPlayerState({
      ...getPlayerState(),
      hourglass: {
        durationMs: current.durationMs,
        shownAt: current.shownAt,
        remainingMs: remaining,
        pausedAt: Date.now(),
        sound: current.sound
      }
    })
  })

  ipcMain.handle(IPC.playerResumeHourglass, (_e, payload?: { sound?: boolean }) => {
    const current = getPlayerState().hourglass
    if (!current || current.stoppingAt != null || current.endsAt != null) return getPlayerState()
    const remaining = hourglassRemainingMs(current)
    if (remaining <= 0) return getPlayerState()
    return setPlayerState({
      ...getPlayerState(),
      hourglass: {
        durationMs: current.durationMs,
        shownAt: current.shownAt,
        endsAt: Date.now() + remaining,
        sound: payload?.sound ?? current.sound
      }
    })
  })

  ipcMain.handle(
    IPC.playerResetHourglass,
    (_e, payload?: { minutes?: number; refill?: boolean }) => {
      const current = getPlayerState().hourglass
      if (!current || current.stoppingAt != null) return getPlayerState()
      const durationMs =
        payload?.minutes != null ? hourglassDurationMs(payload.minutes) : current.durationMs
      const waiting =
        current.endsAt == null && current.remainingMs == null && current.expiredAt == null
      const keepShownAt = payload?.refill === false && waiting
      return setPlayerState({
        ...getPlayerState(),
        hourglass: {
          durationMs,
          shownAt: keepShownAt ? current.shownAt : Date.now(),
          sound: current.sound
        }
      })
    }
  )

  ipcMain.handle(IPC.playerStopHourglass, () => stopPlayerHourglass())

  ipcMain.handle(IPC.playerShowDice, (_e, payload: Parameters<typeof showPlayerDice>[0]) => {
    return showPlayerDice(payload ?? { expr: '', total: 0, groups: [], bonus: 0 })
  })

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
