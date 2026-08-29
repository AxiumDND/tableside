import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { CampaignTreeNode } from '../shared/types'
import { extOf, safeJoin, sortNodes, toPosix, uniqueFileName } from './campaignFolder'

describe('safeJoin', () => {
  it('joins paths under the root', () => {
    const root = join('C:', 'campaigns', 'greystead')
    expect(safeJoin(root, 'Party', 'PC — Aria.md')).toBe(join(root, 'Party', 'PC — Aria.md'))
  })

  it('rejects path escape via ..', () => {
    const root = join('C:', 'campaigns', 'greystead')
    expect(() => safeJoin(root, '..', 'secrets')).toThrow(/Invalid path/)
  })
})

describe('extOf', () => {
  it('returns lowercased extension including the dot', () => {
    expect(extOf('Map.PNG')).toBe('.png')
    expect(extOf('note.md')).toBe('.md')
  })

  it('returns empty string when there is no extension', () => {
    expect(extOf('README')).toBe('')
    expect(extOf('')).toBe('')
  })
})

describe('toPosix', () => {
  it('normalizes backslashes to forward slashes', () => {
    expect(toPosix('Party\\Art\\portrait.png')).toBe('Party/Art/portrait.png')
  })
})

describe('sortNodes', () => {
  it('orders Start Here before other folders and groups files after folders', () => {
    const nodes: CampaignTreeNode[] = [
      { name: 'z-note.md', relativePath: 'z-note.md', type: 'file' },
      { name: 'Places', relativePath: 'Places', type: 'dir' },
      { name: 'Start Here', relativePath: 'Start Here', type: 'dir' },
      { name: 'a-note.md', relativePath: 'a-note.md', type: 'file' }
    ]
    expect(sortNodes(nodes).map((n) => n.name)).toEqual([
      'Start Here',
      'Places',
      'a-note.md',
      'z-note.md'
    ])
  })
})

describe('uniqueFileName', () => {
  it('appends a counter when the name already exists', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tableside-unique-'))
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'note.md'), 'x', 'utf8')
    expect(uniqueFileName(dir, 'note.md')).toBe('note 2.md')
    writeFileSync(join(dir, 'note 2.md'), 'x', 'utf8')
    expect(uniqueFileName(dir, 'note.md')).toBe('note 3.md')
  })
})
