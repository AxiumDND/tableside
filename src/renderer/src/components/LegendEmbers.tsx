import { useEffect, useRef } from 'react'

interface Ember {
  x: number
  y: number
  r: number
  vy: number
  vx: number
  life: number
  maxLife: number
  hue: number
}

export default function LegendEmbers() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const host = canvas?.parentElement
    if (!canvas || !host) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let raf = 0
    let embers: Ember[] = []

    function spawn(partial?: boolean): Ember {
      return {
        x: width * (0.15 + Math.random() * 0.7),
        y: height * (partial ? Math.random() : 0.72 + Math.random() * 0.28),
        r: 0.6 + Math.random() * 1.8,
        vy: -(0.18 + Math.random() * 0.55),
        vx: (Math.random() - 0.5) * 0.35,
        life: 0,
        maxLife: 180 + Math.random() * 220,
        hue: 28 + Math.random() * 28
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
      const count = Math.max(36, Math.round((width * height) / 9000))
      embers = Array.from({ length: count }, () => spawn(true))
    }

    function frame(): void {
      ctx.clearRect(0, 0, width, height)
      for (let i = 0; i < embers.length; i += 1) {
        const e = embers[i]
        e.life += 1
        e.x += e.vx + Math.sin((e.life + e.hue) * 0.04) * 0.12
        e.y += e.vy
        if (e.life > e.maxLife || e.y < -8) {
          embers[i] = spawn()
          continue
        }
        const t = e.life / e.maxLife
        const alpha = t < 0.15 ? t / 0.15 : t > 0.65 ? (1 - t) / 0.35 : 1
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 3)
        g.addColorStop(0, `hsla(${e.hue}, 95%, 72%, ${0.85 * alpha})`)
        g.addColorStop(0.45, `hsla(${e.hue}, 90%, 55%, ${0.35 * alpha})`)
        g.addColorStop(1, `hsla(${e.hue}, 80%, 40%, 0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(e.x, e.y, e.r * 3, 0, Math.PI * 2)
        ctx.fill()
      }
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

  return <canvas ref={ref} className="opening-legend-embers" aria-hidden="true" />
}
