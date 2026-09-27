import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DICE_LOOK_PRESET,
  DICE_LOOK_PRESET_IDS,
  DICE_LOOK_PRESETS,
  diceLookPreset,
  diceLookPresetFromSettings,
  parseDiceLookPresetId
} from './diceLookPreset'

describe('parseDiceLookPresetId', () => {
  it('defaults to ivory resin', () => {
    expect(parseDiceLookPresetId(undefined)).toBe(DEFAULT_DICE_LOOK_PRESET)
    expect(parseDiceLookPresetId('')).toBe('ivory')
    expect(parseDiceLookPresetId('nope')).toBe('ivory')
  })

  it('accepts every shipped id', () => {
    for (const id of DICE_LOOK_PRESET_IDS) {
      expect(parseDiceLookPresetId(id)).toBe(id)
      expect(DICE_LOOK_PRESETS[id].id).toBe(id)
      expect(DICE_LOOK_PRESETS[id].label.length).toBeGreaterThan(0)
      expect(DICE_LOOK_PRESETS[id].body).toBeGreaterThan(0)
    }
  })
})

describe('diceLookPreset material mapping', () => {
  it('keeps ivory matching the classic resin bag', () => {
    const ivory = diceLookPreset('ivory')
    expect(ivory.body).toBe(0xeae4da)
    expect(ivory.droppedBody).toBe(0x8a847c)
    expect(ivory.ink).toBe('#1a1612')
    expect(ivory.metalness).toBe(0)
    expect(ivory.transmission).toBe(0)
  })

  it('makes metal and translucent bags clearly different from ivory', () => {
    const steel = diceLookPreset('steel')
    const ruby = diceLookPreset('ruby')
    const ivory = diceLookPreset('ivory')
    expect(steel.metalness).toBeGreaterThan(0.5)
    expect(ruby.transmission).toBeGreaterThan(0.3)
    expect(steel.body).not.toBe(ivory.body)
    expect(ruby.body).not.toBe(ivory.body)
  })

  it('reads the id from app settings', () => {
    expect(diceLookPresetFromSettings({})).toBe('ivory')
    expect(diceLookPresetFromSettings({ diceLookPreset: 'obsidian' })).toBe('obsidian')
    expect(diceLookPresetFromSettings(null)).toBe('ivory')
  })
})
