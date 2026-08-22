import type { SystemId } from '../../../shared/systemPack'
import { getSystemPack, parseSystemId } from '../../../shared/systemPack'
import pf2eCore from '../data/pf2e/core.json'
import v5Core from '../data/v5/core.json'
import { setCoreRecords, setExtraRecords, srdRecords, type SrdKind, type SrdRecord } from './srd'

type PackFile = {
  attribution?: string
  records: PackJsonRecord[]
}

type PackJsonRecord = {
  id: string
  name: string
  kind: SrdKind
  summary?: string
  desc?: string
  topic?: string
  data?: Record<string, unknown>
}

function asPack(value: unknown): PackFile {
  const rec = value as PackFile
  return { attribution: rec.attribution, records: Array.isArray(rec.records) ? rec.records : [] }
}

function toRecord(raw: PackJsonRecord, source: string, sourceLabel: string): SrdRecord {
  const desc = String(raw.desc ?? raw.data?.desc ?? '').trim()
  const data: Record<string, unknown> = {
    name: raw.name,
    desc,
    ...(raw.data ?? {})
  }
  if (raw.topic) data.topic = raw.topic
  return {
    id: raw.id,
    name: raw.name,
    kind: raw.kind,
    searchText: [raw.name, raw.kind, raw.topic, raw.summary, desc].filter(Boolean).join(' '),
    summary: raw.summary || raw.kind,
    data,
    source,
    sourceLabel
  }
}

function recordsFromPack(file: unknown, system: SystemId): SrdRecord[] {
  const pack = getSystemPack(system)
  const parsed = asPack(file)
  return parsed.records.map((record) => toRecord(record, pack.lookupSource, pack.lookupSourceLabel))
}

export function packLookupRecords(system?: string | null): SrdRecord[] {
  const id = parseSystemId(system)
  if (id === 'pf2e') return recordsFromPack(pf2eCore, 'pf2e')
  if (id === 'v5') return recordsFromPack(v5Core, 'v5')
  return srdRecords
}

export function activateSystemLookup(system?: string | null): void {
  const id = parseSystemId(system)
  const pack = getSystemPack(id)
  setCoreRecords(packLookupRecords(id))
  if (!pack.wotcLookup) setExtraRecords([])
}
