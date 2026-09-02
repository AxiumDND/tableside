import type { MutableRefObject } from 'react'

export function SessionNotesEditor({
  editorRef,
  markdown,
  saveError,
  onChange
}: {
  editorRef: MutableRefObject<HTMLTextAreaElement | null>
  markdown: string
  saveError: string
  onChange: (next: string) => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col p-3 pt-2">
      <p className="mb-2 text-[11px] text-muted">
        Markdown · Ctrl+S saves · Esc cancels · right-click a misspelled word
      </p>
      {saveError ? <p className="mb-2 text-[11px] text-blood">{saveError}</p> : null}
      <textarea
        ref={editorRef}
        value={markdown}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return
          event.preventDefault()
          const el = event.currentTarget
          const start = el.selectionStart
          const end = el.selectionEnd
          const next = `${markdown.slice(0, start)}  ${markdown.slice(end)}`
          onChange(next)
          requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = start + 2
          })
        }}
        spellCheck
        className="min-h-0 flex-1 resize-none rounded border border-line bg-ink p-3 font-mono text-[13px] leading-relaxed text-parchment outline-none focus:border-amber"
      />
    </div>
  )
}
