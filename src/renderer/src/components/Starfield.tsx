import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  r: number
  base: number
  twinkle: number
  phase: number
}

export default function Starfield() {
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
    let stars: Star[] = []

    function resize(): void {
      width = host.clientWidth
      height = host.clientHeight
      if (width < 8 || height < 8) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.max(48, Math.round((width * height) / 2800))
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() < 0.12 ? 1.25 : Math.random() < 0.45 ? 0.8 : 0.45,
        base: 0.35 + Math.random() * 0.55,
        twinkle: 0.15 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2
      }))
    }

    function tick(now: number): void {
      if (width < 8 || height < 8) {
        raf = requestAnimationFrame(tick)
        return
      }
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, width, height)
      for (const star of stars) {
        const pulse = star.base + Math.sin(now / 900 + star.phase) * star.twinkle
        ctx.fillStyle = `rgba(230, 236, 255, ${Math.max(0.12, Math.min(1, pulse))})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }

    resize()
    const observer = new ResizeObserver(() => resize())
    observer.observe(host)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  return <canvas ref={ref} className="opening-crawl-stars" aria-hidden="true" />
}
