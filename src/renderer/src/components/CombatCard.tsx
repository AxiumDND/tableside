import { useEffect, useState, type ComponentProps, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  parseCombatFields,
  type CombatFields,
  type CombatFoe
} from '../../../shared/combatFields'
import { linkWikiNotes, type CampaignNote } from '../lib/notes'
import type { SrdRecord } from '../lib/srd'
import type { CombatantHit } from '../lib/combatantLookup'
import CombatantPicker from './CombatantPicker'

function CrossedSwords() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3.2 2.1 12 10.2l1.4-1.4 1.1 1.1-1.3 1.3 7.6 7.6-1.4 1.4-7.6-7.6-1.3 1.3-1.1-1.1 1.4-1.4L2.1 3.2zm17.6 0L13.3 9.6l1.1 1.1 1.4-1.4 7.1-7.2zM8.2 14.3l1.1 1.1-4 6.5H3.1l5.1-7.6zm7.6 0 5.1 7.6h-2.2l-4-6.5 1.1-1.1z"
      />
    </svg>
  )
}

type MarkdownComponents = ComponentProps<typeof Markdown>['components']
type UrlTransform = ComponentProps<typeof Markdown>['urlTransform']

function foeLabel(foe: CombatFoe): string {
  return foe.count > 1 ? `[[${foe.name}]] ×${foe.count}` : `[[${foe.name}]]`
}

export default function CombatCard({
  title,
  body,
  editing = false,
  disabled,
  onChange,
  adding,
  onAdd,
  missing = [],
  sheetPath = '',
  notes = [],
  system,
  onEnsureMonster,
  markdownComponents,
  urlTransform,
  children
}: {
  title?: string
  /** When set, use structured treasure-style edit/read. */
  body?: string
  editing?: boolean
  disabled?: boolean
  onChange?: (fields: CombatFields) => void
  adding?: boolean
  onAdd?: () => void
  missing?: string[]
  sheetPath?: string
  notes?: CampaignNote[]
  system?: string | null
  onEnsureMonster?: (
    record: SrdRecord
  ) => Promise<'added' | 'exists' | void> | 'added' | 'exists' | void
  markdownComponents?: MarkdownComponents
  urlTransform?: UrlTransform
  children?: ReactNode
}) {
  const structured = body != null
  const parsed = structured ? parseCombatFields(title, body) : null
  const [titleValue, setTitleValue] = useState(parsed?.title ?? title ?? '')
  const [includeParty, setIncludeParty] = useState(parsed?.includeParty ?? true)
  const [foes, setFoes] = useState<CombatFoe[]>(parsed?.foes ?? [])
  const [notesText, setNotesText] = useState(parsed?.notes ?? '')

  useEffect(() => {
    if (!structured) return
    const next = parseCombatFields(title, body!)
    setTitleValue(next.title)
    setIncludeParty(next.includeParty)
    setFoes(next.foes)
    setNotesText(next.notes)
  }, [structured, title, body])

  function fields(): CombatFields {
    return {
      title: titleValue,
      includeParty,
      foes,
      notes: notesText
    }
  }

  function commit(next?: CombatFields): void {
    onChange?.(next ?? fields())
  }

  function addFoe(hit: CombatantHit): void {
    const name = hit.name.trim()
    if (!name) return
    const existing = foes.find((f) => f.name.toLowerCase() === name.toLowerCase())
    const nextFoes = existing
      ? foes.map((f) =>
          f.name.toLowerCase() === name.toLowerCase() ? { ...f, count: f.count + 1 } : f
        )
      : [...foes, { name, count: 1 }]
    setFoes(nextFoes)
    commit({ title: titleValue, includeParty, foes: nextFoes, notes: notesText })
  }

  function setFoeCount(index: number, count: number): void {
    const nextFoes = foes.map((f, i) => (i === index ? { ...f, count: Math.max(1, count) } : f))
    setFoes(nextFoes)
    commit({ title: titleValue, includeParty, foes: nextFoes, notes: notesText })
  }

  function removeFoe(index: number): void {
    const nextFoes = foes.filter((_, i) => i !== index)
    setFoes(nextFoes)
    commit({ title: titleValue, includeParty, foes: nextFoes, notes: notesText })
  }

  const displayTitle = structured ? titleValue : title

  return (
    <section className="combat-card my-4">
      <div className="relative rounded-md border border-blood/45 bg-panel-2 px-4 pb-3 pt-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-md bg-blood" />
        <div className="absolute -top-3 left-3 flex max-w-[calc(100%-11rem)] items-center gap-1.5 bg-panel px-2">
          <span className="shrink-0 text-blood">
            <CrossedSwords />
          </span>
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em] text-blood">
            Combat
          </span>
          {!editing && displayTitle?.trim() ? (
            <span className="truncate text-[12px] font-semibold text-parchment">{displayTitle.trim()}</span>
          ) : null}
        </div>
        {onAdd && !editing ? (
          <div className="absolute -top-3 right-3 bg-panel pl-2">
            <button
              type="button"
              title="Load these sheets plus every PC in PCs/party. Anyone already listed is skipped. NPCs/monsters at init 0 are rolled."
              onClick={onAdd}
              className="rounded bg-amber px-2 py-1 text-[11px] font-semibold text-on-amber"
            >
              {adding ? 'Adding…' : 'Add to initiative'}
            </button>
          </div>
        ) : null}

        {structured && editing ? (
          <div className="space-y-3 pl-2 pt-1">
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider text-muted">Title</span>
              <input
                value={titleValue}
                disabled={disabled}
                onChange={(event) => setTitleValue(event.target.value)}
                onBlur={() => commit()}
                className="mt-0.5 w-full rounded border border-line bg-ink px-2 py-1 text-sm text-parchment outline-none focus:border-amber disabled:opacity-50"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  const next = !includeParty
                  setIncludeParty(next)
                  commit({ title: titleValue, includeParty: next, foes, notes: notesText })
                }}
                className={`rounded border px-2.5 py-1 text-xs disabled:opacity-50 ${
                  includeParty
                    ? 'border-amber bg-amber/15 text-amber'
                    : 'border-line text-muted hover:border-amber'
                }`}
              >
                Party {includeParty ? 'on' : 'off'}
              </button>
              <span className="text-[11px] text-muted">Party is added to initiative automatically.</span>
            </div>
            <CombatantPicker
              notes={notes}
              system={system}
              disabled={disabled}
              onEnsureMonster={onEnsureMonster}
              onPick={addFoe}
            />
            {foes.length > 0 ? (
              <ul className="space-y-1.5">
                {foes.map((foe, index) => (
                  <li
                    key={`${foe.name}-${index}`}
                    className="flex flex-wrap items-center gap-2 rounded border border-line/60 bg-ink/40 px-2 py-1.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-parchment">{foe.name}</span>
                    <label className="flex items-center gap-1 text-[11px] text-muted">
                      ×
                      <input
                        type="number"
                        min={1}
                        value={foe.count}
                        disabled={disabled}
                        onChange={(event) => setFoeCount(index, Number(event.target.value) || 1)}
                        className="w-12 rounded border border-line bg-ink px-1 py-0.5 text-sm text-parchment outline-none focus:border-amber disabled:opacity-50"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => removeFoe(index)}
                      className="text-[11px] text-muted hover:text-blood disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-muted">No monsters or NPCs yet.</p>
            )}
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider text-muted">Notes</span>
              <textarea
                value={notesText}
                disabled={disabled}
                rows={3}
                onChange={(event) => setNotesText(event.target.value)}
                onBlur={() => commit()}
                placeholder="Telegraph, quarry, cut if running long…"
                spellCheck
                className="mt-0.5 w-full resize-y rounded border border-line bg-ink px-2 py-1.5 text-sm text-parchment outline-none focus:border-amber disabled:opacity-50"
              />
            </label>
          </div>
        ) : structured ? (
          <div className="space-y-3 pl-2 pt-1">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted">Combatants</div>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {includeParty ? (
                  <li className="rounded border border-amber/35 bg-ink/40 px-2 py-1 text-[12px] text-amber">
                    party
                  </li>
                ) : null}
                {foes.map((foe) => {
                  const linked = sheetPath
                    ? linkWikiNotes(foeLabel(foe), sheetPath, notes)
                    : foeLabel(foe)
                  return (
                    <li
                      key={foe.name}
                      className="rounded border border-line/50 bg-ink/35 px-2 py-1 text-[13px] text-parchment"
                    >
                      <div className="markdown-body !text-[13px] [&>*:first-child]:!mt-0 [&>*:last-child]:!mb-0">
                        <Markdown
                          remarkPlugins={[remarkGfm]}
                          urlTransform={urlTransform}
                          components={markdownComponents}
                        >
                          {linked}
                        </Markdown>
                      </div>
                    </li>
                  )
                })}
                {!includeParty && foes.length === 0 ? (
                  <li className="text-[12px] text-muted">None</li>
                ) : null}
              </ul>
            </div>
            {notesText.trim() ? (
              <div className="combat-card-body markdown-body text-base">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  urlTransform={urlTransform}
                  components={markdownComponents}
                >
                  {sheetPath ? linkWikiNotes(notesText, sheetPath, notes) : notesText}
                </Markdown>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="combat-card-body markdown-body text-base">{children}</div>
        )}

        {missing.length > 0 && !editing ? (
          <p className="mt-2 rounded border border-blood/40 bg-blood/10 px-2 py-1.5 text-[12px] text-blood">
            Missing sheets: {missing.map((name) => `[[${name}]]`).join(' · ')} — create them under Party / NPCs /
            Bestiary or fix the wikilink names.
          </p>
        ) : null}
      </div>
    </section>
  )
}
