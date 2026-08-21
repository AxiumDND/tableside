import MiniSearch from 'minisearch';
import spells from '../data/srd/spells.json';
import monsters from '../data/srd/monsters.json';
import conditions from '../data/srd/conditions.json';
import conditionsFallback from '../data/srd/conditions-fallback.json';
import weapons from '../data/srd/weapons.json';
import rules from '../data/srd/rules.json';
import type { StatBlock } from '../../../shared/types';
import { parsedToBestiaryMarkdown, statBlockToParsed } from './statblock';

export type SrdKind = 'spell' | 'monster' | 'condition' | 'weapon' | 'rule' | 'book' | 'gear';

export interface SrdRecord {
  id: string;
  name: string;
  kind: SrdKind;
  searchText: string;
  summary: string;
  data: Record<string, unknown>;
  source?: string;
  sourceLabel?: string;
}

function asList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

const conditionList = asList<Record<string, unknown>>(conditions);
const resolvedConditions =
  conditionList.length > 0 ? conditionList : asList<Record<string, unknown>>(conditionsFallback);

function spellSummary(s: Record<string, unknown>): string {
  const level = s.level === 0 ? 'Cantrip' : `Level ${s.level}`;
  return [level, s.school, s.castingTime, s.range].filter(Boolean).join(' · ');
}

function monsterSummary(m: Record<string, unknown>): string {
  return [
    m.size,
    m.type,
    m.cr != null ? `CR ${m.cr}` : null,
    m.ac != null ? `AC ${m.ac}` : null,
    m.hp != null ? `HP ${m.hp}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

export const SRD_SOURCE = 'srd';
export const SRD_SOURCE_LABEL = 'SRD 5.2.1';

function withSrdSource<T extends SrdRecord>(record: Omit<T, 'source' | 'sourceLabel'>): T {
  return { ...record, source: SRD_SOURCE, sourceLabel: SRD_SOURCE_LABEL } as T;
}

export const srdRecords: SrdRecord[] = [
  ...asList<Record<string, unknown>>(spells).map((s) =>
    withSrdSource({
      id: String(s.id),
      name: String(s.name),
      kind: 'spell' as const,
      searchText: [s.name, s.school, s.desc, (s.classes as string[] | undefined)?.join(' ')]
        .filter(Boolean)
        .join(' '),
      summary: spellSummary(s),
      data: s,
    })
  ),
  ...asList<Record<string, unknown>>(monsters).map((m) =>
    withSrdSource({
      id: String(m.id),
      name: String(m.name),
      kind: 'monster' as const,
      searchText: [m.name, m.type, m.size, m.alignment].filter(Boolean).join(' '),
      summary: monsterSummary(m),
      data: m,
    })
  ),
  ...resolvedConditions.map((c) =>
    withSrdSource({
      id: String(c.id),
      name: String(c.name),
      kind: 'condition' as const,
      searchText: `${c.name} ${c.desc}`,
      summary: 'Condition',
      data: c,
    })
  ),
  ...asList<Record<string, unknown>>(weapons).map((w) =>
    withSrdSource({
      id: String(w.id),
      name: String(w.name),
      kind: 'weapon' as const,
      searchText: [w.name, w.category, w.properties, w.desc].filter(Boolean).join(' '),
      summary: [w.damage, w.properties].filter(Boolean).join(' · '),
      data: w,
    })
  ),
  ...asList<Record<string, unknown>>(rules).map((r) =>
    withSrdSource({
      id: String(r.id),
      name: String(r.name),
      kind: 'rule' as const,
      searchText: [r.name, r.desc, (r.tags as string[] | undefined)?.join(' ')]
        .filter(Boolean)
        .join(' '),
      summary: ((r.tags as string[] | undefined) ?? []).join(' · ') || 'Rule',
      data: r,
    })
  ),
];

const search = new MiniSearch<SrdRecord>({
  fields: ['name', 'searchText', 'kind', 'summary'],
  storeFields: ['id', 'name', 'kind', 'summary'],
  searchOptions: {
    boost: { name: 4, kind: 2 },
    fuzzy: 0.2,
    prefix: true,
  },
});

let extraRecords: SrdRecord[] = [];
const byId = new Map<string, SrdRecord>();

function rebuildIndex(): void {
  search.removeAll();
  byId.clear();
  for (const record of [...srdRecords, ...extraRecords]) {
    byId.set(record.id, record);
  }
  search.addAll([...byId.values()]);
}

rebuildIndex();

function allRecords(): SrdRecord[] {
  return [...srdRecords, ...extraRecords];
}

function nameKey(record: SrdRecord): string {
  return `${record.kind}:${record.name.toLowerCase()}`;
}

function isSrd(record: SrdRecord): boolean {
  return !record.source || record.source === 'srd';
}

function groupSameName(records: SrdRecord[]): SrdRecord[] {
  const groups = new Map<string, SrdRecord[]>();
  const order: string[] = [];
  for (const record of records) {
    const key = nameKey(record);
    const group = groups.get(key);
    if (!group) {
      groups.set(key, [record]);
      order.push(key);
      continue;
    }
    if (!group.some((existing) => existing.id === record.id)) group.push(record);
  }
  const out: SrdRecord[] = [];
  for (const key of order) {
    const group = groups.get(key) ?? [];
    group.sort((a, b) => {
      const aSrd = isSrd(a) ? 0 : 1;
      const bSrd = isSrd(b) ? 0 : 1;
      if (aSrd !== bSrd) return aSrd - bSrd;
      return (a.sourceLabel ?? '').localeCompare(b.sourceLabel ?? '');
    });
    out.push(...group);
  }
  return out;
}

function matchesFilter(record: SrdRecord, kind?: SrdKind | 'all' | string): boolean {
  if (!kind || kind === 'all') return true;
  if (kind.startsWith('source:')) return record.source === kind.slice('source:'.length);
  return record.kind === kind;
}

export function setExtraRecords(records: SrdRecord[]): void {
  extraRecords = records;
  rebuildIndex();
}

export function getExtraRecords(): SrdRecord[] {
  return extraRecords;
}

export function searchSrd(query: string, kind?: SrdKind | 'all' | string): SrdRecord[] {
  const q = query.trim();
  if (!q) {
    const pool = allRecords();
    const seed =
      kind && kind !== 'all'
        ? pool.filter((r) => matchesFilter(r, kind))
        : pool.filter((r) => r.kind === 'condition' || r.kind === 'rule');
    return groupSameName(seed).slice(0, 12);
  }
  const hits = search.search(q);
  const records = hits.map((h) => byId.get(String(h.id))).filter((r): r is SrdRecord => Boolean(r));
  return groupSameName(records.filter((r) => matchesFilter(r, kind)));
}

export function getSrd(id: string): SrdRecord | undefined {
  return byId.get(id);
}

export function monsterToStatBlock(data: Record<string, unknown>): StatBlock {
  return {
    name: String(data.name ?? 'Monster'),
    size: data.size as string | undefined,
    type: data.type as string | undefined,
    alignment: data.alignment as string | undefined,
    cr: data.cr as number | undefined,
    ac: data.ac as number | undefined,
    armorDetail: data.armorDetail as string | undefined,
    hp: data.hp as number | undefined,
    hitDice: data.hitDice as string | undefined,
    speed: data.speed as string | undefined,
    scores: data.scores as StatBlock['scores'],
    modifiers: data.modifiers as StatBlock['modifiers'],
    initiativeBonus: data.initiativeBonus as number | undefined,
    saves: data.saves as string | undefined,
    skills: data.skills as string | undefined,
    senses: data.senses as string | undefined,
    languages: data.languages as string | undefined,
    immunities: data.immunities as string | undefined,
    resistances: data.resistances as string | undefined,
    vulnerabilities: data.vulnerabilities as string | undefined,
    conditionImmunities: data.conditionImmunities as string | undefined,
    traits: data.traits as StatBlock['traits'],
    actions: data.actions as StatBlock['actions'],
    bonusActions: data.bonusActions as StatBlock['bonusActions'],
    reactions: data.reactions as StatBlock['reactions'],
    legendary: data.legendary as StatBlock['legendary'],
    lair: data.lair as StatBlock['lair'],
  };
}

export function srdMonsterToBestiaryMarkdown(data: Record<string, unknown>): string {
  return parsedToBestiaryMarkdown(statBlockToParsed(monsterToStatBlock(data)));
}

export const srdCounts = {
  spells: asList(spells).length,
  monsters: asList(monsters).length,
  conditions: resolvedConditions.length,
  weapons: asList(weapons).length,
  rules: asList(rules).length,
};

export function lookupCounts(): { spells: number; monsters: number; extras: number } {
  return {
    spells: srdCounts.spells + extraRecords.filter((r) => r.kind === 'spell').length,
    monsters: srdCounts.monsters + extraRecords.filter((r) => r.kind === 'monster').length,
    extras: extraRecords.length,
  };
}

export const SRD_ATTRIBUTION =
  'This work includes material from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode. Structured data via the Open5e API (document key srd-2024).';
