import { describe, expect, it } from 'vitest'
import { TOKEN_SCALE_DEFAULT } from './mapNote'
import {
  clampMeasureFeet,
  measureBearing,
  measureLabel,
  measureShape
} from './mapMeasure'

describe('map measure templates', () => {
  it('snaps template length to 5 ft steps', () => {
    expect(clampMeasureFeet(30)).toBe(30)
    expect(clampMeasureFeet(32)).toBe(30)
    expect(clampMeasureFeet(3)).toBe(5)
    expect(clampMeasureFeet(400)).toBe(120)
  })

  it('builds a round template whose radius is length in 5 ft squares', () => {
    const shape = measureShape('round', { x: 0.5, y: 0.5 }, null, 30, 0.1, 1)
    expect(shape.kind).toBe('round')
    if (shape.kind !== 'round') return
    expect(shape.cx).toBeCloseTo(0.5)
    expect(shape.rx).toBeCloseTo(0.6)
    expect(shape.ry).toBeCloseTo(0.6)
  })

  it('keeps a round template circular on a tall image', () => {
    const shape = measureShape('round', { x: 0.4, y: 0.4 }, null, 10, 0.1, 2)
    if (shape.kind !== 'round') throw new Error('expected ellipse')
    expect(shape.rx).toBeCloseTo(0.2)
    expect(shape.ry).toBeCloseTo(0.1)
  })

  it('aims a line east along the grid', () => {
    const origin = { x: 0.2, y: 0.5 }
    const aim = { x: 0.9, y: 0.5 }
    expect(measureBearing(origin, aim, 0.1, 1)).toBeCloseTo(0)
    const shape = measureShape('line', origin, aim, 20, 0.1, 1)
    expect(shape.kind).toBe('polygon')
    if (shape.kind !== 'polygon') return
    const xs = shape.points.map((p) => p.x)
    const ys = shape.points.map((p) => p.y)
    expect(Math.max(...xs)).toBeCloseTo(0.6)
    expect(Math.min(...xs)).toBeCloseTo(0.2)
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(0.1)
  })

  it('builds a 90 degree cone that opens toward the aim point', () => {
    const origin = { x: 0.5, y: 0.5 }
    const aim = { x: 0.9, y: 0.5 }
    const shape = measureShape('cone', origin, aim, 15, 0.1, 1)
    if (shape.kind !== 'polygon') throw new Error('expected polygon')
    expect(shape.points[0]).toMatchObject({ x: 0.5, y: 0.5 })
    const far = shape.points.slice(1)
    const ys = far.map((p) => p.y)
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(Math.SQRT2 * 0.3, 2)
  })

  it('labels templates in feet', () => {
    expect(measureLabel('round', 20)).toBe('20 ft radius')
    expect(measureLabel('cone', 30)).toBe('30 ft cone')
    expect(measureLabel('line', 60)).toBe('60 ft line')
  })

  it('uses a default cell size that is a 5 ft square', () => {
    const shape = measureShape('round', { x: 0, y: 0 }, null, 5, TOKEN_SCALE_DEFAULT, 1)
    if (shape.kind !== 'round') throw new Error('expected round')
    expect(shape.rx).toBeCloseTo(TOKEN_SCALE_DEFAULT)
  })
})
