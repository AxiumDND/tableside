import type { PlayerCalendarMark } from '../../../shared/calendar'
import { calendarPlayerMarkLabel } from '../../../shared/calendar'

function SunriseIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <line x1="32" y1="8" x2="32" y2="18" />
      <line x1="12" y1="20" x2="19" y2="27" />
      <line x1="52" y1="20" x2="45" y2="27" />
      <line x1="6" y1="38" x2="16" y2="38" />
      <line x1="58" y1="38" x2="48" y2="38" />
      <path d="M18 42a14 14 0 0 0 28 0" />
      <line x1="4" y1="44" x2="60" y2="44" />
    </svg>
  )
}

function MorningIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="28" r="11" />
      <line x1="32" y1="6" x2="32" y2="13" />
      <line x1="32" y1="43" x2="32" y2="50" />
      <line x1="10" y1="28" x2="17" y2="28" />
      <line x1="47" y1="28" x2="54" y2="28" />
      <line x1="16" y1="12" x2="21" y2="17" />
      <line x1="48" y1="12" x2="43" y2="17" />
      <line x1="16" y1="44" x2="21" y2="39" />
      <line x1="48" y1="44" x2="43" y2="39" />
    </svg>
  )
}

function AfternoonIcon() {
  return (
    <svg viewBox="0 0 64 64" className="is-afternoon" aria-hidden="true">
      <circle cx="32" cy="34" r="11" />
      <line x1="32" y1="14" x2="32" y2="20" />
      <line x1="32" y1="48" x2="32" y2="56" />
      <line x1="12" y1="34" x2="18" y2="34" />
      <line x1="46" y1="34" x2="52" y2="34" />
      <line x1="18" y1="20" x2="22" y2="24" />
      <line x1="46" y1="20" x2="42" y2="24" />
      <line x1="17" y1="50" x2="22" y2="45" />
      <line x1="47" y1="50" x2="42" y2="45" />
    </svg>
  )
}

function SunsetIcon() {
  return (
    <svg viewBox="0 0 64 64" className="is-sunset" aria-hidden="true">
      <line x1="32" y1="10" x2="32" y2="18" />
      <line x1="12" y1="22" x2="19" y2="29" />
      <line x1="52" y1="22" x2="45" y2="29" />
      <line x1="6" y1="40" x2="16" y2="40" />
      <line x1="58" y1="40" x2="48" y2="40" />
      <path d="M18 44a14 14 0 0 0 28 0" />
      <line x1="4" y1="46" x2="60" y2="46" />
    </svg>
  )
}

function NightIcon() {
  return (
    <svg viewBox="0 0 64 64" className="is-night" aria-hidden="true">
      <path d="M40 12a18 18 0 1 0 10 32 16 16 0 0 1-10-32z" />
    </svg>
  )
}

function MarkIcon({ mark }: { mark: PlayerCalendarMark }) {
  if (mark === 'sunrise') return <SunriseIcon />
  if (mark === 'morning') return <MorningIcon />
  if (mark === 'afternoon') return <AfternoonIcon />
  if (mark === 'sunset') return <SunsetIcon />
  return <NightIcon />
}

export default function PlayerCalendarLight({ mark }: { mark: PlayerCalendarMark }) {
  const label = calendarPlayerMarkLabel(mark)
  return (
    <div className={`player-calendar-light is-${mark}`} aria-label={label}>
      <MarkIcon mark={mark} />
      <p className="player-calendar-light-label">{label}</p>
    </div>
  )
}
