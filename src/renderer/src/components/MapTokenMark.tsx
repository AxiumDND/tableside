import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { PlayerMapToken } from '../../../shared/types'

export function tokenInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[0][0] ?? ''
    const b = parts[1][0] ?? ''
    return `${a}${b}`.toUpperCase()
  }
  const compact = (parts[0] ?? '').replace(/[^a-zA-Z0-9]/g, '')
  return (compact.slice(0, 2) || '?').toUpperCase()
}

function ringClass(kind: PlayerMapToken['kind'], selected?: boolean): string {
  const ring = kind === 'pc' ? 'border-amber' : kind === 'monster' ? 'border-blood' : 'border-moss'
  return selected ? `${ring} ring-2 ring-amber` : ring
}

export default function MapTokenMark({
  token,
  selected,
  interactive,
  ghost,
  onPointerDown,
  onPointerMove,
  onPointerUp
}: {
  token: PlayerMapToken
  selected?: boolean
  interactive?: boolean
  ghost?: boolean
  onPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onPointerMove?: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onPointerUp?: (event: ReactPointerEvent<HTMLButtonElement>) => void
}) {
  const [imageFailed, setImageFailed] = useState(false)
  useEffect(() => {
    setImageFailed(false)
  }, [token.imageSrc])
  const showImage = Boolean(token.imageSrc) && !imageFailed
  return (
    <button
      type="button"
      title={token.label}
      tabIndex={interactive ? 0 : -1}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={`absolute z-[8] ${ghost ? 'opacity-70' : ''} ${interactive ? 'cursor-grab' : 'pointer-events-none'}`}
      style={{
        left: `${token.x * 100}%`,
        top: `${token.y * 100}%`,
        width: `${token.size * 100}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <span
        className={`block aspect-square w-full overflow-hidden rounded-full border-2 bg-ink shadow ${ringClass(token.kind, selected)}`}
      >
        {showImage ? (
          <img
            src={token.imageSrc ?? ''}
            alt=""
            draggable={false}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold leading-none text-parchment">
            {tokenInitials(token.label)}
          </span>
        )}
      </span>
      <span
        className="pointer-events-none absolute top-full left-1/2 z-10 mt-0.5 max-w-[8rem] whitespace-nowrap rounded bg-ink/90 px-1 py-px text-center text-[10px] font-semibold leading-tight text-parchment shadow"
        style={{
          transform: 'translate(-50%, 0) scale(calc(1 / var(--map-scale, 1)))',
          transformOrigin: 'top center'
        }}
      >
        {token.label}
      </span>
    </button>
  )
}
