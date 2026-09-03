# NPC portrait art (Tools → NPC)

Bundled portrait picks for quick NPC creation. Files are served at `tabledm://npc-portrait/`.

## Layout

```
npc-portraits/
  human/
    feminine/
      01.webp … 08.webp
    masculine/
      01.webp … 08.webp
  elf/
    …
```

Each **race** folder matches the Tools → NPC race list (`human`, `elf`, `dwarf`, `halfling`, `gnome`, `goblin`, `orc`, `tiefling`, `dragonborn`, `leshy`, `other`).

Each **gender** folder holds **eight** numbered portraits (`01`–`08`). The panel shows four at a time; **Reroll portraits** draws another four from the pool.

Supported formats: `.webp`, `.png`, `.jpg`, `.svg` (same stem, e.g. `03.webp`). Prefer **WebP**.

## Look

All portraits use the same plain warm beige studio backdrop (`#d8d0c4`) so picks feel consistent at the table. Style is soft painterly D&D fantasy illustration, chest-up bust framing.

Generated source PNGs land in the Cursor assets folder as `npc-{race}-{gender}-{NN}.png`. Install into the tree with:

```bash
node scripts/install-npc-portraits.mjs
```

That resizes to 768×1024 WebP and removes any matching SVG placeholder.

Regenerate SVG stand-ins only (if a race is missing art):

```bash
node scripts/generate-npc-portrait-placeholders.mjs
```

## Player-facing note

These are optional DM aids. Users can tick **Hide portrait picks** in Tools → NPC to turn the gallery off.
