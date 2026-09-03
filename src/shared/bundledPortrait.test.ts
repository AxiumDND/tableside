import { describe, expect, it } from 'vitest'
import { hasBundledPortrait, markBundledPortrait } from './bundledPortrait'

describe('bundledPortrait', () => {
  it('marks notes without frontmatter', () => {
    const out = markBundledPortrait('# Ghoul\n', 'bundled-srd')
    expect(out).toContain('tablesidePortrait: bundled-srd')
    expect(out).toContain('# Ghoul')
    expect(hasBundledPortrait(out)).toBe(true)
  })

  it('extends existing frontmatter', () => {
    const src = '---\ntags: undead\n---\n\n# Ghoul\n'
    const out = markBundledPortrait(src, 'bundled-ai')
    expect(out).toContain('tags: undead')
    expect(out).toContain('tablesidePortrait: bundled-ai')
  })

  it('replaces an existing marker', () => {
    const src = '---\ntablesidePortrait: bundled-ai\n---\n\n# NPC\n'
    const out = markBundledPortrait(src, 'bundled-srd')
    expect(out).toContain('tablesidePortrait: bundled-srd')
    expect(out).not.toContain('bundled-ai')
  })
})
