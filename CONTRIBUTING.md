# Contributing

Thanks for helping with Tableside.

## Before you change code

1. Read [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for setup, scripts, and where code lives.
2. Skim [docs/CAMPAIGN.md](docs/CAMPAIGN.md), [docs/MARKDOWN.md](docs/MARKDOWN.md), [docs/TABLE.md](docs/TABLE.md), and [docs/RECIPES.md](docs/RECIPES.md) if your change touches notes, combatants, images, Lookup, or folder names — authors rely on those contracts. Keep the in-app **Help** panel (`HelpPanel.tsx`) aligned with RECIPES when those flows change.
3. Keep WOTC book text out of the repo. Document formats in [WOTC/README.md](WOTC/README.md) only.

## Pull requests

- Prefer small, focused PRs.
- Run `npm run build` locally (or rely on the Windows CI workflow).
- Do not commit generated installer output under `dist/` or machine-specific paths.
- If you refresh SRD JSON with `npm run fetch-srd`, say so in the PR and keep [ATTRIBUTION.md](ATTRIBUTION.md) accurate.
- If behavior authors depend on changes, update the matching doc (and Templates HTML comments when sheet shape changes) in the same PR.

## Docs map

| Doc | Role |
| --- | --- |
| [README.md](README.md) | Product overview + quick start |
| [docs/TABLE.md](docs/TABLE.md) | Running a session in the UI |
| [docs/RECIPES.md](docs/RECIPES.md) | Game night sheet + Lookup save recipes |
| [docs/CAMPAIGN.md](docs/CAMPAIGN.md) | Campaign folder contract |
| [docs/MARKDOWN.md](docs/MARKDOWN.md) | Note / statblock syntax |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Contributor / architecture notes |
| [WOTC/README.md](WOTC/README.md) | Optional book-text Lookup files |

Built-in sheet bodies live in `src/shared/sheetTemplates.ts` and are mirrored under `examples/bad-blood/Templates/` for the sample campaign.
