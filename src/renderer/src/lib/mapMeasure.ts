import { FEET_PER_SQUARE, gridStepY } from './mapGrid'
import { clampTokenScale } from './mapNote'

export type MeasureKind = 'line' | 'cone' | 'round' | 'square'

export const MEASURE_FEET_DEFAULT = 30
export const MEASURE_FEET_MIN = 5
export const MEASURE_FEET_MAX = 120
export const LINE_WIDTH_FEET = 5
/** 5e cone: as wide as it is long at the far end ≈ 90° sector on the grid. */
export const CONE_HALF_ANGLE = Math.PI / 4

export type Point = { x: number; y: number }

export type MeasureShape =
  | { kind: 'round'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'polygon'; points: Point[] }

export function clampMeasureFeet(value: number): number {
  if (!Number.isFinite(value)) return MEASURE_FEET_DEFAULT
  const stepped = Math.round(value / FEET_PER_SQUARE) * FEET_PER_SQUARE
  return Math.min(MEASURE_FEET_MAX, Math.max(MEASURE_FEET_MIN, stepped))
}

function stepY(cell: number, aspect: number): number {
  return gridStepY(cell, aspect)
}

function toSquare(point: Point, cell: number, aspect: number): Point {
  const sy = stepY(cell, aspect)
  return { x: point.x / cell, y: sy > 0 ? point.y / sy : point.y / cell }
}

function toImage(square: Point, cell: number, aspect: number): Point {
  return { x: square.x * cell, y: square.y * stepY(cell, aspect) }
}

export function measureBearing(origin: Point, aim: Point, cell: number, aspect: number): number {
  const a = toSquare(origin, cell, aspect)
  const b = toSquare(aim, cell, aspect)
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (Math.hypot(dx, dy) < 1e-6) return 0
  return Math.atan2(dy, dx)
}

export function measureShape(
  kind: MeasureKind,
  origin: Point,
  aim: Point | null,
  feet: number,
  cell: number,
  aspect: number
): MeasureShape {
  const safeCell = clampTokenScale(cell)
  const length = clampMeasureFeet(feet) / FEET_PER_SQUARE
  if (kind === 'round') {
    return {
      kind: 'round',
      cx: origin.x,
      cy: origin.y,
      rx: length * safeCell,
      ry: length * stepY(safeCell, aspect)
    }
  }
  if (kind === 'square') {
    const o = toSquare(origin, safeCell, aspect)
    const half = length / 2
    return {
      kind: 'polygon',
      points: [
        toImage({ x: o.x - half, y: o.y - half }, safeCell, aspect),
        toImage({ x: o.x + half, y: o.y - half }, safeCell, aspect),
        toImage({ x: o.x + half, y: o.y + half }, safeCell, aspect),
        toImage({ x: o.x - half, y: o.y + half }, safeCell, aspect)
      ]
    }
  }
  const angle = measureBearing(origin, aim ?? origin, safeCell, aspect)
  const o = toSquare(origin, safeCell, aspect)
  if (kind === 'line') {
    const half = LINE_WIDTH_FEET / FEET_PER_SQUARE / 2
    const dx = Math.cos(angle)
    const dy = Math.sin(angle)
    const px = -dy * half
    const py = dx * half
    const farX = o.x + dx * length
    const farY = o.y + dy * length
    return {
      kind: 'polygon',
      points: [
        toImage({ x: o.x + px, y: o.y + py }, safeCell, aspect),
        toImage({ x: farX + px, y: farY + py }, safeCell, aspect),
        toImage({ x: farX - px, y: farY - py }, safeCell, aspect),
        toImage({ x: o.x - px, y: o.y - py }, safeCell, aspect)
      ]
    }
  }
  const start = angle - CONE_HALF_ANGLE
  const end = angle + CONE_HALF_ANGLE
  const steps = 20
  const points: Point[] = [origin]
  for (let i = 0; i <= steps; i += 1) {
    const a = start + ((end - start) * i) / steps
    points.push(
      toImage({ x: o.x + Math.cos(a) * length, y: o.y + Math.sin(a) * length }, safeCell, aspect)
    )
  }
  return { kind: 'polygon', points }
}

export function measureLabel(kind: MeasureKind, feet: number): string {
  const n = clampMeasureFeet(feet)
  if (kind === 'round') return `${n} ft radius`
  if (kind === 'square') return `${n} ft square`
  if (kind === 'cone') return `${n} ft cone`
  return `${n} ft line`
}
