import { useState, type ReactNode } from 'react'
import {
  DAMAGE_SEVERITY,
  FALLING_DAMAGE_MAX_DICE,
  HEALING_POTIONS,
  IMPROVISED_DAMAGE,
  fallingDamageExpr
} from '../../../shared/improviseRef'
import { rollExpr } from '../lib/dice'
import { useDiceLog } from './DiceTray'

function MiniTable({
  headers,
  rows
}: {
  headers: string[]
  rows: ReactNode[][]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className="text-[10px] uppercase tracking-[0.14em] text-muted">
            {headers.map((header) => (
              <th key={header} className="border-b border-line py-1 pr-2 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="text-parchment">
              {row.map((cell, cellIndex) => (
                <td key={`${index}-${cellIndex}`} className="border-b border-line/60 py-1.5 pr-2 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DiceRollButton({
  expr,
  label,
  damageType
}: {
  expr: string
  label?: string
  damageType?: string
}) {
  const { record } = useDiceLog()

  return (
    <button
      type="button"
      onClick={() =>
        record({ ...rollExpr(expr), rollLabel: label, damageType }, 'Improvise')
      }
      className="rounded border border-amber-dim bg-ink px-1.5 py-0.5 text-[11px] text-amber hover:bg-amber hover:text-on-amber"
    >
      {expr}
    </button>
  )
}

function FallingDamage() {
  const [feet, setFeet] = useState('30')
  const { record } = useDiceLog()
  const calc = fallingDamageExpr(feet)

  function roll(): void {
    if (!calc.expr) return
    record(
      {
        ...rollExpr(calc.expr),
        rollLabel: `Falling ${calc.feet} ft`,
        damageType: 'Bludgeoning'
      },
      'Improvise'
    )
  }

  return (
    <div className="mt-4 space-y-2">
      <h3 className="font-display text-base text-amber">Falling</h3>
      <p className="text-[11px] text-muted">
        1d6 bludgeoning per 10 feet, maximum {FALLING_DAMAGE_MAX_DICE}d6.
      </p>
      <label className="block text-[11px] uppercase tracking-wider text-muted">
        Fall distance (ft)
        <input
          type="number"
          min={0}
          step={5}
          value={feet}
          onChange={(event) => setFeet(event.target.value)}
          className="mt-1 w-full rounded border border-line bg-ink px-2 py-1.5 text-sm normal-case text-parchment outline-none focus:border-amber"
        />
      </label>
      {calc.feet > 0 && calc.diceCount === 0 ? (
        <p className="text-[12px] text-muted">Less than 10 feet — no falling damage by the book.</p>
      ) : null}
      {calc.expr ? (
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="text-parchment">
            {calc.feet} ft → <span className="text-amber">{calc.expr}</span> bludgeoning
            {calc.capped ? ` (capped at ${FALLING_DAMAGE_MAX_DICE}d6)` : ''}
          </span>
          <button
            type="button"
            onClick={roll}
            className="rounded border border-amber-dim bg-ink px-2 py-1 text-[11px] text-amber hover:bg-amber hover:text-on-amber"
          >
            Roll {calc.expr}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default function ImprovisePanel() {
  return (
    <div className="min-h-0 flex-1 overflow-auto px-3 py-2 text-sm">
      <p className="text-[11px] text-muted">D&amp;D 5e (2024) — quick numbers at the table. Click dice to roll.</p>

      <h3 className="mt-3 font-display text-base text-amber">Healing potions</h3>
      <p className="mt-1 text-[11px] text-muted">Drink as a Bonus Action. Average is the typical roll.</p>
      <div className="mt-2">
        <MiniTable
          headers={['Potion', 'Rarity', 'Heal', 'Avg']}
          rows={HEALING_POTIONS.map((row) => {
            const potion =
              row.id === 'healing' ? 'Healing' : row.id[0]!.toUpperCase() + row.id.slice(1)
            return [
              potion,
              row.rarity,
              <DiceRollButton key={`${row.id}-dice`} expr={row.dice} label={`${potion} potion`} />,
              String(row.average)
            ]
          })}
        />
      </div>

      <h3 className="mt-4 font-display text-base text-amber">Improvised damage</h3>
      <p className="mt-1 text-[11px] text-muted">When a hazard has no printed damage, pick a d10 step.</p>
      <div className="mt-2">
        <MiniTable
          headers={['Dice', 'Avg', 'When']}
          rows={IMPROVISED_DAMAGE.map((row) => [
            <DiceRollButton key={`${row.dice}-dice`} expr={row.dice} label="Improvised damage" />,
            String(row.average),
            row.cue
          ])}
        />
      </div>

      <h3 className="mt-4 font-display text-base text-amber">How hard is that?</h3>
      <p className="mt-1 text-[11px] text-muted">Setback stings. Dangerous can drop someone already hurt. Deadly can drop a full-HP character of that level.</p>
      <div className="mt-2">
        <MiniTable
          headers={['Level', 'Setback', 'Dangerous', 'Deadly']}
          rows={DAMAGE_SEVERITY.map((row) => [
            row.levels,
            <DiceRollButton key={`${row.levels}-setback`} expr={row.setback} label={`Setback L${row.levels}`} />,
            <DiceRollButton key={`${row.levels}-dangerous`} expr={row.dangerous} label={`Dangerous L${row.levels}`} />,
            <DiceRollButton key={`${row.levels}-deadly`} expr={row.deadly} label={`Deadly L${row.levels}`} />
          ])}
        />
      </div>

      <FallingDamage />
    </div>
  )
}
