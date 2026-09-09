import { useState } from 'react'
import { Code } from './HelpComponents'

export function FolderOpen({
  label,
  path,
  onOpen
}: {
  label: string
  path: string
  onOpen: () => void
}) {
  return (
    <div className="space-y-1.5">
      <p>{label}</p>
      <p className="break-all">
        <Code>{path}</Code>
      </p>
      <button
        type="button"
        onClick={onOpen}
        className="rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
      >
        Open in File Explorer
      </button>
    </div>
  )
}

export function ConvertGuideBlock({
  label,
  path,
  onOpen
}: {
  label: string
  path: string
  onOpen: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function copyToClipboard(): Promise<void> {
    const text = await window.tabledm.readConvertGuide()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-1.5">
      <p>{label}</p>
      <p className="break-all">
        <Code>{path}</Code>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyToClipboard()}
          className="rounded border border-amber/60 bg-amber/10 px-3 py-1.5 text-sm text-amber hover:border-amber"
        >
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
        >
          Open in File Explorer
        </button>
      </div>
    </div>
  )
}
