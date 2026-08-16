import { describe, expect, it } from 'vitest'
import { clampCamera, FIT_CAMERA, mapLayout, panCamera, zoomCameraAt } from './mapCamera'
import {
  createFog,
  decodeFog,
  encodeFog,
  fogAllClear,
  fogAllCovered,
  paintFogDisk
} from './mapFog'

describe('map camera', () => {
  it('locks to the image center when the whole map still fits', () => {
    expect(clampCamera({ zoom: 0.2, centerX: -1, centerY: 3 })).toEqual(FIT_CAMERA)
    expect(clampCamera({ zoom: 1, centerX: 0.2, centerY: 0.8 }, 1.2, 1)).toEqual(FIT_CAMERA)
  })

  it('clamps the center so a zoomed crop stays on the image', () => {
    const tight = clampCamera({ zoom: 4, centerX: 0.95, centerY: 0.95 }, 0.25, 0.25)
    expect(tight.zoom).toBe(4)
    expect(tight.centerX).toBeCloseTo(0.875)
    expect(tight.centerY).toBeCloseTo(0.875)
  })

  it('fits the full image, then fills the window as you zoom', () => {
    const fit = mapLayout(FIT_CAMERA, 400, 300, 800, 400)
    expect(fit.scale).toBeCloseTo(0.5)
    expect(fit.tx).toBeCloseTo(0)
    expect(fit.ty).toBeCloseTo(50)

    const zoomed = mapLayout({ zoom: 2, centerX: 0.5, centerY: 0.5 }, 400, 300, 800, 400)
    expect(zoomed.scale).toBeCloseTo(1)
    expect(zoomed.tx).toBeCloseTo(-200)
    expect(zoomed.ty).toBeCloseTo(-50)
  })

  it('zooms toward an image point under the cursor', () => {
    const pane = { left: 0, top: 0, width: 400, height: 300 }
    const content = { width: 400, height: 200 }
    const next = zoomCameraAt(FIT_CAMERA, 0.5, 0.5, 200, 150, pane, content, 2)
    expect(next.zoom).toBe(2)
    expect(next.centerX).toBeCloseTo(0.5)
    expect(next.centerY).toBeCloseTo(0.5)
  })

  it('pans in image space from a pixel drag', () => {
    const zoomed = { zoom: 2, centerX: 0.5, centerY: 0.5 }
    const next = panCamera(zoomed, 80, 0, 800, 400, 400, 300)
    expect(next.centerX).toBeCloseTo(0.4)
  })
})

describe('map fog', () => {
  it('round-trips packed bits', () => {
    const cells = createFog(16, 0)
    cells[0] = 1
    cells[15] = 1
    cells[255] = 1
    const again = decodeFog(encodeFog(cells), 16)
    expect(Array.from(again)).toEqual(Array.from(cells))
  })

  it('paints a disk and reports all-clear / covered', () => {
    const cells = createFog(32, 0)
    expect(fogAllClear(cells)).toBe(true)
    expect(paintFogDisk(cells, 0.5, 0.5, 0.2, 1)).toBe(true)
    expect(fogAllClear(cells)).toBe(false)
    expect(fogAllCovered(cells)).toBe(false)
    cells.fill(1)
    expect(fogAllCovered(cells)).toBe(true)
  })
})
