import { useEffect, useMemo, useState } from 'react'
import type { NameStyle } from '../../../shared/npcNames'
import {
  listHasStyleSplits,
  nameListById,
  npcNameCatalog,
  pickNpcNames
} from '../../../shared/npcNames'

const ROLL_COUNT = 5

export default function NpcNamesPanel({
  system,
  canCreate,
  onCreateNpc
}: {
  system?: string | null
  canCreate: boolean
  onCreateNpc: (name: string, species: string) => void | Promise<void>
}) {
  const catalog = useMemo(() => npcNameCatalog(system), [system])
  const [listId, setListId] = useState(catalog.lists[0]?.id ?? '')
  const [style, setStyle] = useState<NameStyle>('any')
  const [names, setNames] = useState<string[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [creating, setCreating] = useState<string | null>(null)

  const list = nameListById(catalog, listId)
  const showStyle = listHasStyleSplits(list)

  useEffect(() => {
    setListId(catalog.lists[0]?.id ?? '')
    setStyle('any')
  }, [catalog])

  useEffect(() => {
    setNames(pickNpcNames(list, ROLL_COUNT, showStyle ? style : 'any'))
    setCopied(null)
  }, [list, showStyle, style])

  function rollAgain(): void {
    setNames(pickNpcNames(list, ROLL_COUNT, showStyle ? style : 'any'))
    setCopied(null)
  }

  async function copyName(name: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(name)
      setCopied(name)
    } catch {
      setCopied(null)
    }
  }

  async function createNpc(name: string): Promise<void> {
    if (!canCreate) return
    setCreating(name)
    try {
      await onCreateNpc(name, list.label)
    } finally {
      setCreating(null)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 border-b border-line px-3 py-2">
        <label className="block text-[11px] uppercase tracking-wider text-muted">
          {catalog.pickerLabel}
          <select
            value={list.id}
            onChange={(event) => setListId(event.target.value)}
            className="mt-1 w-full rounded border border-line bg-ink px-2 py-1.5 text-sm text-parchment outline-none focus:border-amber"
          >
            {catalog.lists.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
        {showStyle ? (
          <label className="block text-[11px] uppercase tracking-wider text-muted">
            Style
            <select
              value={style}
              onChange={(event) => setStyle(event.target.value as NameStyle)}
              className="mt-1 w-full rounded border border-line bg-ink px-2 py-1.5 text-sm text-parchment outline-none focus:border-amber"
            >
              <option value="any">Any</option>
              <option value="feminine">Feminine</option>
              <option value="masculine">Masculine</option>
            </select>
          </label>
        ) : null}
        <button
          type="button"
          onClick={rollAgain}
          className="rounded border border-line px-3 py-1 text-sm hover:border-amber"
        >
          Roll again
        </button>
      </div>
      <ul className="min-h-0 flex-1 overflow-auto p-3">
        {names.map((name, index) => (
          <li
            key={`${name}-${index}`}
            className="mb-2 rounded border border-line bg-panel-2 px-2 py-2 last:mb-0"
          >
            <div className="font-display text-base text-amber">{name}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyName(name)}
                className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber"
              >
                {copied === name ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                disabled={!canCreate || creating !== null}
                title={canCreate ? 'Create an NPCs/ sheet with this name' : 'Open a campaign first'}
                onClick={() => void createNpc(name)}
                className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber disabled:opacity-50"
              >
                {creating === name ? 'Creating…' : 'New NPC…'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
