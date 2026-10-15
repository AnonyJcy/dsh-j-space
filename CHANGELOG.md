# Changelog

## 1.2.4 — 2026-10-15

### Compatibility
- Targets DSH `0.2.1-alpha.3` with Cordis `4.0.5-alpha.2`. On this date, DSH's
  npm `alpha` tag is `0.2.1-alpha.3`, while `latest` remains `0.2.0-rc.2`;
  stable `0.2.1` is not published. Installation examples explicitly select the
  prerelease rather than treating `latest` as the newest alpha.
- Verified alpha.3 through fresh isolated native CLI installation of the npm
  tarball, real Loader activation of all 22 enabled preset rows, scoped skill
  discovery/body loading, and actual host Team services OFF/ON. Exact standard
  composition parity and official patch application pass with no composition
  warnings. No provider/model, real Team turns, browser, or scheduled-delivery
  end-to-end run is claimed; browser-only consumers remain intentionally pending
  in the headless smoke.
- A clean older npm `latest` (`0.2.0-rc.2`) lacks `dsh-tool-schedule` and fails
  complete preset activation. Upgrade explicitly to the validated alpha.3;
  this release does not claim compatibility with that older default composition.
- Adds official `time-context` and `tool-schedule` rows from the standard
  preset. Cordis peer compatibility must admit the actual host prerelease;
  targeting a version alone does not establish a successful runtime mount.

### Fixed
- Resolves the skill directory through installed package metadata from the native
  profile. DSH evaluates bundle `!!js` against the profile root, not the original
  bundle directory; treating it as bundle-relative silently hid the J-Space skill.
  Adds a separate-profile regression including spaces and URL-special characters.
- Aligns plan-mode approval wording with the actual alpha.3 standard preset.

### Changed
- **Official Agent Teams owns direct delegation.** Removes all preset-local
  subagent, fork, control, list-agents, disabled external-provider and Ralph
  rows from both bundle and legacy compositions. The official Team profile
  only disables top-level rows and cannot replace preset-local registrations.
- Keeps the official isolated workflow engine and tools for explicitly requested
  batch workflows; their one-shot children are not Team members.
- Preserves original J-Space cognition/orchestration evidence and applies an explicit
  DSH authority overlay. Local participant identities, bounds, reports and retirements
  are evidence protocol state, not a competing Team roster or execution lifecycle.
  Original second consideration and independent report acceptance remain required;
  xhigh without authorized available delegation needs a truthful solo limitation.
- Documents opt-in official Team installation, single-agent fallback, and reset
  of saved preset composition overrides. No automatic installation or host/profile
  migration; no subagent model-selection-settings dependency remains.
- Corrects README orchestration summaries: actual delegated evidence participants
  still require their own reads, second consideration and independent acceptance.
  Host Team ownership does not make these original cognitive gates optional.
- Replaces wrapper benchmark tables with two upstream report links and explicit
  author-reported/unverified limitations. No adaptation capability, speed or
  token-efficiency measurements are claimed; canonical upstream READMEs remain intact.
- Clarifies MIT wrapper / Apache-2.0 upstream licensing and separate third-party
  rights boundaries. Attribution or archival does not establish permission to redistribute.
- Distinguishes checkout-only development tests from the packaged integrity utility
  available to npm users.

### Full-fidelity upstream restoration and lossless source retention
- Pins official upstream commit b2023124a1fa08278e3ee82aefa8ed9faeade995.
  Restores all 13 full modules, seven references, induction/drills, examples,
  first-person operating frame, default high/xhigh controller, and original scripts.
  The 25 non-entry files are byte-identical; the entry has a removable authority block.
- Retains verbatim premise recurrence and scheduled full source reinjection, including
  unchanged bodies. Restores original evidence participant reads, round-two reports,
  independent exact-report acceptance, current dependencies, and original verifier.
  Supersedes the unpublished aggressive slimming and its incompatible test assertions.
- Adds a deterministic canonical compressed source archive, pinned hash manifest,
  bounded safe reconstruction, runtime/adapter boundary verification, and original
  upstream test fixtures. Compression concerns storage only, not prompt tokens or
  guaranteed cognitive performance; the extra provenance archive is not a net package
  size reduction claim. Retains Apache license and third-party materials notices.

### Added
- Parsed YAML regression tests covering bundle/legacy parity, platform shell
  selection, official tool defaults and absence of preset-local team controls.
- Python regressions for original cognition acceptance under official DSH authority;
  `test:controller`, `test:integrity`, `test:lossless` and `test:upstream` scripts.
- Optional read-only `test:host <host-node_modules>` check using the installed
  official YAML dialect and patch engine, including Team on/off and Cordis peer
  compatibility. It does not mount live Agents or change a profile.

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
