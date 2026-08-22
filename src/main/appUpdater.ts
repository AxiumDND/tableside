import { app, ipcMain, type BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { AppUpdateNotice } from '../shared/appUpdate'
import { APP_VERSION } from '../shared/version'

let getWindow: () => BrowserWindow | null = () => null
let readDismissed: () => string | undefined = () => undefined
let writeDismissed: (version: string) => void = () => undefined
let beforeQuitAndInstall: () => void = () => undefined
let pendingVersion = ''
let helpCheck = false

function send(notice: AppUpdateNotice): void {
  getWindow()?.webContents.send('app:update', notice)
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
  autoUpdater.allowPrerelease = false

  autoUpdater.on('update-available', (info) => {
    pendingVersion = String(info.version ?? '')
    const fromHelp = helpCheck
    helpCheck = false
    if (!fromHelp && pendingVersion && readDismissed() === pendingVersion) return
    send({ kind: 'available', version: pendingVersion })
  })

  autoUpdater.on('update-not-available', () => {
    const fromHelp = helpCheck
    helpCheck = false
    if (fromHelp) send({ kind: 'current', version: APP_VERSION })
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

  ipcMain.handle('app:check-update', (_e, fromHelp?: boolean) => {
    checkForAppUpdate(Boolean(fromHelp))
  })
  ipcMain.handle('app:start-update', () => startAppUpdate())
  ipcMain.handle('app:dismiss-update', (_e, version: string) => {
    if (version) writeDismissed(version)
  })
}

export function checkForAppUpdate(fromHelp = false): void {
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
  setTimeout(() => checkForAppUpdate(false), 8000)
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
