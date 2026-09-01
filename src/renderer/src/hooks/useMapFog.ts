import { useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import {
  BRUSH_DEFAULT,
  BRUSH_MAX,
  BRUSH_MIN,
  DEFAULT_FOG_SIZE,
  brushRadius,
  createFog,
  decodeFog,
  encodeFog,
  fogAllClear,
  fogSizeOf,
  paintFogDisk
} from '../lib/mapFog'
import type { MapNoteData } from '../lib/mapNote'

export interface MapFog {
  /** Live fog cells. Exposed as a ref so persistence + live-view can read the latest without re-renders. */
  fogRef: MutableRefObject<Uint8Array>
  /** Bumped whenever the cells mutate so the canvas re-renders. */
  fogTick: number
  brushSize: number
  setBrushSize: Dispatch<SetStateAction<number>>
  /** Grow/shrink the brush, clamped to the allowed range. */
  bumpBrush: (delta: number) => void
  /** Hover point for the brush/token preview overlay. */
  brushPos: { x: number; y: number } | null
  setBrushPos: (pos: { x: number; y: number } | null) => void
  /** In-progress paint value while dragging (1 = hide, 0 = reveal, null = idle). */
  paintRef: MutableRefObject<0 | 1 | null>
  /** Re-seed the cells from a note's stored fog (call when the open map changes). */
  reset: (data: MapNoteData | null) => void
  /** Paint a brush disk at an image-space point and schedule a save. */
  stamp: (point: { x: number; y: number }, value: 0 | 1) => void
  /** Hide the whole map, persisting immediately. */
  coverAll: () => void
  /** Reveal the whole map, persisting immediately. */
  clearFog: () => void
  /** Serialized fog fields for writing back into the map note. */
  fields: () => { fog: string; fogSize: number }
  /** Brush radius (image-space fraction) at the given zoom, for the cursor overlay. */
  brushRadiusAt: (zoom: number) => number
}

/**
 * Owns the map fog-of-war cells and painting mechanics. `getZoom` supplies the
 * current camera zoom for brush sizing; `onCommit` persists the current fog
 * (the caller wires it to the map-note write path).
 */
export function useMapFog(opts: { getZoom: () => number; onCommit: () => void }): MapFog {
  const [fogTick, setFogTick] = useState(0)
  const [brushSize, setBrushSize] = useState(BRUSH_DEFAULT)
  const [brushPos, setBrushPos] = useState<{ x: number; y: number } | null>(null)
  const fogRef = useRef<Uint8Array>(createFog(DEFAULT_FOG_SIZE, 0))
  const brushSizeRef = useRef(brushSize)
  const paintRef = useRef<0 | 1 | null>(null)
  const saveTimer = useRef<number | null>(null)
  const getZoomRef = useRef(opts.getZoom)
  const onCommitRef = useRef(opts.onCommit)
  brushSizeRef.current = brushSize
  getZoomRef.current = opts.getZoom
  onCommitRef.current = opts.onCommit

  function bump(): void {
    setFogTick((n) => n + 1)
  }

  function scheduleSave(): void {
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => onCommitRef.current(), 400)
  }

  function reset(data: MapNoteData | null): void {
    const size = data?.fogSize || DEFAULT_FOG_SIZE
    fogRef.current = data?.fog ? decodeFog(data.fog, size) : createFog(size, 0)
    bump()
  }

  function stamp(point: { x: number; y: number }, value: 0 | 1): void {
    const radius = brushRadius(getZoomRef.current(), brushSizeRef.current)
    if (paintFogDisk(fogRef.current, point.x, point.y, radius, value)) {
      bump()
      scheduleSave()
    }
  }

  function coverAll(): void {
    fogRef.current = createFog(fogSizeOf(fogRef.current), 1)
    bump()
    onCommitRef.current()
  }

  function clearFog(): void {
    fogRef.current = createFog(fogSizeOf(fogRef.current), 0)
    bump()
    onCommitRef.current()
  }

  function bumpBrush(delta: number): void {
    setBrushSize((size) => Math.min(BRUSH_MAX, Math.max(BRUSH_MIN, size + delta)))
  }

  function fields(): { fog: string; fogSize: number } {
    const cells = fogRef.current
    return { fog: fogAllClear(cells) ? '' : encodeFog(cells), fogSize: fogSizeOf(cells) }
  }

  function brushRadiusAt(zoom: number): number {
    return brushRadius(zoom, brushSizeRef.current)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key !== '[' && event.key !== ']') return
      event.preventDefault()
      bumpBrush(event.key === ']' ? 1 : -1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [])

  return {
    fogRef,
    fogTick,
    brushSize,
    setBrushSize,
    bumpBrush,
    brushPos,
    setBrushPos,
    paintRef,
    reset,
    stamp,
    coverAll,
    clearFog,
    fields,
    brushRadiusAt
  }
}
