import { describe, expect, it } from 'vitest'
import {
  BUILTIN_DICE_ROLL_MULTI_PATH,
  BUILTIN_DICE_ROLL_PATH,
  buildMultiDiceRollWav,
  buildSingleDiceRollWav,
  builtinDiceRollPath,
  diceRollVariantForPath,
  isBuiltinSfx
} from './diceRollSound'

describe('dice roll sound', () => {
  it('recognizes both builtin mixer paths', () => {
    expect(isBuiltinSfx(BUILTIN_DICE_ROLL_PATH)).toBe(true)
    expect(isBuiltinSfx(BUILTIN_DICE_ROLL_MULTI_PATH)).toBe(true)
    expect(isBuiltinSfx('Audio/Sfx/Thunder.mp3')).toBe(false)
  })

  it('maps die count to the right builtin path', () => {
    expect(builtinDiceRollPath(1)).toBe(BUILTIN_DICE_ROLL_PATH)
    expect(builtinDiceRollPath(2)).toBe(BUILTIN_DICE_ROLL_MULTI_PATH)
    expect(diceRollVariantForPath(BUILTIN_DICE_ROLL_MULTI_PATH)).toBe('multi')
    expect(diceRollVariantForPath(BUILTIN_DICE_ROLL_PATH)).toBe('single')
  })

  it('builds mono 16-bit WAV clips', () => {
    for (const wav of [buildSingleDiceRollWav(), buildMultiDiceRollWav()]) {
      const text = String.fromCharCode(...wav.subarray(0, 12))
      expect(text.startsWith('RIFF')).toBe(true)
      expect(text.includes('WAVE')).toBe(true)
      expect(wav.length).toBeGreaterThan(1000)
    }
    expect(buildMultiDiceRollWav().length).toBeGreaterThan(buildSingleDiceRollWav().length)
  })
})
