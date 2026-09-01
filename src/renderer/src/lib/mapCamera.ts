export const MIN_ZOOM = 1
export const MAX_ZOOM = 8

/** `centerX` / `centerY` are the image point (0–1) kept in the middle of the window. */
export interface MapCamera {
  zoom: number
  centerX: number
  centerY: number
}

export const FIT_CAMERA: MapCamera = { zoom: 1, centerX: 0.5, centerY: 0.5 }

function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return 1
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

function clampAxis(center: number, visible: number): number {
  const value = Number.isFinite(center) ? center : 0.5
  if (visible >= 1) return 0.5
  const half = visible / 2
  return Math.min(1 - half, Math.max(half, value))
}

export function visibleSize(viewW: number, viewH: number, natW: number, natH: number, zoom: number): {
  visW: number
  visH: number
  scale: number
} {
  const width = natW || 1
  const height = natH || 1
  const fit = Math.min(viewW / width, viewH / height)
  const scale = fit * clampZoom(zoom)
  return {
    scale,
    visW: viewW / (width * scale),
    visH: viewH / (height * scale)
  }
}

export function clampCamera(camera: MapCamera, visW = 1, visH = 1): MapCamera {
  const zoom = clampZoom(camera.zoom)
  return {
    zoom,
    centerX: clampAxis(camera.centerX, visW),
    centerY: clampAxis(camera.centerY, visH)
  }
}

export function mapLayout(
  camera: MapCamera,
  viewW: number,
  viewH: number,
  natW: number,
  natH: number
): { tx: number; ty: number; scale: number; camera: MapCamera } {
  const { scale, visW, visH } = visibleSize(viewW, viewH, natW, natH, camera.zoom)
  const clamped = clampCamera(camera, visW, visH)
  return {
    tx: viewW / 2 - clamped.centerX * (natW || 1) * scale,
    ty: viewH / 2 - clamped.centerY * (natH || 1) * scale,
    scale,
    camera: clamped
  }
}

/** Pointer → 0–1 image point using the camera layout (not the unscaled layout box). */
export function imagePointFromLayout(
  clientX: number,
  clientY: number,
  pane: { left: number; top: number },
  layout: { tx: number; ty: number; scale: number },
  natural: { w: number; h: number }
): { x: number; y: number } | null {
  const visW = natural.w * layout.scale
  const visH = natural.h * layout.scale
  if (visW <= 0 || visH <= 0) return null
  return {
    x: Math.min(1, Math.max(0, (clientX - pane.left - layout.tx) / visW)),
    y: Math.min(1, Math.max(0, (clientY - pane.top - layout.ty) / visH))
  }
}

/** Keep the image point under the cursor while zooming; the crop fills the pane. */
export function zoomCameraAt(
  camera: MapCamera,
  imageX: number,
  imageY: number,
  cursorX: number,
  cursorY: number,
  pane: { left: number; top: number; width: number; height: number },
  content: { width: number; height: number },
  nextZoom: number
): MapCamera {
  const zoom = clampZoom(nextZoom)
  const currentZoom = clampZoom(camera.zoom)
  const widthAt = content.width * (zoom / currentZoom)
  const heightAt = content.height * (zoom / currentZoom)
  if (widthAt <= 0 || heightAt <= 0 || pane.width <= 0 || pane.height <= 0) {
    return clampCamera({ ...camera, zoom })
  }
  const visW = pane.width / widthAt
  const visH = pane.height / heightAt
  return clampCamera(
    {
      zoom,
      centerX: imageX - (cursorX - (pane.left + pane.width / 2)) / widthAt,
      centerY: imageY - (cursorY - (pane.top + pane.height / 2)) / heightAt
    },
    visW,
    visH
  )
}

export function panCamera(
  camera: MapCamera,
  dxPixels: number,
  dyPixels: number,
  contentWidth: number,
  contentHeight: number,
  viewW: number,
  viewH: number
): MapCamera {
  if (contentWidth <= 0 || contentHeight <= 0) return camera
  return clampCamera(
    {
      zoom: camera.zoom,
      centerX: camera.centerX - dxPixels / contentWidth,
      centerY: camera.centerY - dyPixels / contentHeight
    },
    viewW / contentWidth,
    viewH / contentHeight
  )
}
