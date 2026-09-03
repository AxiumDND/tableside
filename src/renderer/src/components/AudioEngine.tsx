import { useEffect, useRef } from 'react'
import {
  MIXER_FADE_MS,
  audioFileUrl,
  emptyMixerClock,
  mixerLayerGain,
  type MixerClock,
  type MixerLayerId,
  type MixerState
} from '../../../shared/audio'
import { diceRollSoundUrl, isBuiltinSfx } from '../../../shared/diceRollSound'
import { applyAudioSink, playOneshot } from '../lib/audioSink'

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

class LayerPlayer {
  private a = new Audio()
  private b = new Audio()
  private front: HTMLAudioElement
  private back: HTMLAudioElement
  private generation = -1
  private gain = 0
  private src: string | null = null
  private playing = false
  private sinkId = ''
  private token = 0
  private advanced = false

  constructor(
    private loop: boolean,
    private onEnded: () => void,
    private onError: (message: string) => void,
    private onClock: (current: number, duration: number) => void
  ) {
    this.front = this.a
    this.back = this.b
    for (const el of [this.a, this.b]) {
      el.preload = 'auto'
      el.loop = loop
      el.addEventListener('timeupdate', () => this.handleTime(el))
      el.addEventListener('loadedmetadata', () => this.reportClock(el))
      el.addEventListener('ended', () => this.handleEnded(el))
    }
  }

  private reportClock(el: HTMLAudioElement): void {
    if (el !== this.front || !this.playing) return
    const duration = el.duration
    const currentTime = el.currentTime
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(currentTime)) {
      this.onClock(0, 0)
      return
    }
    this.onClock(currentTime, duration)
  }

  private handleTime(el: HTMLAudioElement): void {
    this.reportClock(el)
    if (this.loop || !this.playing || this.advanced || el !== this.front) return
    const duration = el.duration
    const currentTime = el.currentTime
    if (!Number.isFinite(duration) || duration <= 0) return
    const fadeSec = MIXER_FADE_MS / 1000
    const lead = duration > fadeSec + 0.25 ? fadeSec : Math.max(0.25, duration / 2)
    if (duration - currentTime <= lead) this.requestNext()
  }

  private handleEnded(el: HTMLAudioElement): void {
    if (this.loop || el !== this.front) return
    this.requestNext()
  }

  private requestNext(): void {
    if (this.advanced) return
    this.advanced = true
    this.onEnded()
  }

  async setSink(deviceId: string): Promise<void> {
    this.sinkId = deviceId
    await Promise.all([applyAudioSink(this.a, deviceId), applyAudioSink(this.b, deviceId)])
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
    if (!playing) {
      this.playing = false
      this.advanced = false
      if (src) this.reportClock(this.front)
      else this.onClock(0, 0)
      await fadeTo(this.front, 0, this.front.paused ? 0 : MIXER_FADE_MS, current)
      if (!current()) return
      this.front.pause()
      this.back.pause()
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
    if (!srcChanged) {
      this.front.volume = 0
      try {
        await applyAudioSink(this.front, this.sinkId)
        await this.front.play()
        await fadeTo(this.front, this.gain, MIXER_FADE_MS, current)
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
      await applyAudioSink(next, this.sinkId)
      await next.play()
    } catch {
      if (current()) this.onError('Could not play that track. Check the file and Output device.')
      return
    }
    const prev = this.front
    this.front = next
    this.back = prev
    this.advanced = false
    await Promise.all([
      fadeTo(prev, 0, MIXER_FADE_MS, current),
      fadeTo(next, this.gain, MIXER_FADE_MS, current)
    ])
    if (!current()) return
    prev.pause()
    prev.removeAttribute('src')
    prev.load()
  }

  stop(): void {
    this.playing = false
    this.advanced = false
    this.onClock(0, 0)
    this.front.pause()
    this.back.pause()
    this.front.volume = 0
    this.back.volume = 0
  }
}

function reportPlaybackError(message: string): void {
  void window.tabledm.mixerError(message)
}

export default function AudioEngine({
  state,
  onClock
}: {
  state: MixerState
  onClock?: (clock: MixerClock) => void
}) {
  const musicRef = useRef<LayerPlayer | null>(null)
  const ambienceRef = useRef<LayerPlayer | null>(null)
  const crawlRef = useRef<LayerPlayer | null>(null)
  const hyperLoopRef = useRef<LayerPlayer | null>(null)
  const oneshotAt = useRef(0)
  const clockRef = useRef<MixerClock>(emptyMixerClock())
  const onClockRef = useRef(onClock)
  onClockRef.current = onClock

  useEffect(() => {
    const publish = (layer: MixerLayerId, current: number, duration: number): void => {
      const next = {
        ...clockRef.current,
        [layer]: duration > 0 ? { current, duration } : null
      }
      clockRef.current = next
      onClockRef.current?.(next)
    }
    const ended = (layer: MixerLayerId | 'crawl'): void => {
      void window.tabledm.mixerTrackEnded(layer)
    }
    const failed = (): void => {
      reportPlaybackError('Could not play that track. Check the file and Output device.')
    }
    musicRef.current = new LayerPlayer(false, () => ended('music'), failed, (current, duration) =>
      publish('music', current, duration)
    )
    ambienceRef.current = new LayerPlayer(true, () => ended('ambience'), failed, (current, duration) =>
      publish('ambience', current, duration)
    )
    crawlRef.current = new LayerPlayer(false, () => ended('crawl'), failed, () => undefined)
    hyperLoopRef.current = new LayerPlayer(true, () => undefined, failed, () => undefined)
    return () => {
      musicRef.current?.stop()
      ambienceRef.current?.stop()
      crawlRef.current?.stop()
      hyperLoopRef.current?.stop()
      clockRef.current = emptyMixerClock()
      onClockRef.current?.(emptyMixerClock())
    }
  }, [])

  useEffect(() => {
    const music = musicRef.current
    const ambience = ambienceRef.current
    const crawl = crawlRef.current
    const hyperLoop = hyperLoopRef.current
    if (!music || !ambience || !crawl || !hyperLoop) return
    const sink = state.prefs.outputDeviceId
    void (async () => {
      await Promise.all([
        music.setSink(sink),
        ambience.setSink(sink),
        crawl.setSink(sink),
        hyperLoop.setSink(sink)
      ])
      music.setGain(mixerLayerGain(state.prefs, 'music'))
      ambience.setGain(mixerLayerGain(state.prefs, 'ambience'))
      crawl.setGain(mixerLayerGain(state.prefs, 'music'))
      hyperLoop.setGain(mixerLayerGain(state.prefs, 'sfx'))
      const musicUrl = state.playback.musicTrack ? audioFileUrl(state.playback.musicTrack) : null
      const ambienceUrl = state.playback.ambienceTrack ? audioFileUrl(state.playback.ambienceTrack) : null
      const crawlUrl = state.playback.crawlMusic ? audioFileUrl(state.playback.crawlMusic) : null
      const hyperUrl = state.playback.hyperspaceLoop ? audioFileUrl(state.playback.hyperspaceLoop) : null
      await music.sync(musicUrl, state.playback.musicPlaying, state.playback.musicGeneration)
      await ambience.sync(ambienceUrl, state.playback.ambiencePlaying, state.playback.ambienceGeneration)
      await crawl.sync(crawlUrl, Boolean(crawlUrl), state.playback.crawlMusicGeneration)
      await hyperLoop.sync(hyperUrl, Boolean(hyperUrl), state.playback.hyperspaceLoopGeneration)
    })()
    const shot = state.playback.oneshot
    if (shot && shot.at !== oneshotAt.current) {
      oneshotAt.current = shot.at
      playOneshot(
        isBuiltinSfx(shot.path) ? diceRollSoundUrl(shot.path) : audioFileUrl(shot.path),
        mixerLayerGain(state.prefs, 'sfx'),
        sink
      ).catch(() => reportPlaybackError('Could not play that sound. Check the file and Output device.'))
    }
  }, [state])

  return null
}
