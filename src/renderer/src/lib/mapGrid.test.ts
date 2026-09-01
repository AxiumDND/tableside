import { describe, expect, it } from 'vitest'
import { TOKEN_SCALE_DEFAULT, TOKEN_SCALE_MAX, TOKEN_SCALE_MIN } from './mapNote'
import {
  cellFromSpan,
  clampScaleFeet,
  gridLinePositions,
  gridStepY,
  imageAspect,
  snapTokenPoint
} from './mapGrid'

describe('map grid', () => {
  it('treats a 5 ft span as one square', () => {
    // Square image: 0.1 of width is one cell when the span is 5 ft.
    expect(cellFromSpan({ x: 0.2, y: 0.5 }, { x: 0.3, y: 0.5 }, 5, 1)).toBeCloseTo(0.1)
  })

  it('treats a 10 ft span as two squares', () => {
    expect(cellFromSpan({ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.2 }, 10, 1)).toBeCloseTo(0.1)
  })

  it('accounts for non-square images so cells stay square in pixels', () => {
    // Image twice as tall as wide: the same pixel distance is half as much y-fraction.
    const cell = cellFromSpan({ x: 0, y: 0 }, { x: 0, y: 0.1 }, 5, 2)
    expect(cell).toBeCloseTo(0.2)
    expect(gridStepY(cell, 2)).toBeCloseTo(0.1)
  })

  it('falls back when the two points are the same', () => {
    expect(cellFromSpan({ x: 0.4, y: 0.4 }, { x: 0.4, y: 0.4 }, 5, 1)).toBe(TOKEN_SCALE_DEFAULT)
  })

  it('clamps a huge span to the max cell size', () => {
    expect(cellFromSpan({ x: 0, y: 0 }, { x: 1, y: 0 }, 5, 1)).toBe(TOKEN_SCALE_MAX)
  })

  it('ignores a slight off-axis wobble so a grid edge stays one square', () => {
    expect(cellFromSpan({ x: 0.2, y: 0.5 }, { x: 0.3, y: 0.508 }, 5, 1)).toBeCloseTo(0.1)
  })

  it('aligns overlay lines to a measured grid origin', () => {
    const { vertical } = gridLinePositions(0.1, 1, 0.03, 0)
    expect(vertical[0]).toBeCloseTo(0.03)
    expect(vertical[1]).toBeCloseTo(0.13)
  })

  it('snaps Medium tokens to centers of the origin-shifted grid', () => {
    const snapped = snapTokenPoint(0.12, 0.11, 0.1, 'medium', 1, 0.03, 0.03)
    expect(snapped.x).toBeCloseTo(0.08)
    expect(snapped.y).toBeCloseTo(0.08)
  })

  it('snaps Medium tokens to cell centers', () => {
    const snapped = snapTokenPoint(0.12, 0.11, 0.1, 'medium', 1)
    expect(snapped.x).toBeCloseTo(0.15)
    expect(snapped.y).toBeCloseTo(0.15)
  })

  it('snaps Large tokens to vertices so they cover two squares', () => {
    const snapped = snapTokenPoint(0.12, 0.11, 0.1, 'large', 1)
    expect(snapped.x).toBeCloseTo(0.1)
    expect(snapped.y).toBeCloseTo(0.1)
  })

  it('treats Tiny like Medium for snap (sit in one square)', () => {
    const tiny = snapTokenPoint(0.12, 0.11, 0.1, 'tiny', 1)
    const medium = snapTokenPoint(0.12, 0.11, 0.1, 'medium', 1)
    expect(tiny).toEqual(medium)
  })

  it('clamps scale feet to a table-usable range', () => {
    expect(clampScaleFeet(5)).toBe(5)
    expect(clampScaleFeet(12.4)).toBe(12)
    expect(clampScaleFeet(0)).toBe(5)
    expect(clampScaleFeet(999)).toBe(200)
  })

  it('builds grid lines from the cell size', () => {
    const { vertical, horizontal } = gridLinePositions(0.25, 1)
    expect(vertical).toEqual([0.25, 0.5, 0.75])
    expect(horizontal).toEqual([0.25, 0.5, 0.75])
  })

  it('uses image aspect for height/width', () => {
    expect(imageAspect({ w: 200, h: 100 })).toBeCloseTo(0.5)
    expect(imageAspect(null)).toBe(1)
  })

  it('keeps default scale inside the clamp', () => {
    expect(TOKEN_SCALE_DEFAULT).toBeGreaterThan(TOKEN_SCALE_MIN)
    expect(TOKEN_SCALE_DEFAULT).toBeLessThan(TOKEN_SCALE_MAX)
  })
})
