import { describe, expect, it } from 'vitest'
import {
  BOX_OF_DOOM_SFX_LEAD_MS,
  BOX_OF_DOOM_TUMBLE_MS,
  boxOfDoomHoldMs,
  boxOfDoomPhase,
  boxOfDoomSfxDelayMs,
  resolveBoxOfDoom,
  tumbleFace
} from './boxOfDoom'

describe('resolveBoxOfDoom', () => {
  it('beats the DC on a high total', () => {
    expect(resolveBoxOfDoom(15, 12, 4)).toMatchObject({ total: 16, success: true, nat20: false })
  })

  it('fails a miss that is not a 20', () => {
    expect(resolveBoxOfDoom(18, 10, 2)).toMatchObject({ total: 12, success: false })
  })

  it('treats a natural 20 as a success and a natural 1 as a fail', () => {
    expect(resolveBoxOfDoom(30, 20, 0).success).toBe(true)
    expect(resolveBoxOfDoom(5, 1, 10).success).toBe(false)
  })

  it('keeps the higher die on advantage and the lower on disadvantage', () => {
    expect(resolveBoxOfDoom(15, 7, 0, { mode: 'advantage', d20b: 18 })).toMatchObject({
      d20: 18,
      rolls: [7, 18],
      success: true
    })
    expect(resolveBoxOfDoom(15, 18, 0, { mode: 'disadvantage', d20b: 7 })).toMatchObject({
      d20: 7,
      rolls: [18, 7],
      success: false
    })
  })

  it('uses the kept die for nat 20 / nat 1', () => {
    expect(resolveBoxOfDoom(30, 1, 0, { mode: 'advantage', d20b: 20 }).success).toBe(true)
    expect(resolveBoxOfDoom(5, 20, 0, { mode: 'disadvantage', d20b: 1 }).success).toBe(false)
  })
})

describe('boxOfDoomHoldMs', () => {
  it('defaults to 15 seconds and clamps out-of-range values', () => {
    expect(boxOfDoomHoldMs(undefined)).toBe(15_000)
    expect(boxOfDoomHoldMs(20)).toBe(20_000)
    expect(boxOfDoomHoldMs(1)).toBe(3_000)
    expect(boxOfDoomHoldMs(999)).toBe(120_000)
  })
})

describe('boxOfDoomSfxDelayMs', () => {
  it('waits until late in the tumble so the clatter meets the result', () => {
    expect(boxOfDoomSfxDelayMs(1000, 1000)).toBe(BOX_OF_DOOM_TUMBLE_MS - BOX_OF_DOOM_SFX_LEAD_MS)
    expect(boxOfDoomSfxDelayMs(1000, 1000 + BOX_OF_DOOM_TUMBLE_MS - BOX_OF_DOOM_SFX_LEAD_MS - 1)).toBe(1)
    expect(boxOfDoomSfxDelayMs(1000, 1000 + BOX_OF_DOOM_TUMBLE_MS - BOX_OF_DOOM_SFX_LEAD_MS)).toBe(0)
    expect(boxOfDoomSfxDelayMs(1000, 4000)).toBe(0)
    expect(boxOfDoomSfxDelayMs(null, 1000)).toBe(0)
  })
})

describe('boxOfDoomPhase', () => {
  it('waits until a roll starts', () => {
    expect(boxOfDoomPhase({}, 1800)).toBe('wait')
  })

  it('moves tumble → reveal → verdict from rolledAt', () => {
    expect(boxOfDoomPhase({ rolledAt: 1000 }, 1100)).toBe('tumble')
    expect(boxOfDoomPhase({ rolledAt: 1000 }, 2900)).toBe('reveal')
    expect(boxOfDoomPhase({ rolledAt: 1000 }, 4000)).toBe('verdict')
  })

  it('cycles faces while tumbling', () => {
    expect(tumbleFace(0, 0)).toBeGreaterThanOrEqual(1)
    expect(tumbleFace(0, 140)).not.toBe(tumbleFace(0, 0))
    expect(tumbleFace(0, 140, 1)).not.toBe(tumbleFace(0, 140, 0))
  })

  it('tumbleFace is deterministic cosmetic animation, not a random roll', () => {
    expect(tumbleFace(1000, 1500)).toBe(tumbleFace(1000, 1500))
    expect(tumbleFace(1000, 1500)).not.toBe(tumbleFace(1000, 1570))
  })
})
