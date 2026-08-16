export const DEFAULT_FOG_SIZE = 96

export function createFog(size = DEFAULT_FOG_SIZE, fill: 0 | 1 = 0): Uint8Array {
  const n = Math.max(8, Math.min(256, Math.round(size)))
  return new Uint8Array(n * n).fill(fill)
}

export function fogSizeOf(cells: Uint8Array): number {
  return Math.round(Math.sqrt(cells.length)) || DEFAULT_FOG_SIZE
}

export function fogAllClear(cells: Uint8Array): boolean {
  for (let i = 0; i < cells.length; i += 1) {
    if (cells[i]) return false
  }
  return true
}

export function fogAllCovered(cells: Uint8Array): boolean {
  for (let i = 0; i < cells.length; i += 1) {
    if (!cells[i]) return false
  }
  return true
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64')
  let bin = ''
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function base64ToBytes(encoded: string): Uint8Array {
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(encoded, 'base64'))
  const bin = atob(encoded)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
  return bytes
}

export function encodeFog(cells: Uint8Array): string {
  const bytes = new Uint8Array(Math.ceil(cells.length / 8))
  for (let i = 0; i < cells.length; i += 1) {
    if (cells[i]) bytes[i >> 3] |= 1 << (i & 7)
  }
  return bytesToBase64(bytes)
}

export function decodeFog(encoded: string, size = DEFAULT_FOG_SIZE): Uint8Array {
  const cells = createFog(size, 0)
  if (!encoded.trim()) return cells
  try {
    const bytes = base64ToBytes(encoded.trim())
    for (let i = 0; i < cells.length; i += 1) {
      const bit = bytes[i >> 3]
      if (bit !== undefined && bit & (1 << (i & 7))) cells[i] = 1
    }
  } catch {
    return cells
  }
  return cells
}

/** Paint a disk in 0–1 image space. `radius` is a fraction of the image's min side. */
export function paintFogDisk(
  cells: Uint8Array,
  x: number,
  y: number,
  radius: number,
  value: 0 | 1
): boolean {
  const size = fogSizeOf(cells)
  const cx = x * size
  const cy = y * size
  const r = Math.max(0.6, radius * size)
  const r2 = r * r
  const minX = Math.max(0, Math.floor(cx - r))
  const maxX = Math.min(size - 1, Math.ceil(cx + r))
  const minY = Math.max(0, Math.floor(cy - r))
  const maxY = Math.min(size - 1, Math.ceil(cy + r))
  let changed = false
  for (let gy = minY; gy <= maxY; gy += 1) {
    for (let gx = minX; gx <= maxX; gx += 1) {
      const dx = gx + 0.5 - cx
      const dy = gy + 0.5 - cy
      if (dx * dx + dy * dy > r2) continue
      const i = gy * size + gx
      if (cells[i] !== value) {
        cells[i] = value
        changed = true
      }
    }
  }
  return changed
}

export const BRUSH_MIN = 1
export const BRUSH_MAX = 8
export const BRUSH_DEFAULT = 3

export function brushRadius(zoom: number, size = BRUSH_DEFAULT): number {
  const t = Math.min(BRUSH_MAX, Math.max(BRUSH_MIN, size))
  return (0.004 + t * 0.009) / Math.max(1, zoom)
}
