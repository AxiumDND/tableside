import { describe, expect, it } from 'vitest'
import { fallingDamageExpr } from '../../../shared/improviseRef'
import { resolveBoxOfDoom } from '../../../shared/boxOfDoom'
import {
  type DiceMode,
  rollBoxOfDoomD20s,
  rollD20,
  rollDie,
  rollExpr
} from './dice'

/** Deterministic PRNG for reproducible fairness checks (Mulberry32). */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function chiSquareUniform(counts: number[]): number {
  const total = counts.reduce((sum, n) => sum + n, 0)
  const expected = total / counts.length
  return counts.reduce((sum, observed) => sum + (observed - expected) ** 2 / expected, 0)
}

function collectFacesFromExpr(expr: string, mode: DiceMode, trials: number, seed: number): number[] {
  const rng = mulberry32(seed)
  const faces: number[] = []
  for (let i = 0; i < trials; i += 1) {
    const result = rollExpr(expr, mode, rng)
    for (const group of result.groups) {
      for (const face of group.rolls) {
        faces.push(Math.abs(face))
      }
    }
  }
  return faces
}

function assertFacesInRange(faces: number[], sides: number): void {
  for (const face of faces) {
    expect(Number.isInteger(face)).toBe(true)
    expect(face).toBeGreaterThanOrEqual(1)
    expect(face).toBeLessThanOrEqual(sides)
  }
}

const TABLE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const

/** Chi-square critical values at p≈0.001 — generous so CI stays stable for fair RNG. */
const CHI_SQUARE_LIMIT: Record<number, number> = {
  4: 18,
  6: 22,
  8: 24,
  10: 26,
  12: 28,
  20: 38,
  100: 150
}

describe('dice fairness — core rollDie', () => {
  it('maps each uniform bucket to every face on common dice', () => {
    for (const sides of TABLE_SIDES) {
      for (let face = 1; face <= sides; face += 1) {
        const u = (face - 0.5) / sides
        expect(rollDie(sides, () => u)).toBe(face)
      }
    }
  })

  it('always returns an integer in 1..sides for many seeded rolls', () => {
    const rng = mulberry32(0xdecaf)
    for (const sides of TABLE_SIDES) {
      for (let i = 0; i < 5000; i += 1) {
        const face = rollDie(sides, rng)
        expect(Number.isInteger(face)).toBe(true)
        expect(face).toBeGreaterThanOrEqual(1)
        expect(face).toBeLessThanOrEqual(sides)
      }
    }
  })

  it('treats invalid sides as a fair d1', () => {
    const rng = mulberry32(99)
    for (const sides of [0, -3, Number.NaN, Number.POSITIVE_INFINITY]) {
      for (let i = 0; i < 50; i += 1) {
        expect(rollDie(sides, rng)).toBe(1)
      }
    }
  })

  it('passes chi-square uniform distribution for d6 and d20', () => {
    const trials = 12_000
    for (const sides of [6, 20] as const) {
      const rng = mulberry32(sides * 10_001)
      const counts = Array.from({ length: sides }, () => 0)
      for (let i = 0; i < trials; i += 1) {
        counts[rollDie(sides, rng) - 1] += 1
      }
      expect(chiSquareUniform(counts)).toBeLessThan(CHI_SQUARE_LIMIT[sides])
    }
  })
})

describe('dice fairness — dice tray (rollExpr)', () => {
  const TRAY_EXPRS = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100', '2d6+3', '1d20+5', '4d6'] as const
  const TRAY_MODES: DiceMode[] = ['normal', 'advantage', 'disadvantage', 'crit']

  it('covers every tray die button and common formulas with in-range faces', () => {
    const rng = mulberry32(0xdecaf)
    for (const expr of TRAY_EXPRS) {
      for (const mode of TRAY_MODES) {
        const result = rollExpr(expr, mode, rng)
        for (const group of result.groups) {
          assertFacesInRange(
            group.rolls.map((v) => Math.abs(v)),
            group.sides
          )
        }
        if (mode === 'advantage' || mode === 'disadvantage') {
          const isSingleD20 = /^[+-]?\d*d20(?:[+-]\d+)?$/i.test(expr.replace(/\s/g, ''))
          if (isSingleD20) {
            expect(result.rolls.filter((v) => v > 0).length).toBeGreaterThanOrEqual(2)
          }
        }
        if (mode === 'crit' && /\d+d\d+/.test(expr)) {
          const baseCount = Number((/\d+(?=d)/.exec(expr) ?? ['0'])[0]) || 1
          const physical = result.groups.reduce((n, g) => n + g.rolls.length, 0)
          expect(physical).toBeGreaterThanOrEqual(baseCount * 2)
        }
      }
    }
  })

  it('rolls one fair d20 per normal tray check', () => {
    let calls = 0
    const rng = (): number => {
      calls += 1
      return mulberry32(42)()
    }
    rollExpr('1d20+3', 'normal', rng)
    expect(calls).toBe(1)
  })

  it('rolls two fair d20s for tray advantage and disadvantage', () => {
    let calls = 0
    const rng = (): number => {
      calls += 1
      return mulberry32(calls)()
    }
    rollExpr('1d20', 'advantage', rng)
    expect(calls).toBe(2)
    calls = 0
    rollExpr('1d20', 'disadvantage', rng)
    expect(calls).toBe(2)
  })

  it('passes chi-square on d20 faces from tray 1d20 rolls', () => {
    const faces = collectFacesFromExpr('1d20', 'normal', 12_000, 0xd20)
    const counts = Array.from({ length: 20 }, () => 0)
    for (const face of faces) counts[face - 1] += 1
    expect(chiSquareUniform(counts)).toBeLessThan(CHI_SQUARE_LIMIT[20])
  })

  it('passes chi-square on d6 faces from tray 2d6 damage', () => {
    const faces = collectFacesFromExpr('2d6+3', 'normal', 12_000, 0xd6d6)
    const counts = Array.from({ length: 6 }, () => 0)
    for (const face of faces) counts[face - 1] += 1
    expect(chiSquareUniform(counts)).toBeLessThan(CHI_SQUARE_LIMIT[6])
  })
})

describe('dice fairness — stat blocks & combat (rollD20 / rollExpr)', () => {
  it('statblock to-hit and save rolls use fair d20 faces', () => {
    const faces = collectFacesFromExpr('1d20+5', 'normal', 8000, 0x010010)
    assertFacesInRange(faces, 20)
    const counts = Array.from({ length: 20 }, () => 0)
    for (const face of faces) counts[face - 1] += 1
    expect(chiSquareUniform(counts)).toBeLessThan(CHI_SQUARE_LIMIT[20])
  })

  it('rollD20 initiative and checks stay in range with fair naturals', () => {
    const rng = mulberry32(0x020020)
    for (let i = 0; i < 2000; i += 1) {
      const init = rollD20(2, 'Init', 'normal', rng)
      const save = rollD20(-1, 'DEX save', 'advantage', rng)
      assertFacesInRange(init.rolls.map(Math.abs), 20)
      assertFacesInRange(save.rolls.map(Math.abs), 20)
      if (save.kept != null) {
        expect(save.kept).toBeGreaterThanOrEqual(1)
        expect(save.kept).toBeLessThanOrEqual(20)
      }
    }
  })

  it('statblock damage expressions roll fair physical dice', () => {
    const rng = mulberry32(0x030030)
    for (const expr of ['1d6+2', '2d8+4', '2d10'] as const) {
      const result = rollExpr(expr, 'normal', rng)
      for (const group of result.groups) {
        assertFacesInRange(
          group.rolls.map((v) => Math.abs(v)),
          group.sides
        )
      }
    }
  })
})

describe('dice fairness — box of doom (rollBoxOfDoomD20s)', () => {
  it('normal mode rolls exactly one fair d20', () => {
    let calls = 0
    const rng = (): number => {
      calls += 1
      return mulberry32(calls)()
    }
    const { first, second } = rollBoxOfDoomD20s('normal', rng)
    expect(calls).toBe(1)
    expect(first).toBeGreaterThanOrEqual(1)
    expect(first).toBeLessThanOrEqual(20)
    expect(second).toBeUndefined()
  })

  it('advantage and disadvantage each roll two fair d20s', () => {
    for (const mode of ['advantage', 'disadvantage'] as const) {
      let calls = 0
      const rng = (): number => {
        calls += 1
        return mulberry32(calls + (mode === 'advantage' ? 100 : 200))()
      }
      const { first, second } = rollBoxOfDoomD20s(mode, rng)
      expect(calls).toBe(2)
      assertFacesInRange([first, second!], 20)
      const resolved = resolveBoxOfDoom(15, first, 0, { mode, d20b: second })
      expect(resolved.d20).toBe(mode === 'advantage' ? Math.max(first, second!) : Math.min(first, second!))
    }
  })

  it('passes chi-square on each raw d20 from box-of-doom advantage rolls', () => {
    const rng = mulberry32(0x040040)
    const counts = Array.from({ length: 20 }, () => 0)
    for (let i = 0; i < 12_000; i += 1) {
      const { first, second } = rollBoxOfDoomD20s('advantage', rng)
      counts[first - 1] += 1
      counts[second! - 1] += 1
    }
    expect(chiSquareUniform(counts)).toBeLessThan(CHI_SQUARE_LIMIT[20])
  })
})

describe('dice fairness — improvise & falling damage (rollExpr)', () => {
  it('improvise damage buttons roll fair dice for each table expression', () => {
    const rng = mulberry32(0x050050)
    for (const expr of ['1d10', '2d10', '4d10', '10d10', '1d4', '2d4'] as const) {
      const result = rollExpr(expr, 'normal', rng)
      for (const group of result.groups) {
        assertFacesInRange(
          group.rolls.map((v) => Math.abs(v)),
          group.sides
        )
      }
    }
  })

  it('falling damage rolls Nd6 with N capped at 20 fair dice', () => {
    const calc = fallingDamageExpr('200')
    expect(calc.expr).toBe('20d6')
    const rng = mulberry32(0xfa11)
    const result = rollExpr(calc.expr!, 'normal', rng)
    expect(result.groups[0]?.rolls.length).toBe(20)
    assertFacesInRange(
      result.groups[0]!.rolls.map((v) => Math.abs(v)),
      6
    )
  })
})
