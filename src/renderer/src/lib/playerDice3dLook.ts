import {
  type DiceLookPreset,
  type DiceLookPresetId,
  diceLookPreset
} from '../../../shared/diceLookPreset'

export type { DiceLookPreset, DiceLookPresetId }
export {
  DEFAULT_DICE_LOOK_PRESET,
  DICE_LOOK_PRESET_IDS,
  DICE_LOOK_PRESETS,
  diceLookPreset,
  diceLookPresetFromSettings,
  parseDiceLookPresetId
} from '../../../shared/diceLookPreset'

/** @deprecated Prefer diceLookPreset('ivory').body — kept for older tests/call sites. */
export const DIE_PLASTIC_COLOR = 0xe6d2b0
/** @deprecated Prefer diceLookPreset('ivory').droppedBody */
export const DIE_PLASTIC_DROPPED = 0x8a8074
export const DIE_GLYPH_CANVAS = 256
/** Shared tileable resin/plastic microtexture atlas size (generated, not shipped). */
export const DIE_FACE_TEXTURE_SIZE = 128

export type DieGlyphTone = 'ink' | 'gold' | 'blood' | 'faded'

export function resolveDiceLook(preset?: string | DiceLookPreset | null): DiceLookPreset {
  if (preset && typeof preset === 'object') return preset
  return diceLookPreset(typeof preset === 'string' ? preset : undefined)
}

export function diePlasticColor(dropped?: boolean, preset?: string | DiceLookPreset | null): number {
  const look = resolveDiceLook(preset)
  return dropped ? look.droppedBody : look.body
}

export function dieGlyphTone(opts: {
  dropped?: boolean
  highlight?: 'none' | 'nat20' | 'nat1'
}): DieGlyphTone {
  if (opts.dropped) return 'faded'
  if (opts.highlight === 'nat20') return 'gold'
  if (opts.highlight === 'nat1') return 'blood'
  return 'ink'
}

export function dieGlyphFill(tone: DieGlyphTone, preset?: string | DiceLookPreset | null): string {
  const look = resolveDiceLook(preset)
  if (tone === 'gold') return look.gold
  if (tone === 'blood') return look.blood
  if (tone === 'faded') return look.faded
  return look.ink
}

/** Bag scale: d4 a bit large, d6/d10 a bit small, d20 at 1. */
export function dieBodyScale(sides: number): number {
  if (sides <= 4) return 1.18
  if (sides <= 6) return 0.92
  if (sides <= 8) return 1
  if (sides <= 10) return 0.94
  if (sides <= 12) return 0.96
  return 1
}

/** Face type size: d6 numbers are large, two-digit tens are small. */
export function dieGlyphScale(sides: number, label: string): number {
  const wide = label.length > 1
  if (sides <= 4) return 0.92
  if (sides <= 6) return 1.32
  if (sides <= 8) return 1.12
  if (sides <= 10) return wide ? 0.78 : 1
  if (sides <= 12) return 1.08
  return wide ? 0.88 : 1
}

export function dieGlyphFontPx(sides: number, label: string): number {
  const base = label.length > 1 ? 100 : 124
  return Math.round(base * dieGlyphScale(sides, label))
}

/** Classic table-die mark so 6 and 9 cannot swap. */
export function dieGlyphShouldDot(label: string): boolean {
  return label === '6' || label === '9'
}

function canvasSize(ctx: CanvasRenderingContext2D): number {
  return ctx.canvas.width || DIE_GLYPH_CANVAS
}

function paintUnderDot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  fontPx: number,
  fill: string
): void {
  const radius = Math.max(3, fontPx * 0.055)
  ctx.beginPath()
  ctx.arc(cx, cy + fontPx * 0.42, radius, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
}

function setupGlyphType(ctx: CanvasRenderingContext2D, sides: number, label: string): {
  cx: number
  cy: number
  fontPx: number
} {
  const size = canvasSize(ctx)
  const fontPx = dieGlyphFontPx(sides, label)
  ctx.font = `700 ${fontPx}px Georgia, "Times New Roman", serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  return { cx: size / 2, cy: size / 2 + 4, fontPx }
}

/** Paint a recessed, inked numeral so it reads as carved into the face. */
export function paintDieGlyph(
  ctx: CanvasRenderingContext2D,
  label: string,
  tone: DieGlyphTone,
  sides = 20,
  preset?: string | DiceLookPreset | null
): void {
  const look = resolveDiceLook(preset)
  const size = canvasSize(ctx)
  ctx.clearRect(0, 0, size, size)
  const { cx, cy, fontPx } = setupGlyphType(ctx, sides, label)
  const fill = dieGlyphFill(tone, look)
  ctx.strokeStyle = look.glyphHighlight
  ctx.lineWidth = Math.max(4, Math.round(fontPx / 22))
  ctx.strokeText(label, cx - 1, cy - 3)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)'
  ctx.fillText(label, cx + 1, cy + 3)
  ctx.fillStyle = fill
  ctx.fillText(label, cx, cy)
  if (dieGlyphShouldDot(label)) paintUnderDot(ctx, cx, cy, fontPx, fill)
}

/** Grayscale height: white high, dark engraved. Soft on purpose. */
export function paintDieGlyphHeight(
  ctx: CanvasRenderingContext2D,
  label: string,
  sides = 20
): void {
  const size = canvasSize(ctx)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)
  const { cx, cy, fontPx } = setupGlyphType(ctx, sides, label)
  ctx.shadowColor = '#000000'
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 1
  ctx.strokeStyle = '#777777'
  ctx.lineWidth = Math.max(4, Math.round(fontPx / 22))
  ctx.strokeText(label, cx, cy)
  ctx.fillStyle = '#555555'
  ctx.fillText(label, cx, cy)
  if (dieGlyphShouldDot(label)) paintUnderDot(ctx, cx, cy, fontPx, '#555555')
}

/**
 * Sobel-style normal map from an RGBA height canvas (red channel).
 * Strength stays modest so the cut does not look like a stamp.
 */
export function heightToNormalMap(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  strength = 2.2
): Uint8ClampedArray {
  const count = width * height
  const raw = new Float32Array(count)
  for (let i = 0; i < count; i += 1) raw[i] = rgba[i * 4] / 255

  const tmp = new Float32Array(count)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const left = raw[y * width + Math.max(0, x - 1)]
      const mid = raw[y * width + x]
      const right = raw[y * width + Math.min(width - 1, x + 1)]
      tmp[y * width + x] = (left + 2 * mid + right) * 0.25
    }
  }

  const blurred = new Float32Array(count)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const up = tmp[Math.max(0, y - 1) * width + x]
      const mid = tmp[y * width + x]
      const down = tmp[Math.min(height - 1, y + 1) * width + x]
      blurred[y * width + x] = (up + 2 * mid + down) * 0.25
    }
  }

  const out = new Uint8ClampedArray(count * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx =
        (blurred[y * width + Math.max(0, x - 1)] - blurred[y * width + Math.min(width - 1, x + 1)]) *
        strength
      const dy =
        (blurred[Math.max(0, y - 1) * width + x] - blurred[Math.min(height - 1, y + 1) * width + x]) *
        strength
      const inv = 1 / Math.hypot(dx, dy, 1)
      const i = (y * width + x) * 4
      out[i] = Math.round(dx * inv * 127.5 + 127.5)
      out[i + 1] = Math.round(dy * inv * 127.5 + 127.5)
      out[i + 2] = Math.round(inv * 127.5 + 127.5)
      out[i + 3] = 255
    }
  }
  return out
}

/** Wrap-friendly hash in [0, 1). Lattice coords must already be period-wrapped. */
function hash2(ix: number, iy: number, seed: number): number {
  const n = Math.sin(ix * 127.1 + iy * 311.7 + seed * 74.7) * 43758.5453123
  return n - Math.floor(n)
}

function valueNoiseWrap(x: number, y: number, period: number, seed: number): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const tx = x - x0
  const ty = y - y0
  const x1 = x0 + 1
  const y1 = y0 + 1
  const sx = tx * tx * (3 - 2 * tx)
  const sy = ty * ty * (3 - 2 * ty)
  const wrap = (i: number): number => ((i % period) + period) % period
  const n00 = hash2(wrap(x0), wrap(y0), seed)
  const n10 = hash2(wrap(x1), wrap(y0), seed)
  const n01 = hash2(wrap(x0), wrap(y1), seed)
  const n11 = hash2(wrap(x1), wrap(y1), seed)
  const nx0 = n00 * (1 - sx) + n10 * sx
  const nx1 = n01 * (1 - sx) + n11 * sx
  return nx0 * (1 - sy) + nx1 * sy
}

/**
 * Seamless resin / plastic microtexture pixels (RGBA).
 * Periods are integers so left/right and top/bottom edges match when tiled.
 */
export function dieFaceMicrotexturePixels(
  size: number,
  opts?: { seed?: number; contrast?: number; tintRgb?: [number, number, number] }
): Uint8ClampedArray {
  const seed = opts?.seed ?? 2.4
  const contrast = opts?.contrast ?? 0.11
  const tint = opts?.tintRgb ?? [1, 1, 1]
  const out = new Uint8ClampedArray(size * size * 4)
  const octaves: { period: number; amp: number }[] = [
    { period: 4, amp: 0.45 },
    { period: 8, amp: 0.28 },
    { period: 16, amp: 0.18 },
    { period: 32, amp: 0.09 }
  ]
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let v = 0
      let w = 0
      for (let o = 0; o < octaves.length; o += 1) {
        const { period, amp } = octaves[o]!
        const fx = (x / size) * period
        const fy = (y / size) * period
        v += amp * valueNoiseWrap(fx, fy, period, seed + o * 17.3)
        w += amp
      }
      const n = w > 0 ? v / w : 0.5
      const centered = (n - 0.5) * contrast
      // Stay near white so albedo multiply does not muddy bag colors; roughness still varies.
      const base = 0.92 + centered
      const i = (y * size + x) * 4
      out[i] = Math.max(0, Math.min(255, Math.round(base * tint[0] * 255)))
      out[i + 1] = Math.max(0, Math.min(255, Math.round(base * tint[1] * 255)))
      out[i + 2] = Math.max(0, Math.min(255, Math.round(base * tint[2] * 255)))
      out[i + 3] = 255
    }
  }
  return out
}

/**
 * Seamless resin / plastic microtexture for die faces.
 * Grayscale mid-gray atlas — multiply with body color / drive roughness.
 */
export function paintDieFaceMicrotexture(
  ctx: CanvasRenderingContext2D,
  opts?: { seed?: number; contrast?: number; tintRgb?: [number, number, number] }
): void {
  const size = ctx.canvas.width || DIE_FACE_TEXTURE_SIZE
  if (ctx.canvas.height !== size) ctx.canvas.height = size
  const pixels = dieFaceMicrotexturePixels(size, opts)
  const img = ctx.createImageData(size, size)
  img.data.set(pixels)
  ctx.putImageData(img, 0, 0)
}

/** How strongly the shared atlas affects albedo / roughness for a bag look. */
export function dieFaceTextureContrast(look: DiceLookPreset): number {
  if (!look.useGrain) return 0.045
  return Math.min(0.16, 0.07 + look.grainDots / 900)
}

/** Parse preset grainTint (#rrggbb) into 0..1 RGB for the atlas. */
export function dieFaceTextureTint(look: DiceLookPreset): [number, number, number] {
  const hex = look.grainTint.trim()
  const match = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!match) return [1, 1, 1]
  const n = Number.parseInt(match[1]!, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/** Body material fields for MeshPhysicalMaterial (no Three dependency here). */
export function dieBodyMaterialInputs(
  look: DiceLookPreset,
  dropped?: boolean
): {
  color: number
  roughness: number
  metalness: number
  clearcoat: number
  clearcoatRoughness: number
  sheen: number
  sheenColor: number
  sheenRoughness: number
  ior: number
  transmission: number
  thickness: number
  envMapIntensity: number
  specularIntensity: number
  transparent: boolean
  opacity: number
} {
  return {
    color: diePlasticColor(dropped, look),
    roughness: look.roughness,
    metalness: look.metalness,
    clearcoat: dropped ? Math.min(look.clearcoat, 0.25) : look.clearcoat,
    clearcoatRoughness: look.clearcoatRoughness,
    sheen: look.sheen,
    sheenColor: look.sheenColor,
    sheenRoughness: look.sheenRoughness,
    ior: look.ior,
    transmission: dropped ? 0 : look.transmission,
    thickness: dropped ? 0 : look.thickness,
    envMapIntensity: look.envMapIntensity,
    specularIntensity: look.specularIntensity,
    transparent: Boolean(dropped) || look.transmission > 0,
    opacity: dropped ? 0.5 : 1
  }
}
