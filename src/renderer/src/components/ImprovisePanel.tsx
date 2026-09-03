import {
  DAMAGE_SEVERITY,
  HEALING_POTIONS,
  IMPROVISED_DAMAGE
} from '../../../shared/improviseRef'

function MiniTable({
  headers,
  rows
}: {
  headers: string[]
  rows: string[][]
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

export default function ImprovisePanel() {
  return (
    <div className="min-h-0 flex-1 overflow-auto px-3 py-2 text-sm">
      <p className="text-[11px] text-muted">D&amp;D 5e (2024) — quick numbers at the table.</p>

      <h3 className="mt-3 font-display text-base text-amber">Healing potions</h3>
      <p className="mt-1 text-[11px] text-muted">Drink as a Bonus Action. Average is the typical roll.</p>
      <div className="mt-2">
        <MiniTable
          headers={['Potion', 'Rarity', 'Heal', 'Avg']}
          rows={HEALING_POTIONS.map((row) => [
            row.id === 'healing' ? 'Healing' : row.id[0]!.toUpperCase() + row.id.slice(1),
            row.rarity,
            row.dice,
            String(row.average)
          ])}
        />
      </div>

      <h3 className="mt-4 font-display text-base text-amber">Improvised damage</h3>
      <p className="mt-1 text-[11px] text-muted">When a hazard has no printed damage, pick a d10 step.</p>
      <div className="mt-2">
        <MiniTable
          headers={['Dice', 'Avg', 'When']}
          rows={IMPROVISED_DAMAGE.map((row) => [row.dice, String(row.average), row.cue])}
        />
      </div>

      <h3 className="mt-4 font-display text-base text-amber">How hard is that?</h3>
      <p className="mt-1 text-[11px] text-muted">Setback stings. Dangerous can drop someone already hurt. Deadly can drop a full-HP character of that level.</p>
      <div className="mt-2">
        <MiniTable
          headers={['Level', 'Setback', 'Dangerous', 'Deadly']}
          rows={DAMAGE_SEVERITY.map((row) => [row.levels, row.setback, row.dangerous, row.deadly])}
        />
      </div>

      <p className="mt-4 text-[11px] text-muted">Falling: 1d6 bludgeoning per 10 feet, maximum 20d6.</p>
    </div>
  )
}
