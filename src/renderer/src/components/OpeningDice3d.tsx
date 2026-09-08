import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DICE_3D_THROW_MS,
  dieShapeClass,
  planPlayerDice3dThrow,
  type PlayerDice3dDie
} from '../../../shared/playerDice3d'
import type { PlayerDiceShow } from '../../../shared/playerDiceShow'
import type { PlayerDice3dHandle } from '../lib/playerDice3dWorld'

function CssDiceThrow({ dice, fadingOut }: { dice: PlayerDice3dDie[]; fadingOut: boolean }) {
  return (
    <div className={`player-dice-3d-css${fadingOut ? ' is-out' : ''}`} data-dice-3d="css">
      {dice.map((die, index) => (
        <div
          key={`${die.sides}-${die.label}-${index}`}
          className={`player-dice-3d-css-die ${dieShapeClass(die.sides)}${die.dropped ? ' is-dropped' : ''}`}
          style={{
            ['--die-i' as string]: String(index),
            ['--die-n' as string]: String(dice.length),
            animationDuration: `${DICE_3D_THROW_MS}ms`
          }}
        >
          <span className="player-dice-3d-css-face">{die.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function OpeningDice3d({ show }: { show: PlayerDiceShow }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const dice = useMemo(() => planPlayerDice3dThrow(show), [show])
  const [mode, setMode] = useState<'webgl' | 'css' | null>(null)
  const fadingOut = Boolean(show.stoppingAt)

  useEffect(() => {
    const host = hostRef.current
    if (!host || dice.length === 0) return
    let cancelled = false
    let handle: PlayerDice3dHandle | null = null
    void import('../lib/playerDice3dWorld')
      .then((mod) => {
        if (cancelled) return
        handle = mod.mountPlayerDice3d(host, dice, { throwMs: DICE_3D_THROW_MS })
        setMode(handle ? 'webgl' : 'css')
      })
      .catch(() => {
        if (!cancelled) setMode('css')
      })
    return () => {
      cancelled = true
      handle?.dispose()
    }
  }, [dice, show.startedAt])

  if (dice.length === 0) return null

  return (
    <div
      ref={hostRef}
      className={`player-dice-3d${fadingOut ? ' is-out' : ''}`}
      data-dice-3d={mode ?? 'pending'}
      aria-hidden="true"
    >
      {mode === 'css' ? <CssDiceThrow dice={dice} fadingOut={fadingOut} /> : null}
    </div>
  )
}
