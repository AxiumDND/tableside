export const DICE_SHOW_FADE_IN_MS = 800
export const DICE_SHOW_FADE_LEAD_MS = 60
export const DICE_SHOW_HOLD_MS = 15_000
export const DICE_SHOW_FADE_OUT_MS = 1200
export const DICE_SHOW_MAX_FACES = 12

export type PlayerDiceMode = 'normal' | 'advantage' | 'disadvantage' | 'crit'

export interface PlayerDiceGroup {
  sides: number
  rolls: number[]
}

export interface PlayerDiceShow {
  source?: string
  expr: string
  total: number
  groups: PlayerDiceGroup[]
  bonus: number
  mode?: PlayerDiceMode
  kept?: number
  rollLabel?: string
  damageType?: string
  nat20?: boolean
  nat1?: boolean
  startedAt: number
  stoppingAt?: number
}

export const SKIP_PLAYER_DICE_SOURCES = new Set(['Dice check'])
