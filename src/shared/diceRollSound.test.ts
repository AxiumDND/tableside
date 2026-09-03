import { describe, expect, it } from 'vitest'
import { BUILTIN_DICE_ROLL_PATH, buildDiceRollWav, isBuiltinSfx } from './diceRollSound'

describe('dice roll sound', () => {
  it('recognizes the builtin mixer path', () => {
    expect(isBuiltinSfx(BUILTIN_DICE_ROLL_PATH)).toBe(true)
    expect(isBuiltinSfx('Audio/Sfx/Thunder.mp3')).toBe(false)
  })

  it('builds a mono 16-bit WAV', () => {
    const wav = buildDiceRollWav()
    const text = String.fromCharCode(...wav.subarray(0, 12))
    expect(text.startsWith('RIFF')).toBe(true)
    expect(text.includes('WAVE')).toBe(true)
    expect(wav.length).toBeGreaterThan(1000)
  })
})
