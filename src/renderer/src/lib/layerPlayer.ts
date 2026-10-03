import { MIXER_FADE_MS } from '../../../shared/audio'
import { applyAudioSink } from './audioSink'

const EOS_SLOP_SEC = 0.08
const WATCH_MS = 400

function fadeTo(
  el: HTMLAudioElement,
  target: number,
  ms: number,
  isCurrent: () => boolean = () => true
): Promise<void> {
  const start = el.volume
  const delta = target - start
  if (ms <= 0 || Math.abs(delta) < 0.01) {
    el.volume = target
    return Promise.resolve()
  }
  const from = performance.now()
  return new Promise((resolve) => {
    const step = (now: number): void => {
      if (!isCurrent()) {
        resolve()
        return
      }
      const t = Math.min(1, (now - from) / ms)
      el.volume = Math.min(1, Math.max(0, start + delta * t))
      if (t < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}

/** Chromium on Windows (Media Foundation MP3) often reports Infinity/NaN duration. */
export function hasFiniteDuration(duration: number): boolean {
  return Number.isFinite(duration) && duration > 0
}

/** True when the element is at EOS, including VBR MP3s whose duration is slightly short. */
export function mediaPlaybackFinished(el: {
  ended: boolean
  currentTime: number
  duration: number
}): boolean {
  if (el.ended) return true
  if (!hasFiniteDuration(el.duration)) return false
  return el.currentTime > 0 && el.currentTime >= el.duration - EOS_SLOP_SEC
}

export interface LayerPlayerOptions {
  createAudio?: () => HTMLAudioElement
  fadeMs?: number
  watchMs?: number
}

/**
 * Dual-element music/ambience sink.
 *
 * Windows Chromium plays MP3 through Media Foundation. Native `loop` can fail to
 * seek to 0, `ended` may not fire, `duration` may be NaN/Infinity, and `timeupdate`
 * can stall at the last frame. Playlist advance and single-file loop therefore
 * treat unexpected pause / `ended` / known EOF as the end, and loop by rewinding
 * the same element (same-src on a second element is also unreliable there).
 */
export class LayerPlayer {
  private a: HTMLAudioElement
  private b: HTMLAudioElement
  private front: HTMLAudioElement
  private back: HTMLAudioElement
  private generation = -1
  private gain = 0
  private src: string | null = null
  private playing = false
  private sinkId = ''
  private token = 0
  private advanced = false
  private hadProgress = false
  private ignorePause = 0
  private restarting = false
  private lastRestartAt = 0
  private watch: ReturnType<typeof setInterval> | null = null
  private readonly fadeMs: number
  private readonly watchMs: number

  constructor(
    private loop: boolean,
    private onEnded: () => void,
    private onError: (message: string) => void,
    private onClock: (current: number, duration: number) => void,
    options: LayerPlayerOptions = {}
  ) {
    const create = options.createAudio ?? ((): HTMLAudioElement => new Audio())
    this.fadeMs = options.fadeMs ?? MIXER_FADE_MS
    this.watchMs = options.watchMs ?? WATCH_MS
    this.a = create()
    this.b = create()
    this.front = this.a
    this.back = this.b
    for (const el of [this.a, this.b]) {
      el.preload = 'auto'
      el.loop = loop
      el.addEventListener('timeupdate', () => this.handleTime(el))
      el.addEventListener('loadedmetadata', () => this.reportClock(el))
      el.addEventListener('ended', () => this.handleEnded(el))
      el.addEventListener('pause', () => this.handlePause(el))
    }
    this.ensureWatch()
  }

  setLoop(loop: boolean): void {
    this.loop = loop
    this.a.loop = loop
    this.b.loop = loop
    if (loop) this.advanced = false
  }

  private ensureWatch(): void {
    if (this.watch != null) return
    this.watch = setInterval(() => this.pollEos(), this.watchMs)
  }

  private reportClock(el: HTMLAudioElement): void {
    if (el !== this.front || !this.playing) return
    const duration = el.duration
    const currentTime = el.currentTime
    if (!hasFiniteDuration(duration) || !Number.isFinite(currentTime)) {
      this.onClock(0, 0)
      return
    }
    this.onClock(currentTime, duration)
  }

  private handleTime(el: HTMLAudioElement): void {
    this.reportClock(el)
    if (!this.playing || el !== this.front || this.restarting) return
    if (el.currentTime > 0.15) this.hadProgress = true
    if (this.loop) {
      if (mediaPlaybackFinished(el)) void this.restartFront()
      return
    }
    if (this.advanced) return
    const duration = el.duration
    const currentTime = el.currentTime
    if (!hasFiniteDuration(duration)) return
    const fadeSec = this.fadeMs / 1000
    const lead = duration > fadeSec + 0.25 ? fadeSec : Math.max(0.25, duration / 2)
    if (duration - currentTime <= lead) this.requestNext()
  }

  private handleEnded(el: HTMLAudioElement): void {
    if (el !== this.front || this.restarting) return
    if (this.loop) {
      void this.restartFront()
      return
    }
    this.requestNext()
  }

  private handlePause(el: HTMLAudioElement): void {
    if (this.ignorePause > 0 || el !== this.front || !this.playing || this.restarting) return
    if (!this.hadProgress) return
    // Own pause() is wrapped in ignorePause. Windows MF MP3 often pauses at EOS
    // without `ended`, especially when duration is Infinity.
    if (this.loop) {
      void this.restartFront()
      return
    }
    this.requestNext()
  }

  /** Backup when `timeupdate` stalls at EOF and `ended` never fires. */
  pollEos(): void {
    if (!this.playing || this.advanced || this.restarting) return
    const el = this.front
    if (el.ended || mediaPlaybackFinished(el)) {
      this.handleEnded(el)
    }
  }

  private requestNext(): void {
    if (this.advanced || this.loop) return
    this.advanced = true
    this.onEnded()
  }

  private withIgnoredPause(fn: () => void): void {
    this.ignorePause += 1
    try {
      fn()
    } finally {
      this.ignorePause -= 1
    }
  }

  private async restartFront(): Promise<void> {
    if (!this.loop || !this.playing || this.restarting) return
    const now = Date.now()
    if (this.lastRestartAt > 0 && now - this.lastRestartAt < 250) return
    this.restarting = true
    this.lastRestartAt = now || 1
    const el = this.front
    const src = el.src
    try {
      try {
        el.currentTime = 0
      } catch {
        /* InvalidStateError while seeking some MP3s */
      }
      // Seek-to-0 is a no-op on some Windows MP3 decoders at EOS — reload src.
      if (el.currentTime > 0.25 && src) {
        this.withIgnoredPause(() => {
          el.pause()
          el.removeAttribute('src')
          el.load()
        })
        el.src = src
        el.loop = this.loop
      }
      this.hadProgress = false
      el.volume = this.gain
      this.ignorePause += 1
      try {
        await applyAudioSink(el, this.sinkId)
      } finally {
        this.ignorePause -= 1
      }
      await el.play()
    } catch {
      this.onError('Could not play that track. Check the file and Output device.')
    } finally {
      this.restarting = false
    }
  }

  async setSink(deviceId: string): Promise<void> {
    this.sinkId = deviceId
    this.ignorePause += 1
    try {
      await Promise.all([applyAudioSink(this.a, deviceId), applyAudioSink(this.b, deviceId)])
    } finally {
      this.ignorePause -= 1
    }
  }

  setGain(gain: number): void {
    this.gain = gain
    if (this.playing) this.front.volume = gain
    else this.front.volume = 0
  }

  async sync(src: string | null, playing: boolean, generation: number): Promise<void> {
    const token = ++this.token
    const current = (): boolean => token === this.token
    const srcChanged = src !== this.src || generation !== this.generation
    this.src = src
    this.generation = generation
    this.ensureWatch()
    if (!playing) {
      this.playing = false
      this.advanced = false
      this.hadProgress = false
      if (src) this.reportClock(this.front)
      else this.onClock(0, 0)
      await fadeTo(this.front, 0, this.front.paused ? 0 : this.fadeMs, current)
      if (!current()) return
      this.withIgnoredPause(() => {
        this.front.pause()
        this.back.pause()
      })
      if (!src) {
        this.front.currentTime = 0
        this.front.removeAttribute('src')
        this.front.load()
        this.src = null
      }
      return
    }
    if (!src) {
      this.playing = false
      return
    }
    if (!srcChanged && this.playing) {
      this.front.volume = this.gain
      return
    }
    this.playing = true
    this.hadProgress = false
    if (!srcChanged) {
      this.front.volume = 0
      try {
        this.ignorePause += 1
        try {
          await applyAudioSink(this.front, this.sinkId)
        } finally {
          this.ignorePause -= 1
        }
        await this.front.play()
        await fadeTo(this.front, this.gain, this.fadeMs, current)
      } catch {
        if (current()) this.onError('Could not play that track. Check the file and Output device.')
      }
      return
    }
    const next = this.back
    next.loop = this.loop
    next.src = src
    next.volume = 0
    try {
      this.ignorePause += 1
      try {
        await applyAudioSink(next, this.sinkId)
      } finally {
        this.ignorePause -= 1
      }
      await next.play()
    } catch {
      if (current()) this.onError('Could not play that track. Check the file and Output device.')
      return
    }
    const prev = this.front
    this.front = next
    this.back = prev
    this.advanced = false
    this.hadProgress = false
    await Promise.all([
      fadeTo(prev, 0, this.fadeMs, current),
      fadeTo(next, this.gain, this.fadeMs, current)
    ])
    if (!current()) return
    this.withIgnoredPause(() => {
      prev.pause()
      prev.removeAttribute('src')
      prev.load()
    })
  }

  stop(): void {
    this.playing = false
    this.advanced = false
    this.hadProgress = false
    this.onClock(0, 0)
    this.withIgnoredPause(() => {
      this.front.pause()
      this.back.pause()
    })
    this.front.volume = 0
    this.back.volume = 0
    if (this.watch != null) {
      clearInterval(this.watch)
      this.watch = null
    }
  }
}
