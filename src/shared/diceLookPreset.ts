/**
 * Named 3D dice bag looks for the player TV throw.
 * Material knobs feed MeshPhysicalMaterial in the renderer; ids persist on AppSettings.
 */

export const DICE_LOOK_PRESET_IDS = [
  'ivory',
  'obsidian',
  'ruby',
  'frost',
  'steel',
  'jade',
  'bone',
  'amber',
  'emerald',
  'bronze',
  'sapphire',
  'arcane'
] as const

export type DiceLookPresetId = (typeof DICE_LOOK_PRESET_IDS)[number]

export const DEFAULT_DICE_LOOK_PRESET: DiceLookPresetId = 'ivory'

/** Body / ink / grain inputs for one bag. Numbers match Three.js MeshPhysicalMaterial. */
export type DiceLookPreset = {
  id: DiceLookPresetId
  label: string
  blurb: string
  /** Body hex color (0xrrggbb). */
  body: number
  droppedBody: number
  roughness: number
  metalness: number
  clearcoat: number
  clearcoatRoughness: number
  sheen: number
  sheenColor: number
  sheenRoughness: number
  ior: number
  transmission: number
  thickness: number
  envMapIntensity: number
  specularIntensity: number
  /** CSS rgb base for the procedural roughness grain canvas. */
  grainTint: string
  grainDots: number
  /** Skip roughnessMap for polished metal / gem looks. */
  useGrain: boolean
  ink: string
  gold: string
  blood: string
  faded: string
  /** Light rim stroke behind the glyph (paintDieGlyph). */
  glyphHighlight: string
  /** CSS fallback die body color. */
  cssBody: string
  cssInk: string
}

export const DICE_LOOK_PRESETS: Record<DiceLookPresetId, DiceLookPreset> = {
  ivory: {
    id: 'ivory',
    label: 'Ivory resin',
    blurb: 'Warm table dice — the classic bag.',
    body: 0xe6d2b0,
    droppedBody: 0x8a8074,
    roughness: 0.32,
    metalness: 0,
    clearcoat: 0.78,
    clearcoatRoughness: 0.22,
    sheen: 0.2,
    sheenColor: 0xf6ead4,
    sheenRoughness: 0.48,
    ior: 1.5,
    transmission: 0,
    thickness: 0,
    envMapIntensity: 0.85,
    specularIntensity: 0.5,
    grainTint: '#b8b0a4',
    grainDots: 70,
    useGrain: true,
    ink: '#1c140e',
    gold: '#c9a227',
    blood: '#7a1f1f',
    faded: 'rgba(70, 58, 42, 0.45)',
    glyphHighlight: 'rgba(255, 248, 230, 0.55)',
    cssBody: '#e6d2b0',
    cssInk: '#1c140e'
  },
  obsidian: {
    id: 'obsidian',
    label: 'Obsidian',
    blurb: 'Glossy black stone with pale gold ink.',
    body: 0x1a1a1e,
    droppedBody: 0x3a3a40,
    roughness: 0.22,
    metalness: 0.08,
    clearcoat: 0.92,
    clearcoatRoughness: 0.12,
    sheen: 0.08,
    sheenColor: 0x6a6a78,
    sheenRoughness: 0.55,
    ior: 1.55,
    transmission: 0,
    thickness: 0,
    envMapIntensity: 1.05,
    specularIntensity: 0.7,
    grainTint: '#2a2a30',
    grainDots: 40,
    useGrain: true,
    ink: '#e8d5a3',
    gold: '#f0c94a',
    blood: '#c44a4a',
    faded: 'rgba(200, 190, 160, 0.4)',
    glyphHighlight: 'rgba(40, 40, 48, 0.6)',
    cssBody: '#1a1a1e',
    cssInk: '#e8d5a3'
  },
  ruby: {
    id: 'ruby',
    label: 'Ruby translucent',
    blurb: 'Deep red resin that catches the light.',
    body: 0x8b1a2b,
    droppedBody: 0x5a1820,
    roughness: 0.18,
    metalness: 0,
    clearcoat: 0.95,
    clearcoatRoughness: 0.1,
    sheen: 0.15,
    sheenColor: 0xff8899,
    sheenRoughness: 0.4,
    ior: 1.55,
    transmission: 0.55,
    thickness: 1.4,
    envMapIntensity: 1.15,
    specularIntensity: 0.65,
    grainTint: '#6a2030',
    grainDots: 35,
    useGrain: true,
    ink: '#2a080c',
    gold: '#e8c040',
    blood: '#4a1018',
    faded: 'rgba(40, 10, 14, 0.4)',
    glyphHighlight: 'rgba(255, 200, 210, 0.35)',
    cssBody: '#8b1a2b',
    cssInk: '#2a080c'
  },
  frost: {
    id: 'frost',
    label: 'Frosted',
    blurb: 'Cloudy mint ice — soft and cold.',
    body: 0xc8e4e0,
    droppedBody: 0x8a9a98,
    roughness: 0.55,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.55,
    sheen: 0.35,
    sheenColor: 0xe8f8f6,
    sheenRoughness: 0.65,
    ior: 1.4,
    transmission: 0.35,
    thickness: 0.9,
    envMapIntensity: 0.7,
    specularIntensity: 0.35,
    grainTint: '#a8c4c0',
    grainDots: 90,
    useGrain: true,
    ink: '#1a3a38',
    gold: '#b8a040',
    blood: '#6a2830',
    faded: 'rgba(40, 70, 68, 0.4)',
    glyphHighlight: 'rgba(255, 255, 255, 0.45)',
    cssBody: '#c8e4e0',
    cssInk: '#1a3a38'
  },
  steel: {
    id: 'steel',
    label: 'Steel',
    blurb: 'Brushed metal with dark numerals.',
    body: 0x8a929a,
    droppedBody: 0x5a6068,
    roughness: 0.28,
    metalness: 0.85,
    clearcoat: 0.25,
    clearcoatRoughness: 0.4,
    sheen: 0,
    sheenColor: 0xffffff,
    sheenRoughness: 1,
    ior: 1.5,
    transmission: 0,
    thickness: 0,
    envMapIntensity: 1.25,
    specularIntensity: 1,
    grainTint: '#707880',
    grainDots: 50,
    useGrain: true,
    ink: '#121418',
    gold: '#d4b060',
    blood: '#6a2020',
    faded: 'rgba(20, 22, 26, 0.45)',
    glyphHighlight: 'rgba(220, 230, 240, 0.4)',
    cssBody: '#8a929a',
    cssInk: '#121418'
  },
  jade: {
    id: 'jade',
    label: 'Jade',
    blurb: 'Carved green stone with cream ink.',
    body: 0x3d7a5c,
    droppedBody: 0x2a5040,
    roughness: 0.4,
    metalness: 0.05,
    clearcoat: 0.55,
    clearcoatRoughness: 0.3,
    sheen: 0.25,
    sheenColor: 0xa8d4b8,
    sheenRoughness: 0.5,
    ior: 1.6,
    transmission: 0.12,
    thickness: 0.6,
    envMapIntensity: 0.9,
    specularIntensity: 0.55,
    grainTint: '#4a8a6a',
    grainDots: 55,
    useGrain: true,
    ink: '#f0ebe0',
    gold: '#e0c050',
    blood: '#8a3030',
    faded: 'rgba(240, 235, 224, 0.4)',
    glyphHighlight: 'rgba(20, 50, 35, 0.45)',
    cssBody: '#3d7a5c',
    cssInk: '#f0ebe0'
  },
  bone: {
    id: 'bone',
    label: 'Aged bone',
    blurb: 'Yellowed ivory with brown ink.',
    body: 0xd4c09a,
    droppedBody: 0x9a8a6e,
    roughness: 0.48,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.45,
    sheen: 0.12,
    sheenColor: 0xe8d8b8,
    sheenRoughness: 0.7,
    ior: 1.45,
    transmission: 0,
    thickness: 0,
    envMapIntensity: 0.65,
    specularIntensity: 0.35,
    grainTint: '#c0b090',
    grainDots: 100,
    useGrain: true,
    ink: '#4a3520',
    gold: '#b89030',
    blood: '#6a2820',
    faded: 'rgba(74, 53, 32, 0.4)',
    glyphHighlight: 'rgba(255, 245, 220, 0.4)',
    cssBody: '#d4c09a',
    cssInk: '#4a3520'
  },
  amber: {
    id: 'amber',
    label: 'Honey amber',
    blurb: 'Warm translucent honey resin.',
    body: 0xc47a28,
    droppedBody: 0x8a5820,
    roughness: 0.2,
    metalness: 0,
    clearcoat: 0.88,
    clearcoatRoughness: 0.15,
    sheen: 0.2,
    sheenColor: 0xffc870,
    sheenRoughness: 0.4,
    ior: 1.55,
    transmission: 0.48,
    thickness: 1.2,
    envMapIntensity: 1.05,
    specularIntensity: 0.6,
    grainTint: '#a86820',
    grainDots: 40,
    useGrain: true,
    ink: '#2a1808',
    gold: '#e8c040',
    blood: '#6a2018',
    faded: 'rgba(42, 24, 8, 0.4)',
    glyphHighlight: 'rgba(255, 230, 180, 0.4)',
    cssBody: '#c47a28',
    cssInk: '#2a1808'
  },
  emerald: {
    id: 'emerald',
    label: 'Emerald',
    blurb: 'Faceted green gem translucent.',
    body: 0x1a6b45,
    droppedBody: 0x144830,
    roughness: 0.14,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    sheen: 0.1,
    sheenColor: 0x60d090,
    sheenRoughness: 0.35,
    ior: 1.58,
    transmission: 0.5,
    thickness: 1.5,
    envMapIntensity: 1.2,
    specularIntensity: 0.75,
    grainTint: '#185838',
    grainDots: 25,
    useGrain: false,
    ink: '#0a1810',
    gold: '#e0c050',
    blood: '#6a2020',
    faded: 'rgba(10, 24, 16, 0.4)',
    glyphHighlight: 'rgba(180, 255, 210, 0.3)',
    cssBody: '#1a6b45',
    cssInk: '#0a1810'
  },
  bronze: {
    id: 'bronze',
    label: 'Bronze',
    blurb: 'Aged copper metal with dark ink.',
    body: 0x8a5a28,
    droppedBody: 0x5a3a1c,
    roughness: 0.35,
    metalness: 0.78,
    clearcoat: 0.3,
    clearcoatRoughness: 0.45,
    sheen: 0.05,
    sheenColor: 0xd4a060,
    sheenRoughness: 0.6,
    ior: 1.5,
    transmission: 0,
    thickness: 0,
    envMapIntensity: 1.15,
    specularIntensity: 0.9,
    grainTint: '#704820',
    grainDots: 60,
    useGrain: true,
    ink: '#1a1008',
    gold: '#e8c870',
    blood: '#6a2820',
    faded: 'rgba(26, 16, 8, 0.45)',
    glyphHighlight: 'rgba(255, 210, 150, 0.35)',
    cssBody: '#8a5a28',
    cssInk: '#1a1008'
  },
  sapphire: {
    id: 'sapphire',
    label: 'Sapphire',
    blurb: 'Deep blue gem with white ink.',
    body: 0x1a3a7a,
    droppedBody: 0x142850,
    roughness: 0.16,
    metalness: 0.04,
    clearcoat: 0.98,
    clearcoatRoughness: 0.1,
    sheen: 0.12,
    sheenColor: 0x6080d0,
    sheenRoughness: 0.35,
    ior: 1.57,
    transmission: 0.42,
    thickness: 1.3,
    envMapIntensity: 1.15,
    specularIntensity: 0.7,
    grainTint: '#183060',
    grainDots: 30,
    useGrain: false,
    ink: '#e8eef8',
    gold: '#e0c050',
    blood: '#c05050',
    faded: 'rgba(232, 238, 248, 0.4)',
    glyphHighlight: 'rgba(20, 40, 90, 0.5)',
    cssBody: '#1a3a7a',
    cssInk: '#e8eef8'
  },
  arcane: {
    id: 'arcane',
    label: 'Arcane void',
    blurb: 'Dark violet with luminous violet ink — one flashy bag.',
    body: 0x2a1848,
    droppedBody: 0x1a1030,
    roughness: 0.25,
    metalness: 0.15,
    clearcoat: 0.85,
    clearcoatRoughness: 0.18,
    sheen: 0.4,
    sheenColor: 0xa070e0,
    sheenRoughness: 0.35,
    ior: 1.52,
    transmission: 0.18,
    thickness: 0.8,
    envMapIntensity: 1.1,
    specularIntensity: 0.7,
    grainTint: '#3a2060',
    grainDots: 45,
    useGrain: true,
    ink: '#d8b8ff',
    gold: '#f0d060',
    blood: '#e06080',
    faded: 'rgba(216, 184, 255, 0.4)',
    glyphHighlight: 'rgba(60, 30, 100, 0.55)',
    cssBody: '#2a1848',
    cssInk: '#d8b8ff'
  }
}

export function isDiceLookPresetId(value?: string | null): value is DiceLookPresetId {
  return Boolean(value && (DICE_LOOK_PRESET_IDS as readonly string[]).includes(value))
}

export function parseDiceLookPresetId(value?: string | null): DiceLookPresetId {
  return isDiceLookPresetId(value) ? value : DEFAULT_DICE_LOOK_PRESET
}

export function diceLookPreset(id?: string | null): DiceLookPreset {
  return DICE_LOOK_PRESETS[parseDiceLookPresetId(id)]
}

export function diceLookPresetFromSettings(
  settings: { diceLookPreset?: string } | null | undefined
): DiceLookPresetId {
  return parseDiceLookPresetId(settings?.diceLookPreset)
}
