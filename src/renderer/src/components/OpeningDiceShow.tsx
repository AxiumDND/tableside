import { useEffect, useState } from 'react'
import {
  DICE_SHOW_FADE_IN_MS,
  DICE_SHOW_FADE_LEAD_MS,
  DICE_SHOW_MAX_FACES,
  type PlayerDiceShow
} from '../../../shared/playerDiceShow'
import { d20NaturalLabel, formatDicePlayerExpr } from '../lib/dice'

function dieClass(sides: number): string {
  if (sides <= 4) return 'is-d4'
  if (sides <= 6) return 'is-d6'
  if (sides <= 8) return 'is-d8'
  if (sides <= 10) return 'is-d10'
  if (sides <= 12) return 'is-d12'
  if (sides >= 100) return 'is-d100'
  return 'is-d20'
}

function modeLabel(mode: PlayerDiceShow['mode']): string | null {
  if (mode === 'advantage') return 'Advantage'
  if (mode === 'disadvantage') return 'Disadvantage'
  if (mode === 'crit') return 'Crit'
  return null
}

export default function OpeningDiceShow({ show }: { show: PlayerDiceShow }) {
  const [visible, setVisible] = useState(false)
  const fadingOut = Boolean(show.stoppingAt)
  const faces = show.groups.flatMap((group) =>
    group.rolls.map((value) => ({ sides: group.sides, value }))
  )
  const extra = Math.max(0, faces.length - DICE_SHOW_MAX_FACES)
  const shown = faces.slice(0, DICE_SHOW_MAX_FACES)
  const pair = show.mode === 'advantage' || show.mode === 'disadvantage'
  const exprLine = formatDicePlayerExpr(show)
  const naturalLabel = d20NaturalLabel(show)
  const keptFace =
    show.kept ?? (shown.length === 1 && shown[0]?.sides === 20 ? shown[0].value : undefined)

  useEffect(() => {
    setVisible(false)
    const t = window.setTimeout(() => setVisible(true), DICE_SHOW_FADE_LEAD_MS)
    return () => window.clearTimeout(t)
  }, [show.startedAt])

  return (
    <aside
      className={`player-dice-show${visible && !fadingOut ? ' is-in' : ''}${fadingOut ? ' is-out' : ''}${
        show.nat20 ? ' is-crit-success' : show.nat1 ? ' is-crit-fail' : ''
      }`}
      aria-label={`${exprLine} = ${show.total}`}
      style={{ transitionDuration: fadingOut ? undefined : `${DICE_SHOW_FADE_IN_MS}ms` }}
    >
      <p className="player-dice-show-source">{show.source?.trim() || 'Dice'}</p>
      <p className="player-dice-show-expr">{exprLine}</p>
      {modeLabel(show.mode) ? <p className="player-dice-show-mode">{modeLabel(show.mode)}</p> : null}
      {naturalLabel ? (
        <p className={`player-dice-show-natural${show.nat20 ? ' is-success' : ' is-fail'}`}>{naturalLabel}</p>
      ) : null}
      <div className="player-dice-show-dice">
        {shown.map((face, index) => {
          const dropped = pair && show.kept != null && face.sides === 20 && face.value !== show.kept
          const isKeptNatural =
            !dropped && face.sides === 20 && keptFace != null && face.value === keptFace
          const natClass =
            isKeptNatural && show.nat20 ? ' is-nat20' : isKeptNatural && show.nat1 ? ' is-nat1' : ''
          return (
            <div
              key={`${show.startedAt}-${index}`}
              className={`player-dice-show-die ${dieClass(face.sides)}${dropped ? ' is-dropped' : ''}${natClass}`}
            >
              <span className="player-dice-show-face">{face.value}</span>
              <span className="player-dice-show-sides">d{face.sides}</span>
            </div>
          )
        })}
        {extra > 0 ? <p className="player-dice-show-more">+{extra}</p> : null}
      </div>
      {show.bonus ? (
        <p className="player-dice-show-bonus">
          {show.bonus > 0 ? '+' : ''}
          {show.bonus}
        </p>
      ) : null}
      <p className="player-dice-show-total">{show.total}</p>
    </aside>
  )
}
