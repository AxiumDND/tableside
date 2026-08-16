import { existsSync } from 'node:fs'
import { cp, mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..')
const examples = join(repo, 'examples')
const src = join(examples, 'Bad Blood — A Barovia Three-Shot')
const dest = join(examples, 'bad-blood')
const vault = join(
  process.env.USERPROFILE ?? '',
  'Documents',
  'Vaults',
  'Forge',
  'RPG',
  'D&D',
  '2. One Shots',
  'Bad Blood — A Barovia Three-Shot'
)

async function ensure(dir) {
  await mkdir(dir, { recursive: true })
}

async function move(from, to) {
  if (!existsSync(from)) return
  await ensure(dirname(to))
  if (existsSync(to)) {
    const st = await readdir(from).catch(() => null)
    if (st) {
      for (const name of st) {
        await move(join(from, name), join(to, name))
      }
      await rm(from, { recursive: true, force: true })
      return
    }
  }
  await rename(from, to)
}

async function copyDir(from, to) {
  if (!existsSync(from)) return 0
  await cp(from, to, { recursive: true, force: false })
  return 1
}

const root = existsSync(src) ? src : dest
if (!existsSync(root)) {
  console.error('Could not find Bad Blood example at', src)
  process.exit(1)
}

if (existsSync(join(root, '.git'))) {
  await rm(join(root, '.git'), { recursive: true, force: true })
  console.log('Removed nested .git')
}

await ensure(join(root, 'Archive', 'Play'))
await ensure(join(root, 'Archive', 'Drafts'))
await ensure(join(root, 'Reference'))
await ensure(join(root, 'Sessions'))

await move(join(root, "NPC's"), join(root, 'NPCs'))
await move(join(root, 'The Party'), join(root, 'Party'))
await move(join(root, 'Handouts & Props'), join(root, 'Handouts'))
await move(join(root, 'Z_archive'), join(root, 'Archive', 'Drafts'))
await move(join(root, '_archive'), join(root, 'Archive', 'Drafts'))

await move(join(root, '_Claude Context.md'), join(root, 'Archive', '_Claude Context.md'))
await move(
  join(root, 'Bad Blood — What Next (Ideas & Reusable Assets).md'),
  join(root, 'Archive', 'Bad Blood — What Next (Ideas & Reusable Assets).md')
)
await move(join(root, 'Tracker — Bad Blood.md'), join(root, 'Reference', 'Tracker — Bad Blood.md'))
await move(
  join(root, 'Bad Blood — Arc Conclusion & Continuity.md'),
  join(root, 'Reference', 'Bad Blood — Arc Conclusion & Continuity.md')
)
await move(
  join(root, 'Reference', 'Midjourney Prompt List.md'),
  join(root, 'Archive', 'Midjourney Prompt List.md')
)

const sessions = join(root, 'Sessions')
if (existsSync(sessions)) {
  for (const name of await readdir(sessions)) {
    const lower = name.toLowerCase()
    if (/actual play|whatsapp|transcript|trascript/.test(lower)) {
      await move(join(sessions, name), join(root, 'Archive', 'Play', name))
    }
  }
}

await writeFile(
  join(root, 'campaign.json'),
  `${JSON.stringify({ name: 'Bad Blood — A Barovia Three-Shot' }, null, 2)}\n`
)

await writeFile(
  join(root, 'README.md'),
  `# Bad Blood — Table DM campaign

Open this folder in Table DM (or click **Sample**).

## Folder layout

- **Sessions/** — run guides and night sheets (use these at the table)
- **Party/** — PC sheets; Combat always loads everyone here
- **NPCs/** — named characters with portraits and statblocks
- **Bestiary/** — creatures
- **Handouts/** — letters and props to show players
- **Maps/** · **Scenes/** · **Portraits/** — art for the player screen
- **Reference/** — tracker, locations, cheat sheets
- **Archive/** — recaps, transcripts, old drafts (keep closed)

Wikilinks still resolve by note name after a move. Portraits are \`![[Name.png]]\`.
`
)

if (existsSync(vault)) {
  await copyDir(join(vault, 'Assets', 'Portraits'), join(root, 'Portraits'))
  await copyDir(join(vault, 'Assets', 'Scenes'), join(root, 'Scenes'))
  await copyDir(join(vault, 'Assets', 'Maps'), join(root, 'Maps'))
  await copyDir(join(vault, 'Maps'), join(root, 'Maps'))
  console.log('Copied art from vault (if those folders existed)')
}

if (root !== dest) {
  if (existsSync(dest)) await rm(dest, { recursive: true, force: true })
  await rename(root, dest)
  console.log('Renamed example to examples/bad-blood')
}

console.log('Done.')
