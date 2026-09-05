import type { Combatant, PlayerMapView } from '../../../shared/types'
import { campaignFileUrl, portraitForNote, type CampaignImage } from '../lib/images'
import { fogAllClear, encodeFog, fogSizeOf } from '../lib/mapFog'
import type { MapCamera } from '../lib/mapCamera'
import { toPlayerMapToken, type CreatureSpace, type MapToken } from '../lib/mapNote'
import { tokenOverlayTags } from '../lib/mapTokenCombat'
import {
  allPartyNotes,
  bestiaryNotes,
  npcNotes,
  sheetDisplayName,
  type CampaignNote
} from '../lib/notes'

export type MapTool = 'pan' | 'pin' | 'token' | 'fog' | 'reveal'
export type PinAction = 'view' | 'add' | 'edit' | 'delete'
export type PickerTab = 'pc' | 'npc' | 'monster'

export interface TokenPick {
  kind: MapToken['kind']
  source: string
  label: string
  imageSrc: string | null
  space: CreatureSpace
}

export function liveView(
  camera: MapCamera,
  cells: Uint8Array,
  tokens: MapToken[],
  images: CampaignImage[],
  tokenScale: number,
  dragPos: { id: string; x: number; y: number } | null,
  hideBundled = false,
  combatants: Combatant[] = [],
  system?: string | null
): PlayerMapView {
  const placed = dragPos
    ? tokens.map((token) => (token.id === dragPos.id ? { ...token, x: dragPos.x, y: dragPos.y } : token))
    : tokens
  return {
    zoom: camera.zoom,
    centerX: camera.centerX,
    centerY: camera.centerY,
    fog: fogAllClear(cells) ? '' : encodeFog(cells),
    fogSize: fogSizeOf(cells),
    tokens: placed.map((token) =>
      toPlayerMapToken(
        token,
        images,
        tokenScale,
        hideBundled,
        tokenOverlayTags(token, combatants, system)
      )
    )
  }
}

export function toolButton(active: boolean): string {
  return active
    ? 'rounded bg-amber px-2 py-0.5 font-semibold text-on-amber'
    : 'rounded border border-line px-2 py-0.5 hover:border-amber'
}

export function primaryTool(tool: MapTool): 'pan' | 'pin' | 'token' | 'fog' {
  return tool === 'reveal' ? 'fog' : tool
}

export function catalogFromNotes(notes: CampaignNote[], images: CampaignImage[]): Record<PickerTab, TokenPick[]> {
  const toPick = (note: CampaignNote, kind: MapToken['kind']): TokenPick => {
    const portrait = portraitForNote(note.relativePath, images)
    return {
      kind,
      source: note.relativePath,
      label: sheetDisplayName(note.stem),
      imageSrc: portrait ? campaignFileUrl(portrait) : null,
      space: 'medium'
    }
  }
  return {
    pc: allPartyNotes(notes).map((note) => toPick(note, 'pc')),
    npc: npcNotes(notes).map((note) => toPick(note, 'npc')),
    monster: bestiaryNotes(notes).map((note) => toPick(note, 'monster'))
  }
}
