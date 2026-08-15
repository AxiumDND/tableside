import type { MediaItem } from '../../../shared/types'

export default function MediaLibrary({
  items,
  currentTitle,
  disabled,
  onShow,
  onClear
}: {
  items: MediaItem[]
  currentTitle: string
  disabled?: boolean
  onShow: (item: MediaItem) => void
  onClear: () => void
}) {
  return (
    <section className="border-t border-line bg-panel">
      <header className="flex items-center justify-between px-3 py-2">
        <h2 className="font-display text-lg text-amber">Media</h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted">
            {currentTitle ? `Showing: ${currentTitle}` : 'Player screen idle'}
          </span>
          <button
            type="button"
            disabled={disabled || !currentTitle}
            onClick={onClear}
            className="rounded border border-line px-2 py-0.5 text-parchment hover:border-amber disabled:text-muted"
          >
            Clear
          </button>
        </div>
      </header>
      <div className="flex gap-2 overflow-x-auto px-3 pb-3">
        {items.length === 0 ? (
          <p className="py-6 text-sm text-muted">
            Drop maps and art into the campaign <code className="text-amber">media/</code> folder,
            then reopen the campaign.
          </p>
        ) : (
          items.map((item) => (
            <button
              key={item.relativePath}
              type="button"
              disabled={disabled}
              onClick={() => onShow(item)}
              className={`w-36 shrink-0 overflow-hidden rounded border text-left ${
                currentTitle === item.name ? 'border-amber' : 'border-line hover:border-amber-dim'
              }`}
            >
              <div className="flex h-20 items-center justify-center bg-ink">
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="truncate px-2 py-1 text-[11px]">{item.name}</div>
            </button>
          ))
        )}
      </div>
    </section>
  )
}
