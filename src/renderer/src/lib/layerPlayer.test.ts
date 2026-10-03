// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LayerPlayer, hasFiniteDuration, mediaPlaybackFinished } from './layerPlayer'

type Listener = () => void

class FakeAudio {
  volume = 1
  paused = true
  ended = false
  loop = false
  duration = Number.NaN
  preload = ''
  readyState = 0
  playCount = 0
  loadCount = 0
  srcClears = 0
  seekFails = false
  private time = 0
  private href = ''
  readonly listeners = new Map<string, Set<Listener>>()

  get src(): string {
    return this.href
  }

  set src(value: string) {
    this.href = value
    this.ended = false
    this.time = 0
  }

  get currentTime(): number {
    return this.time
  }

  set currentTime(value: number) {
    if (this.seekFails && value === 0) return
    this.time = value
  }

  play = vi.fn(async () => {
    this.paused = false
    this.ended = false
    this.readyState = 4
    this.playCount += 1
  })

  pause = (): void => {
    this.paused = true
    this.emit('pause')
  }

  load = (): void => {
    this.loadCount += 1
    this.ended = false
  }

  setSinkId = vi.fn(async () => {
    this.pause()
  })

  removeAttribute = (name: string): void => {
    if (name === 'src') {
      this.href = ''
      this.srcClears += 1
    }
  }

  addEventListener = (type: string, fn: Listener): void => {
    const set = this.listeners.get(type) ?? new Set()
    set.add(fn)
    this.listeners.set(type, set)
  }

  emit(type: string): void {
    for (const fn of this.listeners.get(type) ?? []) fn()
  }
}

function createHarness(loop: boolean): {
  player: LayerPlayer
  elements: FakeAudio[]
  ended: ReturnType<typeof vi.fn>
  error: ReturnType<typeof vi.fn>
} {
  const elements: FakeAudio[] = []
  const ended = vi.fn()
  const error = vi.fn()
  const player = new LayerPlayer(loop, ended, error, () => undefined, {
    fadeMs: 0,
    watchMs: 50,
    createAudio: () => {
      const el = new FakeAudio()
      elements.push(el)
      return el as unknown as HTMLAudioElement
    }
  })
  return { player, elements, ended, error }
}

function frontOf(elements: FakeAudio[], src: string): FakeAudio {
  const front = elements.find((el) => el.src === src)
  expect(front).toBeTruthy()
  return front as FakeAudio
}

describe('mediaPlaybackFinished', () => {
  it('treats ended and known EOF as finished, not NaN/Infinity duration', () => {
    expect(hasFiniteDuration(Number.NaN)).toBe(false)
    expect(hasFiniteDuration(Number.POSITIVE_INFINITY)).toBe(false)
    expect(hasFiniteDuration(12)).toBe(true)
    expect(mediaPlaybackFinished({ ended: true, currentTime: 0, duration: Number.NaN })).toBe(true)
    expect(mediaPlaybackFinished({ ended: false, currentTime: 10, duration: Number.POSITIVE_INFINITY })).toBe(
      false
    )
    expect(mediaPlaybackFinished({ ended: false, currentTime: 9.97, duration: 10 })).toBe(true)
    expect(mediaPlaybackFinished({ ended: false, currentTime: 4, duration: 10 })).toBe(false)
  })
})

describe('LayerPlayer Windows MP3 loop', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('rewinds the same element when native loop fails and ended fires', async () => {
    const { player, elements, ended } = createHarness(true)
    await player.sync('file://mood.mp3', true, 1)
    const front = frontOf(elements, 'file://mood.mp3')
    front.duration = Number.NaN
    front.currentTime = 92
    front.emit('timeupdate')
    const plays = front.playCount
    front.ended = true
    front.emit('ended')
    await vi.waitFor(() => {
      expect(front.playCount).toBeGreaterThan(plays)
    })
    expect(ended).not.toHaveBeenCalled()
    expect(front.currentTime).toBe(0)
    player.stop()
  })

  it('rewinds after an unexpected pause at EOS when duration is Infinity', async () => {
    const { player, elements, ended } = createHarness(true)
    await player.sync('file://bed.mp3', true, 1)
    const front = frontOf(elements, 'file://bed.mp3')
    front.duration = Number.POSITIVE_INFINITY
    front.currentTime = 40
    front.emit('timeupdate')
    const plays = front.playCount
    front.pause()
    await vi.waitFor(() => {
      expect(front.playCount).toBeGreaterThan(plays)
    })
    expect(ended).not.toHaveBeenCalled()
    player.stop()
  })

  it('reloads src when seek-to-0 is a no-op at EOS', async () => {
    const { player, elements, ended } = createHarness(true)
    await player.sync('file://stuck.mp3', true, 1)
    const front = frontOf(elements, 'file://stuck.mp3')
    front.duration = 30
    front.currentTime = 30
    front.seekFails = true
    front.emit('timeupdate')
    await vi.waitFor(() => {
      expect(front.srcClears).toBeGreaterThan(0)
      expect(front.playCount).toBeGreaterThan(1)
    })
    expect(ended).not.toHaveBeenCalled()
    expect(front.src).toBe('file://stuck.mp3')
    player.stop()
  })

  it('advances a playlist when ended fires even if duration is NaN', async () => {
    const { player, elements, ended } = createHarness(false)
    await player.sync('file://a.mp3', true, 1)
    const front = frontOf(elements, 'file://a.mp3')
    front.duration = Number.NaN
    front.currentTime = 18
    front.emit('timeupdate')
    front.ended = true
    front.emit('ended')
    expect(ended).toHaveBeenCalledTimes(1)
    player.stop()
  })

  it('advances a playlist when Windows pauses at EOS without ended', async () => {
    const { player, elements, ended } = createHarness(false)
    await player.sync('file://b.mp3', true, 1)
    const front = frontOf(elements, 'file://b.mp3')
    front.duration = Number.POSITIVE_INFINITY
    front.currentTime = 22
    front.emit('timeupdate')
    front.pause()
    expect(ended).toHaveBeenCalledTimes(1)
    front.ended = true
    front.emit('ended')
    expect(ended).toHaveBeenCalledTimes(1)
    player.stop()
  })

  it('does not treat a user pause as the end of the playlist', async () => {
    const { player, elements, ended } = createHarness(false)
    await player.sync('file://c.mp3', true, 1)
    const front = frontOf(elements, 'file://c.mp3')
    front.duration = 60
    front.currentTime = 12
    front.emit('timeupdate')
    await player.sync('file://c.mp3', false, 1)
    expect(ended).not.toHaveBeenCalled()
    player.stop()
  })

  it('does not treat setSinkId pauses as track end', async () => {
    const { player, elements, ended } = createHarness(false)
    await player.sync('file://d.mp3', true, 1)
    const front = frontOf(elements, 'file://d.mp3')
    front.duration = Number.POSITIVE_INFINITY
    front.currentTime = 8
    front.emit('timeupdate')
    await player.setSink('hdmi')
    expect(ended).not.toHaveBeenCalled()
    player.stop()
  })

  it('polls ended when timeupdate stalls at known EOF', async () => {
    vi.useFakeTimers()
    const { player, elements, ended } = createHarness(true)
    await player.sync('file://stall.mp3', true, 1)
    const front = frontOf(elements, 'file://stall.mp3')
    front.duration = 10
    front.currentTime = 9.99
    const plays = front.playCount
    await vi.advanceTimersByTimeAsync(80)
    expect(ended).not.toHaveBeenCalled()
    expect(front.playCount).toBeGreaterThan(plays)
    player.stop()
  })

  it('crossfades a playlist from timeupdate when duration is known', async () => {
    const { player, elements, ended } = createHarness(false)
    await player.sync('file://e.wav', true, 1)
    const front = frontOf(elements, 'file://e.wav')
    front.duration = 10
    front.currentTime = 10
    front.emit('timeupdate')
    expect(ended).toHaveBeenCalledTimes(1)
    player.stop()
  })

  it('does not fire playlist ended for a looping ambience bed', async () => {
    const { player, elements, ended } = createHarness(true)
    await player.sync('file://rain.ogg', true, 1)
    const front = frontOf(elements, 'file://rain.ogg')
    front.duration = 20
    front.currentTime = 19.99
    front.emit('timeupdate')
    await Promise.resolve()
    expect(ended).not.toHaveBeenCalled()
    player.stop()
  })
})
