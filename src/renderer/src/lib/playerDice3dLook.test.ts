import { describe, expect, it } from 'vitest'
import { dieGlyphFill, dieGlyphTone, diePlasticColor, DIE_PLASTIC_COLOR } from './playerDice3dLook'

describe('diePlasticColor', () => {
  it('uses ivory resin, not a dark metal', () => {
    expect(diePlasticColor()).toBe(DIE_PLASTIC_COLOR)
    expect(diePlasticColor()).toBeGreaterThan(0xc00000)
    expect(diePlasticColor(true)).not.toBe(diePlasticColor())
  })
})

describe('dieGlyphTone', () => {
  it('inks ordinary faces and paints nat 20 / nat 1', () => {
    expect(dieGlyphTone({})).toBe('ink')
    expect(dieGlyphFill('ink')).toBe('#1c140e')
    expect(dieGlyphTone({ highlight: 'nat20' })).toBe('gold')
    expect(dieGlyphTone({ highlight: 'nat1' })).toBe('blood')
    expect(dieGlyphTone({ dropped: true })).toBe('faded')
  })
})
