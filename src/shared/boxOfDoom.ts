export const BOX_OF_DOOM_FADE_IN_MS = 1600
export const BOX_OF_DOOM_FADE_LEAD_MS = 80
export const BOX_OF_DOOM_FADE_OUT_MS = 1400
export const DEFAULT_BOX_OF_DOOM_HOLD_MS = 15_000
export const MIN_BOX_OF_DOOM_HOLD_MS = 3_000
export const MAX_BOX_OF_DOOM_HOLD_MS = 120_000
export const BOX_OF_DOOM_TUMBLE_MS = 1800
export const BOX_OF_DOOM_REVEAL_MS = 650
export const BOX_OF_DOOM_VERDICT_AT = BOX_OF_DOOM_TUMBLE_MS + BOX_OF_DOOM_REVEAL_MS

export type BoxOfDoomPhase = 'wait' | 'tumble' | 'reveal' | 'verdict'
export type BoxOfDoomMode = 'normal' | 'advantage' | 'disadvantage'

export function clampBoxOfDoomDc(value: number): number {
  if (!Number.isFinite(value)) return 15
  return Math.min(40, Math.max(1, Math.round(value)))
}

export function clampBoxOfDoomMod(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(20, Math.max(-20, Math.round(value)))
}

export function clampD20(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(20, Math.max(1, Math.round(value)))
}

export function normalizeBoxOfDoomMode(value: unknown): BoxOfDoomMode {
  if (value === 'advantage' || value === 'disadvantage') return value
  return 'normal'
}

export function resolveBoxOfDoom(
  dc: number,
  d20: number,
  modifier: number,
  extra?: { mode?: BoxOfDoomMode; d20b?: number }
) {
  const safeDc = clampBoxOfDoomDc(dc)
  const mode = normalizeBoxOfDoomMode(extra?.mode)
  const first = clampD20(d20)
  const pair = mode !== 'normal'
  const second = pair ? clampD20(Number(extra?.d20b)) : first
  const kept = pair ? (mode === 'advantage' ? Math.max(first, second) : Math.min(first, second)) : first
  const safeMod = clampBoxOfDoomMod(modifier)
  const total = kept + safeMod
  const nat20 = kept === 20
  const nat1 = kept === 1
  const success = nat20 || (!nat1 && total >= safeDc)
  return {
    dc: safeDc,
    mode,
    d20: kept,
    rolls: pair ? ([first, second] as [number, number]) : ([first] as [number]),
    modifier: safeMod,
    total,
    success,
    nat20,
    nat1
  }
}

export function boxOfDoomPhase(
  roll: { rolledAt?: number | null },
  now = Date.now()
): BoxOfDoomPhase {
  if (roll.rolledAt == null) return 'wait'
  const elapsed = Math.max(0, now - roll.rolledAt)
  if (elapsed < BOX_OF_DOOM_TUMBLE_MS) return 'tumble'
  if (elapsed < BOX_OF_DOOM_VERDICT_AT) return 'reveal'
  return 'verdict'
}

export function tumbleFace(startedAt: number, now = Date.now(), salt = 0): number {
  // Cosmetic animation only — cycles faces deterministically, not a random roll.
  const tick = Math.floor(Math.max(0, now - startedAt) / 70)
  return 1 + ((tick * 7 + 3 + salt * 11) % 20)
}

export function boxOfDoomIsPair(mode: BoxOfDoomMode | undefined): boolean {
  return mode === 'advantage' || mode === 'disadvantage'
}

/** Hold time after a Box of Doom roll before auto fade-out (from app settings seconds). */
export function boxOfDoomHoldMs(seconds: unknown): number {
  const n = Number(seconds)
  if (!Number.isFinite(n)) return DEFAULT_BOX_OF_DOOM_HOLD_MS
  return Math.min(MAX_BOX_OF_DOOM_HOLD_MS, Math.max(MIN_BOX_OF_DOOM_HOLD_MS, Math.round(n * 1000)))
}
