import { useEffect, useRef, useState } from 'react'
import type { RecentCampaign } from '../../../shared/types'
import { switchableRecentCampaigns } from '../../../shared/recentCampaigns'

/**
 * Header / start-screen menu of remembered campaign folders.
 * Excludes the currently open campaign so the list is for switching.
 */
export default function RecentCampaignMenu({
  recentCampaigns,
  currentFolder,
  onOpenRecent,
  label = 'Switch campaign'
}: {
  recentCampaigns: RecentCampaign[]
  currentFolder?: string | null
  onOpenRecent: (folder: string) => void
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const switchable = switchableRecentCampaigns(recentCampaigns, currentFolder)

  useEffect(() => {
    if (!open) return
    function onDoc(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (switchable.length === 0) return null

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded border border-line px-3 py-1 text-sm hover:border-amber"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {label}
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={label}
          className="absolute right-0 z-40 mt-1 w-72 max-w-[min(18rem,calc(100vw-2rem))] rounded border border-line bg-panel py-1 shadow-lg"
        >
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-dim">
            Recent campaigns
          </div>
          <ul className="max-h-64 overflow-auto">
            {switchable.map((item) => (
              <li key={item.folder}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    onOpenRecent(item.folder)
                  }}
                  className="w-full truncate px-3 py-1.5 text-left text-[13px] text-parchment/90 hover:bg-panel-2 hover:text-amber"
                  title={item.folder}
                >
                  <span className="block truncate font-semibold">{item.name}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted">{item.folder}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
