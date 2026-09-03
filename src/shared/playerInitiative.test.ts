import { describe, expect, it } from 'vitest'
import { emptyPlayerState } from './types'
import { playerInitiativeVisible } from './playerInitiative'

describe('playerInitiativeVisible', () => {
  const base = {
    ...emptyPlayerState(),
    showInitiative: true,
    initiative: [{ id: 'a', name: 'Goblin', initiative: 12, active: false }]
  }

  it('shows initiative when enabled and nothing blocks it', () => {
    expect(playerInitiativeVisible(base)).toBe(true)
  })

  it('hides initiative under an active Box of Doom overlay', () => {
    expect(
      playerInitiativeVisible({
        ...base,
        boxOfDoom: { dc: 15, modifier: 0, startedAt: 1 }
      })
    ).toBe(false)
  })

  it('returns initiative while Box of Doom is fading out', () => {
    expect(
      playerInitiativeVisible({
        ...base,
        boxOfDoom: { dc: 15, modifier: 0, startedAt: 1, stoppingAt: 2 }
      })
    ).toBe(true)
  })
})
