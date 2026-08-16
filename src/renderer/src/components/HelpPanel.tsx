import { useState, type ReactNode } from 'react'

type HelpSection = 'start' | 'night' | 'lookup' | 'keys'

function Section({
  id,
  title,
  open,
  onToggle,
  children
}: {
  id: HelpSection
  title: string
  open: HelpSection
  onToggle: (id: HelpSection) => void
  children: ReactNode
}) {
  const active = open === id
  return (
    <div className="border-b border-line/80">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-panel-2"
      >
        <span className={`text-sm font-semibold ${active ? 'text-amber' : 'text-parchment'}`}>{title}</span>
        <span className="text-[10px] text-muted">{active ? '▾' : '▸'}</span>
      </button>
      {active ? <div className="space-y-2.5 px-3 pb-3 text-[13px] leading-relaxed text-parchment/85">{children}</div> : null}
    </div>
  )
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-panel-2 px-1 py-0.5 font-mono text-[12px] text-amber-dim">{children}</code>
  )
}

function Ol({ items }: { items: ReactNode[] }) {
  return (
    <ol className="list-decimal space-y-1.5 pl-4">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  )
}

export default function HelpPanel({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState<HelpSection>('start')

  function toggle(id: HelpSection): void {
    setOpen((prev) => (prev === id ? prev : id))
  }

  return (
    <aside className="flex min-h-0 w-[400px] shrink-0 flex-col border-l border-line bg-ink">
      <header className="border-b border-line px-3 py-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-amber">Help</h2>
          {onClose ? (
            <button type="button" onClick={onClose} className="text-xs text-muted hover:text-amber">
              Hide
            </button>
          ) : null}
        </div>
        <p className="mt-1 text-[11px] text-muted">Short recipes for the table. Full guides live in the repo docs folder.</p>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <Section id="start" title="Quick start" open={open} onToggle={toggle}>
          <Ol
            items={[
              <>
                <span className="text-amber">Sample</span>, <span className="text-amber">Open campaign</span>, or{' '}
                <span className="text-amber">New campaign</span>.
              </>,
              <>
                Click a map or portrait, then <span className="text-amber">Show to players</span>.
              </>,
              <>
                Open <span className="text-amber">Combat</span> or <span className="text-amber">Lookup</span> from the
                header when you need them.
              </>,
              <>Pick the TV with <span className="text-amber">Player display…</span> if you have two monitors.</>
            ]}
          />
        </Section>

        <Section id="night" title="Night sheet → initiative" open={open} onToggle={toggle}>
          <p>Prep once in Markdown, load at the table in one click.</p>
          <Ol
            items={[
              <>
                Put PC / NPC / monster sheets under <Code>Party/</Code>, <Code>NPCs/</Code>, <Code>Bestiary/</Code> with a{' '}
                <Code>statblock</Code> fence.
              </>,
              <>
                In a session note, use a heading with <Code>Combat</Code> or ⚔️.
              </>,
              <>
                Add a line like{' '}
                <Code>**Combatants:** [[Harbinger]] · [[Vampire Spawn]] ×2 · party</Code>
              </>,
              <>
                Open the night sheet → <span className="text-amber">Add to initiative</span> on that section.
                Missing wikilinks show a warning on the card. NPCs/monsters at initiative 0 are rolled
                automatically.
              </>,
              <>
                In Combat, roll or type init, press Start, optionally{' '}
                <span className="text-amber">Show to players</span> for the overlay.
              </>
            ]}
          />
          <p className="text-[12px] text-muted">
            <Code>party</Code> pulls every Party sheet. <Code>×2</Code> duplicates a creature. Missing links usually
            mean the sheet name does not match the wikilink.
          </p>
        </Section>

        <Section id="lookup" title="Lookup → campaign note" open={open} onToggle={toggle}>
          <p>Copy SRD (or WOTC) text into the campaign so you can edit it offline.</p>
          <Ol
            items={[
              <>Open a campaign, then open <span className="text-amber">Lookup</span>.</>,
              <>
                Search a monster, spell, or gear item. Use chips to narrow (Spells, Monsters, …).
              </>,
              <>
                Press <span className="text-amber">Add to Bestiary / Spells / Gear</span>. Table DM writes a markdown
                note in that folder (gear goes under Weapons, Armor, Equipment, or Magic Items). Monster notes also
                get a bundled D&D-fantasy default portrait in Bestiary/Art when one exists.
              </>,
              <>
                Open the new note from the file tree — edit HP, add <Code>[[wikilinks]]</Code>, or hook it into a night
                sheet.
              </>
            ]}
          />
          <p className="text-[12px] text-muted">
            If it says already in the folder, a same-named note exists. Monsters can also{' '}
            <span className="text-amber">Add to combat</span> without saving a note. Optional PHB/DMG dumps go in the
            WOTC folder (open it from Lookup).
          </p>
        </Section>

        <Section id="keys" title="Shortcuts & tips" open={open} onToggle={toggle}>
          <ul className="list-disc space-y-1.5 pl-4">
            <li>
              <Code>Alt+←</Code> or mouse back — previous note
            </li>
            <li>
              <Code>Alt+S</Code> — Show selected image to players
            </li>
            <li>
              <Code>Alt+X</Code> — Clear player screen
            </li>
            <li>
              <Code>Alt+T</Code> — Next combat turn (opens Combat if needed)
            </li>
            <li>
              Editing: <Code>Ctrl+S</Code> save, <Code>Esc</Code> cancel
            </li>
            <li>
              Right-click Maps → New map… — pick existing art or load a file into Maps/Art named like the note
              (Pan / Pin / Token / Fog, each with a submenu)
            </li>
            <li>Right-click the file tree to create from Templates, import files, or delete a file</li>
            <li>
              Folders start collapsed; the open file’s folder stays expanded. Art folders stay collapsed. Gear has Weapons, Armor, Equipment, and
              Magic Items
            </li>
            <li>
              Files → <Code>Search</Code> to find notes, maps, and art (`Ctrl+F` or `/`; Esc hides)
            </li>
            <li>
              Repo docs: <Code>docs/TABLE.md</Code>, <Code>docs/CAMPAIGN.md</Code>, <Code>docs/RECIPES.md</Code>
            </li>
          </ul>
        </Section>
      </div>
    </aside>
  )
}
