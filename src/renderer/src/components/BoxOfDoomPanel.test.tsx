// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { BOX_OF_DOOM_SFX_LEAD_MS, BOX_OF_DOOM_TUMBLE_MS } from '../../../shared/boxOfDoom'
import { BUILTIN_DICE_ROLL_PATH } from '../../../shared/diceRollSound'
import BoxOfDoomPanel from './BoxOfDoomPanel'

describe('BoxOfDoomPanel sound timing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(2_000_000)
    window.tabledm = {
      mixerOneshot: vi.fn().mockResolvedValue({}),
      rollBoxOfDoom: vi.fn().mockResolvedValue({}),
      showBoxOfDoom: vi.fn().mockResolvedValue({}),
      stopBoxOfDoom: vi.fn().mockResolvedValue({})
    } as unknown as Window['tabledm']
  })

  afterEach(() => {
    vi.useRealTimers()
    Reflect.deleteProperty(window, 'tabledm')
  })

  it('delays the mixer clatter until the dice are about to land', async () => {
    render(
      <BoxOfDoomPanel
        overlay={{ dc: 15, modifier: 0, startedAt: 1 }}
        soundEnabled
        onSoundEnabled={() => {}}
      />
    )

    await act(async () => {
      screen.getByRole('button', { name: 'Roll' }).click()
    })
    expect(window.tabledm.mixerOneshot).not.toHaveBeenCalled()
    expect(window.tabledm.rollBoxOfDoom).toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(BOX_OF_DOOM_TUMBLE_MS - BOX_OF_DOOM_SFX_LEAD_MS - 1)
    })
    expect(window.tabledm.mixerOneshot).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(window.tabledm.mixerOneshot).toHaveBeenCalledWith(BUILTIN_DICE_ROLL_PATH)
  })

  it('skips the delayed clatter when sound is off', async () => {
    render(
      <BoxOfDoomPanel
        overlay={{ dc: 15, modifier: 0, startedAt: 1 }}
        soundEnabled={false}
        onSoundEnabled={() => {}}
      />
    )

    await act(async () => {
      screen.getByRole('button', { name: 'Roll' }).click()
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(BOX_OF_DOOM_TUMBLE_MS)
    })
    expect(window.tabledm.mixerOneshot).not.toHaveBeenCalled()
  })
})
