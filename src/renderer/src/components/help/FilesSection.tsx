import type { AppFolders } from '../../../../shared/types'
import { Action, Code, Sub, Ul } from './HelpComponents'
import { ConvertGuideBlock, FolderOpen } from './HelpFolderComponents'

export function FilesSection({ folders }: { folders: AppFolders | null }) {
  return (
    <>
      <Sub>On this PC</Sub>
      <p>
        The installer default is <Code>%LOCALAPPDATA%\Programs\Tableside</Code> unless you picked another folder.
        Campaign notes stay in the folder you opened — not inside the app.
      </p>
      {folders ? (
        <>
          {folders.campaignFolder ? (
            <FolderOpen
              label="This campaign (notes, art, and audio on disk):"
              path={folders.campaignFolder}
              onOpen={() => void window.tabledm.openAppFolder('campaign')}
            />
          ) : (
            <p className="text-muted">Open a campaign to see its folder here.</p>
          )}
          <ConvertGuideBlock
            label="Conversion spec for an AI (AI-CAMPAIGN.md):"
            path={folders.convertGuidePath}
            onOpen={() => void window.tabledm.openAppFolder('convert')}
          />
          <FolderOpen
            label="This copy of Tableside:"
            path={folders.appFolder}
            onOpen={() => void window.tabledm.openAppFolder('app')}
          />
          <FolderOpen
            label="Settings and Greystead sample:"
            path={folders.userDataFolder}
            onOpen={() => void window.tabledm.openAppFolder('userData')}
          />
          <FolderOpen
            label="Additional books:"
            path={folders.booksFolder}
            onOpen={() => void window.tabledm.openAppFolder('books')}
          />
        </>
      ) : null}
      <Sub>File tree</Sub>
      <Ul
        items={[
          <>
            Click a note, image, or PDF to open it. Folders start collapsed; the open file's folder expands so you
            can see it. Click the folder again to collapse it and look elsewhere.{' '}
            <Code>Art/</Code> stays collapsed — portraits still load onto sheets.
          </>,
          <>
            <Action>Search</Action> next to Files (or <Code>Ctrl+F</Code> / <Code>/</Code>) finds notes, maps, and
            art by name. <Code>Esc</Code> clears, then hides the box.
          </>,
          <>
            Right-click a folder to add a player, party roster, NPC, monster, spell, gear, game night sheet, session recap, map, place, shop, or
            faction — the sheet comes in ready to fill. On a Party, NPC, or monster sheet, <Action>Add web sheet</Action> stores
            a character or monster page URL and lets you flip between the note and the live page in this pane (sign in on that
            page if asked). Tableside does not import stats from the web page.{' '}
            <Action>Add art…</Action> on Party, NPCs, Bestiary, Places, Factions, Spells, Sessions,
            Maps, Handouts, a Gear subsection, or the <Code>Art/</Code> folder itself — pictures go in that
            folder's <Code>Art/</Code>. Name them like the sheet (<Code>Ghoul.webp</Code>) so portraits attach.{' '}
            <Action>Add files…</Action> still imports notes and PDFs into the folder you clicked. Player, NPC, and
            monster sheets show a portrait frame — click it for <Action>Load art…</Action> or campaign art, or add
            art when you create the sheet.
          </>,
          <>
            Right-click a file to <Action>Duplicate…</Action>, <Action>Add art here…</Action> (into that
            folder's <Code>Art/</Code>), add files beside it, or <Action>Delete…</Action> (asks first).
          </>,
          <>
            <Action>New map…</Action> picks existing art or <Action>Load image…</Action>. Loaded files copy into
            that folder's <Code>Art/</Code> (usually <Code>Maps/Art/</Code>) named like the note.{' '}
            <Action>New place…</Action> / <Action>New shop…</Action> on <Code>Places/</Code>. Shops pick a type
            as art (tavern, armorer, stables, weapons, general store, apothecary). That type fills the shop's
            stock table from bundled random tables — <Action>Reroll stock</Action>, <Action>Add item…</Action>, or
            Remove a row if you want a new or trimmed list. Liked / Neutral / Hated on the stock board is how the
            party is known here: liked pays 20% less than list, hated pays half again. List prices stay in the note.
            Places pick town, dungeon, mountain, swamp, and so on; factions
            pick an emblem.{' '}
            <Action>New faction…</Action> on <Code>Factions/</Code>. Shopkeepers stay in <Code>NPCs/</Code>.
          </>,
          <>
            <Code>campaign.json</Code>, <Code>combat.json</Code>, <Code>audio.json</Code>, and <Code>README.md</Code> stay hidden from the
            tree.
          </>
        ]}
      />
      <Sub>Notes</Sub>
      <Ul
        items={[
          <>
            <Action>Edit</Action> / <Action>Save</Action> — <Code>Ctrl+S</Code> saves, <Code>Esc</Code> cancels,
            Tab inserts two spaces. Misspellings underline; right-click for suggestions or add to the dictionary.
          </>,
          <>
            <Code>[[Note Name]]</Code> opens another note. Images in the note stay clickable for Show to players.{' '}
            <Code>[!crawl]…[!/crawl]</Code> is an Opening crawl card.
          </>,
          <>
            <Code>[!legend]…[!/legend]</Code> is an Opening legend card (Classic, Light, Vampire).
          </>,
          <>
            <Code>[!gallery]…[!/gallery]</Code> is an image sequence on the player screen;{' '}
            <Code>[!video]…[!/video]</Code> plays a local clip; <Code>[!phone]…[!/phone]</Code> is an incoming-call
            overlay; <Code>[!hyperspace]…[!/hyperspace]</Code> is enter (starfield → tunnel → ship still) then exit
            (streaks, then a planet still).
          </>,
          <>
            <Code>[!pc]</Code> / <Code>[!npc]</Code> / <Code>[!monster]</Code> (and place, shop, faction, gear,
            spell) are sheet headers — portrait and facts for the sheet view. Close with <Code>[!/pc]</Code> etc.
          </>,
          <>
            <Code>[!party]…[!/party]</Code> is one list of PCs and companion NPCs. Read mode shows a live PC table
            (name, race, class, AC, HP, PP). Companions appear as links under the table — hover for their sheet.
            <Action>Edit</Action> → <Action>Add NPC…</Action> pulls from <Code>NPCs/</Code>. Right-click{' '}
            <Code>Party/</Code> for <Action>New party roster…</Action>.
          </>,
          <>
            <Code>[!scene]…[!/scene]</Code> wraps a beat (nested read-aloud / GM-only allowed). <Code>//</Code> line
            comments are editor-only.
          </>,
          <>
            Party / NPC / Bestiary sheets with a <Code>statblock</Code> fence open in sheet view: portrait and
            rollable block first, notes underneath. <Action>Add to combat</Action> sits on the block.
          </>,
          <>
            Map notes (<Code>```map</Code> fence) show <Action>Pan</Action> / <Action>Pin</Action> /{' '}
            <Action>Token</Action> / <Action>Fog</Action>. Extra controls open as a submenu. On Pan,{' '}
            <Action>Scale map</Action> — click two printed grid corners that are 5 ft (or another length) apart. Tokens snap to
            that grid. <Action>Line</Action> / <Action>Cone</Action> / <Action>Round</Action> / <Action>Square</Action> drop a feet-sized
            template (click origin, drag to aim; Round is a radius, Square is a cube). Esc clears. Templates are DM-only.
            Large/Huge stay 2×/3× a Medium token. Select a token and <Action>Add to combat</Action>. Shift+click
            to select more, then <Action>Add selected</Action>; <Action>Add all to combat</Action> takes every
            token on the map. <Action>Cnd</Action> on a linked token toggles the same conditions as the Combat
            panel.
          </>
        ]}
      />
      <p className="text-[12px] text-muted">
        Back: note header ←, <Code>Alt+←</Code>, or mouse back. Next: note header →, <Code>Alt+→</Code>, or mouse
        forward — next file in the same Files folder. Edits write straight to the campaign folder.
      </p>
    </>
  )
}
