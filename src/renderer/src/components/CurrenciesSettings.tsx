import { useEffect, useState } from 'react'
import {
  DEFAULT_CURRENCIES,
  normalizeCurrencies,
  type CampaignCurrency
} from '../../../shared/currencies'

export default function CurrenciesSettings({
  currencies,
  onChange
}: {
  currencies?: CampaignCurrency[]
  onChange: (currencies: CampaignCurrency[]) => void
}) {
  const [draft, setDraft] = useState<CampaignCurrency[]>(() =>
    normalizeCurrencies(currencies ?? DEFAULT_CURRENCIES)
  )

  useEffect(() => {
    setDraft(normalizeCurrencies(currencies ?? DEFAULT_CURRENCIES))
  }, [currencies])

  function commit(next: CampaignCurrency[]): void {
    const normalized = normalizeCurrencies(next)
    setDraft(normalized)
    onChange(normalized)
  }

  function updateRow(index: number, patch: Partial<CampaignCurrency>): void {
    setDraft((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function flush(): void {
    setDraft((prev) => {
      const normalized = normalizeCurrencies(prev)
      onChange(normalized)
      return normalized
    })
  }

  return (
    <div>
      <p className="text-[13px] leading-relaxed text-parchment/85">
        Coin denominations for Treasure blocks. Classic D&D defaults are platinum, gold, silver, and copper —
        rename or swap for credits, crowns, or whatever the table uses.
      </p>
      <ul className="mt-2 space-y-1.5">
        {draft.map((row, index) => (
          <li key={row.id} className="flex flex-wrap items-center gap-1.5">
            <input
              value={row.label}
              onChange={(event) => updateRow(index, { label: event.target.value })}
              onBlur={() => flush()}
              placeholder="Name"
              className="min-w-[7rem] flex-1 rounded border border-line bg-ink px-2 py-1 text-[12px] text-parchment outline-none focus:border-amber"
            />
            <input
              value={row.abbr}
              onChange={(event) => updateRow(index, { abbr: event.target.value })}
              onBlur={() => flush()}
              placeholder="abbr"
              className="w-16 rounded border border-line bg-ink px-2 py-1 text-[12px] text-parchment outline-none focus:border-amber"
            />
            <button
              type="button"
              disabled={draft.length <= 1}
              onClick={() => commit(draft.filter((_, i) => i !== index))}
              className="rounded border border-line px-1.5 py-0.5 text-[11px] text-muted hover:border-blood hover:text-blood disabled:opacity-40"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            commit([...draft, { id: `coin-${draft.length + 1}`, label: 'New coin', abbr: 'nc' }])
          }
          className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber"
        >
          Add currency
        </button>
        <button
          type="button"
          onClick={() => commit([...DEFAULT_CURRENCIES])}
          className="rounded border border-line px-2 py-0.5 text-[11px] text-muted hover:border-amber hover:text-parchment"
        >
          Reset to pp / gp / sp / cp
        </button>
      </div>
    </div>
  )
}
