import { app, BrowserWindow, dialog, ipcMain, protocol, screen, session, shell } from 'electron'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join, relative, basename, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import type {
  AppSettings,
  CampaignInfo,
  CombatState,
  CreateNoteMapImage,
  PlayerState,
  RecentCampaign
} from '../shared/types'
import { type MixerPrefs } from '../shared/audio'
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
  saveCampaignFile,
  saveToCampaignLibrary,
  setNotePortrait
} from './campaignNotes'
import {
  broadcastMixerState,
  configureCampaignMixer,
  getMixerState,
  loadMixerForCampaign,
  refreshMixerLibrary,
  resetMixer,
  runMixer
} from './campaignMixer'
import {
  appFolders,
  appIconPath,
  configureAppSettings,
  getSettings,
  migrateLegacyUserData,
  openAppFolder,
  patchSettings,
  readSettings,
  samePath
} from './appSettings'
import {
  clearPlayerMedia,
  clearPlayerOverlays,
  closePlayerWindow,
  configurePlayerOutput,
  disposePlayerWindow,
  getPlayerState,
  hasSecondDisplay,
  hidePlayerWindow,
  listDisplays,
  playerWindowVisible,
  resetPlayerState,
  setPlayerState,
  showPlayerWindow,
  stopPlayerCrawl,
  stopPlayerGallery,
  stopPlayerLegend,
  syncPlayerWindow,
  watchDisplays
} from './playerOutput'
import { parseThemeId, THEME_WINDOW_BACKGROUND } from '../shared/theme'
import { normalizeCurrencies } from '../shared/currencies'
import { isAllowedExternalUrl } from '../shared/externalLinks'
import { IPC } from '../shared/ipc'
import { APP_NAME, APP_VERSION } from '../shared/version'
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
let campaignFolder: string | null = null
let allowQuit = false
let boundsTimer: ReturnType<typeof setTimeout> | null = null

function applyDmWindowTheme(theme?: string | null): void {
  if (!dmWindow || dmWindow.isDestroyed()) return
  dmWindow.setBackgroundColor(THEME_WINDOW_BACKGROUND[parseThemeId(theme)])
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

/** Prefer the open campaign folder so pickers reopen where the DM already is. */
function campaignDialogDefaultPath(): string | undefined {
  const candidates = [
    campaignFolder,
    getSettings().campaignFolder,
    getSettings().recentCampaigns?.[0]?.folder
  ]
  for (const folder of candidates) {
    if (folder && existsSync(folder)) return folder
  }
  return undefined
}

/**
 * Open a native file dialog parented to the DM window when it is alive, falling
 * back to a window-less dialog otherwise. Keeps the call sites type-safe (the
 * parented overload requires a real BrowserWindow, not `undefined`).
 * When `defaultPath` is omitted, starts in the current campaign folder.
 */
function showAppOpenDialog(
  options: Electron.OpenDialogOptions
): Promise<Electron.OpenDialogReturnValue> {
  const parent = dmWindow && !dmWindow.isDestroyed() ? dmWindow : null
  const withDefault: Electron.OpenDialogOptions = {
    ...options,
    defaultPath: options.defaultPath ?? campaignDialogDefaultPath()
  }
  return parent ? dialog.showOpenDialog(parent, withDefault) : dialog.showOpenDialog(withDefault)
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
  const settings = getSettings()
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
    disposePlayerWindow()
  })
  applyWindowSecurity(dmWindow.webContents)
  dmWindow.loadURL(rendererUrl('dm'))
}

async function rememberRecentCampaign(folder: string, name: string): Promise<void> {
  const entry: RecentCampaign = { folder, name }
  const prior = (getSettings().recentCampaigns ?? []).filter((item) => !samePath(item.folder, folder))
  await patchSettings({ recentCampaigns: [entry, ...prior].slice(0, 8) })
}

async function setCampaignFolder(folder: string | null): Promise<CampaignInfo | null> {
  campaignFolder = folder
  await patchSettings({ campaignFolder: folder ?? undefined })
  if (!folder) {
    resetPlayerState()
    resetMixer()
    return null
  }
  await prepareCampaignFolder(folder)
  const info = await loadCampaign(folder)
  resetPlayerState({ campaignTitle: info.name })
  await loadMixerForCampaign(folder)
  broadcastMixerState()
  await rememberRecentCampaign(folder, info.name)
  return info
}

function registerIpc(): void {
  ipcMain.handle(IPC.appDisplays, () => listDisplays())

  ipcMain.handle(
    IPC.playerShowImage,
    (_e, payload: {
      src: string
      title: string
      mapView?: PlayerState['mapView']
      handout?: PlayerState['handout']
    }) => {
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
          video: null
        },
        { show: true }
      )
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
        handout: null
      },
      { show: true }
    )
  })

  ipcMain.handle(
    IPC.playerShowLegend,
    (_e, payload: {
      title?: string
      body?: string
      logoSrc?: string | null
      endSrc?: string | null
      preface?: string | null
      look?: string | null
    }) => {
    const title = typeof payload?.title === 'string' ? payload.title.trim() : ''
    const body = typeof payload?.body === 'string' ? payload.body : ''
    const logoSrc = typeof payload?.logoSrc === 'string' && payload.logoSrc.trim() ? payload.logoSrc.trim() : null
    const endSrc = typeof payload?.endSrc === 'string' && payload.endSrc.trim() ? payload.endSrc.trim() : null
    const preface = payload?.preface === null ? null : typeof payload?.preface === 'string' ? payload.preface : undefined
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
        handout: null
      },
      { show: true }
    )
  })

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
    IPC.playerSetInitiative,
    (
      _e,
      payload: { entries: PlayerState['initiative']; show: boolean; round?: number }
    ) => {
      return setPlayerState({
        ...getPlayerState(),
        initiative: payload.entries ?? [],
        showInitiative: Boolean(payload.show),
        initiativeRound: Number(payload.round ?? 0)
      })
    }
  )

  ipcMain.handle(IPC.playerGetState, () => getPlayerState())

  ipcMain.handle(IPC.mixerGet, async () => {
    if (campaignFolder) await refreshMixerLibrary()
    broadcastMixerState()
    return getMixerState()
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

  ipcMain.handle(IPC.appGetSettings, () => getSettings())

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

  ipcMain.handle(IPC.campaignSetCurrencies, async (_e, currencies?: unknown) => {
    if (!campaignFolder) return null
    const campaignPath = join(campaignFolder, 'campaign.json')
    const campaign = await readJson<CampaignFile>(campaignPath, {})
    await writeJson(campaignPath, { ...campaign, currencies: normalizeCurrencies(currencies) })
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
    return saveCampaignFile(relativePath, markdown)
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

  configureAppSettings({
    onThemeChanged: (theme) => applyDmWindowTheme(theme)
  })

  configurePlayerOutput({
    getDmWindow: () => dmWindow,
    getPreferredDisplayId: () => getSettings().playerDisplayId,
    appIconPath,
    playerPageUrl: () => rendererUrl('player'),
    applyWindowSecurity
  })

  configureCampaignMixer({
    getCampaignFolder: () => campaignFolder,
    onStateChanged: (state) => {
      dmWindow?.webContents.send(IPC.mixerState, state)
    }
  })

  configureCampaignNotes({
    getCampaignFolder: () => campaignFolder,
    samePath,
    openFiles: (options) => showAppOpenDialog(options),
    onCampaignFilesChanged: async () => {
      await refreshMixerLibrary()
      broadcastMixerState()
    }
  })

  registerIpc()

  const settings = await readSettings()
  const recents = (settings.recentCampaigns ?? []).filter((item) => !isDroppedAppSample(item.folder))
  if (recents.length !== (settings.recentCampaigns ?? []).length) {
    await patchSettings({ recentCampaigns: recents })
  }
  setupAppUpdater({
    getWindow: () => dmWindow,
    readDismissed: () => getSettings().dismissedUpdateVersion,
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
    resetPlayerState({ campaignTitle: info.name })
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
