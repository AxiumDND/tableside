export type DiceMode = 'normal' | 'advantage' | 'disadvantage' | 'crit'

/** Uniform random unit in [0, 1). Production uses `Math.random`. */
export type DiceRng = () => number

export interface DiceGroup {
  sides: number
  rolls: number[]
}

export interface DiceResult {
  expr: string
  total: number
  detail: string
  rolls: number[]
  sides: number
  bonus: number
  groups: DiceGroup[]
  mode?: DiceMode
  kept?: number
  /** Statblock chip label, e.g. Damage or To hit. */
  rollLabel?: string
  /** 5e damage type parsed from the action line, e.g. Piercing. */
  damageType?: string
  /** Natural 20 on a d20 check (attack, save, tray d20, etc.). */
  nat20?: boolean
  /** Natural 1 on a d20 check. */
  nat1?: boolean
}

const DIE_TOKEN = /([+-]?)(\d*)d(\d+)/gi
const MAX_DICE = 40

const DAMAGE_TYPE_RE =
  /^(Bludgeoning|Piercing|Slashing|Fire|Cold|Lightning|Acid|Poison|Psychic|Necrotic|Radiant|Force|Thunder)\b/i

export function emptyDiceResult(expr = ''): DiceResult {
  return { expr, total: 0, detail: expr, rolls: [], sides: 0, bonus: 0, groups: [] }
}

/**
 * Roll one die with faces 1..sides (inclusive).
 * Uses uniform `rng` on [0, 1): each face has equal probability 1/sides.
 * Tableside uses the browser/Electron `Math.random` (not player-seeded or predictable).
 */
export function rollDie(sides: number, rng: DiceRng = Math.random): number {
  const safe = Number.isFinite(sides) && sides > 0 ? Math.round(sides) : 1
  let u = rng()
  if (u >= 1) u = 1 - Number.EPSILON
  if (u < 0) u = 0
  return 1 + Math.floor(u * safe)
}

export function expandCritExpr(expr: string): string {
  return expr.replace(/(\d*)d(\d+)/gi, (_all, count: string, sides: string) => {
    const n = count ? Number(count) : 1
    return `${Math.min(MAX_DICE, Math.max(1, n) * 2)}d${sides}`
  })
}

export function isD20Check(groups: DiceGroup[]): boolean {
  return groups.length === 1 && groups[0]?.sides === 20 && (groups[0]?.rolls.length ?? 0) <= 2
}

function parseBonusOutsideDice(cleaned: string): number {
  const stripped = cleaned.replace(/[+-]?\d*d\d+/gi, '')
  let bonus = 0
  const re = /[+-]\d+/g
  let match: RegExpExecArray | null
  while ((match = re.exec(stripped))) {
    bonus += Number(match[0])
  }
  if (bonus === 0 && /^-?\d+$/.test(stripped)) bonus = Number(stripped)
  return bonus
}

function naturalD20Face(groups: DiceGroup[], kept?: number, mode?: DiceMode): number | undefined {
  if (mode === 'crit') return undefined
  if (groups.length !== 1 || groups[0]?.sides !== 20) return undefined
  if (kept != null) return kept
  const rolls = groups[0].rolls
  if (rolls.length === 1) return Math.abs(rolls[0] ?? 0)
  return undefined
}

function finishResult(
  expr: string,
  groups: DiceGroup[],
  bonus: number,
  mode?: DiceMode,
  kept?: number
): DiceResult {
  const allRolls = groups.flatMap((group) => group.rolls)
  const diceSum =
    kept != null && groups[0]?.sides === 20
      ? kept + groups.slice(1).reduce((sum, group) => sum + group.rolls.reduce((a, b) => a + b, 0), 0)
      : allRolls.reduce((sum, n) => sum + n, 0)
  const total = diceSum + bonus
  const bonusText = bonus ? (bonus > 0 ? `+${bonus}` : String(bonus)) : ''
  const faces = groups.map((group) => `[${group.rolls.join(', ')}]`).join(' + ')
  const keptNote = kept != null && (mode === 'advantage' || mode === 'disadvantage') ? ` keep ${kept}` : ''
  const d20Face = naturalD20Face(groups, kept, mode)
  return {
    expr,
    total,
    detail: `${faces || '[]'}${keptNote}${bonusText}`,
    rolls: allRolls,
    sides: groups[0]?.sides ?? 0,
    bonus,
    groups,
    mode: mode && mode !== 'normal' ? mode : undefined,
    kept,
    nat20: d20Face === 20,
    nat1: d20Face === 1
  }
}

export function rollExpr(expr: string, mode: DiceMode = 'normal', rng: DiceRng = Math.random): DiceResult {
  const working = mode === 'crit' ? expandCritExpr(expr) : expr
  const cleaned = working.replace(/\s/g, '')
  const groups: DiceGroup[] = []
  DIE_TOKEN.lastIndex = 0
  let match: RegExpExecArray | null
  let diceCount = 0
  while ((match = DIE_TOKEN.exec(cleaned))) {
    const sign = match[1] === '-' ? -1 : 1
    const count = match[2] ? Number(match[2]) : 1
    const sides = Number(match[3])
    const rolls: number[] = []
    const n = Math.min(MAX_DICE - diceCount, Math.max(1, count))
    for (let i = 0; i < n; i += 1) {
      rolls.push(rollDie(sides, rng) * sign)
    }
    diceCount += n
    groups.push({ sides, rolls })
    if (diceCount >= MAX_DICE) break
  }
  if (groups.length === 0) {
    const n = Number(cleaned)
    return {
      ...emptyDiceResult(expr),
      total: Number.isFinite(n) ? n : 0,
      detail: String(cleaned || expr),
      mode: mode !== 'normal' ? mode : undefined
    }
  }
  const bonus = parseBonusOutsideDice(cleaned)
  const d20 = groups[0]
  if (
    (mode === 'advantage' || mode === 'disadvantage') &&
    d20 &&
    d20.sides === 20 &&
    d20.rolls.length === 1 &&
    (d20.rolls[0] ?? 0) > 0
  ) {
    const first = Math.abs(d20.rolls[0] ?? 1)
    const second = rollDie(20, rng)
    const kept = mode === 'advantage' ? Math.max(first, second) : Math.min(first, second)
    const next = [{ sides: 20, rolls: [first, second] }, ...groups.slice(1)]
    return finishResult(expr, next, bonus, mode, kept)
  }
  return finishResult(mode === 'crit' ? working : expr, groups, bonus, mode)
}

export function rollD20(
  mod: number,
  label = 'Check',
  mode: DiceMode = 'normal',
  rng: DiceRng = Math.random
): DiceResult {
  const signed = mod >= 0 ? `+${mod}` : String(mod)
  const result = rollExpr(`1d20${mod === 0 ? '' : signed}`, mode === 'crit' ? 'normal' : mode, rng)
  return { ...result, expr: `${label} ${signed}` }
}

/** Box of Doom (Tools): fair d20(s) for normal / advantage / disadvantage. */
export function rollBoxOfDoomD20s(
  mode: 'normal' | 'advantage' | 'disadvantage',
  rng: DiceRng = Math.random
): { first: number; second?: number } {
  const first = rollDie(20, rng)
  if (mode === 'normal') return { first }
  return { first, second: rollDie(20, rng) }
}

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : String(mod)
}

export function extractRolls(text: string): { label: string; expr: string; damageType?: string }[] {
  const found: { label: string; expr: string; damageType?: string }[] = []
  const seen = new Set<string>()
  const add = (label: string, expr: string, damageType?: string): void => {
    const key = `${label}:${expr}:${damageType ?? ''}`
    if (seen.has(key)) return
    seen.add(key)
    found.push({ label, expr, damageType })
  }

  const attack =
    /([+-]\d+)\s*to hit/i.exec(text) ??
    /Attack Roll:\s*([+-]\d+)/i.exec(text) ??
    /(?:Melee|Ranged)\s+(?:Weapon\s+)?Attack:\s*([+-]\d+)/i.exec(text)
  if (attack) add('To hit', `1d20${attack[1]}`)

  const dice: { expr: string; damageType?: string }[] = []
  const damage = /(\d+d\d+(?:[+-]\d+)?)/gi
  let match: RegExpExecArray | null
  while ((match = damage.exec(text))) {
    if (/^1?d20(?:[+-]\d+)?$/i.test(match[1])) continue
    dice.push({
      expr: match[1],
      damageType: damageTypeAfter(text, match.index + match[0].length)
    })
  }
  dice.forEach((entry, index) => {
    add(dice.length === 1 ? 'Damage' : `Damage ${index + 1}`, entry.expr, entry.damageType)
  })

  const dc = /DC\s+(\d+)/i.exec(text)
  if (dc) add(`Save DC ${dc[1]}`, '1d20')
  return found
}

export function isDamageLabel(label: string): boolean {
  return /^damage(?:\s+\d+)?$/i.test(label)
}

function formatDamageType(raw: string): string {
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

function damageTypeAfter(text: string, exprEnd: number): string | undefined {
  const tail = text.slice(exprEnd).replace(/^\s*\)/, '').trimStart()
  const match = DAMAGE_TYPE_RE.exec(tail)
  return match ? formatDamageType(match[1]) : undefined
}

/** Tray / player-TV line for a roll (includes source prefix when given). */
export function formatDiceRollSummary(result: DiceResult, source?: string): string {
  const prefix = source && source !== 'Dice Tray' ? `${source} · ` : ''
  return `${prefix}${formatDicePlayerExpr(result)}`
}

/** Main expression line on the player dice strip. */
export function formatDicePlayerExpr(
  result: Pick<DiceResult, 'expr' | 'rollLabel' | 'damageType' | 'nat20' | 'nat1'>
): string {
  let line: string
  if (result.rollLabel && result.damageType && isDamageLabel(result.rollLabel)) {
    line = `${result.rollLabel} (${result.damageType}) ${result.expr}`
  } else if (result.damageType) {
    line = `${result.expr} · ${result.damageType}`
  } else {
    line = result.expr
  }
  if (result.nat20) return `${line} · Crit success`
  if (result.nat1) return `${line} · Crit fail`
  return line
}

export function d20NaturalLabel(result: Pick<DiceResult, 'nat20' | 'nat1'>): string | null {
  if (result.nat20) return 'Crit success'
  if (result.nat1) return 'Crit fail'
  return null
}

export function dicePhysicalCount(groups: DiceGroup[]): number {
  return groups.reduce((sum, group) => sum + group.rolls.length, 0)
}
