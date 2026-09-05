/** Inset for Show to players stills. Art scales up or down to fit width or height. */

export const DEFAULT_PLAYER_IMAGE_PAD_PCT = 4
export const MIN_PLAYER_IMAGE_PAD_PCT = 0
export const MAX_PLAYER_IMAGE_PAD_PCT = 20

export function clampPlayerImagePadPct(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return DEFAULT_PLAYER_IMAGE_PAD_PCT
  return Math.min(MAX_PLAYER_IMAGE_PAD_PCT, Math.max(MIN_PLAYER_IMAGE_PAD_PCT, Math.round(n)))
}

export function playerImagePadFromSettings(settings: { playerImagePadPct?: number } | null | undefined): number {
  if (settings?.playerImagePadPct == null) return DEFAULT_PLAYER_IMAGE_PAD_PCT
  return clampPlayerImagePadPct(settings.playerImagePadPct)
}
