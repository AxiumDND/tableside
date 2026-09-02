import { app, BrowserView, shell, type BrowserWindow, type WebContents } from 'electron'
import { parseDndBeyondCharacterUrl } from '../shared/dndBeyond'
import { isAllowedExternalUrl } from '../shared/externalLinks'

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

export type DndBeyondBounds = {
  x: number
  y: number
  width: number
  height: number
}

let sheetView: BrowserView | null = null
let attachedWindow: BrowserWindow | null = null
let lastUrl = ''

export function dndBeyondHostAllowed(hostname: string): boolean {
  const host = hostname.replace(/^www\./i, '').toLowerCase()
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))
}

/** Canonical D&D Beyond character or monster URL, or null if the src is not a sheet. */
export function sanitizeDndBeyondWebviewSrc(raw: unknown): string | null {
  const parsed = parseDndBeyondCharacterUrl(typeof raw === 'string' ? raw : '')
  if (!parsed || !isAllowedExternalUrl(parsed.canonicalUrl)) return null
  return parsed.canonicalUrl
}

export function asDndBeyondBounds(raw: unknown): DndBeyondBounds | null {
  if (!raw || typeof raw !== 'object') return null
  const rec = raw as Record<string, unknown>
  const x = rec.x
  const y = rec.y
  const width = rec.width
  const height = rec.height
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 8 ||
    height < 8
  ) {
    return null
  }
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height)
  }
}

function attachBrowserGuards(contents: WebContents): void {
  contents.setWindowOpenHandler((details) => {
    let parsed: URL
    try {
      parsed = new URL(details.url)
    } catch {
      return { action: 'deny' }
    }
    if ((parsed.protocol === 'https:' || parsed.protocol === 'http:') && dndBeyondHostAllowed(parsed.hostname)) {
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
    if ((parsed.protocol === 'https:' || parsed.protocol === 'http:') && dndBeyondHostAllowed(parsed.hostname)) {
      return
    }
    event.preventDefault()
    if (isAllowedExternalUrl(navigationUrl)) {
      void shell.openExternal(navigationUrl)
    }
  })
}

function stripElectronUserAgent(contents: WebContents): void {
  const current = contents.getUserAgent()
  const next = current.replace(/\sElectron\/\S+/i, '').replace(/\sTableside\/\S+/i, '')
  if (next !== current) contents.setUserAgent(next)
}

function hardenWebviewAttach(
  event: Electron.Event,
  webPreferences: Electron.WebPreferences,
  params: Record<string, string>
): void {
  const src = sanitizeDndBeyondWebviewSrc(params.src)
  if (!src) {
    event.preventDefault()
    return
  }
  params.src = src
  webPreferences.nodeIntegration = false
  webPreferences.contextIsolation = true
  webPreferences.sandbox = true
  webPreferences.partition = 'persist:dndbeyond'
  delete webPreferences.preload
}

function ensureView(win: BrowserWindow): BrowserView {
  if (sheetView && !sheetView.webContents.isDestroyed()) {
    if (attachedWindow !== win) {
      attachedWindow?.removeBrowserView(sheetView)
      win.addBrowserView(sheetView)
      attachedWindow = win
    }
    return sheetView
  }

  const view = new BrowserView({
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      partition: 'persist:dndbeyond'
    }
  })
  attachBrowserGuards(view.webContents)
  stripElectronUserAgent(view.webContents)
  win.addBrowserView(view)
  sheetView = view
  attachedWindow = win
  lastUrl = ''
  return view
}

/** Full Chromium page clipped to the note pane (same cookies as later visits). */
export function embedDndBeyondSheet(
  win: BrowserWindow | null,
  rawUrl: unknown,
  rawBounds: unknown
): boolean {
  const src = sanitizeDndBeyondWebviewSrc(rawUrl)
  const bounds = asDndBeyondBounds(rawBounds)
  if (!win || win.isDestroyed() || !src || !bounds) return false
  const view = ensureView(win)
  view.setBounds(bounds)
  view.setAutoResize({ width: false, height: false })
  if (lastUrl !== src) {
    lastUrl = src
    void view.webContents.loadURL(src)
  }
  return true
}

export function setDndBeyondEmbedBounds(rawBounds: unknown): boolean {
  const bounds = asDndBeyondBounds(rawBounds)
  if (!bounds || !sheetView || sheetView.webContents.isDestroyed()) return false
  sheetView.setBounds(bounds)
  return true
}

export function hideDndBeyondEmbed(): void {
  if (!sheetView) return
  attachedWindow?.removeBrowserView(sheetView)
  attachedWindow = null
}

export function disposeDndBeyondEmbed(): void {
  hideDndBeyondEmbed()
  if (sheetView && !sheetView.webContents.isDestroyed()) {
    sheetView.webContents.close()
  }
  sheetView = null
  lastUrl = ''
}

/** Guest popups from D&D Beyond login: only character/monster URLs, sandboxed session. */
export function registerDndBeyondWebview(): void {
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-attach-webview', hardenWebviewAttach)
    contents.on('did-attach-webview', (_attached, guest) => {
      attachBrowserGuards(guest)
      stripElectronUserAgent(guest)
    })
  })
}
