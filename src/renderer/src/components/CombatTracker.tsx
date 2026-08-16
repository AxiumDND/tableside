import { useEffect, useMemo, useState } from 'react'
import type { Combatant, CombatantKind, CombatState } from '../../../shared/types'
import { advanceCombatTurn, combatantCondition, initiativeBonus, sortCombatants } from '../lib/combat'
import { formatMod, rollD20 } from '../lib/dice'
import { statBlockToParsed } from '../lib/statblock'
import { useDiceLog } from './DiceTray'
import RollableStatBlock from './RollableStatBlock'
import { combatantToBlock } from './StatBlock'

function uid(): string {
  return crypto.randomUUID()
}

export default function CombatTracker({
  combat,
  bestiary = [],
  partyCount = 0,
  onAddParty,
  onAddBestiary,
  onChange,
  onClose
}: {
  combat: CombatState
  bestiary?: { path: string; name: string }[]
  partyCount?: number
  onAddParty?: () => void
  onAddBestiary?: (path: string) => void
  onChange: (next: CombatState) => void
  onClose?: () => void
}) {
  const [draft, setDraft] = useState({ name: '', initiative: '', hp: '', ac: '' })
  const [beastQuery, setBeastQuery] = useState('')
  const [lastRoll, setLastRoll] = useState('')
  const [viewedId, setViewedId] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<Combatant | null>(null)
  const dice = useDiceLog()
  const ordered = useMemo(() => sortCombatants(combat.combatants), [combat.combatants])
  const round = combat.round ?? 0
  const started = round > 0
  const turnId =
    started && combat.activeId && ordered.some((c) => c.id === combat.activeId) ? combat.activeId : null
  const viewed =
    ordered.find((c) => c.id === viewedId) ?? ordered.find((c) => c.id === turnId) ?? ordered[0] ?? null
  const viewedParsed = viewed ? statBlockToParsed(combatantToBlock(viewed) ?? { name: viewed.name }, viewed.name) : null
  const partyInCombat = combat.combatants.filter((c) => c.kind === 'pc').length
  const beasts = useMemo(() => {
    const q = beastQuery.trim().toLowerCase()
    return q ? bestiary.filter((b) => b.name.toLowerCase().includes(q)) : bestiary
  }, [bestiary, beastQuery])

  useEffect(() => {
    if (!confirmClear && !confirmRemove) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setConfirmClear(false)
        setConfirmRemove(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmClear, confirmRemove])

  function update(partial: Partial<CombatState>): void {
    onChange({ ...combat, ...partial })
  }

  function patchCombatant(id: string, partial: Partial<Combatant>): void {
    update({
      combatants: combat.combatants.map((c) => (c.id === id ? { ...c, ...partial } : c))
    })
  }

  function addManual(): void {
    if (!draft.name.trim()) return
    const hp = Number(draft.hp || 10)
    const next: Combatant = {
      id: uid(),
      name: draft.name.trim(),
      kind: 'npc',
      initiative: Number(draft.initiative || 0),
      hp,
      maxHp: hp,
      ac: Number(draft.ac || 10)
    }
    update({ combatants: [...combat.combatants, next] })
    setDraft({ name: '', initiative: '', hp: '', ac: '' })
  }

  function startCombat(): void {
    if (ordered.length === 0) return
    const first = ordered[0]
    setViewedId(first.id)
    update({ activeId: first.id, round: 1 })
  }

  function nextTurn(): void {
    if (ordered.length === 0) return
    const next = advanceCombatTurn(combat)
    if (next.activeId) setViewedId(next.activeId)
    onChange(next)
  }

  function rollOne(c: Combatant) {
    const bonus = initiativeBonus(c)
    return { ...rollD20(bonus, 'Init'), bonus }
  }

  function applyRolls(which: CombatantKind[] | 'all'): void {
    const notes: string[] = []
    const batch: { result: ReturnType<typeof rollD20>; source: string }[] = []
    const next = combat.combatants.map((c) => {
      if (which !== 'all' && !which.includes(c.kind)) return c
      const rolled = rollOne(c)
      const name = c.name.split('(')[0].trim()
      notes.push(`${name} ${rolled.total} (${rolled.detail})`)
      batch.push({ result: rolled, source: name })
      return { ...c, initiative: rolled.total }
    })
    update({ combatants: next })
    setLastRoll(notes.join(' · '))
    dice.recordMany(batch)
  }

  function clearCombat(): void {
    setLastRoll('')
    setViewedId(null)
    setConfirmClear(false)
    setConfirmRemove(null)
    update({ combatants: [], activeId: null, round: 0, showOrderToPlayers: false })
  }

  function removeCombatant(id: string): void {
    setConfirmRemove(null)
    if (viewedId === id) setViewedId(null)
    update({
      combatants: combat.combatants.filter((x) => x.id !== id),
      activeId: combat.activeId === id ? null : combat.activeId
    })
  }

  return (
    <section className="flex min-h-0 w-[400px] shrink-0 flex-col border-l border-line bg-ink">
      <header className="border-b border-line px-3 py-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-amber">Combat</h2>
          <div className="flex items-center gap-3">
            {onClose ? (
              <button type="button" onClick={onClose} className="text-xs text-muted hover:text-amber">
                Hide
              </button>
            ) : null}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {started ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Previous round"
                disabled={round <= 1}
                onClick={() => update({ round: Math.max(1, round - 1) })}
                className="rounded border border-line px-1.5 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
              >
                −
              </button>
              <span className="min-w-[4.5rem] text-center text-[11px] font-semibold text-amber">
                Round {round}
              </span>
              <button
                type="button"
                title="Next round"
                onClick={() => update({ round: round + 1 })}
                className="rounded border border-line px-1.5 py-0.5 text-[11px] hover:border-amber"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={ordered.length === 0}
              onClick={startCombat}
              className="rounded bg-amber px-2 py-1 text-[11px] font-semibold text-ink disabled:bg-line"
            >
              Start combat
            </button>
          )}
          <button
            type="button"
            onClick={() => applyRolls('all')}
            className="rounded border border-line px-2 py-1 text-[11px] hover:border-amber"
          >
            Roll all
          </button>
          <button
            type="button"
            onClick={() => applyRolls(['npc', 'monster'])}
            className="rounded border border-line px-2 py-1 text-[11px] hover:border-amber"
          >
            Roll NPCs
          </button>
          <button
            type="button"
            disabled={ordered.length === 0}
            onClick={nextTurn}
            className="text-[11px] text-amber hover:underline disabled:text-muted"
          >
            Next turn
          </button>
          <button
            type="button"
            disabled={ordered.length === 0}
            onClick={() => update({ showOrderToPlayers: !combat.showOrderToPlayers })}
            className={`rounded px-2 py-1 text-[11px] ${
              combat.showOrderToPlayers
                ? 'bg-amber font-semibold text-ink'
                : 'border border-line hover:border-amber'
            }`}
            title="Superimpose initiative over the player image"
          >
            {combat.showOrderToPlayers ? 'Showing to players' : 'Show to players'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (combat.combatants.length === 0) {
                clearCombat()
                return
              }
              setConfirmClear(true)
            }}
            className="text-[11px] text-muted hover:text-blood"
          >
            Clear
          </button>
        </div>
        {lastRoll ? <p className="mt-2 text-[11px] leading-snug text-muted">{lastRoll}</p> : null}
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="text-xs uppercase tracking-wider text-muted">Initiative</h3>
          <p className="text-[10px] text-muted">PCs: type their roll · NPCs: Roll NPCs</p>
        </div>
        <ul>
          {ordered.map((c) => {
            const onTurn = c.id === turnId
            const inspecting = viewed?.id === c.id
            const ratio = c.maxHp > 0 ? c.hp / c.maxHp : 0
            const bonus = initiativeBonus(c)
            const condition = combatantCondition(c)
            return (
              <li
                key={c.id}
                className={`border-b border-line/60 px-3 py-2 ${onTurn ? 'bg-panel-2' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title={`Roll initiative 1d20${formatMod(bonus)}`}
                    onClick={() => {
                      const rolled = rollOne(c)
                      patchCombatant(c.id, { initiative: rolled.total })
                      const name = c.name.split('(')[0].trim()
                      setLastRoll(`${name} ${rolled.total} (${rolled.detail})`)
                      dice.record(rolled, name)
                    }}
                    className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[11px] font-semibold text-amber hover:border-amber"
                  >
                    Roll
                  </button>
                  <input
                    type="number"
                    value={c.initiative}
                    onChange={(e) =>
                      patchCombatant(c.id, { initiative: Number(e.target.value) })
                    }
                    className="w-12 rounded border border-line bg-ink px-1 text-center text-sm"
                    title="Initiative total — type a PC's roll here"
                  />
                  <span className="w-7 shrink-0 text-[11px] text-muted" title="Initiative bonus">
                    {formatMod(bonus)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewedId(c.id)}
                    className={`min-w-0 flex-1 truncate text-left font-medium ${
                      inspecting ? 'text-amber' : condition ? 'text-blood' : ''
                    } ${condition === 'dead' || condition === 'unconscious' ? 'line-through' : ''}`}
                    title="Show stats and rolls — does not change whose turn it is"
                  >
                    {c.name}
                    <span className="ml-2 text-[10px] uppercase text-muted">{c.kind}</span>
                    {onTurn ? <span className="ml-2 text-[10px] uppercase text-amber">Turn</span> : null}
                    {condition === 'dead' ? (
                      <span className="ml-2 text-[10px] uppercase text-blood">Dead</span>
                    ) : null}
                    {condition === 'unconscious' ? (
                      <span className="ml-2 text-[10px] uppercase text-blood">Unconscious</span>
                    ) : null}
                  </button>
                  <span className="text-xs text-muted">AC {c.ac}</span>
                  <button type="button" onClick={() => patchCombatant(c.id, { hp: Math.max(0, c.hp - 1) })}>
                    −
                  </button>
                  <span className={`w-12 text-center text-sm ${ratio <= 0.3 ? 'text-blood' : ''}`}>
                    {c.hp}/{c.maxHp}
                  </span>
                  <button type="button" onClick={() => patchCombatant(c.id, { hp: Math.min(c.maxHp, c.hp + 1) })}>
                    +
                  </button>
                  <button
                    type="button"
                    className="text-muted hover:text-blood"
                    title={`Remove ${c.name}`}
                    onClick={() => setConfirmRemove(c)}
                  >
                    ×
                  </button>
                </div>
              </li>
            )
          })}
        </ul>

        {ordered.length === 0 ? (
          <p className="px-3 py-3 text-sm text-muted">Add the party, then pick creatures from the Bestiary.</p>
        ) : null}

        <div className="border-t border-line px-3 py-2">
          {onAddParty ? (
            <button
              type="button"
              onClick={onAddParty}
              disabled={partyCount > 0 && partyInCombat >= partyCount}
              className="w-full rounded bg-amber px-3 py-1.5 text-sm font-semibold text-ink disabled:bg-line disabled:text-muted"
            >
              {partyCount > 0 && partyInCombat >= partyCount ? 'Party added' : 'Add all players'}
            </button>
          ) : null}
          {bestiary.length > 0 ? (
            <div className="mt-3">
              <h3 className="text-xs uppercase tracking-wider text-muted">Bestiary</h3>
              {bestiary.length > 8 ? (
                <input
                  value={beastQuery}
                  onChange={(e) => setBeastQuery(e.target.value)}
                  placeholder="Filter creatures…"
                  className="mt-1 w-full rounded border border-line bg-panel-2 px-2 py-1 text-xs"
                />
              ) : null}
              <ul className="mt-1 max-h-40 overflow-auto">
                {beasts.map((beast) => (
                  <li key={beast.path}>
                    <button
                      type="button"
                      onClick={() => onAddBestiary?.(beast.path)}
                      className="flex w-full items-center justify-between border-b border-line/50 px-1 py-1.5 text-left text-sm hover:text-amber"
                    >
                      <span className="truncate">{beast.name}</span>
                      <span className="text-[11px] text-muted">Add</span>
                    </button>
                  </li>
                ))}
                {beasts.length === 0 ? (
                  <li className="py-2 text-xs text-muted">No matching creatures</li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>

        <form
          className="grid grid-cols-12 gap-1 px-3 py-2 text-xs"
          onSubmit={(e) => {
            e.preventDefault()
            addManual()
          }}
        >
          <input
            placeholder="Name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="col-span-4 rounded border border-line bg-panel-2 px-2 py-1"
          />
          <input
            placeholder="Init"
            value={draft.initiative}
            onChange={(e) => setDraft({ ...draft, initiative: e.target.value })}
            className="col-span-2 rounded border border-line bg-panel-2 px-2 py-1"
          />
          <input
            placeholder="HP"
            value={draft.hp}
            onChange={(e) => setDraft({ ...draft, hp: e.target.value })}
            className="col-span-2 rounded border border-line bg-panel-2 px-2 py-1"
          />
          <input
            placeholder="AC"
            value={draft.ac}
            onChange={(e) => setDraft({ ...draft, ac: e.target.value })}
            className="col-span-2 rounded border border-line bg-panel-2 px-2 py-1"
          />
          <button type="submit" className="col-span-2 rounded bg-amber/90 font-semibold text-ink">
            Add
          </button>
        </form>

        {viewedParsed ? (
          <div className="border-t border-line p-3">
            <RollableStatBlock key={viewed?.id} block={viewedParsed} hideToolbar />
          </div>
        ) : null}
      </div>

      {confirmClear ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
          onClick={() => setConfirmClear(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-combat-title"
            className="w-full max-w-sm rounded border border-line bg-panel p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="clear-combat-title" className="font-display text-lg text-amber">
              Clear combat?
            </h3>
            <p className="mt-2 text-sm text-parchment/90">
              This removes everyone from the initiative tracker. You cannot undo it.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={clearCombat}
                className="rounded bg-blood px-3 py-1.5 text-sm font-semibold text-parchment"
              >
                Clear tracker
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmRemove ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
          onClick={() => setConfirmRemove(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-combatant-title"
            className="w-full max-w-sm rounded border border-line bg-panel p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="remove-combatant-title" className="font-display text-lg text-amber">
              Remove {confirmRemove.name}?
            </h3>
            <p className="mt-2 text-sm text-parchment/90">
              Are you sure you want to take them off the initiative tracker?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                className="rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => removeCombatant(confirmRemove.id)}
                className="rounded bg-blood px-3 py-1.5 text-sm font-semibold text-parchment"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
