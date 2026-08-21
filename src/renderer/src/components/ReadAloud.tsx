import type { ReactNode } from 'react';

function BookMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 3h10a2 2 0 0 1 2 2v16l-7-3.2L5 21V5a2 2 0 0 1 2-2zm0 2v13.1l5-2.3 5 2.3V5H7z"
      />
    </svg>
  );
}

export default function ReadAloud({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="read-aloud my-5">
      <div className="relative rounded-md border border-amber/40 bg-[#171b22] px-4 pb-4 pt-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-md bg-amber" />
        <span className="read-aloud-dot left-[2px] top-1.5" />
        <span className="read-aloud-dot bottom-1.5 left-[2px]" />
        <div className="absolute -top-3 left-3 flex items-center gap-1.5 bg-panel px-2">
          <span className="text-amber">
            <BookMark />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber">
            Read aloud
          </span>
          {title ? (
            <span className="max-w-[14rem] truncate text-[11px] font-normal italic text-muted">
              {title}
            </span>
          ) : null}
        </div>
        <div className="read-aloud-body pl-2">{children}</div>
      </div>
    </section>
  );
}
