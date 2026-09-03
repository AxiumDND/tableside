/**
 * Bundled NPC portrait placeholders for Tools → NPC.
 * All portraits share the same plain studio backdrop for a consistent table look.
 * Replace with WebP/PNG AI art using the same paths (see resources/npc-portraits/README.md).
 */
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(process.cwd(), 'resources', 'npc-portraits')

/** One plain backdrop for every portrait so picks feel like the same set. */
const STUDIO_BG = '#d8d0c4'
const STUDIO_BG_DARK = '#c8c0b4'

const RACES = [
  { id: 'human', skin: ['#e0b899', '#c68642'], hair: ['#3b2f23', '#6b4c2a', '#1f1a17', '#8b5a2b'] },
  { id: 'elf', skin: ['#e8cdb2', '#d4a574'], hair: ['#faf0d7', '#c9a959', '#2f2518', '#8fbd8f'] },
  { id: 'dwarf', skin: ['#d4a574', '#b87a45'], hair: ['#7a4a1a', '#d4a017', '#3d2817', '#9a6b3f'] },
  { id: 'halfling', skin: ['#e8be8a', '#cc9250'], hair: ['#5c3a1e', '#c49a6c', '#2a2018', '#8b6914'] },
  { id: 'gnome', skin: ['#e8c4a8', '#d89a72'], hair: ['#8b4513', '#dda0dd', '#4a3728', '#c71585'] },
  { id: 'goblin', skin: ['#8fbc8f', '#6b8e23'], hair: ['#2f4f2f', '#1a1a1a', '#556b2f', '#000000'] },
  { id: 'orc', skin: ['#6b8e23', '#556b2f'], hair: ['#1a1a1a', '#2f4f2f', '#000000', '#3d2817'] },
  { id: 'tiefling', skin: ['#c97a7a', '#8b4040'], hair: ['#1a1020', '#4a0e0e', '#2b0505', '#800020'] },
  { id: 'dragonborn', skin: ['#5f9ea0', '#4682b4'], hair: ['#2f4f4f', '#1e3a5f', '#708090', '#2e8b57'] },
  { id: 'leshy', skin: ['#90c690', '#6b9b6b'], hair: ['#228b22', '#2e8b57', '#556b2f', '#8fbc8f'] },
  { id: 'other', skin: ['#d2b48c', '#bc8f8f'], hair: ['#4a4035', '#6b5b4a', '#2f2a25', '#8b7355'] }
]

function pick(list, index) {
  return list[index % list.length]
}

function hairPath(index, gender) {
  const styles = gender === 'feminine'
    ? [
        `M48 58 Q100 18 152 58 L148 92 Q100 68 52 92 Z`,
        `M44 62 Q100 12 156 62 L150 108 Q100 78 50 108 Z`,
        `M52 64 Q100 24 148 64 L145 98 Q100 74 55 98 Z`,
        `M46 60 Q100 8 154 60 L152 102 Q100 70 48 102 Z`,
        `M50 58 Q78 20 100 28 Q122 20 150 58 L146 94 Q100 72 54 94 Z`,
        `M48 62 Q100 16 152 62 L148 112 Q100 82 52 112 Z`,
        `M54 64 Q100 26 146 64 L142 96 Q100 76 58 96 Z`,
        `M42 58 Q100 10 158 58 L154 106 Q100 74 46 106 Z`
      ]
    : [
        `M48 58 Q100 18 152 58 L148 88 Q100 68 52 88 Z`,
        `M44 62 Q100 12 156 62 L150 78 Q100 58 50 78 Z`,
        `M52 64 Q100 24 148 64 L145 86 Q100 66 55 86 Z`,
        `M46 60 Q100 8 154 60 L152 74 Q100 56 48 74 Z`,
        `M50 58 Q78 20 100 28 Q122 20 150 58 L146 82 Q100 62 54 82 Z`,
        `M48 62 Q100 16 152 62 L148 76 Q100 58 52 76 Z`,
        `M54 64 Q100 26 146 64 L142 84 Q100 64 58 84 Z`,
        `M42 58 Q100 10 158 58 L154 72 Q100 54 46 72 Z`
      ]
  return styles[index % styles.length]
}

function beard(index) {
  if (index % 3 !== 0) return ''
  return `<path d="M72 118 Q100 148 128 118 L122 132 Q100 156 78 132 Z" fill="#3b2f23" opacity="0.85"/>`
}

function elfEars() {
  return `<path d="M48 78 L34 68 L46 92 Z" fill="current"/><path d="M152 78 L166 68 L154 92 Z" fill="current"/>`
}

function goblinEars() {
  return `<path d="M44 72 L24 48 L48 98 Z" fill="current"/><path d="M156 72 L176 48 L152 98 Z" fill="current"/>`
}

function tieflingHorns() {
  return `<path d="M72 42 L62 18 L82 48 Z" fill="#2b0505"/><path d="M128 42 L138 18 L118 48 Z" fill="#2b0505"/>`
}

function dragonbornSnout(index) {
  const wide = index % 2 === 0
  return `<ellipse cx="100" cy="108" rx="${wide ? 18 : 14}" ry="10" fill="current" opacity="0.35"/>`
}

function leshyLeaves() {
  return `<circle cx="72" cy="52" r="8" fill="#228b22" opacity="0.55"/><circle cx="128" cy="48" r="7" fill="#2e8b57" opacity="0.5"/>`
}

function raceExtras(raceId, index, gender) {
  const bits = []
  if (raceId === 'elf') bits.push(elfEars())
  if (raceId === 'goblin') bits.push(goblinEars())
  if (raceId === 'tiefling') bits.push(tieflingHorns())
  if (raceId === 'dragonborn') bits.push(dragonbornSnout(index))
  if (raceId === 'leshy') bits.push(leshyLeaves())
  if ((raceId === 'dwarf' || raceId === 'human') && gender === 'masculine') bits.push(beard(index))
  return bits.join('\n  ')
}

function svg(race, gender, index) {
  const face = pick(race.skin, index)
  const hair = pick(race.hair, index + (gender === 'masculine' ? 1 : 0))
  const shift = (index % 3) * 3
  const extras = raceExtras(race.id, index, gender)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" role="img" aria-label="${race.id} ${gender} portrait">
  <rect width="200" height="280" fill="${STUDIO_BG}"/>
  <rect x="0" y="210" width="200" height="70" fill="${STUDIO_BG_DARK}" opacity="0.35"/>
  <ellipse cx="100" cy="200" rx="72" ry="18" fill="#000" opacity="0.06"/>
  <g color="${face}">
    <ellipse cx="100" cy="${118 + shift}" rx="54" ry="64" fill="${face}"/>
    <ellipse cx="100" cy="${62 + shift}" rx="48" ry="52" fill="${face}"/>
    ${extras}
  </g>
  <path d="${hairPath(index, gender)}" fill="${hair}"/>
  <ellipse cx="82" cy="${68 + shift}" rx="5" ry="6" fill="#2a2218"/>
  <ellipse cx="118" cy="${68 + shift}" rx="5" ry="6" fill="#2a2218"/>
  <path d="M88 ${74 + shift} Q100 ${82 + shift} 112 ${74 + shift}" stroke="#2a2218" stroke-width="2" fill="none" opacity="0.7"/>
  <path d="M58 ${132 + shift} Q100 ${168 + shift} 142 ${132 + shift} L136 ${200 + shift} Q100 ${220 + shift} 64 ${200 + shift} Z" fill="#4a4038" opacity="0.92"/>
  <path d="M68 ${132 + shift} Q100 ${152 + shift} 132 ${132 + shift} L128 ${188 + shift} Q100 ${204 + shift} 72 ${188 + shift} Z" fill="#5c5048" opacity="0.55"/>
</svg>`
}

function cleanDir(dir) {
  try {
    for (const name of readdirSync(dir)) {
      if (/\.(svg|webp|png|jpg)$/i.test(name)) unlinkSync(join(dir, name))
    }
  } catch {
    /* new dir */
  }
}

let count = 0
for (const race of RACES) {
  for (const gender of ['feminine', 'masculine']) {
    const dir = join(root, race.id, gender)
    mkdirSync(dir, { recursive: true })
    cleanDir(dir)
    for (let i = 1; i <= 8; i += 1) {
      const id = String(i).padStart(2, '0')
      writeFileSync(join(dir, `${id}.svg`), svg(race, gender, i - 1), 'utf8')
      count += 1
    }
  }
}

console.log(`Wrote ${count} studio-backdrop portraits to ${root}`)
