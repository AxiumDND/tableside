import { Action, Code, Sub, Ul } from './HelpComponents'

export function MusicSection() {
  return (
    <>
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
            <Action>Dice (one)</Action>, <Action>Dice (two)</Action>, <Action>Dice (handful)</Action>, and{' '}
            <Action>Hourglass</Action> sit on the board even with no campaign files. The timer chime uses that
            same Sfx layer.
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
    </>
  )
}
