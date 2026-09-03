export type TableLink = {
  id: string
  title: string
  url: string
  blurb: string
}

export type TableLinkCategory = {
  id: string
  title: string
  links: TableLink[]
}

/** Curated external sites for running D&D — opened in the system browser, not embedded. */
export const TABLE_LINK_CATEGORIES: TableLinkCategory[] = [
  {
    id: 'official',
    title: 'Official & characters',
    links: [
      {
        id: 'dnd-beyond',
        title: 'D&D Beyond',
        url: 'https://www.dndbeyond.com/',
        blurb: 'Official rules reference, digital character sheets, and homebrew browsing.'
      }
    ]
  },
  {
    id: 'maps',
    title: 'Maps & visuals',
    links: [
      {
        id: 'inkarnate',
        title: 'Inkarnate',
        url: 'https://inkarnate.com/',
        blurb: 'Browser-based map maker for battlemaps and world maps.'
      }
    ]
  },
  {
    id: 'advice',
    title: 'GM prep & advice',
    links: [
      {
        id: 'sly-flourish',
        title: 'Sly Flourish',
        url: 'https://slyflourish.com/',
        blurb: 'The Lazy GM blog — fast prep, focused encounters, and smooth sessions.'
      }
    ]
  },
  {
    id: 'generators',
    title: 'Generators & improvisation',
    links: [
      {
        id: 'donjon',
        title: 'Donjon',
        url: 'https://donjon.bin.sh/5e/',
        blurb: 'Quick NPC, treasure, dungeon, and encounter generation for improvisation.'
      },
      {
        id: 'fantasy-names',
        title: 'Fantasy Name Generators',
        url: 'https://fantasynamegenerators.com/',
        blurb: 'Names for NPCs, towns, factions, and dozens of fantasy settings.'
      },
      {
        id: 'auto-roll-tables',
        title: 'Auto Roll Tables',
        url: 'https://autorolltables.github.io/',
        blurb: 'Random tables for encounter details, objects, and story beats to keep sessions dynamic.'
      }
    ]
  }
]
