import { useEffect, useRef, useState } from 'react'

export default function BlockMarkdownEditor({
  title = '',
  body,
  kindLabel,
  disabled,
  titleOnly = false,
  onChange
}: {
  title?: string
  body: string
  kindLabel?: string
  disabled?: boolean
  /** When true, only the optional title is editable (e.g. Links blocks). */
  titleOnly?: boolean
  onChange: (next: { title: string; body: string }) => void
}) {
  const [titleValue, setTitleValue] = useState(title)
  const [bodyValue, setBodyValue] = useState(body)
  const titleRef = useRef(titleValue)
  const bodyRef = useRef(bodyValue)
  const titlePropRef = useRef(title)
  const bodyPropRef = useRef(body)
  const onChangeRef = useRef(onChange)
  titleRef.current = titleValue
  bodyRef.current = bodyValue
  titlePropRef.current = title
  bodyPropRef.current = body
  onChangeRef.current = onChange

  useEffect(() => {
    setTitleValue(title)
    setBodyValue(body)
  }, [title, body])

  function flush(): void {
    if (titleRef.current === titlePropRef.current && bodyRef.current === bodyPropRef.current) return
    onChangeRef.current({ title: titleRef.current, body: bodyRef.current })
  }

  useEffect(() => {
    return () => {
      flush()
    }
  }, [])

  return (
    <div className="space-y-3 pl-2">
      <p className="text-[11px] text-muted">
        {kindLabel ? (
          <>
            Editing <span className="text-parchment">{kindLabel}</span> content only — block markers stay locked.
          </>
        ) : (
          <>Editing block content only — block markers stay locked.</>
        )}{' '}
        Use // lines for notes that stay in the editor only.
      </p>
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-muted">Title</span>
        <input
          value={titleValue}
          disabled={disabled}
          onChange={(event) => setTitleValue(event.target.value)}
          onBlur={() => flush()}
          placeholder="Optional"
          className="mt-0.5 w-full rounded border border-line bg-ink px-2 py-1 text-sm text-parchment outline-none focus:border-amber disabled:opacity-50"
          spellCheck
        />
      </label>
      {titleOnly ? null : (
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-muted">Body</span>
          <textarea
            value={bodyValue}
            disabled={disabled}
            rows={14}
            onChange={(event) => setBodyValue(event.target.value)}
            onBlur={() => flush()}
            className="mt-0.5 w-full resize-y rounded border border-line bg-ink px-2 py-1.5 font-mono text-[12px] leading-relaxed text-parchment outline-none focus:border-amber disabled:opacity-50"
            spellCheck
          />
        </label>
      )}
    </div>
  )
}
