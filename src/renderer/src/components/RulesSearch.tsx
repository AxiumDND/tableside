import { useEffect, useMemo, useState } from 'react'
import { monsterToStatBlock, searchSrd, SRD_ATTRIBUTION, srdCounts, type SrdKind, type SrdRecord } from '../lib/srd'
import { statBlockToParsed } from '../lib/statblock'
import RollableStatBlock from './RollableStatBlock'

const FILTERS: { id: SrdKind | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'rule', label: 'Rules' },
  { id: 'condition', label: 'Conditions' },
  { id: 'spell', label: 'Spells' },
  { id: 'monster', label: 'Monsters' },
  { id: 'weapon', label: 'Weapons' }
]

function KindBadge({ kind }: { kind: SrdKind }) {
  const colors: Record<SrdKind, string> = {
    spell: 'text-sky-300',
    monster: 'text-blood',
    condition: 'text-amber',
    weapon: 'text-moss',
    rule: 'text-muted'
  }
  return <span className={`text-[10px] uppercase tracking-wider ${colors[kind]}`}>{kind}</span>
}

function Detail({
  record,
  onAddMonster,
  onAddToBestiary,
  canAddToBestiary,
  bestiaryBusy,
  bestiaryStatus
}: {
  record: SrdRecord
  onAddMonster?: (record: SrdRecord) => void
  onAddToBestiary?: (record: SrdRecord) => void
  canAddToBestiary?: boolean
  bestiaryBusy?: boolean
  bestiaryStatus?: 'added' | 'exists' | null
}) {
  const data = record.data
  if (record.kind === 'monster') {
    return (
      <div>
        <RollableStatBlock block={statBlockToParsed(monsterToStatBlock(data))} hideToolbar />
        <div className="mt-3 flex flex-col gap-2">
          {onAddMonster ? (
            <button
              type="button"
              className="w-full rounded bg-amber px-3 py-1.5 text-sm font-semibold text-ink"
              onClick={() => onAddMonster(record)}
            >
              Add to combat
            </button>
          ) : null}
          {onAddToBestiary ? (
            <button
              type="button"
              className="w-full rounded border border-line bg-panel-2 px-3 py-1.5 text-sm font-semibold text-parchment disabled:text-muted"
              disabled={!canAddToBestiary || bestiaryBusy}
              title={canAddToBestiary ? 'Save a Bestiary sheet in this campaign' : 'Open a campaign first'}
              onClick={() => onAddToBestiary(record)}
            >
              {bestiaryBusy
                ? 'Adding…'
                : bestiaryStatus === 'exists'
                  ? 'Already in Bestiary'
                  : bestiaryStatus === 'added'
                    ? 'Added to Bestiary'
                    : 'Add to Bestiary'}
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  if (record.kind === 'spell') {
    return (
      <div className="space-y-2 text-sm">
        <div className="font-display text-xl text-amber">{record.name}</div>
        <div className="text-xs text-muted">{record.summary}</div>
        <p>
          <span className="text-muted">Components</span> {String(data.components || '—')}
        </p>
        <p>
          <span className="text-muted">Duration</span> {String(data.duration || '—')}
          {data.concentration ? ' (Concentration)' : ''}
          {data.ritual ? ' · Ritual' : ''}
        </p>
        {Array.isArray(data.classes) && data.classes.length > 0 ? (
          <p>
            <span className="text-muted">Lists</span> {(data.classes as string[]).join(', ')}
          </p>
        ) : null}
        <p className="leading-relaxed text-parchment/90">{String(data.desc ?? '')}</p>
        {data.higherLevel ? (
          <p className="leading-relaxed">
            <span className="font-semibold">Using a Higher-Level Spell Slot. </span>
            {String(data.higherLevel)}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="font-display text-xl text-amber">{record.name}</div>
      <div className="text-xs text-muted">{record.summary}</div>
      <p className="leading-relaxed text-parchment/90">{String(data.desc ?? '')}</p>
    </div>
  )
}

export default function RulesSearch({
  onAddMonster,
  onAddToBestiary,
  canAddToBestiary,
  onClose
}: {
  onAddMonster?: (record: SrdRecord) => void
  onAddToBestiary?: (record: SrdRecord) => Promise<'added' | 'exists' | void> | 'added' | 'exists' | void
  canAddToBestiary?: boolean
  onClose?: () => void
}) {
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<SrdKind | 'all'>('all')
  const [selected, setSelected] = useState<SrdRecord | null>(null)
  const [bestiaryBusy, setBestiaryBusy] = useState(false)
  const [bestiaryStatus, setBestiaryStatus] = useState<'added' | 'exists' | null>(null)

  useEffect(() => {
    setBestiaryStatus(null)
    setBestiaryBusy(false)
  }, [selected?.id])

  const results = useMemo(() => searchSrd(query, kind).slice(0, 30), [query, kind])

  return (
    <section className="flex min-h-0 flex-1 flex-col border-l border-line bg-panel">
      <header className="border-b border-line px-3 py-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-lg text-amber">Lookup</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted">
              {srdCounts.spells} spells · {srdCounts.monsters} monsters
            </span>
            {onClose ? (
              <button type="button" onClick={onClose} className="text-xs text-muted hover:text-amber">
                Hide
              </button>
            ) : null}
          </div>
        </div>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Poisoned, fireball, cover…"
          className="mt-2 w-full rounded border border-line bg-ink px-2 py-1.5 text-sm outline-none focus:border-amber"
        />
        <div className="mt-2 flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setKind(f.id)}
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                kind === f.id ? 'bg-amber text-ink' : 'bg-panel-2 text-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        {selected ? (
          <div className="p-3">
            <button
              type="button"
              className="mb-2 text-xs text-amber hover:underline"
              onClick={() => setSelected(null)}
            >
              ← Results
            </button>
            <Detail
              record={selected}
              onAddMonster={onAddMonster}
              onAddToBestiary={
                onAddToBestiary
                  ? (record) => {
                      setBestiaryBusy(true)
                      void Promise.resolve(onAddToBestiary(record))
                        .then((status) => {
                          if (status === 'added' || status === 'exists') setBestiaryStatus(status)
                        })
                        .finally(() => setBestiaryBusy(false))
                    }
                  : undefined
              }
              canAddToBestiary={canAddToBestiary}
              bestiaryBusy={bestiaryBusy}
              bestiaryStatus={bestiaryStatus}
            />
          </div>
        ) : (
          <ul>
            {results.map((record) => (
              <li key={record.id}>
                <button
                  type="button"
                  onClick={() => setSelected(record)}
                  className="flex w-full flex-col items-start border-b border-line/70 px-3 py-2 text-left hover:bg-panel-2"
                >
                  <div className="flex w-full items-baseline justify-between gap-2">
                    <span className="font-medium">{record.name}</span>
                    <KindBadge kind={record.kind} />
                  </div>
                  <span className="text-[11px] text-muted">{record.summary}</span>
                </button>
              </li>
            ))}
            {results.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted">No matches</li>
            ) : null}
          </ul>
        )}
      </div>

      <p className="border-t border-line px-3 py-2 text-[10px] leading-snug text-muted">{SRD_ATTRIBUTION}</p>
    </section>
  )
}
