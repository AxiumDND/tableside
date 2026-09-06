import { describe, expect, it } from 'vitest'
import { emptyPlayerState } from './types'
import { applyPrologueEndStill } from './prologueEndStill'

describe('applyPrologueEndStill', () => {
  it('copies the chronicle end still and clears the overlay so initiative can return', () => {
    const startedAt = 10
    const next = applyPrologueEndStill(
      {
        ...emptyPlayerState(),
        imageSrc: null,
        showInitiative: true,
        legend: {
          title: 'The Pale Well',
          body: 'The well runs cold.',
          endSrc: 'tabledm://end.png',
          startedAt
        }
      },
      startedAt
    )
    expect(next.imageSrc).toBe('tabledm://end.png')
    expect(next.legend).toBeNull()
    expect(next.mapView).toBeNull()
  })

  it('copies a crawl end still and clears the crawl overlay', () => {
    const startedAt = 4
    const next = applyPrologueEndStill(
      {
        ...emptyPlayerState(),
        crawl: {
          title: 'Kestrel',
          body: 'Unrest.',
          endSrc: 'tabledm://planet.png',
          startedAt
        }
      },
      startedAt
    )
    expect(next.imageSrc).toBe('tabledm://planet.png')
    expect(next.crawl).toBeNull()
  })

  it('clears the leftover overlay even when the TV already shows that still', () => {
    const startedAt = 8
    const next = applyPrologueEndStill(
      {
        ...emptyPlayerState(),
        imageSrc: 'tabledm://end.png',
        legend: {
          title: 'The Pale Well',
          body: 'Go.',
          endSrc: 'tabledm://end.png',
          startedAt
        }
      },
      startedAt
    )
    expect(next.imageSrc).toBe('tabledm://end.png')
    expect(next.legend).toBeNull()
  })

  it('leaves a different or already-stopping overlay alone', () => {
    const state = {
      ...emptyPlayerState(),
      legend: {
        title: 'The Pale Well',
        body: 'Go.',
        endSrc: 'tabledm://end.png',
        startedAt: 1,
        stoppingAt: 2
      }
    }
    expect(applyPrologueEndStill(state, 1)).toBe(state)
    expect(applyPrologueEndStill(state, 99)).toBe(state)
  })
})
