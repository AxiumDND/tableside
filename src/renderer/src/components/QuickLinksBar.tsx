import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CampaignInfo } from '../../../shared/types'
import { PREP_TOOLS, TABLE_TOOLS, type ToolsTabId } from '../../../shared/rightPanel'
import { addDays, addHours, calendarBarLabel, calendarLightLabel, formatCalendar } from '../../../shared/calendar'
import {
  calendarNoteTemplate,
  parseCampaignCalendar,
  preferredCalendarNotePath,
  writeCalendarIntoNote
} from '../../../shared/calendarNote'
import { calendarPreset } from '../../../shared/calendarPresets'
import { allPartyNotes, type CampaignNote } from '../lib/notes'
import {
  filterQuickConditions,
  lookupConditions,
  quickPartyRows
} from '../lib/quickLinks'
import CalendarSettings from './CalendarSettings'
import PanelToggle from './PanelToggle'
import QuickMenu from './QuickMenu'

function dash(value: string): string {
  return value.trim() || '—'
}

const chipBtn =
  'rounded border border-line px-1.5 py-0.5 text-[11px] font-semibold text-parchment/85 hover:border-amber disabled:opacity-40'

function toolButtonClass(active: boolean): string {
  return `rounded px-3 py-1 text-sm ${
    active ? 'bg-amber font-semibold text-on-amber' : 'border border-line hover:border-amber'
  }`
}

export default function QuickLinksBar({
  notes,
  system,
  onOpenNote,
  onCampaignChange,
  onNotesReload,
  toolsTab = null,
  toolsOpen = false,
  sidebarOpen = true,
  rightPanelOpen = false,
  onOpenTool,
  onToggleSidebar,
  onToggleRightPanel
}: {
  notes: CampaignNote[]
  system?: string | null
  onOpenNote: (path: string) => void
  onCampaignChange?: (campaign: CampaignInfo) => void
  onNotesReload?: () => void
  toolsTab?: ToolsTabId | null
  toolsOpen?: boolean
  sidebarOpen?: boolean
  rightPanelOpen?: boolean
  onOpenTool?: (tab: ToolsTabId) => void
  onToggleSidebar?: () => void
  onToggleRightPanel?: () => void
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [sheets, setSheets] = useState<Record<string, string>>({})
  const [conditionQuery, setConditionQuery] = useState('')
  const [pickedCondition, setPickedCondition] = useState<string | null>(null)
  const [calendarMarkdown, setCalendarMarkdown] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const party = useMemo(() => quickPartyRows(notes, sheets), [notes, sheets])
  const conditions = useMemo(() => lookupConditions(system), [system])
  const shownConditions = useMemo(
    () => filterQuickConditions(conditions, conditionQuery),
    [conditions, conditionQuery]
  )
  const partyPaths = useMemo(() => allPartyNotes(notes).map((note) => note.relativePath), [notes])
  const loadKey = partyPaths.join('|')
  const calendarPath = useMemo(
    () => preferredCalendarNotePath(notes.map((note) => note.relativePath)),
    [notes]
  )

  useEffect(() => {
    if (!loadKey) {
      setSheets({})
      return
    }
    const paths = loadKey.split('|')
    let cancelled = false
    void Promise.all(
      paths.map(async (path) => {
        try {
          const body = await window.tabledm.readFile(path)
          return [path, body] as const
        } catch {
          return [path, ''] as const
        }
      })
    ).then((entries) => {
      if (!cancelled) setSheets(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [loadKey])

  useEffect(() => {
    let cancelled = false
    void window.tabledm
      .readFile(calendarPath)
      .then((body) => {
        if (!cancelled) setCalendarMarkdown(body)
      })
      .catch(() => {
        if (!cancelled) setCalendarMarkdown(null)
      })
    return () => {
      cancelled = true
    }
  }, [calendarPath, notes.length])

  useEffect(() => {
    if (openId !== 'conditions') {
      setConditionQuery('')
      setPickedCondition(null)
    }
  }, [openId])

  const clock = useMemo(
    () => (calendarMarkdown ? parseCampaignCalendar(calendarMarkdown) : null),
    [calendarMarkdown]
  )
  const readout = clock ? formatCalendar(clock.definition, clock.now) : null
  const barLabel = readout
    ? [readout.weekday, readout.date, readout.time].filter(Boolean).join(' · ')
    : ''
  const barTitle = clock ? calendarBarLabel(clock.definition, clock.now) : ''
  const starter = calendarPreset('gregorian')
  const activeTool = toolsOpen ? toolsTab : null

  function pickTool(tab: ToolsTabId): void {
    setOpenId(null)
    onOpenTool?.(tab)
  }

  const persist = useCallback(
    async (markdown: string) => {
      const result = await window.tabledm.saveFile(calendarPath, markdown)
      if (!result) throw new Error('save failed')
      setCalendarMarkdown(markdown)
      onCampaignChange?.(result.campaign)
      onNotesReload?.()
      return result
    },
    [calendarPath, onCampaignChange, onNotesReload]
  )

  async function shift(kind: 'hour' | 'day', delta: number): Promise<void> {
    if (!clock || !calendarMarkdown || busy) return
    setBusy(true)
    try {
      const next =
        kind === 'hour'
          ? addHours(clock.definition, clock.now, delta)
          : addDays(clock.definition, clock.now, delta)
      await persist(writeCalendarIntoNote(calendarMarkdown, clock.definition, next))
    } catch {
      /* keep the last good clock */
    }
    setBusy(false)
  }

  async function saveSettings(
    definition: typeof starter.definition,
    instant: typeof starter.now
  ): Promise<void> {
    const base = calendarMarkdown ?? calendarNoteTemplate(definition, instant)
    await persist(writeCalendarIntoNote(base, definition, instant))
  }

  return (
    <nav
      aria-label="Quick links"
      className="flex h-9 shrink-0 items-center gap-2 border-b border-line bg-panel px-3"
    >
      {onToggleSidebar ? <PanelToggle side="left" open={sidebarOpen} onToggle={onToggleSidebar} /> : null}
      <QuickMenu id="party" label="Party" openId={openId} onOpenId={setOpenId} menuClassName="w-[26rem]">
        {party.length === 0 ? (
          <p className="px-3 py-2 text-[13px] text-muted">No Party sheets yet.</p>
        ) : (
          <div className="max-h-80 overflow-auto">
            <div className="grid grid-cols-[minmax(0,1fr)_3rem_3rem_3rem] gap-x-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
              <span>Name</span>
              <span className="text-right">AC</span>
              <span className="text-right" title="Spell save DC">
                DC
              </span>
              <span className="text-right" title="Passive Perception">
                PP
              </span>
            </div>
            {party.map((row) => (
              <button
                key={row.notePath}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpenId(null)
                  onOpenNote(row.notePath)
                }}
                className="grid w-full grid-cols-[minmax(0,1fr)_3rem_3rem_3rem] gap-x-2 px-3 py-1.5 text-left text-[13px] text-parchment/90 hover:bg-panel-2 hover:text-amber"
              >
                <span className="truncate font-semibold">{row.name}</span>
                <span className="text-right tabular-nums">{dash(row.ac)}</span>
                <span className="text-right tabular-nums">{dash(row.saveDc)}</span>
                <span className="text-right tabular-nums">{dash(row.pp)}</span>
              </button>
            ))}
          </div>
        )}
      </QuickMenu>
      <QuickMenu
        id="conditions"
        label="Conditions"
        openId={openId}
        onOpenId={setOpenId}
        menuClassName="w-[22rem]"
      >
        <div className="px-2 pb-1">
          <input
            type="search"
            value={conditionQuery}
            onChange={(event) => setConditionQuery(event.target.value)}
            placeholder="Filter…"
            aria-label="Filter conditions"
            className="w-full rounded border border-line bg-ink px-2 py-1 text-[13px] outline-none focus:border-amber"
          />
        </div>
        <ul className="max-h-72 overflow-auto">
          {shownConditions.length === 0 ? (
            <li className="px-3 py-2 text-[13px] text-muted">No matching conditions</li>
          ) : (
            shownConditions.map((item) => {
              const selected = pickedCondition === item.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="menuitem"
                    aria-expanded={selected}
                    onClick={() => setPickedCondition(selected ? null : item.id)}
                    className="w-full px-3 py-1.5 text-left text-[13px] text-parchment/90 hover:bg-panel-2 hover:text-amber"
                  >
                    <span className="font-semibold">{item.name}</span>
                    {selected && item.desc ? (
                      <span className="mt-1 block text-[12px] font-normal leading-snug text-muted">
                        {item.desc}
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </QuickMenu>
      <span className="mx-0.5 h-4 w-px shrink-0 bg-line" aria-hidden="true" />
      <button
        type="button"
        className={toolButtonClass(activeTool === 'lookup')}
        aria-pressed={activeTool === 'lookup'}
        onClick={() => pickTool('lookup')}
      >
        Lookup
      </button>
      <QuickMenu
        id="prep"
        label="Prep"
        openId={openId}
        onOpenId={setOpenId}
        active={PREP_TOOLS.some((tool) => tool.id === activeTool)}
      >
        {PREP_TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            role="menuitem"
            onClick={() => pickTool(tool.id)}
            className="w-full px-3 py-1.5 text-left text-[13px] text-parchment/90 hover:bg-panel-2 hover:text-amber"
          >
            {tool.label}
          </button>
        ))}
      </QuickMenu>
      <QuickMenu
        id="table"
        label="Table"
        openId={openId}
        onOpenId={setOpenId}
        active={TABLE_TOOLS.some((tool) => tool.id === activeTool)}
      >
        {TABLE_TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            role="menuitem"
            onClick={() => pickTool(tool.id)}
            className="w-full px-3 py-1.5 text-left text-[13px] text-parchment/90 hover:bg-panel-2 hover:text-amber"
          >
            {tool.label}
          </button>
        ))}
      </QuickMenu>
      <div className="ml-auto flex min-w-0 items-center gap-1.5">
        {clock && readout ? (
          <>
            <button
              type="button"
              title={barTitle}
              onClick={() => onOpenNote(calendarPath)}
              className="min-w-0 truncate text-left text-[12px] text-parchment/90 hover:text-amber"
            >
              {barLabel}
            </button>
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                readout.light === 'night'
                  ? 'bg-ink text-parchment/70'
                  : readout.light === 'day'
                    ? 'bg-amber/15 text-amber'
                    : 'bg-panel-2 text-muted'
              }`}
            >
              {calendarLightLabel(readout.light)}
            </span>
            <button type="button" className={chipBtn} disabled={busy} aria-label="Back one hour" onClick={() => void shift('hour', -1)}>
              ◀h
            </button>
            <button type="button" className={chipBtn} disabled={busy} aria-label="Forward one hour" onClick={() => void shift('hour', 1)}>
              ▶h
            </button>
            <button type="button" className={chipBtn} disabled={busy} aria-label="Advance one day" onClick={() => void shift('day', 1)}>
              +Day
            </button>
            <button
              type="button"
              className={chipBtn}
              aria-label="Calendar settings"
              onClick={() => setSettingsOpen(true)}
            >
              ⚙
            </button>
          </>
        ) : (
          <button type="button" className={chipBtn} onClick={() => setSettingsOpen(true)}>
            Set calendar…
          </button>
        )}
        {onToggleRightPanel ? (
          <PanelToggle side="right" open={rightPanelOpen} onToggle={onToggleRightPanel} />
        ) : null}
      </div>
      {settingsOpen ? (
        <CalendarSettings
          definition={clock?.definition ?? starter.definition}
          now={clock?.now ?? starter.now}
          notePath={calendarPath}
          onClose={() => setSettingsOpen(false)}
          onSave={saveSettings}
          onOpenNote={() => {
            setSettingsOpen(false)
            onOpenNote(calendarPath)
          }}
        />
      ) : null}
    </nav>
  )
}
