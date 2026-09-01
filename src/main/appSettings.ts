import { app, shell } from 'electron'
import { existsSync } from 'node:fs'
import { copyFile, cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, normalize } from 'node:path'
import type { AppSettings } from '../shared/types'
import { emptySettings } from '../shared/types'
import { ensureBooksHome } from './bookLibrary'
import { ensureConvertGuide, revealConvertGuide } from './convertGuide'

export type AppSettingsDeps = {
  onThemeChanged?: (theme?: string | null) => void
}

let deps: AppSettingsDeps = {}
let settings: AppSettings = emptySettings()

export function configureAppSettings(next: AppSettingsDeps): void {
  deps = next
}

export function getSettings(): AppSettings {
  return settings
}

export function samePath(a: string, b: string): boolean {
  return normalize(a).toLowerCase() === normalize(b).toLowerCase()
}

export function appIconPath(): string {
  const ico = app.isPackaged
    ? join(process.resourcesPath, 'icon.ico')
    : join(__dirname, '../../resources/icon.ico')
  const png = app.isPackaged
    ? join(process.resourcesPath, 'icon.png')
    : join(__dirname, '../../resources/icon.png')
  return existsSync(ico) ? ico : png
}

export function appInstallFolder(): string {
  return app.isPackaged ? dirname(app.getPath('exe')) : app.getAppPath()
}

export async function appFolders(): Promise<{
  appFolder: string
  userDataFolder: string
  booksFolder: string
  campaignFolder: string
  convertGuidePath: string
}> {
  return {
    appFolder: appInstallFolder(),
    userDataFolder: app.getPath('userData'),
    booksFolder: await ensureBooksHome(),
    campaignFolder: settings.campaignFolder ?? '',
    convertGuidePath: await ensureConvertGuide()
  }
}

export async function openAppFolder(kind: string): Promise<string> {
  if (kind === 'convert') return revealConvertGuide()
  const folders = await appFolders()
  const folder =
    kind === 'userData'
      ? folders.userDataFolder
      : kind === 'app'
        ? folders.appFolder
        : kind === 'books'
          ? folders.booksFolder
          : kind === 'campaign'
            ? folders.campaignFolder
            : null
  if (!folder) return ''
  await shell.openPath(folder)
  return folder
}

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

export async function readSettings(): Promise<AppSettings> {
  try {
    settings = { ...emptySettings(), ...JSON.parse(await readFile(settingsPath(), 'utf8')) }
    return settings
  } catch {
    settings = emptySettings()
    return settings
  }
}

export async function writeSettings(next: AppSettings): Promise<void> {
  settings = next
  await mkdir(app.getPath('userData'), { recursive: true })
  await writeFile(settingsPath(), JSON.stringify(next, null, 2), 'utf8')
}

export async function patchSettings(partial: AppSettings): Promise<AppSettings> {
  await writeSettings({ ...settings, ...partial })
  if (partial.theme !== undefined) deps.onThemeChanged?.(settings.theme)
  return settings
}

export async function migrateLegacyUserData(): Promise<void> {
  // Hermetic e2e profiles must not inherit a real table-dm install from AppData.
  if (process.env.TABLESIDE_E2E === '1') return
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
