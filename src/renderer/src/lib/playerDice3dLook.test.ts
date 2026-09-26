import { describe, expect, it } from 'vitest'
import {
  dieBodyMaterialInputs,
  dieBodyScale,
  dieFaceMicrotexturePixels,
  dieFaceTextureContrast,
  dieFaceTextureTint,
  dieGlyphFill,
  dieGlyphFontPx,
  dieGlyphScale,
  dieGlyphShouldDot,
  dieGlyphTone,
  diePlasticColor,
  heightToNormalMap,
  DIE_FACE_TEXTURE_SIZE,
  DIE_PLASTIC_COLOR,
  diceLookPreset
} from './playerDice3dLook'

describe('diePlasticColor', () => {
  it('uses ivory resin by default, not a dark metal', () => {
    expect(diePlasticColor()).toBe(DIE_PLASTIC_COLOR)
    expect(diePlasticColor()).toBe(diceLookPreset('ivory').body)
    expect(diePlasticColor()).toBeGreaterThan(0xc00000)
    expect(diePlasticColor(true)).not.toBe(diePlasticColor())
  })

  it('follows the active bag preset', () => {
    expect(diePlasticColor(false, 'obsidian')).toBe(diceLookPreset('obsidian').body)
    expect(diePlasticColor(true, 'obsidian')).toBe(diceLookPreset('obsidian').droppedBody)
  })
})

describe('dieGlyphTone', () => {
  it('inks ordinary faces and paints nat 20 / nat 1', () => {
    expect(dieGlyphTone({})).toBe('ink')
    expect(dieGlyphFill('ink')).toBe('#1c140e')
    expect(dieGlyphFill('ink', 'obsidian')).toBe(diceLookPreset('obsidian').ink)
    expect(dieGlyphTone({ highlight: 'nat20' })).toBe('gold')
    expect(dieGlyphTone({ highlight: 'nat1' })).toBe('blood')
    expect(dieGlyphTone({ dropped: true })).toBe('faded')
  })
})

describe('dieBodyMaterialInputs', () => {
  it('maps each preset into body material knobs without changing fairness', () => {
    const ivory = dieBodyMaterialInputs(diceLookPreset('ivory'))
    expect(ivory.color).toBe(0xe6d2b0)
    expect(ivory.metalness).toBe(0)
    expect(ivory.transmission).toBe(0)

    const steel = dieBodyMaterialInputs(diceLookPreset('steel'))
    expect(steel.metalness).toBeGreaterThan(0.5)
    expect(steel.color).toBe(diceLookPreset('steel').body)

    const ruby = dieBodyMaterialInputs(diceLookPreset('ruby'))
    expect(ruby.transmission).toBeGreaterThan(0.3)
    expect(ruby.transparent).toBe(true)

    const dropped = dieBodyMaterialInputs(diceLookPreset('ruby'), true)
    expect(dropped.opacity).toBe(0.5)
    expect(dropped.transmission).toBe(0)
  })
})

describe('die body and glyph scale', () => {
  it('makes a d4 larger than a d6 and a d20', () => {
    expect(dieBodyScale(4)).toBeGreaterThan(dieBodyScale(6))
    expect(dieBodyScale(4)).toBeGreaterThan(dieBodyScale(20))
    expect(dieBodyScale(6)).toBeLessThan(dieBodyScale(20))
  })

  it('makes d6 numerals larger than d20 and d100 tens smaller than d10 ones', () => {
    expect(dieGlyphScale(6, '4')).toBeGreaterThan(dieGlyphScale(20, '20'))
    expect(dieGlyphScale(10, '00')).toBeLessThan(dieGlyphScale(10, '7'))
    expect(dieGlyphFontPx(6, '3')).toBeGreaterThan(dieGlyphFontPx(20, '3'))
  })

  it('dots only a lone 6 or 9', () => {
    expect(dieGlyphShouldDot('6')).toBe(true)
    expect(dieGlyphShouldDot('9')).toBe(true)
    expect(dieGlyphShouldDot('16')).toBe(false)
    expect(dieGlyphShouldDot('60')).toBe(false)
    expect(dieGlyphShouldDot('5')).toBe(false)
  })
})

describe('heightToNormalMap', () => {
  it('turns a vertical height step into a sideways normal', () => {
    const width = 8
    const height = 8
    const rgba = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = (y * width + x) * 4
        const value = x < 4 ? 255 : 0
        rgba[i] = value
        rgba[i + 1] = value
        rgba[i + 2] = value
        rgba[i + 3] = 255
      }
    }
    const normals = heightToNormalMap(rgba, width, height, 3)
    const mid = (3 * width + 3) * 4
    expect(Math.abs(normals[mid] - 128)).toBeGreaterThan(20)
    expect(normals[mid + 2]).toBeGreaterThan(160)
    expect(normals[mid + 3]).toBe(255)
  })

  it('keeps a flat height nearly facing out', () => {
    const rgba = new Uint8ClampedArray(4 * 4 * 4).fill(200)
    const normals = heightToNormalMap(rgba, 4, 4, 2)
    expect(normals[0]).toBeGreaterThan(120)
    expect(normals[0]).toBeLessThan(136)
    expect(normals[2]).toBeGreaterThan(240)
  })
})

describe('dieFaceMicrotexturePixels', () => {
  it('builds a seamless tileable atlas', () => {
    const size = DIE_FACE_TEXTURE_SIZE
    const data = dieFaceMicrotexturePixels(size, { seed: 1.5, contrast: 0.12 })
    expect(data).toHaveLength(size * size * 4)
    // Left/right edges match (wrap).
    for (let y = 0; y < size; y += 1) {
      const left = y * size * 4
      const right = (y * size + (size - 1)) * 4
      expect(Math.abs(data[left]! - data[right]!)).toBeLessThan(18)
    }
    // Top/bottom edges match.
    for (let x = 0; x < size; x += 1) {
      const top = x * 4
      const bottom = ((size - 1) * size + x) * 4
      expect(Math.abs(data[top]! - data[bottom]!)).toBeLessThan(18)
    }
    let min = 255
    let max = 0
    for (let i = 0; i < data.length; i += 4) {
      min = Math.min(min, data[i]!)
      max = Math.max(max, data[i]!)
    }
    expect(max - min).toBeGreaterThan(8)
  })

  it('scales contrast across bag presets without dropping gems to zero', () => {
    expect(dieFaceTextureContrast(diceLookPreset('ivory'))).toBeGreaterThan(
      dieFaceTextureContrast(diceLookPreset('emerald'))
    )
    expect(dieFaceTextureContrast(diceLookPreset('sapphire'))).toBeGreaterThan(0.02)
    const tint = dieFaceTextureTint(diceLookPreset('ivory'))
    expect(tint[0]).toBeGreaterThan(0.5)
    expect(tint[1]).toBeGreaterThan(0.5)
  })
})
