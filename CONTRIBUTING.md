# Contributing

Thanks for helping with Tableside.

This is a **hobby** local dual-monitor DM tool. Pull requests that keep that
niche sharp are welcome. Changes that push toward online play, accounts, cloud
sync, or a full VTT may be closed — see [docs/ROADMAP.md](docs/ROADMAP.md).

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you change code

1. Read [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for setup, scripts, and where code lives. Use **Node.js 22+**.
2. Skim [docs/CAMPAIGN.md](docs/CAMPAIGN.md), [docs/MARKDOWN.md](docs/MARKDOWN.md), [docs/TABLE.md](docs/TABLE.md), and [docs/RECIPES.md](docs/RECIPES.md) if your change touches notes, combatants, images, Lookup, or folder names — authors rely on those contracts. Keep the in-app **Help** panel (`HelpPanel.tsx`) aligned with RECIPES when those flows change.
3. Keep book text out of the repo. Document formats in [Additional Books/README.md](Additional%20Books/README.md) only.
4. Prefer an issue before large work. Good starter ideas: [docs/ROADMAP.md](docs/ROADMAP.md#good-first-contributions).

```bash
npm ci
npm run typecheck
npm run lint
npm test
```

## Pull requests

- Prefer small, focused PRs.
- Run `npm run typecheck`, `npm run lint`, and `npm test` locally (CI also runs them). Use `npm run build` when you change packaging or want a smoke build; Windows CI builds the installer on `main`.
- Do not commit generated installer output under `dist/` or machine-specific paths.
- If you refresh SRD JSON with `npm run fetch-srd`, say so in the PR and keep [ATTRIBUTION.md](ATTRIBUTION.md) accurate.
- If behavior authors depend on changes, update the matching doc (and Templates HTML comments when sheet shape changes) in the same PR.

## Security

Report vulnerabilities privately — [SECURITY.md](SECURITY.md). Do not open a public issue for security problems.

## Docs map

| Doc | Role |
| --- | --- |
| [README.md](README.md) | Product overview, installer, and first-night video |
| [docs/GUIDE.md](docs/GUIDE.md) | DMs — first night at the table |
| [docs/TABLE.md](docs/TABLE.md) | Running a session in the UI |
| [docs/RECIPES.md](docs/RECIPES.md) | Game night sheet + Lookup save recipes |
| [docs/CAMPAIGN.md](docs/CAMPAIGN.md) | Campaign folder contract |
| [docs/MARKDOWN.md](docs/MARKDOWN.md) | Note / statblock syntax |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Near-term direction and starter tasks |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Contributor / architecture notes |
| [Additional Books/README.md](Additional%20Books/README.md) | Optional book-text Lookup files |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards |
| [SECURITY.md](SECURITY.md) | Private vulnerability reports |

Built-in sheet bodies live in `src/shared/sheetTemplates.ts`. Greystead may still keep a hidden `Templates/` copy; the file tree does not show that folder.
