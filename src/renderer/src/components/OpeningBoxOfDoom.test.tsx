// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { BOX_OF_DOOM_SFX_LEAD_MS, BOX_OF_DOOM_TUMBLE_MS } from '../../../shared/boxOfDoom'
import { playDiceRollSound } from '../../../shared/diceRollSound'
import type { PlayerBoxOfDoom } from '../../../shared/types'
import OpeningBoxOfDoom from './OpeningBoxOfDoom'

vi.mock('../../../shared/diceRollSound', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../shared/diceRollSound')>()
  return { ...actual, playDiceRollSound: vi.fn() }
})

function roll(overrides: Partial<PlayerBoxOfDoom> = {}): PlayerBoxOfDoom {
  return {
    dc: 15,
    modifier: 0,
    startedAt: 1_000_000,
    rolledAt: 1_000_000,
    d20: 12,
    total: 12,
    success: false,
    ...overrides
  }
}

describe('OpeningBoxOfDoom sound timing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    vi.mocked(playDiceRollSound).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('holds the clatter until late in the tumble', () => {
    render(<OpeningBoxOfDoom roll={roll()} />)
    expect(playDiceRollSound).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(BOX_OF_DOOM_TUMBLE_MS - BOX_OF_DOOM_SFX_LEAD_MS - 1)
    })
    expect(playDiceRollSound).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(playDiceRollSound).toHaveBeenCalledTimes(1)
  })

  it('does not play while waiting to roll or when sound is off', () => {
    const { rerender } = render(<OpeningBoxOfDoom roll={roll({ rolledAt: undefined })} />)
    act(() => {
      vi.advanceTimersByTime(BOX_OF_DOOM_TUMBLE_MS)
    })
    expect(playDiceRollSound).not.toHaveBeenCalled()

    rerender(<OpeningBoxOfDoom roll={roll({ sound: false })} />)
    act(() => {
      vi.advanceTimersByTime(BOX_OF_DOOM_TUMBLE_MS)
    })
    expect(playDiceRollSound).not.toHaveBeenCalled()
  })
})
