import type { SystemId } from './systemPack'

export type NameList = {
  id: string
  label: string
  givenAny: string[]
  givenFeminine?: string[]
  givenMasculine?: string[]
  family?: string[]
}

export type NameCatalog = {
  pickerLabel: string
  lists: NameList[]
}

function names(
  id: string,
  label: string,
  givenAny: string[],
  extra?: Pick<NameList, 'givenFeminine' | 'givenMasculine' | 'family'>
): NameList {
  return { id, label, givenAny, ...extra }
}

const HUMAN: NameList = names(
  'human',
  'Human',
  ['Ash', 'Bren', 'Cal', 'Ellis', 'Jules', 'Kit', 'Morgan', 'Nico', 'Quinn', 'Rowan', 'Sage', 'Toby'],
  {
    givenFeminine: ['Ada', 'Cora', 'Elena', 'Ivy', 'Lila', 'Mara', 'Nora', 'Priya', 'Rosa', 'Tamsin'],
    givenMasculine: ['Anton', 'Bram', 'Dorian', 'Emric', 'Gareth', 'Harun', 'Ivo', 'Jonas', 'Luc', 'Pavel'],
    family: [
      'Alden',
      'Bramwell',
      'Carver',
      'Dunlow',
      'Hale',
      'Merrick',
      'Oakley',
      'Rook',
      'Thorne',
      'Voss',
      'Wren',
      'Yarrow'
    ]
  }
)

const ELF: NameList = names(
  'elf',
  'Elf',
  ['Aelin', 'Faelar', 'Ithil', 'Laerion', 'Silvyn', 'Theren'],
  {
    givenFeminine: ['Althaea', 'Elyndra', 'Lirael', 'Nimue', 'Saelith', 'Vaela'],
    givenMasculine: ['Aelarion', 'Caelorn', 'Eldrin', 'Orist', 'Thalior', 'Vaeril'],
    family: ['Evenbrook', 'Moonbough', 'Silverfrond', 'Starfen', 'Valebright', 'Whisperleaf']
  }
)

const DWARF: NameList = names(
  'dwarf',
  'Dwarf',
  ['Bram', 'Dara', 'Kell', 'Mora', 'Olin', 'Sigrid'],
  {
    givenFeminine: ['Bera', 'Greta', 'Helga', 'Inga', 'Katla', 'Thyra'],
    givenMasculine: ['Barin', 'Durgan', 'Harrik', 'Sten', 'Torvak', 'Veld'],
    family: ['Anvilmark', 'Deepdelve', 'Ironbrow', 'Stonekeg', 'Truevein', 'Underhearth']
  }
)

const HALFLING: NameList = names(
  'halfling',
  'Halfling',
  ['Pip', 'Reed', 'Sunny', 'Tilly', 'Wren', 'Yarrow'],
  {
    givenFeminine: ['Bramble', 'Clover', 'Daisy', 'Hazel', 'Poppy', 'Rosie'],
    givenMasculine: ['Bennet', 'Hob', 'Milo', 'Ollie', 'Perrin', 'Tobin'],
    family: ['Burrowell', 'Goodmead', 'Greenkettle', 'Hearthfoot', 'Puddlewick', 'Tealeaf']
  }
)

const GNOME: NameList = names(
  'gnome',
  'Gnome',
  ['Bix', 'Fizz', 'Nim', 'Pipkin', 'Tock', 'Wizzle'],
  {
    givenFeminine: ['Glimmer', 'Liri', 'Nixa', 'Quill', 'Tansy', 'Zib'],
    givenMasculine: ['Cog', 'Fibble', 'Gim', 'Norrick', 'Rix', 'Tindle'],
    family: ['Copperwhistle', 'Gearspring', 'Nimblewick', 'Sparkspindle', 'Tinkerthread', 'Wobblecog']
  }
)

const GOBLIN: NameList = names(
  'goblin',
  'Goblin',
  ['Grik', 'Nub', 'Rix', 'Skab', 'Vex', 'Zit'],
  {
    givenFeminine: ['Gree', 'Kiki', 'Naza', 'Skril', 'Vasha', 'Zee'],
    givenMasculine: ['Bolg', 'Drak', 'Gnar', 'Krenk', 'Snag', 'Urg'],
    family: ['Ashbite', 'Mudpocket', 'Ratwhisker', 'Scrapknuckle', 'Sootear', 'Twigfang']
  }
)

const ORC: NameList = names(
  'orc',
  'Orc',
  ['Ashur', 'Brenna', 'Keth', 'Maraak', 'Rook', 'Vasha'],
  {
    givenFeminine: ['Grisha', 'Kael', 'Nera', 'Shura', 'Tala', 'Ursa'],
    givenMasculine: ['Durg', 'Ghor', 'Hrusk', 'Karg', 'Thokk', 'Vorun'],
    family: ['Blacktusk', 'Ironjaw', 'Redcliff', 'Stormgut', 'Thunderbone', 'Wolfscar']
  }
)

const TIEFLING: NameList = names(
  'tiefling',
  'Tiefling',
  ['Ashen', 'Ember', 'Haze', 'Nyx', 'Soot', 'Vesper'],
  {
    givenFeminine: ['Calida', 'Mirelle', 'Seraphine', 'Vespera', 'Zarael', 'Zephyra'],
    givenMasculine: ['Azarel', 'Cinder', 'Malrik', 'Raam', 'Thorne', 'Vexor'],
    family: ['Ashveil', 'Cindermark', 'Duskhorn', 'Emberglass', 'Nightcoil', 'Shadebrook']
  }
)

const DRAGONBORN: NameList = names(
  'dragonborn',
  'Dragonborn',
  ['Kava', 'Nala', 'Sahr', 'Vesh', 'Yrika', 'Zhur'],
  {
    givenFeminine: ['Eshara', 'Kelvi', 'Orrasha', 'Sahrin', 'Vezka', 'Yashara'],
    givenMasculine: ['Dhurj', 'Kethor', 'Orvash', 'Rhazak', 'Skarn', 'Vhask'],
    family: ['Clearmelt', 'Emberclutch', 'Goldscale', 'Ironcrest', 'Stormwing', 'Verdanthall']
  }
)

const OTHER: NameList = names(
  'other',
  'Other',
  ['Ash', 'Briar', 'Crow', 'Fern', 'Grey', 'Hollow', 'Ivy', 'Moss', 'Pike', 'Rook', 'Thorn', 'Wren'],
  {
    family: ['At-the-Gate', 'From-Away', 'Of-the-Road', 'Underhill', 'Without-a-House']
  }
)

const LESHY: NameList = names(
  'leshy',
  'Leshy',
  ['Acorn', 'Bark', 'Bramble', 'Cindercone', 'Dew', 'Fern', 'Gall', 'Lichen', 'Moss', 'Nettle', 'Puffball', 'Root'],
  {
    family: ['of the Copse', 'of the Hollow', 'of the Marsh', 'of the Ridge', 'of the Thicket']
  }
)

function tradition(
  id: string,
  label: string,
  feminine: string[],
  masculine: string[],
  family: string[]
): NameList {
  return names(id, label, [], { givenFeminine: feminine, givenMasculine: masculine, family })
}

export const NPC_NAME_CATALOGS: Record<SystemId, NameCatalog> = {
  dnd5e: {
    pickerLabel: 'Race',
    lists: [HUMAN, ELF, DWARF, HALFLING, GNOME, GOBLIN, ORC, TIEFLING, DRAGONBORN, OTHER]
  },
  pf2e: {
    pickerLabel: 'Ancestry',
    lists: [HUMAN, DWARF, ELF, GNOME, GOBLIN, HALFLING, ORC, LESHY, OTHER]
  },
  v5: {
    pickerLabel: 'Name tradition',
    lists: [
      tradition(
        'english',
        'English',
        ['Alice', 'Claire', 'Helen', 'Margaret', 'Ruth', 'Sarah'],
        ['David', 'James', 'Michael', 'Robert', 'Thomas', 'William'],
        ['Bennett', 'Clarke', 'Harris', 'Miller', 'Turner', 'Walker']
      ),
      tradition(
        'french',
        'French',
        ['Camille', 'Claire', 'Elise', 'Juliette', 'Marie', 'Sophie'],
        ['Antoine', 'Etienne', 'Henri', 'Louis', 'Pierre', 'Theo'],
        ['Bernard', 'Dupont', 'Fournier', 'Laurent', 'Moreau', 'Rousseau']
      ),
      tradition(
        'spanish',
        'Spanish',
        ['Ana', 'Carmen', 'Elena', 'Isabel', 'Lucia', 'Sofia'],
        ['Carlos', 'Diego', 'Javier', 'Luis', 'Miguel', 'Pablo'],
        ['Garcia', 'Lopez', 'Martinez', 'Perez', 'Ruiz', 'Santos']
      ),
      tradition(
        'italian',
        'Italian',
        ['Chiara', 'Giulia', 'Lucia', 'Marta', 'Paola', 'Sofia'],
        ['Andrea', 'Francesco', 'Luca', 'Marco', 'Matteo', 'Paolo'],
        ['Bianchi', 'Conti', 'Esposito', 'Ferrari', 'Ricci', 'Romano']
      ),
      tradition(
        'german',
        'German',
        ['Anna', 'Clara', 'Greta', 'Lena', 'Maria', 'Sophie'],
        ['Felix', 'Jonas', 'Karl', 'Lukas', 'Max', 'Otto'],
        ['Becker', 'Hoffmann', 'Keller', 'Richter', 'Schultz', 'Weber']
      ),
      tradition(
        'slavic',
        'Slavic',
        ['Anya', 'Irena', 'Katya', 'Mila', 'Nadia', 'Zora'],
        ['Dmitri', 'Ivan', 'Marek', 'Pavel', 'Viktor', 'Yuri'],
        ['Horvat', 'Kovac', 'Novak', 'Petrov', 'Sokolov', 'Volkov']
      ),
      tradition(
        'arabic',
        'Arabic',
        ['Amina', 'Fatima', 'Layla', 'Noor', 'Sara', 'Yasmin'],
        ['Amir', 'Hassan', 'Karim', 'Omar', 'Samir', 'Yusuf'],
        ['Haddad', 'Hassan', 'Karim', 'Nasser', 'Rahim', 'Saleh']
      ),
      tradition(
        'japanese',
        'Japanese',
        ['Aiko', 'Hana', 'Mei', 'Sakura', 'Yuki', 'Yumi'],
        ['Daichi', 'Haruki', 'Kenji', 'Ren', 'Sora', 'Takeshi'],
        ['Ito', 'Nakamura', 'Sato', 'Suzuki', 'Takahashi', 'Yamamoto']
      ),
      tradition(
        'korean',
        'Korean',
        ['Hana', 'Jiyoon', 'Minseo', 'Sora', 'Yuna', 'Yuri'],
        ['Hyun', 'Joon', 'Minho', 'Seojun', 'Sung', 'Taeyang'],
        ['Choi', 'Jung', 'Kim', 'Lee', 'Park', 'Song']
      ),
      tradition(
        'west-african',
        'West African',
        ['Ama', 'Efua', 'Fatou', 'Kemi', 'Nia', 'Zola'],
        ['Kwame', 'Malik', 'Omar', 'Sekou', 'Tunde', 'Yaw'],
        ['Asante', 'Diallo', 'Mensah', 'Okoye', 'Touré', 'Traore']
      ),
      names('other', 'Other', ['Ash', 'Grey', 'Noel', 'Quinn', 'Robin', 'Sky'], {
        givenFeminine: ['Eden', 'Iris', 'June', 'Pearl', 'Wren'],
        givenMasculine: ['Cole', 'Fox', 'Jude', 'Nash', 'Reed'],
        family: ['Cross', 'Hart', 'Lane', 'Vale', 'West']
      })
    ]
  }
}
