import { describe, expect, it } from 'vitest'
import { headingsFrom } from './noteHeadings'

describe('headingsFrom', () => {
  it('collects h1–h3 with ids', () => {
    const headings = headingsFrom('# Cave\n\n## A — Mouth\n### Trap\n#### Too deep\n')
    expect(headings).toEqual([
      { id: 'cave', text: 'Cave', level: 1 },
      { id: 'a-mouth', text: 'A — Mouth', level: 2 },
      { id: 'trap', text: 'Trap', level: 3 }
    ])
  })

  it('strips markdown markers from heading text', () => {
    expect(headingsFrom('## **Bold** heading\n')[0]?.text).toBe('Bold heading')
  })

  it('returns an empty list when there are no headings', () => {
    expect(headingsFrom('Just prose.\n')).toEqual([])
  })
})
