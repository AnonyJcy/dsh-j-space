# dsh-j-space

[![DSH Market Listed](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-zh.svg)](https://dsh.market/?q=AnonyJcy%2Fdsh-j-space)
[![npm version](https://img.shields.io/npm/v/@anonyjcy/dsh-j-space.svg?color=blue)](https://www.npmjs.com/package/@anonyjcy/dsh-j-space)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[简体中文](README.md) | **English**

> **J-Space Cognition Suite SV1** native Agent Preset & standalone Cordis plugin for **DeepSeek Harness (DSH)**.  
> Bringing internal thought representations, externalized workspace ledgers (`.jspace/`), and adaptive verification to unlock full LLM reasoning potential.

---

> **Current target: DSH 0.2.0; project version: 1.2.2.** Registers `j-space` through a native bundle patch and aligns its tool configuration with that version's Web `standard` preset. The default composition targets a Web profile with the subagent model-selection settings plugin; see the host requirements below for custom or headless profiles.

### DSH 0.2.0 adaptation highlights

- **1.2.0: native preset registration**. The `@deepseek-ai/dsh-agent-preset` declaration in [cordis.patch.yml](./cordis.patch.yml) registers the preset, with skills resolved relative to the package and no separate deployment step. Since DSH 0.1.7, `$DSH_HOME/.agent-presets/` is no longer scanned; copying files with the legacy CLI does not register a preset in 0.2.0.
- **1.2.1: standard tool composition**. Adds the `/goal` command and `present` deliverable tool, and sets `modelSelectionSettings: true` by default. The plugin-manager tool row remains disabled, matching the standard preset.
- **1.2.2: aligned defaults**. Enables `web_fetch` alongside `web_search` and explicitly disables Ralph. Keeps the J-Space-specific persona and skill directory.

Historical adaptations for the DSH 0.1.5 persona schema and 0.1.6 `dsh-workflow-ptc` are recorded in [CHANGELOG.md](./CHANGELOG.md); they do not imply that the current 1.2.x release supports every older host.

## 🌟 Overview

`dsh-j-space` integrates the [J-Space Cognition Suite](https://github.com/Tiger3807861189/J-Space-Cognition-Suite) (SV1 release, continuing V3.7 evolution) into DeepSeek Harness as a native **Agent Preset**.

Unlike traditional flat prompt injections, this plugin provides **full agent scope isolation, multi-tier reasoning routes, externalized workspace ledgers (`.jspace/`), and adaptive verification** across any compatible LLM model (DeepSeek, Claude, GPT, etc.).

---

## 📊 Empirical Capability Realization Report

> Full evaluation reports by the original author:
> - Current Benchmark Report: [GLM-5.3-Flash-J-Space-Capability-Realization-Report](https://github.com/Tiger3807861189/GLM-5.3-Flash-J-Space-Capability-Realization-Report)
> - Earlier Comparative Report (Preserved Archive): [DeepSeek-V4-J-Space-Capability-Realization-Report](https://github.com/Tiger3807861189/DeepSeek-V4-J-Space-Capability-Realization-Report)

### 🔬 Benchmark 1: GLM-5.3-Flash Evaluation (Latest Report)

#### 1. Main Benchmark Table (Accuracy Comparison)

| Benchmark | GLM-5.3-Flash (Baseline) | GLM-5.3-Flash **+ J-Space V3.7/SV1**† | GLM-5.3 | Opus-5 | Fable 5.1 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **HLE (w/ tools)** | 55.3 | **59.2** | 62.5 | 64.7 | 65.0 |
| **Terminal Bench 2.1** | 84.3 | **88.8** | 88.2 | *89.1 | *91.4 |
| **DeepSWE v1.1** | 63.4 | **68.0** | 66.9 | 68.8 | 67.4 |
| **Agents' Last Exam** | 26.3 | **30.5** | 28.5 | 31.6 | — |
| **AutomationBench (Public)** | 48.8 | **51.1** | 48.2 | 50.3 | — |

*\* Note: Terminal Bench 2.1 figures for Opus-5 and Fable 5.1 are independently measured by a third party; no official entries exist.*  
*\† Estimated, based on limited controlled experiments.*

#### 2. Speed and Token Efficiency Table (GAIA Controlled Pair)

| Metric | Factor / Improvement |
| :--- | :---: |
| **Speed** | **1.87×** |
| **Token Efficiency** | **1.41×** |

---

### 🔬 Benchmark 2: DeepSeek-V4-Flash Evaluation (Historical Archive)

- **Base Model**: `DeepSeek-V4-Flash-Vision-Exp`
- **Harness**: DeepSeek Harness (Standard Mode)
- **Methodology**: Rigorous **A/B Testing** with and without J-Space on authoritative benchmark subsets and same-type mini-sets (Terminal-Bench 2.1: 20 medium / 10 hard; DeepSWE: 10 TypeScript / 10 Python / 10 Go / 2 JavaScript / 2 Rust; GAIA: level 1 / level 3, etc.), with identical model, environment, and sampling — only the J-Space toggle differs.
- **Evaluation Dimensions**: ① Accuracy / Pass Rate; ② Wall-clock & Token Efficiency.

#### 1. Main Benchmark Table (Accuracy Comparison)

| Benchmark | DeepSeek V4-Flash (Baseline) | DeepSeek V4-Flash **+ J-Space V3.7** | GLM-5.3 | Kimi-K3 | Opus-4.8 | Fable 5 (w/ fallback) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **HLE (w/o tools)** | *37.8 | **37.8** | — | 43.5 | 49.8 | 53.3 |
| **HLE (w/ tools)** | *51.5 | **51.9** | 62.5 | 56.0 | 57.9 | 63.0 |
| **Terminal Bench 2.1** | 83.9 | **85.5** | 88.2 | 88.3 | 85.0 | 88.0 |
| **NL2Repo** | 57.7 | **60.4** | 58.0 | 58.0 | 69.7 | — |
| **CyberGym** | 75.3 | **77.8** | 84.5 | 80.0 | 78.3 | 83.1 |
| **DeepSWE** | 59.3 | **61.8** | 66.9 | 67.5 | 58.0 | 70.0 |
| **Toolathlon-Verified** | 75.9 | **77.4** | 73.0 | 76.5 | 76.2 | 77.9 |
| **Agents' Last Exam** | 27.3 | **28.3** | 28.5 | 27.6 | 25.7 | 23.8 |
| **AutomationBench (Public)** | 25.7 | **27.6** | 48.2 | 30.8 | 27.2 | 29.1 |
| **⭐ Average Score** | 56.99 | **58.61** | 64.54 | 60.96 | 58.33 | 62.13 |

*\* Note: HLE scores were not disclosed and follow DeepSeek V4-Flash-0731. The average covers the 7 rows where all six columns have values.*

#### 2. Speed and Token Efficiency Table

| Benchmark | Wall-clock τ | Speedup | Output Tokens | Total Tokens | **Score per Unit Time** | Cost per Successful Task |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **HLE (w/o tools)** | *1.02 | −2% | −10% | +5% | **0.98×** | +5% |
| **HLE (w/ tools)** | 0.88 | **+14%** | −22% | +3% | **1.15×** | +2% |
| **Terminal Bench 2.1** | 0.79 | **+27%** | −28% | −3% | **1.29×** | **−5%** |
| **DeepSWE** | 0.78 | **+28%** | −28% | −3% | **1.34×** | **−7%** |
| **Toolathlon-Verified** | 0.86 | **+16%** | −25% | +2% | **1.19×** | +0% |
| **AutomationBench (Public)** | 0.76 | **+32%** | −31% | −5% | **1.41×** | **−12%** |

*\* Note: For HLE (w/o tools), τ=1.02 is **intentionally positive** (i.e. slower) because on single-turn tasks without tools, injecting the full skill entry is net overhead. On long-horizon and multi-turn coding/agentic benchmarks (e.g. Terminal Bench, DeepSWE, AutomationBench), J-Space delivers **+14% ~ +32% faster execution**, **cuts 28%~31% of output token redundancy**, and boosts score per unit time by **1.15× ~ 1.41×**.*

---

## 🚀 Installation (DSH 0.2.0)

### Method 1: Install with the DSH plugin manager (recommended)

```bash
# Install into the Web profile you use, not an arbitrary project's node_modules
dsh plugin --profile web add @anonyjcy/dsh-j-space@latest
```

DSH loads [cordis.patch.yml](./cordis.patch.yml) through the package's `dsh.bundle.patch` field; its declaration registers `j-space`. Running `npm install` / `pnpm add` in an ordinary project directory alone does not register the preset in a DSH profile.

Check that the installed package is **1.2.2 or newer**. If that version is not yet published on npm, use the repository installation below. After replacing an installed package, restart the current DSH Web process and create a new session. Do not run the legacy `install` CLI as a registration step. For a custom Web profile, replace `web` with its actual profile name.

### Method 2: Install a local repository checkout

```bash
git clone https://github.com/AnonyJcy/dsh-j-space.git
cd dsh-j-space

# Add the current package directory to the Web profile
dsh plugin --profile web add "$PWD"
```

This also registers the preset through the bundle patch. Skills are loaded from the package's [preset/skills/j-space](./preset/skills/j-space/) directory; no copy into the user preset directory is needed.

---

## 💡 Usage

### 1. In DeepSeek Harness Web UI
1. Create a new Session.
2. Select **J-Space Cognition Suite** in the **Agent Preset** dropdown.
3. Pick any compatible model (`deepseek-chat`, `deepseek-reasoner`, etc.) and start your task.

### Configure model selection for spawn subagents in Web UI

Since **1.2.1**, J-Space spawn subagents already set `modelSelectionSettings: true`; there is no need to add it manually. This enables integration with host settings, not unrestricted access to every model.

Open **Plugins → Subagent → Model selection** in DSH Web Settings, enable **Allow agents to choose models for Subagents**, and select permitted routes from the current DSH model catalog. Start a new session for the setting to take effect.

Routes come from each DSH deployment's own model catalog and authorization list; J-Space hardcodes no provider or model IDs. Select newly added routes in Subagent settings when needed. DSH fork subagents inherit the parent session's model by design.

### 2. Host requirements for custom / headless profiles

The default preset requires the Host to load `@deepseek-ai/dsh-tool-subagent/model-selection-settings`, supplied by the DSH Web application bundle. A host without this plugin fails to mount the preset rather than silently downgrading.

For such a host, explicitly compose the settings plugin or remove / disable the spawn subagent's `modelSelectionSettings` field in your own preset override. Follow your DSH profile's documentation for preset selection and launch arguments; do not assume the old `dsh --preset j-space` example still applies.

### 3. Legacy standalone Cordis plugin (migration reference only)

```yaml
- id: j-space-plugin
  name: '@anonyjcy/dsh-j-space'
  config:
    autoDeploy: true
```

This composition only invokes the legacy file-deployment plugin; it is not a preset registration method for DSH 0.2.0. Use the bundle installation above for the current version.

---

## 🧩 Architecture & Data Flow

```mermaid
flowchart TD
    P[Profile Loads Bundle Patch] --> R[Register j-space Preset Declaration]
    R --> A[New Session]
    A --> B[Select j-space Preset]
    B --> D[Mount Preset Tools and Skills]
    D --> E[Agent Scope]
    E --> F1[Persona: J-Space SV1 Architecture]
    E --> F2[Tools: Full Coding & Reasoning Tools]
    E --> F3[Skill Filesystem: Mounted skills/j-space/]
    E --> F4[J-Space Suite: SKILL.md, 13 modules, 7 references, controller & adapters]
    E --> G[Session Model Route: Any Model]
    G --> H[Agent Executes J-Space Cognition Loop]
    H --> I[Task Workspace: Managed .jspace/ Ledger & Control State]
```

---

## 🛠️ Legacy file-deployment CLI (migration reference only)

These commands remain in the package and manage the legacy copy at `$DSH_HOME/.agent-presets/j-space` (default: `~/.dsh/.agent-presets/j-space`). `status` / `verify` only check those files; they **do not verify that a DSH 0.2.0 bundle is loaded or its preset registered**. Check the new-session preset menu in the current Web profile instead.

```bash
node bin/cli.js install    # Deploy J-Space preset to ~/.dsh/.agent-presets/j-space
node bin/cli.js uninstall  # Cleanly remove J-Space preset
node bin/cli.js verify     # Verify integrity of installed preset files
node bin/cli.js status     # Display current installation status
```

---

## 📄 License

MIT License. See [LICENSE](./LICENSE). For the J-Space suite's source and author information, see the [upstream project](https://github.com/Tiger3807861189/J-Space-Cognition-Suite).

## Maintenance

See [CHANGELOG.md](CHANGELOG.md) for release notes.
