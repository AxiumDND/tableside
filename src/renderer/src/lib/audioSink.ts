/** Route HTML media playback to the Music panel output device. */
export async function applyAudioSink(el: HTMLMediaElement, deviceId: string): Promise<void> {
  if (typeof el.setSinkId !== 'function') return
  try {
    await el.setSinkId(deviceId)
  } catch {
    if (deviceId) {
      try {
        await el.setSinkId('')
      } catch {
        /* keep going */
      }
    }
  }
}

export async function playOneshot(url: string, gain: number, deviceId: string): Promise<void> {
  const el = new Audio(url)
  el.volume = gain
  await applyAudioSink(el, deviceId)
  await el.play()
}

type SinkableAudioContext = AudioContext & { setSinkId?: (id: string) => Promise<void> }

/** Web Audio output (e.g. synthesized phone ring) on the selected device when supported. */
export async function createAudioContext(deviceId: string): Promise<AudioContext | null> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return null
  const ctx = new AudioCtx() as SinkableAudioContext
  if (deviceId && typeof ctx.setSinkId === 'function') {
    try {
      await ctx.setSinkId(deviceId)
    } catch {
      /* default output */
    }
  }
  return ctx
}
