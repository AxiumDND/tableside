// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { BUILTIN_HOURGLASS_CHIME_PATH } from '../../../shared/hourglass'
import HourglassPanel from './HourglassPanel'

describe('HourglassPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(2_000_000)
    window.tabledm = {
      mixerOneshot: vi.fn().mockResolvedValue({}),
      showHourglass: vi.fn().mockResolvedValue({}),
      startHourglass: vi.fn().mockResolvedValue({}),
      pauseHourglass: vi.fn().mockResolvedValue({}),
      resumeHourglass: vi.fn().mockResolvedValue({}),
      resetHourglass: vi.fn().mockResolvedValue({}),
      stopHourglass: vi.fn().mockResolvedValue({})
    } as unknown as Window['tabledm']
  })

  afterEach(() => {
    vi.useRealTimers()
    Reflect.deleteProperty(window, 'tabledm')
  })

  it('shows a full glass, then starts from a separate button', async () => {
    render(<HourglassPanel overlay={null} />)
    expect(screen.getByRole('button', { name: 'Start' })).toHaveProperty('disabled', true)

    await act(async () => {
      screen.getByRole('button', { name: 'Show' }).click()
    })
    expect(window.tabledm.showHourglass).toHaveBeenCalledWith({ minutes: 5, sound: true })
    expect(window.tabledm.startHourglass).not.toHaveBeenCalled()
  })

  it('starts only after the glass is waiting on the TV', async () => {
    render(
      <HourglassPanel overlay={{ durationMs: 60_000, shownAt: 1 }} />
    )
    expect(screen.getByRole('button', { name: 'Show' })).toHaveProperty('disabled', true)
    await act(async () => {
      screen.getByRole('button', { name: 'Start' }).click()
    })
    expect(window.tabledm.startHourglass).toHaveBeenCalled()
  })

  it('chimes once when the glass empties', async () => {
    render(
      <HourglassPanel overlay={{ durationMs: 60_000, shownAt: 9, endsAt: 2_000_000 }} />
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(window.tabledm.mixerOneshot).toHaveBeenCalledWith(BUILTIN_HOURGLASS_CHIME_PATH)
  })

  it('applies a custom minute value to a waiting glass', async () => {
    render(<HourglassPanel overlay={{ durationMs: 300_000, shownAt: 1 }} />)
    expect(screen.getByText('5:00')).toBeTruthy()
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '7' } })
    })
    expect(window.tabledm.resetHourglass).toHaveBeenCalledWith({ minutes: 7, refill: false })
    expect(screen.getByText('7:00')).toBeTruthy()
  })

  it('applies a preset to a waiting glass', async () => {
    render(<HourglassPanel overlay={{ durationMs: 300_000, shownAt: 1 }} />)
    await act(async () => {
      screen.getByRole('button', { name: '10 min' }).click()
    })
    expect(window.tabledm.resetHourglass).toHaveBeenCalledWith({ minutes: 10, refill: false })
    expect(screen.getByText('10:00')).toBeTruthy()
  })

  it('skips the chime when sound is off', async () => {
    const { rerender } = render(<HourglassPanel overlay={{ durationMs: 60_000, shownAt: 1 }} />)
    await act(async () => {
      screen.getByRole('checkbox', { name: 'Chime at zero' }).click()
    })
    rerender(<HourglassPanel overlay={{ durationMs: 60_000, shownAt: 9, endsAt: 2_000_000 }} />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(window.tabledm.mixerOneshot).not.toHaveBeenCalled()
  })
})
