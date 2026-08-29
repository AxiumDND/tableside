import { app } from 'electron'
import { existsSync } from 'node:fs'
import { cp, mkdir, readdir, readFile, rm } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative } from 'node:path'

export function sampleSourcePath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'examples', 'greystead')
    : join(__dirname, '../../examples/greystead')
}

export function sampleWorkingPath(): string {
  return join(app.getPath('userData'), 'samples', 'greystead')
}

export function isDroppedAppSample(folder: string): boolean {
  const samples = join(app.getPath('userData'), 'samples')
  const rel = relative(samples, folder)
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) return false
  const top = rel.split(/[\\/]/)[0] ?? ''
  return top.toLowerCase().replace(/[\s_]+/g, '-') === 'bad-blood'
}

export async function removeDroppedAppSamples(): Promise<void> {
  const root = join(app.getPath('userData'), 'samples')
  if (!existsSync(root)) return
  for (const name of await readdir(root)) {
    const folder = join(root, name)
    if (!isDroppedAppSample(folder)) continue
    await rm(folder, { recursive: true, force: true })
  }
}

export async function readSampleRevision(folder: string): Promise<number> {
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

export async function ensureSampleWorkingCopy(): Promise<string> {
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
