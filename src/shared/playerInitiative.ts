import type { PlayerState } from './types'

function overlayBlocks(overlay?: { stoppingAt?: number } | null): boolean {
  return overlay != null && overlay.stoppingAt == null
}

/** Initiative strip on the player TV — hidden under full-screen overlays until they fade out. */
export function playerInitiativeVisible(state: PlayerState): boolean {
  if (
    overlayBlocks(state.crawl) ||
    overlayBlocks(state.legend) ||
    overlayBlocks(state.gallery) ||
    overlayBlocks(state.phone) ||
    overlayBlocks(state.hyperspace) ||
    state.video
  ) {
    return false
  }
  if (state.boxOfDoom && state.boxOfDoom.stoppingAt == null) return false
  if (state.hourglass && state.hourglass.stoppingAt == null) return false
  return state.showInitiative && state.initiative.length > 0
}
