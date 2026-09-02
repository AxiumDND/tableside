import { app, BrowserWindow, dialog, protocol, session, shell } from 'electron'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { CampaignInfo, RecentCampaign } from '../shared/types'
import { setupAppUpdater, scheduleLaunchUpdateCheck } from './appUpdater'
import { attachSpellChecker } from './spellcheck'
import { registerMediaProtocol } from './mediaAssets'
import {
  ensureSampleWorkingCopy,
  isDroppedAppSample,
  removeDroppedAppSamples,
  sampleSourcePath
} from './sampleCampaign'
import { loadCampaign, prepareCampaignFolder, safeJoin } from './campaignFolder'
import { configureCampaignNotes } from './campaignNotes'
import {
  broadcastMixerState,
  configureCampaignMixer,
  loadMixerForCampaign,
  refreshMixerLibrary,
  resetMixer
} from './campaignMixer'
import {
  appIconPath,
  configureAppSettings,
  getSettings,
  migrateLegacyUserData,
  patchSettings,
  readSettings,
  samePath
} from './appSettings'
import {
  configurePlayerOutput,
  disposePlayerWindow,
  resetPlayerState,
  syncPlayerWindow,
  watchDisplays
} from './playerOutput'
import { parseThemeId, THEME_WINDOW_BACKGROUND } from '../shared/theme'
import { disposeDndBeyondWindow } from './dndBeyondWindow'
import { isAllowedExternalUrl } from '../shared/externalLinks'
import { IPC } from '../shared/ipc'
import { APP_NAME, APP_VERSION } from '../shared/version'
import { ensureBooksHome } from './bookLibrary'
import { ensureConvertGuide } from './convertGuide'
import { registerAppIpc } from './registerAppIpc'
import { registerCampaignIpc } from './registerCampaignIpc'
import { registerMixerIpc } from './registerMixerIpc'
import { registerPlayerIpc } from './registerPlayerIpc'

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
      spellcheck: true,
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
    disposeDndBeyondWindow()
  })
  applyWindowSecurity(dmWindow.webContents)
  attachSpellChecker(dmWindow, app.getLocale())
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
  registerAppIpc({
    confirmClose: () => {
      allowQuit = true
      dmWindow?.close()
    }
  })
  registerPlayerIpc()
  registerMixerIpc({ getCampaignFolder: () => campaignFolder })
  registerCampaignIpc({
    getCampaignFolder: () => campaignFolder,
    setCampaignFolder,
    showOpenDialog: showAppOpenDialog
  })
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
  await ensureConvertGuide()

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
