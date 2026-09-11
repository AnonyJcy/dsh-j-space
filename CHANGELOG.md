# Changelog

## 1.0.2 — 2026-09-12

### Fixed
- Adapt `preset/agent.cordis.yml` persona config to DSH **0.1.5** `dsh-persona` schema:
  - replaced invalid `config.text` with required `config.prefix` and optional `config.suffix`
  - without this, preset mount fails with `$.prefix missing required value`

### Synced
- Refreshed embedded J-Space skills from upstream
  [`Tiger3807861189/J-Space-Cognition-Suite-V3.7`](https://github.com/Tiger3807861189/J-Space-Cognition-Suite-V3.7)
  @ `988d07b8` (`v3.7.4` line):
  - `SKILL.md`
  - `modules/capacity.md`
  - `modules/deep-reasoning.md`
  - `modules/shorthand.md`
  - `references/j-space-science.md`
  - `scripts/jspace.py`
  - `scripts/workspace-ledger.md`
- Verified plugin `preset/skills/j-space` matches upstream 17/17 files

### Docs
- README notes DSH 0.1.5 compatibility
- This changelog

### Publish
- npm: `@anonyjcy/dsh-plugin-j-space@1.0.2` (`latest`)
- git: `main` @ `c210723` (and related docs/prefix commits)

## 1.0.1
- Prior npm/GitHub release before DSH 0.1.5 adaptation.
