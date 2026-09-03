// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { applyAudioSink, playOneshot } from './audioSink'

describe('audioSink', () => {
  it('routes oneshot playback through setSinkId when available', async () => {
    const play = vi.fn().mockResolvedValue(undefined)
    const setSinkId = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal(
      'Audio',
      class {
        volume = 1
        setSinkId = setSinkId
        play = play
      }
    )

    await playOneshot('audio.wav', 0.8, 'hdmi-out')

    expect(setSinkId).toHaveBeenCalledWith('hdmi-out')
    expect(play).toHaveBeenCalled()
  })
})

describe('applyAudioSink', () => {
  it('falls back to the default output when the device is unavailable', async () => {
    const setSinkId = vi
      .fn()
      .mockRejectedValueOnce(new Error('invalid device'))
      .mockResolvedValueOnce(undefined)
    const el = { setSinkId } as unknown as HTMLMediaElement

    await applyAudioSink(el, 'missing-device')

    expect(setSinkId).toHaveBeenNthCalledWith(1, 'missing-device')
    expect(setSinkId).toHaveBeenNthCalledWith(2, '')
  })
})
