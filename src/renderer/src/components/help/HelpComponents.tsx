import type { ReactNode } from 'react'

export type HelpSection = 'settings' | 'start' | 'screens' | 'files' | 'music' | 'combat' | 'lookup' | 'keys' | 'updates'

export function Section({
  id,
  title,
  open,
  onToggle,
  children
}: {
  id: HelpSection
  title: string
  open: HelpSection | null
  onToggle: (id: HelpSection) => void
  children: ReactNode
}) {
  const active = open === id
  return (
    <div className="border-b border-line/80">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-panel-2"
      >
        <span className={`text-sm font-semibold ${active ? 'text-amber' : 'text-parchment'}`}>{title}</span>
        <span className="text-[10px] text-muted">{active ? '▾' : '▸'}</span>
      </button>
      {active ? <div className="space-y-2.5 px-3 pb-3 text-[13px] leading-relaxed text-parchment/85">{children}</div> : null}
    </div>
  )
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-panel-2 px-1 py-0.5 font-mono text-[12px] text-amber-dim">{children}</code>
  )
}

export function Action({ children }: { children: ReactNode }) {
  return <span className="text-amber">{children}</span>
}

export function Sub({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-dim">{children}</p>
}

export function Ol({ items }: { items: ReactNode[] }) {
  return (
    <ol className="list-decimal space-y-1.5 pl-4">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  )
}

export function Ul({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-4">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}
