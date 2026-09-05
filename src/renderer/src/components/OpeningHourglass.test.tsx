// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import OpeningHourglass from './OpeningHourglass'

describe('OpeningHourglass', () => {
  it('shows a full waiting glass with the full clock', () => {
    const { container } = render(
      <OpeningHourglass glass={{ durationMs: 300_000, shownAt: 1 }} />
    )
    expect(container.querySelector('[aria-label="Hourglass — 5:00"]')).toBeTruthy()
    expect(container.querySelector('.hourglass-clock')?.textContent).toBe('5:00')
    expect(container.querySelector('.hourglass-kicker')?.textContent).toBe('Time')
    expect(container.querySelector('.hourglass-stream')).toBeNull()
  })

  it('holds an empty glass at zero', () => {
    const { container } = render(
      <OpeningHourglass glass={{ durationMs: 60_000, shownAt: 1, expiredAt: 2 }} />
    )
    expect(container.querySelector('[aria-label="Hourglass — time"]')).toBeTruthy()
    expect(container.querySelector('.hourglass-clock')?.textContent).toBe('0:00')
    expect(container.querySelector('.hourglass.is-expired')).toBeTruthy()
  })
})
