import { useEffect, useRef, useState } from 'react'
import type { PlayerState } from '../../../shared/types'

const FADE_MS = 5000

interface Layer {
  id: number
  src: string
  fromBlack?: boolean
}

export default function PlayerView({
  state
}: {
  state: PlayerState
  compact?: boolean
}) {
  const incoming = state.imageSrc
  const nextId = useRef(1)
  const [layers, setLayers] = useState<Layer[]>([])
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    if (!incoming) {
      setClearing(true)
      const t = window.setTimeout(() => {
        setLayers([])
        setClearing(false)
      }, FADE_MS)
      return () => clearTimeout(t)
    }

    setClearing(false)
    setLayers((prev) => {
      if (prev.at(-1)?.src === incoming) return prev
      const layer: Layer = { id: nextId.current++, src: incoming, fromBlack: prev.length === 0 }
      return [...prev.slice(-1), layer]
    })
  }, [incoming])

  useEffect(() => {
    if (layers.length <= 1) return
    const t = window.setTimeout(() => {
      setLayers((prev) => prev.slice(-1))
    }, FADE_MS)
    return () => clearTimeout(t)
  }, [layers.at(-1)?.id])

  return (
    <div className="player-stage">
      {layers.map((layer, index) => {
        const top = index === layers.length - 1
        const fadeIn = top && !clearing && (index > 0 || Boolean(layer.fromBlack))
        const fadeOut = top && clearing
        return (
          <div
            key={layer.id}
            className={`player-layer${fadeIn ? ' player-fade-in' : ''}${fadeOut ? ' player-fade-out' : ''}`}
          >
            <img src={layer.src} alt="" />
          </div>
        )
      })}
    </div>
  )
}
