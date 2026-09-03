/** Mixer oneshot path for the bundled dice-check clatter (not a campaign file). */
export const BUILTIN_DICE_ROLL_PATH = 'builtin:dice-roll'

export function isBuiltinSfx(path: string): boolean {
  return path === BUILTIN_DICE_ROLL_PATH
}

function bitNoise(n: number): number {
  let x = n | 0
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d)
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b)
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296
}

/** Wooden clatter timed with the on-screen tumble. */
export function buildDiceRollWav(): Uint8Array {
  const sampleRate = 22050
  const duration = 1.15
  const count = Math.floor(sampleRate * duration)
  const samples = new Float32Array(count)
  const hits = [0.03, 0.09, 0.16, 0.24, 0.33, 0.43, 0.54, 0.66, 0.78, 0.9]
  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate
    samples[i] += (bitNoise(i) * 2 - 1) * 0.08 * Math.exp(-t * 2.2)
  }
  for (let h = 0; h < hits.length; h += 1) {
    const start = Math.floor(hits[h] * sampleRate)
    const hitLen = Math.floor(sampleRate * (0.045 + (h % 3) * 0.012))
    const freq = 480 + h * 70 + (h % 2) * 110
    const amp = 0.85 - h * 0.04
    for (let i = 0; i < hitLen && start + i < count; i += 1) {
      const env = Math.exp(-i / (sampleRate * 0.018))
      const noise = bitNoise(start + i + h * 97) * 2 - 1
      const tone = Math.sin((2 * Math.PI * freq * i) / sampleRate)
      const click = Math.sin((2 * Math.PI * (freq * 2.3) * i) / sampleRate)
      samples[start + i] += (noise * 0.7 + tone * 0.22 + click * 0.18) * env * amp
    }
  }
  const dataSize = count * 2
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
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  ascii(36, 'data')
  view.setUint32(40, dataSize, true)
  for (let i = 0; i < count; i += 1) {
    const clipped = Math.max(-1, Math.min(1, samples[i] ?? 0))
    view.setInt16(44 + i * 2, Math.round(clipped * 32767), true)
  }
  return bytes
}

let cachedUrl: string | null = null

export function diceRollSoundUrl(): string {
  if (cachedUrl) return cachedUrl
  const bytes = buildDiceRollWav()
  if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const copy = bytes.slice()
    cachedUrl = URL.createObjectURL(new Blob([copy.buffer], { type: 'audio/wav' }))
    return cachedUrl
  }
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i] ?? 0)
  cachedUrl = `data:audio/wav;base64,${btoa(binary)}`
  return cachedUrl
}

export function playDiceRollSound(gain = 1, deviceId = ''): void {
  if (typeof Audio === 'undefined') return
  const volume = Math.min(1, Math.max(0, gain))
  if (volume <= 0) return
  const el = new Audio(diceRollSoundUrl())
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
