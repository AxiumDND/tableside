import { applyNpcCr, replaceNpcStatblockFence } from '../../../shared/npcQuickCreate'
import { applyNpcSpecies } from '../../../shared/npcNames'
import { extractStatblock, parsedToBestiaryMarkdown } from './statblock'
import { getSrd, srdMonsterToBestiaryMarkdown } from './srd'

export function statblockFenceForNpc(npcName: string, srdId: string): string | null {
  const record = getSrd(srdId)
  if (!record || record.kind !== 'monster') return null
  const md = srdMonsterToBestiaryMarkdown(record.data)
  const extracted = extractStatblock(md)
  if (!extracted) return null
  extracted.block.name = npcName
  const beast = parsedToBestiaryMarkdown(extracted.block)
  const match = /```statblock\r?\n[\s\S]*?```/i.exec(beast)
  return match?.[0] ?? null
}

export function enrichNpcSheet(
  markdown: string,
  npcName: string,
  species: string,
  statBlockId: string | null
): string {
  let next = applyNpcSpecies(markdown, species)
  if (statBlockId) {
    const fence = statblockFenceForNpc(npcName, statBlockId)
    if (fence) {
      next = replaceNpcStatblockFence(next, fence)
      const cr = getSrd(statBlockId)?.data?.cr
      if (cr != null && String(cr).trim()) next = applyNpcCr(next, String(cr))
    }
  }
  return next
}
