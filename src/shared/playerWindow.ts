/** Player view only uses a second monitor, and only while the DM wants that window open. */
export function shouldShowPlayerWindow(hasSecondDisplay: boolean, wanted: boolean): boolean {
  return hasSecondDisplay && wanted
}

export type PlayerDisplayScale = { id: number; scaleFactor: number }

/**
 * Chromium keeps the scale of the display where a BrowserWindow was first shown.
 * Moving a 4K-scaled window onto a 1080p TV makes the image look soft — rebuild instead.
 */
export function playerWindowNeedsRebuild(
  current: PlayerDisplayScale | null,
  target: PlayerDisplayScale
): boolean {
  if (!current) return true
  return current.id !== target.id || current.scaleFactor !== target.scaleFactor
}
