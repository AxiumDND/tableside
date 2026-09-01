import { join } from 'node:path'

export const CONVERT_GUIDE_NAME = 'AI-CAMPAIGN.md'

export function resolveConvertGuideSource(opts: {
  packaged: boolean
  resourcesPath: string
  cwd: string
}): string {
  if (opts.packaged) return join(opts.resourcesPath, CONVERT_GUIDE_NAME)
  return join(opts.cwd, 'docs', CONVERT_GUIDE_NAME)
}
