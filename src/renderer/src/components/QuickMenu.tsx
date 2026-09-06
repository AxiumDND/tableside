import { useEffect, useRef, type ReactNode } from 'react'

/** One-button-high header menu. Only one Quick menu should be open at a time. */
export default function QuickMenu({
  id,
  label,
  openId,
  onOpenId,
  children,
  menuClassName = 'w-72'
}: {
  id: string
  label: string
  openId: string | null
  onOpenId: (id: string | null) => void
  children: ReactNode
  menuClassName?: string
}) {
  const open = openId === id
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) onOpenId(null)
    }
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') onOpenId(null)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onOpenId])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => onOpenId(open ? null : id)}
        className="rounded border border-line px-3 py-1 text-sm hover:border-amber"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {label} <span aria-hidden="true">▾</span>
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={label}
          className={`absolute left-0 z-40 mt-1 max-w-[min(28rem,calc(100vw-2rem))] rounded border border-line bg-panel py-1 shadow-lg ${menuClassName}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}
