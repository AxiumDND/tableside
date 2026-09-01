import { app, shell } from 'electron'
import { existsSync } from 'node:fs'
import { copyFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { CONVERT_GUIDE_NAME, resolveConvertGuideSource } from '../shared/convertGuidePath'

export function convertGuideSourcePath(): string {
  return resolveConvertGuideSource({
    packaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    cwd: process.cwd()
  })
}

export function convertGuideUserPath(): string {
  return join(app.getPath('userData'), CONVERT_GUIDE_NAME)
}

/** Copies the bundled conversion spec into user data so Help can open it. */
export async function ensureConvertGuide(): Promise<string> {
  const dest = convertGuideUserPath()
  await mkdir(app.getPath('userData'), { recursive: true })
  const src = convertGuideSourcePath()
  if (existsSync(src)) await copyFile(src, dest)
  return dest
}

export async function revealConvertGuide(): Promise<string> {
  const dest = await ensureConvertGuide()
  if (existsSync(dest)) {
    shell.showItemInFolder(dest)
    return dest
  }
  await shell.openPath(app.getPath('userData'))
  return dest
}
