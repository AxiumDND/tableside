import { Action, Code, Ol, Sub, Ul } from './HelpComponents'

export function CombatSection() {
  return (
    <>
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
            Prefer a <Code>[!combat] Title … [!/combat]</Code> block (nest inside a scene or at document level).
            Aliases: <Code>encounter</Code>, <Code>fight</Code>. Legacy headings with <Code>Combat</Code>,{' '}
            <Code>Encounter</Code>, or ⚔️ still work — skip titles that say <Code>no combat</Code>. Right-click
            Sessions for <Action>New game night sheet…</Action> — Party roster, scene blocks, nested combat, and
            table cues. Copy a <Code>[!scene]…[!/scene]</Code> block to add another beat. Wrap PC and companion{' '}
            <Code>[[NPC]]</Code> links in <Code>[!party]…[!/party]</Code> (live race / class / AC / HP / PP from those sheets).
            After the session, <Action>New session recap…</Action> is notes on what actually happened (plus{' '}
            <Code>[!gmonly]</Code> for you).
          </>,
          <>
            Prefer a <Code>[!combat]</Code> block with{" "}
            <Code>**Combatants:** [[Cultist]] ×3 · party</Code>. Use{" "}
            <strong>Edit</strong> on the card for Party on/off and{" "}
            <strong>Add combatant…</strong> (NPCs, Bestiary, SRD/books).
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
            Or skip the game night sheet: <Action>Add all players</Action>, click the Bestiary list, or type a
            manual Name / Init / HP row. D&D 5e and Pathfinder 2e also take AC. Vampire 5th takes Health,
            Willpower, and Hunger instead.
          </>,
          <>
            PCs: type their table roll into Init. NPCs: use <Action>Roll NPCs</Action> or the d20 on a row.{' '}
            <Action>Roll all</Action> re-rolls everyone.
          </>,
          <>
            <Action>Start combat</Action> begins round 1. With <Action>Combat music</Action> ticked, that starts
            the <Code>Audio/Music/Combat</Code> playlist. <Code>Alt+T</Code> advances the turn (opens Combat if
            needed). Adjust HP on the row. <Action>Cnd</Action> toggles conditions (Poisoned, Prone, and the rest of
            the pack) on that PC, NPC, or monster. The name opens that combatant's rollable statblock without
            changing whose turn it is.
          </>,
          <>
            Optionally <Action>Show to players</Action> on the Combat panel to overlay initiative on the current
            player image. <Action>End combat</Action> clears the tracker (asks first) and, with{' '}
            <Action>Combat music</Action> ticked, returns to <Code>Audio/Music/General</Code>. Untick Combat music
            if you want to keep the current mix.
          </>
        ]}
      />
      <Sub>What players see on the overlay</Sub>
      <Ul
        items={[
          <>Names in order; current turn highlighted.</>,
          <>
            D&D 5e: Bloodied on enemies/NPCs under half HP. Unconscious on PCs at 0 HP; dead on monsters/NPCs
            at 0 HP.
          </>,
          <>
            Pathfinder 2e: Wounded on enemies/NPCs under half HP. Dying on PCs at 0 HP; dead on monsters/NPCs at 0
            HP.
          </>,
          <>Vampire 5th: Health, Willpower, and Hunger (0–5) on the overlay. No AC or Bloodied.</>,
          <>Conditions you set on a row (Poisoned, Prone, …) also show on the overlay.</>,
          <>No HP numbers, AC, or other secrets on 5e/PF2e overlays beyond those tags.</>
        ]}
      />
      <p className="text-[12px] text-muted">
        Combat saves to hidden <Code>combat.json</Code>. End combat asks first. If Add to initiative does
        nothing: the wikilink does not match a sheet name, the sheet is not under Party / NPCs / Bestiary, the
        heading is not a combat heading, or there is no statblock.
      </p>
    </>
  )
}
