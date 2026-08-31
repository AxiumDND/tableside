import { useEffect, useState, type ComponentProps } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  DEFAULT_CURRENCIES,
  normalizeCurrencies,
  type CampaignCurrency
} from '../../../shared/currencies'
import {
  parseTreasureFields,
  type TreasureFields
} from '../../../shared/treasureFields'
import { linkWikiNotes, type CampaignNote } from '../lib/notes'
import type { SrdRecord } from '../lib/srd'
import TreasureItemPicker from './TreasureItemPicker'

function ChestMark() {
  // Chunky treasure-chest silhouette — matches other block marks at 14px.
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 11h18v2H3v-2zm1.5 2H19.5v7.2c0 .7-.6 1.3-1.3 1.3H5.8c-.7 0-1.3-.6-1.3-1.3V13zm2-2 1.6-4.3A1.5 1.5 0 0 1 9.5 5.5h5a1.5 1.5 0 0 1 1.4 1.2L17.5 11H6.5zM11 15.2h2V20h-2v-4.8zm1-1.1a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z"
      />
    </svg>
  )
}

function linesToText(items: string[]): string {
  return items.join('\n')
}

function textToLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.replace(/^\s*[-*]\s+/, '').trim())
    .filter((line) => {
      if (!line || /^(?:…|\.\.\.)$/.test(line)) return false
      if (/^\*\*[A-Za-z][^*]*:\*\*$/.test(line)) return false
      if (/^\[\[Item Name\]\]$/i.test(line) || /^Item Name$/i.test(line)) return false
      if (/^\[\[Magic Item\]\](?:\s*\([^)]*\))?(?:\s*[—–-].*)?$/i.test(line)) return false
      return true
    })
}

type MarkdownComponents = ComponentProps<typeof Markdown>['components']
type UrlTransform = ComponentProps<typeof Markdown>['urlTransform']

function ItemList({
  label,
  items,
  sheetPath,
  notes,
  markdownComponents,
  urlTransform
}: {
  label: string
  items: string[]
  sheetPath?: string
  notes?: CampaignNote[]
  markdownComponents?: MarkdownComponents
  urlTransform?: UrlTransform
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      {items.length > 0 ? (
        <ul className="mt-1.5 space-y-2">
          {items.map((item) => {
            const linked =
              sheetPath && notes ? linkWikiNotes(item, sheetPath, notes) : item
            return (
              <li
                key={item}
                className="rounded border border-line/50 bg-ink/35 px-2.5 py-1.5 text-sm leading-snug text-parchment"
              >
                <div className="markdown-body !text-sm [&>*:first-child]:!mt-0 [&>*:last-child]:!mb-0">
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
        </ul>
      ) : (
        <p className="mt-1 text-[12px] text-muted">None</p>
      )}
    </div>
  )
}

export default function TreasureCard({
  title,
  body,
  currencies,
  editing = false,
  disabled,
  onChange,
  markdownComponents,
  urlTransform,
  system,
  sheetPath = '',
  gearNotes = [],
  onEnsureGear
}: {
  title?: string
  body: string
  currencies?: CampaignCurrency[]
  editing?: boolean
  disabled?: boolean
  onChange?: (fields: TreasureFields) => void
  markdownComponents?: MarkdownComponents
  urlTransform?: UrlTransform
  system?: string | null
  sheetPath?: string
  gearNotes?: CampaignNote[]
  onEnsureGear?: (
    record: SrdRecord
  ) => Promise<'added' | 'exists' | void> | 'added' | 'exists' | void
}) {
  const currencyList = normalizeCurrencies(currencies ?? DEFAULT_CURRENCIES)
  const currencyKey = currencyList.map((c) => `${c.id}:${c.abbr}`).join('|')
  const parsed = parseTreasureFields(title, body, currencyList)
  const [titleValue, setTitleValue] = useState(parsed.title)
  const [coins, setCoins] = useState(parsed.coins)
  const [mundaneText, setMundaneText] = useState(linesToText(parsed.mundane))
  const [magicText, setMagicText] = useState(linesToText(parsed.magic))
  const [hidden, setHidden] = useState(parsed.hidden)
  const [notes, setNotes] = useState(parsed.notes)

  useEffect(() => {
    const next = parseTreasureFields(title, body, currencyList)
    setTitleValue(next.title)
    setCoins(next.coins)
    setMundaneText(linesToText(next.mundane))
    setMagicText(linesToText(next.magic))
    setHidden(next.hidden)
    setNotes(next.notes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, currencyKey])

  function fields(): TreasureFields {
    return {
      title: titleValue,
      coins,
      mundane: textToLines(mundaneText),
      magic: textToLines(magicText),
      hidden,
      notes
    }
  }

  function commit(next?: TreasureFields): void {
    onChange?.(next ?? fields())
  }

  function addItem(line: string, magic: boolean): void {
    const nextMundane = textToLines(mundaneText)
    const nextMagic = textToLines(magicText)
    if (magic) nextMagic.push(line)
    else nextMundane.push(line)
    const nextMundaneText = linesToText(nextMundane)
    const nextMagicText = linesToText(nextMagic)
    setMundaneText(nextMundaneText)
    setMagicText(nextMagicText)
    commit({
      title: titleValue,
      coins,
      mundane: nextMundane,
      magic: nextMagic,
      hidden,
      notes
    })
  }

  const coinEntries = currencyList.map((c) => ({
    ...c,
    amount: coins[c.abbr.toLowerCase()] ?? ''
  }))
  const hasCoins = coinEntries.some((c) => c.amount.trim())
  const mundane = textToLines(mundaneText)
  const magic = textToLines(magicText)

  return (
    <section className="treasure-card my-5">
      <div className="relative rounded-md border border-amber/45 bg-panel-2 px-4 pb-4 pt-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-md bg-amber" />
        <div className="absolute -top-3 left-3 flex items-center gap-1.5 bg-panel px-2">
          <span className="text-amber">
            <ChestMark />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber">Treasure</span>
          {!editing && titleValue.trim() ? (
            <span className="max-w-[16rem] truncate font-display text-[13px] font-normal text-amber">
              {titleValue.trim()}
            </span>
          ) : null}
        </div>

        {editing ? (
          <div className="space-y-3 pl-2">
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
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted">Coin</span>
              <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {coinEntries.map((coin) => (
                  <label key={coin.id} className="block rounded border border-line bg-ink/60 px-2 py-1.5">
                    <span className="block text-[10px] uppercase tracking-wider text-muted">
                      {coin.label} <span className="text-parchment/70">({coin.abbr})</span>
                    </span>
                    <input
                      inputMode="numeric"
                      value={coin.amount}
                      disabled={disabled}
                      placeholder="0"
                      onChange={(event) => {
                        const abbr = coin.abbr.toLowerCase()
                        setCoins((prev) => ({ ...prev, [abbr]: event.target.value }))
                      }}
                      onBlur={() => commit()}
                      className="mt-1 w-full bg-transparent text-sm text-parchment outline-none focus:text-amber disabled:opacity-50"
                    />
                  </label>
                ))}
              </div>
            </div>
            <TreasureItemPicker
              gearNotes={gearNotes}
              system={system}
              disabled={disabled}
              onEnsureGear={onEnsureGear}
              onPick={addItem}
            />
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider text-muted">Mundane items</span>
              <textarea
                value={mundaneText}
                disabled={disabled}
                rows={3}
                onChange={(event) => setMundaneText(event.target.value)}
                onBlur={() => commit()}
                className="mt-1 w-full resize-y rounded border border-line bg-ink px-2 py-1.5 text-sm text-parchment outline-none focus:border-amber disabled:opacity-50"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider text-muted">Magic items</span>
              <textarea
                value={magicText}
                disabled={disabled}
                rows={3}
                onChange={(event) => setMagicText(event.target.value)}
                onBlur={() => commit()}
                className="mt-1 w-full resize-y rounded border border-line bg-ink px-2 py-1.5 text-sm text-parchment outline-none focus:border-amber disabled:opacity-50"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider text-muted">Hidden</span>
              <input
                value={hidden}
                disabled={disabled}
                placeholder="Perception / Investigation DC …"
                onChange={(event) => setHidden(event.target.value)}
                onBlur={() => commit()}
                className="mt-0.5 w-full rounded border border-line bg-ink px-2 py-1 text-sm text-parchment outline-none focus:border-amber disabled:opacity-50"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider text-muted">Notes</span>
              <textarea
                value={notes}
                disabled={disabled}
                rows={2}
                onChange={(event) => setNotes(event.target.value)}
                onBlur={() => commit()}
                className="mt-0.5 w-full resize-y rounded border border-line bg-ink px-2 py-1 text-sm text-parchment outline-none focus:border-amber disabled:opacity-50"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4 pl-2">
            {hasCoins ? (
              <div className="flex flex-wrap gap-2">
                {coinEntries
                  .filter((coin) => coin.amount.trim())
                  .map((coin) => (
                    <div
                      key={coin.id}
                      className="min-w-[4.5rem] rounded border border-amber/30 bg-ink/50 px-2.5 py-1.5 text-center"
                    >
                      <div className="text-base font-semibold text-amber">{coin.amount.trim()}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted">{coin.abbr}</div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted">No coin listed.</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <ItemList
                label="Mundane"
                items={mundane}
                sheetPath={sheetPath}
                notes={gearNotes}
                markdownComponents={markdownComponents}
                urlTransform={urlTransform}
              />
              <ItemList
                label="Magic"
                items={magic}
                sheetPath={sheetPath}
                notes={gearNotes}
                markdownComponents={markdownComponents}
                urlTransform={urlTransform}
              />
            </div>
            {hidden.trim() ? (
              <p className="text-[13px] text-parchment">
                <span className="text-[10px] uppercase tracking-wider text-muted">Hidden · </span>
                {hidden.trim()}
              </p>
            ) : null}
            {notes.trim() ? (
              <p className="whitespace-pre-wrap text-[13px] text-muted">{notes.trim()}</p>
            ) : null}
            {!hasCoins && mundane.length === 0 && magic.length === 0 && !hidden.trim() && !notes.trim() ? (
              <p className="text-[12px] text-muted">No loot listed yet.</p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}
