# Contributing

Thanks for helping with Table DM.

## Before you change code

1. Read [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for setup, scripts, and repo layout.
2. Skim [docs/CAMPAIGN.md](docs/CAMPAIGN.md) if your change touches notes, combatants, images, or folder names — authors rely on that contract.
3. Keep WOTC book text out of the repo. Document formats in [WOTC/README.md](WOTC/README.md) only.

## Pull requests

- Prefer small, focused PRs.
- Run `npm run build` locally (or rely on the Windows CI workflow).
- Do not commit generated installer output under `dist/` or machine-specific paths.
- If you refresh SRD JSON with `npm run fetch-srd`, say so in the PR and keep [ATTRIBUTION.md](ATTRIBUTION.md) accurate.

## Docs

User-facing behavior belongs in [README.md](README.md) and [docs/CAMPAIGN.md](docs/CAMPAIGN.md). Contributor / architecture notes belong in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).
