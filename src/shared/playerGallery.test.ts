import { describe, expect, it } from 'vitest'
import {
  galleryImageRefs,
  galleryIntervalSec,
  replaceNthGalleryCallout,
  serializeGalleryCallout
} from './playerGallery'

describe('galleryImageRefs', () => {
  it('reads wiki embeds in order', () => {
    expect(
      galleryImageRefs('![[Marta.webp]]\n![[Alden.webp]]\ninterval: manual\n![[Stranger.webp]]')
    ).toEqual(['Marta.webp', 'Alden.webp', 'Stranger.webp'])
  })
})

describe('galleryIntervalSec', () => {
  it('parses manual and timed intervals', () => {
    expect(galleryIntervalSec('interval: manual\n![[A.png]]')).toBeNull()
    expect(galleryIntervalSec('interval: 8s\n![[A.png]]')).toBe(8)
    expect(galleryIntervalSec('auto: 5\n![[A.png]]')).toBe(5)
    expect(galleryIntervalSec('![[A.png]]')).toBeNull()
  })
})

describe('gallery callout rewrite', () => {
  it('serializes title, interval, and images', () => {
    expect(
      serializeGalleryCallout({
        title: 'Faces',
        intervalSec: 8,
        imageRefs: ['Marta.webp', 'Alden.webp']
      })
    ).toBe(
      ['> [!gallery] Faces', '> interval: 8s', '> ![[Marta.webp]]', '> ![[Alden.webp]]'].join('\n')
    )
  })

  it('replaces the first gallery block', () => {
    const src = '# Session\n\n> [!gallery] Old\n> interval: manual\n> ![[A.png]]\n\n## Next\n'
    const next = replaceNthGalleryCallout(src, 0, {
      title: 'New',
      intervalSec: null,
      imageRefs: ['B.png', 'C.png']
    })
    expect(next).toContain('> [!gallery] New')
    expect(next).toContain('> ![[B.png]]')
    expect(next).toContain('## Next')
    expect(next).not.toContain('> [!gallery] Old')
  })
})
