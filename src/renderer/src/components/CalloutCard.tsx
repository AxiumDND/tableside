import type { ReactNode } from 'react'

const VARIANTS: Record<string, { label: string; bar: string; box: string; labelClass: string; titleClass: string }> = {
  tip: {
    label: 'Tip',
    bar: 'bg-amber',
    box: 'border-amber/35 bg-[#171b22]',
    labelClass: 'text-amber',
    titleClass: 'text-amber'
  },
  warning: {
    label: 'Warning',
    bar: 'bg-blood',
    box: 'border-blood/40 bg-[#1a1416]',
    labelClass: 'text-blood',
    titleClass: 'text-blood'
  },
  danger: {
    label: 'Danger',
    bar: 'bg-blood',
    box: 'border-blood/50 bg-[#1c1012]',
    labelClass: 'text-blood',
    titleClass: 'text-blood'
  },
  example: {
    label: 'Close',
    bar: 'bg-parchment',
    box: 'border-parchment/25 bg-[#161a20]',
    labelClass: 'text-parchment',
    titleClass: 'text-parchment'
  },
  abstract: {
    label: 'Summary',
    bar: 'bg-muted',
    box: 'border-line bg-[#151920]',
    labelClass: 'text-muted',
    titleClass: 'text-parchment'
  },
  note: {
    label: 'Note',
    bar: 'bg-muted',
    box: 'border-line bg-[#151920]',
    labelClass: 'text-muted',
    titleClass: 'text-parchment'
  },
  success: {
    label: 'Done',
    bar: 'bg-moss',
    box: 'border-moss/35 bg-[#10140f]',
    labelClass: 'text-moss',
    titleClass: 'text-moss'
  },
  info: {
    label: 'Info',
    bar: 'bg-amber-dim',
    box: 'border-amber-dim/40 bg-[#171b22]',
    labelClass: 'text-amber-dim',
    titleClass: 'text-amber'
  }
}

const FALLBACK = {
  label: 'Note',
  bar: 'bg-muted',
  box: 'border-line bg-[#151920]',
  labelClass: 'text-muted',
  titleClass: 'text-parchment'
}

export default function CalloutCard({
  type,
  title,
  children
}: {
  type: string
  title?: string
  children: ReactNode
}) {
  const variant = VARIANTS[type] ?? { ...FALLBACK, label: type.replace(/[-_]/g, ' ') }

  return (
    <section className="callout-card my-4">
      <div className={`relative rounded-md border px-4 pb-4 pt-5 ${variant.box}`}>
        <div className={`pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-md ${variant.bar}`} />
        <div className="absolute -top-3 left-3 bg-panel px-2">
          <span className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${variant.labelClass}`}>
            {variant.label}
          </span>
        </div>
        <div className="callout-card-body pl-2">
          {title ? (
            <h3 className={`!mt-0 font-display text-[1.05rem] ${variant.titleClass} ${children ? '!mb-2' : '!mb-0'}`}>
              {title}
            </h3>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  )
}
