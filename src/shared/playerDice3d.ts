import { DICE_SHOW_MAX_FACES, SKIP_PLAYER_DICE_SOURCES, type PlayerDiceShow } from './playerDiceShow'

/** Tray button rolls still use this source label on the result card. */
export const PLAYER_DICE_3D_SOURCE = 'Dice Tray'

/** How long the meshes tumble before they sit and the result card fills in. */
export const DICE_3D_THROW_MS = 1400

/** Leave the existing right-hand result card clear of landing dice. */
export const DICE_3D_RESERVED_RIGHT = 0.26

export const DICE_3D_MAX_MESHES = DICE_SHOW_MAX_FACES

export type PlayerDice3dFaceSet = 'standard' | 'd10-ones' | 'd10-tens'

export type PlayerDice3dDie = {
  sides: number
  value: number
  label: string
  dropped?: boolean
  faceSet?: PlayerDice3dFaceSet
}

export function faceLabelsForDie(die: Pick<PlayerDice3dDie, 'sides' | 'faceSet'>): string[] {
  if (die.faceSet === 'd10-tens') {
    return ['00', '10', '20', '30', '40', '50', '60', '70', '80', '90']
  }
  if (die.faceSet === 'd10-ones') {
    return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  }
  const sides = Math.max(2, Math.round(die.sides) || 2)
  return Array.from({ length: sides }, (_, index) => String(index + 1))
}

export function isPlayerDice3dSource(source: string | undefined): boolean {
  return (source?.trim() || '') === PLAYER_DICE_3D_SOURCE
}

/** Tray, sheet, Lookup, and other announced rolls throw; the compact DM preview does not. */
export function playerDice3dShouldThrow(
  show: PlayerDiceShow | null | undefined,
  opts?: { compact?: boolean }
): boolean {
  if (!show || opts?.compact) return false
  if (SKIP_PLAYER_DICE_SOURCES.has(show.source ?? '')) return false
  return planPlayerDice3dThrow(show).length > 0
}

/** Split a 1–100 percentile result into tens (00–90) and ones (0–9). */
export function percentilePair(value: number): { tens: number; ones: number } {
  const n = Number.isFinite(value) ? Math.round(Math.abs(value)) : 0
  if (n <= 0 || n >= 100) return { tens: 0, ones: 0 }
  return { tens: Math.floor(n / 10) * 10, ones: n % 10 }
}

function percentileDice(value: number): PlayerDice3dDie[] {
  const { tens, ones } = percentilePair(value)
  return [
    { sides: 10, value: tens, label: tens.toString().padStart(2, '0'), faceSet: 'd10-tens' },
    { sides: 10, value: ones, label: String(ones), faceSet: 'd10-ones' }
  ]
}

export function planPlayerDice3dThrow(show: Pick<PlayerDiceShow, 'groups' | 'mode' | 'kept'>): PlayerDice3dDie[] {
  const pair = show.mode === 'advantage' || show.mode === 'disadvantage'
  const dice: PlayerDice3dDie[] = []
  for (const group of show.groups ?? []) {
    const sides = group.sides
    for (const raw of group.rolls ?? []) {
      const value = Math.abs(raw)
      if (sides >= 100) {
        dice.push(...percentileDice(value))
        continue
      }
      const dropped = Boolean(pair && sides === 20 && show.kept != null && value !== show.kept)
      dice.push({ sides, value, label: String(value), dropped })
    }
  }
  return dice.slice(0, DICE_3D_MAX_MESHES)
}

export function dieShapeClass(sides: number): string {
  if (sides <= 4) return 'is-d4'
  if (sides <= 6) return 'is-d6'
  if (sides <= 8) return 'is-d8'
  if (sides <= 10) return 'is-d10'
  if (sides <= 12) return 'is-d12'
  if (sides >= 100) return 'is-d100'
  return 'is-d20'
}
