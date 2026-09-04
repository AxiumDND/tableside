import type { NameList } from './npcNameLists'
import { parseSystemId } from './systemPack'

/** Sound of rolled names — independent of race/ancestry (species still comes from that picker). */
export type NameFlavorId =
  | 'classic'
  | 'norse'
  | 'greek'
  | 'celtic'
  | 'roman'
  | 'arabic'
  | 'slavic'
  | 'east-asian'

export type NameFlavorOption = { id: NameFlavorId; label: string }

export const NAME_FLAVOR_OPTIONS: NameFlavorOption[] = [
  { id: 'classic', label: 'Classic fantasy' },
  { id: 'norse', label: 'Norse' },
  { id: 'greek', label: 'Greek mythology' },
  { id: 'celtic', label: 'Celtic / Gaelic' },
  { id: 'roman', label: 'Roman / Latinate' },
  { id: 'arabic', label: 'Arabic / desert-fantasy' },
  { id: 'slavic', label: 'Slavic' },
  { id: 'east-asian', label: 'East Asian–inspired' }
]

function flavor(
  id: NameFlavorId,
  label: string,
  feminine: string[],
  masculine: string[],
  any: string[],
  family: string[]
): NameList {
  return {
    id,
    label,
    givenAny: any,
    givenFeminine: feminine,
    givenMasculine: masculine,
    family
  }
}

/**
 * Original Tableside table lists — phonetic flavor only, not scraped book/name-site dumps.
 * Used when Name flavor is not Classic fantasy.
 */
export const NAME_FLAVOR_LISTS: Record<Exclude<NameFlavorId, 'classic'>, NameList> = {
  norse: flavor(
    'norse',
    'Norse',
    ['Astrid', 'Brynhild', 'Freydis', 'Gunnhild', 'Ingrid', 'Ragna', 'Sigrid', 'Thyra', 'Unn', 'Yrsa'],
    ['Bjorn', 'Eirik', 'Gunnar', 'Hakon', 'Ivar', 'Leif', 'Ragnar', 'Sten', 'Torstein', 'Ulf'],
    ['Ashild', 'Kai', 'Rune', 'Soren', 'Tor'],
    ['Bloodaxe', 'Ironhelm', 'Ravenmark', 'Stormfjord', 'Wolfson', 'Yggroot']
  ),
  greek: flavor(
    'greek',
    'Greek mythology',
    ['Callista', 'Daphne', 'Helena', 'Iris', 'Lyra', 'Myrrine', 'Nike', 'Phoebe', 'Selene', 'Thalia'],
    ['Alexios', 'Damon', 'Hector', 'Leonidas', 'Nikos', 'Orion', 'Perseus', 'Stavros', 'Theron', 'Xander'],
    ['Ari', 'Cleo', 'Dorian', 'Hero', 'Theo'],
    ['of Athens', 'of Delphi', 'of Rhodes', 'of Sparta', 'of Thebes', 'Stormborn']
  ),
  celtic: flavor(
    'celtic',
    'Celtic / Gaelic',
    ['Aisling', 'Brigid', 'Deirdre', 'Eithne', 'Fiona', 'Maeve', 'Niamh', 'Orla', 'Saoirse', 'Siobhan'],
    ['Aidan', 'Brennan', 'Cian', 'Declan', 'Eoin', 'Fergus', 'Liam', 'Niall', 'Owen', 'Ronan'],
    ['Casey', 'Kerry', 'Morgan', 'Quinn', 'Riley'],
    ['MacBride', 'MacTavish', 'Oakenfield', 'Riverford', 'Stonebrook', 'Willowdale']
  ),
  roman: flavor(
    'roman',
    'Roman / Latinate',
    ['Aurelia', 'Claudia', 'Flavia', 'Julia', 'Livia', 'Octavia', 'Portia', 'Sabina', 'Valeria', 'Vita'],
    ['Antonius', 'Cassius', 'Lucius', 'Marcus', 'Quintus', 'Rufus', 'Severus', 'Titus', 'Varro', 'Vitus'],
    ['Felix', 'Nova', 'Remus', 'Silva', 'Vera'],
    ['Aquila', 'Corvinus', 'Flavian', 'Maximus', 'Severan', 'Valerian']
  ),
  arabic: flavor(
    'arabic',
    'Arabic / desert-fantasy',
    ['Amira', 'Farah', 'Laila', 'Nadia', 'Rania', 'Salma', 'Soraya', 'Yasira', 'Zahra', 'Zara'],
    ['Azim', 'Farid', 'Jamil', 'Karim', 'Nasir', 'Rashid', 'Samir', 'Tariq', 'Yasir', 'Zayd'],
    ['Noor', 'Sami', 'Zain'],
    ['Al-Mirage', 'Desertwind', 'of the Dunes', 'Sandveil', 'Starwell', 'Sunspear']
  ),
  slavic: flavor(
    'slavic',
    'Slavic',
    ['Anya', 'Bogdana', 'Irena', 'Katya', 'Mila', 'Nadia', 'Oksana', 'Svetlana', 'Vera', 'Zora'],
    ['Boris', 'Dmitri', 'Ivan', 'Marek', 'Nikolai', 'Pavel', 'Stanislaw', 'Viktor', 'Yuri', 'Zoran'],
    ['Misha', 'Sasha', 'Vanya'],
    ['Chernov', 'Kovac', 'Novak', 'Petrov', 'Sokolov', 'Volkov']
  ),
  'east-asian': flavor(
    'east-asian',
    'East Asian–inspired',
    ['Hana', 'Lin', 'Mei', 'Sora', 'Yuki', 'Yuna', 'Akira', 'Nori', 'Rin', 'Tala'],
    ['Haru', 'Jin', 'Kai', 'Ren', 'Sota', 'Takeshi', 'Hiro', 'Ken', 'Min', 'Ryo'],
    ['Ash', 'Jun', 'Sky'],
    ['of the Jade Court', 'of the River Gate', 'of the Twin Peaks', 'Silkroad', 'Stormpine', 'Willowbridge']
  )
}

export function isNameFlavorId(value: string): value is NameFlavorId {
  return NAME_FLAVOR_OPTIONS.some((option) => option.id === value)
}

/** Classic fantasy keeps the race/ancestry list; other flavors use dedicated pools. */
export function nameListForFlavor(raceOrTraditionList: NameList, flavorId: NameFlavorId): NameList {
  if (flavorId === 'classic') return raceOrTraditionList
  return NAME_FLAVOR_LISTS[flavorId]
}

/** Flavor picker is for systems that already pick race/ancestry separately. */
export function systemSupportsNameFlavors(system?: string | null): boolean {
  return parseSystemId(system) !== 'v5'
}
