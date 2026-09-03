import { useState, type ReactNode } from 'react'
import {
  abilityMod,
  extractRolls,
  formatDicePlayerExpr,
  formatMod,
  isDamageLabel,
  rollD20,
  rollExpr,
  type DiceMode,
  type DiceResult
} from '../lib/dice'
import { type ParsedStatblock } from '../lib/statblock'
import { D20ModeDialog } from './D20ModeDialog'
import { useDiceLog } from './DiceTray'

const ABILITY_LABELS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const
const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

const KEYWORD_SPLIT =
  /(\b(?:Blinded|Charmed|Deafened|Exhaustion|Frightened|Grappled|Incapacitated|Invisible|Paralyzed|Petrified|Poisoned|Prone|Restrained|Stunned|Unconscious|Concentration|Darkvision|Blindsight|Tremorsense|Truesight|Advantage|Disadvantage|Recharge\s+\d+[–-]\d+|DC\s+\d+)\b)/gi
const KEYWORD_TEST =
  /^(Blinded|Charmed|Deafened|Exhaustion|Frightened|Grappled|Incapacitated|Invisible|Paralyzed|Petrified|Poisoned|Prone|Restrained|Stunned|Unconscious|Concentration|Darkvision|Blindsight|Tremorsense|Truesight|Advantage|Disadvantage|Recharge\s+\d+[–-]\d+|DC\s+\d+)$/i

function KeywordText({ text }: { text: string }): ReactNode {
  return text.split(KEYWORD_SPLIT).map((part, index) =>
    KEYWORD_TEST.test(part) ? (
      <span key={`${part}-${index}`} className="font-semibold text-amber">
        {part}
      </span>
    ) : (
      part
    )
  )
}

function RollChip({
  label,
  expr,
  damageType,
  onRoll,
  onQueueD20,
  allowCrit
}: {
  label: string
  expr: string
  damageType?: string
  onRoll: (result: DiceResult) => void
  onQueueD20: (title: string, build: (mode: DiceMode) => DiceResult) => void
  allowCrit: boolean
}) {
  const cleaned = expr.replace(/\s/g, '')
  const isD20 = /^1?d20/i.test(cleaned)
  const showCrit = allowCrit && isDamageLabel(label)
  const chipLabel = damageType && isDamageLabel(label) ? `${label} (${damageType})` : label

  function buildResult(mode: DiceMode): DiceResult {
    return {
      ...rollExpr(expr, mode),
      rollLabel: isDamageLabel(label) ? label : undefined,
      damageType
    }
  }

  function roll(mode: DiceMode = 'normal'): void {
    onRoll(buildResult(mode))
  }

  return (
    <>
      <button
        type="button"
        onClick={() =>
          isD20 ? onQueueD20(`${chipLabel} ${expr}`, buildResult) : roll('normal')
        }
        className="rounded border border-amber-dim bg-ink px-1.5 py-0.5 text-[11px] text-amber hover:bg-amber hover:text-on-amber"
      >
        {chipLabel} {expr}
      </button>
      {showCrit ? (
        <button
          type="button"
          onClick={() => roll('crit')}
          className="rounded border border-blood/60 bg-ink px-1.5 py-0.5 text-[11px] text-blood hover:bg-blood hover:text-parchment"
        >
          Crit
        </button>
      ) : null}
    </>
  )
}

function ActionBlock({
  title,
  items,
  onRoll,
  onQueueD20,
  allowCrit
}: {
  title: string
  items: { name: string; desc: string }[]
  onRoll: (result: DiceResult) => void
  onQueueD20: (title: string, build: (mode: DiceMode) => DiceResult) => void
  allowCrit: boolean
}) {
  if (!items.length) return null
  return (
    <div className="mt-3 border-t border-amber-dim/35 pt-2">
      <h4 className="font-display text-[11px] uppercase tracking-[0.18em] text-amber">{title}</h4>
      <div className="mt-1.5 space-y-2 text-[13px] leading-snug">
        {items.map((item) => {
          const rolls = extractRolls(item.desc)
          return (
            <div key={title + item.name}>
              <p>
                <span className="font-semibold text-parchment">
                  <KeywordText text={item.name} />.
                </span>{' '}
                <KeywordText text={item.desc} />
              </p>
              {rolls.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {rolls.map((roll) => (
                    <RollChip
                      key={item.name + roll.label + roll.expr + (roll.damageType ?? '')}
                      label={roll.label}
                      expr={roll.expr}
                      damageType={roll.damageType}
                      onRoll={onRoll}
                      onQueueD20={onQueueD20}
                      allowCrit={allowCrit}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function saveFor(block: ParsedStatblock, index: number): number {
  const key = ABILITY_KEYS[index]
  if (block.saves[key] != null) return block.saves[key]
  return abilityMod(block.stats[index] ?? 10)
}

export default function RollableStatBlock({
  block,
  onAddToCombat,
  hideToolbar,
  portrait
}: {
  block: ParsedStatblock
  onAddToCombat?: () => void
  hideToolbar?: boolean
  portrait?: ReactNode
}) {
  const [last, setLast] = useState<DiceResult | null>(null)
  const [pendingD20, setPendingD20] = useState<{
    title: string
    subtitle?: string
    build: (mode: DiceMode) => DiceResult
  } | null>(null)
  const dice = useDiceLog()
  const init = block.initiative ?? abilityMod(block.stats[1] ?? 10)
  const immunities = [block.immunities, block.conditionImmunities].filter(Boolean).join('; ')

  function noteRoll(result: DiceResult): void {
    setLast(result)
    dice.record(result, block.name)
  }

  function queueD20Roll(title: string, build: (mode: DiceMode) => DiceResult, subtitle?: string): void {
    setPendingD20({ title, subtitle, build })
  }

  function confirmD20(mode: Extract<DiceMode, 'normal' | 'advantage' | 'disadvantage'>): void {
    if (!pendingD20) return
    noteRoll(pendingD20.build(mode))
    setPendingD20(null)
  }

  return (
    <section className="rounded border border-line bg-ink p-3">
      {pendingD20 ? (
        <D20ModeDialog
          title={pendingD20.title}
          subtitle={pendingD20.subtitle}
          onChoose={confirmD20}
          onClose={() => setPendingD20(null)}
        />
      ) : null}
      <div className={portrait ? 'flex items-start gap-3' : undefined}>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-display text-xl text-amber">{block.name}</div>
              <div className="text-xs italic text-muted">
                {[block.size, block.type, block.alignment].filter(Boolean).join(', ')}
                {block.cr != null ? ` · CR ${block.cr}` : ''}
              </div>
            </div>
            {!hideToolbar && onAddToCombat ? (
              <button
                type="button"
                onClick={onAddToCombat}
                className="shrink-0 rounded bg-amber px-2 py-1 text-xs font-semibold text-on-amber"
              >
                Add to combat
              </button>
            ) : null}
          </div>

          {last ? (
            <div className="mt-2 rounded bg-amber/15 px-2 py-1 text-sm">
              <span className="text-muted">{formatDicePlayerExpr(last)}</span>{' '}
              <span className="font-semibold text-amber">{last.total}</span>{' '}
              <span className="text-xs text-muted">{last.detail}</span>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-muted">Click Init, a score, a save, or an attack to roll.</p>
          )}

          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[13px]">
            <p>
              <span className="text-muted">AC</span> {block.ac ?? 10}
            </p>
            <p>
              <button
                type="button"
                onClick={() =>
                  queueD20Roll('Initiative', (mode) => rollD20(init, 'Initiative', mode), formatMod(init))
                }
                className="hover:text-amber"
              >
                <span className="text-muted">Initiative</span> {formatMod(init)} ({10 + init})
              </button>
            </p>
            <p className="col-span-2">
              <span className="text-muted">HP</span> {block.hp ?? 10}
              {block.hitDice ? ` (${block.hitDice})` : ''}
            </p>
            {block.speed ? (
              <p className="col-span-2">
                <span className="text-muted">Speed</span> {block.speed}
              </p>
            ) : null}
          </div>
        </div>
        {portrait ? <div className="w-40 shrink-0">{portrait}</div> : null}
      </div>

      <div className="mt-3 grid grid-cols-6 gap-1 text-center">
        {ABILITY_LABELS.map((label, index) => {
          const score = block.stats[index] ?? 10
          const mod = abilityMod(score)
          const save = saveFor(block, index)
          return (
            <div key={label} className="rounded bg-panel-2 py-1">
              <div className="text-[10px] tracking-wide text-muted">{label}</div>
              <button
                type="button"
                title={`${label} check`}
                onClick={() => queueD20Roll(`${label} check`, (mode) => rollD20(mod, label, mode), formatMod(mod))}
                className="block w-full hover:text-amber"
              >
                <div className="text-sm font-semibold leading-none">{score}</div>
                <div className="text-[10px] text-muted">Mod {formatMod(mod)}</div>
              </button>
              <button
                type="button"
                title={`${label} save`}
                onClick={() =>
                  queueD20Roll(`${label} save`, (mode) => rollD20(save, `${label} save`, mode), formatMod(save))
                }
                className="mt-0.5 block w-full text-[10px] text-amber-dim hover:text-amber"
              >
                Save {formatMod(save)}
              </button>
            </div>
          )
        })}
      </div>

      {Object.keys(block.skills).length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
          <span className="text-muted">Skills</span>
          {Object.entries(block.skills).map(([skill, mod]) => (
            <RollChip
              key={skill}
              label={skill}
              expr={`1d20${mod >= 0 ? '+' : ''}${mod}`}
              onRoll={noteRoll}
              onQueueD20={queueD20Roll}
              allowCrit={dice.allowCrit}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-2 space-y-0.5 text-[13px]">
        {block.vulnerabilities ? (
          <p>
            <span className="text-blood">Vulnerabilities</span> {block.vulnerabilities}
          </p>
        ) : null}
        {block.resistances ? (
          <p>
            <span className="text-muted">Resistances</span> {block.resistances}
          </p>
        ) : null}
        {immunities ? (
          <p>
            <span className="text-muted">Immunities</span> <KeywordText text={immunities} />
          </p>
        ) : null}
        {block.senses ? (
          <p>
            <span className="text-muted">Senses</span> <KeywordText text={block.senses} />
          </p>
        ) : null}
        {block.languages ? (
          <p>
            <span className="text-muted">Languages</span> {block.languages}
          </p>
        ) : null}
      </div>

      <ActionBlock title="Traits" items={block.traits} onRoll={noteRoll} onQueueD20={queueD20Roll} allowCrit={dice.allowCrit} />
      <ActionBlock title="Actions" items={block.actions} onRoll={noteRoll} onQueueD20={queueD20Roll} allowCrit={dice.allowCrit} />
      <ActionBlock
        title="Bonus Actions"
        items={block.bonusActions}
        onRoll={noteRoll}
        onQueueD20={queueD20Roll}
        allowCrit={dice.allowCrit}
      />
      <ActionBlock title="Reactions" items={block.reactions} onRoll={noteRoll} onQueueD20={queueD20Roll} allowCrit={dice.allowCrit} />
      <ActionBlock
        title="Legendary Actions"
        items={block.legendary}
        onRoll={noteRoll}
        onQueueD20={queueD20Roll}
        allowCrit={dice.allowCrit}
      />
    </section>
  )
}
