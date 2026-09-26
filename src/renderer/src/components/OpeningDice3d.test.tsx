// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
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
  afterEach(() => {
    Reflect.deleteProperty(window, 'tabledm')
    vi.mocked(mountPlayerDice3d).mockClear()
  })

  it('mounts a WebGL throw when the world is available', async () => {
    vi.mocked(mountPlayerDice3d).mockReturnValue({ dispose: vi.fn() })
    const { container } = render(<OpeningDice3d show={show()} />)
    await waitFor(() => {
      expect(container.querySelector('[data-dice-3d="webgl"]')).toBeTruthy()
    })
    expect(mountPlayerDice3d).toHaveBeenCalled()
    expect(vi.mocked(mountPlayerDice3d).mock.calls[0]?.[2]).toMatchObject({
      lookPreset: 'ivory'
    })
  })

  it('keeps the settled WebGL world mounted while the show fades out', async () => {
    const dispose = vi.fn()
    vi.mocked(mountPlayerDice3d).mockReturnValue({ dispose })
    const initial = show()
    const { container, rerender } = render(<OpeningDice3d show={initial} />)
    await waitFor(() => {
      expect(container.querySelector('[data-dice-3d="webgl"]')).toBeTruthy()
    })
    expect(mountPlayerDice3d).toHaveBeenCalledTimes(1)

    rerender(<OpeningDice3d show={{ ...initial, stoppingAt: 99 }} />)
    await waitFor(() => {
      expect(container.querySelector('.player-dice-3d.is-out')).toBeTruthy()
    })
    // Fade must be opacity-only from the landed pose — remounting would replay the throw.
    expect(mountPlayerDice3d).toHaveBeenCalledTimes(1)
    expect(dispose).not.toHaveBeenCalled()
  })

  it('does not remount CSS dice when fade-out begins', async () => {
    vi.mocked(mountPlayerDice3d).mockReturnValue(null)
    const initial = show()
    const { container, rerender } = render(<OpeningDice3d show={initial} />)
    await waitFor(() => {
      expect(container.querySelector('[data-dice-3d="css"]')).toBeTruthy()
    })
    const firstDie = container.querySelector('.player-dice-3d-css-die')
    expect(firstDie).toBeTruthy()

    rerender(<OpeningDice3d show={{ ...initial, stoppingAt: 99 }} />)
    await waitFor(() => {
      expect(container.querySelector('.player-dice-3d.is-out')).toBeTruthy()
    })
    // Same DOM nodes ⇒ CSS throw keyframes keep fill-mode:forwards at the land pose.
    expect(container.querySelector('.player-dice-3d-css-die')).toBe(firstDie)
  })

  it('passes a saved bag preset into the WebGL mount', async () => {
    Object.defineProperty(window, 'tabledm', {
      configurable: true,
      value: {
        getSettings: vi.fn(async () => ({ diceLookPreset: 'obsidian' }))
      }
    })
    vi.mocked(mountPlayerDice3d).mockReturnValue({ dispose: vi.fn() })
    render(<OpeningDice3d show={show()} />)
    await waitFor(() => {
      expect(mountPlayerDice3d).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ lookPreset: 'obsidian' })
      )
    })
  })

  it('falls back to CSS dice when WebGL cannot start', async () => {
    vi.mocked(mountPlayerDice3d).mockReturnValue(null)
    const { container } = render(<OpeningDice3d show={show()} />)
    await waitFor(() => {
      expect(container.querySelector('[data-dice-3d="css"]')).toBeTruthy()
    })
    expect(container.querySelectorAll('.player-dice-3d-css-die')).toHaveLength(2)
  })

  it('dots a 6 on the CSS fallback and shrinks two-digit tens', async () => {
    vi.mocked(mountPlayerDice3d).mockReturnValue(null)
    const { container } = render(
      <OpeningDice3d
        show={show({
          expr: 'd100',
          total: 6,
          bonus: 0,
          groups: [{ sides: 100, rolls: [6] }]
        })}
      />
    )
    await waitFor(() => {
      expect(container.querySelector('[data-dice-3d="css"]')).toBeTruthy()
    })
    const faces = [...container.querySelectorAll('.player-dice-3d-css-face')]
    expect(faces.map((node) => node.textContent)).toEqual(['00', '6'])
    expect(faces[0]?.classList.contains('is-wide')).toBe(true)
    expect(faces[1]?.classList.contains('is-dotted')).toBe(true)
  })
})
