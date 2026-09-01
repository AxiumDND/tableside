import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CONVERT_GUIDE_NAME, resolveConvertGuideSource } from './convertGuidePath'

describe('resolveConvertGuideSource', () => {
  it('uses extraResources when packaged', () => {
    expect(
      resolveConvertGuideSource({
        packaged: true,
        resourcesPath: join('app', 'resources'),
        cwd: join('repo')
      })
    ).toBe(join('app', 'resources', CONVERT_GUIDE_NAME))
  })

  it('uses docs/ in the repo during development', () => {
    expect(
      resolveConvertGuideSource({
        packaged: false,
        resourcesPath: join('app', 'resources'),
        cwd: join('repo')
      })
    ).toBe(join('repo', 'docs', CONVERT_GUIDE_NAME))
  })
})
