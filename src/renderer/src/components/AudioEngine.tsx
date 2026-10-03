import { useEffect, useRef } from 'react'
import {
  audioFileUrl,
  emptyMixerClock,
  mixerLayerGain,
  musicHtmlLoops,
  type MixerClock,
  type MixerLayerId,
  type MixerState
} from '../../../shared/audio'
import { bundledDiceSfxUrl, diceRollSoundUrl, isBuiltinSfx } from '../../../shared/diceRollSound'
import { BUILTIN_HOURGLASS_CHIME_PATH, hourglassChimeUrl } from '../../../shared/hourglass'
import { playOneshot } from '../lib/audioSink'
import { LayerPlayer } from '../lib/layerPlayer'

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
      music.setLoop(musicHtmlLoops(state))
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
        shot.path === BUILTIN_HOURGLASS_CHIME_PATH
          ? hourglassChimeUrl()
          : isBuiltinSfx(shot.path)
            ? bundledDiceSfxUrl(shot.path)
            : audioFileUrl(shot.path),
        mixerLayerGain(state.prefs, 'sfx'),
        sink
      ).catch(() => {
        if (shot.path === BUILTIN_HOURGLASS_CHIME_PATH) {
          return playOneshot(hourglassChimeUrl(), mixerLayerGain(state.prefs, 'sfx'), sink).catch(() =>
            reportPlaybackError('Could not play that sound. Check the file and Output device.')
          )
        }
        if (!isBuiltinSfx(shot.path)) {
          reportPlaybackError('Could not play that sound. Check the file and Output device.')
          return
        }
        return playOneshot(diceRollSoundUrl(shot.path), mixerLayerGain(state.prefs, 'sfx'), sink).catch(() =>
          reportPlaybackError('Could not play that sound. Check the file and Output device.')
        )
      })
    }
  }, [state])

  return null
}
