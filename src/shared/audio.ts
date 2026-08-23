import { canonicalFolder } from './campaignLayout'

export const AUDIO_EXT = new Set(['.mp3', '.ogg', '.wav', '.m4a', '.flac', '.webm', '.aac'])

export const AUDIO_MIME: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
  '.webm': 'audio/webm',
  '.aac': 'audio/aac'
}

export const MUSIC_CROSSFADE_MS = 5000
export const MIXER_FADE_MS = MUSIC_CROSSFADE_MS

export type AudioKind = 'music' | 'ambience' | 'sfx'
export type MixerLayerId = 'music' | 'ambience'

export interface AudioTrack {
  relativePath: string
  name: string
}

export interface AudioPlaylist {
  id: string
  name: string
  kind: AudioKind
  tracks: AudioTrack[]
}

export interface AudioSfxGroup {
  id: string
  name: string
  tracks: AudioTrack[]
}

export interface AudioLibrary {
  music: AudioPlaylist[]
  ambience: AudioPlaylist[]
  sfx: AudioSfxGroup[]
  skipped: number
}

export interface MixerPrefs {
  masterVolume: number
  masterMuted: boolean
  hearHere: boolean
  /** Chromium audio output id. Empty = system default. */
  outputDeviceId: string
  musicVolume: number
  musicMuted: boolean
  ambienceVolume: number
  ambienceMuted: boolean
  sfxVolume: number
  sfxMuted: boolean
  shuffle: boolean
  lastMusicId: string | null
  lastAmbienceId: string | null
}

export interface MixerPlayback {
  musicPlaying: boolean
  musicPlaylistId: string | null
  musicTrack: string | null
  musicGeneration: number
  ambiencePlaying: boolean
  ambiencePlaylistId: string | null
  ambienceTrack: string | null
  ambienceGeneration: number
  oneshot: { path: string; at: number } | null
  error: string | null
}

export interface MixerState {
  library: AudioLibrary
  prefs: MixerPrefs
  playback: MixerPlayback
}

export type MixerCommand =
  | { type: 'play-music'; playlistId: string }
  | { type: 'pause-music' }
  | { type: 'skip-music' }
  | { type: 'stop-music' }
  | { type: 'play-ambience'; playlistId: string }
  | { type: 'stop-ambience' }
  | { type: 'oneshot'; path: string }
  | { type: 'stop-all' }
  | { type: 'ended'; layer: MixerLayerId }
  | { type: 'set-prefs'; prefs: Partial<MixerPrefs> }
  | { type: 'set-library'; library: AudioLibrary }
  | { type: 'error'; message: string | null }

const MUSIC_PIN = ['combat', 'creepy', 'general']

function fold(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function posix(path: string): string {
  return path.replaceAll('\\', '/')
}

export function isAudioPath(path: string): boolean {
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase()
  return AUDIO_EXT.has(ext)
}

export function audioTrackName(path: string): string {
  const base = posix(path).split('/').pop() ?? path
  return base.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
}

export function audioFileUrl(relativePath: string): string {
  return `tabledm://file/?path=${encodeURIComponent(relativePath).replace(/'/g, '%27')}`
}

export function classifyAudioPath(relativePath: string): AudioKind | null {
  const parts = posix(relativePath).split('/').filter(Boolean)
  if (parts.length < 3) return null
  if (canonicalFolder(parts[0] ?? '') !== 'audio') return null
  const second = fold(parts[1] ?? '')
  if (second === 'music') return 'music'
  if (second === 'ambience' || second === 'ambient') return 'ambience'
  if (second === 'sfx' || second === 'sounds' || second === 'soundboard' || second === 'fx') return 'sfx'
  return null
}

function folderName(path: string): string {
  const parts = posix(path).split('/').filter(Boolean)
  return parts[parts.length - 1] ?? path
}

function musicPlaylistId(path: string): string {
  const parts = posix(path).split('/').filter(Boolean)
  if (parts.length >= 4) return parts.slice(0, 3).join('/')
  return parts.slice(0, 2).join('/')
}

function ambiencePlaylistId(path: string): string {
  const parts = posix(path).split('/').filter(Boolean)
  if (parts.length >= 4) return parts.slice(0, 3).join('/')
  return posix(path)
}

function sfxGroupId(path: string): string {
  const parts = posix(path).split('/').filter(Boolean)
  if (parts.length >= 4) return parts.slice(0, 3).join('/')
  return parts.slice(0, 2).join('/')
}

function comparePlaylists(a: AudioPlaylist, b: AudioPlaylist): number {
  const ai = MUSIC_PIN.indexOf(fold(a.name))
  const bi = MUSIC_PIN.indexOf(fold(b.name))
  if (ai !== -1 || bi !== -1) {
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  }
  return a.name.localeCompare(b.name)
}

export function emptyAudioLibrary(): AudioLibrary {
  return { music: [], ambience: [], sfx: [], skipped: 0 }
}

export function buildAudioLibrary(paths: string[]): AudioLibrary {
  const music = new Map<string, AudioPlaylist>()
  const ambience = new Map<string, AudioPlaylist>()
  const sfx = new Map<string, AudioSfxGroup>()
  let skipped = 0

  for (const raw of paths) {
    const path = posix(raw)
    if (!isAudioPath(path)) continue
    const kind = classifyAudioPath(path)
    if (!kind) {
      skipped += 1
      continue
    }
    const track: AudioTrack = { relativePath: path, name: audioTrackName(path) }
    if (kind === 'music') {
      const id = musicPlaylistId(path)
      const existing = music.get(id)
      if (existing) existing.tracks.push(track)
      else music.set(id, { id, name: folderName(id), kind, tracks: [track] })
    } else if (kind === 'ambience') {
      const id = ambiencePlaylistId(path)
      const existing = ambience.get(id)
      if (existing) existing.tracks.push(track)
      else {
        const name = id.includes('.') ? audioTrackName(id) : folderName(id)
        ambience.set(id, { id, name, kind, tracks: [track] })
      }
    } else {
      const id = sfxGroupId(path)
      const existing = sfx.get(id)
      if (existing) existing.tracks.push(track)
      else sfx.set(id, { id, name: folderName(id), tracks: [track] })
    }
  }

  const sortTracks = (tracks: AudioTrack[]): AudioTrack[] =>
    [...tracks].sort((a, b) => a.name.localeCompare(b.name))

  return {
    music: [...music.values()]
      .map((playlist) => ({ ...playlist, tracks: sortTracks(playlist.tracks) }))
      .sort(comparePlaylists),
    ambience: [...ambience.values()]
      .map((playlist) => ({ ...playlist, tracks: sortTracks(playlist.tracks) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    sfx: [...sfx.values()]
      .map((group) => ({ ...group, tracks: sortTracks(group.tracks) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    skipped
  }
}

export function emptyMixerPrefs(): MixerPrefs {
  return {
    masterVolume: 0.85,
    masterMuted: false,
    hearHere: false,
    outputDeviceId: '',
    musicVolume: 0.7,
    musicMuted: false,
    ambienceVolume: 0.35,
    ambienceMuted: false,
    sfxVolume: 0.85,
    sfxMuted: false,
    shuffle: true,
    lastMusicId: null,
    lastAmbienceId: null
  }
}

export function emptyMixerPlayback(): MixerPlayback {
  return {
    musicPlaying: false,
    musicPlaylistId: null,
    musicTrack: null,
    musicGeneration: 0,
    ambiencePlaying: false,
    ambiencePlaylistId: null,
    ambienceTrack: null,
    ambienceGeneration: 0,
    oneshot: null,
    error: null
  }
}

export function emptyMixerState(): MixerState {
  return {
    library: emptyAudioLibrary(),
    prefs: emptyMixerPrefs(),
    playback: emptyMixerPlayback()
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function parseMixerPrefs(raw: unknown): MixerPrefs {
  const base = emptyMixerPrefs()
  if (!raw || typeof raw !== 'object') return base
  const src = raw as Record<string, unknown>
  const num = (key: keyof MixerPrefs, fallback: number): number =>
    typeof src[key] === 'number' ? clamp01(src[key] as number) : fallback
  const flag = (key: keyof MixerPrefs, fallback: boolean): boolean =>
    typeof src[key] === 'boolean' ? (src[key] as boolean) : fallback
  const id = (key: keyof MixerPrefs): string | null =>
    typeof src[key] === 'string' && src[key] ? (src[key] as string) : null
  return {
    masterVolume: num('masterVolume', base.masterVolume),
    masterMuted: flag('masterMuted', base.masterMuted),
    hearHere: flag('hearHere', base.hearHere),
    outputDeviceId: typeof src.outputDeviceId === 'string' ? src.outputDeviceId : base.outputDeviceId,
    musicVolume: num('musicVolume', base.musicVolume),
    musicMuted: flag('musicMuted', base.musicMuted),
    ambienceVolume: num('ambienceVolume', base.ambienceVolume),
    ambienceMuted: flag('ambienceMuted', base.ambienceMuted),
    sfxVolume: num('sfxVolume', base.sfxVolume),
    sfxMuted: flag('sfxMuted', base.sfxMuted),
    shuffle: flag('shuffle', base.shuffle),
    lastMusicId: id('lastMusicId'),
    lastAmbienceId: id('lastAmbienceId')
  }
}

export function mixerPrefsToFile(prefs: MixerPrefs): MixerPrefs {
  return { ...prefs }
}

function findPlaylist(library: AudioLibrary, kind: AudioKind, id: string | null): AudioPlaylist | null {
  if (!id) return null
  const list = kind === 'sfx' ? [] : kind === 'music' ? library.music : library.ambience
  return list.find((item) => item.id === id) ?? null
}

function findSfxTrack(library: AudioLibrary, path: string): AudioTrack | null {
  for (const group of library.sfx) {
    const track = group.tracks.find((item) => item.relativePath === path)
    if (track) return track
  }
  return null
}

export function pickNextTrack(
  tracks: AudioTrack[],
  current: string | null,
  shuffle: boolean,
  random = Math.random
): string | null {
  if (tracks.length === 0) return null
  if (tracks.length === 1) return tracks[0].relativePath
  if (shuffle) {
    const others = current ? tracks.filter((track) => track.relativePath !== current) : tracks
    const pool = others.length > 0 ? others : tracks
    return pool[Math.floor(random() * pool.length)]?.relativePath ?? null
  }
  const index = tracks.findIndex((track) => track.relativePath === current)
  const next = index === -1 ? 0 : (index + 1) % tracks.length
  return tracks[next]?.relativePath ?? null
}

function startMusic(state: MixerState, playlistId: string): MixerState {
  const playlist = findPlaylist(state.library, 'music', playlistId)
  if (!playlist || playlist.tracks.length === 0) {
    return {
      ...state,
      prefs: { ...state.prefs, lastMusicId: playlistId || state.prefs.lastMusicId },
      playback: { ...state.playback, error: 'That mood has no tracks yet. Add audio…' }
    }
  }
  const track = pickNextTrack(playlist.tracks, null, state.prefs.shuffle)
  if (!track) {
    return {
      ...state,
      prefs: { ...state.prefs, lastMusicId: playlistId },
      playback: { ...state.playback, error: 'That mood has no tracks yet. Add audio…' }
    }
  }
  return {
    ...state,
    prefs: { ...state.prefs, lastMusicId: playlistId },
    playback: {
      ...state.playback,
      musicPlaying: true,
      musicPlaylistId: playlistId,
      musicTrack: track,
      musicGeneration: state.playback.musicGeneration + 1,
      error: null
    }
  }
}

export function applyMixerCommand(state: MixerState, command: MixerCommand): MixerState {
  switch (command.type) {
    case 'set-prefs':
      return { ...state, prefs: { ...state.prefs, ...parseMixerPrefs({ ...state.prefs, ...command.prefs }) } }
    case 'set-library': {
      const library = command.library
      const music = findPlaylist(library, 'music', state.playback.musicPlaylistId)
      const ambience = findPlaylist(library, 'ambience', state.playback.ambiencePlaylistId)
      const musicTrack =
        music && state.playback.musicTrack && music.tracks.some((track) => track.relativePath === state.playback.musicTrack)
          ? state.playback.musicTrack
          : (music?.tracks[0]?.relativePath ?? null)
      const ambienceTrack =
        ambience &&
        state.playback.ambienceTrack &&
        ambience.tracks.some((track) => track.relativePath === state.playback.ambienceTrack)
          ? state.playback.ambienceTrack
          : (ambience?.tracks[0]?.relativePath ?? null)
      return {
        ...state,
        library,
        playback: {
          ...state.playback,
          musicPlaylistId: music ? state.playback.musicPlaylistId : null,
          musicTrack: music ? musicTrack : null,
          musicPlaying: Boolean(music && state.playback.musicPlaying && musicTrack),
          ambiencePlaylistId: ambience ? state.playback.ambiencePlaylistId : null,
          ambienceTrack: ambience ? ambienceTrack : null,
          ambiencePlaying: Boolean(ambience && state.playback.ambiencePlaying && ambienceTrack)
        }
      }
    }
    case 'play-music': {
      const current = state.playback.musicPlaylistId
      if (state.playback.musicPlaying && current === command.playlistId) {
        return {
          ...state,
          prefs: { ...state.prefs, lastMusicId: command.playlistId },
          playback: { ...state.playback, error: null }
        }
      }
      if (!state.playback.musicPlaying && current === command.playlistId && state.playback.musicTrack) {
        return {
          ...state,
          prefs: { ...state.prefs, lastMusicId: command.playlistId },
          playback: { ...state.playback, musicPlaying: true, error: null }
        }
      }
      return startMusic(state, command.playlistId)
    }
    case 'pause-music':
      return { ...state, playback: { ...state.playback, musicPlaying: false } }
    case 'stop-music':
      return {
        ...state,
        playback: {
          ...state.playback,
          musicPlaying: false
        }
      }
    case 'error':
      return { ...state, playback: { ...state.playback, error: command.message } }
    case 'skip-music': {
      const playlist = findPlaylist(state.library, 'music', state.playback.musicPlaylistId)
      if (!playlist) {
        return { ...state, playback: { ...state.playback, error: 'Pick a mood, then Start.' } }
      }
      const track = pickNextTrack(playlist.tracks, state.playback.musicTrack, state.prefs.shuffle)
      if (!track) {
        return { ...state, playback: { ...state.playback, error: 'That mood has no tracks yet. Add audio…' } }
      }
      return {
        ...state,
        playback: {
          ...state.playback,
          musicPlaying: true,
          musicTrack: track,
          musicGeneration: state.playback.musicGeneration + 1,
          error: null
        }
      }
    }
    case 'play-ambience': {
      const playlist = findPlaylist(state.library, 'ambience', command.playlistId)
      if (!playlist || playlist.tracks.length === 0) {
        return {
          ...state,
          prefs: { ...state.prefs, lastAmbienceId: command.playlistId || state.prefs.lastAmbienceId },
          playback: { ...state.playback, error: 'That bed has no tracks yet. Add audio…' }
        }
      }
      const same =
        state.playback.ambiencePlaying &&
        state.playback.ambiencePlaylistId === command.playlistId &&
        state.playback.ambienceTrack
      if (same) {
        return {
          ...state,
          prefs: { ...state.prefs, lastAmbienceId: command.playlistId },
          playback: { ...state.playback, error: null }
        }
      }
      const track =
        state.playback.ambiencePlaylistId === command.playlistId && state.playback.ambienceTrack
          ? state.playback.ambienceTrack
          : (playlist.tracks[0]?.relativePath ?? null)
      if (!track) {
        return { ...state, playback: { ...state.playback, error: 'That bed has no tracks yet. Add audio…' } }
      }
      return {
        ...state,
        prefs: { ...state.prefs, lastAmbienceId: command.playlistId },
        playback: {
          ...state.playback,
          ambiencePlaying: true,
          ambiencePlaylistId: command.playlistId,
          ambienceTrack: track,
          ambienceGeneration: state.playback.ambienceGeneration + 1,
          error: null
        }
      }
    }
    case 'stop-ambience':
      return {
        ...state,
        playback: {
          ...state.playback,
          ambiencePlaying: false
        }
      }
    case 'oneshot':
      if (!findSfxTrack(state.library, command.path) && !isAudioPath(command.path)) {
        return { ...state, playback: { ...state.playback, error: 'That sound is not in Audio/Sfx.' } }
      }
      return {
        ...state,
        playback: { ...state.playback, oneshot: { path: command.path, at: Date.now() }, error: null }
      }
    case 'stop-all':
      return {
        ...state,
        playback: emptyMixerPlayback()
      }
    case 'ended': {
      if (command.layer === 'ambience') {
        const playlist = findPlaylist(state.library, 'ambience', state.playback.ambiencePlaylistId)
        if (!playlist || !state.playback.ambiencePlaying) return state
        const track = playlist.tracks[0]?.relativePath ?? state.playback.ambienceTrack
        return {
          ...state,
          playback: {
            ...state.playback,
            ambienceTrack: track,
            ambienceGeneration: state.playback.ambienceGeneration + 1
          }
        }
      }
      const playlist = findPlaylist(state.library, 'music', state.playback.musicPlaylistId)
      if (!playlist || !state.playback.musicPlaying) {
        return { ...state, playback: { ...state.playback, musicPlaying: false } }
      }
      const track = pickNextTrack(playlist.tracks, state.playback.musicTrack, state.prefs.shuffle)
      if (!track) return { ...state, playback: { ...state.playback, musicPlaying: false } }
      return {
        ...state,
        playback: {
          ...state.playback,
          musicTrack: track,
          musicGeneration: state.playback.musicGeneration + 1
        }
      }
    }
    default:
      return state
  }
}

export function mixerLayerGain(prefs: MixerPrefs, layer: 'music' | 'ambience' | 'sfx'): number {
  if (prefs.masterMuted) return 0
  const master = prefs.masterVolume
  if (layer === 'music') return prefs.musicMuted ? 0 : master * prefs.musicVolume
  if (layer === 'ambience') return prefs.ambienceMuted ? 0 : master * prefs.ambienceVolume
  return prefs.sfxMuted ? 0 : master * prefs.sfxVolume
}

export function mixerIsActive(state: MixerState): boolean {
  return state.playback.musicPlaying || state.playback.ambiencePlaying
}
