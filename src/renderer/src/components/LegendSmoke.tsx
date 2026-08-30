import { useEffect, useRef } from 'react'

interface Wisp {
  x: number
  y: number
  r: number
  vy: number
  vx: number
  life: number
  maxLife: number
  drift: number
}

/** Slow grey mist for the campfire chronicle — Barovia, not campfire sparks. */
export default function LegendSmoke() {
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
    let wisps: Wisp[] = []

    function spawn(partial?: boolean): Wisp {
      return {
        x: width * (0.05 + Math.random() * 0.9),
        y: height * (partial ? Math.random() : 0.55 + Math.random() * 0.5),
        r: 18 + Math.random() * 48,
        vy: -(0.08 + Math.random() * 0.22),
        vx: (Math.random() - 0.5) * 0.28,
        life: 0,
        maxLife: 260 + Math.random() * 340,
        drift: Math.random() * Math.PI * 2
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
      const count = Math.max(22, Math.round((width * height) / 28000))
      wisps = Array.from({ length: count }, () => spawn(true))
    }

    function frame(): void {
      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < wisps.length; i += 1) {
        const w = wisps[i]
        w.life += 1
        w.x += w.vx + Math.sin(w.life * 0.012 + w.drift) * 0.22
        w.y += w.vy
        if (w.life > w.maxLife || w.y + w.r < -20) {
          wisps[i] = spawn()
          continue
        }
        const t = w.life / w.maxLife
        const alpha = (t < 0.2 ? t / 0.2 : t > 0.55 ? (1 - t) / 0.45 : 1) * 0.14
        const g = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.r)
        g.addColorStop(0, `rgba(150, 155, 165, ${alpha})`)
        g.addColorStop(0.4, `rgba(90, 95, 110, ${alpha * 0.55})`)
        g.addColorStop(1, 'rgba(40, 45, 55, 0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.ellipse(w.x, w.y, w.r * 1.35, w.r * 0.85, Math.sin(w.drift) * 0.4, 0, Math.PI * 2)
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
  }, [])

  return <canvas ref={ref} className="opening-legend-smoke" aria-hidden="true" />
}
