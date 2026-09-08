/** Ivory resin body — a matching bag of table dice, not gold wireframes. */
export const DIE_PLASTIC_COLOR = 0xe6d2b0
export const DIE_PLASTIC_DROPPED = 0x8a8074

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

/** Paint a recessed, inked numeral so it reads as carved into the face. */
export function paintDieGlyph(
  ctx: CanvasRenderingContext2D,
  label: string,
  tone: DieGlyphTone
): void {
  ctx.clearRect(0, 0, 256, 256)
  const size = label.length > 1 ? 100 : 124
  ctx.font = `700 ${size}px Georgia, "Times New Roman", serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  ctx.strokeStyle = 'rgba(255, 248, 230, 0.35)'
  ctx.lineWidth = 5
  ctx.strokeText(label, 127, 137)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
  ctx.fillText(label, 129, 143)
  ctx.fillStyle = dieGlyphFill(tone)
  ctx.fillText(label, 128, 140)
}
