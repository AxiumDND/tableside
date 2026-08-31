import { useEffect, useRef } from 'react'
import type { LegendLookId } from '../../../shared/types'

interface Particle {
  x: number
  y: number
  r: number
  vy: number
  vx: number
  life: number
  maxLife: number
  drift: number
  hue: number
}

/** Atmosphere particles for campfire chronicle looks. */
export default function LegendParticles({ look }: { look: LegendLookId }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvasEl = ref.current
    const hostEl = canvasEl?.parentElement
    if (!canvasEl || !hostEl) return
    const context = canvasEl.getContext('2d')
    if (!context) return
    const canvas: HTMLCanvasElement = canvasEl
    const host: HTMLElement = hostEl
    const ctx: CanvasRenderingContext2D = context

    let width = 0
    let height = 0
    let raf = 0
    let particles: Particle[] = []

    function spawn(partial?: boolean): Particle {
      if (look === 'embers') {
        return {
          x: width * (0.15 + Math.random() * 0.7),
          y: height * (partial ? Math.random() : 0.72 + Math.random() * 0.28),
          r: 0.6 + Math.random() * 1.8,
          vy: -(0.18 + Math.random() * 0.55),
          vx: (Math.random() - 0.5) * 0.35,
          life: 0,
          maxLife: 180 + Math.random() * 220,
          drift: Math.random() * Math.PI * 2,
          hue: 28 + Math.random() * 28
        }
      }
      if (look === 'neon') {
        return {
          x: width * (0.05 + Math.random() * 0.9),
          y: height * (partial ? Math.random() : 0.5 + Math.random() * 0.55),
          r: 6 + Math.random() * 22,
          vy: -(0.12 + Math.random() * 0.35),
          vx: (Math.random() - 0.5) * 0.45,
          life: 0,
          maxLife: 200 + Math.random() * 280,
          drift: Math.random() * Math.PI * 2,
          hue: Math.random() < 0.55 ? 175 + Math.random() * 30 : 300 + Math.random() * 25
        }
      }
      if (look === 'crimson') {
        return {
          x: width * (0.05 + Math.random() * 0.9),
          y: height * (partial ? Math.random() : 0.55 + Math.random() * 0.5),
          r: 16 + Math.random() * 42,
          vy: -(0.07 + Math.random() * 0.2),
          vx: (Math.random() - 0.5) * 0.25,
          life: 0,
          maxLife: 280 + Math.random() * 320,
          drift: Math.random() * Math.PI * 2,
          hue: 350 + Math.random() * 18
        }
      }
      return {
        x: width * (0.05 + Math.random() * 0.9),
        y: height * (partial ? Math.random() : 0.55 + Math.random() * 0.5),
        r: 18 + Math.random() * 48,
        vy: -(0.08 + Math.random() * 0.22),
        vx: (Math.random() - 0.5) * 0.28,
        life: 0,
        maxLife: 260 + Math.random() * 340,
        drift: Math.random() * Math.PI * 2,
        hue: 210
      }
    }

    function resize(): void {
      width = host.clientWidth
      height = host.clientHeight
      if (width < 8 || height < 8) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const density = look === 'embers' ? 9000 : look === 'neon' ? 22000 : 28000
      const count = Math.max(look === 'embers' ? 36 : 22, Math.round((width * height) / density))
      particles = Array.from({ length: count }, () => spawn(true))
    }

    function frame(): void {
      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = look === 'embers' ? 'source-over' : 'lighter'
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i]
        p.life += 1
        if (look === 'embers') {
          p.x += p.vx + Math.sin((p.life + p.hue) * 0.04) * 0.12
          p.y += p.vy
        } else {
          p.x += p.vx + Math.sin(p.life * 0.012 + p.drift) * (look === 'neon' ? 0.35 : 0.22)
          p.y += p.vy
        }
        if (p.life > p.maxLife || p.y + p.r < -20) {
          particles[i] = spawn()
          continue
        }
        const t = p.life / p.maxLife
        if (look === 'embers') {
          const alpha = t < 0.15 ? t / 0.15 : t > 0.65 ? (1 - t) / 0.35 : 1
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3)
          g.addColorStop(0, `hsla(${p.hue}, 95%, 72%, ${0.85 * alpha})`)
          g.addColorStop(0.45, `hsla(${p.hue}, 90%, 55%, ${0.35 * alpha})`)
          g.addColorStop(1, `hsla(${p.hue}, 80%, 40%, 0)`)
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2)
          ctx.fill()
          continue
        }
        const peak = look === 'neon' ? 0.2 : 0.14
        const alpha = (t < 0.2 ? t / 0.2 : t > 0.55 ? (1 - t) / 0.45 : 1) * peak
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
        if (look === 'neon') {
          g.addColorStop(0, `hsla(${p.hue}, 95%, 70%, ${alpha})`)
          g.addColorStop(0.45, `hsla(${p.hue}, 90%, 55%, ${alpha * 0.45})`)
          g.addColorStop(1, `hsla(${p.hue}, 80%, 40%, 0)`)
        } else if (look === 'crimson') {
          g.addColorStop(0, `hsla(${p.hue}, 70%, 42%, ${alpha})`)
          g.addColorStop(0.4, `hsla(${p.hue}, 65%, 28%, ${alpha * 0.5})`)
          g.addColorStop(1, 'hsla(350, 40%, 10%, 0)')
        } else {
          g.addColorStop(0, `rgba(150, 155, 165, ${alpha})`)
          g.addColorStop(0.4, `rgba(90, 95, 110, ${alpha * 0.55})`)
          g.addColorStop(1, 'rgba(40, 45, 55, 0)')
        }
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.ellipse(p.x, p.y, p.r * 1.35, p.r * 0.85, Math.sin(p.drift) * 0.4, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
      raf = window.requestAnimationFrame(frame)
    }

    const ro = new ResizeObserver(() => resize())
    ro.observe(host)
    resize()
    raf = window.requestAnimationFrame(frame)
    return () => {
      ro.disconnect()
      window.cancelAnimationFrame(raf)
    }
  }, [look])

  return <canvas ref={ref} className="opening-legend-particles" aria-hidden="true" />
}
