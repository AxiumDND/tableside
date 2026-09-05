import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PLAYER_IMAGE_PAD_PCT,
  MAX_PLAYER_IMAGE_PAD_PCT,
  MIN_PLAYER_IMAGE_PAD_PCT,
  clampPlayerImagePadPct,
  playerImagePadFromSettings
} from './playerImagePad'

describe('clampPlayerImagePadPct', () => {
  it('defaults, clamps, and rounds', () => {
    expect(clampPlayerImagePadPct(undefined)).toBe(DEFAULT_PLAYER_IMAGE_PAD_PCT)
    expect(clampPlayerImagePadPct('nope')).toBe(DEFAULT_PLAYER_IMAGE_PAD_PCT)
    expect(clampPlayerImagePadPct(-3)).toBe(MIN_PLAYER_IMAGE_PAD_PCT)
    expect(clampPlayerImagePadPct(99)).toBe(MAX_PLAYER_IMAGE_PAD_PCT)
    expect(clampPlayerImagePadPct(6.4)).toBe(6)
    expect(clampPlayerImagePadPct(0)).toBe(0)
  })
})

describe('playerImagePadFromSettings', () => {
  it('uses the default when the setting is omitted', () => {
    expect(playerImagePadFromSettings({})).toBe(DEFAULT_PLAYER_IMAGE_PAD_PCT)
    expect(playerImagePadFromSettings(null)).toBe(DEFAULT_PLAYER_IMAGE_PAD_PCT)
  })

  it('reads a saved percent', () => {
    expect(playerImagePadFromSettings({ playerImagePadPct: 10 })).toBe(10)
  })
})
