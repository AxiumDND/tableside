/** Mixer oneshot paths for bundled dice clatter (not campaign files). */
export const BUILTIN_DICE_ROLL_PATH = 'builtin:dice-roll'
export const BUILTIN_DICE_ROLL_MULTI_PATH = 'builtin:dice-roll-multi'

export type DiceRollSoundVariant = 'single' | 'multi'

const BUILTIN_PATHS = new Set([BUILTIN_DICE_ROLL_PATH, BUILTIN_DICE_ROLL_MULTI_PATH])

export function isBuiltinSfx(path: string): boolean {
  return BUILTIN_PATHS.has(path)
}

export function diceRollVariantForPath(path: string): DiceRollSoundVariant {
  return path === BUILTIN_DICE_ROLL_MULTI_PATH ? 'multi' : 'single'
}

/** Pick the builtin mixer path from how many dice were rolled. */
export function builtinDiceRollPath(dieCount: number): string {
  return dieCount >= 2 ? BUILTIN_DICE_ROLL_MULTI_PATH : BUILTIN_DICE_ROLL_PATH
}

function bitNoise(n: number): number {
  let x = n | 0
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d)
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b)
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296
}

type Hit = {
  t: number
  amp: number
  bodyHz: number
  decay: number
  noise: number
  clickHz?: number
}

const SAMPLE_RATE = 44100

function synthesize(hits: Hit[], durationSec: number): Float32Array {
  const count = Math.floor(SAMPLE_RATE * durationSec)
  const samples = new Float32Array(count)
  for (const hit of hits) {
    const start = Math.floor(hit.t * SAMPLE_RATE)
    const len = Math.floor(SAMPLE_RATE * hit.decay * 4.5)
    for (let i = 0; i < len && start + i < count; i += 1) {
      const t = i / SAMPLE_RATE
      const env = Math.exp(-t / hit.decay)
      const noise = (bitNoise(start + i + Math.floor(hit.bodyHz)) * 2 - 1) * hit.noise
      const body = Math.sin((2 * Math.PI * hit.bodyHz * t) / 1) * Math.max(0, 1 - t / (hit.decay * 2.8))
      const click = hit.clickHz
        ? Math.sin((2 * Math.PI * hit.clickHz * t) / 1) * Math.exp(-t / 0.0035) * 0.12
        : 0
      const tail = Math.min(1, (len - i) / (SAMPLE_RATE * 0.006))
      samples[start + i] += (noise * 0.5 + body * 0.42 + click) * env * hit.amp * tail
    }
  }
  let peak = 0
  for (let i = 0; i < count; i += 1) peak = Math.max(peak, Math.abs(samples[i] ?? 0))
  if (peak > 0) {
    const scale = 0.88 / peak
    for (let i = 0; i < count; i += 1) samples[i] = (samples[i] ?? 0) * scale
  }
  return samples
}

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

/** One die: a short clack and two quick bounces on felt. */
export function buildSingleDiceRollWav(): Uint8Array {
  const samples = synthesize(
    [
      { t: 0, amp: 1, bodyHz: 210, decay: 0.028, noise: 0.38, clickHz: 2800 },
      { t: 0.055, amp: 0.34, bodyHz: 175, decay: 0.02, noise: 0.28 },
      { t: 0.082, amp: 0.15, bodyHz: 158, decay: 0.016, noise: 0.2 }
    ],
    0.42
  )
  return encodeWav(samples)
}

/** Several dice: a longer tumble with staggered impacts. */
export function buildMultiDiceRollWav(): Uint8Array {
  const samples = synthesize(
    [
      { t: 0, amp: 0.82, bodyHz: 205, decay: 0.03, noise: 0.42, clickHz: 2600 },
      { t: 0.035, amp: 0.74, bodyHz: 230, decay: 0.028, noise: 0.4, clickHz: 3100 },
      { t: 0.078, amp: 0.68, bodyHz: 188, decay: 0.027, noise: 0.38 },
      { t: 0.12, amp: 0.58, bodyHz: 215, decay: 0.026, noise: 0.36 },
      { t: 0.165, amp: 0.52, bodyHz: 172, decay: 0.024, noise: 0.34 },
      { t: 0.21, amp: 0.46, bodyHz: 198, decay: 0.023, noise: 0.32 },
      { t: 0.26, amp: 0.4, bodyHz: 165, decay: 0.022, noise: 0.3 },
      { t: 0.31, amp: 0.34, bodyHz: 190, decay: 0.021, noise: 0.28 },
      { t: 0.38, amp: 0.28, bodyHz: 158, decay: 0.02, noise: 0.25 },
      { t: 0.45, amp: 0.22, bodyHz: 182, decay: 0.019, noise: 0.22 },
      { t: 0.52, amp: 0.18, bodyHz: 150, decay: 0.018, noise: 0.2 },
      { t: 0.61, amp: 0.14, bodyHz: 168, decay: 0.017, noise: 0.18 },
      { t: 0.72, amp: 0.1, bodyHz: 145, decay: 0.016, noise: 0.15 },
      { t: 0.84, amp: 0.07, bodyHz: 160, decay: 0.014, noise: 0.12 }
    ],
    1.05
  )
  return encodeWav(samples)
}

/** @deprecated Use buildSingleDiceRollWav or buildMultiDiceRollWav. */
export function buildDiceRollWav(): Uint8Array {
  return buildMultiDiceRollWav()
}

function buildWavForVariant(variant: DiceRollSoundVariant): Uint8Array {
  return variant === 'multi' ? buildMultiDiceRollWav() : buildSingleDiceRollWav()
}

const cachedUrls = new Map<string, string>()

export function diceRollSoundUrl(pathOrVariant: string | DiceRollSoundVariant = 'single'): string {
  const variant =
    pathOrVariant === 'multi' || pathOrVariant === 'single'
      ? pathOrVariant
      : diceRollVariantForPath(pathOrVariant)
  const cached = cachedUrls.get(variant)
  if (cached) return cached
  const bytes = buildWavForVariant(variant)
  if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const copy = bytes.slice()
    const url = URL.createObjectURL(new Blob([copy.buffer], { type: 'audio/wav' }))
    cachedUrls.set(variant, url)
    return url
  }
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i] ?? 0)
  const url = `data:audio/wav;base64,${btoa(binary)}`
  cachedUrls.set(variant, url)
  return url
}

export function playDiceRollSound(
  gain = 1,
  deviceId = '',
  variant: DiceRollSoundVariant = 'single'
): void {
  if (typeof Audio === 'undefined') return
  const volume = Math.min(1, Math.max(0, gain))
  if (volume <= 0) return
  const el = new Audio(diceRollSoundUrl(variant))
  el.volume = volume
  void (async () => {
    if (typeof el.setSinkId === 'function') {
      try {
        await el.setSinkId(deviceId)
      } catch {
        if (deviceId) {
          try {
            await el.setSinkId('')
          } catch {
            /* ignore */
          }
        }
      }
    }
    void el.play()?.catch?.(() => undefined)
  })()
}
