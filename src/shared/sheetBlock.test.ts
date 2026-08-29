import { describe, expect, it } from 'vitest'
import { splitCalloutBlocks } from './callouts'
import {
  findSheetHeader,
  serializeSheetHeader,
  stripSheetHeader
} from './sheetBlock'

describe('sheet header blocks', () => {
  it('parses typed sheet fences', () => {
    const md = ['# *Bren*', '', '[!pc]', '![[Bren.webp]]', '', '### *Front line*', '[!/pc]', ''].join('\n')
    const parts = splitCalloutBlocks(md)
    expect(parts.some((p) => p.kind === 'pc')).toBe(true)
    expect(findSheetHeader(md)?.markdown).toContain('Bren.webp')
  })

  it('strips fenced and legacy headers', () => {
    const fenced = stripSheetHeader('# A\n\n[!npc]\n![[A.webp]]\n[!/npc]\n\n## Notes\nHi\n')
    expect(fenced).not.toContain('[!npc]')
    expect(fenced).toContain('## Notes')

    const legacy = stripSheetHeader('# A\n\n> [!infobox]+\n> ![[A.webp]]\n>\n\n## Notes\nHi\n')
    expect(legacy).not.toContain('infobox')
    expect(legacy).toContain('## Notes')
  })

  it('serializes a gear header without quote prefixes', () => {
    expect(
      serializeSheetHeader('gear', {
        imageFile: 'Acid.webp',
        tagline: 'Adventuring Gear',
        rows: [{ label: 'Cost', value: '25 GP' }]
      })
    ).toContain('[!gear]')
  })
})
