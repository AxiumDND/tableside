// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { emptyPlayerState } from '../../../shared/types'
import PlayerView from './PlayerView'

vi.mock('./LegendParticles', () => ({ default: () => null }))
vi.mock('./MapStage', () => ({ default: () => null }))

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
