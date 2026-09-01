import { useEffect, useRef, useState } from 'react'
import type { PlayerHyperspace } from '../../../shared/types'
import {
  HYPERSPACE_ARRIVE_MS,
  HYPERSPACE_ENTER_MS,
  HYPERSPACE_EXIT_STREAK_MS,
  HYPERSPACE_FADE_OUT_MS,
  HYPERSPACE_REVEAL_MS,
  HYPERSPACE_STARFIELD_MS,
  HYPERSPACE_TUNNEL_HOLD_MS
} from '../../../shared/playerHyperspace'
import { hyperspaceShipSrc } from '../lib/hyperspaceDefaults'

type JumpPhase = 'stars' | 'tunnel' | 'cruise' | 'exit-streaks' | 'reveal' | 'abort'

function warpOn(phase: JumpPhase): boolean {
  return phase === 'tunnel' || phase === 'exit-streaks' || phase === 'reveal'
}

type WarpStar = {
  x: number
  y: number
  z: number
  pz: number
  speed: number
  bright: number
}

function spawnStar(star: WarpStar, far: boolean): void {
  const angle = Math.random() * Math.PI * 2
  const radius = 0.05 + Math.random() * 1.25
  star.x = Math.cos(angle) * radius
  star.y = Math.sin(angle) * radius
  star.z = far ? 0.92 + Math.random() * 0.35 : 0.14 + Math.random() * 0.86
  star.pz = star.z
  star.speed = 0.0035 + Math.random() * 0.009
  star.bright = 0.45 + Math.random() * 0.55
}

export default function OpeningHyperspace({ jump }: { jump: PlayerHyperspace }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shipRef = useRef(false)
  const phaseRef = useRef<JumpPhase>('stars')
  const [phase, setPhase] = useState<JumpPhase>('stars')

  function go(next: JumpPhase): void {
    phaseRef.current = next
    setPhase(next)
  }

  useEffect(() => {
    const timers: number[] = []
    if (jump.stoppingAt && !jump.arrivedAt) {
      go('abort')
      return
    }
    if (jump.arrivedAt) {
      go('exit-streaks')
      timers.push(window.setTimeout(() => go('reveal'), HYPERSPACE_EXIT_STREAK_MS))
      return () => timers.forEach((id) => window.clearTimeout(id))
    }
    go('stars')
    timers.push(window.setTimeout(() => go('tunnel'), HYPERSPACE_STARFIELD_MS))
    timers.push(
      window.setTimeout(
        () => go('cruise'),
        HYPERSPACE_STARFIELD_MS + HYPERSPACE_ENTER_MS + HYPERSPACE_TUNNEL_HOLD_MS
      )
    )
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [jump.startedAt, jump.arrivedAt, jump.stoppingAt])

  const showShip = phase === 'cruise' || phase === 'exit-streaks'
  shipRef.current = showShip

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    if (!canvas || !host) return
    const surface = canvas
    const frameHost = host
    const ctx = surface.getContext('2d')
    if (!ctx) return
    const draw = ctx

    let width = 0
    let height = 0
    let raf = 0
    const stars: WarpStar[] = Array.from({ length: 900 }, () => ({
      x: 0,
      y: 0,
      z: 1,
      pz: 1,
      speed: 0.005,
      bright: 1
    }))

    function resize(): void {
      width = frameHost.clientWidth
      height = frameHost.clientHeight
      if (width < 8 || height < 8) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      surface.width = Math.floor(width * dpr)
      surface.height = Math.floor(height * dpr)
      draw.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function project(x: number, y: number, z: number, fov: number, cx: number, cy: number): [number, number] {
      const depth = Math.max(0.06, z)
      const k = fov / depth
      return [cx + x * k, cy + y * k]
    }

    function frame(): void {
      const warp = warpOn(phaseRef.current) ? 1 : 0
      const shipUp = shipRef.current
      const cx = width / 2
      const cy = height / 2
      const fov = Math.max(width, height) * 0.32
      const reach = Math.hypot(cx, cy) + 40

      draw.globalCompositeOperation = 'source-over'
      draw.fillStyle = shipUp ? 'rgba(0, 2, 12, 0.12)' : '#000'
      draw.fillRect(0, 0, width, height)

      if (warp > 0.08 && !shipUp) {
        const bloom = (warp - 0.08) * 0.42
        const glow = draw.createRadialGradient(cx, cy, 0, cx, cy, reach * 0.55)
        glow.addColorStop(0, `rgba(170, 210, 255, ${bloom * 0.55})`)
        glow.addColorStop(0.18, `rgba(60, 120, 210, ${bloom * 0.28})`)
        glow.addColorStop(0.55, `rgba(10, 30, 70, ${bloom * 0.08})`)
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
        draw.fillStyle = glow
        draw.fillRect(0, 0, width, height)
      }

      const rush = 0.35 + warp * warp * 36
      if (warp > 0.03) draw.globalCompositeOperation = 'lighter'

      for (const star of stars) {
        star.pz = star.z
        star.z -= star.speed * rush
        if (star.z < 0.07) {
          spawnStar(star, true)
          continue
        }

        const [x2, y2] = project(star.x, star.y, star.z, fov, cx, cy)
        if (warp < 0.04) {
          draw.globalCompositeOperation = 'source-over'
          draw.fillStyle = `rgba(230, 238, 255, ${0.4 + star.bright * 0.6})`
          draw.beginPath()
          draw.arc(x2, y2, star.bright > 0.85 ? 1.4 : 0.65, 0, Math.PI * 2)
          draw.fill()
          continue
        }

        const trail = 0.012 + warp * warp * 0.55
        const [x1, y1] = project(star.x, star.y, Math.min(1.4, star.z + trail), fov, cx, cy)
        if (
          (x1 < -40 && x2 < -40) ||
          (y1 < -40 && y2 < -40) ||
          (x1 > width + 40 && x2 > width + 40) ||
          (y1 > height + 40 && y2 > height + 40)
        ) {
          continue
        }

        const alpha = (0.35 + star.bright * 0.65) * (0.45 + warp * 0.55)
        draw.strokeStyle = `rgba(186, 220, 255, ${alpha * 0.45})`
        draw.lineWidth = 1.6 + warp * 2.2
        draw.lineCap = 'round'
        draw.beginPath()
        draw.moveTo(x1, y1)
        draw.lineTo(x2, y2)
        draw.stroke()
        draw.strokeStyle = `rgba(245, 250, 255, ${alpha})`
        draw.lineWidth = 0.55 + warp * 0.85
        draw.beginPath()
        draw.moveTo(x1, y1)
        draw.lineTo(x2, y2)
        draw.stroke()
      }

      draw.globalCompositeOperation = 'source-over'
      raf = window.requestAnimationFrame(frame)
    }

    resize()
    for (const star of stars) spawnStar(star, false)
    const observer = new ResizeObserver(resize)
    observer.observe(frameHost)
    raf = window.requestAnimationFrame(frame)
    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(raf)
    }
  }, [jump.startedAt])

  const showCaption = (phase === 'stars' || phase === 'tunnel' || phase === 'cruise') && Boolean(jump.title)

  return (
    <div
      className={`opening-hyperspace is-${phase}`}
      aria-label={jump.title || 'Hyperspace'}
      style={{
        ['--hyperspace-enter-ms' as string]: `${HYPERSPACE_ENTER_MS}ms`,
        ['--hyperspace-reveal-ms' as string]: `${HYPERSPACE_REVEAL_MS}ms`,
        ['--hyperspace-arrive-ms' as string]: `${HYPERSPACE_ARRIVE_MS}ms`,
        ['--hyperspace-fade-ms' as string]: `${HYPERSPACE_FADE_OUT_MS}ms`
      }}
    >
      {showShip ? (
        <div className="opening-hyperspace-ship">
          <img src={hyperspaceShipSrc(jump.shipSrc)} alt="" />
        </div>
      ) : null}
      <canvas ref={canvasRef} className="opening-hyperspace-streaks" aria-hidden />
      {showCaption ? <p className="opening-hyperspace-caption">{jump.title}</p> : null}
    </div>
  )
}
