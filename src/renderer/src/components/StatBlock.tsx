import type { Character, Combatant, StatBlock as StatBlockData } from '../../../shared/types'

function scoreLine(block: StatBlockData): { label: string; score: number; mod: number }[] {
  const keys = [
    ['STR', 'strength'],
    ['DEX', 'dexterity'],
    ['CON', 'constitution'],
    ['INT', 'intelligence'],
    ['WIS', 'wisdom'],
    ['CHA', 'charisma']
  ] as const
  return keys
    .map(([label, key]) => {
      const score = block.scores?.[key]
      if (score == null) return null
      const mod = block.modifiers?.[key] ?? Math.floor((score - 10) / 2)
      return { label, score, mod }
    })
    .filter((row): row is { label: string; score: number; mod: number } => Boolean(row))
}

function ActionList({ title, items }: { title: string; items?: { name: string; desc: string }[] }) {
  if (!items?.length) return null
  return (
    <div className="mt-3">
      <h4 className="font-display text-amber">{title}</h4>
      <div className="mt-1 space-y-2 text-[13px] leading-snug text-parchment/90">
        {items.map((item) => (
          <p key={title + item.name}>
            <span className="font-semibold text-parchment">{item.name}.</span> {item.desc}
          </p>
        ))}
      </div>
    </div>
  )
}

export function MonsterStatBlock({ block }: { block: StatBlockData }) {
  const scores = scoreLine(block)
  return (
    <div className="text-sm">
      <div className="font-display text-xl text-amber">{block.name}</div>
      <div className="text-xs italic text-muted">
        {[block.size, block.type, block.alignment].filter(Boolean).join(', ')}
        {block.cr != null ? ` · CR ${block.cr}` : ''}
      </div>
      <div className="mt-2 space-y-0.5 text-[13px]">
        <p>
          <span className="text-muted">Armor Class</span> {block.ac}
          {block.armorDetail ? ` (${block.armorDetail})` : ''}
        </p>
        <p>
          <span className="text-muted">Hit Points</span> {block.hp}
          {block.hitDice ? ` (${block.hitDice})` : ''}
        </p>
        {block.speed ? (
          <p>
            <span className="text-muted">Speed</span> {block.speed}
          </p>
        ) : null}
      </div>
      {scores.length > 0 ? (
        <div className="mt-3 grid grid-cols-6 gap-1 text-center text-xs">
          {scores.map((row) => (
            <div key={row.label} className="rounded bg-ink/60 py-1">
              <div className="text-muted">{row.label}</div>
              <div>
                {row.score} ({row.mod >= 0 ? '+' : ''}
                {row.mod})
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-2 space-y-0.5 text-[13px]">
        {block.saves ? (
          <p>
            <span className="text-muted">Saves</span> {block.saves}
          </p>
        ) : null}
        {block.skills ? (
          <p>
            <span className="text-muted">Skills</span> {block.skills}
          </p>
        ) : null}
        {block.resistances ? (
          <p>
            <span className="text-muted">Resistances</span> {block.resistances}
          </p>
        ) : null}
        {block.immunities ? (
          <p>
            <span className="text-muted">Immunities</span> {block.immunities}
          </p>
        ) : null}
        {block.senses ? (
          <p>
            <span className="text-muted">Senses</span> {block.senses}
          </p>
        ) : null}
        {block.languages ? (
          <p>
            <span className="text-muted">Languages</span> {block.languages}
          </p>
        ) : null}
      </div>
      <ActionList title="Traits" items={block.traits} />
      <ActionList title="Actions" items={block.actions} />
      <ActionList title="Bonus Actions" items={block.bonusActions} />
      <ActionList title="Reactions" items={block.reactions} />
      <ActionList title="Legendary Actions" items={block.legendary} />
    </div>
  )
}

export function CharacterCard({
  character,
  compact,
  onSelect
}: {
  character: Character
  compact?: boolean
  onSelect?: () => void
}) {
  const ratio = character.maxHp > 0 ? character.hp / character.maxHp : 0
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded border border-line bg-panel-2 px-2.5 py-2 text-left hover:border-amber-dim"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">{character.name}</span>
        <span className="text-xs text-muted">AC {character.ac}</span>
      </div>
      {!compact && character.classLevel ? (
        <div className="text-[11px] text-muted">{character.classLevel}</div>
      ) : null}
      <div className="mt-1 h-1.5 overflow-hidden rounded bg-ink">
        <div
          className={`h-full ${ratio <= 0.3 ? 'bg-blood' : 'bg-moss'}`}
          style={{ width: `${Math.max(0, Math.min(100, ratio * 100))}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted">
        <span>
          HP {character.hp}/{character.maxHp}
        </span>
        {character.passivePerception != null ? <span>PP {character.passivePerception}</span> : null}
      </div>
    </button>
  )
}

export function combatantToBlock(c: Combatant): StatBlockData | null {
  if (c.statBlock) return c.statBlock
  return {
    name: c.name,
    ac: c.ac,
    hp: c.maxHp,
    type: c.kind
  }
}
