import type { ReactNode } from 'react'

function LockMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 10V7a4 4 0 1 1 8 0v3h1.5A1.5 1.5 0 0 1 19 11.5v8A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5v-8A1.5 1.5 0 0 1 6.5 10H8zm2 0h4V7a2 2 0 1 0-4 0v3z"
      />
    </svg>
  )
}

export default function GmOnly({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="gm-only my-5">
      <div className="relative rounded-md border border-moss/35 bg-[#10140f] px-4 pb-4 pt-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-md bg-moss" />
        <div className="absolute -top-3 left-3 flex items-center gap-1.5 bg-panel px-2">
          <span className="text-moss">
            <LockMark />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-moss">GM only</span>
        </div>
        <div className="gm-only-body pl-2">
          {title ? <h3 className="!mt-0 !mb-2 font-display text-[1.05rem] text-moss">{title}</h3> : null}
          {children}
        </div>
      </div>
    </section>
  )
}
