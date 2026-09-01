import { gridLinePositions } from '../lib/mapGrid'

/** Faint 5 ft grid over the map image. Coordinates are 0–1 of the image box. */
export default function MapGridOverlay({
  cell,
  aspect
}: {
  cell: number
  aspect: number
}) {
  const { vertical, horizontal } = gridLinePositions(cell, aspect)
  if (vertical.length === 0 && horizontal.length === 0) return null
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[4] h-full w-full"
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      aria-hidden
    >
      {vertical.map((x) => (
        <line key={`v-${x}`} x1={x} y1={0} x2={x} y2={1} stroke="rgb(232 201 140 / 0.28)" strokeWidth={0.002} />
      ))}
      {horizontal.map((y) => (
        <line key={`h-${y}`} x1={0} y1={y} x2={1} y2={y} stroke="rgb(232 201 140 / 0.28)" strokeWidth={0.002} />
      ))}
    </svg>
  )
}
