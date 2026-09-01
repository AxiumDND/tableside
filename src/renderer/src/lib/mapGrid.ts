import {
  SPACE_SQUARES,
  TOKEN_SCALE_DEFAULT,
  clamp01,
  clampTokenScale,
  type CreatureSpace
} from './mapNote'

/** One combat square on the table. Token snap and Medium diameter use this. */
export const FEET_PER_SQUARE = 5

const GRID_LINE_CAP = 200
const GRID_STEP_MIN = 0.004

/**
 * Height / width of the map image. Needed because `x` and `y` are independent
 * 0–1 fractions — a square cell is `cell` of width and `cell / aspect` of height.
 */
export function imageAspect(size: { w: number; h: number } | null | undefined): number {
  if (!size || size.w <= 0 || size.h <= 0) return 1
  return size.h / size.w
}

/** Y-fraction of one 5 ft square, given a width-fraction cell size. */
export function gridStepY(cell: number, aspect: number): number {
  const safe = clampTokenScale(cell)
  if (aspect <= 0) return safe
  return safe / aspect
}

/**
 * Convert a two-point span into a 5 ft cell size (width fraction).
 * `feet` is how long that span is on the table (default 5 = one square).
 */
export function cellFromSpan(
  a: { x: number; y: number },
  b: { x: number; y: number },
  feet: number,
  aspect: number
): number {
  const dx = b.x - a.x
  const dy = (b.y - a.y) * (aspect > 0 ? aspect : 1)
  const dist = Math.hypot(dx, dy)
  const squares = Math.max(0.2, clampScaleFeet(feet) / FEET_PER_SQUARE)
  if (dist < 1e-6) return TOKEN_SCALE_DEFAULT
  return clampTokenScale(dist / squares)
}

export function clampScaleFeet(value: number): number {
  if (!Number.isFinite(value)) return FEET_PER_SQUARE
  return Math.min(200, Math.max(5, Math.round(value)))
}

/**
 * Snap a token center onto the 5 ft grid.
 * Odd spaces (Tiny/Small/Medium/Huge) land on cell centers; even (Large/Gargantuan)
 * land on vertices so they cover whole squares.
 */
export function snapTokenPoint(
  x: number,
  y: number,
  cell: number,
  space: CreatureSpace,
  aspect: number
): { x: number; y: number } {
  const stepX = clampTokenScale(cell)
  const stepY = gridStepY(cell, aspect)
  if (stepX <= 0 || stepY <= 0) return { x: clamp01(x), y: clamp01(y) }
  const squares = SPACE_SQUARES[space] >= 1 ? SPACE_SQUARES[space] : 1
  const even = squares % 2 === 0
  const offsetX = even ? 0 : stepX / 2
  const offsetY = even ? 0 : stepY / 2
  return {
    x: clamp01(snapTo(x, stepX, offsetX)),
    y: clamp01(snapTo(y, stepY, offsetY))
  }
}

function snapTo(value: number, step: number, offset: number): number {
  return Math.round((value - offset) / step) * step + offset
}

export function gridLinePositions(cell: number, aspect: number): { vertical: number[]; horizontal: number[] } {
  const stepX = clampTokenScale(cell)
  const stepY = gridStepY(cell, aspect)
  if (stepX < GRID_STEP_MIN || stepY < GRID_STEP_MIN) return { vertical: [], horizontal: [] }
  const vertical = stepsUntil(stepX)
  const horizontal = stepsUntil(stepY)
  if (vertical.length > GRID_LINE_CAP || horizontal.length > GRID_LINE_CAP) {
    return { vertical: [], horizontal: [] }
  }
  return { vertical, horizontal }
}

function stepsUntil(step: number): number[] {
  const out: number[] = []
  for (let v = step; v < 1 - 1e-9; v += step) out.push(v)
  return out
}
