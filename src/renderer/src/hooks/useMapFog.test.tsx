// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useMapFog } from './useMapFog'
import { BRUSH_MAX, BRUSH_MIN } from '../lib/mapFog'
import type { MapNoteData } from '../lib/mapNote'

function mapData(overrides: Partial<MapNoteData> = {}): MapNoteData {
  return { image: '', pins: [], tokens: [], tokenScale: 1, gridX: 0, gridY: 0, pinsLocked: true, fog: '', fogSize: 0, ...overrides }
}

function setup() {
  const onCommit = vi.fn()
  const view = renderHook(() => useMapFog({ getZoom: () => 1, onCommit }))
  return { view, onCommit }
}

describe('useMapFog', () => {
  it('coverAll fills fog and commits immediately', () => {
    const { view, onCommit } = setup()
    act(() => view.result.current.coverAll())
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(view.result.current.fields().fog).not.toBe('')
  })

  it('clearFog empties fog and commits', () => {
    const { view, onCommit } = setup()
    act(() => view.result.current.coverAll())
    act(() => view.result.current.clearFog())
    expect(onCommit).toHaveBeenCalledTimes(2)
    expect(view.result.current.fields().fog).toBe('')
  })

  it('reset restores serialized fog and round-trips through fields()', () => {
    const { view } = setup()
    act(() => view.result.current.coverAll())
    const saved = view.result.current.fields()
    expect(saved.fog).not.toBe('')

    act(() => view.result.current.reset(null))
    expect(view.result.current.fields().fog).toBe('')

    act(() => view.result.current.reset(mapData({ fog: saved.fog, fogSize: saved.fogSize })))
    expect(view.result.current.fields().fog).toBe(saved.fog)
  })

  it('stamp paints cells at a point', () => {
    const { view } = setup()
    expect(view.result.current.fields().fog).toBe('')
    act(() => view.result.current.stamp({ x: 0.5, y: 0.5 }, 1))
    expect(view.result.current.fields().fog).not.toBe('')
  })

  it('bumpBrush clamps to the allowed range', () => {
    const { view } = setup()
    act(() => view.result.current.bumpBrush(-1000))
    expect(view.result.current.brushSize).toBe(BRUSH_MIN)
    act(() => view.result.current.bumpBrush(1000))
    expect(view.result.current.brushSize).toBe(BRUSH_MAX)
  })
})
