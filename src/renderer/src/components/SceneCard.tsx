import type { ReactNode } from 'react'

function StageMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 5h16v2H4V5zm1 4h14l1 11H4L5 9zm3 2v2h2v-2H8zm6 0v2h2v-2h-2zM9 15v2h6v-2H9z"
      />
    </svg>
  )
}

export default function SceneCard({
  title,
  art,
  children
}: {
  title?: string
  art?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="scene-card my-5">
      <div className="relative rounded-md border border-amber/30 bg-panel-2 px-4 pb-4 pt-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-md bg-amber-dim" />
        <div className="absolute -top-3 left-3 flex items-center gap-1.5 bg-panel px-2">
          <span className="text-amber-dim">
            <StageMark />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-dim">Scene</span>
          {title ? (
            <span className="max-w-[18rem] truncate font-display text-[13px] font-normal text-amber">{title}</span>
          ) : null}
        </div>
        <div className={`scene-card-body pl-2 ${art ? 'flex items-start gap-4' : ''}`}>
          <div className={art ? 'min-w-0 flex-1 space-y-3' : 'space-y-3'}>{children}</div>
          {art ? <div className="w-40 shrink-0">{art}</div> : null}
        </div>
      </div>
    </section>
  )
}
