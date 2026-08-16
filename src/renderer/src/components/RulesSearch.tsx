import { useEffect, useMemo, useState } from 'react'
import {
  monsterToStatBlock,
  searchSrd,
  setExtraRecords,
  SRD_ATTRIBUTION,
  SRD_SOURCE_LABEL,
  srdCounts,
  type SrdKind,
  type SrdRecord
} from '../lib/srd'
import { extraSourcesFromRecords, parseWotcFiles } from '../lib/wotcParse'
import { statBlockToParsed } from '../lib/statblock'
import RollableStatBlock from './RollableStatBlock'

const FILTERS: { id: SrdKind | 'all' | string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'source:srd', label: SRD_SOURCE_LABEL },
  { id: 'rule', label: 'Rules' },
  { id: 'condition', label: 'Conditions' },
  { id: 'spell', label: 'Spells' },
  { id: 'monster', label: 'Monsters' },
  { id: 'weapon', label: 'Weapons' }
]

const NAMED_LEAD = /^([A-Z][\w'’ /-]{0,48}\.)(\s+)/

function SpellProse({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
  if (paragraphs.length === 0) return null
  return (
    <div className="space-y-2">
      {paragraphs.map((paragraph, index) => {
        const named = NAMED_LEAD.exec(paragraph)
        return (
          <p key={`${index}-${paragraph.slice(0, 24)}`} className="leading-relaxed whitespace-pre-line text-parchment/90">
            {named ? (
              <>
                <span className="font-semibold text-parchment">{named[1]} </span>
                {paragraph.slice(named[0].length)}
              </>
            ) : (
              paragraph
            )}
          </p>
        )
      })}
    </div>
  )
}

function KindBadge({ record }: { record: SrdRecord }) {
  const colors: Record<SrdKind, string> = {
    spell: 'text-sky-300',
    monster: 'text-blood',
    condition: 'text-amber',
    weapon: 'text-moss',
    rule: 'text-muted',
    book: 'text-amber',
    gear: 'text-moss'
  }
  return (
    <span className="flex shrink-0 items-baseline gap-1.5">
      <span className={`text-[10px] uppercase tracking-wider ${colors[record.kind]}`}>{record.kind}</span>
      {record.sourceLabel ? (
        <span className="text-[10px] uppercase tracking-wider text-muted">{record.sourceLabel}</span>
      ) : null}
    </span>
  )
}

function SourceNote({ record }: { record: SrdRecord }) {
  if (!record.sourceLabel) return null
  if (!record.source || record.source === 'srd') {
    return <p className="text-[10px] text-muted">{record.sourceLabel}</p>
  }
  return <p className="text-[10px] text-muted">From your {record.sourceLabel} file</p>
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
        <SourceNote record={record} />
      </div>
    )
  }

  const itemFields = (
    [
      ['Damage', 'Damage'],
      ['Properties', 'Properties'],
      ['Mastery', 'Mastery'],
      ['Armor Class', 'Armor Class'],
      ['Strength', 'Strength'],
      ['Stealth', 'Stealth'],
      ['Don', 'Don'],
      ['Ability', 'Ability'],
      ['Utilize', 'Utilize'],
      ['Craft', 'Craft'],
      ['Variants', 'Variants'],
      ['Weight', 'Weight'],
      ['Cost', 'Cost'],
      ['Carrying Capacity', 'Carrying Capacity'],
      ['Rarity', 'Rarity'],
      ['Attunement', 'Attunement']
    ] as const
  ).flatMap(([key, label]) => {
    const value = data[key] ?? data[key.toLowerCase()]
    if (typeof value !== 'string' || !value || value.includes('[object')) return []
    return [{ label, value }]
  })

  if (
    record.kind === 'weapon' ||
    record.kind === 'gear' ||
    record.kind === 'book' ||
    (record.kind === 'rule' && record.source && record.source !== 'srd')
  ) {
    return (
      <div className="space-y-2 text-sm">
        <div className="font-display text-xl text-amber">{record.name}</div>
        <div className="text-xs text-muted">{record.summary}</div>
        {itemFields.map((field) => (
          <p key={field.label}>
            <span className="text-muted">{field.label}</span> {field.value}
          </p>
        ))}
        <SpellProse text={String(data.desc ?? '')} />
        <SourceNote record={record} />
      </div>
    )
  }

  if (record.kind === 'spell') {
    return (
      <div className="space-y-2 text-sm">
        <div className="font-display text-xl text-amber">{record.name}</div>
        <div className="text-xs text-muted">{record.summary}</div>
        <p>
          <span className="text-muted">Casting Time</span> {String(data.castingTime || '—')}
        </p>
        <p>
          <span className="text-muted">Range</span> {String(data.range || '—')}
        </p>
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
        <SpellProse text={String(data.desc ?? '')} />
        {data.higherLevel ? (
          <SpellProse
            text={`Using a Higher-Level Spell Slot. ${String(data.higherLevel)}`}
          />
        ) : null}
        <SourceNote record={record} />
      </div>
    )
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="font-display text-xl text-amber">{record.name}</div>
      <div className="text-xs text-muted">{record.summary}</div>
      <SpellProse text={String(data.desc ?? '')} />
      <SourceNote record={record} />
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
  const [kind, setKind] = useState<SrdKind | 'all' | string>('all')
  const [selected, setSelected] = useState<SrdRecord | null>(null)
  const [bestiaryBusy, setBestiaryBusy] = useState(false)
  const [bestiaryStatus, setBestiaryStatus] = useState<'added' | 'exists' | null>(null)
  const [extraSources, setExtraSources] = useState<
    { id: string; label: string; kind: SrdKind; count: number }[]
  >([])
  const [wotcFolder, setWotcFolder] = useState('')

  useEffect(() => {
    setBestiaryStatus(null)
    setBestiaryBusy(false)
  }, [selected?.id])

  useEffect(() => {
    void window.tabledm.loadWotcLibrary().then((library) => {
      const records = parseWotcFiles(library.files)
      setExtraRecords(records)
      setExtraSources(extraSourcesFromRecords(records))
      setWotcFolder(library.folder)
    })
  }, [])

  const results = useMemo(
    () => searchSrd(query, kind).slice(0, 30),
    [query, kind, extraSources]
  )
  const filters = useMemo(
    () => [
      ...FILTERS,
      ...extraSources.map((source) => ({
        id: `source:${source.id}`,
        label: source.label
      }))
    ],
    [extraSources]
  )

  return (
    <section className="flex min-h-0 flex-1 flex-col border-l border-line bg-panel">
      <header className="border-b border-line px-3 py-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-lg text-amber">Lookup</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted">
              {srdCounts.spells} {SRD_SOURCE_LABEL} spells
              {extraSources.length > 0
                ? ` · ${extraSources.map((source) => `${source.count} ${source.label}`).join(' · ')}`
                : ` · ${srdCounts.monsters} monsters`}
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
          {filters.map((f) => (
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
                    <KindBadge record={record} />
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

      <div className="border-t border-line px-3 py-2 text-[10px] leading-snug text-muted">
        {extraSources.length === 0 ? (
          <p className="mb-1">
            Add your own book text in the WOTC folder to unlock extra lookup.{' '}
            <button
              type="button"
              className="text-amber hover:underline"
              onClick={() => void window.tabledm.openWotcFolder()}
              title={wotcFolder || 'Open the WOTC folder'}
            >
              Open WOTC folder
            </button>
          </p>
        ) : (
          <p className="mb-1">
            Extra lookup from your WOTC files.{' '}
            <button
              type="button"
              className="text-amber hover:underline"
              onClick={() => void window.tabledm.openWotcFolder()}
            >
              Open folder
            </button>
          </p>
        )}
        <p>{SRD_ATTRIBUTION}</p>
      </div>
    </section>
  )
}
