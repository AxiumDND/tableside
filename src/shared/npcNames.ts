import { parseSystemId } from './systemPack'
import { NPC_NAME_CATALOGS, type NameCatalog, type NameList } from './npcNameLists'

export type { NameCatalog, NameList }
export type NameStyle = 'any' | 'feminine' | 'masculine'

export function npcNameCatalog(system?: string | null): NameCatalog {
  return NPC_NAME_CATALOGS[parseSystemId(system)]
}

export function nameListById(catalog: NameCatalog, id: string): NameList {
  return catalog.lists.find((list) => list.id === id) ?? catalog.lists[0]
}

export function listHasStyleSplits(list: NameList): boolean {
  return Boolean(list.givenFeminine?.length || list.givenMasculine?.length)
}

export function givenNamesFor(list: NameList, style: NameStyle): string[] {
  if (style === 'feminine' && list.givenFeminine?.length) return list.givenFeminine
  if (style === 'masculine' && list.givenMasculine?.length) return list.givenMasculine
  const pooled = [
    ...list.givenAny,
    ...(list.givenFeminine ?? []),
    ...(list.givenMasculine ?? [])
  ]
  return unique(pooled)
}

export function nameCombinations(list: NameList, style: NameStyle): string[] {
  const givens = givenNamesFor(list, style)
  const families = list.family?.length ? list.family : ['']
  const out: string[] = []
  for (const given of givens) {
    for (const family of families) {
      out.push(family ? `${given} ${family}` : given)
    }
  }
  return unique(out)
}

export function pickNpcNames(
  list: NameList,
  count: number,
  style: NameStyle,
  rng: () => number = Math.random
): string[] {
  const pool = nameCombinations(list, style)
  if (pool.length === 0 || count <= 0) return []
  const out: string[] = []
  let remaining = [...pool]
  while (out.length < count) {
    if (remaining.length === 0) remaining = [...pool]
    const index = Math.floor(rng() * remaining.length)
    const [picked] = remaining.splice(index, 1)
    out.push(picked)
  }
  return out
}

/** Fill or insert a Species row on an NPC sheet. */
export function applyNpcSpecies(markdown: string, species: string): string {
  const value = species.trim()
  if (!value) return markdown
  const row = `| **Species** | ${value} |`
  if (/^\|\s*\*\*Species\*\*\s*\|/m.test(markdown)) {
    return markdown.replace(/^\|\s*\*\*Species\*\*\s*\|.*\|$/m, row)
  }
  if (/^\|\s*\*\*Role\*\*\s*\|/m.test(markdown)) {
    return markdown.replace(/^(\|\s*\*\*Role\*\*\s*\|.*\|)$/m, `$1\n${row}`)
  }
  return markdown
}

function unique(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
  }
  return out
}
