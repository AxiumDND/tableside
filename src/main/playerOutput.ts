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
import { CRAWL_FADE_OUT_MS } from '../shared/openingCrawl'

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
let galleryStopTimer: ReturnType<typeof setTimeout> | null = null

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
  if (galleryStopTimer) {
    clearTimeout(galleryStopTimer)
    galleryStopTimer = null
  }
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
    video: null
  })
}

/** Drop crawl / legend / gallery / video but keep the last still or map for crossfades. */
export function clearPlayerOverlays(): PlayerState {
  clearStopTimers()
  return setPlayerState({
    ...playerState,
    crawl: null,
    legend: null,
    gallery: null,
    video: null
  })
}

export function stopPlayerCrawl(): PlayerState {
  const crawl = playerState.crawl
  if (!crawl || crawl.stoppingAt != null) return playerState
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
