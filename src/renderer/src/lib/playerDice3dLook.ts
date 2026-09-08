/** Ivory resin body — a matching bag of table dice, not gold wireframes. */
export const DIE_PLASTIC_COLOR = 0xe6d2b0
export const DIE_PLASTIC_DROPPED = 0x8a8074
export const DIE_GLYPH_CANVAS = 256

export type DieGlyphTone = 'ink' | 'gold' | 'blood' | 'faded'

export function diePlasticColor(dropped?: boolean): number {
  return dropped ? DIE_PLASTIC_DROPPED : DIE_PLASTIC_COLOR
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

export function dieGlyphFill(tone: DieGlyphTone): string {
  if (tone === 'gold') return '#c9a227'
  if (tone === 'blood') return '#7a1f1f'
  if (tone === 'faded') return 'rgba(70, 58, 42, 0.45)'
  return '#1c140e'
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
  sides = 20
): void {
  const size = canvasSize(ctx)
  ctx.clearRect(0, 0, size, size)
  const { cx, cy, fontPx } = setupGlyphType(ctx, sides, label)
  const fill = dieGlyphFill(tone)
  ctx.strokeStyle = 'rgba(255, 248, 230, 0.55)'
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
