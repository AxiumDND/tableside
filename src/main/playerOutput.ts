import { join } from 'node:path'
import { BrowserWindow, screen } from 'electron'
import type { DisplayInfo, PlayerState } from '../shared/types'
import { emptyPlayerState } from '../shared/types'
import {
  playerOutputScaleMismatch,
  playerWindowNeedsRebuild,
  shouldShowPlayerWindow
} from '../shared/playerWindow'
import { IPC } from '../shared/ipc'
import { APP_NAME } from '../shared/version'
import { CRAWL_FADE_OUT_MS, crawlEndStillAtMs } from '../shared/openingCrawl'
import { legendEndStillAtMs } from '../shared/openingLegend'
import { BOX_OF_DOOM_FADE_OUT_MS, boxOfDoomHoldMs } from '../shared/boxOfDoom'
import { HOURGLASS_FADE_OUT_MS } from '../shared/hourglass'
import type { AppSettings } from '../shared/types'
import {
  DICE_SHOW_FADE_OUT_MS,
  DICE_SHOW_HOLD_MS,
  type PlayerDiceShow
} from '../shared/playerDiceShow'
import { PHONE_FADE_OUT_MS } from '../shared/playerPhone'
import { HYPERSPACE_ARRIVE_MS, HYPERSPACE_FADE_OUT_MS } from '../shared/playerHyperspace'
import type { MixerState } from '../shared/audio'
import { getMixerState } from './campaignMixer'

export type PlayerOutputDeps = {
  getDmWindow: () => BrowserWindow | null
  getPreferredDisplayId: () => number | undefined
  appIconPath: () => string
  playerPageUrl: () => string
  applyWindowSecurity: (contents: Electron.WebContents) => void
}

let deps: PlayerOutputDeps = {
  getDmWindow: () => null,
  getPreferredDisplayId: () => undefined,
  appIconPath: () => '',
  playerPageUrl: () => '',
  applyWindowSecurity: () => undefined
}

let playerWindow: BrowserWindow | null = null
let playerWindowWanted = true
let playerWindowScaleOk = false
let playerScaleRetries = 0
let playerWindowWarmup = true
const programmaticPlayerCloses = new WeakSet<BrowserWindow>()
let playerState: PlayerState = emptyPlayerState()
let crawlStopTimer: ReturnType<typeof setTimeout> | null = null
let legendStopTimer: ReturnType<typeof setTimeout> | null = null
let crawlPromoteTimer: ReturnType<typeof setTimeout> | null = null
let legendPromoteTimer: ReturnType<typeof setTimeout> | null = null
let galleryStopTimer: ReturnType<typeof setTimeout> | null = null
let phoneStopTimer: ReturnType<typeof setTimeout> | null = null
let hyperspaceStopTimer: ReturnType<typeof setTimeout> | null = null
let boxOfDoomStopTimer: ReturnType<typeof setTimeout> | null = null
let boxOfDoomHoldTimer: ReturnType<typeof setTimeout> | null = null
let hourglassStopTimer: ReturnType<typeof setTimeout> | null = null
let diceShowHoldTimer: ReturnType<typeof setTimeout> | null = null
let diceShowStopTimer: ReturnType<typeof setTimeout> | null = null

export function configurePlayerOutput(next: PlayerOutputDeps): void {
  deps = next
}

export function getPlayerState(): PlayerState {
  return playerState
}

export function isPlayerScaleOk(): boolean {
  return playerWindowScaleOk
}

export function setPlayerState(next: PlayerState, opts?: { show?: boolean }): PlayerState {
  playerState = next
  sendPlayerState()
  if (opts?.show) showPlayerWindow(undefined, !playerWindowScaleOk)
  return playerState
}

export function resetPlayerState(partial?: Partial<PlayerState>): PlayerState {
  clearStopTimers()
  playerState = { ...emptyPlayerState(), ...partial }
  sendPlayerState()
  return playerState
}

function clearStopTimers(): void {
  if (crawlStopTimer) {
    clearTimeout(crawlStopTimer)
    crawlStopTimer = null
  }
  if (legendStopTimer) {
    clearTimeout(legendStopTimer)
    legendStopTimer = null
  }
  clearProloguePromoteTimers()
  if (galleryStopTimer) {
    clearTimeout(galleryStopTimer)
    galleryStopTimer = null
  }
  if (phoneStopTimer) {
    clearTimeout(phoneStopTimer)
    phoneStopTimer = null
  }
  if (hyperspaceStopTimer) {
    clearTimeout(hyperspaceStopTimer)
    hyperspaceStopTimer = null
  }
  clearBoxOfDoomTimers()
  clearHourglassTimers()
  clearDiceShowTimers()
}

export function dmDisplayId(): number {
  const dmWindow = deps.getDmWindow()
  if (dmWindow && !dmWindow.isDestroyed()) {
    return screen.getDisplayMatching(dmWindow.getBounds()).id
  }
  return screen.getPrimaryDisplay().id
}

export function hasSecondDisplay(): boolean {
  return screen.getAllDisplays().length > 1
}

export function targetPlayerDisplay(displayId?: number): Electron.Display {
  const displays = screen.getAllDisplays()
  const wanted = displayId ?? deps.getPreferredDisplayId()
  if (wanted != null) {
    const match = displays.find((d) => d.id === wanted)
    if (match) return match
  }
  const dmId = dmDisplayId()
  return displays.find((d) => d.id !== dmId) ?? screen.getPrimaryDisplay()
}

function currentPlayerDisplay(): Electron.Display | null {
  if (!playerWindow || playerWindow.isDestroyed()) return null
  return screen.getDisplayMatching(playerWindow.getBounds())
}

function applyPlayerOutputScale(): void {
  if (!playerWindow || playerWindow.isDestroyed()) return
  playerWindow.webContents.setZoomFactor(1)
}

export function playerWindowVisible(): boolean {
  return Boolean(playerWindow && !playerWindow.isDestroyed() && playerWindow.isVisible())
}

function broadcastPlayerWindow(): void {
  deps.getDmWindow()?.webContents.send(IPC.playerWindow, playerWindowVisible())
}

export function destroyPlayerWindow(resetWarmup = false): void {
  const win = playerWindow
  if (resetWarmup) {
    playerWindowWarmup = true
    playerScaleRetries = 0
  }
  if (!win || win.isDestroyed()) {
    playerWindow = null
    playerWindowScaleOk = false
    broadcastPlayerWindow()
    return
  }
  programmaticPlayerCloses.add(win)
  playerWindow = null
  playerWindowScaleOk = false
  win.destroy()
  broadcastPlayerWindow()
}

export function hidePlayerWindow(): void {
  destroyPlayerWindow(true)
}

export function closePlayerWindow(): void {
  playerWindowWanted = false
  hidePlayerWindow()
}

/** Close the player BrowserWindow when the DM window is torn down (without clearing wanted). */
export function disposePlayerWindow(): void {
  playerWindow?.close()
}

export function showPlayerWindow(display?: Electron.Display, forceRebuild = false): void {
  playerWindowWanted = true
  if (!hasSecondDisplay()) {
    hidePlayerWindow()
    return
  }
  const target = display ?? targetPlayerDisplay()
  const current = currentPlayerDisplay()
  if (
    !forceRebuild &&
    playerWindowScaleOk &&
    playerWindow &&
    !playerWindow.isDestroyed() &&
    playerWindow.isVisible() &&
    !playerWindowNeedsRebuild(
      current ? { id: current.id, scaleFactor: current.scaleFactor } : null,
      { id: target.id, scaleFactor: target.scaleFactor }
    )
  ) {
    broadcastPlayerWindow()
    return
  }
  destroyPlayerWindow(forceRebuild || !playerWindowScaleOk)
  createPlayerWindow(target)
}

function createPlayerWindow(display = targetPlayerDisplay()): void {
  if (!hasSecondDisplay()) return
  if (playerWindow && !playerWindow.isDestroyed()) destroyPlayerWindow()
  const bounds = display.bounds
  const icon = deps.appIconPath()
  playerWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    show: false,
    frame: false,
    fullscreen: false,
    fullscreenable: true,
    autoHideMenuBar: true,
    backgroundColor: '#050403',
    title: `${APP_NAME} — Player`,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      autoplayPolicy: 'no-user-gesture-required'
    }
  })

  const created = playerWindow
  deps.applyWindowSecurity(created.webContents)
  created.on('closed', () => {
    if (playerWindow === created) playerWindow = null
    if (!programmaticPlayerCloses.has(created)) playerWindowWanted = false
    broadcastPlayerWindow()
  })
  playerWindow.webContents.on('did-finish-load', () => {
    applyPlayerOutputScale()
    playerWindow?.webContents.send(IPC.playerState, playerState)
    sendMixerStateToPlayer(getMixerState())
  })
  playerWindow.once('ready-to-show', () => {
    if (!playerWindow || playerWindow.isDestroyed()) return
    if (playerWindowWarmup) {
      playerWindowWarmup = false
      destroyPlayerWindow(false)
      createPlayerWindow(display)
      return
    }
    playerWindow.setBounds(bounds)
    playerWindow.setSkipTaskbar(false)
    playerWindow.show()
    playerWindow.setFullScreen(true)
    applyPlayerOutputScale()
    broadcastPlayerWindow()
    void verifyPlayerOutputScale(created, display)
  })
  playerWindow.loadURL(deps.playerPageUrl())
}

async function verifyPlayerOutputScale(win: BrowserWindow, display: Electron.Display): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 80))
  if (playerWindow !== win || win.isDestroyed()) return
  let dpr: unknown
  try {
    dpr = await win.webContents.executeJavaScript('window.devicePixelRatio')
  } catch {
    return
  }
  if (typeof dpr === 'number' && !playerOutputScaleMismatch(dpr, display.scaleFactor)) {
    playerWindowScaleOk = true
    playerScaleRetries = 0
    return
  }
  if (playerScaleRetries >= 1 || !playerWindowWanted || !hasSecondDisplay()) {
    playerWindowScaleOk = true
    return
  }
  playerScaleRetries += 1
  destroyPlayerWindow()
  createPlayerWindow(display)
}

export function syncPlayerWindow(): void {
  if (shouldShowPlayerWindow(hasSecondDisplay(), playerWindowWanted)) showPlayerWindow()
  else hidePlayerWindow()
}

export function sendMixerStateToPlayer(state: MixerState): void {
  if (playerWindow && !playerWindow.isDestroyed()) {
    playerWindow.webContents.send(IPC.mixerState, state)
  }
}

export function sendPlayerState(): void {
  playerWindow?.webContents.send(IPC.playerState, playerState)
  deps.getDmWindow()?.webContents.send(IPC.playerState, playerState)
}

export function listDisplays(): DisplayInfo[] {
  const primaryId = screen.getPrimaryDisplay().id
  const dmId = dmDisplayId()
  return screen.getAllDisplays().map((d, index) => {
    const name = d.label?.trim() || `Monitor ${index + 1}`
    const width = Math.round(d.bounds.width * d.scaleFactor)
    const height = Math.round(d.bounds.height * d.scaleFactor)
    return {
      id: d.id,
      label: `${name} · ${width}×${height}`,
      bounds: d.bounds,
      primary: d.id === primaryId,
      dm: d.id === dmId
    }
  })
}

function broadcastDisplays(): void {
  deps.getDmWindow()?.webContents.send(IPC.appDisplaysChanged, listDisplays())
}

export function watchDisplays(): void {
  const replacePlayer = (): void => {
    syncPlayerWindow()
    broadcastDisplays()
  }
  screen.on('display-added', replacePlayer)
  screen.on('display-removed', replacePlayer)
  screen.on('display-metrics-changed', (_event, changed) => {
    const current = currentPlayerDisplay()
    if (current && changed.id === current.id && playerWindowWanted) {
      destroyPlayerWindow(true)
      syncPlayerWindow()
    }
    broadcastDisplays()
  })
}

export function clearPlayerMedia(): PlayerState {
  clearStopTimers()
  return setPlayerState({
    ...playerState,
    imageSrc: null,
    imageTitle: '',
    mapView: null,
    crawl: null,
    legend: null,
    gallery: null,
    video: null,
    phone: null,
    hyperspace: null,
    handout: null,
    boxOfDoom: null,
    hourglass: null,
    diceShow: null
  })
}

/** Drop crawl / legend / gallery / video / phone / hyperspace / handout but keep the last still or map for crossfades. */
export function clearPlayerOverlays(): PlayerState {
  clearStopTimers()
  return setPlayerState({
    ...playerState,
    crawl: null,
    legend: null,
    gallery: null,
    video: null,
    phone: null,
    hyperspace: null,
    handout: null,
    boxOfDoom: null,
    hourglass: null,
    diceShow: null
  })
}

function clearCrawlPromoteTimer(): void {
  if (crawlPromoteTimer) {
    clearTimeout(crawlPromoteTimer)
    crawlPromoteTimer = null
  }
}

function clearLegendPromoteTimer(): void {
  if (legendPromoteTimer) {
    clearTimeout(legendPromoteTimer)
    legendPromoteTimer = null
  }
}

function clearProloguePromoteTimers(): void {
  clearCrawlPromoteTimer()
  clearLegendPromoteTimer()
}

function promotePrologueEndStill(startedAt: number): void {
  const overlay = playerState.legend ?? playerState.crawl
  if (!overlay || overlay.stoppingAt != null || overlay.startedAt !== startedAt) return
  const src = overlay.endSrc?.trim()
  if (!src || playerState.imageSrc === src) return
  playerState = { ...playerState, imageSrc: src, mapView: null }
  sendPlayerState()
}

/** Copy the chronicle / crawl closing still onto the player image layer when it appears. */
export function scheduleLegendEndStill(): void {
  clearProloguePromoteTimers()
  const legend = playerState.legend
  const endSrc = legend?.endSrc?.trim()
  if (!legend || !endSrc) return
  const startedAt = legend.startedAt
  legendPromoteTimer = setTimeout(() => {
    legendPromoteTimer = null
    promotePrologueEndStill(startedAt)
  }, legendEndStillAtMs(legend.title, legend.body))
}

/** Copy the crawl closing still onto the player image layer when it appears. */
export function scheduleCrawlEndStill(): void {
  clearProloguePromoteTimers()
  const crawl = playerState.crawl
  const endSrc = crawl?.endSrc?.trim()
  if (!crawl || !endSrc) return
  const startedAt = crawl.startedAt
  crawlPromoteTimer = setTimeout(() => {
    crawlPromoteTimer = null
    promotePrologueEndStill(startedAt)
  }, crawlEndStillAtMs(crawl.preface))
}

export function stopPlayerCrawl(): PlayerState {
  const crawl = playerState.crawl
  if (!crawl || crawl.stoppingAt != null) return playerState
  clearCrawlPromoteTimer()
  if (crawlStopTimer) {
    clearTimeout(crawlStopTimer)
    crawlStopTimer = null
  }
  playerState = {
    ...playerState,
    crawl: { ...crawl, stoppingAt: Date.now() }
  }
  sendPlayerState()
  crawlStopTimer = setTimeout(() => {
    crawlStopTimer = null
    if (playerState.crawl?.stoppingAt) {
      playerState = { ...playerState, crawl: null }
      sendPlayerState()
    }
  }, CRAWL_FADE_OUT_MS)
  return playerState
}

export function stopPlayerLegend(): PlayerState {
  const legend = playerState.legend
  if (!legend || legend.stoppingAt != null) return playerState
  clearLegendPromoteTimer()
  if (legendStopTimer) {
    clearTimeout(legendStopTimer)
    legendStopTimer = null
  }
  playerState = {
    ...playerState,
    legend: { ...legend, stoppingAt: Date.now() }
  }
  sendPlayerState()
  legendStopTimer = setTimeout(() => {
    legendStopTimer = null
    if (playerState.legend?.stoppingAt) {
      playerState = { ...playerState, legend: null }
      sendPlayerState()
    }
  }, CRAWL_FADE_OUT_MS)
  return playerState
}

export function stopPlayerGallery(): PlayerState {
  const gallery = playerState.gallery
  if (!gallery || gallery.stoppingAt != null) return playerState
  if (galleryStopTimer) {
    clearTimeout(galleryStopTimer)
    galleryStopTimer = null
  }
  playerState = {
    ...playerState,
    gallery: { ...gallery, stoppingAt: Date.now() }
  }
  sendPlayerState()
  galleryStopTimer = setTimeout(() => {
    galleryStopTimer = null
    if (playerState.gallery?.stoppingAt) {
      playerState = { ...playerState, gallery: null }
      sendPlayerState()
    }
  }, CRAWL_FADE_OUT_MS)
  return playerState
}

export function stopPlayerPhone(): PlayerState {
  const phone = playerState.phone
  if (!phone || phone.stoppingAt != null) return playerState
  if (phoneStopTimer) {
    clearTimeout(phoneStopTimer)
    phoneStopTimer = null
  }
  playerState = {
    ...playerState,
    phone: { ...phone, stoppingAt: Date.now() }
  }
  sendPlayerState()
  phoneStopTimer = setTimeout(() => {
    phoneStopTimer = null
    if (playerState.phone?.stoppingAt) {
      playerState = { ...playerState, phone: null, imageTitle: '' }
      sendPlayerState()
    }
  }, PHONE_FADE_OUT_MS)
  return playerState
}

export function arrivePlayerHyperspace(): PlayerState {
  const jump = playerState.hyperspace
  if (!jump || jump.arrivedAt || jump.stoppingAt) return playerState
  if (hyperspaceStopTimer) {
    clearTimeout(hyperspaceStopTimer)
    hyperspaceStopTimer = null
  }
  const planet = jump.planetSrc?.trim() || null
  playerState = {
    ...playerState,
    imageSrc: planet ?? playerState.imageSrc,
    imageTitle: planet ? jump.title || 'Arrival' : playerState.imageTitle,
    mapView: planet ? null : playerState.mapView,
    hyperspace: { ...jump, arrivedAt: Date.now() }
  }
  sendPlayerState()
  hyperspaceStopTimer = setTimeout(() => {
    hyperspaceStopTimer = null
    if (playerState.hyperspace?.arrivedAt && !playerState.hyperspace.stoppingAt) {
      playerState = { ...playerState, hyperspace: null }
      sendPlayerState()
    }
  }, HYPERSPACE_ARRIVE_MS + 200)
  return playerState
}

export function stopPlayerHyperspace(): PlayerState {
  const jump = playerState.hyperspace
  if (!jump || jump.stoppingAt != null) return playerState
  if (hyperspaceStopTimer) {
    clearTimeout(hyperspaceStopTimer)
    hyperspaceStopTimer = null
  }
  playerState = {
    ...playerState,
    hyperspace: { ...jump, stoppingAt: Date.now() }
  }
  sendPlayerState()
  hyperspaceStopTimer = setTimeout(() => {
    hyperspaceStopTimer = null
    if (playerState.hyperspace?.stoppingAt) {
      playerState = { ...playerState, hyperspace: null }
      sendPlayerState()
    }
  }, HYPERSPACE_FADE_OUT_MS)
  return playerState
}

export function clearBoxOfDoomHoldTimer(): void {
  if (boxOfDoomHoldTimer) {
    clearTimeout(boxOfDoomHoldTimer)
    boxOfDoomHoldTimer = null
  }
}

export function clearBoxOfDoomStopTimer(): void {
  if (boxOfDoomStopTimer) {
    clearTimeout(boxOfDoomStopTimer)
    boxOfDoomStopTimer = null
  }
}

export function clearBoxOfDoomTimers(): void {
  clearBoxOfDoomHoldTimer()
  clearBoxOfDoomStopTimer()
}

export function scheduleBoxOfDoomAutoFade(settings: Pick<AppSettings, 'boxOfDoomHoldSec'>): void {
  clearBoxOfDoomHoldTimer()
  const holdMs = boxOfDoomHoldMs(settings.boxOfDoomHoldSec)
  boxOfDoomHoldTimer = setTimeout(() => {
    boxOfDoomHoldTimer = null
    const roll = playerState.boxOfDoom
    if (!roll || roll.stoppingAt != null || roll.rolledAt == null) return
    stopPlayerBoxOfDoom()
  }, holdMs)
}

export function stopPlayerBoxOfDoom(): PlayerState {
  const roll = playerState.boxOfDoom
  if (!roll || roll.stoppingAt != null) return playerState
  clearBoxOfDoomTimers()
  playerState = {
    ...playerState,
    boxOfDoom: { ...roll, stoppingAt: Date.now() }
  }
  sendPlayerState()
  boxOfDoomStopTimer = setTimeout(() => {
    boxOfDoomStopTimer = null
    if (playerState.boxOfDoom?.stoppingAt) {
      playerState = { ...playerState, boxOfDoom: null }
      sendPlayerState()
    }
  }, BOX_OF_DOOM_FADE_OUT_MS)
  return playerState
}

export function clearHourglassTimers(): void {
  if (hourglassStopTimer) {
    clearTimeout(hourglassStopTimer)
    hourglassStopTimer = null
  }
}

export function stopPlayerHourglass(): PlayerState {
  const glass = playerState.hourglass
  if (!glass || glass.stoppingAt != null) return playerState
  clearHourglassTimers()
  playerState = {
    ...playerState,
    hourglass: { ...glass, stoppingAt: Date.now() }
  }
  sendPlayerState()
  hourglassStopTimer = setTimeout(() => {
    hourglassStopTimer = null
    if (playerState.hourglass?.stoppingAt) {
      playerState = { ...playerState, hourglass: null }
      sendPlayerState()
    }
  }, HOURGLASS_FADE_OUT_MS)
  return playerState
}

export function clearDiceShowTimers(): void {
  if (diceShowHoldTimer) {
    clearTimeout(diceShowHoldTimer)
    diceShowHoldTimer = null
  }
  if (diceShowStopTimer) {
    clearTimeout(diceShowStopTimer)
    diceShowStopTimer = null
  }
}

function beginDiceShowFade(): void {
  const show = playerState.diceShow
  if (!show || show.stoppingAt != null) return
  playerState = {
    ...playerState,
    diceShow: { ...show, stoppingAt: Date.now() }
  }
  sendPlayerState()
  diceShowStopTimer = setTimeout(() => {
    diceShowStopTimer = null
    if (playerState.diceShow?.stoppingAt) {
      playerState = { ...playerState, diceShow: null }
      sendPlayerState()
    }
  }, DICE_SHOW_FADE_OUT_MS)
}

export function showPlayerDice(payload: Omit<PlayerDiceShow, 'startedAt' | 'stoppingAt'>): PlayerState {
  clearDiceShowTimers()
  const diceShow: PlayerDiceShow = {
    ...payload,
    groups: Array.isArray(payload.groups) ? payload.groups : [],
    bonus: Number(payload.bonus) || 0,
    total: Number(payload.total) || 0,
    expr: String(payload.expr ?? ''),
    startedAt: Date.now()
  }
  playerState = { ...playerState, diceShow }
  sendPlayerState()
  showPlayerWindow(undefined, !playerWindowScaleOk)
  diceShowHoldTimer = setTimeout(() => {
    diceShowHoldTimer = null
    beginDiceShowFade()
  }, DICE_SHOW_HOLD_MS)
  return playerState
}
