import { diceLookPresetSwatchPaint } from '../../../../shared/diceLookPresetSwatch'
import type { DiceLookPreset, DiceLookPresetId } from '../../../../shared/diceLookPreset'

/** Hexagon silhouette matching the CSS d20 clip-path (player-dice-3d-css-die.is-d20). */
const D20_PATH = 'M50 4 L92 28 L92 72 L50 96 L8 72 L8 28 Z'

const SIZE_PX = { md: 40, lg: 56 } as const

export type DiceLookPresetSwatchSize = keyof typeof SIZE_PX

/**
 * Static d20 thumbnail for a dice-bag look preset.
 * Colors come from cssBody/cssInk plus material cues (metal / glass / matte).
 */
export function DiceLookPresetSwatch({
  preset,
  size = 'md',
  className = ''
}: {
  preset: DiceLookPresetId | DiceLookPreset
  size?: DiceLookPresetSwatchSize
  className?: string
}) {
  const paint = diceLookPresetSwatchPaint(preset)
  const px = SIZE_PX[size]
  const gid = `dice-swatch-${paint.id}-${size}`
  const bodyOpacity = 1 - paint.translucency * 0.28
  const metalStop = paint.metalness > 0.4

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      className={`shrink-0 ${className}`.trim()}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${gid}-body`} x1="18%" y1="8%" x2="82%" y2="92%">
          <stop offset="0%" stopColor={paint.highlight} stopOpacity={bodyOpacity} />
          <stop
            offset={metalStop ? '42%' : '55%'}
            stopColor={paint.body}
            stopOpacity={bodyOpacity}
          />
          <stop offset="100%" stopColor={paint.shade} stopOpacity={bodyOpacity} />
        </linearGradient>
        {paint.metalness > 0.25 ? (
          <linearGradient id={`${gid}-metal`} x1="0%" y1="30%" x2="100%" y2="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.05} />
            <stop offset="35%" stopColor="#ffffff" stopOpacity={0.35 * paint.metalness} />
            <stop offset="55%" stopColor="#ffffff" stopOpacity={0.05} />
            <stop offset="100%" stopColor="#000000" stopOpacity={0.12 * paint.metalness} />
          </linearGradient>
        ) : null}
      </defs>
      <path
        d={D20_PATH}
        fill={`url(#${gid}-body)`}
        stroke={paint.shade}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      {/* Facet hint — top triangle of an icosahedron face */}
      <path
        d="M50 4 L92 28 L50 44 L8 28 Z"
        fill={paint.highlight}
        opacity={0.22 + paint.sheenOpacity * 0.2 - paint.matte * 0.12}
      />
      <path d="M50 44 L92 28 L92 72 L50 96 Z" fill={paint.shade} opacity={0.16 + paint.matte * 0.08} />
      {paint.metalness > 0.25 ? (
        <path d={D20_PATH} fill={`url(#${gid}-metal)`} opacity={0.85} />
      ) : null}
      {paint.sheenOpacity > 0.15 ? (
        <ellipse
          cx="38"
          cy="34"
          rx="14"
          ry="9"
          fill="#ffffff"
          opacity={paint.sheenOpacity * (paint.translucency > 0.3 ? 0.55 : 0.4)}
        />
      ) : null}
      {paint.translucency > 0.2 ? (
        <path
          d={D20_PATH}
          fill={paint.highlight}
          opacity={0.12 + paint.translucency * 0.18}
          style={{ mixBlendMode: 'screen' }}
        />
      ) : null}
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fill={paint.ink}
        fontSize="28"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        letterSpacing="-0.5"
      >
        20
      </text>
    </svg>
  )
}
