import { Action, Code, Ol, Sub, Ul } from './HelpComponents'

export function ScreensSection() {
  return (
    <>
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
        campaign look is Classic, Light, or Vampire. Mood and music timing match the Sci-fi crawl (1:32 sync). After
        the tale ends (or you <Action>Stop</Action>), Combat <Action>Show to players</Action> can overlay initiative
        on that still. <Action>Stop</Action> fades the chronicle and resumes mood.
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
        fades in an iPhone-style handset using that sheet's name and portrait. <Action>Answer</Action> silences the
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
    </>
  )
}
