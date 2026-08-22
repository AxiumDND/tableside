import { useMemo, useState } from 'react'
import type { ShopStockOffer } from '../../../shared/shopCatalogs'
import {
  parseShopStock,
  shopHandPickOffers,
  shopTypeFromMarkdown
} from '../../../shared/shopStock'
import {
  adjustPrice,
  parseShopStanding,
  standingMeta,
  SHOP_STANDINGS,
  type ShopStanding
} from '../../../shared/shopStanding'
import { cleanWikiText } from '../lib/itemFacts'

export default function ShopStockBoard({
  markdown,
  onChangeStock,
  onChangeStanding
}: {
  markdown: string
  onChangeStock: (stock: ShopStockOffer[]) => Promise<void>
  onChangeStanding?: (standing: ShopStanding) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [customName, setCustomName] = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const [busy, setBusy] = useState(false)
  const type = shopTypeFromMarkdown(markdown) ?? 'General Store'
  const standing = parseShopStanding(markdown)
  const pay = standingMeta(standing)
  const stock = parseShopStock(markdown)
  const have = useMemo(() => new Set(stock.map((row) => row.name.toLowerCase())), [stock])
  const picks = useMemo(() => {
    const q = query.trim().toLowerCase()
    return shopHandPickOffers(type).filter((row) => {
      if (have.has(row.name.toLowerCase())) return false
      if (!q) return true
      return `${row.name} ${row.price} ${row.notes ?? ''}`.toLowerCase().includes(q)
    })
  }, [type, have, query])

  async function save(next: ShopStockOffer[]): Promise<void> {
    setBusy(true)
    try {
      await onChangeStock(next)
    } finally {
      setBusy(false)
    }
  }

  async function setStanding(next: ShopStanding): Promise<void> {
    if (!onChangeStanding || next === standing) return
    setBusy(true)
    try {
      await onChangeStanding(next)
    } finally {
      setBusy(false)
    }
  }

  async function add(row: ShopStockOffer): Promise<void> {
    if (have.has(row.name.toLowerCase())) return
    await save([...stock, { name: row.name, price: row.price, notes: row.notes, link: row.link }])
    setQuery('')
    setCustomName('')
    setCustomPrice('')
  }

  async function addCustom(): Promise<void> {
    const name = customName.trim()
    if (!name) return
    await add({ name, price: customPrice.trim(), link: false })
  }

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg text-amber">Stock</h2>
        <button
          type="button"
          disabled={busy}
          onClick={() => setOpen((value) => !value)}
          className="rounded border border-line px-2.5 py-1 text-xs hover:border-amber disabled:opacity-50"
        >
          {open ? 'Close picker' : 'Add item…'}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-muted">Party</span>
        <div className="flex flex-wrap gap-1">
          {SHOP_STANDINGS.map((row) => (
            <button
              key={row.id}
              type="button"
              disabled={busy || !onChangeStanding}
              onClick={() => void setStanding(row.id)}
              className={`rounded border px-2.5 py-1 text-xs disabled:opacity-50 ${
                standing === row.id
                  ? 'border-amber bg-amber/15 text-amber'
                  : 'border-line text-muted hover:border-amber hover:text-parchment'
              }`}
            >
              {row.label}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-muted">{pay.blurb}</span>
      </div>
      {open ? (
        <div className="mt-2 rounded border border-line bg-ink/40 p-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search this shop’s goods…"
            className="w-full rounded border border-line bg-ink px-2 py-1 text-sm outline-none focus:border-amber"
          />
          <div className="mt-2 max-h-48 overflow-auto">
            {picks.length === 0 ? (
              <p className="px-1 py-1 text-[11px] text-muted">Nothing left that matches.</p>
            ) : (
              picks.map((row) => (
                <button
                  key={row.name}
                  type="button"
                  disabled={busy}
                  onClick={() => void add(row)}
                  className="flex w-full items-baseline justify-between gap-3 rounded px-1 py-1 text-left text-sm hover:bg-panel disabled:opacity-50"
                >
                  <span>{row.name}</span>
                  <span className="shrink-0 text-[11px] text-muted">{row.price}</span>
                </button>
              ))
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="Other item"
              className="min-w-[10rem] flex-1 rounded border border-line bg-ink px-2 py-1 text-sm outline-none focus:border-amber"
            />
            <input
              value={customPrice}
              onChange={(event) => setCustomPrice(event.target.value)}
              placeholder="Price"
              className="w-24 rounded border border-line bg-ink px-2 py-1 text-sm outline-none focus:border-amber"
            />
            <button
              type="button"
              disabled={busy || !customName.trim()}
              onClick={() => void addCustom()}
              className="rounded border border-line px-2.5 py-1 text-xs hover:border-amber disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      ) : null}
      {stock.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No stock yet. Add an item or reroll.</p>
      ) : (
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-muted">
              <th className="py-1 pr-3 font-normal">Item</th>
              <th className="py-1 pr-3 font-normal">{standing === 'neutral' ? 'Price' : 'They pay'}</th>
              <th className="py-1 pr-3 font-normal">Notes</th>
              <th className="py-1 font-normal" />
            </tr>
          </thead>
          <tbody>
            {stock.map((row, index) => {
              const paid = adjustPrice(row.price, standing)
              const marked = paid !== row.price.trim()
              return (
                <tr key={`${row.name}-${index}`} className="border-t border-line/70">
                  <td className="py-1.5 pr-3">{cleanWikiText(row.name)}</td>
                  <td className="py-1.5 pr-3 text-muted">
                    {paid}
                    {marked ? (
                      <span className="ml-1.5 text-[10px] text-muted/70 line-through">{row.price}</span>
                    ) : null}
                  </td>
                  <td className="py-1.5 pr-3 text-muted">{row.notes}</td>
                  <td className="py-1.5 text-right">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void save(stock.filter((_, i) => i !== index))}
                      className="text-[11px] text-muted hover:text-amber disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}
