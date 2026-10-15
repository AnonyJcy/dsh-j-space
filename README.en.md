# dsh-j-space

[![DSH Market Listed](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-zh.svg)](https://dsh.market/?q=AnonyJcy%2Fdsh-j-space)
[![npm](https://img.shields.io/npm/v/@anonyjcy/dsh-j-space.svg?color=blue)](https://www.npmjs.com/package/@anonyjcy/dsh-j-space)
[![license](https://img.shields.io/badge/license-MIT%20%2B%20Apache--2.0-green.svg)](<NOTICE.md>)

[简体中文](<README.md>) | **English**

Use [J-Space Cognition Suite](https://github.com/Tiger3807861189/J-Space-Cognition-Suite) in DeepSeek Harness. Install the package, then choose **J-Space Cognition Suite** when creating a session.

J-Space provides workflows for breaking down problems, exploring repositories, keeping task notes, and checking results. This package brings those workflows to DSH without replacing the original modules, controller, or workspace ledger. Models, tools, and permissions come from DSH; collaboration uses its official Agent Teams plugin.

The upstream project maintains J-Space itself. This repository maintains the DSH integration.

## Install

Version 1.2.4 was tested with **DSH 0.2.1-alpha.3 / Cordis 4.0.5-alpha.2**. The commands below pin that DSH version rather than relying on npm tags. The older `0.2.0-rc.2` is missing a required scheduling tool and cannot fully load this preset, so upgrade first if you use it.

```bash
# Skip this if you already run the matching DSH version
npm install -g @deepseek-ai/dsh@0.2.1-alpha.3

dsh plugin --profile web add @anonyjcy/dsh-j-space@1.2.4
```

For an existing deployment, upgrade the installation that actually starts your DSH process and back up custom settings first. Replace `web` with your profile name if needed.

Restart DSH Web, create a session, and select **J-Space Cognition Suite** under **Agent Preset**. Installing the npm package in an ordinary project does not register it with DSH. There is no additional legacy `install` step.

The original controller and verification scripts require **Python 3.10+**.

<details>
<summary>Install from a local checkout</summary>

```bash
git clone https://github.com/AnonyJcy/dsh-j-space.git
cd dsh-j-space
dsh plugin --profile web add "$PWD"
```

DSH registers the preset through the [bundle configuration](<cordis.patch.yml>) and reads the [packaged skills](<preset/skills/j-space/>) directly. No manual copying is needed.

</details>

## Using Agent Teams

To use teams, install the official plugin in the same profile:

```bash
dsh plugin --profile web add @deepseek-ai/dsh-experimental-agent-team-profile@0.2.1-alpha.3
```

The official plugin handles members, messages, task assignments, and member lifecycle. The J-Space preset no longer registers its own `subagent`, `fork`, or member-control tools. It does not enable teams automatically: creating a team requires an explicit user request. You can also use J-Space with a single agent.

The original [orchestration module](<preset/skills/j-space/modules/orchestration.md>) stays in place. It records work and review evidence, rather than managing a second team. Participants still need their own source reads, second consideration, and independent acceptance. The controller's `agent add` / `retire` commands record evidence roles; they do not create or stop DSH members.

`workflow` remains available for explicitly requested batch orchestration. Its children are not official Team members. See the [DSH integration notes](<preset/skills/j-space/integration/dsh.md>) for the details.

## Updating from older releases

Update the package in the same profile, restart DSH Web, and create a new session.

If you saved a custom J-Space plugin configuration in the Web editor, back it up and reset the preset override, or remove the old `tool-subagent*` and Ralph entries manually. Otherwise, sessions may still use the old tool list after the package is updated. Load the official Team layer after the base / web layers.

Keep existing `.jspace/control.json` files and task records.

The [legacy CLI](<bin/cli.js>) is still included, but it only manages a file copy under `$DSH_HOME/.agent-presets/j-space`. Its `status` / `verify` commands cannot tell whether the current DSH preset is registered; check the new-session menu instead. The standalone Cordis deployment plugin also copies legacy files rather than registering a modern preset.

Release history is in the [changelog](<CHANGELOG.md>).

## Original J-Space files

This package uses upstream SV1 at commit [b2023124](https://github.com/Tiger3807861189/J-Space-Cognition-Suite/tree/b2023124a1fa08278e3ee82aefa8ed9faeade995). All 13 modules, seven references, original examples, controller, and full reread routines are retained.

Of the 26 original skill files, 25 are byte-for-byte unchanged. The [skill entry](<preset/skills/j-space/SKILL.md>) adds a removable DSH note, with separate [integration notes](<preset/skills/j-space/integration/dsh.md>). A [compressed archive](<vendor/j-space/canonical.tar.gz>) and [hash manifest](<vendor/j-space/manifest.json>) preserve the originals for verification and restoration.

The archive compresses files, not model input. It does not replace original text with summaries or reduce the tokens needed to read it. Original repeated prompts and scheduled full rereads are unchanged.

Run these commands from the installed package root to verify the files or restore the archive:

```bash
python3 -B tools/upstream_integrity.py verify --runtime preset/skills/j-space --adapters vendor/j-space/adapters.json

# The destination must not already exist
python3 -B tools/upstream_integrity.py expand --output /tmp/j-space-original-restored
```

The agent still needs to follow the controller protocol. Installing the preset does not install host event hooks that enforce it automatically.

## Development and tests

Run these from a full checkout. The npm package includes runtime files and the [integrity utility](<tools/upstream_integrity.py>), but not the development test harnesses.

```bash
pnpm install
pnpm run typecheck
pnpm test
pnpm run test:controller
pnpm run test:integrity
pnpm run test:lossless
pnpm run test:upstream
```

With a separately installed, isolated DSH host, you can also check the official configuration and native installation:

```bash
pnpm run test:host /path/to/isolated-host/node_modules 0.2.1-alpha.3
pnpm run test:install /path/to/isolated-host/node_modules /absolute/plugin.tgz 0.2.1-alpha.3
```

The installation smoke uses fresh temporary profiles and leaves your active configuration untouched. Version 1.2.4 was checked for native installation, preset and skill loading, and Team OFF/ON configuration. Model A/B comparisons, actual Team conversations, browser interaction, and scheduled delivery were not tested.

## Evaluation reports

The upstream author has published reports for [GLM-5.3-Flash](https://github.com/Tiger3807861189/GLM-5.3-Flash-J-Space-Capability-Realization-Report) and [DeepSeek-V4](https://github.com/Tiger3807861189/DeepSeek-V4-J-Space-Capability-Realization-Report). These describe upstream experiments, not measurements of this DSH integration. This project has not reproduced their performance or token-efficiency results.

## Licenses

The DSH wrapper is [MIT](<LICENSE>); upstream-authored J-Space code and text are [Apache-2.0](<vendor/j-space/LICENSE>). Third-party quotations and trace excerpts are excluded from those grants and remain subject to their own rights and terms. See [NOTICE](<NOTICE.md>) and the [upstream third-party notices](<vendor/j-space/THIRD_PARTY_NOTICES.md>) for sources and scope.
