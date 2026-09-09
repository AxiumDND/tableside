import { Action, Code, Ol, Sub, Ul } from './HelpComponents'

export function LookupSection() {
  return (
    <>
      <p>
        Offline search of the <strong>open campaign's system pack</strong>. D&D 5e uses the bundled SRD 5.2.1
        (conditions, spells, monsters, weapons, rules, Axium shop goods). Pathfinder 2e ships a small original
        core (conditions, actions, a handful of creatures) — not Archives of Nethys. Vampire 5th ships original
        table procedures only (Hunger, Health, Willpower) — no clan or discipline book text. Optional PHB/DMG dumps
        add extra chips on 5e campaigns only.
      </p>
      <Ol
        items={[
          <>Open a campaign, then open <Action>Tools</Action> and pick <Action>Lookup</Action>.</>,
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
            Weapons, Armor, Equipment, Trade Goods, or Magic Items. Change the <Code>#</Code> title and save — the
            file in the tree renames to match. A monster also copies its default portrait into{' '}
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
            Optional PHB / DMG / Monster Manual / Ravenloft dumps live in Additional books (chips such as PHB 2024,
            MM2024). Use <Action>Open Additional books</Action> from Lookup. Installed app:{' '}
            <Code>%APPDATA%\Tableside\Additional Books</Code>.
          </>
        ]}
      />
      <Sub>NPC</Sub>
      <p>
        In <Action>Tools</Action>, pick <Action>NPC</Action>. Choose a race (5e) or ancestry (Pathfinder 2e), then a{' '}
        <strong>Name flavor</strong> (Classic fantasy, Norse, Greek mythology, Celtic, Roman, Arabic / desert-fantasy,
        Slavic, East Asian–inspired). Vampire nights use name tradition instead. Roll names, pick an AI-generated
        portrait, then <Action>New NPC…</Action> to write a sheet under <Code>NPCs/</Code> with name, species, art,
        and stats. Turn off bundled AI art in <strong>Help & settings → Settings → Artwork</strong>.
      </p>
      <Sub>Improvise</Sub>
      <p>
        <Action>Tools</Action> → <Action>Improvise</Action> has 2024 healing potions (dice and average) and a d10
        ladder for hazard damage, plus how hard that is by level.
      </p>
      <Sub>Links</Sub>
      <p>
        <Action>Tools</Action> → <Action>Links</Action> opens curated D&amp;D prep sites in your browser — rules
        lookups, map makers, free art/tokens, GM blogs, generators, ambience, and random tables — grouped by
        category. Tableside does not embed or track them.
      </p>
      <Sub>Timer</Sub>
      <p>
        <Action>Tools</Action> → <Action>Timer</Action>: pick minutes, then <Action>Show</Action> to fade a full
        hourglass over the player TV. Change the minutes while it waits to retune the glass.{' '}
        <Action>Start</Action> begins the countdown. Pause, resume, or reset;{' '}
        <Action>Fade out</Action> returns to the picture underneath. The empty glass holds at zero until you fade
        it. Uncheck <Action>Chime at zero</Action> to skip the Sfx-layer hit (same Music soundboard fader as
        dice; the <Action>Hourglass</Action> chip is on that board). Not saved to the campaign.
      </p>
    </>
  )
}
