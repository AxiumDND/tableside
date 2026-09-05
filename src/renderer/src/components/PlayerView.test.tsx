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
