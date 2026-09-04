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

/** Curated external sites for DM prep and running D&D — opened in the system browser, not embedded. */
export const TABLE_LINK_CATEGORIES: TableLinkCategory[] = [
  {
    id: 'official',
    title: 'Rules & characters',
    links: [
      {
        id: 'dnd-beyond',
        title: 'D&D Beyond',
        url: 'https://www.dndbeyond.com/',
        blurb: 'Official rules reference, digital character sheets, and homebrew browsing.'
      },
      {
        id: 'dnd-free-rules',
        title: 'D&D Free Rules',
        url: 'https://www.dndbeyond.com/sources/dnd/free-rules',
        blurb: 'Free basic rules and character options on D&D Beyond — good for quick lookups at the table.'
      },
      {
        id: 'open5e',
        title: 'Open5e',
        url: 'https://open5e.com/',
        blurb: 'Searchable SRD monsters, spells, and items in the browser when you want a second rules window.'
      },
      {
        id: '5e-tools',
        title: '5e Tools',
        url: 'https://5e.tools/',
        blurb: 'Fast SRD browser for spells, monsters, and items — handy second screen during prep.'
      }
    ]
  },
  {
    id: 'maps',
    title: 'Maps & battlemaps',
    links: [
      {
        id: 'inkarnate',
        title: 'Inkarnate',
        url: 'https://inkarnate.com/',
        blurb: 'Browser-based map maker for battlemaps and world maps.'
      },
      {
        id: 'dungeon-scrawl',
        title: 'Dungeon Scrawl',
        url: 'https://dungeonscrawl.com/',
        blurb: 'Quick freehand dungeon and battlemap drawing in the browser.'
      },
      {
        id: 'watabou',
        title: 'Watabou generators',
        url: 'https://watabou.github.io/',
        blurb: 'One-click village, dungeon, and city map generators for last-minute maps.'
      },
      {
        id: 'azgaar',
        title: 'Azgaar Fantasy Map Generator',
        url: 'https://azgaar.github.io/Fantasy-Map-Generator/',
        blurb: 'Procedural continent and region maps with cultures, routes, and biomes.'
      }
    ]
  },
  {
    id: 'art',
    title: 'Tokens, portraits & free art',
    links: [
      {
        id: 'forgotten-adventures',
        title: 'Forgotten Adventures',
        url: 'https://www.forgotten-adventures.net/',
        blurb: 'Free and Patreon battlemap / token assets used widely for virtual and TV maps.'
      },
      {
        id: 'two-minute-tabletop',
        title: '2-Minute Tabletop',
        url: 'https://2minutetabletop.com/',
        blurb: 'Free tokens, props, and map assets with clear licensing for table use.'
      },
      {
        id: 'hero-forge',
        title: 'Hero Forge',
        url: 'https://www.heroforge.com/',
        blurb: 'Build custom mini portraits or printables for PCs and memorable NPCs.'
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
      },
      {
        id: 'monsters-know',
        title: 'The Monsters Know What They\'re Doing',
        url: 'https://themonstersknow.com/',
        blurb: 'Tactics writeups so monsters fight like they mean it — great combat prep.'
      },
      {
        id: 'rpgbot',
        title: 'RPGBOT',
        url: 'https://rpgbot.net/',
        blurb: 'Class and build analysis when players ask “is this option any good?”'
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
      },
      {
        id: 'kobold-plus',
        title: 'Kobold Fight Club',
        url: 'https://koboldplus.club/',
        blurb: 'Build and balance 5e encounters by CR and party size.'
      },
      {
        id: 'chartopia',
        title: 'Chartopia',
        url: 'https://chartopia.d12dev.com/',
        blurb: 'Huge library of random tables — loot, rumors, complications, and more.'
      }
    ]
  },
  {
    id: 'music',
    title: 'Music & ambience',
    links: [
      {
        id: 'tabletop-audio',
        title: 'Tabletop Audio',
        url: 'https://tabletopaudio.com/',
        blurb: 'Loopable ambience and battle beds made for RPGs — play in a browser tab or download.'
      },
      {
        id: 'syrinscape',
        title: 'Syrinscape',
        url: 'https://syrinscape.com/',
        blurb: 'Layered soundscapes for combat and exploration (subscription app; free samples available).'
      },
      {
        id: 'incompetech',
        title: 'Incompetech',
        url: 'https://incompetech.com/music/royalty-free/',
        blurb: 'Kevin MacLeod royalty-free tracks — fine for mood playlists you own the rights to use.'
      }
    ]
  },
  {
    id: 'tables',
    title: 'Puzzles, traps & tables',
    links: [
      {
        id: 'donjon-traps',
        title: 'Donjon — traps',
        url: 'https://donjon.bin.sh/fantasy/random/#type=trap',
        blurb: 'Instant random trap ideas when the party opens the wrong door.'
      },
      {
        id: 'dndspeak',
        title: 'DNDspeak',
        url: 'https://www.dndspeak.com/',
        blurb: 'Huge lists of rumors, dungeon details, NPC quirks, and other rollable prep tables.'
      },
      {
        id: 'reddit-d100',
        title: 'r/d100',
        url: 'https://www.reddit.com/r/d100/',
        blurb: 'Community d100 lists for almost any table situation — browse before the session.'
      }
    ]
  }
]
