import { useEffect, useState } from 'react'
import type { PlayerBoxOfDoom } from '../../../shared/types'
import {
  BOX_OF_DOOM_FADE_IN_MS,
  BOX_OF_DOOM_FADE_LEAD_MS,
  BOX_OF_DOOM_VERDICT_AT,
  boxOfDoomIsPair,
  boxOfDoomPhase,
  boxOfDoomSfxDelayMs,
  tumbleFace,
  type BoxOfDoomPhase
} from '../../../shared/boxOfDoom'
import { playDiceRollSound } from '../../../shared/diceRollSound'
import { useAudioOutput } from '../hooks/useAudioOutput'

function titleFor(roll: PlayerBoxOfDoom): string {
  if (roll.label?.trim()) return roll.label.trim()
  if (roll.mode === 'advantage') return 'Advantage'
  if (roll.mode === 'disadvantage') return 'Disadvantage'
  return 'Box of Doom'
}

export default function OpeningBoxOfDoom({
  roll,
  suppressSound
}: {
  roll: PlayerBoxOfDoom
  suppressSound?: boolean
}) {
  const [now, setNow] = useState(() => Date.now())
  const [visible, setVisible] = useState(false)
  const fadingOut = Boolean(roll.stoppingAt)
  const pair = boxOfDoomIsPair(roll.mode)
  const outputDeviceId = useAudioOutput()

  useEffect(() => {
    setVisible(false)
    const t = window.setTimeout(() => setVisible(true), BOX_OF_DOOM_FADE_LEAD_MS)
    return () => window.clearTimeout(t)
  }, [roll.startedAt])

  useEffect(() => {
    if (suppressSound || roll.rolledAt == null || roll.sound === false || roll.stoppingAt) return
    const delay = boxOfDoomSfxDelayMs(roll.rolledAt)
    const timer = window.setTimeout(() => {
      playDiceRollSound(0.95, outputDeviceId, pair ? 'pair' : 'single')
    }, delay)
    return () => window.clearTimeout(timer)
  }, [outputDeviceId, pair, roll.rolledAt, roll.sound, roll.stoppingAt, suppressSound])

  useEffect(() => {
    if (roll.rolledAt == null) return
    setNow(Date.now())
    let frame = 0
    const tick = (): void => {
      const t = Date.now()
      setNow(t)
      if (roll.rolledAt != null && t - roll.rolledAt < BOX_OF_DOOM_VERDICT_AT + 80) {
        frame = window.requestAnimationFrame(tick)
      }
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [roll.rolledAt])

  const phase: BoxOfDoomPhase = boxOfDoomPhase(roll, now)
  const tumbling = phase === 'tumble'
  const landed = phase === 'reveal' || phase === 'verdict'
  const verdict = phase === 'verdict'
  const clock = roll.rolledAt ?? roll.startedAt
  const faces = pair
    ? [
        phase === 'wait' ? '?' : tumbling ? tumbleFace(clock, now, 0) : (roll.rolls?.[0] ?? roll.d20 ?? '?'),
        phase === 'wait' ? '?' : tumbling ? tumbleFace(clock, now, 1) : (roll.rolls?.[1] ?? '?')
      ]
    : [phase === 'wait' ? '?' : tumbling ? tumbleFace(clock, now, 0) : (roll.d20 ?? '?')]
  const shownTotal = tumbling ? faces[0] : roll.total
  const tone = roll.success ? 'is-success' : 'is-fail'
  const dieClass = phase === 'wait' ? ' is-waiting' : tumbling ? ' is-spinning' : ' is-landed'
  const signed = `${roll.modifier >= 0 ? '+' : '−'} ${Math.abs(roll.modifier)}`

  let status = 'Box of Doom'
  if (fadingOut) status = 'Box of Doom — fading out'
  else if (verdict) status = roll.success ? 'Box of Doom — success' : 'Box of Doom — failure'
  else if (tumbling || phase === 'reveal') status = 'Box of Doom — rolling'
  else status = 'Box of Doom — waiting to roll'

  return (
    <div
      className={`box-of-doom${pair ? ' has-pair' : ''}${verdict ? ` ${tone}` : ''}${
        visible && !fadingOut ? ' is-in' : ''
      }${fadingOut ? ' is-out' : ''}`}
      aria-label={status}
      style={{
        transitionDuration: fadingOut ? undefined : `${BOX_OF_DOOM_FADE_IN_MS}ms`
      }}
    >
      <p className="box-of-doom-kicker">{titleFor(roll)}</p>
      <div className="box-of-doom-dice">
        {faces.map((face, index) => {
          const value = typeof face === 'number' ? face : null
          const kept = !pair || roll.d20 == null || value === roll.d20
          const dropped = landed && pair && !kept
          const crit =
            landed && kept && value === 20 ? ' is-nat20' : landed && kept && value === 1 ? ' is-nat1' : ''
          return (
            <div
              key={index}
              className={`box-of-doom-die${dieClass}${dropped ? ' is-dropped' : ''}${crit}`}
            >
              <span className="box-of-doom-face">{face}</span>
            </div>
          )
        })}
      </div>
      <p className="box-of-doom-math">
        {phase === 'wait'
          ? 'Waiting to roll'
          : tumbling
            ? 'Rolling…'
            : pair
              ? `${roll.rolls?.join(' / ') ?? roll.d20} → ${roll.d20} ${signed} = ${shownTotal}`
              : `${roll.d20} ${signed} = ${shownTotal}`}
      </p>
      <p className="box-of-doom-dc">DC {roll.dc}</p>
      {verdict ? (
        <p className={`box-of-doom-verdict ${tone}`}>{roll.success ? 'Success' : 'Failure'}</p>
      ) : null}
    </div>
  )
}
