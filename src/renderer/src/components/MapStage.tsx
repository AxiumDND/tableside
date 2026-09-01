import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject
} from 'react'
import { mapLayout, type MapCamera } from '../lib/mapCamera'
import { fogSizeOf } from '../lib/mapFog'

export function imagePointFromElement(
  el: HTMLElement | null,
  clientX: number,
  clientY: number
): { x: number; y: number } | null {
  if (!el) return null
  const rect = el.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return null
  return {
    x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))
  }
}

export default function MapStage({
  src,
  camera,
  fogCells,
  fogTick = 0,
  fogOpacity = 1,
  fogOnTop = false,
  underlay,
  children,
  className,
  cursor,
  viewportRef,
  contentRef,
  onNaturalSize,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave
}: {
  src: string
  camera: MapCamera
  fogCells?: Uint8Array | null
  fogTick?: number
  fogOpacity?: number
  fogOnTop?: boolean
  underlay?: ReactNode
  children?: ReactNode
  className?: string
  cursor?: string
  viewportRef?: RefObject<HTMLDivElement | null>
  contentRef?: RefObject<HTMLDivElement | null>
  onNaturalSize?: (size: { w: number; h: number } | null) => void
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerMove?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerLeave?: (event: ReactPointerEvent<HTMLDivElement>) => void
}) {
  const localViewport = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const onNaturalSizeRef = useRef(onNaturalSize)
  onNaturalSizeRef.current = onNaturalSize
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [view, setView] = useState<{ w: number; h: number } | null>(null)

  const setViewport = useCallback(
    (node: HTMLDivElement | null) => {
      localViewport.current = node
      if (viewportRef) viewportRef.current = node
    },
    [viewportRef]
  )

  const measure = useCallback((): void => {
    const vp = localViewport.current
    if (!vp) return
    setView({ w: vp.clientWidth, h: vp.clientHeight })
  }, [])

  useEffect(() => {
    setNatural(null)
    onNaturalSizeRef.current?.(null)
    const image = new Image()
    image.onload = () => {
      const size = { w: image.naturalWidth, h: image.naturalHeight }
      setNatural(size)
      onNaturalSizeRef.current?.(size)
    }
    image.src = src
  }, [src])

  useEffect(() => {
    measure()
    const vp = localViewport.current
    if (!vp || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(vp)
    return () => observer.disconnect()
  }, [measure])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!fogCells || fogCells.length === 0) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }
    const size = fogSizeOf(fogCells)
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const image = ctx.createImageData(size, size)
    const alpha = Math.round(Math.min(1, Math.max(0, fogOpacity)) * 255)
    for (let i = 0; i < fogCells.length; i += 1) {
      if (!fogCells[i]) continue
      const p = i * 4
      image.data[p] = 0
      image.data[p + 1] = 0
      image.data[p + 2] = 0
      image.data[p + 3] = alpha
    }
    ctx.putImageData(image, 0, 0)
  }, [fogCells, fogOpacity, fogTick])

  const layout = natural && view && view.w > 0 && view.h > 0
    ? mapLayout(camera, view.w, view.h, natural.w, natural.h)
    : null

  return (
    <div
      ref={setViewport}
      className={`map-stage ${className ?? ''}`}
      style={{ cursor: cursor || 'default' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
    >
      {layout && natural ? (
        <div
          ref={contentRef}
          className="relative origin-top-left will-change-transform"
          style={{
            width: natural.w,
            height: natural.h,
            transform: `translate(${layout.tx}px, ${layout.ty}px) scale(${layout.scale})`,
            ['--map-scale' as string]: String(layout.scale)
          }}
        >
          <img
            src={src}
            alt=""
            draggable={false}
            className="pointer-events-none h-full w-full select-none"
          />
          {underlay}
          {fogOnTop ? null : <canvas ref={canvasRef} className="map-fog" />}
          {children}
          {fogOnTop ? <canvas ref={canvasRef} className="map-fog" /> : null}
        </div>
      ) : null}
    </div>
  )
}
