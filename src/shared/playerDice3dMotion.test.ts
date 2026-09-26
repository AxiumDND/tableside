import { describe, expect, it } from 'vitest'
import {
  bouncePulse,
  clamp01,
  dieThrowFlair,
  easeOutCubic,
  easeOutQuint,
  planDieThrowMotions,
  sampleDieThrow,
  type DieThrowMotion
} from './playerDice3dMotion'

function fixedRng(values: number[]): () => number {
  let i = 0
  return () => {
    const v = values[i % values.length] ?? 0
    i += 1
    return v
  }
}

const baseMotion = (overrides: Partial<DieThrowMotion> = {}): DieThrowMotion => ({
  landT: 0.55,
  flightPeak: 1.4,
  bounce2: 0.6,
  wobble: 0.05,
  wobblePhase: 1.2,
  flair: 'none',
  ...overrides
})

describe('clamp01 / eases', () => {
  it('clamps and eases to the unit interval', () => {
    expect(clamp01(-1)).toBe(0)
    expect(clamp01(2)).toBe(1)
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
    expect(easeOutQuint(0.5)).toBeGreaterThan(easeOutCubic(0.5))
  })
})

describe('bouncePulse', () => {
  it('peaks mid-bounce and is zero outside the window', () => {
    expect(bouncePulse(-0.1, 0.1, 1)).toBe(0)
    expect(bouncePulse(0.1, 0.1, 1)).toBe(0)
    expect(bouncePulse(0.05, 0.1, 1)).toBeCloseTo(1, 5)
  })
})

describe('dieThrowFlair', () => {
  it('flags kept d20 crits and fails only', () => {
    expect(dieThrowFlair({ sides: 20, value: 20 })).toBe('nat20')
    expect(dieThrowFlair({ sides: 20, value: 1 })).toBe('nat1')
    expect(dieThrowFlair({ sides: 20, value: 12 })).toBe('none')
    expect(dieThrowFlair({ sides: 6, value: 1 })).toBe('none')
    expect(dieThrowFlair({ sides: 20, value: 20, dropped: true })).toBe('none')
  })
})

describe('planDieThrowMotions', () => {
  it('staggers land times and stays within the cinematic window', () => {
    const motions = planDieThrowMotions(
      4,
      fixedRng([0.2, 0.5, 0.8, 0.1, 0.9, 0.3, 0.4, 0.6, 0.7, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75])
    )
    expect(motions).toHaveLength(4)
    for (let i = 1; i < motions.length; i += 1) {
      expect(motions[i]!.landT).toBeGreaterThanOrEqual(motions[i - 1]!.landT)
    }
    for (const m of motions) {
      expect(m.landT).toBeGreaterThanOrEqual(0.5)
      expect(m.landT).toBeLessThanOrEqual(0.68)
      expect(m.flightPeak).toBeGreaterThan(1)
      expect(m.wobble).toBeGreaterThan(0)
      expect(m.flair).toBe('none')
    }
  })

  it('attaches nat20 / nat1 flair from the planned die faces', () => {
    const motions = planDieThrowMotions(
      [
        { sides: 20, value: 20 },
        { sides: 20, value: 1 },
        { sides: 6, value: 6 }
      ],
      fixedRng([0.2, 0.4, 0.6, 0.1, 0.3, 0.5, 0.7, 0.8, 0.9])
    )
    expect(motions.map((m) => m.flair)).toEqual(['nat20', 'nat1', 'none'])
    expect(motions[0]!.flightPeak).toBeGreaterThan(motions[1]!.flightPeak)
    expect(motions[0]!.bounce2).toBeGreaterThan(0)
    expect(motions[1]!.bounce2).toBe(0)
  })

  it('returns an empty plan for zero dice', () => {
    expect(planDieThrowMotions(0)).toEqual([])
  })
})

describe('sampleDieThrow', () => {
  it('starts in the air and ends rested on the predetermined land pose', () => {
    const motion = baseMotion()
    const start = sampleDieThrow(0, motion)
    expect(start.planar).toBe(0)
    expect(start.orient).toBe(0)
    expect(start.spin).toBe(1)
    expect(start.height).toBeCloseTo(0, 5)
    expect(start.scale).toBe(1)
    expect(start.cameraPunch).toBe(0)

    const mid = sampleDieThrow(motion.landT * 0.5, motion)
    expect(mid.height).toBeGreaterThan(0.5)
    expect(mid.spin).toBeGreaterThan(0)
    expect(mid.planar).toBeGreaterThan(0)
    expect(mid.planar).toBeLessThan(1)

    const end = sampleDieThrow(1, motion)
    expect(end.planar).toBe(1)
    expect(end.orient).toBe(1)
    expect(end.spin).toBe(0)
    expect(end.height).toBeLessThan(0.05)
    expect(Math.abs(end.wobbleX)).toBeLessThan(0.002)
    expect(end.glow).toBe(0)
    expect(end.shade).toBe(0)
  })

  it('produces a first bounce after land and an optional second hop', () => {
    const withSecond = baseMotion({ landT: 0.55, bounce2: 1 })
    const afterFirst = sampleDieThrow(0.55 + 0.055, withSecond)
    expect(afterFirst.height).toBeGreaterThan(0.2)
    expect(afterFirst.planar).toBe(1)
    expect(afterFirst.spin).toBe(0)

    const afterSecond = sampleDieThrow(0.55 + 0.095 + 0.042, withSecond)
    expect(afterSecond.height).toBeGreaterThan(0.05)

    const noSecond = baseMotion({ landT: 0.55, bounce2: 0 })
    const quiet = sampleDieThrow(0.55 + 0.095 + 0.042, noSecond)
    expect(quiet.height).toBe(0)
  })

  it('applies settle wobble only after land', () => {
    const motion = baseMotion({ landT: 0.6, wobble: 0.08 })
    const before = sampleDieThrow(0.5, motion)
    expect(before.wobbleX).toBe(0)
    expect(before.wobbleY).toBe(0)
    expect(before.wobbleZ).toBe(0)

    const after = sampleDieThrow(0.62, motion)
    expect(Math.abs(after.wobbleX) + Math.abs(after.wobbleY) + Math.abs(after.wobbleZ)).toBeGreaterThan(0.01)
  })

  it('pops big with gold glow and camera punch on a nat20 land (TV-readable)', () => {
    const motion = baseMotion({ flair: 'nat20', landT: 0.55, bounce2: 1, wobble: 0.1 })
    const land = sampleDieThrow(0.55 + 0.08, motion)
    expect(land.scale).toBeGreaterThan(1.2)
    expect(land.glow).toBeGreaterThan(0.7)
    expect(land.shade).toBe(0)
    expect(land.cameraPunch).toBeGreaterThan(0.5)
    expect(land.spin).toBeGreaterThan(0)
    // Linger still readable mid-settle
    const linger = sampleDieThrow(0.55 + 0.22, motion)
    expect(linger.glow).toBeGreaterThan(0.35)
    expect(linger.scale).toBeGreaterThan(1.05)
  })

  it('thuds with dark shade, squash, and camera punch on a nat1 land (TV-readable)', () => {
    const motion = baseMotion({ flair: 'nat1', landT: 0.55, bounce2: 0, flightPeak: 0.7, wobble: 0.12 })
    const land = sampleDieThrow(0.55 + 0.07, motion)
    expect(land.scale).toBeLessThan(0.85)
    expect(land.shade).toBeGreaterThan(0.7)
    expect(land.glow).toBe(0)
    expect(land.cameraPunch).toBeGreaterThan(0.5)
    expect(land.spin).toBe(0)
    expect(land.height).toBeLessThan(0.3)
    const linger = sampleDieThrow(0.55 + 0.2, motion)
    expect(linger.shade).toBeGreaterThan(0.3)
  })
})
