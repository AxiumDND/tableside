import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PLAYER_IMAGE_PAD_PCT,
  MAX_PLAYER_IMAGE_PAD_PCT,
  MIN_PLAYER_IMAGE_PAD_PCT,
  clampPlayerImagePadPct,
  playerImagePadFromSettings
} from './playerImagePad'

const css = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../renderer/src/index.css'),
  'utf8'
)

function rule(selector: string): string {
  const match = css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]+)\\}`))
  if (!match) throw new Error(`missing CSS rule ${selector}`)
  return match[1]
}

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

describe('player still CSS', () => {
  it('sizes stills and gallery slides to the padded box so small art scales up', () => {
    const still = rule('.player-layer-still img')
    expect(still).toMatch(/width:\s*calc\(100% - 2 \* var\(--player-image-pad/)
    expect(still).toMatch(/height:\s*calc\(100% - 2 \* var\(--player-image-pad/)
    expect(still).toMatch(/object-fit:\s*contain/)
    expect(still).not.toMatch(/width:\s*auto/)
    const gallery = rule('.opening-gallery-slide')
    expect(gallery).toMatch(/width:\s*calc\(100% - 2 \* var\(--player-image-pad/)
    expect(gallery).toMatch(/height:\s*calc\(100% - 2 \* var\(--player-image-pad/)
  })
})
