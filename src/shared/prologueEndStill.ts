import type { PlayerState } from './types'

/**
 * When a chronicle / crawl reaches its closing still, copy that still onto the
 * image layer and drop the overlay so initiative and other TV chrome can return.
 */
export function applyPrologueEndStill(state: PlayerState, startedAt: number): PlayerState {
  const overlay = state.legend ?? state.crawl
  if (!overlay || overlay.stoppingAt != null || overlay.startedAt !== startedAt) return state
  const src = overlay.endSrc?.trim() || null
  const clearLegend = state.legend?.startedAt === startedAt
  const clearCrawl = state.crawl?.startedAt === startedAt
  return {
    ...state,
    ...(src ? { imageSrc: src, mapView: null } : {}),
    legend: clearLegend ? null : state.legend,
    crawl: clearCrawl ? null : state.crawl
  }
}
