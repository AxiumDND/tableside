import { describe, expect, it } from 'vitest'
import {
  applyMixerCommand,
  buildAudioLibrary,
  classifyAudioPath,
  emptyMixerState,
  formatMixerTime,
  musicTracksFor,
  pickNextTrack,
  parseMixerPrefs
} from './audio'

const files = [
  'Audio/Music/Combat/Clash.mp3',
  'Audio/Music/Combat/Steel.ogg',
  'Audio/Music/Creepy/Dread.mp3',
  'Audio/Music/General/Town.mp3',
  'Audio/Music/Travel/Road.wav',
  'Audio/Ambience/Crowd/Tavern.mp3',
  'Audio/Ambience/Rain.ogg',
  'Audio/Sfx/Thunder.mp3',
  'Audio/Sfx/Doors/Slam.wav',
  'Party/Art/Kay.webp'
]

describe('audio library', () => {
  it('classifies campaign audio folders only', () => {
    expect(classifyAudioPath('Audio/Music/Combat/Clash.mp3')).toBe('music')
    expect(classifyAudioPath('Audio/Ambience/Rain.ogg')).toBe('ambience')
    expect(classifyAudioPath('Audio/Sfx/Doors/Slam.wav')).toBe('sfx')
    expect(classifyAudioPath('Sounds/Combat/Clash.mp3')).toBe(null)
    expect(classifyAudioPath('Party/Art/Kay.webp')).toBe(null)
  })

  it('builds mood playlists, ambience beds, and a soundboard', () => {
    const library = buildAudioLibrary(files)
    expect(library.music.map((item) => item.name)).toEqual(['Combat', 'Creepy', 'General', 'Travel'])
    expect(library.music[0]?.tracks).toHaveLength(2)
    expect(library.ambience.map((item) => item.name)).toEqual(['Crowd', 'Rain'])
    expect(library.sfx.map((item) => item.name)).toEqual(['Doors', 'Sfx'])
    expect(library.sfx.find((group) => group.name === 'Doors')?.tracks[0]?.name).toBe('Slam')
    expect(library.sfx.find((group) => group.name === 'Sfx')?.tracks.map((track) => track.name)).toEqual([
      'Dice (one)',
      'Dice (handful)',
      'Thunder'
    ])
    expect(library.skipped).toBe(0)
  })

  it('always includes built-in dice oneshots on the Sfx board', () => {
    const tracks = emptyMixerState().library.sfx[0]?.tracks ?? []
    expect(tracks[0]).toMatchObject({
      name: 'Dice (one)',
      relativePath: 'builtin:dice-roll'
    })
    expect(tracks[1]).toMatchObject({
      name: 'Dice (handful)',
      relativePath: 'builtin:dice-roll-multi'
    })
  })

  it('counts audio sitting outside Music, Ambience, or Sfx', () => {
    const library = buildAudioLibrary([...files, 'Audio/loose.mp3', 'Audio/Other/Fanfare.wav'])
    expect(library.skipped).toBe(2)
    expect(library.music.some((item) => item.tracks.some((track) => track.name === 'loose'))).toBe(false)
  })
})

describe('mixer commands', () => {
  const library = buildAudioLibrary(files)

  function ready() {
    return applyMixerCommand(emptyMixerState(), { type: 'set-library', library })
  }

  it('starts a music mood without touching ambience', () => {
    let state = ready()
    state = applyMixerCommand(state, { type: 'play-ambience', playlistId: 'Audio/Ambience/Crowd' })
    state = applyMixerCommand(state, { type: 'play-music', playlistId: 'Audio/Music/Combat' })
    expect(state.playback.musicPlaying).toBe(true)
    expect(state.playback.musicPlaylistId).toBe('Audio/Music/Combat')
    expect(state.playback.ambiencePlaying).toBe(true)
    expect(state.playback.ambiencePlaylistId).toBe('Audio/Ambience/Crowd')
    expect(state.prefs.lastMusicId).toBe('Audio/Music/Combat')
  })

  it('does not pause when the same music mood is started again', () => {
    let state = ready()
    state = applyMixerCommand(state, { type: 'play-music', playlistId: 'Audio/Music/Creepy' })
    const track = state.playback.musicTrack
    state = applyMixerCommand(state, { type: 'play-music', playlistId: 'Audio/Music/Creepy' })
    expect(state.playback.musicPlaying).toBe(true)
    expect(state.playback.musicTrack).toBe(track)
  })

  it('keeps the selected mood when music stops', () => {
    let state = ready()
    state = applyMixerCommand(state, { type: 'play-music', playlistId: 'Audio/Music/Combat' })
    state = applyMixerCommand(state, { type: 'stop-music' })
    expect(state.playback.musicPlaying).toBe(false)
    expect(state.playback.musicTrack).toBe(null)
    expect(state.playback.musicPlaylistId).toBe('Audio/Music/Combat')
    expect(state.prefs.lastMusicId).toBe('Audio/Music/Combat')
  })

  it('pauses then resumes the same track, and stop starts fresh', () => {
    let state = ready()
    state = applyMixerCommand(state, { type: 'play-music', playlistId: 'Audio/Music/Creepy' })
    const track = state.playback.musicTrack
    const generation = state.playback.musicGeneration
    state = applyMixerCommand(state, { type: 'pause-music' })
    expect(state.playback.musicPlaying).toBe(false)
    expect(state.playback.musicTrack).toBe(track)
    state = applyMixerCommand(state, { type: 'play-music', playlistId: 'Audio/Music/Creepy' })
    expect(state.playback.musicPlaying).toBe(true)
    expect(state.playback.musicTrack).toBe(track)
    expect(state.playback.musicGeneration).toBe(generation)
    state = applyMixerCommand(state, { type: 'stop-music' })
    state = applyMixerCommand(state, { type: 'play-music', playlistId: 'Audio/Music/Creepy' })
    expect(state.playback.musicPlaying).toBe(true)
    expect(state.playback.musicGeneration).toBeGreaterThan(generation)
  })

  it('stores a playback error and clears it on the next successful play', () => {
    let state = ready()
    state = applyMixerCommand(state, { type: 'error', message: 'Could not play that track.' })
    expect(state.playback.error).toBe('Could not play that track.')
    state = applyMixerCommand(state, { type: 'play-music', playlistId: 'Audio/Music/General' })
    expect(state.playback.error).toBe(null)
    expect(state.playback.musicPlaying).toBe(true)
  })

  it('advances sequential music and wraps', () => {
    const tracks = library.music[0]?.tracks ?? []
    expect(pickNextTrack(tracks, tracks[0]?.relativePath ?? null, false)).toBe(tracks[1]?.relativePath)
    expect(pickNextTrack(tracks, tracks[1]?.relativePath ?? null, false)).toBe(tracks[0]?.relativePath)
  })

  it('formats elapsed and duration clocks', () => {
    expect(formatMixerTime(0)).toBe('0:00')
    expect(formatMixerTime(83)).toBe('1:23')
    expect(formatMixerTime(3723)).toBe('1:02:03')
  })

  it('keeps skip and shuffle inside the selected mood', () => {
    let state = ready()
    state = applyMixerCommand(state, { type: 'set-prefs', prefs: { shuffle: false } })
    state = applyMixerCommand(state, { type: 'play-music', playlistId: 'Audio/Music/Combat' })
    const first = state.playback.musicTrack
    state = applyMixerCommand(state, { type: 'skip-music' })
    const combat = musicTracksFor(state.library, 'Audio/Music/Combat').map((track) => track.relativePath)
    expect(combat).toContain(first)
    expect(combat).toContain(state.playback.musicTrack)
    expect(state.playback.musicPlaylistId).toBe('Audio/Music/Combat')
    state = applyMixerCommand(state, { type: 'set-prefs', prefs: { shuffle: true } })
    state = applyMixerCommand(state, { type: 'skip-music' })
    expect(combat).toContain(state.playback.musicTrack)
    expect(state.playback.musicPlaylistId).toBe('Audio/Music/Combat')
  })

  it('stop all clears playback but keeps the library', () => {
    let state = ready()
    state = applyMixerCommand(state, { type: 'play-music', playlistId: 'Audio/Music/General' })
    state = applyMixerCommand(state, { type: 'oneshot', path: 'builtin:dice-roll' })
    expect(state.playback.oneshot?.path).toBe('builtin:dice-roll')
    state = applyMixerCommand(state, { type: 'oneshot', path: 'Audio/Sfx/Thunder.mp3' })
    state = applyMixerCommand(state, { type: 'stop-all' })
    expect(state.playback.musicPlaying).toBe(false)
    expect(state.playback.musicTrack).toBe(null)
    expect(state.playback.oneshot).toBe(null)
    expect(state.library.music.length).toBeGreaterThan(0)
  })

  it('pauses mood music for a crawl track then resumes when the crawl ends', () => {
    let state = ready()
    state = applyMixerCommand(state, { type: 'play-music', playlistId: 'Audio/Music/General' })
    const moodTrack = state.playback.musicTrack
    expect(state.playback.musicPlaying).toBe(true)
    state = applyMixerCommand(state, {
      type: 'play-crawl-music',
      path: 'Audio/Music/Creepy/Dread.mp3'
    })
    expect(state.playback.musicPlaying).toBe(false)
    expect(state.playback.musicTrack).toBe(moodTrack)
    expect(state.playback.crawlMusic).toBe('Audio/Music/Creepy/Dread.mp3')
    expect(state.playback.musicResumeAfterCrawl).toBe(true)
    state = applyMixerCommand(state, { type: 'ended', layer: 'crawl' })
    expect(state.playback.crawlMusic).toBe(null)
    expect(state.playback.musicResumeAfterCrawl).toBe(false)
    expect(state.playback.musicPlaying).toBe(true)
    expect(state.playback.musicTrack).toBe(moodTrack)
  })

  it('arms crawl by fading mood without starting the crawl track yet', () => {
    let state = ready()
    state = applyMixerCommand(state, { type: 'play-music', playlistId: 'Audio/Music/General' })
    const moodTrack = state.playback.musicTrack
    state = applyMixerCommand(state, { type: 'arm-crawl-music' })
    expect(state.playback.musicPlaying).toBe(false)
    expect(state.playback.musicTrack).toBe(moodTrack)
    expect(state.playback.crawlMusic).toBe(null)
    expect(state.playback.musicResumeAfterCrawl).toBe(true)
    state = applyMixerCommand(state, {
      type: 'play-crawl-music',
      path: 'Audio/Music/Creepy/Dread.mp3'
    })
    expect(state.playback.crawlMusic).toBe('Audio/Music/Creepy/Dread.mp3')
    expect(state.playback.musicResumeAfterCrawl).toBe(true)
  })

  it('clamps saved volumes', () => {
    const prefs = parseMixerPrefs({ masterVolume: 4, musicVolume: -1, shuffle: false })
    expect(prefs.masterVolume).toBe(1)
    expect(prefs.musicVolume).toBe(0)
    expect(prefs.shuffle).toBe(false)
  })

  it('plays and stops ambience without clearing the selected bed', () => {
    let state = ready()
    state = applyMixerCommand(state, { type: 'play-ambience', playlistId: 'Audio/Ambience/Crowd' })
    expect(state.playback.ambiencePlaying).toBe(true)
    state = applyMixerCommand(state, { type: 'play-ambience', playlistId: 'Audio/Ambience/Crowd' })
    expect(state.playback.ambiencePlaying).toBe(true)
    state = applyMixerCommand(state, { type: 'stop-ambience' })
    expect(state.playback.ambiencePlaying).toBe(false)
    expect(state.prefs.lastAmbienceId).toBe('Audio/Ambience/Crowd')
    expect(state.playback.ambiencePlaylistId).toBe('Audio/Ambience/Crowd')
  })

  it('keeps a saved output device id', () => {
    const prefs = parseMixerPrefs({ outputDeviceId: 'hdmi-tv' })
    expect(prefs.outputDeviceId).toBe('hdmi-tv')
  })
})
