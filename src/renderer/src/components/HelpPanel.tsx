import { useEffect, useState, type ReactNode } from 'react'
import type { AppUpdateNotice } from '../../../shared/appUpdate'
import { THEME_BLURBS, THEME_IDS, THEME_LABELS, type ThemeId } from '../../../shared/theme'
import type { AppFolders } from '../../../shared/types'
import { APP_VERSION } from '../../../shared/version'
import type { CampaignCurrency } from '../../../shared/currencies'
import {
  DEFAULT_BOX_OF_DOOM_HOLD_MS,
  MAX_BOX_OF_DOOM_HOLD_MS,
  MIN_BOX_OF_DOOM_HOLD_MS,
  boxOfDoomHoldMs
} from '../../../shared/boxOfDoom'
import CurrenciesSettings from './CurrenciesSettings'

type HelpSection = 'settings' | 'start' | 'screens' | 'files' | 'music' | 'combat' | 'lookup' | 'keys' | 'updates'

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

function FolderOpen({
  label,
  path,
  onOpen
}: {
  label: string
  path: string
  onOpen: () => void
}) {
  return (
    <div className="space-y-1.5">
      <p>{label}</p>
      <p className="break-all">
        <Code>{path}</Code>
      </p>
      <button
        type="button"
        onClick={onOpen}
        className="rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
      >
        Open in File Explorer
      </button>
    </div>
  )
}

function ConvertGuideBlock({
  label,
  path,
  onOpen
}: {
  label: string
  path: string
  onOpen: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function copyToClipboard(): Promise<void> {
    const text = await window.tabledm.readConvertGuide()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-1.5">
      <p>{label}</p>
      <p className="break-all">
        <Code>{path}</Code>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyToClipboard()}
          className="rounded border border-amber/60 bg-amber/10 px-3 py-1.5 text-sm text-amber hover:border-amber"
        >
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
        >
          Open in File Explorer
        </button>
      </div>
    </div>
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

function Ul({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-4">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

export default function HelpPanel({
  updateNotice,
  onCheckUpdate,
  onStartUpdate,
  theme,
  onThemeChange,
  holoPortraits = false,
  onHoloPortraitsChange,
  digitalRain = false,
  onDigitalRainChange,
  hideNpcPortraits = false,
  onHideNpcPortraitsChange,
  currencies,
  onCurrenciesChange
}: {
  updateNotice?: AppUpdateNotice | null
  onCheckUpdate?: () => void
  onStartUpdate?: () => void
  theme?: ThemeId
  onThemeChange?: (theme: ThemeId) => void
  holoPortraits?: boolean
  onHoloPortraitsChange?: (enabled: boolean) => void
  digitalRain?: boolean
  onDigitalRainChange?: (enabled: boolean) => void
  hideNpcPortraits?: boolean
  onHideNpcPortraitsChange?: (hide: boolean) => void
  currencies?: CampaignCurrency[]
  onCurrenciesChange?: (currencies: CampaignCurrency[]) => void
}) {
  const [open, setOpen] = useState<HelpSection | null>('settings')
  const [folders, setFolders] = useState<AppFolders | null>(null)
  const [boxOfDoomHoldSec, setBoxOfDoomHoldSec] = useState(String(DEFAULT_BOX_OF_DOOM_HOLD_MS / 1000))

  function toggle(id: HelpSection): void {
    setOpen((prev) => (prev === id ? null : id))
  }

  useEffect(() => {
    void window.tabledm.getAppFolders().then(setFolders)
  }, [])

  useEffect(() => {
    void window.tabledm.getSettings().then((prefs) => {
      const sec = boxOfDoomHoldMs(prefs.boxOfDoomHoldSec) / 1000
      setBoxOfDoomHoldSec(String(sec))
    })
  }, [])

  function saveBoxOfDoomHoldSec(raw: string): void {
    const sec = boxOfDoomHoldMs(raw) / 1000
    setBoxOfDoomHoldSec(String(sec))
    void window.tabledm.saveSettings({ boxOfDoomHoldSec: sec })
  }

  return (
    <aside className="flex min-h-0 w-[400px] shrink-0 flex-col border-l border-line bg-ink">
      <header className="border-b border-line px-3 py-2">
        <h2 className="font-display text-lg text-amber">Help & settings</h2>
        <p className="mt-1 text-[11px] text-muted">
          Campaign look, dice fairness, and how to run the table. Click a heading to open it.
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <Section id="settings" title="Settings" open={open} onToggle={toggle}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Sub>Campaign look</Sub>
              <p>
                Saved with this folder. You can also set it when you create a campaign, or from <Code>Start Here</Code>.
                The player TV stays black.
              </p>
              {theme && onThemeChange ? (
                <ul className="space-y-2">
                  {THEME_IDS.map((id) => {
                    const selected = theme === id
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => onThemeChange(id)}
                          className={`w-full rounded border px-3 py-2 text-left ${
                            selected ? 'border-amber bg-amber/10' : 'border-line hover:border-amber'
                          }`}
                        >
                          <span className={`block text-sm font-semibold ${selected ? 'text-amber' : 'text-parchment'}`}>
                            {THEME_LABELS[id]}
                          </span>
                          <span className="mt-0.5 block text-[12px] leading-snug text-muted">{THEME_BLURBS[id]}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-muted">Open a campaign to choose a look.</p>
              )}
              {theme === 'scifi' && onHoloPortraitsChange ? (
                <label className="flex items-start gap-2 text-[13px] text-parchment/90">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={holoPortraits}
                    onChange={(event) => onHoloPortraitsChange(event.target.checked)}
                  />
                  <span>
                    <span className="font-semibold text-parchment">Hologram portraits</span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                      On by default for Sci-fi. Player, NPC, beast, and gear art as a projector plate. Places and maps
                      stay as-is.
                    </span>
                  </span>
                </label>
              ) : null}
              {theme === 'matrix' && onDigitalRainChange ? (
                <label className="flex items-start gap-2 text-[13px] text-parchment/90">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={digitalRain}
                    onChange={(event) => onDigitalRainChange(event.target.checked)}
                  />
                  <span>
                    <span className="font-semibold text-parchment">Falling code</span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                      On by default for Digital rain. Slow wallpaper in the file list and notes. Header stays clear.
                    </span>
                  </span>
                </label>
              ) : null}
            </div>

            <div className="space-y-2 border-t border-line/60 pt-4">
              <Sub>Treasure currencies</Sub>
              {onCurrenciesChange ? (
                <CurrenciesSettings currencies={currencies} onChange={onCurrenciesChange} />
              ) : (
                <p className="text-muted">Open a campaign to edit treasure currencies.</p>
              )}
            </div>

            <div className="space-y-2 border-t border-line/60 pt-4">
              <Sub>Artwork</Sub>
              <p className="text-[12px] leading-snug text-muted">
                Bundled artwork includes AI-generated NPC portrait picks in <Action>Tools → NPC</Action> and SRD
                monster, gear, and spell-school illustrations in Lookup and on sheets. Your own uploaded campaign art
                and stock place/shop art are not affected.
              </p>
              {onHideNpcPortraitsChange ? (
                <label className="flex items-start gap-2 text-[13px] text-parchment/90">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={hideNpcPortraits}
                    onChange={(event) => onHideNpcPortraitsChange(event.target.checked)}
                  />
                  <span>
                    <span className="font-semibold text-parchment">Hide bundled artwork</span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                      Hides bundled AI portrait picks, SRD illustrations in Lookup, and default portraits on
                      bestiary/gear/spell sheets that use bundled art. Turn off AI picks in Tools → NPC and skip bundled
                      art when creating new notes.
                    </span>
                  </span>
                </label>
              ) : null}
            </div>

            <div className="space-y-2 border-t border-line/60 pt-4">
              <Sub>Dice</Sub>
              <p>
                Every roll in Tableside — dice tray, Box of Doom, stat block chips, combat initiative, Lookup attack
                lines, and Improvise damage — uses one shared randomiser. Each face on a die has the same chance of
                coming up. Rolls use the system&apos;s standard unpredictable source; they are not seeded from names,
                turn order, or anything you typed.
              </p>
              <Ul
                items={[
                  <>
                    <strong>Dice tray</strong> — d4–d100 and custom expressions such as <Code>2d6+3</Code>.{' '}
                    <Action>Adv</Action> / <Action>Dis</Action> on a single d20 rolls two fair d20s and keeps the higher
                    or lower.
                  </>,
                  <>
                    <strong>Box of Doom</strong> — same fair d20(s). The tumbling faces before the reveal are cosmetic
                    only; they never change the result.
                  </>,
                  <>
                    <strong>Stat blocks & combat</strong> — to hit, saves, damage, and initiative d20s use the same
                    engine.
                  </>
                ]}
              />
              <p className="text-[12px] text-muted">
                Automated tests check that faces stay in range and that large samples match a fair distribution. There
                are no hidden rerolls or built-in bias toward players or the DM.
              </p>
              <label className="mt-2 block text-[13px] text-parchment/90">
                <span className="font-semibold text-parchment">Box of Doom — auto fade-out (seconds)</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                  How long Success or Failure stays on the player TV before fading back if you do not click{' '}
                  <Action>Fade out</Action>. Between {MIN_BOX_OF_DOOM_HOLD_MS / 1000} and{' '}
                  {MAX_BOX_OF_DOOM_HOLD_MS / 1000} seconds.
                </span>
                <input
                  type="number"
                  min={MIN_BOX_OF_DOOM_HOLD_MS / 1000}
                  max={MAX_BOX_OF_DOOM_HOLD_MS / 1000}
                  step={1}
                  value={boxOfDoomHoldSec}
                  onChange={(event) => setBoxOfDoomHoldSec(event.target.value)}
                  onBlur={() => saveBoxOfDoomHoldSec(boxOfDoomHoldSec)}
                  className="mt-2 w-full rounded border border-line bg-ink px-2 py-1.5 text-sm text-parchment outline-none focus:border-amber"
                />
              </label>
            </div>
          </div>
        </Section>
        <Section id="start" title="Quick start" open={open} onToggle={toggle}>
          <Ol
            items={[
              <>
                <Action>Open campaign</Action> picks any folder. <Action>Switch campaign</Action> jumps to another
                recent folder (name + path) when you run more than one game. <Action>New campaign</Action> asks which
                system to use (D&D 5e, Pathfinder 2e, or Vampire 5th), then which look (and hologram or falling-code if
                that look has them), then scaffolds Party, NPCs, Places,
                Factions, Maps, and the rest in an empty folder, with the hub note in <Code>Start Here</Code>. First
                launch with no folder opens the Greystead one-shot (5e); <Action>Sample</Action> loads that same copy.
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
                seconds. In a Sci-fi campaign,{' '}
                <Action>Play</Action> on an Opening crawl card sends that text to the player screen. While it runs,{' '}
                <Action>Stop</Action> fades to black over five seconds, fades out crawl music, and resumes the mood
                playlist.{' '}
                <Action>Clear</Action> on the <Action>Players see</Action> preview (or <Code>Alt+X</Code>) blanks the
                player screen.
              </>,
              <>
                Open <Action>Combat</Action> or <Action>Tools</Action> from the header when you need them. Dice live
                at the bottom of the left column.
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
        </Section>

        <Section id="updates" title="Updates" open={open} onToggle={toggle}>
          <p>
            Installed copies check GitHub at launch. If a newer Tableside exists, the app asks to install it.
            Nothing downloads until you press <Action>Install</Action>. Offline (at the table) the check is skipped
            and the app stays quiet.
          </p>
          <p className="text-[12px] text-muted">You are on {APP_VERSION}. Windows may still ask SmartScreen on the new installer — More info, then Run anyway.</p>
          {onCheckUpdate ? (
            <button
              type="button"
              onClick={onCheckUpdate}
              className="mt-2 rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
            >
              Check for updates
            </button>
          ) : null}
          {updateNotice?.kind === 'available' ? (
            <p className="mt-2 text-sm">
              Tableside {updateNotice.version} is available.{' '}
              {onStartUpdate ? (
                <button type="button" className="text-amber hover:underline" onClick={onStartUpdate}>
                  Update
                </button>
              ) : null}
            </p>
          ) : null}
          {updateNotice?.kind === 'current' ? (
            <p className="mt-2 text-sm text-muted">You already have the latest release.</p>
          ) : null}
          {updateNotice?.kind === 'offline' ? (
            <p className="mt-2 text-sm text-muted">Could not reach GitHub. Try again when you are online.</p>
          ) : null}
          {updateNotice?.kind === 'dev' ? (
            <p className="mt-2 text-sm text-muted">
              Update checks run in the installed app, not in <Code>npm run dev</Code>.
            </p>
          ) : null}
          {updateNotice?.kind === 'downloading' ? (
            <p className="mt-2 text-sm">Downloading {updateNotice.version}… {Math.round(updateNotice.percent)}%</p>
          ) : null}
          {updateNotice?.kind === 'failed' ? (
            <p className="mt-2 text-sm text-muted">Download failed. Try again when you are online.</p>
          ) : null}
        </Section>

        <Section id="screens" title="Layout & player screen" open={open} onToggle={toggle}>
          <Sub>This console</Sub>
          <Ul
            items={[
              <>
                Header: left and right panel icons, campaign name, New / Open, Tools, Combat, Music,{' '}
                <strong>Help & settings</strong>. Campaign look lives under Settings (also on <Code>Start Here</Code>).
                DM-only — the player TV stays black.
              </>,
              <>
                Left: <strong>Players see</strong> preview, file tree, dice tray — open by default. The panel icon at
                the left of the header hides it so notes get the full width; click it again to bring the sidebar back.
                Hide the preview if you need height inside the sidebar.
              </>,
              <>Center: the open note, image, or PDF.</>,
              <>Right: Combat, Music, Tools, or this panel — one at a time. The panel icon at the right of the
                header hides it; click it again to bring back the last tool. Tools holds Lookup, NPC, Improvise, Dice, Timer, and Links.</>
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
          <Sub>Blocks</Sub>
          <p>
            Special blocks use fences: <Code>[!scene] Title</Code> … <Code>[!/scene]</Code> (or <Code>[!end]</Code> for
            the innermost open block). Nest freely — blank lines are fine. Old quote-style <Code>{'> [!scene]'}</Code>{' '}
            notes still open. Whole-line <Code>//</Code> comments and <Code>{'<!-- … -->'}</Code> stay in the editor
            only; they never show in the reader.
          </p>
          <Sub>Opening crawl (Sci-fi)</Sub>
          <p>
            Put <Code>[!crawl] Title</Code> … <Code>[!/crawl]</Code> (or <Code>opening</Code>) in any note, then write the
            prologue inside. Edit the title, far-off line, emblem, crawl music, and crawl on the card. Optional <Code>preface:</Code> in the note
            also works (<Code>none</Code> skips it). <Code>![[your-mark.png]]</Code> replaces the generic emblem. Optional{' '}
            <Code>end: ![[planet.png]]</Code> (or <Action>End image</Action> on the card) fades in when the crawl finishes.
            Optional{' '}
            <Code>music: Audio/Music/…</Code> (or <Action>Load audio…</Action> into <Code>Audio/Music/Crawl/</Code>) — mood
            fades out on Play; the crawl track starts half a second before the emblem (silence through the far-off line) and
            runs for 1:32 — longer files fade out there — then mood resumes when the crawl ends or you Stop/Clear. <Action>Play</Action> is on when the campaign look is
            Sci-fi. The player screen and the <Action>Players see</Action> preview show a starfield, then the far-off line,
            the emblem, then a perspective title crawl — write your own words. Tableside does not include licensed crawl
            text, logos, or music files. <Action>Clear</Action> stops the picture and restores mood music.
          </p>
          <Sub>Opening legend (Classic, Light, Vampire)</Sub>
          <p>
            Put <Code>[!legend] Title</Code> … <Code>[!/legend]</Code> (or <Code>tale</Code> / <Code>chronicle</Code>)
            in any note for a campfire chronicle on the player screen. Pick a <Action>Look</Action> on the card (
            <Code>look: mist</Code>, <Code>embers</Code>, <Code>crimson</Code>, or <Code>neon</Code>) — mist for gothic
            fog, embers for campfire sparks, crimson for vampire, neon for cyber / sci-fi. Edit title (DM label), body,
            optional <Code>music:</Code>, and optional <Code>end:</Code> still. <Action>Play</Action> is on when the
            campaign look is Classic, Light, or Vampire. Mood and music timing match the Sci-fi crawl (1:32 sync).{' '}
            <Action>Stop</Action> fades to black and resumes mood.
          </p>
          <Sub>Gallery</Sub>
          <p>
            Put <Code>[!gallery] Title</Code> … <Code>[!/gallery]</Code> (or <Code>slides</Code> / <Code>sequence</Code>)
            with image embeds inside. <Action>Play</Action> shows them on the player screen; <Action>Prev</Action> /{' '}
            <Action>Next</Action> advance manually. Optional <Code>interval: 8s</Code> auto-advances. Loop defaults on;
            set <Code>loop: false</Code> or untick to stop at the end. Title stays off the player unless you tick{' '}
            <Action>Show title on player</Action> (<Code>showTitle: true</Code>). Slide counts stay on the DM card only.
            Works on every campaign look.
          </p>
          <Sub>Video</Sub>
          <p>
            Put <Code>[!video] Title</Code> … <Code>[!/video]</Code> (or <Code>clip</Code> / <Code>film</Code>) with a
            local <Code>![[clip.mp4]]</Code> (mp4 / webm / mov). <Action>Play</Action> sends it to the player screen.
            Optional <Code>mute: true</Code> keeps mood music; otherwise mood fades while the clip has sound.
          </p>
          <Sub>Phone call</Sub>
          <p>
            Put <Code>[!phone]</Code> … <Code>[!/phone]</Code> (or <Code>call</Code> / <Code>incoming</Code>) and pick an
            NPC on the card — or write <Code>[[NPC Name]]</Code>. <Action>Play</Action> rings on the player screen, then
            fades in an iPhone-style handset using that sheet’s name and portrait. <Action>Answer</Action> silences the
            ring; <Action>Hang up</Action> fades it out. Optional <Code>ring: ![[tone.mp3]]</Code> uses campaign audio;
            otherwise Tableside plays a built-in dual-tone ring (not a licensed phone ringtone). Works on every campaign
            look.
          </p>
          <Sub>Hyperspace</Sub>
          <p>
            Put <Code>[!hyperspace] Jump to Alderaan</Code> … <Code>[!/hyperspace]</Code> (or <Code>jump</Code> /{' '}
            <Code>lightspeed</Code>) with optional <Code>ship: ![[falcon.png]]</Code> and{' '}
            <Code>planet: ![[alderaan.png]]</Code>. Until you pick art, Tableside uses a generic ship and planet.{' '}
            <Action>Enter hyperspace</Action> holds a starfield, fades in the same streak tunnel as exit, then holds a
            fullscreen ship still. Optional <Code>enter:</Code> (once), <Code>loop:</Code> (while the ship is up), and{' '}
            <Code>exit:</Code> (once) pick campaign audio under <Code>Audio/Sfx</Code>. <Action>Exit hyperspace</Action>{' '}
            fades the streak lines in, then the planet still.{' '}
            <Action>Abort</Action> drops the overlay without arriving. Tableside draws an original starfield and streaks —
            it does not include licensed Star Wars footage.
          </p>
        </Section>

        <Section id="music" title="Music & sound" open={open} onToggle={toggle}>
          <p>
            <Action>Music</Action> is a table mixer: one music playlist, one looping ambience bed, and a soundboard of
            one-shots. Each strip has its own volume. Pick an <strong>Output</strong> (laptop speakers, HDMI TV, headset)
            — the mix uses that device whether the player view is open or closed. Music and ambience fade in and out
            over five seconds. <Action>Stop all</Action> fades both.
          </p>
          <Sub>Folders</Sub>
          <Ul
            items={[
              <>
                <Code>Audio/Music/Combat</Code>, <Code>Creepy</Code>, <Code>General</Code> — mood playlists. Extra
                folders become extra moods. Pick a mood, then <Action>Play</Action>,{' '}
                <Action>Pause</Action>, or <Action>Stop</Action>. <Action>In order</Action> or{' '}
                <Action>Shuffle</Action> stays in that mood.
              </>,
              <>
                <Code>Audio/Ambience</Code> — looping beds (crowd, rain). One at a time.
              </>,
              <>
                <Code>Audio/Sfx</Code> — clickable one-shots. Subfolders become headings. Bundled{' '}
                <Action>Dice (one)</Action>, <Action>Dice (two)</Action>, and <Action>Dice (handful)</Action> sit on
                the board even with no campaign files.
              </>
            ]}
          />
          <p className="text-[12px] text-muted">
            Drop files you own into those three folders, or use <Action>Add audio…</Action> on each strip. Files sitting
            in <Code>Audio/</Code> itself are ignored. Tableside does not include music.{' '}
            <Action>Clear</Action> on the player picture does not stop the mix — use <Action>Stop all</Action>. With{' '}
            <Action>Combat music</Action> ticked on the Combat panel, <Action>Start combat</Action> plays the Combat
            playlist and <Action>End combat</Action> returns to General.
          </p>
        </Section>

        <Section id="files" title="Files, notes & maps" open={open} onToggle={toggle}>
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
                Click a note, image, or PDF to open it. Folders start collapsed; the open file’s folder expands so you
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
                Large/Huge stay 2×/3× a Medium token.
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
                the pack) on that PC, NPC, or monster. The name opens that combatant’s rollable statblock without
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
        </Section>

        <Section id="lookup" title="Lookup" open={open} onToggle={toggle}>
          <p>
            Offline search of the <strong>open campaign’s system pack</strong>. D&D 5e uses the bundled SRD 5.2.1
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
            hourglass over the player TV. <Action>Start</Action> begins the countdown. Pause, resume, or reset;{' '}
            <Action>Fade out</Action> returns to the picture underneath. The empty glass holds at zero until you fade
            it. Uncheck <Action>Chime at zero</Action> to skip the Music Sfx hit. Not saved to the campaign.
          </p>
        </Section>

        <Section id="keys" title="Dice & shortcuts" open={open} onToggle={toggle}>
          <Sub>Dice tray</Sub>
          <p>
            Bottom of the left column: d4–d100 plus a custom expression such as <Code>2d6+3</Code>. Use{' '}
            <Action>Adv</Action> or <Action>Dis</Action> for d20 rolls. Uncheck <Action>Show rolls to players</Action>{' '}
            to keep tray and statblock rolls off the player TV; uncheck <Action>Play roll sound</Action> to mute the
            clatter (one die, two dice, and a handful each have their own recording). Rolls feed the same log as combat and statblock clicks — a strip fades in on the right side of the
            player screen for about 15 seconds, then fades out. In 5e campaigns, damage chips on statblocks also offer{' '}
            <Action>Crit</Action> (double the dice).
          </p>
          <Sub>Box of Doom</Sub>
          <p>
            <Action>Tools</Action> → <Action>Dice</Action>: set DC and modifier, pick Normal, Advantage, or
            Disadvantage. <Action>Show</Action> fades the check over whatever is on the player TV;{' '}
            <Action>Roll</Action> tumbles (cosmetic), then holds Success or Failure until you click{' '}
            <Action>Fade out</Action> or the auto fade-out timer in <strong>Settings</strong> runs. A natural 20 always
            succeeds; a natural 1 always fails. The clatter plays as the dice land. Uncheck{' '}
            <Action>Play sound on Roll</Action> to skip it (same one-die / two-die recordings as the tray).
          </p>
          <Sub>Timer</Sub>
          <p>
            <Action>Tools</Action> → <Action>Timer</Action>: <Action>Show</Action> puts a full glass on the TV; a
            separate <Action>Start</Action> begins the sand. Last 30 seconds warm toward blood-red. Zero holds until{' '}
            <Action>Fade out</Action>. Header <Action>Clear</Action> / <Code>Alt+X</Code> takes it with the rest of the
            player screen.
          </p>
          <Sub>Shortcuts</Sub>
          <Ul
            items={[
              <>
                <Code>Alt+←</Code> or mouse back — previous note
              </>,
              <>
                <Code>Alt+→</Code> or mouse forward — next file in the same folder
              </>,
              <>
                <Code>Alt+S</Code> — Show selected art to players
              </>,
              <>
                <Code>Alt+I</Code> — Show item / place / spell details to players (hold <Code>Shift</Code> to include
                GM-only notes)
              </>,
              <>
                <Code>Alt+X</Code> — Clear player screen
              </>,
              <>
                <Code>Alt+T</Code> — Next combat turn
              </>,
              <>
                While editing: <Code>Ctrl+S</Code> save, <Code>Esc</Code> cancel (prompts if unsaved). Right-click a
                misspelled word for suggestions.
              </>,
              <>
                <Code>Esc</Code> also dismisses confirm dialogs, and hides Files search after clearing it
              </>
            ]}
          />
          <p className="text-[12px] text-muted">
            After the session, combat stays in <Code>combat.json</Code> until you clear it. Keep lasting work in your
            own campaign folder. <Action>Sample</Action> copies Greystead into user data; Tableside refreshes it when the
            bundled <Code>sampleRevision</Code> is newer. Delete <Code>samples\greystead</Code> and click Sample to
            force a refresh.
          </p>
        </Section>
      </div>
      <footer className="border-t border-line px-3 py-2 text-[11px] leading-relaxed text-muted">
        Built by one GM.{' '}
        <a href="mailto:tableside.gm@gmail.com" className="text-amber underline hover:text-amber-dim">
          tableside.gm@gmail.com
        </a>
        . If it helped at your table, you can{' '}
        <a
          href="https://ko-fi.com/tablesidegm"
          target="_blank"
          rel="noreferrer"
          className="text-amber underline hover:text-amber-dim"
        >
          buy me a coffee
        </a>
        .
      </footer>
    </aside>
  )
}
