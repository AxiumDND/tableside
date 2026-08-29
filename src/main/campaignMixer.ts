import { readdir } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import {
  AUDIO_EXT,
  applyMixerCommand,
  buildAudioLibrary,
  emptyMixerState,
  mixerPrefsToFile,
  parseMixerPrefs,
  type MixerCommand,
  type MixerState
} from '../shared/audio'
import { existingCanonicalDir, readJson, toPosix, writeJson } from './campaignFolder'

export type CampaignMixerDeps = {
  getCampaignFolder: () => string | null
  onStateChanged: (state: MixerState) => void
}

let deps: CampaignMixerDeps = {
  getCampaignFolder: () => null,
  onStateChanged: () => undefined
}

let mixer: MixerState = emptyMixerState()

export function configureCampaignMixer(next: CampaignMixerDeps): void {
  deps = next
}

export function getMixerState(): MixerState {
  return mixer
}

function emit(): void {
  deps.onStateChanged(mixer)
}

export async function listAudioFiles(root: string): Promise<string[]> {
  const audioRoot = await existingCanonicalDir(root, 'audio')
  if (!audioRoot) return []
  const out: string[] = []
  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue
      const full = join(dir, entry.name)
      if (entry.isDirectory()) await walk(full)
      else if (AUDIO_EXT.has(extname(entry.name).toLowerCase())) {
        out.push(toPosix(relative(root, full)))
      }
    }
  }
  await walk(audioRoot)
  return out
}

export async function persistMixerPrefs(): Promise<void> {
  const campaignFolder = deps.getCampaignFolder()
  if (!campaignFolder) return
  await writeJson(join(campaignFolder, 'audio.json'), mixerPrefsToFile(mixer.prefs))
}

export async function refreshMixerLibrary(): Promise<void> {
  const campaignFolder = deps.getCampaignFolder()
  if (!campaignFolder) {
    mixer = emptyMixerState()
    return
  }
  mixer = applyMixerCommand(mixer, {
    type: 'set-library',
    library: buildAudioLibrary(await listAudioFiles(campaignFolder))
  })
}

export async function loadMixerForCampaign(folder: string): Promise<void> {
  const prefs = parseMixerPrefs(await readJson(join(folder, 'audio.json'), {}))
  mixer = {
    ...emptyMixerState(),
    prefs,
    library: buildAudioLibrary(await listAudioFiles(folder))
  }
}

export async function runMixer(command: MixerCommand): Promise<MixerState> {
  mixer = applyMixerCommand(mixer, command)
  if (command.type === 'set-prefs' || command.type === 'play-music' || command.type === 'play-ambience') {
    void persistMixerPrefs()
  }
  emit()
  return mixer
}

export function resetMixer(): void {
  mixer = emptyMixerState()
  emit()
}

export function broadcastMixerState(): void {
  emit()
}
