import { describe, expect, it } from 'vitest'
import {
  FALLBACK_TEMPLATES,
  desiredNoteFileStem,
  fillTemplate,
  gameNightSheetFileStem,
  headingTitleFromMarkdown,
  isPlaceholderHeadingTitle,
  partyLinkList,
  partyRosterFileStem,
  sessionRecapFileStem,
  wikiLinkForSheet
} from './sheetTemplates'
import { templatesFor } from './systemTemplates'
import { parseSystemId } from './systemPack'

describe('party links', () => {
  it('aliases PC — filenames to the character name', () => {
    expect(wikiLinkForSheet('PC — Jasper Alderwick')).toBe(
      '[[PC — Jasper Alderwick|Jasper Alderwick]]'
    )
    expect(wikiLinkForSheet('Lucian Radu')).toBe('[[Lucian Radu]]')
  })

  it('lists Party sheets or a prompt when the folder is empty', () => {
    expect(partyLinkList([])).toContain('No Party sheets yet')
    expect(partyLinkList(['PC — Lykta Endrino', 'PC — Dallas Hinterfield'])).toBe(
      [
        '- [[PC — Dallas Hinterfield|Dallas Hinterfield]]',
        '- [[PC — Lykta Endrino|Lykta Endrino]]'
      ].join('\n')
    )
  })
})

describe('game night sheet names', () => {
  it('appends Game Night Sheet to a session title', () => {
    expect(gameNightSheetFileStem('Session 4')).toBe('Session 4 — Game Night Sheet')
    expect(gameNightSheetFileStem('Session 4 — Night Sheet')).toBe('Session 4 — Game Night Sheet')
    expect(gameNightSheetFileStem('Session 4 — Game Night Sheet')).toBe('Session 4 — Game Night Sheet')
  })
})

describe('session recap names', () => {
  it('appends Recap to a session title', () => {
    expect(sessionRecapFileStem('Session 4')).toBe('Session 4 — Recap')
    expect(sessionRecapFileStem('Session 4 Recap')).toBe('Session 4 — Recap')
    expect(sessionRecapFileStem('Session 4 — Recap')).toBe('Session 4 — Recap')
  })
})

describe('party roster names', () => {
  it('keeps Party Roster and appends Roster to other titles', () => {
    expect(partyRosterFileStem('Party Roster')).toBe('Party Roster')
    expect(partyRosterFileStem('The Table')).toBe('The Table — Roster')
    expect(partyRosterFileStem('The Table — Roster')).toBe('The Table — Roster')
  })
})

describe('heading title → filename', () => {
  it('reads # and # *Title* headings', () => {
    expect(headingTitleFromMarkdown('# Potion of Healing\n\nBody')).toBe('Potion of Healing')
    expect(headingTitleFromMarkdown("# *Lucian's Blade*\n\nBody")).toBe("Lucian's Blade")
    expect(headingTitleFromMarkdown('## Not the title\n')).toBeNull()
  })

  it('treats template placeholders as non-renaming titles', () => {
    expect(isPlaceholderHeadingTitle('Item Name')).toBe(true)
    expect(isPlaceholderHeadingTitle('Session Name — Game Night Sheet')).toBe(true)
    expect(isPlaceholderHeadingTitle('Session Name — Recap')).toBe(true)
    expect(isPlaceholderHeadingTitle('Party Roster')).toBe(true)
    expect(isPlaceholderHeadingTitle('Cloak of Shadows')).toBe(false)
  })

  it('preserves PC — and Game Night Sheet stems', () => {
    expect(desiredNoteFileStem('Gear/Magic Items/Potion of Healing.md', 'Cloak of Shadows')).toBe(
      'Cloak of Shadows'
    )
    expect(desiredNoteFileStem('Party/PC — Aria.md', 'Aria Vale')).toBe('PC — Aria Vale')
    expect(desiredNoteFileStem('Sessions/test — Game Night Sheet.md', 'River Ambush')).toBe(
      'River Ambush — Game Night Sheet'
    )
    expect(desiredNoteFileStem('Sessions/test — Recap.md', 'River Ambush')).toBe('River Ambush — Recap')
    expect(desiredNoteFileStem('Party/The Table — Roster.md', 'The Table')).toBe('The Table — Roster')
    expect(desiredNoteFileStem('Gear/Item.md', 'Item Name')).toBeNull()
  })
})

describe('creature sheet templates', () => {
  it('puts the player statblock above notes', () => {
    const body = fillTemplate(FALLBACK_TEMPLATES.player, 'player', 'Mira Vess')
    expect(body.indexOf('```statblock')).toBeLessThan(body.indexOf('## At the table'))
    expect(body).toContain('![[Mira Vess.png]]')
  })

  it('puts the NPC and monster statblocks above notes', () => {
    const npc = fillTemplate(FALLBACK_TEMPLATES.npc, 'npc', 'Hale')
    const monster = fillTemplate(FALLBACK_TEMPLATES.monster, 'monster', 'Ghoul')
    expect(npc.indexOf('```statblock')).toBeLessThan(npc.indexOf('## Notes'))
    expect(monster.indexOf('```statblock')).toBeLessThan(monster.indexOf('## Notes'))
  })
})

describe('item sheet templates', () => {
  it('puts gear and spell stats in a typed sheet header table', () => {
    const gear = fillTemplate(FALLBACK_TEMPLATES.gear, 'gear', 'Acid')
    expect(gear).toContain('[!gear]')
    expect(gear).toContain('[!/gear]')
    expect(gear).toContain('![[Acid.png]]')
    expect(gear).toContain('| **Weight** |')
    expect(gear).toContain('| **Cost** |')
    const spell = fillTemplate(FALLBACK_TEMPLATES.spell, 'spell', 'Fireball')
    expect(spell).toContain('[!spell]')
    expect(spell).toContain('[!/spell]')
    expect(spell).toContain('| **Casting Time** |')
    expect(spell).toContain('| **Range** |')
  })
})

describe('game night sheet template', () => {
  it('fills the session name, Party links, and leaves monster placeholders', () => {
    const body = fillTemplate(FALLBACK_TEMPLATES.nightsheet, 'nightsheet', 'Session 4', {
      partyStems: ['PC — Jasper Alderwick', 'PC — Lucian Radu']
    })
    expect(body).toContain('# Session 4 — Game Night Sheet')
    expect(body).toContain('Prose in [[Session 4]]')
    expect(body).toContain('[[PC — Jasper Alderwick|Jasper Alderwick]]')
    expect(body).toContain('[[PC — Lucian Radu|Lucian Radu]]')
    expect(body).not.toContain('{{party}}')
    expect(body).toContain('**Combatants:** party')
    expect(body).toContain('## 1. The Party')
    expect(body).toContain('[!party]')
    expect(body).toContain('[!note] Focus tonight')
    expect(body).toContain('## 2. Scenes')
    expect(body).toContain('[!scene] Opening — name the beat')
    expect(body).toContain('[!scene] Scene — name the beat')
    expect(body).toContain('[!combat] Combat 1 — name the encounter')
    expect(body).toContain('**NPCs in this scene**')
    expect(body).toContain('**Secrets and clues in this scene**')
    expect(body).toContain('[!treasure]')
    expect(body).toContain('**Coin:** … pp · … gp · … sp · … cp')
    expect(body).toContain('**Magic:**')
    expect(body).toContain('**Combatants:** party')
    expect(body).not.toContain('**Combat in this scene**')
    expect(body).not.toContain('## ⚔️ Combat 1')
    expect(body).toContain('**At the table**')
    expect(body).toContain('If they miss / flee')
    expect(body).toContain('Music: General / Creepy / Combat')
    expect(body).toContain('[!gmonly] Only you')
    expect(body).not.toContain('## 3. Secrets and clues')
    expect(body).not.toContain('## 3. From last time')
    expect(body).not.toContain('## 4. Likely endings')
    expect(body).not.toContain('## 4. NPCs')
    expect(body).not.toContain('## 4. Treasure')
    expect(body).not.toContain('## 5. Monsters')
    expect(body).not.toContain('## 1. The characters')
    expect(body).not.toContain('## 5. Locations')
    expect(body).not.toContain('{{crawl}}')
    expect(body).not.toContain('[!crawl]')
  })

  it('adds an Opening crawl sample only on Sci-fi campaigns', () => {
    const scifi = fillTemplate(FALLBACK_TEMPLATES.nightsheet, 'nightsheet', 'Session 4', {
      theme: 'scifi'
    })
    expect(scifi).toContain('[!crawl] The Siege of Kestrel')
    expect(scifi).toContain('It is a time of unrest.')
    expect(scifi).toContain('Kestrel’s orbital ring')
    expect(scifi).not.toContain('{{crawl}}')

    const classic = fillTemplate(FALLBACK_TEMPLATES.nightsheet, 'nightsheet', 'Session 4', {
      theme: 'classic'
    })
    expect(classic).not.toContain('[!crawl]')
    expect(classic).not.toContain('{{crawl}}')
    expect(classic).toContain('[!legend] The Pale Well')
    expect(classic).not.toContain('{{legend}}')
  })

  it('adds an Opening legend sample on Classic, Light, and Vampire campaigns', () => {
    for (const theme of ['classic', 'light', 'vampire'] as const) {
      const body = fillTemplate(FALLBACK_TEMPLATES.nightsheet, 'nightsheet', 'Session 4', { theme })
      expect(body).toContain('[!legend] The Pale Well')
      expect(body).not.toContain('{{legend}}')
    }
    const scifi = fillTemplate(FALLBACK_TEMPLATES.nightsheet, 'nightsheet', 'Session 4', { theme: 'scifi' })
    expect(scifi).not.toContain('[!legend]')
  })

  it('injects a legend into the Greystead stock night sheet template file', async () => {
    const { readFile } = await import('node:fs/promises')
    const { fileURLToPath } = await import('node:url')
    const { dirname, join } = await import('node:path')
    const root = join(dirname(fileURLToPath(import.meta.url)), '../../examples/greystead/Templates/Game Night Sheet.md')
    const oldTemplate = await readFile(root, 'utf8')
    const body = fillTemplate(oldTemplate, 'nightsheet', 'Session 4', {
      partyStems: ['PC — Bren Oak'],
      theme: 'classic'
    })
    expect(body).toContain('[!legend] The Pale Well')
  })

  it('injects a legend into an old Classic night sheet template without {{legend}} (CRLF)', () => {
    const oldTemplate = [
      '# Session Name — Game Night Sheet',
      '',
      '> [!abstract] Tonight at a glance',
      '> Opening scene → next beats → **the fight** → fallout.',
      '',
      '{{crawl}}',
      '',
      '## 1. The Party',
      ''
    ].join('\r\n')
    const body = fillTemplate(oldTemplate, 'nightsheet', 'Session 4', { theme: 'classic' })
    expect(body).toContain('[!legend] The Pale Well')
    expect(body.indexOf('[!legend]')).toBeLessThan(body.indexOf('## 1. The Party'))
  })

  it('injects a legend into an old Classic night sheet with Mac-style line endings', () => {
    const oldTemplate = [
      '# Session Name — Game Night Sheet',
      '',
      '> [!abstract] Tonight at a glance',
      '> Opening scene → next beats → **the fight** → fallout.',
      '',
      '{{crawl}}',
      '',
      '## 1. The Party',
      ''
    ].join('\r\r\n')
    const body = fillTemplate(oldTemplate, 'nightsheet', 'Session 4', { theme: 'classic' })
    expect(body).toContain('[!legend] The Pale Well')
    expect(body.indexOf('[!legend]')).toBeLessThan(body.indexOf('## 1. The Party'))
  })

  it('injects a crawl into an old Sci-fi night sheet that has no {{crawl}} marker', () => {
    const body = fillTemplate(
      '# Session Name — Night Sheet\n\n> [!abstract] Tonight\n> Start.\n\n## 1. The Party\n',
      'nightsheet',
      'Session 4',
      { theme: 'scifi' }
    )
    expect(body).toContain('[!crawl] The Siege of Kestrel')
    expect(body.indexOf('[!crawl]')).toBeLessThan(body.indexOf('## 1. The Party'))
  })

  it('injects Party links into an old night sheet that has no {{party}} marker', () => {
    const body = fillTemplate(
      '# Session Name — Night Sheet\n\n**Combatants:** [[Ghoul]] · party\n',
      'nightsheet',
      'Session 4',
      { partyStems: ['PC — Jasper Alderwick'] }
    )
    expect(body).toContain('# Session 4 — Night Sheet')
    expect(body).toContain('## The characters')
    expect(body).toContain('[[PC — Jasper Alderwick|Jasper Alderwick]]')
    expect(body).toContain('**Combatants:** [[Ghoul]] · party')
  })
})

describe('session recap template', () => {
  it('fills the session name, Party links, and recap headings', () => {
    const body = fillTemplate(FALLBACK_TEMPLATES.recap, 'recap', 'Session 4', {
      partyStems: ['PC — Jasper Alderwick', 'PC — Lucian Radu']
    })
    expect(body).toContain('# Session 4 — Recap')
    expect(body).toContain('Prep stays on [[Session 4 — Game Night Sheet]]')
    expect(body).toContain('[[PC — Jasper Alderwick|Jasper Alderwick]]')
    expect(body).toContain('[[PC — Lucian Radu|Lucian Radu]]')
    expect(body).not.toContain('{{party}}')
    expect(body).toContain('[!party]')
    expect(body).toContain('## What happened')
    expect(body).toContain('## Who and where')
    expect(body).toContain('## What they have')
    expect(body).toContain('## Threads')
    expect(body).toContain('[!gmonly]')
    expect(body).not.toContain('[!readaloud]')
    expect(body).not.toContain('[!scene]')
    expect(body).not.toContain('[!combat]')
  })
})

describe('party roster template', () => {
  it('fills Party links in one [!party] block', () => {
    const body = fillTemplate(FALLBACK_TEMPLATES.roster, 'roster', 'Party Roster', {
      partyStems: ['PC — Jasper Alderwick', 'PC — Lucian Radu']
    })
    expect(body).toContain('# Party Roster')
    expect(body).toContain('[!party]')
    expect(body).toContain('[[PC — Jasper Alderwick|Jasper Alderwick]]')
    expect(body).toContain('[[PC — Lucian Radu|Lucian Radu]]')
    expect(body).toContain('[[NPC Name]]')
    expect(body).not.toContain('{{party}}')
    expect(body).toContain('[!gmonly]')
    expect(body.split('[!party]').length - 1).toBe(1)
  })
})

describe('place, shop, and faction templates', () => {
  it('fills place, shop, and faction names and keeps cross-links', () => {
    const place = fillTemplate(FALLBACK_TEMPLATES.place, 'place', 'Greystead')
    expect(place).toContain('# Greystead')
    expect(place).toContain('![[Greystead.png]]')
    expect(place).toContain('[[NPC Name]]')
    expect(place).toContain('[[Shop Name]]')
    expect(place).not.toContain('Place Name')

    const shop = fillTemplate(FALLBACK_TEMPLATES.shop, 'shop', 'The Grey Mare')
    expect(shop).toContain('# The Grey Mare')
    expect(shop).toContain('| **Proprietor** | [[NPC Name]] |')
    expect(shop).toContain('| **Place** | [[Place Name]] |')
    expect(shop).toContain('| **Standing** | Neutral |')
    expect(shop).toContain('## Stock')

    const faction = fillTemplate(FALLBACK_TEMPLATES.faction, 'faction', 'The Pale Well')
    expect(faction).toContain('# The Pale Well')
    expect(faction).toContain('| **Leader** | [[NPC Name]] |')
    expect(faction).toContain('| **HQ** | [[Place Name]] |')
  })
})

describe('system packs', () => {
  it('defaults unknown campaign system ids to dnd5e', () => {
    expect(parseSystemId(undefined)).toBe('dnd5e')
    expect(parseSystemId('')).toBe('dnd5e')
    expect(parseSystemId('pf2e')).toBe('pf2e')
  })

  it('keeps 5e templates as the default fallback', () => {
    expect(templatesFor('dnd5e').recap).toBe(FALLBACK_TEMPLATES.recap)
    expect(templatesFor('dnd5e').roster).toBe(FALLBACK_TEMPLATES.roster)
    expect(templatesFor('dnd5e').player).toContain('layout: Basic 5e Layout')
  })

  it('seeds Pathfinder sheets with Ancestry and Perception', () => {
    const player = fillTemplate(templatesFor('pf2e').player, 'player', 'Mira Vess')
    expect(player).toContain('layout: Basic PF2e Layout')
    expect(player).toContain('| **Ancestry** |')
    expect(player).toContain('| **Perception** |')
    expect(player).not.toContain('Basic 5e Layout')
  })

  it('seeds Vampire sheets with Health, Willpower, Hunger, and a blank Clan field', () => {
    const player = fillTemplate(templatesFor('v5').player, 'player', 'Ash Vale')
    expect(player).toContain('layout: Basic V5 Layout')
    expect(player).toContain('| **Health** |')
    expect(player).toContain('| **Willpower** |')
    expect(player).toContain('| **Hunger** |')
    expect(player).toContain('| **Clan** |')
    expect(player).toContain('*(fill your own)*')
  })
})
