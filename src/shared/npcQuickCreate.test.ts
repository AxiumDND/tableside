import { describe, expect, it } from 'vitest'
import { applyNpcCr, replaceNpcStatblockFence } from './npcQuickCreate'

describe('npcQuickCreate', () => {
  it('replaces an existing statblock fence', () => {
    const next = replaceNpcStatblockFence('# NPC\n\n```statblock\nname: Old\n```', '```statblock\nname: New\n```')
    expect(next).toContain('name: New')
    expect(next).not.toContain('name: Old')
  })

  it('updates the CR row when present', () => {
    const next = applyNpcCr('| **CR** | 2 |\n', '1/8')
    expect(next).toContain('| **CR** | 1/8 |')
  })
})
