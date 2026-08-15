import { useMemo, useState } from 'react'
import type { Character, Combatant, CombatState } from '../../../shared/types'
import { CharacterCard, combatantToBlock, MonsterStatBlock } from './StatBlock'

function uid(): string {
  return crypto.randomUUID()
}

function sortCombat(list: Combatant[]): Combatant[] {
  return [...list].sort((a, b) => b.initiative - a.initiative || a.name.localeCompare(b.name))
}

export default function CombatTracker({
  party,
  npcs,
  combat,
  onChange,
  onSelectCharacter
}: {
  party: Character[]
  npcs: Character[]
  combat: CombatState
  onChange: (next: CombatState) => void
  onSelectCharacter?: (character: Character) => void
}) {
  const [draft, setDraft] = useState({ name: '', initiative: '', hp: '', ac: '' })
  const ordered = useMemo(() => sortCombat(combat.combatants), [combat.combatants])
  const selected = ordered.find((c) => c.id === combat.activeId) ?? ordered[0] ?? null
  const selectedBlock = selected ? combatantToBlock(selected) : null

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
    update({ combatants: [...combat.combatants, next], activeId: combat.activeId ?? next.id })
    setDraft({ name: '', initiative: '', hp: '', ac: '' })
  }

  function addCharacter(character: Character, kind: Combatant['kind']): void {
    if (combat.combatants.some((c) => c.sourceId === character.id)) return
    const next: Combatant = {
      id: uid(),
      name: character.name,
      kind,
      initiative: 0,
      hp: character.hp,
      maxHp: character.maxHp,
      ac: character.ac,
      notes: character.notes,
      sourceId: character.id
    }
    update({ combatants: [...combat.combatants, next] })
  }

  function nextTurn(): void {
    if (ordered.length === 0) return
    const idx = selected ? ordered.findIndex((c) => c.id === selected.id) : -1
    const nxt = ordered[(idx + 1) % ordered.length]
    update({ activeId: nxt.id })
  }

  return (
    <section className="flex min-h-0 flex-col bg-ink">
      <header className="border-b border-line px-3 py-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-amber">Table</h2>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={combat.showOrderToPlayers}
              onChange={(e) => update({ showOrderToPlayers: e.target.checked })}
            />
            Show order on player screen
          </label>
        </div>
      </header>

      <div className="border-b border-line px-3 py-2">
        <div className="mb-1 text-[11px] uppercase tracking-wider text-muted">Party</div>
        <div className="grid grid-cols-2 gap-2">
          {party.map((pc) => (
            <div key={pc.id} className="space-y-1">
              <CharacterCard character={pc} compact onSelect={() => onSelectCharacter?.(pc)} />
              <button
                type="button"
                onClick={() => addCharacter(pc, 'pc')}
                className="w-full text-[11px] text-amber hover:underline"
              >
                Add to combat
              </button>
            </div>
          ))}
          {party.length === 0 ? <p className="text-xs text-muted">No PCs in party/</p> : null}
        </div>
        {npcs.length > 0 ? (
          <div className="mt-2">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-muted">NPCs</div>
            <div className="flex flex-wrap gap-1">
              {npcs.map((npc) => (
                <button
                  key={npc.id}
                  type="button"
                  onClick={() => addCharacter(npc, 'npc')}
                  className="rounded border border-line px-2 py-0.5 text-xs hover:border-amber"
                >
                  {npc.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="text-xs uppercase tracking-wider text-muted">Initiative</h3>
          <div className="flex gap-2">
            <button type="button" onClick={nextTurn} className="text-xs text-amber hover:underline">
              Next turn
            </button>
            <button
              type="button"
              onClick={() => update({ combatants: [], activeId: null })}
              className="text-xs text-muted hover:text-blood"
            >
              Clear
            </button>
          </div>
        </div>
        <ul>
          {ordered.map((c) => {
            const active = c.id === (combat.activeId ?? ordered[0]?.id)
            const ratio = c.maxHp > 0 ? c.hp / c.maxHp : 0
            return (
              <li
                key={c.id}
                className={`border-b border-line/60 px-3 py-2 ${active ? 'bg-panel-2' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    value={c.initiative}
                    onChange={(e) => patchCombatant(c.id, { initiative: Number(e.target.value) || 0 })}
                    className="w-10 rounded bg-ink text-center text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => update({ activeId: c.id })}
                    className="flex-1 text-left font-medium"
                  >
                    {c.name}
                    <span className="ml-2 text-[10px] uppercase text-muted">{c.kind}</span>
                  </button>
                  <span className="text-xs text-muted">AC {c.ac}</span>
                  <button type="button" onClick={() => patchCombatant(c.id, { hp: c.hp - 1 })}>
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
                    onClick={() =>
                      update({
                        combatants: combat.combatants.filter((x) => x.id !== c.id),
                        activeId: combat.activeId === c.id ? null : combat.activeId
                      })
                    }
                  >
                    ×
                  </button>
                </div>
              </li>
            )
          })}
        </ul>

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

        {selectedBlock ? (
          <div className="border-t border-line p-3">
            <MonsterStatBlock block={selectedBlock} />
          </div>
        ) : (
          <p className="px-3 py-6 text-sm text-muted">Add combatants, or send a monster from Lookup.</p>
        )}
      </div>
    </section>
  )
}
