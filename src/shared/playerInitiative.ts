import type { PlayerState } from './types'

/** Initiative strip on the player TV — hidden under full-screen overlays until they fade out. */
export function playerInitiativeVisible(state: PlayerState): boolean {
  if (state.crawl || state.legend || state.gallery || state.video || state.phone || state.hyperspace) {
    return false
  }
  if (state.boxOfDoom && state.boxOfDoom.stoppingAt == null) return false
  return state.showInitiative && state.initiative.length > 0
}
