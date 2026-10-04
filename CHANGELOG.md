# Changelog

## 1.2.3

### Fixed
- The legacy standalone Cordis plugin now performs deployment during async
  plugin application instead of waiting for `ready`, which Cordis 4.0.2 does
  not emit. Deployment also works when mounted into an already active host.
  This deploys legacy files only; DSH 0.2.0 preset registration still comes
  from the bundle patch, which is unchanged.
- Added the missing `@types/node` development dependency so TypeScript can
  resolve Node built-ins and `process` without relying on host dependencies.

### Added
- `pnpm run typecheck` runs `tsc --noEmit`.
- Five regression tests using a real Cordis context and temporary filesystem
  cover initial and late mounting, `autoDeploy: false`, preservation of an
  existing preset, and deployment-error logging.

## 1.2.2 — 2026-09-30

### Fixed
- `tool-ralph` now restates `disabled: true`, matching the shipped `standard`
  preset (where `dsh-base` keeps ralph off). This composition had left it
  enabled since the 0.1.x era; parity is now explicit.
- `tool-web` enables `fetch`, so the preset exposes `web_fetch` alongside
  `web_search`. It previously set `fetch: false`, which registered
  `web_search` only and switched the search guidance to snippets-only. The
  other shipped presets (`standard`, `ptc`, `cordis`) all keep `fetch: true`.

### Note
- Field-level parity with `standard` is now: composition identical except two
  deliberate differences — this preset's persona prefix names the J-Space
  Cognition Suite, and `skill-filesystem` adds its own `preset/skills/` root.

## 1.2.1 — 2026-09-30

### Added
- Full row parity with the shipped `standard` preset. The composition was missing
  three rows, so this preset offered strictly fewer capabilities than the default:
  - `command-goal` — the `/goal` slash command (create/edit/pause/resume/clear the
    current goal from the UI).
  - `present` — the `present` tool that declares final deliverables so the user can
    open them in their default application.
  - `tool-plugin-manager` — the `plugin_manager` tool row. Shipped `disabled: true`
    in `dsh-base` and restated here, exactly as `standard` does.
- `modelSelectionSettings: true` on the `tool-subagent` row, restoring the ability
  to choose a child subagent's `provider`/`model`/`reasoning_effort` and to use the
  `list_subagent_models` tool.

### Note
- `modelSelectionSettings: true` requires the Host to compose
  `@deepseek-ai/dsh-tool-subagent/model-selection-settings`, which the **web-app
  bundle** supplies. A host without that row (e.g. a bare headless profile) fails
  this mount rather than silently downgrading.

## 1.2.0 — 2026-09-30

### Changed
- **DSH 0.2.0 preset contract.** `cordis.patch.yml` now declares the `j-space`
  preset directly as one `@deepseek-ai/dsh-agent-preset` row, the way the shipped
  presets (`@deepseek-ai/dsh-web-app/presets/*.patch.yml`) do. Since DSH 0.1.7
  nothing scans `$DSH_HOME/.agent-presets/`, so the previous shape of this file —
  a row that only mounted the deployer plugin — no longer registered any preset.
- The preset composition previously in `preset/agent.cordis.yml` is inlined into
  that declaration (a preset row is the contract; a bundle cannot reference a
  sibling file). `customSkillDirs` resolves `preset/skills/` relative to this
  patch's own directory via `baseUrl`, so the suite travels with the package and
  needs neither an absolute path nor a deploy step.

### Retained
- `src/`, `bin/dsh-j-space` and `preset/agent.cordis.yml` remain available for the
  legacy `$DSH_HOME/.agent-presets/` deployment. They are no longer how the preset
  is registered.

## 1.1.2 — 2026-09-23

### Changed
- Documented DSH's host-specific, model-selectable subagent setup without bundling provider or model IDs.
- Removed local DSH screenshots that exposed workspace labels from the public repository and package source.

## 1.1.1 — 2026-09-20

### Added
- Added standard DSH bundle manifest (`dsh.bundle.patch`) and `cordis.patch.yml` to support native `dsh plugin add @anonyjcy/dsh-j-space` installation.
- Compliant with `awesome-dsh-plugin` and `deepseek1024.com` standard registry specifications.

## 1.1.0 — 2026-09-20

### Synced
- Synced full skill suite from upstream [`Tiger3807861189/J-Space-Cognition-Suite`](https://github.com/Tiger3807861189/J-Space-Cognition-Suite) release `SV1` (`b202312`):
  - Added 4 new cognitive & engineering modules: `cyber.md`, `epistemics.md`, `orchestration.md`, `repository.md` (13 modules total).
  - Added 3 new references: `controller.md`, `engineering-evidence.md`, `host-integration.md`.
  - Added persistent controller `control.py` and portable host adapter `host_bridge.py`.
  - Updated entry `SKILL.md` (new 4-level gate: `low`, `medium`, `high`, `xhigh`, and persistent loop control).
  - Updated `jspace.py`, `workspace-ledger.md`, and authoring-time integrity verifier `verify_suite.py`.

### Changed
- Updated preset verification checklist in `src/installer.ts` and `bin/cli.js` to ensure SV1 controller scripts (`control.py`, `host_bridge.py`) are validated on install and health check.
- Updated preset descriptions and persona architecture to `J-Space Cognition Suite SV1`.
- Cleaned up local `tsconfig.json` for standalone builds and tests without external mono-repo dependencies.
- Updated `@deepseek-ai/cordis` devDependency to `^4.0.0` to match DSH host runtime.

## 1.0.3 — 2026-09-20

### Fixed
- Use `dsh-workflow-ptc` (`provider: spawn`) in `preset/agent.cordis.yml`.
- DSH **0.1.6** removed `dsh-workflow-worker-thread`; j-space failed to mount without this update.

### Compatibility
- Target host: DSH **0.1.6-alpha.2+** (workflow stack rename).

## 1.0.2 — 2026-09-12
- DSH 0.1.5 `dsh-persona` schema adaptation (`config.prefix` / `config.suffix`).
- Synced skills from upstream V3.7 @ `988d07b8`.

## 1.0.1
- Prior npm/GitHub release before DSH 0.1.5 adaptation.
