# Bundled dice roll sounds

Drop your recordings here. Tableside plays them on **Roll** (tray, statblocks, Box of Doom) and on the Music soundboard chips **Dice (one)** / **Dice (handful)**. Until a file is present, the app keeps the synthesized clatter.

## Files

| File stem | When it plays |
| --- | --- |
| `dice-one` | One die (`1d20`, `1d6`, …) |
| `dice-handful` | Two or more dice (`2d6+3`, advantage, a handful) |

Put the files in this folder (not in a campaign `Audio/` folder):

```
resources/dice-sfx/dice-one.wav
resources/dice-sfx/dice-handful.wav
```

Same stem, other formats also work: `.mp3` `.ogg` `.m4a` `.flac` `.webm` `.aac`. Prefer a short **WAV** or **MP3** (about 0.3–1.5s for one die, about 0.8–2.5s for a handful). Keep them dry — the mixer already has an Sfx fader.

These ship in the installer via `extraResources` (`dice-sfx/`).
