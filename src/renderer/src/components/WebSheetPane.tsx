import { useEffect, useRef } from 'react'

function boundsOf(el: HTMLElement): { x: number; y: number; width: number; height: number } {
  const rect = el.getBoundingClientRect()
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  }
}

/** Live web sheet clipped to the DM note pane (Chromium BrowserView). */
export default function WebSheetPane({ src }: { src: string }) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let cancelled = false

    const place = (): void => {
      if (cancelled) return
      void window.tabledm.setWebSheetBounds(boundsOf(host))
    }

    void window.tabledm.embedWebSheet(src, boundsOf(host))
    const observer = new ResizeObserver(place)
    observer.observe(host)
    window.addEventListener('resize', place)
    return () => {
      cancelled = true
      observer.disconnect()
      window.removeEventListener('resize', place)
      void window.tabledm.hideWebSheet()
    }
  }, [src])

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-ink">
      <div
        ref={hostRef}
        className="absolute inset-0 min-h-[240px] bg-ink"
        aria-label="Web sheet"
      />
    </div>
  )
}
