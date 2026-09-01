import { describe, expect, it } from 'vitest'
import {
  parseHyperspaceFields,
  hyperspacePlanetRef,
  hyperspaceShipRef,
  replaceNthHyperspaceCallout,
  serializeHyperspaceCallout
} from './playerHyperspace'

describe('hyperspace refs', () => {
  it('reads labeled ship and planet', () => {
    const md = 'ship: ![[Falcon.png]]\nplanet: ![[Alderaan.webp]]'
    expect(hyperspaceShipRef(md)).toBe('Falcon.png')
    expect(hyperspacePlanetRef(md)).toBe('Alderaan.webp')
  })

  it('uses first embed as ship and second as planet', () => {
    const md = '![[ship.png]]\n![[world.jpg]]'
    expect(hyperspaceShipRef(md)).toBe('ship.png')
    expect(hyperspacePlanetRef(md)).toBe('world.jpg')
  })
})

describe('hyperspace callout rewrite', () => {
  it('serializes title and both images', () => {
    expect(
      serializeHyperspaceCallout({
        title: 'Jump to Alderaan',
        shipRef: 'Art/Falcon.png',
        planetRef: 'Art/Alderaan.webp',
        enterSoundRef: null,
        loopSoundRef: null,
        exitSoundRef: null
      })
    ).toBe(
      [
        '[!hyperspace] Jump to Alderaan',
        'ship: ![[Art/Falcon.png]]',
        'planet: ![[Art/Alderaan.webp]]',
        '[!/hyperspace]'
      ].join('\n')
    )
  })

  it('replaces the first jump block', () => {
    const src = '# Night\n\n> [!jump] Old\n> ship: ![[A.png]]\n\n## Next\n'
    const next = replaceNthHyperspaceCallout(src, 0, {
      title: 'New',
      shipRef: 'B.png',
      planetRef: 'C.png',
      enterSoundRef: null,
      loopSoundRef: null,
      exitSoundRef: null
    })
    expect(next).toContain('[!hyperspace] New')
    expect(next).toContain('ship: ![[B.png]]')
    expect(next).toContain('planet: ![[C.png]]')
  })

  it('parses fields', () => {
    expect(parseHyperspaceFields('Alderaan', 'ship: ![[s.png]]\nplanet: ![[p.png]]')).toEqual({
      title: 'Alderaan',
      shipRef: 's.png',
      planetRef: 'p.png',
      enterSoundRef: null,
      loopSoundRef: null,
      exitSoundRef: null
    })
  })

  it('reads enter / loop / exit audio', () => {
    const md = [
      'ship: ![[s.png]]',
      'enter: ![[Audio/Sfx/jump.mp3]]',
      'loop: Audio/Sfx/cruise.wav',
      'exit: ![[Audio/Sfx/drop.ogg]]'
    ].join('\n')
    expect(parseHyperspaceFields('Kessel', md)).toMatchObject({
      enterSoundRef: 'Audio/Sfx/jump.mp3',
      loopSoundRef: 'Audio/Sfx/cruise.wav',
      exitSoundRef: 'Audio/Sfx/drop.ogg'
    })
  })
})
