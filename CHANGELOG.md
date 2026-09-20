# Changelog

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
