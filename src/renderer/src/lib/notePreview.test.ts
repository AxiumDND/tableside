import { describe, expect, it } from 'vitest'
import { notePreviewFromMarkdown, notePreviewImageUrl, firstSheetImageRef } from './notePreview'

describe('notePreviewFromMarkdown', () => {
  it('pulls title, tagline, facts, and blurb from a gear sheet', () => {
    const markdown = [
      '# Rope',
      '',
      '[!gear]',
      '![Rope.webp]',
      '',
      '### *Adventuring Gear*',
      '',
      '| **Weight** | 5 lb. |',
      '| **Cost** | 1 GP |',
      '[!/gear]',
      '',
      'Rope, whether made of hemp or silk, has 2 hit points.'
    ].join('\n')
    const preview = notePreviewFromMarkdown('Gear/Equipment/Rope.md', markdown)
    expect(preview.title).toBe('Rope')
    expect(preview.tagline).toBe('Adventuring Gear')
    expect(preview.facts).toEqual(
      expect.arrayContaining([
        { label: 'Weight', value: '5 lb.' },
        { label: 'Cost', value: '1 GP' }
      ])
    )
    expect(preview.blurb).toContain('hemp or silk')
    expect(preview.imageUrl).toBeNull()
  })

  it('resolves a sheet portrait from the embed and Art folder', () => {
    const markdown = ['# *Ash*', '', '[!npc]', '![[Ash.webp]]', '[!/npc]', ''].join('\n')
    expect(firstSheetImageRef(markdown)).toBe('Ash.webp')
    expect(
      notePreviewImageUrl('NPCs/Ash.md', markdown, [
        { relativePath: 'NPCs/Art/Ash.webp', name: 'Ash.webp', title: 'Ash' }
      ])
    ).toContain('NPCs%2FArt%2FAsh.webp')
  })

  it('hides marked bundled portraits when hideBundled is set', () => {
    const markdown = '---\ntablesidePortrait: bundled-ai\n---\n\n# Guard\n'
    expect(notePreviewImageUrl('NPCs/Guard.md', markdown, [], { hideBundled: true })).toBeNull()
  })
})
