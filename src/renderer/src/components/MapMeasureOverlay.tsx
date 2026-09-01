import { measureLabel, type MeasureKind, type MeasureShape, type Point } from '../lib/mapMeasure'

export default function MapMeasureOverlay({
  shape,
  kind,
  feet,
  origin
}: {
  shape: MeasureShape
  kind: MeasureKind
  feet: number
  origin: Point
}) {
  const fill = 'rgb(232 201 140 / 0.22)'
  const stroke = 'rgb(232 201 140 / 0.95)'
  return (
    <>
      <svg
        className="pointer-events-none absolute inset-0 z-[9] h-full w-full"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        aria-hidden
      >
        {shape.kind === 'round' ? (
          <ellipse
            cx={shape.cx}
            cy={shape.cy}
            rx={shape.rx}
            ry={shape.ry}
            fill={fill}
            stroke={stroke}
            strokeWidth={0.004}
          />
        ) : (
          <polygon
            points={shape.points.map((point) => `${point.x},${point.y}`).join(' ')}
            fill={fill}
            stroke={stroke}
            strokeWidth={0.004}
          />
        )}
        <circle cx={origin.x} cy={origin.y} r={0.01} fill={stroke} />
      </svg>
      <span
        className="pointer-events-none absolute z-[9] whitespace-nowrap rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber"
        style={{
          left: `${origin.x * 100}%`,
          top: `${origin.y * 100}%`,
          transform: 'translate(8px, -120%) scale(calc(1 / var(--map-scale, 1)))'
        }}
      >
        {measureLabel(kind, feet)}
      </span>
    </>
  )
}
