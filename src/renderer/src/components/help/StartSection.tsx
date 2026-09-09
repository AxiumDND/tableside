import type { AppFolders } from '../../../../shared/types'
import { Action, Code, Ol, Sub } from './HelpComponents'
import { ConvertGuideBlock } from './HelpFolderComponents'

export function StartSection({ folders }: { folders: AppFolders | null }) {
  return (
    <>
      <Ol
        items={[
          <>
            <Action>Campaign</Action> is one header menu: recent folders (name + path, not the one already open),
            then <Action>Open campaign…</Action> and <Action>New campaign…</Action>. Open picks any folder. New asks
            which
            system to use (D&D 5e, Pathfinder 2e, or Vampire 5th), then which look (and hologram or falling-code if
            that look has them), then scaffolds Party, NPCs, Places,
            Factions, Maps, and the rest in an empty folder, with the hub note in <Code>Start Here</Code>. First
            launch with no folder opens the Greystead one-shot (5e); <Action>Sample</Action> on the empty start
            screen loads that same copy.
            Open <Code>Start Here</Code> first — the campaign look is there too. Changing system on an existing
            folder is not supported — start a new campaign instead.
          </>,
          <>
            This DM console always opens. The fullscreen <strong>player</strong> window stays hidden until a second
            monitor is connected, then it appears there. <Action>Close</Action> on the{' '}
            <Action>Players see</Action> preview shuts it until you pick a monitor or{' '}
            <Action>Show to players</Action>. Click the preview to pick the TV. Unplug the second screen and the
            player view hides again.
          </>,
          <>
            Click a map or portrait in a note so it is selected, then <Action>Show to players</Action> (or{' '}
            <Code>Alt+S</Code>). On Gear, Spells, Places, and Factions, use <Action>Show art to players</Action> for
            the picture only, or <Action>Show item to players</Action> for art plus details (
            <Code>Alt+I</Code>; hold <Code>Shift</Code> to include GM-only notes). It fades in over about five
            seconds and fits the TV with a little padding (Help & settings → Settings → Picture padding). In a Sci-fi campaign,{' '}
            <Action>Play</Action> on an Opening crawl card sends that text to the player screen. While it runs,{' '}
            <Action>Stop</Action> fades to black over five seconds, fades out crawl music, and resumes the mood
            playlist.{' '}
            <Action>Clear</Action> on the <Action>Players see</Action> preview (or <Code>Alt+X</Code>) blanks the
            player screen.
          </>,
          <>
            Open <Action>Combat</Action> or <Action>Tools</Action> from the header when you need them. Under the
            header, <Action>Quick</Action> links hold <Action>Party</Action> (name, AC, save DC, passive
            perception), <Action>Conditions</Action>, and <Action>Calendar</Action> notes in{' '}
            <Code>Reference/</Code>. Dice live at the bottom of the left column.
          </>
        ]}
      />
      <p className="text-[12px] text-muted">
        Built for the laptop at your physical table — not a full VTT for online play. There is no account and no
        internet at the table. Notes are ordinary Markdown on disk (Obsidian-friendly). A two-minute first-night
        walkthrough is on the GitHub README.
      </p>
      <Sub>Convert a vault</Sub>
      <p>
        Hand <Code>AI-CAMPAIGN.md</Code> to an agent converting Obsidian notes or a folder of Markdown into a
        Tableside campaign. <Action>Copy to clipboard</Action> below to paste into ChatGPT, Cursor, or Claude — or
        open the file from the folder.
      </p>
      {folders?.convertGuidePath ? (
        <ConvertGuideBlock
          label="Conversion spec:"
          path={folders.convertGuidePath}
          onOpen={() => void window.tabledm.openAppFolder('convert')}
        />
      ) : null}
    </>
  )
}
