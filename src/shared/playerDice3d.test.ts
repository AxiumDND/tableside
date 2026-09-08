import { describe, expect, it } from 'vitest'
import type { PlayerDiceShow } from './playerDiceShow'
import {
  DICE_3D_MAX_MESHES,
  faceLabelsForDie,
  percentilePair,
  planPlayerDice3dThrow,
  playerDice3dShouldThrow
} from './playerDice3d'

function show(overrides: Partial<PlayerDiceShow> = {}): PlayerDiceShow {
  return {
    source: 'Dice Tray',
    expr: '1d20',
    total: 12,
    groups: [{ sides: 20, rolls: [12] }],
    bonus: 0,
    startedAt: 1,
    ...overrides
  }
}

describe('percentilePair', () => {
  it('splits 1–99 and treats 100 as 00 + 0', () => {
    expect(percentilePair(7)).toEqual({ tens: 0, ones: 7 })
    expect(percentilePair(10)).toEqual({ tens: 10, ones: 0 })
    expect(percentilePair(23)).toEqual({ tens: 20, ones: 3 })
    expect(percentilePair(100)).toEqual({ tens: 0, ones: 0 })
  })
})

describe('planPlayerDice3dThrow', () => {
  it('keeps a single d20', () => {
    expect(planPlayerDice3dThrow(show())).toEqual([
      { sides: 20, value: 12, label: '12', dropped: false }
    ])
  })

  it('dims the unused advantage die', () => {
    const planned = planPlayerDice3dThrow(
      show({
        expr: '1d20',
        mode: 'advantage',
        kept: 17,
        groups: [{ sides: 20, rolls: [4, 17] }],
        total: 17
      })
    )
    expect(planned).toEqual([
      { sides: 20, value: 4, label: '4', dropped: true },
      { sides: 20, value: 17, label: '17', dropped: false }
    ])
  })

  it('turns a d100 into two d10s', () => {
    expect(planPlayerDice3dThrow(show({ expr: '1d100', groups: [{ sides: 100, rolls: [23] }], total: 23 }))).toEqual([
      { sides: 10, value: 20, label: '20', faceSet: 'd10-tens' },
      { sides: 10, value: 3, label: '3', faceSet: 'd10-ones' }
    ])
  })

  it('shows 00 on the tens die for a single-digit d100', () => {
    expect(planPlayerDice3dThrow(show({ expr: '1d100', groups: [{ sides: 100, rolls: [7] }], total: 7 }))).toEqual([
      { sides: 10, value: 0, label: '00', faceSet: 'd10-tens' },
      { sides: 10, value: 7, label: '7', faceSet: 'd10-ones' }
    ])
  })

  it('caps a handful at the player-strip limit', () => {
    const rolls = Array.from({ length: 20 }, (_, i) => (i % 6) + 1)
    const planned = planPlayerDice3dThrow(show({ expr: '20d6', groups: [{ sides: 6, rolls }], total: 70 }))
    expect(planned).toHaveLength(DICE_3D_MAX_MESHES)
  })
})

describe('faceLabelsForDie', () => {
  it('uses 1..N for a standard polyhedron', () => {
    expect(faceLabelsForDie({ sides: 20 })).toEqual(Array.from({ length: 20 }, (_, i) => String(i + 1)))
    expect(faceLabelsForDie({ sides: 6 })).toHaveLength(6)
  })

  it('uses percentile faces for a split d100', () => {
    expect(faceLabelsForDie({ sides: 10, faceSet: 'd10-tens' })[0]).toBe('00')
    expect(faceLabelsForDie({ sides: 10, faceSet: 'd10-ones' })).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9'
    ])
  })
})

describe('playerDice3dShouldThrow', () => {
  it('throws tray rolls on the real player view only', () => {
    expect(playerDice3dShouldThrow(show())).toBe(true)
    expect(playerDice3dShouldThrow(show(), { compact: true })).toBe(false)
    expect(playerDice3dShouldThrow(show({ source: 'Goblin' }))).toBe(false)
    expect(playerDice3dShouldThrow(show({ groups: [] }))).toBe(false)
    expect(playerDice3dShouldThrow(null)).toBe(false)
  })
})
