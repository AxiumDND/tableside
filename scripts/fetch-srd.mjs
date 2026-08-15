/**
 * Download a slim SRD 5.2.1 snapshot from the Open5e API (CC-BY-4.0).
 * Re-run: npm run fetch-srd
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src', 'renderer', 'src', 'data', 'srd')
const BASE = 'https://api.open5e.com/v2'
const DOC = 'srd-2024'

async function fetchAll(path, extra = '') {
  const items = []
  let url = `${BASE}${path}?document__key=${DOC}&limit=50${extra}`
  while (url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) {
      throw new Error(`${url} -> ${res.status} ${res.statusText}`)
    }
    const body = await res.json()
    items.push(...(body.results ?? []))
    url = body.next
    process.stdout.write(`  ${path}: ${items.length}/${body.count ?? '?'}\r`)
  }
  process.stdout.write('\n')
  return items
}

async function fetchMaybe(path) {
  try {
    return await fetchAll(path)
  } catch (err) {
    console.warn(`Skipping ${path}:`, err.message)
    return []
  }
}

async function fetchConditions() {
  const items = []
  let url = `${BASE}/conditions/?limit=50`
  while (url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`${url} -> ${res.status}`)
    const body = await res.json()
    items.push(...(body.results ?? []))
    url = body.next
  }
  return items
    .map((c) => {
      const descriptions = c.descriptions ?? []
      const srd = descriptions.find((d) => d.document === DOC || d.gamesystem === '5e-2024')
      if (!srd) return null
      return {
        id: c.key ?? c.name,
        name: c.name,
        kind: 'condition',
        desc: String(srd.desc ?? '').replace(/^\*\s*/gm, '').trim()
      }
    })
    .filter(Boolean)
}

function components(spell) {
  const parts = []
  if (spell.verbal) parts.push('V')
  if (spell.somatic) parts.push('S')
  if (spell.material) {
    parts.push(spell.material_specified ? `M (${spell.material_specified})` : 'M')
  }
  return parts.join(', ')
}

function speedText(speed) {
  if (!speed) return ''
  const bits = []
  for (const [key, value] of Object.entries(speed)) {
    if (key === 'unit' || key === 'hover' || !value) continue
    bits.push(`${key} ${value} ${speed.unit ?? 'ft.'}`)
  }
  if (speed.hover) bits.push('hover')
  return bits.join(', ')
}

function formatSaves(saves) {
  if (!saves) return ''
  return Object.entries(saves)
    .filter(([, v]) => typeof v === 'number')
    .map(([k, v]) => `${k.slice(0, 3)} ${v >= 0 ? '+' : ''}${v}`)
    .join(', ')
}

function formatSkills(skills) {
  if (!skills) return ''
  return Object.entries(skills)
    .filter(([, v]) => typeof v === 'number' && v !== 0)
    .map(([k, v]) => `${k.replaceAll('_', ' ')} ${v >= 0 ? '+' : ''}${v}`)
    .join(', ')
}

function splitActions(actions = []) {
  const groups = { action: [], bonus: [], reaction: [], legendary: [], lair: [] }
  for (const a of actions) {
    const item = {
      name: a.name,
      desc: a.desc ?? '',
      limit: a.usage_limits
        ? `${a.usage_limits.type}${a.usage_limits.param != null ? ` ${a.usage_limits.param}` : ''}`
        : null
    }
    switch (a.action_type) {
      case 'BONUS_ACTION':
        groups.bonus.push(item)
        break
      case 'REACTION':
        groups.reaction.push(item)
        break
      case 'LEGENDARY_ACTION':
        groups.legendary.push(item)
        break
      case 'LAIR_ACTION':
        groups.lair.push(item)
        break
      default:
        groups.action.push(item)
    }
  }
  return groups
}

async function main() {
  await mkdir(OUT, { recursive: true })
  console.log('Fetching Open5e SRD 5.2 (srd-2024)…')

  const [spellsRaw, creaturesRaw, conditionsRaw, weaponsRaw] = await Promise.all([
    fetchAll('/spells'),
    fetchAll('/creatures'),
    fetchConditions(),
    fetchMaybe('/weapons')
  ])

  const spells = spellsRaw.map((s) => ({
    id: s.key,
    name: s.name,
    kind: 'spell',
    level: s.level,
    school: s.school?.name ?? '',
    castingTime: s.casting_time,
    range: s.range_text || (s.range != null ? `${s.range} ${s.range_unit ?? 'feet'}` : ''),
    components: components(s),
    duration: s.duration,
    concentration: Boolean(s.concentration),
    ritual: Boolean(s.ritual),
    desc: s.desc ?? '',
    higherLevel: s.higher_level ?? '',
    classes: (s.classes ?? []).map((c) => c.name)
  }))

  const monsters = creaturesRaw.map((c) => {
    const groups = splitActions(c.actions ?? [])
    return {
      id: c.key,
      name: c.name,
      kind: 'monster',
      size: c.size?.name ?? '',
      type: c.type?.name ?? '',
      alignment: c.alignment ?? '',
      cr: c.challenge_rating,
      ac: c.armor_class,
      armorDetail: c.armor_detail ?? '',
      hp: c.hit_points,
      hitDice: c.hit_dice ?? '',
      speed: speedText(c.speed),
      scores: c.ability_scores ?? {},
      modifiers: c.modifiers ?? {},
      initiativeBonus: c.initiative_bonus ?? 0,
      saves: formatSaves(c.saving_throws),
      skills: formatSkills(c.skill_bonuses),
      senses: [
        c.darkvision_range ? `darkvision ${c.darkvision_range} ft.` : null,
        c.blindsight_range ? `blindsight ${c.blindsight_range} ft.` : null,
        c.tremorsense_range ? `tremorsense ${c.tremorsense_range} ft.` : null,
        c.truesight_range ? `truesight ${c.truesight_range} ft.` : null,
        c.passive_perception != null ? `passive Perception ${c.passive_perception}` : null
      ]
        .filter(Boolean)
        .join(', '),
      languages: c.languages?.as_string ?? '',
      immunities: [
        c.resistances_and_immunities?.damage_immunities_display,
        c.resistances_and_immunities?.condition_immunities_display
          ? `conditions ${c.resistances_and_immunities.condition_immunities_display}`
          : null
      ]
        .filter(Boolean)
        .join('; '),
      resistances: c.resistances_and_immunities?.damage_resistances_display ?? '',
      traits: (c.traits ?? []).map((t) => ({ name: t.name, desc: t.desc ?? '' })),
      actions: groups.action,
      bonusActions: groups.bonus,
      reactions: groups.reaction,
      legendary: groups.legendary,
      lair: groups.lair
    }
  })

  const conditions = conditionsRaw

  const weapons = weaponsRaw.map((w) => ({
    id: w.key ?? w.slug ?? w.name,
    name: w.name,
    kind: 'weapon',
    category: w.category ?? w.weapon_category ?? '',
    damage: w.damage_dice
      ? `${w.damage_dice} ${w.damage_type?.name ?? w.damage_type ?? ''}`.trim()
      : (w.damage ?? ''),
    properties: Array.isArray(w.properties)
      ? w.properties.map((p) => p.name ?? p).join(', ')
      : (w.properties ?? ''),
    desc: w.desc ?? w.description ?? ''
  }))

  const index = {
    generatedAt: new Date().toISOString(),
    source: 'Open5e API v2, document key srd-2024 (SRD 5.2.1)',
    counts: {
      spells: spells.length,
      monsters: monsters.length,
      conditions: conditions.length,
      weapons: weapons.length
    }
  }

  await Promise.all([
    writeFile(join(OUT, 'spells.json'), JSON.stringify(spells)),
    writeFile(join(OUT, 'monsters.json'), JSON.stringify(monsters)),
    writeFile(join(OUT, 'conditions.json'), JSON.stringify(conditions)),
    writeFile(join(OUT, 'weapons.json'), JSON.stringify(weapons)),
    writeFile(join(OUT, 'index.json'), JSON.stringify(index, null, 2))
  ])

  console.log('Wrote', index.counts)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
