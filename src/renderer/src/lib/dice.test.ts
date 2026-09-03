import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  expandCritExpr,
  extractRolls,
  formatDicePlayerExpr,
  isDamageLabel,
  rollD20,
  rollExpr
} from './dice'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('expandCritExpr', () => {
  it('doubles dice counts and leaves the modifier', () => {
    expect(expandCritExpr('2d6+3')).toBe('4d6+3')
    expect(expandCritExpr('2d6+1d8+3')).toBe('4d6+2d8+3')
    expect(expandCritExpr('d8+2')).toBe('2d8+2')
  })
})

describe('rollExpr', () => {
  it('adds multiple die groups and a leftover bonus', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const result = rollExpr('2d6+1d8+3')
    expect(result.groups).toEqual([
      { sides: 6, rolls: [1, 1] },
      { sides: 8, rolls: [1] }
    ])
    expect(result.bonus).toBe(3)
    expect(result.total).toBe(6)
    expect(result.sides).toBe(6)
  })

  it('keeps the higher d20 on advantage', () => {
    const random = vi.spyOn(Math, 'random')
    random.mockReturnValueOnce(0.05).mockReturnValueOnce(0.9)
    const result = rollExpr('1d20+4', 'advantage')
    expect(result.rolls).toEqual([2, 19])
    expect(result.kept).toBe(19)
    expect(result.total).toBe(23)
    expect(result.mode).toBe('advantage')
  })

  it('keeps the lower d20 on disadvantage', () => {
    const random = vi.spyOn(Math, 'random')
    random.mockReturnValueOnce(0.9).mockReturnValueOnce(0.05)
    const result = rollExpr('1d20', 'disadvantage')
    expect(result.kept).toBe(2)
    expect(result.total).toBe(2)
  })

  it('rolls doubled dice on crit', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const result = rollExpr('2d6+3', 'crit')
    expect(result.expr).toBe('4d6+3')
    expect(result.rolls).toEqual([1, 1, 1, 1])
    expect(result.total).toBe(7)
    expect(result.mode).toBe('crit')
    expect(result.nat20).toBeFalsy()
    expect(result.nat1).toBeFalsy()
  })
})

describe('rollD20', () => {
  it('labels the check and applies a modifier', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const result = rollD20(3, 'STR')
    expect(result.expr).toBe('STR +3')
    expect(result.total).toBe(11 + 3)
  })

  it('flags a natural 20 as crit success', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.95)
    const result = rollD20(0, 'To hit')
    expect(result.nat20).toBe(true)
    expect(result.nat1).toBeFalsy()
    expect(formatDicePlayerExpr(result)).toContain('Crit success')
  })

  it('flags a natural 1 as crit fail', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const result = rollD20(5, 'DEX save')
    expect(result.nat1).toBe(true)
    expect(result.nat20).toBeFalsy()
    expect(formatDicePlayerExpr(result)).toContain('Crit fail')
  })
})

describe('extractRolls', () => {
  it('splits to-hit and damage', () => {
    const found = extractRolls('+5 to hit, Hit: 10 (2d6+3) piercing')
    expect(found).toContainEqual({ label: 'To hit', expr: '1d20+5' })
    expect(found).toContainEqual({ label: 'Damage', expr: '2d6+3', damageType: 'Piercing' })
    expect(isDamageLabel('Damage')).toBe(true)
    expect(isDamageLabel('To hit')).toBe(false)
  })

  it('reads necrotic and multi-type damage lines', () => {
    const found = extractRolls('Hit: 5 (1d6+2) Necrotic damage. Hit: 24 (2d8+4) piercing plus 11 (2d10) fire')
    expect(found).toContainEqual({ label: 'Damage 1', expr: '1d6+2', damageType: 'Necrotic' })
    expect(found).toContainEqual({ label: 'Damage 2', expr: '2d8+4', damageType: 'Piercing' })
    expect(found).toContainEqual({ label: 'Damage 3', expr: '2d10', damageType: 'Fire' })
  })
})

describe('formatDicePlayerExpr', () => {
  it('includes the damage type for statblock damage rolls', () => {
    expect(
      formatDicePlayerExpr({ expr: '2d6+3', rollLabel: 'Damage', damageType: 'Piercing' })
    ).toBe('Damage (Piercing) 2d6+3')
  })
})
