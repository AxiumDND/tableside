// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { emptyPlayerState } from '../../../shared/types'
import PlayerView from './PlayerView'

vi.mock('./LegendParticles', () => ({ default: () => null }))
vi.mock('./MapStage', () => ({ default: () => null }))
vi.mock('./OpeningDice3d', () => ({
  default: () => <div className="player-dice-3d" data-dice-3d="mock" />
}))

describe('PlayerView still fades', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fades the first still in from black', () => {
    const { container } = render(
      <PlayerView state={{ ...emptyPlayerState(), imageSrc: 'tabledm://a.png' }} />
    )
    expect(container.querySelector('.player-layer.player-fade-in img')?.getAttribute('src')).toBe(
      'tabledm://a.png'
    )
    expect(container.querySelector('.player-layer-still')).toBeTruthy()
    expect(container.querySelector('.player-stage')?.getAttribute('style')).toContain('--player-image-pad: 4%')
  })

  it('applies the saved picture padding to stills', () => {
    const { container } = render(
      <PlayerView state={{ ...emptyPlayerState(), imageSrc: 'tabledm://a.png', imagePadPct: 12 }} />
    )
    expect(container.querySelector('.player-stage')?.getAttribute('style')).toContain('--player-image-pad: 12%')
  })

  it('fades a new still over the previous layer', () => {
    const { container, rerender } = render(
      <PlayerView state={{ ...emptyPlayerState(), imageSrc: 'tabledm://end.png' }} />
    )
    rerender(<PlayerView state={{ ...emptyPlayerState(), imageSrc: 'tabledm://next.png' }} />)
    const layers = [...container.querySelectorAll('.player-layer img')]
    expect(layers.map((img) => img.getAttribute('src'))).toEqual([
      'tabledm://end.png',
      'tabledm://next.png'
    ])
    expect(container.querySelector('.player-layer.player-fade-in img')?.getAttribute('src')).toBe(
      'tabledm://next.png'
    )
  })

  it('fades the next still while a chronicle with an end still is stopping', () => {
    const { container, rerender } = render(
      <PlayerView
        state={{
          ...emptyPlayerState(),
          imageSrc: 'tabledm://end.png',
          legend: {
            title: 'The Pale Well',
            body: 'The well runs cold.',
            endSrc: 'tabledm://end.png',
            startedAt: 1,
            look: 'embers'
          }
        }}
      />
    )
    rerender(
      <PlayerView
        state={{
          ...emptyPlayerState(),
          imageSrc: 'tabledm://caves.png',
          legend: {
            title: 'The Pale Well',
            body: 'The well runs cold.',
            endSrc: 'tabledm://end.png',
            startedAt: 1,
            look: 'embers',
            stoppingAt: 9
          }
        }}
      />
    )
    expect(container.querySelector('.opening-legend.is-done')).toBeTruthy()
    expect(container.querySelector('.player-layer.player-fade-in img')?.getAttribute('src')).toBe(
      'tabledm://caves.png'
    )
  })
})

describe('PlayerView calendar light', () => {
  it('shows the morning mark without a clock', () => {
    const { container } = render(
      <PlayerView state={{ ...emptyPlayerState(), calendarMark: 'morning' }} />
    )
    const mark = container.querySelector('.player-calendar-light')
    expect(mark?.getAttribute('aria-label')).toBe('Morning')
    expect(mark?.textContent).toBe('Morning')
    expect(container.textContent).not.toMatch(/\d+\s?(am|pm)/i)
  })

  it('hides the mark when the player state has none', () => {
    const { container } = render(<PlayerView state={emptyPlayerState()} />)
    expect(container.querySelector('.player-calendar-light')).toBeNull()
  })

  it('keeps the in-stage mark in compact preview so scale matches the TV', () => {
    const { container } = render(
      <PlayerView state={{ ...emptyPlayerState(), calendarMark: 'sunset' }} compact />
    )
    expect(container.querySelector('.player-calendar-light')?.getAttribute('aria-label')).toBe('Sunset')
  })
})

describe('PlayerView 3D dice', () => {
  const trayShow = {
    source: 'Dice Tray' as const,
    expr: '1d20',
    total: 14,
    groups: [{ sides: 20, rolls: [14] }],
    bonus: 0,
    startedAt: 1
  }

  it('throws 3D dice on the real player view for tray rolls', () => {
    const { container } = render(
      <PlayerView state={{ ...emptyPlayerState(), diceShow: trayShow }} />
    )
    expect(container.querySelector('[data-dice-3d="mock"]')).toBeTruthy()
    expect(container.querySelector('.player-dice-show-result.is-in')).toBeNull()
  })

  it('throws 3D dice for sheet rolls with a modifier', () => {
    const { container } = render(
      <PlayerView
        state={{
          ...emptyPlayerState(),
          diceShow: {
            ...trayShow,
            source: 'Goblin',
            expr: '1d20+3',
            bonus: 3,
            total: 17
          }
        }}
      />
    )
    expect(container.querySelector('[data-dice-3d="mock"]')).toBeTruthy()
    expect(container.querySelector('.player-dice-show-result.is-in')).toBeNull()
  })

  it('keeps the DM preview on the 2D result card', () => {
    const { container } = render(
      <PlayerView state={{ ...emptyPlayerState(), diceShow: trayShow }} compact />
    )
    expect(container.querySelector('[data-dice-3d]')).toBeNull()
    expect(container.querySelector('.player-dice-show-result.is-in')).toBeTruthy()
  })
})

describe('PlayerView initiative strip', () => {
  const combat = {
    showInitiative: true,
    initiative: [{ id: 'a', name: 'Goblin', initiative: 12, active: true }]
  }

  it('hides the strip under a live campfire chronicle', () => {
    const { container } = render(
      <PlayerView
        state={{
          ...emptyPlayerState(),
          ...combat,
          legend: {
            title: 'The Pale Well',
            body: 'The well runs cold.',
            endSrc: 'tabledm://end.png',
            startedAt: 1
          }
        }}
      />
    )
    expect(container.querySelector('.player-init')).toBeNull()
  })

  it('shows the strip after the chronicle overlay is cleared onto the end still', () => {
    const { container } = render(
      <PlayerView
        state={{
          ...emptyPlayerState(),
          ...combat,
          imageSrc: 'tabledm://end.png'
        }}
      />
    )
    expect(container.querySelector('.player-init')).toBeTruthy()
    expect(container.querySelector('.player-init-name')?.textContent).toBe('Goblin')
    expect(container.querySelector('.opening-legend')).toBeNull()
  })
})
