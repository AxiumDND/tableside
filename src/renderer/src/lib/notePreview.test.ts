import { describe, expect, it } from 'vitest'
import { notePreviewFromMarkdown } from './notePreview'

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
  })
})
