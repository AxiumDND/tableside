import { describe, expect, it } from 'vitest'
import { DICE_SHOW_HOLD_MS, SKIP_PLAYER_DICE_SOURCES } from './playerDiceShow'

describe('player dice show', () => {
  it('holds the strip for 15 seconds', () => {
    expect(DICE_SHOW_HOLD_MS).toBe(15_000)
  })

  it('keeps Box of Doom off the right-hand strip', () => {
    expect(SKIP_PLAYER_DICE_SOURCES.has('Dice check')).toBe(true)
  })
})
