import { app, dialog, ipcMain, type BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { AppUpdateNotice } from '../shared/appUpdate'
import { IPC } from '../shared/ipc'
import {
  allowPrereleaseUpdates,
  parseUpdateChannel,
  updateInstallPromptDetail,
  type UpdateChannel
} from '../shared/updateChannel'
import { APP_VERSION } from '../shared/version'
import { getSettings } from './appSettings'

let getWindow: () => BrowserWindow | null = () => null
let readDismissed: () => string | undefined = () => undefined
let writeDismissed: (version: string) => void = () => undefined
let beforeQuitAndInstall: () => void = () => undefined
let pendingVersion = ''
let helpCheck = false
let promptingInstall = false

function send(notice: AppUpdateNotice): void {
  getWindow()?.webContents.send(IPC.appUpdate, notice)
}

function isPackaged(): boolean {
  return app.isPackaged
}

export function setupAppUpdater(options: {
  getWindow: () => BrowserWindow | null
  readDismissed: () => string | undefined
  writeDismissed: (version: string) => void
  beforeQuitAndInstall: () => void
}): void {
  getWindow = options.getWindow
  readDismissed = options.readDismissed
  writeDismissed = options.writeDismissed
  beforeQuitAndInstall = options.beforeQuitAndInstall

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
  applyUpdateChannelFromSettings()

  autoUpdater.on('update-available', (info) => {
    pendingVersion = String(info.version ?? '')
    const fromHelp = helpCheck
    helpCheck = false
    if (!fromHelp && pendingVersion && readDismissed() === pendingVersion) return
    if (fromHelp) {
      send({ kind: 'available', version: pendingVersion })
      return
    }
    void promptLaunchInstall(pendingVersion)
  })

  autoUpdater.on('update-not-available', () => {
    const fromHelp = helpCheck
    helpCheck = false
    if (fromHelp) send({ kind: 'current', version: app.getVersion() })
  })

  autoUpdater.on('error', () => {
    const fromHelp = helpCheck
    helpCheck = false
    if (fromHelp) send({ kind: 'offline' })
  })

  autoUpdater.on('download-progress', (progress) => {
    send({
      kind: 'downloading',
      version: pendingVersion,
      percent: Math.max(0, Math.min(100, progress.percent || 0))
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    const version = String(info.version ?? pendingVersion)
    send({ kind: 'installing', version })
    beforeQuitAndInstall()
    setTimeout(() => {
      autoUpdater.quitAndInstall(false, true)
    }, 400)
  })

  ipcMain.handle(IPC.appCheckUpdate, (_e, fromHelp?: boolean) => {
    checkForAppUpdate(Boolean(fromHelp))
  })
  ipcMain.handle(IPC.appStartUpdate, () => startAppUpdate())
  ipcMain.handle(IPC.appDismissUpdate, (_e, version: string) => {
    if (version) writeDismissed(version)
  })
}

export function applyUpdateChannel(channel: UpdateChannel): void {
  autoUpdater.allowPrerelease = allowPrereleaseUpdates(channel)
}

export function applyUpdateChannelFromSettings(): void {
  applyUpdateChannel(parseUpdateChannel(getSettings().updateChannel))
}

export function checkForAppUpdate(fromHelp = false): void {
  applyUpdateChannelFromSettings()
  helpCheck = fromHelp
  if (!isPackaged()) {
    if (fromHelp) send({ kind: 'dev' })
    return
  }
  void autoUpdater.checkForUpdates().catch(() => {
    if (fromHelp) send({ kind: 'offline' })
  })
}

export function scheduleLaunchUpdateCheck(): void {
  if (!isPackaged()) return
  const run = () => checkForAppUpdate(false)
  const win = getWindow()
  if (win && !win.isVisible()) {
    win.once('show', () => setTimeout(run, 800))
    return
  }
  setTimeout(run, 800)
}

async function promptLaunchInstall(version: string): Promise<void> {
  if (!version || promptingInstall) return
  promptingInstall = true
  send({ kind: 'available', version })
  try {
    const win = getWindow()
    const parent = win && !win.isDestroyed() ? win : null
    const channel = parseUpdateChannel(getSettings().updateChannel)
    const options: Electron.MessageBoxOptions = {
      type: 'question',
      title: 'Tableside update',
      message: `Tableside ${version} is available.`,
      detail: updateInstallPromptDetail(channel),
      buttons: ['Install', 'Not now'],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    }
    const result = await (parent
      ? dialog.showMessageBox(parent, options)
      : dialog.showMessageBox(options))
    if (result.response === 0) {
      startAppUpdate()
      return
    }
    writeDismissed(version)
  } finally {
    promptingInstall = false
  }
}

function startAppUpdate(): void {
  if (!isPackaged()) {
    send({ kind: 'dev' })
    return
  }
  helpCheck = false
  send({ kind: 'downloading', version: pendingVersion || APP_VERSION, percent: 0 })
  void autoUpdater.downloadUpdate().catch(() => {
    send({ kind: 'failed', version: pendingVersion })
  })
}
