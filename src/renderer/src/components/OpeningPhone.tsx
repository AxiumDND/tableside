import { useEffect, useRef, useState } from 'react'
import type { PlayerPhone } from '../../../shared/types'
import { PHONE_FADE_IN_MS, PHONE_FADE_LEAD_MS } from '../../../shared/playerPhone'

export default function OpeningPhone({ phone }: { phone: PlayerPhone }) {
  const [visible, setVisible] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    setVisible(false)
    const t = window.setTimeout(() => setVisible(true), PHONE_FADE_LEAD_MS)
    return () => window.clearTimeout(t)
  }, [phone.startedAt])

  useEffect(() => {
    if (phone.answeredAt || phone.stoppingAt || phone.ringSrc) return
    return startSynthRing()
  }, [phone.startedAt, phone.answeredAt, phone.stoppingAt, phone.ringSrc])

  useEffect(() => {
    const el = audioRef.current
    if (!el || !phone.ringSrc) return
    if (phone.answeredAt || phone.stoppingAt) {
      el.pause()
      return
    }
    el.loop = true
    el.currentTime = 0
    void el.play().catch(() => undefined)
    return () => {
      el.pause()
    }
  }, [phone.startedAt, phone.ringSrc, phone.answeredAt, phone.stoppingAt])

  const caller = phone.title?.trim() || 'Unknown'
  const fadingOut = Boolean(phone.stoppingAt)
  const connected = Boolean(phone.answeredAt) && !fadingOut

  return (
    <div
      className={`opening-phone${visible && !fadingOut ? ' is-in' : ''}${fadingOut ? ' is-out' : ''}`}
      aria-label={connected ? `Call with ${caller}` : `Incoming call from ${caller}`}
      style={{
        transitionDuration: fadingOut ? undefined : `${PHONE_FADE_IN_MS}ms`
      }}
    >
      {phone.ringSrc ? <audio ref={audioRef} src={phone.ringSrc} preload="auto" /> : null}
      <div className="opening-phone-device">
        <div className="opening-phone-screen">
          <div className="opening-phone-island" aria-hidden />
          <p className="opening-phone-status">{connected ? 'Connected' : 'Incoming Call'}</p>
          <div className="opening-phone-avatar">
            {phone.photoSrc ? (
              <img src={phone.photoSrc} alt="" />
            ) : (
              <span>{callerInitials(caller)}</span>
            )}
          </div>
          <p className="opening-phone-name">{caller}</p>
          <p className="opening-phone-sub">{connected ? 'mobile' : 'mobile · ringing'}</p>
          <div className="opening-phone-actions" aria-hidden>
            <span className={`opening-phone-btn is-decline${connected ? ' is-hang' : ''}`}>
              <DeclineIcon />
            </span>
            {!connected ? (
              <span className="opening-phone-btn is-accept">
                <AcceptIcon />
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function callerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts[parts.length - 1]!.slice(0, 1)}`.toUpperCase()
}

function startSynthRing(): () => void {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return () => undefined
  const ctx = new AudioCtx()
  const master = ctx.createGain()
  master.gain.value = 0.16
  master.connect(ctx.destination)
  let stopped = false

  function burst(): void {
    if (stopped) return
    const now = ctx.currentTime
    const envelope = ctx.createGain()
    envelope.gain.setValueAtTime(0, now)
    envelope.gain.linearRampToValueAtTime(0.85, now + 0.03)
    envelope.gain.setValueAtTime(0.85, now + 1.9)
    envelope.gain.linearRampToValueAtTime(0, now + 2.05)
    envelope.connect(master)
    for (const freq of [440, 480]) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(envelope)
      osc.start(now)
      osc.stop(now + 2.08)
    }
  }

  void ctx.resume().catch(() => undefined)
  burst()
  const timer = window.setInterval(burst, 6000)
  return () => {
    stopped = true
    window.clearInterval(timer)
    void ctx.close().catch(() => undefined)
  }
}

function DeclineIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden>
      <path d="M6.6 10.8c3.1 3.1 6.5 5.2 7.6 5.8l2-2c.3-.3.8-.4 1.2-.2 1.3.5 2.7.8 4.1.8.4 0 .8.3.8.8v3.5c0 .4-.3.8-.8.8C10.6 20.3 3.7 13.4 3.7 2.8c0-.4.3-.8.8-.8H8c.4 0 .8.3.8.8 0 1.4.3 2.8.8 4.1.1.4 0 .8-.3 1.1l-2 2z" />
    </svg>
  )
}

function AcceptIcon() {
  return <DeclineIcon />
}
