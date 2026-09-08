// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import type { PlayerDiceShow } from '../../../shared/playerDiceShow'
import OpeningDiceShow from './OpeningDiceShow'

function show(overrides: Partial<PlayerDiceShow> = {}): PlayerDiceShow {
  return {
    source: 'Dice Tray',
    expr: '1d20',
    total: 17,
    groups: [{ sides: 20, rolls: [17] }],
    bonus: 0,
    startedAt: 1,
    ...overrides
  }
}

describe('OpeningDiceShow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the total immediately when there is no throw delay', () => {
    const { container } = render(<OpeningDiceShow show={show()} />)
    expect(container.querySelector('.player-dice-show-result.is-in')).toBeTruthy()
    expect(container.querySelector('.player-dice-show-total')?.textContent).toBe('17')
    expect(screen.getByLabelText('1d20 = 17')).toBeTruthy()
  })

  it('holds faces and total until a 3D throw lands', () => {
    render(<OpeningDiceShow show={show()} revealAfterMs={1400} />)
    expect(screen.getByText('Dice Tray')).toBeTruthy()
    expect(screen.getByText('1d20')).toBeTruthy()
    expect(document.querySelector('.player-dice-show-result.is-in')).toBeNull()
    act(() => {
      vi.advanceTimersByTime(1400)
    })
    expect(document.querySelector('.player-dice-show-result.is-in')).toBeTruthy()
    expect(document.querySelector('.player-dice-show-total')?.textContent).toBe('17')
  })
})
