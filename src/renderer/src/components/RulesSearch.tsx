import { useEffect, useMemo, useState } from 'react'
import {
  monsterToStatBlock,
  searchSrd,
  setExtraRecords,
  srdCounts,
  type SrdKind,
  type SrdRecord
} from '../lib/srd'
import { activateSystemLookup, packLookupRecords } from '../lib/systemLookup'
import { extraSourcesFromRecords, parseBookFiles } from '../lib/bookParse'
import { libraryFolderFor } from '../lib/lookupNotes'
import { srdItemUrl, srdPortraitUrl, srdSchoolUrl } from '../lib/images'
import { LIBRARY_FOLDER_NAMES } from '../../../shared/campaignLayout'
import { getSystemPack } from '../../../shared/systemPack'
import { statBlockToParsed } from '../lib/statblock'
import RollableStatBlock from './RollableStatBlock'
import { useHideBundledArtwork } from '../hooks/useBundledArtwork'

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
  if (!record.source || record.source === 'srd' || record.source === 'pf2e' || record.source === 'v5' || record.source === 'axium') {
    return <p className="text-[10px] text-muted">{record.sourceLabel}</p>
  }
  return <p className="text-[10px] text-muted">From your {record.sourceLabel} file</p>
}

function SaveToCampaignButton({
  record,
  onSave,
  canSave,
  busy,
  status
}: {
  record: SrdRecord
  onSave?: (record: SrdRecord) => void
  canSave?: boolean
  busy?: boolean
  status?: 'added' | 'exists' | null
}) {
  const folder = libraryFolderFor(record)
  if (!onSave || !folder) return null
  const label = LIBRARY_FOLDER_NAMES[folder]
  return (
    <button
      type="button"
      className="w-full rounded border border-line bg-panel-2 px-3 py-1.5 text-sm font-semibold text-parchment disabled:text-muted"
      disabled={!canSave || busy}
      title={canSave ? `Save a ${label} note in this campaign` : 'Open a campaign first'}
      onClick={() => onSave(record)}
    >
      {busy
        ? 'Adding…'
        : status === 'exists'
          ? `Already in ${label}`
          : status === 'added'
            ? `Added to ${label}`
            : `Add to ${label}`}
    </button>
  )
}

function MonsterPortrait({ name }: { name: string }) {
  const hideBundled = useHideBundledArtwork()
  const [failed, setFailed] = useState(false)
  if (hideBundled || failed) return null
  return (
    <img
      src={srdPortraitUrl(name)}
      alt=""
      className="aspect-[3/4] w-full object-cover"
      onError={() => setFailed(true)}
    />
  )
}

function ItemPortrait({ name }: { name: string }) {
  const hideBundled = useHideBundledArtwork()
  const [failed, setFailed] = useState(false)
  if (hideBundled || failed) return null
  return (
    <div className="w-36 shrink-0">
      <img
        src={srdItemUrl(name)}
        alt=""
        className="aspect-[3/4] w-full rounded object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

function SpellPortrait({ school }: { school: string }) {
  const hideBundled = useHideBundledArtwork()
  const [failed, setFailed] = useState(false)
  if (hideBundled || failed || !school.trim()) return null
  return (
    <div className="w-36 shrink-0">
      <img
        src={srdSchoolUrl(school)}
        alt=""
        className="aspect-[3/4] w-full rounded object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

function ResultThumb({ record }: { record: SrdRecord }) {
  const hideBundled = useHideBundledArtwork()
  const [failed, setFailed] = useState(false)
  if (hideBundled || failed) return null
  const school = String(record.data.school ?? '').trim()
  const src =
    record.kind === 'monster'
      ? srdPortraitUrl(record.name)
      : record.kind === 'spell' && school
        ? srdSchoolUrl(school)
        : record.kind === 'weapon' || record.kind === 'gear'
          ? srdItemUrl(record.name)
          : null
  if (!src) return null
  return (
    <img
      src={src}
      alt=""
      className="h-12 w-9 shrink-0 rounded object-cover"
      onError={() => setFailed(true)}
    />
  )
}

function Detail({
  record,
  onAddMonster,
  onSaveToCampaign,
  canSaveToCampaign,
  saveBusy,
  saveStatus
}: {
  record: SrdRecord
  onAddMonster?: (record: SrdRecord) => void
  onSaveToCampaign?: (record: SrdRecord) => void
  canSaveToCampaign?: boolean
  saveBusy?: boolean
  saveStatus?: 'added' | 'exists' | null
}) {
  const data = record.data
  if (record.kind === 'monster') {
    return (
      <div>
        <RollableStatBlock
          block={statBlockToParsed(monsterToStatBlock(data))}
          hideToolbar
          portrait={<MonsterPortrait name={record.name} />}
        />
        <div className="mt-3 flex flex-col gap-2">
          {onAddMonster ? (
            <button
              type="button"
              className="w-full rounded bg-amber px-3 py-1.5 text-sm font-semibold text-on-amber"
              onClick={() => onAddMonster(record)}
            >
              Add to combat
            </button>
          ) : null}
          <SaveToCampaignButton
            record={record}
            onSave={onSaveToCampaign}
            canSave={canSaveToCampaign}
            busy={saveBusy}
            status={saveStatus}
          />
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
    (record.kind === 'rule' &&
      record.source &&
      record.source !== 'srd' &&
      record.source !== 'pf2e' &&
      record.source !== 'v5' &&
      record.source !== 'axium')
  ) {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex gap-3">
          <ItemPortrait name={record.name} />
          <div className="min-w-0 flex-1">
            <div className="font-display text-xl text-amber">{record.name}</div>
            <div className="text-xs text-muted">{record.summary}</div>
          </div>
        </div>
        {itemFields.map((field) => (
          <p key={field.label}>
            <span className="text-muted">{field.label}</span> {field.value}
          </p>
        ))}
        <SpellProse text={String(data.desc ?? '')} />
        <SaveToCampaignButton
          record={record}
          onSave={onSaveToCampaign}
          canSave={canSaveToCampaign}
          busy={saveBusy}
          status={saveStatus}
        />
        <SourceNote record={record} />
      </div>
    )
  }

  if (record.kind === 'spell') {
    const school = String(data.school ?? '').trim()
    return (
      <div className="space-y-2 text-sm">
        <div className="flex gap-3">
          <SpellPortrait school={school} />
          <div className="min-w-0 flex-1">
            <div className="font-display text-xl text-amber">{record.name}</div>
            <div className="text-xs text-muted">{record.summary}</div>
          </div>
        </div>
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
        <SaveToCampaignButton
          record={record}
          onSave={onSaveToCampaign}
          canSave={canSaveToCampaign}
          busy={saveBusy}
          status={saveStatus}
        />
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
  onSaveToCampaign,
  canSaveToCampaign,
  system,
  embedded = false
}: {
  onAddMonster?: (record: SrdRecord) => void
  onSaveToCampaign?: (record: SrdRecord) => Promise<'added' | 'exists' | void> | 'added' | 'exists' | void
  canSaveToCampaign?: boolean
  system?: string | null
  embedded?: boolean
}) {
  const pack = getSystemPack(system)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<SrdKind | 'all' | string>('all')
  const [selected, setSelected] = useState<SrdRecord | null>(null)
  const [saveBusy, setSaveBusy] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'added' | 'exists' | null>(null)
  const [extraSources, setExtraSources] = useState<
    { id: string; label: string; kind: SrdKind; count: number }[]
  >([])
  const [booksFolder, setBooksFolder] = useState('')

  useEffect(() => {
    setSaveStatus(null)
    setSaveBusy(false)
  }, [selected?.id])

  useEffect(() => {
    activateSystemLookup(system)
    setKind('all')
    setSelected(null)
    if (!pack.bookLookup) {
      setExtraSources([])
      return
    }
    void window.tabledm.loadBookLibrary().then((library) => {
      const records = parseBookFiles(library.files)
      setExtraRecords(records)
      setExtraSources(extraSourcesFromRecords(records))
      setBooksFolder(library.folder)
    })
  }, [system, pack.bookLookup])

  // searchSrd reads the module-level extra-records registry populated when the
  // book library loads; extraSources changes at that moment, so it is kept as a
  // dependency to re-run the search and surface newly-registered book records.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const results = useMemo(() => searchSrd(query, kind), [query, kind, extraSources])
  const filters = useMemo(
    () => [
      ...pack.lookupFilters,
      ...extraSources.map((source) => ({
        id: `source:${source.id}`,
        label: source.label
      }))
    ],
    [pack.lookupFilters, extraSources]
  )
  const packCount = packLookupRecords(system).length

  return (
    <section className={`flex min-h-0 flex-1 flex-col bg-panel ${embedded ? '' : 'border-l border-line'}`}>
      <header className="border-b border-line px-3 py-2">
        <div className="flex items-baseline justify-between gap-2">
          {embedded ? null : <h2 className="font-display text-lg text-amber">Lookup</h2>}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted">
              {pack.id === 'dnd5e'
                ? `${srdCounts.spells} ${pack.lookupSourceLabel} spells${
                    extraSources.length > 0
                      ? ` · ${extraSources.map((source) => `${source.count} ${source.label}`).join(' · ')}`
                      : ` · ${srdCounts.monsters} monsters`
                  }`
                : `${pack.lookupSourceLabel} · ${packCount} entries`}
            </span>
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
                kind === f.id ? 'bg-amber text-on-amber' : 'bg-panel-2 text-muted'
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
              onSaveToCampaign={
                onSaveToCampaign
                  ? (record) => {
                      setSaveBusy(true)
                      void Promise.resolve(onSaveToCampaign(record))
                        .then((status) => {
                          if (status === 'added' || status === 'exists') setSaveStatus(status)
                        })
                        .finally(() => setSaveBusy(false))
                    }
                  : undefined
              }
              canSaveToCampaign={canSaveToCampaign}
              saveBusy={saveBusy}
              saveStatus={saveStatus}
            />
          </div>
        ) : (
          <ul>
            {results.length > 0 ? (
              <li className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted">
                {results.length} {results.length === 1 ? 'result' : 'results'}
              </li>
            ) : null}
            {results.map((record) => (
              <li key={record.id}>
                <button
                  type="button"
                  onClick={() => setSelected(record)}
                  className="flex w-full items-center gap-2.5 border-b border-line/70 px-3 py-2 text-left hover:bg-panel-2"
                >
                  <ResultThumb record={record} />
                  <span className="min-w-0 flex-1">
                    <span className="flex w-full items-baseline justify-between gap-2">
                      <span className="font-medium">{record.name}</span>
                      <KindBadge record={record} />
                    </span>
                    <span className="block text-[11px] text-muted">{record.summary}</span>
                  </span>
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
        {pack.bookLookup ? (
          extraSources.length === 0 ? (
            <p className="mb-1">
              Add your own book text in Additional books to unlock extra lookup.{' '}
              <button
                type="button"
                className="text-amber hover:underline"
                onClick={() => void window.tabledm.openBooksFolder()}
                title={booksFolder || 'Open Additional books'}
              >
                Open Additional books
              </button>
            </p>
          ) : (
            <p className="mb-1">
              Extra lookup from your additional books.{' '}
              <button
                type="button"
                className="text-amber hover:underline"
                onClick={() => void window.tabledm.openBooksFolder()}
              >
                Open folder
              </button>
            </p>
          )
        ) : (
          <p className="mb-1">{pack.officialDisclaimer}</p>
        )}
        <p>{pack.attribution}</p>
      </div>
    </section>
  )
}
