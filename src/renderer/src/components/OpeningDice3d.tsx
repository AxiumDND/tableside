import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DICE_3D_THROW_MS,
  dieShapeClass,
  planPlayerDice3dThrow,
  type PlayerDice3dDie
} from '../../../shared/playerDice3d'
import type { PlayerDiceShow } from '../../../shared/playerDiceShow'
import {
  DEFAULT_DICE_LOOK_PRESET,
  diceLookPreset,
  parseDiceLookPresetId,
  type DiceLookPresetId
} from '../../../shared/diceLookPreset'
import { dieGlyphShouldDot } from '../lib/playerDice3dLook'
import type { PlayerDice3dHandle } from '../lib/playerDice3dWorld'

function CssDiceThrow({
  dice,
  fadingOut,
  presetId
}: {
  dice: PlayerDice3dDie[]
  fadingOut: boolean
  presetId: DiceLookPresetId
}) {
  const look = diceLookPreset(presetId)
  return (
    <div
      className={`player-dice-3d-css${fadingOut ? ' is-out' : ''}`}
      data-dice-3d="css"
      data-dice-look={look.id}
      style={{
        ['--die-css-body' as string]: look.cssBody,
        ['--die-css-ink' as string]: look.cssInk
      }}
    >
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
          <span
            className={`player-dice-3d-css-face${dieGlyphShouldDot(die.label) ? ' is-dotted' : ''}${
              die.label.length > 1 ? ' is-wide' : ''
            }`}
          >
            {die.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function OpeningDice3d({ show }: { show: PlayerDiceShow }) {
  const hostRef = useRef<HTMLDivElement>(null)
  // Plan once per throw (`startedAt`). Fade-out sends a cloned PlayerState over IPC,
  // so `groups` / `kept` get new object identities for the same roll — depending on
  // those refs remounts WebGL and replays the throw while opacity fades.
  const { groups, mode: rollMode, kept, startedAt } = show
  const dice = useMemo(
    () => planPlayerDice3dThrow({ groups, mode: rollMode, kept }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- identity is the roll clock, not IPC-cloned arrays
    [startedAt]
  )
  const [mode, setMode] = useState<'webgl' | 'css' | null>(null)
  const [lookPreset, setLookPreset] = useState<DiceLookPresetId | null>(null)
  const fadingOut = Boolean(show.stoppingAt)

  useEffect(() => {
    let cancelled = false
    void window.tabledm?.getSettings?.()
      .then((prefs) => {
        if (!cancelled) setLookPreset(parseDiceLookPresetId(prefs.diceLookPreset))
      })
      .catch(() => {
        if (!cancelled) setLookPreset(DEFAULT_DICE_LOOK_PRESET)
      })
    // No tabledm (unit tests): use the default bag immediately.
    if (!window.tabledm?.getSettings) setLookPreset(DEFAULT_DICE_LOOK_PRESET)
    return () => {
      cancelled = true
    }
  }, [startedAt])

  useEffect(() => {
    const host = hostRef.current
    if (!host || dice.length === 0 || lookPreset == null) return
    let cancelled = false
    let handle: PlayerDice3dHandle | null = null
    void import('../lib/playerDice3dWorld')
      .then((mod) => {
        if (cancelled) return
        handle = mod.mountPlayerDice3d(host, dice, {
          throwMs: DICE_3D_THROW_MS,
          lookPreset
        })
        setMode(handle ? 'webgl' : 'css')
      })
      .catch(() => {
        if (!cancelled) setMode('css')
      })
    return () => {
      cancelled = true
      handle?.dispose()
    }
    // Remount only on a new roll or bag look — not when IPC clones fade-out state.
  }, [dice, lookPreset, startedAt])

  if (dice.length === 0) return null

  return (
    <div
      ref={hostRef}
      className={`player-dice-3d${fadingOut ? ' is-out' : ''}`}
      data-dice-3d={mode ?? 'pending'}
      data-dice-look={lookPreset ?? undefined}
      aria-hidden="true"
    >
      {mode === 'css' && lookPreset ? (
        <CssDiceThrow dice={dice} fadingOut={fadingOut} presetId={lookPreset} />
      ) : null}
    </div>
  )
}
