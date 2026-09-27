import { describe, expect, it } from 'vitest'
import { DICE_LOOK_PRESET_IDS, diceLookPreset } from './diceLookPreset'
import { diceLookPresetSwatchPaint, mixHex } from './diceLookPresetSwatch'

describe('mixHex', () => {
  it('lightens and darkens a body color', () => {
    expect(mixHex('#808080', 0.5)).toBe('#c0c0c0')
    expect(mixHex('#808080', -0.5)).toBe('#404040')
  })
})

describe('diceLookPresetSwatchPaint', () => {
  it('uses cssBody and cssInk for every preset', () => {
    for (const id of DICE_LOOK_PRESET_IDS) {
      const look = diceLookPreset(id)
      const paint = diceLookPresetSwatchPaint(id)
      expect(paint.id).toBe(id)
      expect(paint.body).toBe(look.cssBody)
      expect(paint.ink).toBe(look.cssInk)
      expect(paint.label).toBe(look.label)
      expect(paint.highlight).not.toBe(paint.body)
      expect(paint.shade).not.toBe(paint.body)
    }
  })

  it('marks steel as metallic and ruby as translucent', () => {
    const steel = diceLookPresetSwatchPaint('steel')
    const ruby = diceLookPresetSwatchPaint('ruby')
    const ivory = diceLookPresetSwatchPaint('ivory')
    expect(steel.metalness).toBeGreaterThan(0.5)
    expect(ruby.translucency).toBeGreaterThan(0.3)
    expect(ivory.metalness).toBe(0)
    expect(ivory.translucency).toBe(0)
    expect(steel.sheenOpacity).toBeGreaterThan(ivory.sheenOpacity * 0.8)
  })

  it('accepts a full preset object', () => {
    expect(diceLookPresetSwatchPaint(diceLookPreset('obsidian')).id).toBe('obsidian')
  })
})
