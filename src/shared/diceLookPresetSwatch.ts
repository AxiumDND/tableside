/**
 * Static paint knobs for dice-bag preset thumbnails (SVG/CSS swatches).
 * Derived from DiceLookPreset materials — no WebGL.
 */

import {
  diceLookPreset,
  type DiceLookPreset,
  type DiceLookPresetId
} from './diceLookPreset'

export type DiceLookPresetSwatchPaint = {
  id: DiceLookPresetId
  label: string
  body: string
  ink: string
  highlight: string
  shade: string
  /** Soft specular blob opacity (0–1). */
  sheenOpacity: number
  /** How glassy / see-through the body reads (0–1). */
  translucency: number
  /** Metal look: stronger linear sheen (0–1). */
  metalness: number
  /** Matte frost / bone roughness cue (0–1). */
  matte: number
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

/** Mix hex #rrggbb toward white (t>0) or black (t<0). */
export function mixHex(hex: string, towardWhite: number): string {
  const raw = hex.replace('#', '')
  if (raw.length !== 6) return hex
  const r = parseInt(raw.slice(0, 2), 16)
  const g = parseInt(raw.slice(2, 4), 16)
  const b = parseInt(raw.slice(4, 6), 16)
  const t = clamp01(Math.abs(towardWhite))
  const mix = (c: number): number =>
    towardWhite >= 0 ? Math.round(c + (255 - c) * t) : Math.round(c * (1 - t))
  const to = (c: number): string => mix(c).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

export function diceLookPresetSwatchPaint(
  preset?: string | DiceLookPreset | null
): DiceLookPresetSwatchPaint {
  const look: DiceLookPreset =
    preset && typeof preset === 'object' && 'cssBody' in preset
      ? preset
      : diceLookPreset(typeof preset === 'string' ? preset : undefined)

  const body = look.cssBody
  const metalness = clamp01(look.metalness)
  const translucency = clamp01(look.transmission)
  const gloss = clamp01(look.clearcoat * (1 - look.clearcoatRoughness * 0.7))
  const matte = clamp01(look.roughness * (1 - metalness) * (1 - translucency * 0.5))

  return {
    id: look.id,
    label: look.label,
    body,
    ink: look.cssInk,
    highlight: mixHex(body, 0.28 + gloss * 0.18 + metalness * 0.12),
    shade: mixHex(body, -(0.22 + metalness * 0.08 + (1 - translucency) * 0.06)),
    sheenOpacity: clamp01(0.18 + gloss * 0.45 + metalness * 0.25 - matte * 0.2),
    translucency,
    metalness,
    matte
  }
}
