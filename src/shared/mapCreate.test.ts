import { describe, expect, it } from 'vitest'
import { mapArtRelativeFolder, setMapFenceImage, setMapFenceKind } from './mapCreate'

describe('mapArtRelativeFolder', () => {
  it('defaults to Maps/Art from the campaign root', () => {
    expect(mapArtRelativeFolder('')).toBe('Maps/Art')
  })

  it('nests Art under the note folder', () => {
    expect(mapArtRelativeFolder('Maps')).toBe('Maps/Art')
    expect(mapArtRelativeFolder('Maps/Dungeons')).toBe('Maps/Dungeons/Art')
  })

  it('keeps a folder that already ends in Art', () => {
    expect(mapArtRelativeFolder('Maps/Art')).toBe('Maps/Art')
  })
})

describe('setMapFenceImage', () => {
  it('replaces the image line in a map fence', () => {
    const body = '# Crypt\n\n```map\nimage: Crypt.jpg\npins: []\n```\n'
    expect(setMapFenceImage(body, 'Crypt.png')).toContain('image: Crypt.png')
    expect(setMapFenceImage(body, 'Crypt.png')).not.toContain('image: Crypt.jpg')
  })

  it('inserts image when the fence has none', () => {
    const body = '# Crypt\n\n```map\npins: []\n```\n'
    expect(setMapFenceImage(body, 'Crypt.png')).toContain('```map\nimage: Crypt.png\n')
  })
})

describe('setMapFenceKind', () => {
  it('inserts kind for region and world maps', () => {
    const body = '# Realm\n\n```map\nimage: Realm.png\npins: []\n```\n'
    expect(setMapFenceKind(body, 'region')).toContain('kind: region')
    expect(setMapFenceKind(body, 'world')).toContain('kind: world')
  })

  it('omits kind for battle maps', () => {
    const body = '# Crypt\n\n```map\nkind: region\nimage: Crypt.png\npins: []\n```\n'
    expect(setMapFenceKind(body, 'battle')).not.toMatch(/^kind:/m)
  })
})
