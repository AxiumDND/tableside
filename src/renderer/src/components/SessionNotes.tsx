import { useEffect, useMemo, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { SessionFile } from '../../../shared/types'

interface Heading {
  id: string
  text: string
  level: number
}

function headingsFrom(markdown: string): Heading[] {
  return markdown
    .split('\n')
    .map((line) => {
      const match = /^(#{1,3})\s+(.+)$/.exec(line.trim())
      if (!match) return null
      const text = match[2].replace(/[#*_`]/g, '').trim()
      return {
        id: text.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        text,
        level: match[1].length
      }
    })
    .filter((h): h is Heading => Boolean(h))
}

export default function SessionNotes({
  sessions,
  disabled
}: {
  sessions: SessionFile[]
  disabled?: boolean
}) {
  const [active, setActive] = useState<string>(sessions[0]?.relativePath ?? '')
  const [markdown, setMarkdown] = useState('')
  const [editing, setEditing] = useState(false)
  const headings = useMemo(() => headingsFrom(markdown), [markdown])

  useEffect(() => {
    if (!sessions.find((s) => s.relativePath === active)) {
      setActive(sessions[0]?.relativePath ?? '')
    }
  }, [sessions, active])

  useEffect(() => {
    if (!active) {
      setMarkdown('')
      return
    }
    let alive = true
    window.tabledm.readSession(active).then((text) => {
      if (alive) setMarkdown(text)
    })
    return () => {
      alive = false
    }
  }, [active])

  async function save(): Promise<void> {
    if (!active) return
    await window.tabledm.saveSession(active, markdown)
    setEditing(false)
  }

  function jump(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="flex min-h-0 flex-col border-r border-line bg-panel">
      <header className="border-b border-line px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg text-amber">Session</h2>
          <button
            type="button"
            disabled={disabled || !active}
            onClick={() => (editing ? save() : setEditing(true))}
            className="text-xs text-amber hover:underline disabled:text-muted"
          >
            {editing ? 'Save' : 'Edit'}
          </button>
        </div>
        <select
          value={active}
          disabled={disabled || sessions.length === 0}
          onChange={(e) => setActive(e.target.value)}
          className="mt-2 w-full rounded border border-line bg-ink px-2 py-1 text-sm"
        >
          {sessions.length === 0 ? <option value="">No session notes</option> : null}
          {sessions.map((s) => (
            <option key={s.relativePath} value={s.relativePath}>
              {s.name}
            </option>
          ))}
        </select>
      </header>

      {headings.length > 0 && !editing ? (
        <nav className="max-h-28 overflow-auto border-b border-line px-3 py-2 text-xs">
          {headings.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => jump(h.id)}
              className="block w-full truncate text-left text-muted hover:text-amber"
              style={{ paddingLeft: (h.level - 1) * 10 }}
            >
              {h.text}
            </button>
          ))}
        </nav>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {editing ? (
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="h-full min-h-[20rem] w-full resize-none rounded border border-line bg-ink p-2 text-sm leading-relaxed outline-none"
          />
        ) : (
          <div className="markdown-body text-sm">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => {
                  const text = String(children)
                  return <h1 id={text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>{children}</h1>
                },
                h2: ({ children }) => {
                  const text = String(children)
                  return <h2 id={text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>{children}</h2>
                },
                h3: ({ children }) => {
                  const text = String(children)
                  return <h3 id={text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>{children}</h3>
                }
              }}
            >
              {markdown || '_Open a campaign folder with a file in `sessions/`._'}
            </Markdown>
          </div>
        )}
      </div>
    </section>
  )
}
