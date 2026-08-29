import type { ReactNode } from 'react'

function PartyMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
      />
    </svg>
  )
}

export default function PartyCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="party-card my-5">
      <div className="relative rounded-md border border-ink/15 bg-panel-2 px-4 pb-4 pt-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-md bg-ink/40" />
        <div className="absolute -top-3 left-3 flex items-center gap-1.5 bg-panel px-2">
          <span className="text-ink/70">
            <PartyMark />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/70">Party</span>
          {title ? (
            <span className="max-w-[18rem] truncate font-display text-[13px] font-normal text-ink">{title}</span>
          ) : null}
        </div>
        <div className="party-card-body space-y-3 pl-2">{children}</div>
      </div>
    </section>
  )
}
