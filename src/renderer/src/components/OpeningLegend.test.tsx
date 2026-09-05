// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { LEGEND_HOLD_MS, legendEndStillAtMs } from '../../../shared/openingLegend'
import type { PlayerLegend } from '../../../shared/types'
import OpeningLegend from './OpeningLegend'

vi.mock('./LegendParticles', () => ({ default: () => null }))

function tale(overrides: Partial<PlayerLegend> = {}): PlayerLegend {
  return {
    title: 'The Pale Well',
    body: 'The well runs cold.',
    endSrc: 'tabledm://end.png',
    startedAt: 1,
    look: 'embers',
    ...overrides
  }
}

describe('OpeningLegend end still', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps the closing still while the chronicle fades out', () => {
    const { container, rerender } = render(<OpeningLegend legend={tale()} />)
    act(() => {
      vi.advanceTimersByTime(legendEndStillAtMs('The Pale Well', 'The well runs cold.') + 1)
    })
    expect(container.querySelector('.opening-legend-end img')?.getAttribute('src')).toBe(
      'tabledm://end.png'
    )
    expect(container.querySelector('.opening-legend.is-done')).toBeNull()

    rerender(<OpeningLegend legend={tale({ stoppingAt: 9 })} />)
    expect(container.querySelector('.opening-legend.is-done')).toBeTruthy()
    expect(container.querySelector('.opening-legend-end img')?.getAttribute('src')).toBe(
      'tabledm://end.png'
    )
  })

  it('starts the scroll after the mist hold', () => {
    const { container } = render(<OpeningLegend legend={tale({ endSrc: null })} />)
    expect(container.querySelector('.opening-legend-tapestry')).toBeNull()
    act(() => {
      vi.advanceTimersByTime(LEGEND_HOLD_MS)
    })
    expect(container.querySelector('.opening-legend-tapestry')).toBeTruthy()
  })
})
