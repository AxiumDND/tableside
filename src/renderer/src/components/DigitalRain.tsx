import { useEffect, useRef } from 'react'

const GLYPHS = '01ABCDEF01#$%*+=<>|'

export default function DigitalRain() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const host = canvas?.parentElement
    if (!canvas || !host) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 18
    const trail = 8
    let width = 0
    let height = 0
    let raf = 0
    let drops: { y: number; speed: number; glyphs: string[] }[] = []

    function glyph(): string {
      return GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? '0'
    }

    function resize(): void {
      width = host.clientWidth
      height = host.clientHeight
      if (width < 8 || height < 8) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const cols = Math.max(4, Math.floor(width / size))
      drops = Array.from({ length: cols }, () => ({
        y: Math.random() * (height / size),
        speed: 0.08 + Math.random() * 0.12,
        glyphs: Array.from({ length: trail }, glyph)
      }))
    }

    function tick(): void {
      if (width < 8 || height < 8) {
        raf = requestAnimationFrame(tick)
        return
      }
      ctx.clearRect(0, 0, width, height)
      ctx.font = `600 ${size}px Consolas, "Lucida Console", monospace`
      ctx.textBaseline = 'top'
      for (let i = 0; i < drops.length; i += 2) {
        const drop = drops[i]
        if (!drop) continue
        drop.glyphs.pop()
        drop.glyphs.unshift(glyph())
        for (let t = 0; t < trail; t += 1) {
          const yy = (drop.y - t) * size
          if (yy < -size || yy > height) continue
          const alpha = t === 0 ? 0.28 : Math.max(0.04, 0.16 - t * 0.018)
          ctx.fillStyle = t === 0 ? `rgba(180, 255, 200, ${alpha})` : `rgba(0, 220, 70, ${alpha})`
          ctx.fillText(drop.glyphs[t] ?? '0', i * size, yy)
        }
        drop.y += drop.speed
        if (drop.y * size > height + trail * size) {
          drop.y = -Math.random() * 20
          drop.speed = 0.08 + Math.random() * 0.12
        }
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

  return (
    <canvas ref={ref} className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-50" aria-hidden />
  )
}
