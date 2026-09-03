import { describe, expect, it } from 'vitest'
import { npcPortraitUrl, pickNpcPortraitRefs, portraitRaceForList } from './npcPortraits'

describe('npcPortraits', () => {
  it('maps unknown list ids to other portraits', () => {
    expect(portraitRaceForList('human')).toBe('human')
    expect(portraitRaceForList('english')).toBe('other')
  })

  it('builds a tabledm URL for a portrait ref', () => {
    expect(npcPortraitUrl({ race: 'elf', gender: 'feminine', id: '03' })).toBe(
      'tabledm://npc-portrait/?race=elf&gender=feminine&id=03'
    )
  })

  it('picks four unique portrait refs', () => {
    const refs = pickNpcPortraitRefs('human', 'feminine', 4, [], () => 0.1)
    expect(refs).toHaveLength(4)
    const keys = refs.map((ref) => `${ref.race}/${ref.gender}/${ref.id}`)
    expect(new Set(keys).size).toBe(4)
  })
})
