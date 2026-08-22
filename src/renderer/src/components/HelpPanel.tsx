import { useState, type ReactNode } from 'react'

type HelpSection = 'start' | 'screens' | 'files' | 'combat' | 'lookup' | 'keys'

function Section({
  id,
  title,
  open,
  onToggle,
  children
}: {
  id: HelpSection
  title: string
  open: HelpSection | null
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

function Action({ children }: { children: ReactNode }) {
  return <span className="text-amber">{children}</span>
}

function Sub({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-dim">{children}</p>
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

function Ul({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-4">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

export default function HelpPanel({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState<HelpSection | null>('start')

  function toggle(id: HelpSection): void {
    setOpen((prev) => (prev === id ? null : id))
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
        <p className="mt-1 text-[11px] text-muted">How to run the table from this console. Click a heading to open it.</p>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <Section id="start" title="Quick start" open={open} onToggle={toggle}>
          <Ol
            items={[
              <>
                <Action>Open campaign</Action> picks any folder. <Action>New campaign</Action> scaffolds Party, NPCs,
                Places, Factions, Maps, and the rest in an empty folder. First launch with no folder opens the
                Greystead one-shot; <Action>Sample</Action> loads that same copy.
              </>,
              <>
                Two windows open: this DM console, and a fullscreen black <strong>player</strong> window. Click the{' '}
                <Action>Players see</Action> preview and pick the TV. Plug in a display later and choose it there —
                the player view stays fullscreen.
              </>,
              <>
                Click a map or portrait in a note so it is selected, then <Action>Show to players</Action> (or{' '}
                <Code>Alt+S</Code>). It fades in over about five seconds. <Action>Clear</Action> on the{' '}
                <Action>Players see</Action> preview (or <Code>Alt+X</Code>) blanks the player screen.
              </>,
              <>
                Open <Action>Combat</Action> or <Action>Lookup</Action> from the header when you need them. Dice live
                at the bottom of the left column.
              </>
            ]}
          />
          <p className="text-[12px] text-muted">
            This is not a VTT. There is no account and no internet at the table. Notes are ordinary Markdown on disk
            (Obsidian-friendly).
          </p>
        </Section>

        <Section id="screens" title="Layout & player screen" open={open} onToggle={toggle}>
          <Sub>This console</Sub>
          <Ul
            items={[
              <>Header: campaign name, New / Open, Lookup, Combat, Help.</>,
              <>
                Left: <strong>Players see</strong> preview, file tree, dice tray. Hide the preview if you need height.
              </>,
              <>Center: the open note, image, or PDF.</>,
              <>Right: Combat, Lookup, or this Help panel — one at a time.</>
            ]}
          />
          <Sub>Show maps and art</Sub>
          <Ol
            items={[
              <>Open a note with <Code>![[image.png]]</Code>, or click an image in the file tree.</>,
              <>Click the picture so the caption says it is selected.</>,
              <>
                Press <Action>Show to players</Action>. The player window fades from black onto that image.
              </>,
              <>
                On a map note, what they see follows your crop, fog, and tokens. Pins stay DM-only.
              </>
            ]}
          />
          <p className="text-[12px] text-muted">
            PDFs open here for you only — they are not sent to the player screen. Export or screenshot maps you want
            them to see, or keep images under <Code>Maps/Art/</Code>.
          </p>
        </Section>

        <Section id="files" title="Files, notes & maps" open={open} onToggle={toggle}>
          <Sub>File tree</Sub>
          <Ul
            items={[
              <>
                Click a note, image, or PDF to open it. Folders start collapsed; the open file’s folder stays expanded.{' '}
                <Code>Art/</Code> stays collapsed — portraits still load onto sheets.
              </>,
              <>
                <Action>Search</Action> next to Files (or <Code>Ctrl+F</Code> / <Code>/</Code>) finds notes, maps, and
                art by name. <Code>Esc</Code> clears, then hides the box.
              </>,
              <>
                Right-click a folder for Templates (player, NPC, monster, spell, gear, game night sheet, map, place,
                shop, faction). <Action>Add art…</Action> on Party, NPCs, Bestiary, Places, Factions, Spells, Sessions,
                Maps, Handouts, a Gear subsection, or the <Code>Art/</Code> folder itself — pictures go in that
                folder’s <Code>Art/</Code>. Name them like the sheet (<Code>Ghoul.webp</Code>) so portraits attach.{' '}
                <Action>Add files…</Action> still imports notes and PDFs into the folder you clicked. Player, NPC, and
                monster sheets show a portrait frame — click it for <Action>Load art…</Action> or campaign art, or add
                art when you create the sheet.
              </>,
              <>
                Right-click a file to <Action>Duplicate…</Action>, <Action>Add art here…</Action> (into that
                folder’s <Code>Art/</Code>), add files beside it, or <Action>Delete…</Action> (asks first).
              </>,
              <>
                <Action>New map…</Action> picks existing art or <Action>Load image…</Action>. Loaded files copy into
                that folder’s <Code>Art/</Code> (usually <Code>Maps/Art/</Code>) named like the note.{' '}
                <Action>New place…</Action> / <Action>New shop…</Action> on <Code>Places/</Code>. Shops pick a type
                as art (tavern, armorer, stables, weapons, general store, apothecary). That type fills the shop’s
                stock table from bundled random tables — <Action>Reroll stock</Action>, <Action>Add item…</Action>, or
                Remove a row if you want a new or trimmed list. Liked / Neutral / Hated on the stock board is how the
                party is known here: liked pays 20% less than list, hated pays half again. List prices stay in the note.
                Places pick town, dungeon, mountain, swamp, and so on; factions
                pick an emblem.{' '}
                <Action>New faction…</Action> on <Code>Factions/</Code>. Shopkeepers stay in <Code>NPCs/</Code>.
              </>,
              <>
                <Code>campaign.json</Code>, <Code>combat.json</Code>, and <Code>README.md</Code> stay hidden from the
                tree.
              </>
            ]}
          />
          <Sub>Notes</Sub>
          <Ul
            items={[
              <>
                <Action>Edit</Action> / <Action>Save</Action> — <Code>Ctrl+S</Code> saves, <Code>Esc</Code> cancels,
                Tab inserts two spaces.
              </>,
              <>
                <Code>[[Note Name]]</Code> opens another note. Images in the note stay clickable for Show to players.
              </>,
              <>
                Party / NPC / Bestiary sheets with a <Code>statblock</Code> fence open in sheet view: portrait and
                rollable block first, notes underneath. <Action>Add to combat</Action> sits on the block.
              </>,
              <>
                Map notes (<Code>```map</Code> fence) show <Action>Pan</Action> / <Action>Pin</Action> /{' '}
                <Action>Token</Action> / <Action>Fog</Action>. Extra controls open as a submenu. Tokens (Party / NPCs /
                Bestiary portraits) scale together; Large/Huge stay 2×/3× a Medium token.
              </>
            ]}
          />
          <p className="text-[12px] text-muted">
            Back: note header ←, <Code>Alt+←</Code>, or mouse back. Next: note header →, <Code>Alt+→</Code>, or mouse
            forward — next file in the same Files folder. Edits write straight to the campaign folder.
          </p>
        </Section>

        <Section id="combat" title="Combat & game night sheets" open={open} onToggle={toggle}>
          <Sub>Prep (once)</Sub>
          <Ol
            items={[
              <>
                Put PC / NPC / monster sheets under <Code>Party/</Code>, <Code>NPCs/</Code>, <Code>Bestiary/</Code> with
                a <Code>statblock</Code> fence (at least name, HP, AC). Right-click the folder, or save from Lookup.
                Each sheet has a portrait frame — click it to load art or pick campaign art, or add art when you create
                the sheet.
              </>,
              <>
                In a session or game night sheet, use a heading that includes <Code>Combat</Code>, <Code>Encounter</Code>
                , or ⚔️. Skip headings that say <Code>no combat</Code>. Right-click Sessions for{' '}
                <Action>New game night sheet…</Action> — it uses the Lazy DM 10 steps and links every existing Party
                sheet.
              </>,
              <>
                Add a line like <Code>**Combatants:** [[Vesper]] · [[Cultist]] ×3 · party</Code>
              </>
            ]}
          />
          <Ul
            items={[
              <>
                <Code>[[Sheet Name]]</Code> must match a Party / NPCs / Bestiary note (the <Code>PC —</Code> prefix can
                be omitted in the link).
              </>,
              <>
                <Code>×2</Code> / <Code>x2</Code> duplicates that creature. <Code>party</Code> adds every Party sheet.
              </>,
              <>Separators can be <Code>·</Code> <Code>|</Code> <Code>,</Code> or <Code>;</Code>.</>
            ]}
          />
          <Sub>At the table</Sub>
          <Ol
            items={[
              <>
                Open the game night sheet. On that combat section, press <Action>Add to initiative</Action>. Missing{' '}
                <Code>[[links]]</Code> show a warning on the card. NPCs/monsters at initiative 0 are rolled
                automatically. Names already in Combat are skipped.
              </>,
              <>
                Or skip the game night sheet: <Action>Add all players</Action>, click the Bestiary list, or type a manual
                Name / Init / HP / AC row.
              </>,
              <>
                PCs: type their table roll into Init. NPCs: use <Action>Roll NPCs</Action> or the d20 on a row.{' '}
                <Action>Roll all</Action> re-rolls everyone.
              </>,
              <>
                <Action>Start</Action> begins round 1. <Code>Alt+T</Code> advances the turn (opens Combat if needed).
                Adjust HP on the row. The eye opens that combatant’s rollable statblock without changing whose turn it
                is.
              </>,
              <>
                Optionally <Action>Show to players</Action> on the Combat panel to overlay initiative on the current
                player image.
              </>
            ]}
          />
          <Sub>What players see on the overlay</Sub>
          <Ul
            items={[
              <>Names in order; current turn highlighted.</>,
              <>Bloodied on enemies/NPCs under half HP.</>,
              <>Unconscious on PCs at 0 HP; dead on monsters/NPCs at 0 HP.</>,
              <>No HP numbers, AC, or other secrets.</>
            ]}
          />
          <p className="text-[12px] text-muted">
            Combat saves to hidden <Code>combat.json</Code>. Clear combat asks first. If Add to initiative does
            nothing: the wikilink does not match a sheet name, the sheet is not under Party / NPCs / Bestiary, the
            heading is not a combat heading, or there is no statblock.
          </p>
        </Section>

        <Section id="lookup" title="Lookup" open={open} onToggle={toggle}>
          <p>
            Offline search of the bundled SRD 5.2.1 (conditions, spells, monsters, weapons, rules). Optional book dumps
            add extra chips.
          </p>
          <Ol
            items={[
              <>Open a campaign, then open <Action>Lookup</Action>.</>,
              <>
                Search, or pick a chip to list everything in that category (Spells, Monsters, Trade Goods, Temple
                Goods, Apothecary, Forge, …). A
                selected chip with an empty search lists every matching entry.
              </>,
              <>
                Open a result. Spells show the emblem for their school of magic. Monsters, weapons, and gear show
                bundled art when it exists. Click a named trait or attack in a monster block to roll it.
              </>,
              <>
                <Action>Add to Bestiary / Spells / Gear</Action> writes a markdown note you can edit. Gear goes under
                Weapons, Armor, Equipment, Trade Goods, or Magic Items. A monster also copies its default portrait into{' '}
                <Code>Bestiary/Art/</Code> if the campaign does not already have one. A spell copies its school emblem
                into <Code>Spells/Art/</Code>.
              </>,
              <>
                Monsters can <Action>Add to combat</Action> for this fight only, without saving a note.
              </>
            ]}
          />
          <Ul
            items={[
              <>Already in … — a same-named note exists; open and edit it.</>,
              <>Conditions and pure rules entries are search-only (no Add button).</>,
              <>
                Optional PHB / DMG / Monster Manual / Ravenloft dumps live in the WOTC folder (chips such as PHB 2024,
                MM2024). Use <Action>Open WOTC folder</Action> from Lookup. Installed app:{' '}
                <Code>%APPDATA%\Tableside\WOTC</Code>.
              </>
            ]}
          />
        </Section>

        <Section id="keys" title="Dice & shortcuts" open={open} onToggle={toggle}>
          <Sub>Dice tray</Sub>
          <p>
            Bottom of the left column: d4–d20 plus a custom expression such as <Code>2d6+3</Code>. Rolls feed the same
            log as combat and statblock clicks.
          </p>
          <Sub>Keys</Sub>
          <Ul
            items={[
              <>
                <Code>Alt+←</Code> or mouse back — previous note
              </>,
              <>
                <Code>Alt+→</Code> or mouse forward — next file in the same folder
              </>,
              <>
                <Code>Alt+S</Code> — Show selected image to players
              </>,
              <>
                <Code>Alt+X</Code> — Clear player screen
              </>,
              <>
                <Code>Alt+T</Code> — Next combat turn
              </>,
              <>
                While editing: <Code>Ctrl+S</Code> save, <Code>Esc</Code> cancel (prompts if unsaved)
              </>,
              <>
                <Code>Esc</Code> also dismisses confirm dialogs, and hides Files search after clearing it
              </>
            ]}
          />
          <p className="text-[12px] text-muted">
            After the session, combat stays in <Code>combat.json</Code> until you clear it. Keep lasting work in your
            own campaign folder; Sample can refresh from the bundled Greystead copy.
          </p>
        </Section>
      </div>
    </aside>
  )
}
