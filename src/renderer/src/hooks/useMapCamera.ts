import { useEffect, useRef, useState, type Dispatch, type MutableRefObject, type RefObject, type SetStateAction } from 'react'
import {
  FIT_CAMERA,
  MAX_ZOOM,
  MIN_ZOOM,
  panCamera,
  zoomCameraAt,
  type MapCamera
} from '../lib/mapCamera'
import { imagePointFromElement } from '../components/MapStage'

export interface MapCameraControls {
  camera: MapCamera
  cameraRef: MutableRefObject<MapCamera>
  setCamera: Dispatch<SetStateAction<MapCamera>>
  setZoom: (zoom: number) => void
  fit: () => void
  /** Reset to the fitted camera (call when the open map changes). */
  reset: () => void
  /** Latest pan pointer; used for the grabbing cursor without an extra render. */
  panRef: MutableRefObject<{ x: number; y: number } | null>
  beginPan: (clientX: number, clientY: number) => void
  movePan: (clientX: number, clientY: number) => void
  endPan: () => void
  /** Wheel → zoom-at-cursor, after an optional Shift intercept. Exposed for tests. */
  handleWheel: (event: WheelEvent) => void
}

/**
 * Owns the map camera (pan/zoom/fit) and the mount-only non-passive wheel
 * listener. Shift+wheel is delegated via `onShiftWheel` so fog-brush and
 * token-scale adjustments stay with those hooks.
 */
export function useMapCamera(opts: {
  paneRef: RefObject<HTMLElement | null>
  contentRef: RefObject<HTMLElement | null>
  viewportRef: RefObject<HTMLElement | null>
  /** Return true when Shift+wheel was handled (fog brush / token scale). */
  onShiftWheel?: (event: WheelEvent) => boolean
}): MapCameraControls {
  const { paneRef, contentRef, viewportRef } = opts
  const [camera, setCamera] = useState<MapCamera>(FIT_CAMERA)
  const cameraRef = useRef(camera)
  const panRef = useRef<{ x: number; y: number } | null>(null)
  const onShiftWheelRef = useRef(opts.onShiftWheel)
  cameraRef.current = camera
  onShiftWheelRef.current = opts.onShiftWheel

  function setZoom(zoom: number): void {
    setCamera((prev) => ({ ...prev, zoom }))
  }

  function fit(): void {
    setCamera(FIT_CAMERA)
  }

  function beginPan(clientX: number, clientY: number): void {
    panRef.current = { x: clientX, y: clientY }
  }

  function movePan(clientX: number, clientY: number): void {
    const active = panRef.current
    if (!active) return
    const dx = clientX - active.x
    const dy = clientY - active.y
    panRef.current = { x: clientX, y: clientY }
    const content = contentRef.current
    const pane = viewportRef.current ?? paneRef.current
    if (!content || !pane) return
    const contentRect = content.getBoundingClientRect()
    setCamera((prev) =>
      panCamera(prev, dx, dy, contentRect.width, contentRect.height, pane.clientWidth, pane.clientHeight)
    )
  }

  function endPan(): void {
    panRef.current = null
  }

  function handleWheel(event: WheelEvent): void {
    event.preventDefault()
    if (event.shiftKey && onShiftWheelRef.current?.(event)) return
    const content = contentRef.current
    const view = viewportRef.current ?? paneRef.current
    const point = imagePointFromElement(content, event.clientX, event.clientY)
    if (!point || !content || !view) return
    const contentRect = content.getBoundingClientRect()
    const paneRect = view.getBoundingClientRect()
    if (contentRect.width <= 0 || paneRect.width <= 0) return
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, cameraRef.current.zoom * factor))
    setCamera(
      zoomCameraAt(
        cameraRef.current,
        point.x,
        point.y,
        event.clientX,
        event.clientY,
        paneRect,
        contentRect,
        nextZoom
      )
    )
  }

  useEffect(() => {
    const pane = paneRef.current
    if (!pane) return
    pane.addEventListener('wheel', handleWheel, { passive: false })
    return () => pane.removeEventListener('wheel', handleWheel)
    // Mount-only: handleWheel closes over refs + setCamera, which stay valid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    camera,
    cameraRef,
    setCamera,
    setZoom,
    fit,
    reset: fit,
    panRef,
    beginPan,
    movePan,
    endPan,
    handleWheel
  }
}
