function iconButtonClass(active: boolean): string {
  return `rounded border p-1.5 ${
    active ? 'border-amber text-amber' : 'border-line text-muted hover:border-amber hover:text-amber'
  }`
}

function PanelGlyph({ side }: { side: 'left' | 'right' }) {
  const filled =
    side === 'left'
      ? 'M5.5 5.75h5.25v12.5H5.5A.75.75 0 0 1 4.75 18V6a.75.75 0 0 1 .75-.75z'
      : 'M13.25 5.75H18.5A.75.75 0 0 1 19.25 6v12a.75.75 0 0 1-.75.75h-5.25V5.75z'
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        d="M5.5 4.5h13a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18V6a1.5 1.5 0 0 1 1.5-1.5z"
      />
      <path fill="currentColor" d={filled} />
    </svg>
  )
}

export default function PanelToggle({
  side,
  open,
  onToggle
}: {
  side: 'left' | 'right'
  open: boolean
  onToggle: () => void
}) {
  const label =
    side === 'left'
      ? open
        ? 'Hide sidebar'
        : 'Show sidebar'
      : open
        ? 'Hide right panel'
        : 'Show right panel'
  return (
    <button
      type="button"
      onClick={onToggle}
      className={iconButtonClass(open)}
      title={label}
      aria-label={label}
      aria-pressed={open}
    >
      <PanelGlyph side={side} />
    </button>
  )
}
