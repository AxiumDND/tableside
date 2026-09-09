import { Action, Code, Sub, Ul } from './HelpComponents'

export function KeysSection() {
  return (
    <>
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
    </>
  )
}
