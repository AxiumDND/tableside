// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import type { PlayerDiceShow } from '../../../shared/playerDiceShow'
import { mountPlayerDice3d } from '../lib/playerDice3dWorld'
import OpeningDice3d from './OpeningDice3d'

vi.mock('../lib/playerDice3dWorld', () => ({
  mountPlayerDice3d: vi.fn(() => ({ dispose: vi.fn() }))
}))

function show(overrides: Partial<PlayerDiceShow> = {}): PlayerDiceShow {
  return {
    source: 'Dice Tray',
    expr: '2d6+3',
    total: 11,
    groups: [{ sides: 6, rolls: [4, 4] }],
    bonus: 3,
    startedAt: 10,
    ...overrides
  }
}

describe('OpeningDice3d', () => {
  it('mounts a WebGL throw when the world is available', async () => {
    vi.mocked(mountPlayerDice3d).mockReturnValue({ dispose: vi.fn() })
    const { container } = render(<OpeningDice3d show={show()} />)
    await waitFor(() => {
      expect(container.querySelector('[data-dice-3d="webgl"]')).toBeTruthy()
    })
    expect(mountPlayerDice3d).toHaveBeenCalled()
  })

  it('falls back to CSS dice when WebGL cannot start', async () => {
    vi.mocked(mountPlayerDice3d).mockReturnValue(null)
    const { container } = render(<OpeningDice3d show={show()} />)
    await waitFor(() => {
      expect(container.querySelector('[data-dice-3d="css"]')).toBeTruthy()
    })
    expect(container.querySelectorAll('.player-dice-3d-css-die')).toHaveLength(2)
  })
})
