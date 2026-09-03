import { describe, expect, it } from 'vitest'
import { DAMAGE_SEVERITY, HEALING_POTIONS, IMPROVISED_DAMAGE, fallingDamageExpr } from './improviseRef'

describe('improviseRef', () => {
  it('lists the four 2024 healing potions', () => {
    expect(HEALING_POTIONS.map((row) => row.dice)).toEqual(['2d4 + 2', '4d4 + 4', '8d4 + 8', '10d4 + 20'])
    expect(HEALING_POTIONS[0]?.average).toBe(7)
    expect(HEALING_POTIONS[3]?.average).toBe(45)
  })

  it('uses the 2024 d10 damage ladder and severity by level', () => {
    expect(IMPROVISED_DAMAGE.map((row) => row.dice)).toEqual(['1d10', '2d10', '4d10', '10d10', '18d10', '24d10'])
    expect(DAMAGE_SEVERITY[0]).toMatchObject({ levels: '1–4', setback: '1d10', deadly: '4d10' })
    expect(DAMAGE_SEVERITY[3]?.deadly).toBe('24d10')
  })

  it('computes falling damage from distance in feet', () => {
    expect(fallingDamageExpr(10)).toMatchObject({ expr: '1d6', diceCount: 1, capped: false, feet: 10 })
    expect(fallingDamageExpr(30)).toMatchObject({ expr: '3d6', diceCount: 3 })
    expect(fallingDamageExpr(9)).toMatchObject({ expr: '', diceCount: 0 })
    expect(fallingDamageExpr(250)).toMatchObject({ expr: '20d6', diceCount: 20, capped: true })
  })
})
