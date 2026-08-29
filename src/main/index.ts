import { app, BrowserWindow, dialog, ipcMain, protocol, screen, session, shell } from 'electron'
import { existsSync } from 'node:fs'
import { copyFile, cp, mkdir, readdir, readFile, rename, rm, stat, unlink, writeFile } from 'node:fs/promises'
import { join, normalize, relative, basename, dirname, extname, isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'
import type {
  AppSettings,
  CampaignInfo,
  CampaignTreeNode,
  Character,
  CombatState,
  CreateNoteMapImage,
  DisplayInfo,
  MediaItem,
  PlayerState,
  RecentCampaign,
  SessionFile
} from '../shared/types'
import { emptyCombat, emptyPlayerState, emptySettings } from '../shared/types'
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
import {
  IMAGE_EXT,
  findSrdItemFile,
  findSrdPortraitFile,
  findSrdSchoolFile,
  findStockArtFile,
  registerMediaProtocol
} from './mediaAssets'
import { mapArtRelativeFolder, setMapFenceImage } from '../shared/mapCreate'
import {
  playerOutputScaleMismatch,
  playerWindowNeedsRebuild,
  shouldShowPlayerWindow
} from '../shared/playerWindow'
import { digitalRainEnabled, holoPortraitsEnabled, parseThemeId, THEME_WINDOW_BACKGROUND } from '../shared/theme'
import { isAllowedExternalUrl } from '../shared/externalLinks'
import { APP_NAME, APP_VERSION } from '../shared/version'
import { CRAWL_FADE_OUT_MS } from '../shared/openingCrawl'
import {
  LIBRARY_FOLDER_NAMES,
  STANDARD_LAYOUT,
  artFolderRelativePath,
  folderMatchesCanonical,
  folderOrderIndex,
  gearSectionIndex,
  campaignTreeGroup,
  isArtFolderName,
  isHiddenCampaignFile,
  isNpcFolderName,
  isPartyFolderName,
  isSessionsFolderName,
  pathHasFolder,
  shouldHideFromFileTree,
  shouldSkipCampaignDir,
  type CampaignLibraryFolder
} from '../shared/campaignLayout'
import {
  TEMPLATE_FILE_NAMES,
  displayTitle,
  fillTemplate,
  gameNightSheetFileStem,
  rewriteDuplicatedMarkdown,
  sanitizeFileName,
  type SheetTemplateKind
} from '../shared/sheetTemplates'
import { templatesFor } from '../shared/systemTemplates'
import { getSystemPack, overviewMarkdown, parseSystemId, type SystemId } from '../shared/systemPack'
import { setSheetPortraitEmbed, sheetAcceptsPortrait } from '../shared/sheetPortrait'
import { matchStockArt } from '../shared/stockArt'
import {
  applyShopInventory,
  generateShopInventory,
  looksLikeShopNote,
  resolveShopCatalog,
  setShopTypeFields
} from '../shared/shopStock'
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

function sampleSourcePath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'examples', 'greystead')
    : join(__dirname, '../../examples/greystead')
}

function sampleWorkingPath(): string {
  return join(app.getPath('userData'), 'samples', 'greystead')
}

function isDroppedAppSample(folder: string): boolean {
  const samples = join(app.getPath('userData'), 'samples')
  const rel = relative(samples, folder)
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) return false
  const top = rel.split(/[\\/]/)[0] ?? ''
  return top.toLowerCase().replace(/[\s_]+/g, '-') === 'bad-blood'
}

async function removeDroppedAppSamples(): Promise<void> {
  const root = join(app.getPath('userData'), 'samples')
  if (!existsSync(root)) return
  for (const name of await readdir(root)) {
    const folder = join(root, name)
    if (!isDroppedAppSample(folder)) continue
    await rm(folder, { recursive: true, force: true })
  }
}

async function readSampleRevision(folder: string): Promise<number> {
  const file = join(folder, 'campaign.json')
  if (!existsSync(file)) return 0
  try {
    const data = JSON.parse(await readFile(file, 'utf8')) as { sampleRevision?: unknown }
    return typeof data.sampleRevision === 'number' && Number.isFinite(data.sampleRevision)
      ? Math.floor(data.sampleRevision)
      : 0
  } catch {
    return 0
  }
}

async function ensureSampleWorkingCopy(): Promise<string> {
  const source = sampleSourcePath()
  const dest = sampleWorkingPath()
  const sourceRevision = await readSampleRevision(source)
  const destRevision = existsSync(dest) ? await readSampleRevision(dest) : 0
  if (!existsSync(dest) || destRevision < sourceRevision) {
    if (existsSync(dest)) await rm(dest, { recursive: true, force: true })
    await mkdir(dirname(dest), { recursive: true })
    await cp(source, dest, { recursive: true })
  }
  return dest
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
    dmWindow?.webContents.send('app:will-close')
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
  dmWindow?.webContents.send('player:window', playerWindowVisible())
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
    playerWindow?.webContents.send('player:state', playerState)
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
  playerWindow?.webContents.send('player:state', playerState)
  dmWindow?.webContents.send('player:state', playerState)
}

function sendMixerState(): void {
  dmWindow?.webContents.send('mixer:state', mixer)
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
  dmWindow?.webContents.send('app:displays-changed', listDisplays())
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

function safeJoin(root: string, ...parts: string[]): string {
  const full = normalize(join(root, ...parts))
  const rel = relative(normalize(root), full)
  if (rel.startsWith('..')) {
    throw new Error('Invalid path')
  }
  return full
}

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true })
}

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch {
    return fallback
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(value, null, 2), 'utf8')
}

async function listJsonCharacters(dir: string): Promise<Character[]> {
  if (!existsSync(dir)) return []
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort()
  const out: Character[] = []
  for (const file of files) {
    const data = await readJson<Partial<Character>>(join(dir, file), {})
    if (!data.name) continue
    out.push({
      id: data.id ?? file.replace(/\.json$/, ''),
      name: data.name,
      ac: Number(data.ac ?? 10),
      hp: Number(data.hp ?? data.maxHp ?? 10),
      maxHp: Number(data.maxHp ?? data.hp ?? 10),
      passivePerception: data.passivePerception,
      notes: data.notes,
      classLevel: data.classLevel
    })
  }
  return out
}

async function collectMedia(root: string, dir: string, acc: MediaItem[]): Promise<void> {
  if (!existsSync(dir)) return
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await collectMedia(root, full, acc)
      continue
    }
    const ext = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase()
    if (!IMAGE_EXT.has(ext)) continue
    const rel = relative(join(root, 'media'), full).replaceAll('\\', '/')
    acc.push({
      relativePath: rel,
      name: entry.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      url: `tabledm://media/${rel.split('/').map(encodeURIComponent).join('/')}`
    })
  }
}

function extOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

function sortNodes(nodes: CampaignTreeNode[]): CampaignTreeNode[] {
  return nodes.sort((a, b) => {
    const group = campaignTreeGroup(a.type, a.name) - campaignTreeGroup(b.type, b.name)
    if (group) return group
    const ai = folderOrderIndex(a.name)
    const bi = folderOrderIndex(b.name)
    if (ai !== bi) return ai - bi
    const ga = gearSectionIndex(a.name)
    const gb = gearSectionIndex(b.name)
    if (ga !== gb) return ga - gb
    return a.name.localeCompare(b.name)
  })
}

async function listTree(root: string, dir: string, depth = 0): Promise<CampaignTreeNode[]> {
  if (depth > 6 || !existsSync(dir)) return []
  const entries = await readdir(dir, { withFileTypes: true })
  const nodes: CampaignTreeNode[] = []
  for (const entry of entries) {
    if (shouldHideFromFileTree(entry.name)) continue
    const full = join(dir, entry.name)
    const relativePath = relative(root, full).replaceAll('\\', '/')
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        relativePath,
        type: 'dir',
        children: await listTree(root, full, depth + 1)
      })
      continue
    }
    nodes.push({
      name: entry.name,
      relativePath,
      type: 'file',
      ext: extOf(entry.name)
    })
  }
  return sortNodes(nodes)
}

async function findChildDir(
  root: string,
  match: (name: string) => boolean,
  fallback: string
): Promise<string> {
  if (!existsSync(root)) return join(root, fallback)
  const entries = await readdir(root, { withFileTypes: true })
  const found = entries.find((entry) => entry.isDirectory() && match(entry.name))
  return join(root, found?.name ?? fallback)
}

async function existingCanonicalDir(root: string, canonical: string): Promise<string | null> {
  if (!existsSync(root)) return null
  const entries = await readdir(root, { withFileTypes: true })
  const found = entries.find((entry) => entry.isDirectory() && folderMatchesCanonical(entry.name, canonical))
  return found ? join(root, found.name) : null
}

async function campaignHasCoreFolders(root: string): Promise<boolean> {
  for (const key of ['sessions', 'party', 'npcs', 'bestiary']) {
    if (await existingCanonicalDir(root, key)) return true
  }
  return false
}

async function ensureCampaignLayout(root: string): Promise<void> {
  for (const item of STANDARD_LAYOUT) {
    const dir = (await existingCanonicalDir(root, item.canonical)) ?? join(root, item.name)
    await ensureDir(dir)
    for (const extra of item.extras) {
      await ensureDir(join(dir, extra))
      if (item.canonical === 'gear') await ensureDir(join(dir, extra, 'Art'))
    }
    if (item.canonical === 'audio') {
      for (const mood of ['Combat', 'Creepy', 'General']) {
        await ensureDir(join(dir, 'Music', mood))
      }
    }
  }
}

async function migrateRootOverviewToStartHere(root: string): Promise<void> {
  const destDir = (await existingCanonicalDir(root, 'start here')) ?? join(root, 'Start Here')
  const dest = join(destDir, 'Overview.md')
  if (existsSync(dest)) return
  const source = join(root, 'Overview.md')
  if (!existsSync(source)) return
  await ensureDir(destDir)
  await rename(source, dest)
}

async function readCampaignSystem(root: string): Promise<SystemId> {
  const json = await readJson<{ system?: string }>(join(root, 'campaign.json'), {})
  return parseSystemId(json.system)
}

async function packTemplates(root: string): Promise<ReturnType<typeof templatesFor>> {
  return templatesFor(await readCampaignSystem(root))
}

type CampaignFile = {
  name?: string
  system?: string
  theme?: string
  holoPortraits?: boolean
  digitalRain?: boolean
}

async function seedNewCampaignFiles(
  root: string,
  system: SystemId = 'dnd5e',
  theme?: string,
  options?: { holoPortraits?: boolean; digitalRain?: boolean }
): Promise<void> {
  const title = basename(root)
  await migrateRootOverviewToStartHere(root)
  const startHere = (await existingCanonicalDir(root, 'start here')) ?? join(root, 'Start Here')
  const overview = join(startHere, 'Overview.md')
  if (!existsSync(overview)) {
    await ensureDir(startHere)
    await writeFile(overview, overviewMarkdown(system, title), 'utf8')
  }
  const campaignPath = join(root, 'campaign.json')
  const prior = existsSync(campaignPath) ? await readJson<CampaignFile>(campaignPath, {}) : {}
  const nextTheme = parseThemeId(theme ?? prior.theme)
  await writeJson(campaignPath, {
    ...prior,
    name: prior.name ?? title,
    system,
    theme: nextTheme,
    holoPortraits: nextTheme === 'scifi' ? options?.holoPortraits !== false : prior.holoPortraits,
    digitalRain: nextTheme === 'matrix' ? options?.digitalRain !== false : prior.digitalRain
  })
  await refreshStockNightSheetTemplate(root)
}

async function listPartyNoteStems(root: string): Promise<string[]> {
  const dir = await existingCanonicalDir(root, 'party')
  if (!dir || !existsSync(dir)) return []
  const entries = await readdir(dir, { withFileTypes: true })
  const stems: string[] = []
  for (const entry of entries) {
    if (!entry.isFile() || isHiddenCampaignFile(entry.name)) continue
    const ext = extname(entry.name).toLowerCase()
    if (ext !== '.md' && ext !== '.markdown' && ext !== '.txt') continue
    stems.push(basename(entry.name, ext))
  }
  return stems
}

async function refreshStockNightSheetTemplate(root: string): Promise<void> {
  const templatesDir = await existingCanonicalDir(root, 'templates')
  if (!templatesDir) return
  const entries = await readdir(templatesDir)
  const wanted = new Set(TEMPLATE_FILE_NAMES.nightsheet)
  const matches = entries.filter((name) => wanted.has(name.toLowerCase()))
  const dest = join(templatesDir, 'Game Night Sheet.md')
  const preferred = matches.find((name) => name.toLowerCase() === 'game night sheet.md')
  const currentPath = preferred ? join(templatesDir, preferred) : matches[0] ? join(templatesDir, matches[0]) : null
  if (!currentPath) {
    await writeFile(dest, (await packTemplates(root)).nightsheet, 'utf8')
    return
  }
  const current = await readFile(currentPath, 'utf8')
  const alreadyCurrent =
    current.includes('{{party}}') &&
    current.includes('{{crawl}}') &&
    current.includes('{{legend}}') &&
    current.includes('# Session Name — Game Night Sheet') &&
    current.includes('## 1. The Party') &&
    current.includes('[!party]') &&
    current.includes('[!scene]') &&
    !current.includes('What this page does') &&
    !current.includes('## 4. NPCs') &&
    !current.includes('## 3. Secrets and clues') &&
    !current.includes('## 3. From last time') &&
    !current.includes('## 4. Likely endings') &&
    current.includes('**At the table**')
  if (!alreadyCurrent) {
    const stock =
      current.includes('{{party}}') ||
      current.includes('Numbers and cues for behind the screen') ||
      current.includes('Combat 1 — name the encounter') ||
      current.includes('## 1. The characters') ||
      current.includes('## 5. Locations') ||
      current.includes('## 4. NPCs') ||
      current.includes('## 3. Secrets and clues') ||
      current.includes('## 4. Treasure') ||
      current.includes('## 3. From last time') ||
      current.includes('## 4. Likely endings') ||
      (current.includes('[!scene]') && !current.includes('**At the table**')) ||
      (current.includes('## 1. The Party') && !current.includes('[!party]'))
    if (stock) await writeFile(dest, (await packTemplates(root)).nightsheet, 'utf8')
  } else if (currentPath !== dest) {
    await writeFile(dest, current, 'utf8')
  }
  for (const name of matches) {
    if (name.toLowerCase() === 'game night sheet.md') continue
    const extra = join(templatesDir, name)
    const text = extra === currentPath ? current : await readFile(extra, 'utf8')
    const stock =
      text.includes('{{party}}') ||
      text.includes('Numbers and cues for behind the screen') ||
      text.includes('Combat 1 — name the encounter') ||
      text.includes('## 1. The characters') ||
      text.includes('## 5. Locations') ||
      text.includes('## 4. NPCs') ||
      text.includes('## 3. Secrets and clues') ||
      text.includes('## 4. Treasure') ||
      text.includes('## 3. From last time') ||
      text.includes('## 4. Likely endings') ||
      (text.includes('[!scene]') && !text.includes('**At the table**')) ||
      (text.includes('## 1. The Party') && !text.includes('[!party]'))
    if (stock) await unlink(extra)
  }
}

async function refreshStockCreatureTemplates(root: string): Promise<void> {
  const templatesDir = await existingCanonicalDir(root, 'templates')
  if (!templatesDir) return
  const entries = await readdir(templatesDir)
  const jobs: { kind: 'player' | 'npc' | 'monster' | 'gear' | 'spell' | 'place' | 'shop' | 'faction'; dest: string; stock: string }[] = [
    { kind: 'player', dest: 'Player.md', stock: '# *Character Name*' },
    { kind: 'npc', dest: 'NPC.md', stock: '# *NPC Name*' },
    { kind: 'monster', dest: 'Monster.md', stock: '# Monster Name' },
    { kind: 'gear', dest: 'Gear.md', stock: '# Item Name' },
    { kind: 'spell', dest: 'Spell.md', stock: '# Spell Name' },
    { kind: 'place', dest: 'Place.md', stock: '# Place Name' },
    { kind: 'shop', dest: 'Shop.md', stock: '# Shop Name' },
    { kind: 'faction', dest: 'Faction.md', stock: '# Faction Name' }
  ]
  for (const job of jobs) {
    const wanted = new Set(TEMPLATE_FILE_NAMES[job.kind])
    const matches = entries.filter((name) => wanted.has(name.toLowerCase()))
    const dest = join(templatesDir, job.dest)
    const preferred = matches.find((name) => name.toLowerCase() === job.dest.toLowerCase())
    const currentPath = preferred
      ? join(templatesDir, preferred)
      : matches[0]
        ? join(templatesDir, matches[0])
        : null
    if (!currentPath) {
      await writeFile(dest, (await packTemplates(root))[job.kind], 'utf8')
      continue
    }
    const current = await readFile(currentPath, 'utf8')
    if (current.includes(job.stock)) {
      await writeFile(dest, (await packTemplates(root))[job.kind], 'utf8')
      if (currentPath !== dest) await unlink(currentPath)
    }
  }
}

async function prepareCampaignFolder(root: string): Promise<void> {
  const hadCore = await campaignHasCoreFolders(root)
  await ensureCampaignLayout(root)
  await migrateRootOverviewToStartHere(root)
  if (!hadCore) await seedNewCampaignFiles(root)
  else {
    await refreshStockNightSheetTemplate(root)
    await refreshStockCreatureTemplates(root)
  }
}

async function listSessions(dir: string): Promise<SessionFile[]> {
  if (!existsSync(dir)) return []
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort().reverse()
  const folderName = basename(dir)
  return files.map((file) => ({
    relativePath: `${folderName}/${file}`.replaceAll('\\', '/'),
    name: file.replace(/\.md$/, '').replace(/[-_]/g, ' ')
  }))
}

async function loadCampaign(folder: string): Promise<CampaignInfo> {
  const fallbackName = basename(folder)
  const campaign = await readJson<CampaignFile>(join(folder, 'campaign.json'), {})
  const name =
    campaign.name && campaign.name !== 'Untitled campaign' ? campaign.name : fallbackName
  const system = parseSystemId(campaign.system)
  const theme = parseThemeId(campaign.theme)
  if (campaign.name !== name || campaign.system !== system) {
    await writeJson(join(folder, 'campaign.json'), { ...campaign, name, system })
  }
  const loaded = await readJson<CombatState>(join(folder, 'combat.json'), emptyCombat())
  const combat: CombatState = { ...emptyCombat(), ...loaded, round: loaded.round ?? 0 }

  const media: MediaItem[] = []
  await collectMedia(folder, join(folder, 'media'), media)

  return {
    folder,
    name,
    system,
    theme,
    holoPortraits: holoPortraitsEnabled(theme, campaign.holoPortraits),
    digitalRain: digitalRainEnabled(theme, campaign.digitalRain),
    media,
    sessions: await listSessions(await findChildDir(folder, isSessionsFolderName, 'Sessions')),
    party: await listJsonCharacters(await findChildDir(folder, isPartyFolderName, 'Party')),
    npcs: await listJsonCharacters(await findChildDir(folder, isNpcFolderName, 'NPCs')),
    combat,
    tree: await listTree(folder, folder)
  }
}

function uniqueFileName(dir: string, fileName: string): string {
  const ext = extname(fileName)
  const stem = ext ? fileName.slice(0, -ext.length) : fileName
  let candidate = fileName
  let n = 2
  while (existsSync(join(dir, candidate))) {
    candidate = `${stem} ${n}${ext}`
    n += 1
  }
  return candidate
}

function toPosix(path: string): string {
  return path.replaceAll('\\', '/')
}

async function copyImageToArtFolder(
  noteFolder: string,
  title: string,
  choice: CreateNoteMapImage
): Promise<string | null> {
  if (!campaignFolder) return null
  const source =
    choice.kind === 'existing'
      ? safeJoin(campaignFolder, toPosix(choice.path).replace(/^\/+/, ''))
      : choice.kind === 'stock'
        ? findStockArtFile(choice.id)
        : choice.filePath
  if (!source) return null
  const ext = extname(source).toLowerCase()
  if (!existsSync(source) || !IMAGE_EXT.has(ext)) return null
  const artRel = artFolderRelativePath(noteFolder)
  const artDir = safeJoin(campaignFolder, artRel)
  await ensureDir(artDir)
  const destName = `${sanitizeFileName(displayTitle(title))}${ext}`
  const dest = join(artDir, destName)
  if (!samePath(source, dest)) await copyFile(source, dest)
  return destName
}

async function setNotePortrait(
  relativePath: string,
  image: CreateNoteMapImage
): Promise<{ campaign: CampaignInfo; path: string; markdown: string } | null> {
  if (!campaignFolder) return null
  const dest = safeJoin(campaignFolder, relativePath)
  if (!existsSync(dest)) return null
  const folder = toPosix(relative(campaignFolder, dirname(dest)))
  const stem = displayTitle(basename(dest, extname(dest)))
  const imageFile = await copyImageToArtFolder(folder, stem, image)
  if (!imageFile) return null
  let markdown = setSheetPortraitEmbed(await readFile(dest, 'utf8'), imageFile)
  if (image.kind === 'stock' && looksLikeShopNote(markdown) && getSystemPack(await readCampaignSystem(campaignFolder)).shopsEnabled) {
    const catalog = resolveShopCatalog(image.id)
    markdown = setShopTypeFields(markdown, catalog, false)
  }
  await writeFile(dest, markdown, 'utf8')
  return { campaign: await loadCampaign(campaignFolder), path: toPosix(relative(campaignFolder, dest)), markdown }
}

async function resolveCreateMapImage(
  noteFolder: string,
  title: string,
  choice: CreateNoteMapImage
): Promise<string | null> {
  if (!campaignFolder) return null
  if (choice.kind === 'existing') {
    const rel = toPosix(choice.path).replace(/^\/+/, '')
    return rel || null
  }
  const source = choice.kind === 'stock' ? findStockArtFile(choice.id) : choice.filePath
  if (!source) return null
  const ext = extname(source).toLowerCase()
  if (!existsSync(source) || !IMAGE_EXT.has(ext)) return null
  const artRel = mapArtRelativeFolder(noteFolder)
  const artDir = safeJoin(campaignFolder, artRel)
  await ensureDir(artDir)
  const destName = uniqueFileName(artDir, `${sanitizeFileName(title)}${ext}`)
  await copyFile(source, join(artDir, destName))
  return destName
}

async function findTemplateSource(root: string, kind: Exclude<SheetTemplateKind, 'blank'>): Promise<string> {
  const wanted = new Set(TEMPLATE_FILE_NAMES[kind])
  const walk = async (dir: string, depth: number): Promise<string | null> => {
    if (depth > 4 || !existsSync(dir)) return null
    const entries = await readdir(dir, { withFileTypes: true })
    const inTemplates = /templates$/i.test(basename(dir))
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (shouldSkipCampaignDir(entry.name)) continue
        const found = await walk(full, depth + 1)
        if (found) return found
        continue
      }
      if (!inTemplates && !/templates/i.test(relative(root, full))) continue
      if (wanted.has(entry.name.toLowerCase())) return readFile(full, 'utf8')
    }
    return null
  }
  return (await walk(root, 0)) ?? (await packTemplates(root))[kind]
}

function noteFileName(folder: string, name: string, template: SheetTemplateKind): string {
  let stem = sanitizeFileName(name)
  stem = stem.replace(/\.md$/i, '')
  if (template === 'player' && folder && pathHasFolder(folder, 'party') && !/^pc\s*[—–-]/i.test(stem)) {
    stem = `PC — ${stem}`
  }
  if (template === 'nightsheet') stem = gameNightSheetFileStem(stem)
  return `${stem}.md`
}

async function findLayoutFolder(canonical: CampaignLibraryFolder): Promise<string> {
  const fallback = LIBRARY_FOLDER_NAMES[canonical]
  if (!campaignFolder) return fallback
  const entries = await readdir(campaignFolder, { withFileTypes: true })
  const match = entries.find((entry) => entry.isDirectory() && folderMatchesCanonical(entry.name, canonical))
  return match?.name ?? fallback
}

async function saveToCampaignLibrary(
  folderKey: CampaignLibraryFolder,
  name: string,
  contents: string,
  subfolder?: string | null
): Promise<{ campaign: CampaignInfo; path: string; existed: boolean } | null> {
  if (!campaignFolder) return null
  const body = contents.trim()
  if (!body) return null
  const folder = await findLayoutFolder(folderKey)
  const destDir = subfolder
    ? safeJoin(campaignFolder, folder, subfolder)
    : safeJoin(campaignFolder, folder)
  await ensureDir(destDir)
  const template: SheetTemplateKind =
    folderKey === 'bestiary' ? 'monster' : folderKey === 'spells' ? 'spell' : 'gear'
  const fileName = noteFileName(folder, name, template)
  const dest = join(destDir, fileName)
  const relativePath = toPosix(relative(campaignFolder, dest))
  if (existsSync(dest)) {
    return { campaign: await loadCampaign(campaignFolder), path: relativePath, existed: true }
  }
  await writeFile(dest, body.endsWith('\n') ? body : `${body}\n`, 'utf8')
  if (folderKey === 'bestiary') await copySrdArtToFolder(name, destDir, 'portrait')
  if (folderKey === 'gear') await copySrdArtToFolder(name, destDir, 'item')
  if (folderKey === 'spells') {
    const school = schoolFromSpellMarkdown(body)
    if (school) await copySrdArtToFolder(school, destDir, 'school')
  }
  return { campaign: await loadCampaign(campaignFolder), path: relativePath, existed: false }
}

async function copySrdArtToFolder(
  name: string,
  noteDir: string,
  kind: 'portrait' | 'item' | 'school'
): Promise<void> {
  const source =
    kind === 'item' ? findSrdItemFile(name) : kind === 'school' ? findSrdSchoolFile(name) : findSrdPortraitFile(name)
  if (!source || !campaignFolder) return
  const artDir = join(noteDir, 'Art')
  await ensureDir(artDir)
  const destName = `${sanitizeFileName(name)}${extname(source)}`
  const dest = join(artDir, destName)
  if (existsSync(dest)) return
  await copyFile(source, dest)
}

function schoolFromSpellMarkdown(contents: string): string | null {
  const match = contents.match(
    /\b(Abjuration|Conjuration|Divination|Enchantment|Evocation|Illusion|Necromancy|Transmutation)\b/i
  )
  if (!match) return null
  const school = match[1]
  return school.charAt(0).toUpperCase() + school.slice(1).toLowerCase()
}

async function createCampaignNote(
  folder: string,
  name: string,
  template: SheetTemplateKind,
  mapImage?: CreateNoteMapImage | null
): Promise<{ campaign: CampaignInfo; path: string } | null> {
  if (!campaignFolder) return null
  const destDir = folder ? safeJoin(campaignFolder, folder) : campaignFolder
  await ensureDir(destDir)
  const fileName = uniqueFileName(destDir, noteFileName(folder, name, template))
  const dest = join(destDir, fileName)
  const title = sanitizeFileName(name).replace(/\.md$/i, '')
  let body = `# ${title.replace(/^pc\s*[—–-]\s*/i, '')}\n`
  if (template !== 'blank') {
    if (template === 'nightsheet') await refreshStockNightSheetTemplate(campaignFolder)
    const extras =
      template === 'nightsheet'
        ? {
            partyStems: await listPartyNoteStems(campaignFolder),
            theme: (await readJson<{ theme?: string }>(join(campaignFolder, 'campaign.json'), {})).theme
          }
        : undefined
    body = fillTemplate(await findTemplateSource(campaignFolder, template), template, title, extras)
  }
  if (template === 'map' && mapImage) {
    const imageFile = await resolveCreateMapImage(folder, title.replace(/^pc\s*[—–-]\s*/i, ''), mapImage)
    if (imageFile) body = setMapFenceImage(body, imageFile)
  }
  let artChoice = mapImage
  if (
    !artChoice &&
    (template === 'place' || template === 'shop' || template === 'faction')
  ) {
    const hit = matchStockArt(
      title,
      template === 'faction' ? 'faction' : template === 'shop' ? 'shop' : 'place'
    )
    if (hit) artChoice = { kind: 'stock', id: hit.id }
  }
  if (sheetAcceptsPortrait(template) && artChoice) {
    const imageFile = await copyImageToArtFolder(folder, displayTitle(basename(fileName, '.md')), artChoice)
    if (imageFile) body = setSheetPortraitEmbed(body, imageFile)
  }
  const pack = getSystemPack(await readCampaignSystem(campaignFolder))
  if (template === 'shop' && pack.shopsEnabled) {
    const typeId =
      artChoice?.kind === 'stock' ? artChoice.id : (matchStockArt(title, 'shop')?.id ?? 'General Store')
    body = applyShopInventory(body, generateShopInventory(typeId))
  }
  await writeFile(dest, body, 'utf8')
  if (pack.id === 'dnd5e' && template === 'monster') {
    await copySrdArtToFolder(title.replace(/^pc\s*[—–-]\s*/i, ''), destDir, 'portrait')
  }
  if (pack.id === 'dnd5e' && template === 'gear') {
    await copySrdArtToFolder(title.replace(/^pc\s*[—–-]\s*/i, ''), destDir, 'item')
  }
  const relativePath = toPosix(relative(campaignFolder, dest))
  return { campaign: await loadCampaign(campaignFolder), path: relativePath }
}

async function duplicateCampaignFile(
  relativePath: string,
  name?: string
): Promise<{ campaign: CampaignInfo; path: string } | null> {
  if (!campaignFolder) return null
  const source = safeJoin(campaignFolder, relativePath)
  if (!existsSync(source)) return null
  const dir = dirname(source)
  const ext = extname(source)
  const stem = basename(source, ext)
  const wanted = name?.trim()
    ? sanitizeFileName(name).replace(/\.[^.]+$/, '') + ext
    : `${stem} copy${ext}`
  const fileName = uniqueFileName(dir, wanted)
  const dest = join(dir, fileName)
  if (ext.toLowerCase() === '.md' || ext.toLowerCase() === '.markdown' || ext.toLowerCase() === '.txt') {
    const text = await readFile(source, 'utf8')
    await writeFile(dest, rewriteDuplicatedMarkdown(text, stem, basename(fileName, ext)), 'utf8')
  } else {
    await copyFile(source, dest)
  }
  return { campaign: await loadCampaign(campaignFolder), path: toPosix(relative(campaignFolder, dest)) }
}

async function addCampaignFiles(
  folder: string,
  mode: 'files' | 'art' = 'files'
): Promise<{ campaign: CampaignInfo; paths: string[] } | null> {
  if (!campaignFolder) return null
  const destRel = mode === 'art' ? artFolderRelativePath(folder) : folder.replaceAll('\\', '/')
  const imagesOnly = mode === 'art' || isArtFolderName(basename(destRel || '.'))
  const result = await showAppOpenDialog({
    title: imagesOnly ? 'Add art' : 'Add files to campaign',
    properties: ['openFile', 'multiSelections'],
    filters: imagesOnly
      ? [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] },
          { name: 'All files', extensions: ['*'] }
        ]
      : [
          {
            name: 'Notes, art, and audio',
            extensions: [
              'md',
              'markdown',
              'txt',
              'png',
              'jpg',
              'jpeg',
              'webp',
              'gif',
              'pdf',
              'mp3',
              'ogg',
              'wav',
              'm4a',
              'flac',
              'webm',
              'aac',
              'mp4',
              'mov',
              'm4v'
            ]
          },
          { name: 'Audio', extensions: ['mp3', 'ogg', 'wav', 'm4a', 'flac', 'webm', 'aac'] },
          { name: 'All files', extensions: ['*'] }
        ]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const destDir = destRel ? safeJoin(campaignFolder, destRel) : campaignFolder
  await ensureDir(destDir)
  const paths: string[] = []
  for (const source of result.filePaths) {
    const fileName = uniqueFileName(destDir, sanitizeFileName(basename(source), basename(source)))
    const dest = join(destDir, fileName)
    await copyFile(source, dest)
    paths.push(toPosix(relative(campaignFolder, dest)))
  }
  await refreshMixerLibrary()
  sendMixerState()
  return { campaign: await loadCampaign(campaignFolder), paths }
}

async function deleteCampaignFile(
  relativePath: string
): Promise<{ campaign: CampaignInfo; path: string } | null> {
  if (!campaignFolder) return null
  const dest = safeJoin(campaignFolder, relativePath)
  if (!existsSync(dest)) {
    return { campaign: await loadCampaign(campaignFolder), path: relativePath }
  }
  const info = await stat(dest)
  if (!info.isFile()) return null
  await unlink(dest)
  await refreshMixerLibrary()
  sendMixerState()
  return { campaign: await loadCampaign(campaignFolder), path: toPosix(relative(campaignFolder, dest)) }
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
  ipcMain.handle('app:displays', () => listDisplays())

  ipcMain.handle(
    'player:show-image',
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
    'player:show-crawl',
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
    'player:show-legend',
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

  ipcMain.handle('player:clear', () => {
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

  ipcMain.handle('player:stop-crawl', () => {
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

  ipcMain.handle('player:stop-legend', () => {
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
    'player:show-gallery',
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

  ipcMain.handle('player:gallery-set-index', (_e, index: number) => {
    const gallery = playerState.gallery
    if (!gallery) return playerState
    const next = Math.max(0, Math.min(gallery.slides.length - 1, Math.floor(Number(index) || 0)))
    if (next === gallery.index) return playerState
    playerState = { ...playerState, gallery: { ...gallery, index: next } }
    sendPlayerState()
    return playerState
  })

  ipcMain.handle('player:stop-gallery', () => {
    if (!playerState.gallery) return playerState
    playerState = { ...playerState, gallery: null, imageTitle: '' }
    sendPlayerState()
    return playerState
  })

  ipcMain.handle(
    'player:show-video',
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

  ipcMain.handle('player:stop-video', () => {
    if (!playerState.video) return playerState
    playerState = { ...playerState, video: null, imageTitle: '' }
    sendPlayerState()
    return playerState
  })

  ipcMain.handle(
    'player:set-initiative',
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

  ipcMain.handle('player:get-state', () => playerState)

  ipcMain.handle('mixer:get', async () => {
    if (campaignFolder) await refreshMixerLibrary()
    sendMixerState()
    return mixer
  })
  ipcMain.handle('mixer:play-music', (_e, playlistId: string) =>
    runMixer({ type: 'play-music', playlistId: String(playlistId ?? '') })
  )
  ipcMain.handle('mixer:pause-music', () => runMixer({ type: 'pause-music' }))
  ipcMain.handle('mixer:skip-music', () => runMixer({ type: 'skip-music' }))
  ipcMain.handle('mixer:stop-music', () => runMixer({ type: 'stop-music' }))
  ipcMain.handle('mixer:play-ambience', (_e, playlistId: string) =>
    runMixer({ type: 'play-ambience', playlistId: String(playlistId ?? '') })
  )
  ipcMain.handle('mixer:stop-ambience', () => runMixer({ type: 'stop-ambience' }))
  ipcMain.handle('mixer:oneshot', (_e, path: string) => runMixer({ type: 'oneshot', path: String(path ?? '') }))
  ipcMain.handle('mixer:play-crawl-music', (_e, path: string) =>
    runMixer({ type: 'play-crawl-music', path: String(path ?? '') })
  )
  ipcMain.handle('mixer:arm-crawl-music', () => runMixer({ type: 'arm-crawl-music' }))
  ipcMain.handle('mixer:stop-crawl-music', () => runMixer({ type: 'stop-crawl-music' }))
  ipcMain.handle('mixer:stop-all', () => runMixer({ type: 'stop-all' }))
  ipcMain.handle('mixer:set-prefs', (_e, prefs: Partial<MixerPrefs>) =>
    runMixer({ type: 'set-prefs', prefs: prefs ?? {} })
  )
  ipcMain.handle('mixer:ended', (_e, layer: 'music' | 'ambience' | 'crawl') =>
    runMixer({
      type: 'ended',
      layer: layer === 'ambience' ? 'ambience' : layer === 'crawl' ? 'crawl' : 'music'
    })
  )
  ipcMain.handle('mixer:error', (_e, message: string | null) =>
    runMixer({ type: 'error', message: typeof message === 'string' && message ? message : null })
  )

  ipcMain.handle('player:window-open', () => playerWindowVisible())

  ipcMain.handle('player:close-window', () => {
    closePlayerWindow()
    return playerWindowVisible()
  })

  ipcMain.handle('player:place-on-display', async (_e, displayId: number) => {
    const display = screen.getAllDisplays().find((d) => d.id === displayId)
    if (!display) return listDisplays()
    await patchSettings({ playerDisplayId: displayId })
    if (hasSecondDisplay()) showPlayerWindow(display, true)
    else hidePlayerWindow()
    return listDisplays()
  })

  ipcMain.handle('app:get-settings', () => settings)

  ipcMain.handle('app:save-settings', (_e, partial: AppSettings) => patchSettings(partial ?? {}))

  ipcMain.handle('app:folders', () => appFolders())

  ipcMain.handle('app:open-folder', (_e, kind: string) => openAppFolder(kind))

  ipcMain.on('app:confirm-close', () => {
    allowQuit = true
    dmWindow?.close()
  })

  ipcMain.handle('campaign:pick-folder', async () => {
    const result = await showAppOpenDialog({
      title: 'Open campaign folder',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || !result.filePaths[0]) return null
    return setCampaignFolder(result.filePaths[0])
  })

  ipcMain.handle('campaign:open-path', async (_e, folder: string) => {
    if (!folder || !existsSync(folder)) return null
    return setCampaignFolder(folder)
  })

  ipcMain.handle(
    'campaign:new',
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

  ipcMain.handle('campaign:set-theme', async (_e, themeId?: string) => {
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

  ipcMain.handle('campaign:set-holo-portraits', async (_e, enabled?: boolean) => {
    if (!campaignFolder) return null
    const campaignPath = join(campaignFolder, 'campaign.json')
    const campaign = await readJson<CampaignFile>(campaignPath, {})
    await writeJson(campaignPath, { ...campaign, holoPortraits: enabled === true })
    return loadCampaign(campaignFolder)
  })

  ipcMain.handle('campaign:set-digital-rain', async (_e, enabled?: boolean) => {
    if (!campaignFolder) return null
    const campaignPath = join(campaignFolder, 'campaign.json')
    const campaign = await readJson<CampaignFile>(campaignPath, {})
    await writeJson(campaignPath, { ...campaign, digitalRain: enabled === true })
    return loadCampaign(campaignFolder)
  })

  ipcMain.handle('campaign:open-sample', async () =>
    setCampaignFolder(await ensureSampleWorkingCopy())
  )

  ipcMain.handle('campaign:get', async () => {
    if (!campaignFolder) return null
    await prepareCampaignFolder(campaignFolder)
    return loadCampaign(campaignFolder)
  })

  ipcMain.handle('campaign:read-file', async (_e, relativePath: string) => {
    if (!campaignFolder) return ''
    return readFile(safeJoin(campaignFolder, relativePath), 'utf8')
  })

  ipcMain.handle('campaign:save-file', async (_e, relativePath: string, markdown: string) => {
    if (!campaignFolder) return
    await writeFile(safeJoin(campaignFolder, relativePath), markdown, 'utf8')
  })

  ipcMain.handle('campaign:save-combat', async (_e, combat: CombatState) => {
    if (!campaignFolder) return null
    await writeJson(join(campaignFolder, 'combat.json'), combat)
    return loadCampaign(campaignFolder)
  })

  ipcMain.handle(
    'campaign:create-note',
    async (
      _e,
      folder: string,
      name: string,
      template: SheetTemplateKind = 'blank',
      mapImage?: CreateNoteMapImage | null
    ) => createCampaignNote(folder ?? '', name, template, mapImage)
  )

  ipcMain.handle('campaign:pick-image', async () => {
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
    'campaign:save-to-library',
    async (_e, folder: CampaignLibraryFolder, name: string, contents: string, subfolder?: string | null) =>
      saveToCampaignLibrary(folder, name, contents, subfolder)
  )

  ipcMain.handle('campaign:set-portrait', async (_e, relativePath: string, image: CreateNoteMapImage) =>
    setNotePortrait(relativePath, image)
  )

  ipcMain.handle(
    'campaign:copy-art',
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

  ipcMain.handle('campaign:duplicate-file', async (_e, relativePath: string, name?: string) =>
    duplicateCampaignFile(relativePath, name)
  )

  ipcMain.handle('campaign:add-files', async (_e, folder: string, mode?: 'files' | 'art') =>
    addCampaignFiles(folder ?? '', mode === 'art' ? 'art' : 'files')
  )

  ipcMain.handle('campaign:delete-file', async (_e, relativePath: string) =>
    deleteCampaignFile(relativePath)
  )

  ipcMain.handle('books:load', () => loadBookLibrary())
  ipcMain.handle('books:open-folder', () => openBooksFolder())
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
