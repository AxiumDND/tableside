import { app, BrowserWindow, dialog, ipcMain, protocol, screen, session, shell } from 'electron'
import { existsSync } from 'node:fs'
import { copyFile, cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join, normalize, relative, basename, dirname, extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import type {
  AppSettings,
  CampaignInfo,
  CombatState,
  CreateNoteMapImage,
  DisplayInfo,
  PlayerState,
  RecentCampaign
} from '../shared/types'
import { emptyPlayerState, emptySettings } from '../shared/types'
import {
  AUDIO_EXT,
  applyMixerCommand,
  buildAudioLibrary,
  emptyMixerState,
  mixerPrefsToFile,
  parseMixerPrefs,
  type MixerCommand,
  type MixerPrefs,
  type MixerState
} from '../shared/audio'
import { setupAppUpdater, scheduleLaunchUpdateCheck } from './appUpdater'
import { registerMediaProtocol } from './mediaAssets'
import {
  ensureSampleWorkingCopy,
  isDroppedAppSample,
  removeDroppedAppSamples,
  sampleSourcePath
} from './sampleCampaign'
import {
  type CampaignFile,
  ensureCampaignLayout,
  existingCanonicalDir,
  loadCampaign,
  prepareCampaignFolder,
  readJson,
  safeJoin,
  seedNewCampaignFiles,
  toPosix,
  writeJson
} from './campaignFolder'
import {
  addCampaignFiles,
  configureCampaignNotes,
  copyImageToArtFolder,
  createCampaignNote,
  deleteCampaignFile,
  duplicateCampaignFile,
  saveToCampaignLibrary,
  setNotePortrait
} from './campaignNotes'
import {
  playerOutputScaleMismatch,
  playerWindowNeedsRebuild,
  shouldShowPlayerWindow
} from '../shared/playerWindow'
import { parseThemeId, THEME_WINDOW_BACKGROUND } from '../shared/theme'
import { isAllowedExternalUrl } from '../shared/externalLinks'
import { IPC } from '../shared/ipc'
import { APP_NAME, APP_VERSION } from '../shared/version'
import { CRAWL_FADE_OUT_MS } from '../shared/openingCrawl'
import { type CampaignLibraryFolder } from '../shared/campaignLayout'
import { sanitizeFileName, type SheetTemplateKind } from '../shared/sheetTemplates'
import { parseSystemId } from '../shared/systemPack'
import { ensureBooksHome, loadBookLibrary, openBooksFolder } from './bookLibrary'

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'tabledm',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
])

app.setName(APP_NAME)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
if (process.platform === 'win32') {
  app.setAppUserModelId('com.tabledm.app')
}

let dmWindow: BrowserWindow | null = null
let playerWindow: BrowserWindow | null = null
let playerWindowWanted = true
let playerWindowScaleOk = false
let playerScaleRetries = 0
let playerWindowWarmup = true
const programmaticPlayerCloses = new WeakSet<BrowserWindow>()
let campaignFolder: string | null = null
let playerState: PlayerState = emptyPlayerState()
let crawlStopTimer: ReturnType<typeof setTimeout> | null = null
let legendStopTimer: ReturnType<typeof setTimeout> | null = null
let mixer: MixerState = emptyMixerState()
let settings: AppSettings = emptySettings()
let allowQuit = false
let boundsTimer: ReturnType<typeof setTimeout> | null = null

function appIconPath(): string {
  const ico = app.isPackaged
    ? join(process.resourcesPath, 'icon.ico')
    : join(__dirname, '../../resources/icon.ico')
  const png = app.isPackaged
    ? join(process.resourcesPath, 'icon.png')
    : join(__dirname, '../../resources/icon.png')
  return existsSync(ico) ? ico : png
}

function appInstallFolder(): string {
  return app.isPackaged ? dirname(app.getPath('exe')) : app.getAppPath()
}

async function appFolders(): Promise<{ appFolder: string; userDataFolder: string; booksFolder: string }> {
  return {
    appFolder: appInstallFolder(),
    userDataFolder: app.getPath('userData'),
    booksFolder: await ensureBooksHome()
  }
}

async function openAppFolder(kind: string): Promise<string> {
  const folders = await appFolders()
  const folder =
    kind === 'userData' ? folders.userDataFolder : kind === 'app' ? folders.appFolder : kind === 'books' ? folders.booksFolder : null
  if (!folder) return ''
  await shell.openPath(folder)
  return folder
}

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

async function readSettings(): Promise<AppSettings> {
  try {
    return { ...emptySettings(), ...JSON.parse(await readFile(settingsPath(), 'utf8')) }
  } catch {
    return emptySettings()
  }
}

async function writeSettings(next: AppSettings): Promise<void> {
  settings = next
  await mkdir(app.getPath('userData'), { recursive: true })
  await writeFile(settingsPath(), JSON.stringify(next, null, 2), 'utf8')
}

function applyDmWindowTheme(theme?: string | null): void {
  if (!dmWindow || dmWindow.isDestroyed()) return
  dmWindow.setBackgroundColor(THEME_WINDOW_BACKGROUND[parseThemeId(theme)])
}

async function patchSettings(partial: AppSettings): Promise<AppSettings> {
  await writeSettings({ ...settings, ...partial })
  if (partial.theme !== undefined) applyDmWindowTheme(settings.theme)
  return settings
}

function samePath(a: string, b: string): boolean {
  return normalize(a).toLowerCase() === normalize(b).toLowerCase()
}

async function migrateLegacyUserData(): Promise<void> {
  const current = app.getPath('userData')
  const legacy = join(app.getPath('appData'), 'table-dm')
  if (samePath(current, legacy)) return
  if (existsSync(join(current, 'settings.json'))) return
  const legacySettings = join(legacy, 'settings.json')
  const legacyBooks = join(legacy, 'WOTC')
  if (!existsSync(legacySettings) && !existsSync(legacyBooks)) return
  await mkdir(current, { recursive: true })
  if (existsSync(legacySettings)) {
    await copyFile(legacySettings, join(current, 'settings.json'))
  }
  if (existsSync(legacyBooks)) {
    await cp(legacyBooks, join(current, 'Additional Books'), { recursive: true })
  }
}

function rendererBaseUrl(): string {
  if (process.env.ELECTRON_RENDERER_URL) {
    return process.env.ELECTRON_RENDERER_URL
  }
  return pathToFileURL(join(__dirname, '../renderer/index.html')).href
}

function rendererUrl(hash: string): string {
  return `${rendererBaseUrl()}#/${hash}`
}

function openExternalIfAllowed(rawUrl: string): void {
  if (isAllowedExternalUrl(rawUrl)) {
    void shell.openExternal(rawUrl)
  }
}

/**
 * Harden a window's web contents: open safe links in the OS browser, deny
 * in-app popups, and block navigation away from the bundled renderer (so a
 * campaign link can never replace the app frame with arbitrary content).
 */
function applyWindowSecurity(contents: Electron.WebContents): void {
  contents.setWindowOpenHandler((details) => {
    openExternalIfAllowed(details.url)
    return { action: 'deny' }
  })
  contents.on('will-navigate', (event, navigationUrl) => {
    if (navigationUrl.startsWith(rendererBaseUrl())) return
    event.preventDefault()
    openExternalIfAllowed(navigationUrl)
  })
}

/**
 * Open a native file dialog parented to the DM window when it is alive, falling
 * back to a window-less dialog otherwise. Keeps the call sites type-safe (the
 * parented overload requires a real BrowserWindow, not `undefined`).
 */
function showAppOpenDialog(
  options: Electron.OpenDialogOptions
): Promise<Electron.OpenDialogReturnValue> {
  const parent = dmWindow && !dmWindow.isDestroyed() ? dmWindow : null
  return parent ? dialog.showOpenDialog(parent, options) : dialog.showOpenDialog(options)
}

function scheduleBoundsSave(): void {
  if (!dmWindow || dmWindow.isMaximized()) return
  if (boundsTimer) clearTimeout(boundsTimer)
  boundsTimer = setTimeout(() => {
    if (!dmWindow) return
    void patchSettings({ dmBounds: dmWindow.getBounds() })
  }, 400)
}

function createDmWindow(): void {
  const bounds = settings.dmBounds
  const icon = appIconPath()
  dmWindow = new BrowserWindow({
    width: bounds?.width ?? 1480,
    height: bounds?.height ?? 920,
    x: bounds?.x,
    y: bounds?.y,
    minWidth: 1100,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: THEME_WINDOW_BACKGROUND[parseThemeId(settings.theme)],
    title: `${APP_NAME} ${APP_VERSION}`,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      plugins: true,
      autoplayPolicy: 'no-user-gesture-required'
    }
  })
  if (process.platform === 'win32') {
    dmWindow.setAppDetails({
      appId: 'com.tabledm.app',
      appIconPath: icon,
      relaunchDisplayName: APP_NAME
    })
  }

  dmWindow.on('ready-to-show', () => {
    dmWindow?.show()
    syncPlayerWindow()
  })
  dmWindow.on('moved', scheduleBoundsSave)
  dmWindow.on('resized', scheduleBoundsSave)
  dmWindow.on('close', (event) => {
    if (allowQuit) return
    event.preventDefault()
    dmWindow?.webContents.send(IPC.appWillClose)
    setTimeout(() => {
      if (allowQuit || !dmWindow) return
      allowQuit = true
      dmWindow.close()
    }, 2000)
  })
  dmWindow.on('closed', () => {
    dmWindow = null
    playerWindow?.close()
  })
  applyWindowSecurity(dmWindow.webContents)
  dmWindow.loadURL(rendererUrl('dm'))
}

function dmDisplayId(): number {
  if (dmWindow && !dmWindow.isDestroyed()) {
    return screen.getDisplayMatching(dmWindow.getBounds()).id
  }
  return screen.getPrimaryDisplay().id
}

function hasSecondDisplay(): boolean {
  return screen.getAllDisplays().length > 1
}

function targetPlayerDisplay(displayId?: number): Electron.Display {
  const displays = screen.getAllDisplays()
  const wanted = displayId ?? settings.playerDisplayId
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

function playerWindowVisible(): boolean {
  return Boolean(playerWindow && !playerWindow.isDestroyed() && playerWindow.isVisible())
}

function broadcastPlayerWindow(): void {
  dmWindow?.webContents.send(IPC.playerWindow, playerWindowVisible())
}

function destroyPlayerWindow(resetWarmup = false): void {
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

function hidePlayerWindow(): void {
  destroyPlayerWindow(true)
}

function closePlayerWindow(): void {
  playerWindowWanted = false
  hidePlayerWindow()
}

function showPlayerWindow(display?: Electron.Display, forceRebuild = false): void {
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
  const icon = appIconPath()
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
  applyWindowSecurity(created.webContents)
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
  playerWindow.loadURL(rendererUrl('player'))
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

function syncPlayerWindow(): void {
  if (shouldShowPlayerWindow(hasSecondDisplay(), playerWindowWanted)) showPlayerWindow()
  else hidePlayerWindow()
}

function sendPlayerState(): void {
  playerWindow?.webContents.send(IPC.playerState, playerState)
  dmWindow?.webContents.send(IPC.playerState, playerState)
}

function sendMixerState(): void {
  dmWindow?.webContents.send(IPC.mixerState, mixer)
}

async function listAudioFiles(root: string): Promise<string[]> {
  const audioRoot = await existingCanonicalDir(root, 'audio')
  if (!audioRoot) return []
  const out: string[] = []
  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue
      const full = join(dir, entry.name)
      if (entry.isDirectory()) await walk(full)
      else if (AUDIO_EXT.has(extname(entry.name).toLowerCase())) {
        out.push(toPosix(relative(root, full)))
      }
    }
  }
  await walk(audioRoot)
  return out
}

async function persistMixerPrefs(): Promise<void> {
  if (!campaignFolder) return
  await writeJson(join(campaignFolder, 'audio.json'), mixerPrefsToFile(mixer.prefs))
}

async function refreshMixerLibrary(): Promise<void> {
  if (!campaignFolder) {
    mixer = emptyMixerState()
    return
  }
  mixer = applyMixerCommand(mixer, { type: 'set-library', library: buildAudioLibrary(await listAudioFiles(campaignFolder)) })
}

async function loadMixerForCampaign(folder: string): Promise<void> {
  const prefs = parseMixerPrefs(await readJson(join(folder, 'audio.json'), {}))
  mixer = {
    ...emptyMixerState(),
    prefs,
    library: buildAudioLibrary(await listAudioFiles(folder))
  }
}

async function runMixer(command: MixerCommand): Promise<MixerState> {
  mixer = applyMixerCommand(mixer, command)
  if (command.type === 'set-prefs' || command.type === 'play-music' || command.type === 'play-ambience') {
    void persistMixerPrefs()
  }
  sendMixerState()
  return mixer
}

function listDisplays(): DisplayInfo[] {
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
  dmWindow?.webContents.send(IPC.appDisplaysChanged, listDisplays())
}

function watchDisplays(): void {
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

async function rememberRecentCampaign(folder: string, name: string): Promise<void> {
  const entry: RecentCampaign = { folder, name }
  const prior = (settings.recentCampaigns ?? []).filter((item) => !samePath(item.folder, folder))
  await patchSettings({ recentCampaigns: [entry, ...prior].slice(0, 8) })
}

async function setCampaignFolder(folder: string | null): Promise<CampaignInfo | null> {
  campaignFolder = folder
  await patchSettings({ campaignFolder: folder ?? undefined })
  if (!folder) {
    playerState = { ...emptyPlayerState() }
    mixer = emptyMixerState()
    sendPlayerState()
    sendMixerState()
    return null
  }
  await prepareCampaignFolder(folder)
  const info = await loadCampaign(folder)
  playerState = {
    ...emptyPlayerState(),
    campaignTitle: info.name
  }
  await loadMixerForCampaign(folder)
  sendPlayerState()
  sendMixerState()
  await rememberRecentCampaign(folder, info.name)
  return info
}

function registerIpc(): void {
  ipcMain.handle(IPC.appDisplays, () => listDisplays())

  ipcMain.handle(
    IPC.playerShowImage,
    (_e, payload: { src: string; title: string; mapView?: PlayerState['mapView'] }) => {
      playerState = {
        ...playerState,
        imageSrc: payload.src,
        imageTitle: payload.title,
        mapView: payload.mapView ?? null,
        crawl: null,
        legend: null,
        gallery: null,
        video: null
      }
      sendPlayerState()
      showPlayerWindow(undefined, !playerWindowScaleOk)
      return playerState
    }
  )

  ipcMain.handle(
    IPC.playerShowCrawl,
    (_e, payload: {
      title?: string
      body?: string
      logoSrc?: string | null
      endSrc?: string | null
      preface?: string | null
    }) => {
    const title = typeof payload?.title === 'string' ? payload.title.trim() : ''
    const body = typeof payload?.body === 'string' ? payload.body : ''
    const logoSrc = typeof payload?.logoSrc === 'string' && payload.logoSrc.trim() ? payload.logoSrc.trim() : null
    const endSrc = typeof payload?.endSrc === 'string' && payload.endSrc.trim() ? payload.endSrc.trim() : null
    const preface = payload?.preface === null ? null : typeof payload?.preface === 'string' ? payload.preface : undefined
    playerState = {
      ...playerState,
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
      video: null
    }
    sendPlayerState()
    showPlayerWindow(undefined, !playerWindowScaleOk)
    return playerState
  })

  ipcMain.handle(
    IPC.playerShowLegend,
    (_e, payload: {
      title?: string
      body?: string
      logoSrc?: string | null
      endSrc?: string | null
      preface?: string | null
    }) => {
    const title = typeof payload?.title === 'string' ? payload.title.trim() : ''
    const body = typeof payload?.body === 'string' ? payload.body : ''
    const logoSrc = typeof payload?.logoSrc === 'string' && payload.logoSrc.trim() ? payload.logoSrc.trim() : null
    const endSrc = typeof payload?.endSrc === 'string' && payload.endSrc.trim() ? payload.endSrc.trim() : null
    const preface = payload?.preface === null ? null : typeof payload?.preface === 'string' ? payload.preface : undefined
    playerState = {
      ...playerState,
      imageSrc: null,
      imageTitle: title || 'Campfire chronicle',
      mapView: null,
      crawl: null,
      legend: {
        title: title || undefined,
        body,
        logoSrc,
        endSrc,
        preface,
        startedAt: Date.now()
      },
      gallery: null,
      video: null
    }
    sendPlayerState()
    showPlayerWindow(undefined, !playerWindowScaleOk)
    return playerState
  })

  ipcMain.handle(IPC.playerClear, () => {
    if (crawlStopTimer) {
      clearTimeout(crawlStopTimer)
      crawlStopTimer = null
    }
    if (legendStopTimer) {
      clearTimeout(legendStopTimer)
      legendStopTimer = null
    }
    playerState = {
      ...playerState,
      imageSrc: null,
      imageTitle: '',
      mapView: null,
      crawl: null,
      legend: null,
      gallery: null,
      video: null
    }
    sendPlayerState()
    return playerState
  })

  ipcMain.handle(IPC.playerStopCrawl, () => {
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
  })

  ipcMain.handle(IPC.playerStopLegend, () => {
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
  })

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
      if (slides.length === 0) return playerState
      const intervalRaw = payload?.intervalSec
      const intervalSec =
        typeof intervalRaw === 'number' && Number.isFinite(intervalRaw) && intervalRaw > 0
          ? Math.min(120, Math.round(intervalRaw))
          : null
      const loop = payload?.loop !== false
      const showTitle = Boolean(payload?.showTitle) && Boolean(title)
      playerState = {
        ...playerState,
        imageSrc: null,
        imageTitle: title || 'Gallery',
        mapView: null,
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
        video: null
      }
      sendPlayerState()
      showPlayerWindow(undefined, !playerWindowScaleOk)
      return playerState
    }
  )

  ipcMain.handle(IPC.playerGallerySetIndex, (_e, index: number) => {
    const gallery = playerState.gallery
    if (!gallery) return playerState
    const next = Math.max(0, Math.min(gallery.slides.length - 1, Math.floor(Number(index) || 0)))
    if (next === gallery.index) return playerState
    playerState = { ...playerState, gallery: { ...gallery, index: next } }
    sendPlayerState()
    return playerState
  })

  ipcMain.handle(IPC.playerStopGallery, () => {
    if (!playerState.gallery) return playerState
    playerState = { ...playerState, gallery: null, imageTitle: '' }
    sendPlayerState()
    return playerState
  })

  ipcMain.handle(
    IPC.playerShowVideo,
    (_e, payload: { title?: string; src?: string; muted?: boolean }) => {
      const title = typeof payload?.title === 'string' ? payload.title.trim() : ''
      const src = typeof payload?.src === 'string' ? payload.src.trim() : ''
      if (!src) return playerState
      playerState = {
        ...playerState,
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
        }
      }
      sendPlayerState()
      showPlayerWindow(undefined, !playerWindowScaleOk)
      return playerState
    }
  )

  ipcMain.handle(IPC.playerStopVideo, () => {
    if (!playerState.video) return playerState
    playerState = { ...playerState, video: null, imageTitle: '' }
    sendPlayerState()
    return playerState
  })

  ipcMain.handle(
    IPC.playerSetInitiative,
    (
      _e,
      payload: { entries: PlayerState['initiative']; show: boolean; round?: number }
    ) => {
      playerState = {
        ...playerState,
        initiative: payload.entries ?? [],
        showInitiative: Boolean(payload.show),
        initiativeRound: Number(payload.round ?? 0)
      }
      sendPlayerState()
      return playerState
    }
  )

  ipcMain.handle(IPC.playerGetState, () => playerState)

  ipcMain.handle(IPC.mixerGet, async () => {
    if (campaignFolder) await refreshMixerLibrary()
    sendMixerState()
    return mixer
  })
  ipcMain.handle(IPC.mixerPlayMusic, (_e, playlistId: string) =>
    runMixer({ type: 'play-music', playlistId: String(playlistId ?? '') })
  )
  ipcMain.handle(IPC.mixerPauseMusic, () => runMixer({ type: 'pause-music' }))
  ipcMain.handle(IPC.mixerSkipMusic, () => runMixer({ type: 'skip-music' }))
  ipcMain.handle(IPC.mixerStopMusic, () => runMixer({ type: 'stop-music' }))
  ipcMain.handle(IPC.mixerPlayAmbience, (_e, playlistId: string) =>
    runMixer({ type: 'play-ambience', playlistId: String(playlistId ?? '') })
  )
  ipcMain.handle(IPC.mixerStopAmbience, () => runMixer({ type: 'stop-ambience' }))
  ipcMain.handle(IPC.mixerOneshot, (_e, path: string) => runMixer({ type: 'oneshot', path: String(path ?? '') }))
  ipcMain.handle(IPC.mixerPlayCrawlMusic, (_e, path: string) =>
    runMixer({ type: 'play-crawl-music', path: String(path ?? '') })
  )
  ipcMain.handle(IPC.mixerArmCrawlMusic, () => runMixer({ type: 'arm-crawl-music' }))
  ipcMain.handle(IPC.mixerStopCrawlMusic, () => runMixer({ type: 'stop-crawl-music' }))
  ipcMain.handle(IPC.mixerStopAll, () => runMixer({ type: 'stop-all' }))
  ipcMain.handle(IPC.mixerSetPrefs, (_e, prefs: Partial<MixerPrefs>) =>
    runMixer({ type: 'set-prefs', prefs: prefs ?? {} })
  )
  ipcMain.handle(IPC.mixerEnded, (_e, layer: 'music' | 'ambience' | 'crawl') =>
    runMixer({
      type: 'ended',
      layer: layer === 'ambience' ? 'ambience' : layer === 'crawl' ? 'crawl' : 'music'
    })
  )
  ipcMain.handle(IPC.mixerError, (_e, message: string | null) =>
    runMixer({ type: 'error', message: typeof message === 'string' && message ? message : null })
  )

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

  ipcMain.handle(IPC.appGetSettings, () => settings)

  ipcMain.handle(IPC.appSaveSettings, (_e, partial: AppSettings) => patchSettings(partial ?? {}))

  ipcMain.handle(IPC.appFolders, () => appFolders())

  ipcMain.handle(IPC.appOpenFolder, (_e, kind: string) => openAppFolder(kind))

  ipcMain.on(IPC.appConfirmClose, () => {
    allowQuit = true
    dmWindow?.close()
  })

  ipcMain.handle(IPC.campaignPickFolder, async () => {
    const result = await showAppOpenDialog({
      title: 'Open campaign folder',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || !result.filePaths[0]) return null
    return setCampaignFolder(result.filePaths[0])
  })

  ipcMain.handle(IPC.campaignOpenPath, async (_e, folder: string) => {
    if (!folder || !existsSync(folder)) return null
    return setCampaignFolder(folder)
  })

  ipcMain.handle(
    IPC.campaignNew,
    async (
      _e,
      systemId?: string,
      themeId?: string,
      options?: { holoPortraits?: boolean; digitalRain?: boolean }
    ) => {
    const system = parseSystemId(systemId)
    const theme = parseThemeId(themeId)
    const result = await showAppOpenDialog({
      title: 'New campaign folder',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || !result.filePaths[0]) return null
    await ensureCampaignLayout(result.filePaths[0])
    await seedNewCampaignFiles(result.filePaths[0], system, theme, options)
    return setCampaignFolder(result.filePaths[0])
  })

  ipcMain.handle(IPC.campaignSetTheme, async (_e, themeId?: string) => {
    if (!campaignFolder) return null
    const campaignPath = join(campaignFolder, 'campaign.json')
    const campaign = await readJson<CampaignFile>(campaignPath, {})
    const theme = parseThemeId(themeId)
    await writeJson(campaignPath, {
      ...campaign,
      theme,
      ...(theme === 'scifi' ? { holoPortraits: true } : {}),
      ...(theme === 'matrix' ? { digitalRain: true } : {})
    })
    return loadCampaign(campaignFolder)
  })

  ipcMain.handle(IPC.campaignSetHoloPortraits, async (_e, enabled?: boolean) => {
    if (!campaignFolder) return null
    const campaignPath = join(campaignFolder, 'campaign.json')
    const campaign = await readJson<CampaignFile>(campaignPath, {})
    await writeJson(campaignPath, { ...campaign, holoPortraits: enabled === true })
    return loadCampaign(campaignFolder)
  })

  ipcMain.handle(IPC.campaignSetDigitalRain, async (_e, enabled?: boolean) => {
    if (!campaignFolder) return null
    const campaignPath = join(campaignFolder, 'campaign.json')
    const campaign = await readJson<CampaignFile>(campaignPath, {})
    await writeJson(campaignPath, { ...campaign, digitalRain: enabled === true })
    return loadCampaign(campaignFolder)
  })

  ipcMain.handle(IPC.campaignOpenSample, async () =>
    setCampaignFolder(await ensureSampleWorkingCopy())
  )

  ipcMain.handle(IPC.campaignGet, async () => {
    if (!campaignFolder) return null
    await prepareCampaignFolder(campaignFolder)
    return loadCampaign(campaignFolder)
  })

  ipcMain.handle(IPC.campaignReadFile, async (_e, relativePath: string) => {
    if (!campaignFolder) return ''
    return readFile(safeJoin(campaignFolder, relativePath), 'utf8')
  })

  ipcMain.handle(IPC.campaignSaveFile, async (_e, relativePath: string, markdown: string) => {
    if (!campaignFolder) return
    await writeFile(safeJoin(campaignFolder, relativePath), markdown, 'utf8')
  })

  ipcMain.handle(IPC.campaignSaveCombat, async (_e, combat: CombatState) => {
    if (!campaignFolder) return null
    await writeJson(join(campaignFolder, 'combat.json'), combat)
    return loadCampaign(campaignFolder)
  })

  ipcMain.handle(
    IPC.campaignCreateNote,
    async (
      _e,
      folder: string,
      name: string,
      template: SheetTemplateKind = 'blank',
      mapImage?: CreateNoteMapImage | null
    ) => createCampaignNote(folder ?? '', name, template, mapImage)
  )

  ipcMain.handle(IPC.campaignPickImage, async () => {
    const result = await showAppOpenDialog({
      title: 'Load image',
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'] },
        { name: 'All files', extensions: ['*'] }
      ]
    })
    if (result.canceled || !result.filePaths[0]) return null
    const filePath = result.filePaths[0]
    return { filePath, fileName: basename(filePath) }
  })

  ipcMain.handle(
    IPC.campaignSaveToLibrary,
    async (_e, folder: CampaignLibraryFolder, name: string, contents: string, subfolder?: string | null) =>
      saveToCampaignLibrary(folder, name, contents, subfolder)
  )

  ipcMain.handle(IPC.campaignSetPortrait, async (_e, relativePath: string, image: CreateNoteMapImage) =>
    setNotePortrait(relativePath, image)
  )

  ipcMain.handle(
    IPC.campaignCopyArt,
    async (_e, relativePath: string, image: CreateNoteMapImage, name?: string) => {
      if (!campaignFolder) return null
      const dest = safeJoin(campaignFolder, relativePath)
      if (!existsSync(dest)) return null
      const folder = toPosix(relative(campaignFolder, dirname(dest)))
      const fallback =
        image.kind === 'existing'
          ? basename(image.path)
          : image.kind === 'import'
            ? basename(image.filePath)
            : image.id
      const title = sanitizeFileName((name || fallback).replace(/\.[^.]+$/, ''))
      const fileName = await copyImageToArtFolder(folder, title, image)
      if (!fileName) return null
      return { campaign: await loadCampaign(campaignFolder), fileName }
    }
  )

  ipcMain.handle(IPC.campaignDuplicateFile, async (_e, relativePath: string, name?: string) =>
    duplicateCampaignFile(relativePath, name)
  )

  ipcMain.handle(IPC.campaignAddFiles, async (_e, folder: string, mode?: 'files' | 'art') =>
    addCampaignFiles(folder ?? '', mode === 'art' ? 'art' : 'files')
  )

  ipcMain.handle(IPC.campaignDeleteFile, async (_e, relativePath: string) =>
    deleteCampaignFile(relativePath)
  )

  ipcMain.handle(IPC.booksLoad, () => loadBookLibrary())
  ipcMain.handle(IPC.booksOpenFolder, () => openBooksFolder())
}

app.whenReady().then(async () => {
  app.setAppUserModelId('com.tabledm.app')
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => {
    callback(true)
  })
  session.defaultSession.setPermissionCheckHandler(() => true)
  await migrateLegacyUserData()
  await removeDroppedAppSamples()
  await ensureBooksHome()

  registerMediaProtocol({ getCampaignFolder: () => campaignFolder, safeJoin })

  configureCampaignNotes({
    getCampaignFolder: () => campaignFolder,
    samePath,
    openFiles: (options) => showAppOpenDialog(options),
    onCampaignFilesChanged: async () => {
      await refreshMixerLibrary()
      sendMixerState()
    }
  })

  registerIpc()

  settings = await readSettings()
  const recents = (settings.recentCampaigns ?? []).filter((item) => !isDroppedAppSample(item.folder))
  if (recents.length !== (settings.recentCampaigns ?? []).length) {
    await patchSettings({ recentCampaigns: recents })
  }
  setupAppUpdater({
    getWindow: () => dmWindow,
    readDismissed: () => settings.dismissedUpdateVersion,
    writeDismissed: (version) => {
      void patchSettings({ dismissedUpdateVersion: version })
    },
    beforeQuitAndInstall: () => {
      allowQuit = true
    }
  })
  const sampleFolder = await ensureSampleWorkingCopy()
  const existing =
    settings.campaignFolder && existsSync(settings.campaignFolder) ? settings.campaignFolder : null
  if (existing) {
    campaignFolder =
      samePath(existing, sampleSourcePath()) || samePath(existing, sampleFolder)
        ? sampleFolder
        : existing
    if (campaignFolder !== settings.campaignFolder) {
      await patchSettings({ campaignFolder })
    }
  } else {
    campaignFolder = sampleFolder
    await patchSettings({ campaignFolder })
  }
  if (campaignFolder) {
    await prepareCampaignFolder(campaignFolder)
    const info = await loadCampaign(campaignFolder)
    playerState = {
      ...emptyPlayerState(),
      campaignTitle: info.name
    }
    await loadMixerForCampaign(campaignFolder)
  }

  createDmWindow()
  watchDisplays()
  scheduleLaunchUpdateCheck()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createDmWindow()
      syncPlayerWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
