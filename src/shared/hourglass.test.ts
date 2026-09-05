import { describe, expect, it } from 'vitest'
import {
  buildHourglassChimeWav,
  clampHourglassMinutes,
  formatHourglassClock,
  hourglassDurationMs,
  hourglassIsUrgent,
  hourglassPhase,
  hourglassProgress,
  hourglassRemainingMs
} from './hourglass'
import type { PlayerHourglass } from './types'

function glass(partial: Partial<PlayerHourglass> = {}): PlayerHourglass {
  return {
    durationMs: 60_000,
    shownAt: 1_000,
    ...partial
  }
}

describe('clampHourglassMinutes', () => {
  it('defaults and clamps to 1–120', () => {
    expect(clampHourglassMinutes(undefined)).toBe(5)
    expect(clampHourglassMinutes('nope')).toBe(5)
    expect(clampHourglassMinutes(0)).toBe(1)
    expect(clampHourglassMinutes(3.2)).toBe(3)
    expect(clampHourglassMinutes(999)).toBe(120)
  })
})

describe('hourglassDurationMs', () => {
  it('converts clamped minutes to milliseconds', () => {
    expect(hourglassDurationMs(5)).toBe(300_000)
    expect(hourglassDurationMs(1)).toBe(60_000)
  })
})

describe('hourglassRemainingMs', () => {
  it('uses the full duration while waiting', () => {
    expect(hourglassRemainingMs(glass(), 10_000)).toBe(60_000)
  })

  it('counts down from endsAt while running', () => {
    expect(hourglassRemainingMs(glass({ endsAt: 25_000 }), 10_000)).toBe(15_000)
    expect(hourglassRemainingMs(glass({ endsAt: 25_000 }), 25_000)).toBe(0)
    expect(hourglassRemainingMs(glass({ endsAt: 25_000 }), 30_000)).toBe(0)
  })

  it('holds remainingMs while paused', () => {
    expect(hourglassRemainingMs(glass({ remainingMs: 42_000, pausedAt: 8_000 }), 20_000)).toBe(42_000)
  })

  it('stays empty after expire', () => {
    expect(hourglassRemainingMs(glass({ expiredAt: 12_000, remainingMs: 0 }), 40_000)).toBe(0)
  })
})

describe('hourglassProgress and phase', () => {
  it('is full and waiting after Show', () => {
    const state = glass()
    expect(hourglassProgress(state, 2_000)).toBe(1)
    expect(hourglassPhase(state, 2_000)).toBe('wait')
  })

  it('runs, pauses, and expires', () => {
    const running = glass({ endsAt: 40_000 })
    expect(hourglassPhase(running, 10_000)).toBe('running')
    expect(hourglassProgress(running, 10_000)).toBe(0.5)

    const paused = glass({ remainingMs: 20_000, pausedAt: 9_000 })
    expect(hourglassPhase(paused, 30_000)).toBe('paused')
    expect(hourglassProgress(paused, 30_000)).toBeCloseTo(1 / 3)

    const expired = glass({ endsAt: 10_000 })
    expect(hourglassPhase(expired, 10_000)).toBe('expired')
    expect(hourglassProgress(expired, 10_000)).toBe(0)
  })

  it('marks the last 30 seconds as urgent', () => {
    expect(hourglassIsUrgent(glass({ endsAt: 40_000 }), 8_000)).toBe(false)
    expect(hourglassIsUrgent(glass({ endsAt: 40_000 }), 15_000)).toBe(true)
    expect(hourglassIsUrgent(glass({ endsAt: 40_000 }), 40_000)).toBe(false)
  })
})

describe('formatHourglassClock', () => {
  it('formats M:SS with a ceil countdown', () => {
    expect(formatHourglassClock(300_000)).toBe('5:00')
    expect(formatHourglassClock(600_000)).toBe('10:00')
    expect(formatHourglassClock(42_000)).toBe('0:42')
    expect(formatHourglassClock(1)).toBe('0:01')
    expect(formatHourglassClock(0)).toBe('0:00')
    expect(formatHourglassClock(-4)).toBe('0:00')
  })
})

describe('buildHourglassChimeWav', () => {
  it('writes a short WAV', () => {
    const bytes = buildHourglassChimeWav()
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('RIFF')
    expect(bytes.length).toBeGreaterThan(1000)
  })
})
