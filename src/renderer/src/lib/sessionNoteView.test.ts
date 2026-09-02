import { describe, expect, it } from 'vitest'
import { handoutButtonLabel, isItemSheetPath, sessionNoteFlags } from './sessionNoteView'

describe('sessionNoteView', () => {
  it('treats gear, spells, places, and factions as item sheets', () => {
    expect(isItemSheetPath('Gear/Potion.md')).toBe(true)
    expect(isItemSheetPath('Spells/Fire Bolt.md')).toBe(true)
    expect(isItemSheetPath('Places/Inn.md')).toBe(true)
    expect(isItemSheetPath('Factions/Guild.md')).toBe(true)
    expect(isItemSheetPath('Sessions/Night.md')).toBe(false)
  })

  it('labels the handout button from the folder', () => {
    expect(handoutButtonLabel('Spells/Fire Bolt.md')).toBe('Show spell to players')
    expect(handoutButtonLabel('Places/Inn.md')).toBe('Show place to players')
    expect(handoutButtonLabel('Factions/Guild.md')).toBe('Show faction to players')
    expect(handoutButtonLabel('Gear/Potion.md')).toBe('Show item to players')
  })

  it('opens map mode for a map fence when not editing', () => {
    const markdown = '```map\nimage: cave.png\n```\n'
    const flags = sessionNoteFlags({
      kind: 'note',
      path: 'Maps/Cave.md',
      markdown,
      editing: false
    })
    expect(flags.mapMode).toBe(true)
    expect(flags.sheetChrome).toBe(false)
  })

  it('stays in the editor when editing, even on a map note', () => {
    const flags = sessionNoteFlags({
      kind: 'note',
      path: 'Maps/Cave.md',
      markdown: '```map\nimage: cave.png\n```\n',
      editing: true
    })
    expect(flags.mapMode).toBe(false)
  })

  it('uses NPC sheet chrome for a Party PC note', () => {
    const markdown = ['# Bren', '', '```statblock', 'name: Bren Oak', 'hp: 12', '```', ''].join('\n')
    const flags = sessionNoteFlags({
      kind: 'note',
      path: 'Party/PC — Bren Oak.md',
      markdown,
      editing: false
    })
    expect(flags.npcMode).toBe(true)
    expect(flags.sheetChrome).toBe(true)
    expect(flags.parsedNpc?.block.name).toBe('Bren Oak')
  })

  it('surfaces a D&D Beyond character URL from the Party sheet', () => {
    const flags = sessionNoteFlags({
      kind: 'note',
      path: 'Party/PC — Aria.md',
      markdown: '| **D&D Beyond** | https://www.dndbeyond.com/characters/99-aria |\n',
      editing: false
    })
    expect(flags.beyondUrl).toBe('https://www.dndbeyond.com/characters/99')
  })

  it('surfaces a D&D Beyond monster URL from an NPC or Bestiary sheet', () => {
    const flags = sessionNoteFlags({
      kind: 'note',
      path: 'Bestiary/Goblin.md',
      markdown: '| **D&D Beyond** | https://www.dndbeyond.com/monsters/16780-goblin |\n',
      editing: false
    })
    expect(flags.beyondUrl).toBe('https://www.dndbeyond.com/monsters/16780-goblin')
  })
})
