// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useMapCamera } from './useMapCamera'
import { FIT_CAMERA } from '../lib/mapCamera'

function rect(width: number, height: number): DOMRect {
  return {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON: () => ({})
  } as DOMRect
}

function layoutEl(width: number, height: number): HTMLDivElement {
  const el = document.createElement('div')
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect(width, height))
  Object.defineProperty(el, 'clientWidth', { value: width })
  Object.defineProperty(el, 'clientHeight', { value: height })
  return el
}

function setup(overrides: { onShiftWheel?: (event: WheelEvent) => boolean } = {}) {
  const pane = layoutEl(400, 300)
  const content = layoutEl(800, 400)
  const viewport = layoutEl(400, 300)
  const onShiftWheel = overrides.onShiftWheel ?? vi.fn().mockReturnValue(false)
  document.body.append(pane, content, viewport)
  const view = renderHook(() =>
    useMapCamera({
      paneRef: { current: pane },
      contentRef: { current: content },
      viewportRef: { current: viewport },
      onShiftWheel
    })
  )
  return { view, onShiftWheel, pane, content, viewport }
}

describe('useMapCamera', () => {
  it('starts at the fitted camera and fit() returns there', () => {
    const { view } = setup()
    expect(view.result.current.camera).toEqual(FIT_CAMERA)
    act(() => view.result.current.setZoom(3))
    expect(view.result.current.camera.zoom).toBe(3)
    act(() => view.result.current.fit())
    expect(view.result.current.camera).toEqual(FIT_CAMERA)
  })

  it('reset is an alias for fit', () => {
    const { view } = setup()
    act(() => view.result.current.setZoom(4))
    act(() => view.result.current.reset())
    expect(view.result.current.camera).toEqual(FIT_CAMERA)
  })

  it('movePan shifts the center after beginPan', () => {
    const { view } = setup()
    act(() => view.result.current.setZoom(2))
    act(() => {
      view.result.current.beginPan(100, 100)
      view.result.current.movePan(180, 100)
    })
    expect(view.result.current.camera.centerX).toBeCloseTo(0.4)
    expect(view.result.current.panRef.current).toEqual({ x: 180, y: 100 })
    act(() => view.result.current.endPan())
    expect(view.result.current.panRef.current).toBeNull()
  })

  it('movePan is a no-op before beginPan', () => {
    const { view } = setup()
    act(() => view.result.current.movePan(180, 100))
    expect(view.result.current.camera).toEqual(FIT_CAMERA)
  })

  it('handleWheel zooms toward the cursor', () => {
    const { view } = setup()
    act(() => {
      view.result.current.handleWheel(
        new WheelEvent('wheel', { clientX: 200, clientY: 150, deltaY: -100, bubbles: true })
      )
    })
    expect(view.result.current.camera.zoom).toBeCloseTo(1.12)
  })

  it('Shift+wheel is consumed when onShiftWheel returns true', () => {
    const onShiftWheel = vi.fn().mockReturnValue(true)
    const { view } = setup({ onShiftWheel })
    act(() => {
      view.result.current.handleWheel(
        new WheelEvent('wheel', { clientX: 200, clientY: 150, deltaY: -100, shiftKey: true })
      )
    })
    expect(onShiftWheel).toHaveBeenCalledTimes(1)
    expect(view.result.current.camera).toEqual(FIT_CAMERA)
  })

  it('Shift+wheel still zooms when onShiftWheel returns false', () => {
    const onShiftWheel = vi.fn().mockReturnValue(false)
    const { view } = setup({ onShiftWheel })
    act(() => {
      view.result.current.handleWheel(
        new WheelEvent('wheel', { clientX: 200, clientY: 150, deltaY: -100, shiftKey: true })
      )
    })
    expect(onShiftWheel).toHaveBeenCalledTimes(1)
    expect(view.result.current.camera.zoom).toBeCloseTo(1.12)
  })
})
