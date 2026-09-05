import type { PlayerHourglass } from './types'

export const HOURGLASS_FADE_IN_MS = 1600
export const HOURGLASS_FADE_LEAD_MS = 80
export const HOURGLASS_FADE_OUT_MS = 1400
export const HOURGLASS_MIN_MINUTES = 1
export const HOURGLASS_MAX_MINUTES = 120
export const HOURGLASS_DEFAULT_MINUTES = 5
export const HOURGLASS_URGENT_MS = 30_000
export const BUILTIN_HOURGLASS_CHIME_PATH = 'builtin:hourglass-chime'

export type HourglassPhase = 'wait' | 'running' | 'paused' | 'expired'

export function clampHourglassMinutes(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return HOURGLASS_DEFAULT_MINUTES
  return Math.min(HOURGLASS_MAX_MINUTES, Math.max(HOURGLASS_MIN_MINUTES, Math.round(n)))
}

export function hourglassDurationMs(minutes: unknown): number {
  return clampHourglassMinutes(minutes) * 60_000
}

export function hourglassRemainingMs(state: PlayerHourglass, now = Date.now()): number {
  if (state.expiredAt != null) return 0
  if (state.endsAt != null) return Math.max(0, state.endsAt - now)
  if (state.remainingMs != null) return Math.max(0, state.remainingMs)
  return Math.max(0, state.durationMs)
}

export function hourglassProgress(state: PlayerHourglass, now = Date.now()): number {
  const duration = Math.max(1, state.durationMs)
  return Math.min(1, Math.max(0, hourglassRemainingMs(state, now) / duration))
}

export function hourglassPhase(state: PlayerHourglass, now = Date.now()): HourglassPhase {
  if (hourglassRemainingMs(state, now) <= 0) return 'expired'
  if (state.endsAt != null) return 'running'
  if (state.remainingMs != null) return 'paused'
  return 'wait'
}

export function hourglassIsUrgent(state: PlayerHourglass, now = Date.now()): boolean {
  const remaining = hourglassRemainingMs(state, now)
  return remaining > 0 && remaining <= HOURGLASS_URGENT_MS
}

/** `5:00`, `10:00`, `0:42`. Counts down with ceil so 1ms still reads 0:01. */
export function formatHourglassClock(ms: number): string {
  const safe = Math.max(0, Number.isFinite(ms) ? ms : 0)
  const totalSec = safe <= 0 ? 0 : Math.max(1, Math.ceil(safe / 1000))
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const SAMPLE_RATE = 44100

function encodeWav(samples: Float32Array): Uint8Array {
  const dataSize = samples.length * 2
  const bytes = new Uint8Array(44 + dataSize)
  const view = new DataView(bytes.buffer)
  const ascii = (offset: number, text: string): void => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i))
  }
  ascii(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  ascii(8, 'WAVE')
  ascii(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  ascii(36, 'data')
  view.setUint32(40, dataSize, true)
  for (let i = 0; i < samples.length; i += 1) {
    const clipped = Math.max(-1, Math.min(1, samples[i] ?? 0))
    view.setInt16(44 + i * 2, Math.round(clipped * 32767), true)
  }
  return bytes
}

/** Soft two-note brass chime for the empty glass. */
export function buildHourglassChimeWav(): Uint8Array {
  const durationSec = 0.92
  const count = Math.floor(SAMPLE_RATE * durationSec)
  const samples = new Float32Array(count)
  const notes = [
    { t: 0, hz: 784, amp: 0.72, decay: 0.28 },
    { t: 0.14, hz: 1175, amp: 0.58, decay: 0.34 }
  ]
  for (const note of notes) {
    const start = Math.floor(note.t * SAMPLE_RATE)
    const len = Math.floor(SAMPLE_RATE * note.decay * 4.2)
    for (let i = 0; i < len && start + i < count; i += 1) {
      const t = i / SAMPLE_RATE
      const env = Math.exp(-t / note.decay)
      const fund = Math.sin(2 * Math.PI * note.hz * t)
      const third = Math.sin(2 * Math.PI * note.hz * 2 * t) * 0.28
      const fifth = Math.sin(2 * Math.PI * note.hz * 3 * t) * 0.1
      samples[start + i] += (fund + third + fifth) * env * note.amp
    }
  }
  let peak = 0
  for (let i = 0; i < count; i += 1) peak = Math.max(peak, Math.abs(samples[i] ?? 0))
  if (peak > 0) {
    const scale = 0.82 / peak
    for (let i = 0; i < count; i += 1) samples[i] = (samples[i] ?? 0) * scale
  }
  return encodeWav(samples)
}

let cachedChimeUrl: string | null = null

export function hourglassChimeUrl(): string {
  if (cachedChimeUrl) return cachedChimeUrl
  const bytes = buildHourglassChimeWav()
  if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const copy = bytes.slice()
    cachedChimeUrl = URL.createObjectURL(new Blob([copy.buffer], { type: 'audio/wav' }))
    return cachedChimeUrl
  }
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i] ?? 0)
  cachedChimeUrl = `data:audio/wav;base64,${btoa(binary)}`
  return cachedChimeUrl
}
