import { BrowserWindow, shell } from 'electron'
import { parseDndBeyondCharacterUrl } from '../shared/dndBeyond'
import { isAllowedExternalUrl } from '../shared/externalLinks'
import { APP_NAME } from '../shared/version'

const ALLOWED_HOST_SUFFIXES = [
  'dndbeyond.com',
  'ddb.ac',
  'wizards.com',
  'google.com',
  'gstatic.com',
  'facebook.com',
  'twitch.tv',
  'apple.com'
]

let sheetWindow: BrowserWindow | null = null

function hostAllowed(hostname: string): boolean {
  const host = hostname.replace(/^www\./i, '').toLowerCase()
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))
}

function attachBrowserGuards(contents: Electron.WebContents): void {
  contents.setWindowOpenHandler((details) => {
    let parsed: URL
    try {
      parsed = new URL(details.url)
    } catch {
      return { action: 'deny' }
    }
    if ((parsed.protocol === 'https:' || parsed.protocol === 'http:') && hostAllowed(parsed.hostname)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          webPreferences: {
            sandbox: true,
            contextIsolation: true,
            nodeIntegration: false,
            partition: 'persist:dndbeyond'
          }
        }
      }
    }
    if (isAllowedExternalUrl(details.url)) {
      void shell.openExternal(details.url)
    }
    return { action: 'deny' }
  })

  contents.on('will-navigate', (event, navigationUrl) => {
    let parsed: URL
    try {
      parsed = new URL(navigationUrl)
    } catch {
      event.preventDefault()
      return
    }
    if ((parsed.protocol === 'https:' || parsed.protocol === 'http:') && hostAllowed(parsed.hostname)) {
      return
    }
    event.preventDefault()
    if (isAllowedExternalUrl(navigationUrl)) {
      void shell.openExternal(navigationUrl)
    }
  })
}

function stripElectronUserAgent(contents: Electron.WebContents): void {
  const current = contents.getUserAgent()
  const next = current.replace(/\sElectron\/\S+/i, '').replace(/\sTableside\/\S+/i, '')
  if (next !== current) contents.setUserAgent(next)
}

function ensureWindow(): BrowserWindow {
  if (sheetWindow && !sheetWindow.isDestroyed()) return sheetWindow

  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    title: `${APP_NAME} — D&D Beyond`,
    backgroundColor: '#0e0c0a',
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      partition: 'persist:dndbeyond'
    }
  })
  attachBrowserGuards(win.webContents)
  stripElectronUserAgent(win.webContents)
  win.on('closed', () => {
    if (sheetWindow === win) sheetWindow = null
  })
  sheetWindow = win
  return win
}

/** Open (or reuse) a Chromium window on the official D&D Beyond character sheet. */
export function openDndBeyondSheet(rawUrl: unknown): boolean {
  const parsed = parseDndBeyondCharacterUrl(typeof rawUrl === 'string' ? rawUrl : '')
  if (!parsed || !isAllowedExternalUrl(parsed.canonicalUrl)) return false
  const win = ensureWindow()
  win.setTitle(`${APP_NAME} — D&D Beyond`)
  void win.loadURL(parsed.canonicalUrl)
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
  return true
}

export function disposeDndBeyondWindow(): void {
  if (!sheetWindow || sheetWindow.isDestroyed()) {
    sheetWindow = null
    return
  }
  sheetWindow.close()
  sheetWindow = null
}
