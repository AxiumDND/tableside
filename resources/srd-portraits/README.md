# SRD monster portraits

Default D&D-fantasy portraits for every SRD 5.2.1 monster. Campaign files in `Bestiary/Art/` win if present.

Name each file exactly after the SRD monster (`Ghoul.webp`, `Will-o'-Wisp.webp`). WebP keeps the installer small; PNG/JPEG also work.

These are original generated illustrations, not official Wizards of the Coast art.

To recompress PNGs after adding art: `npm install --no-save sharp` then `node scripts/compress-srd-portraits.mjs`.
