import { mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it, vi } from 'vitest'

const electron = vi.hoisted(() => ({
  app: {
    isPackaged: false,
    getPath: vi.fn(() => mkdtempSync(join(tmpdir(), 'tableside-user-')))
  },
  shell: { showItemInFolder: vi.fn(), openPath: vi.fn() }
}))

vi.mock('electron', () => electron)

describe('readConvertGuide', () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns bundled AI-CAMPAIGN.md text', async () => {
    const { readConvertGuide } = await import('./convertGuide')
    const text = await readConvertGuide()
    expect(text).toContain('# Tableside — AI campaign import')
    expect(text).toContain('Conversion checklist')
  })
})
