# 🚀 dsh-j-space

[![DSH Market 收录徽章](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-zh.svg)](https://dsh.market/?q=AnonyJcy%2Fdsh-j-space)
[![npm version](https://img.shields.io/npm/v/@anonyjcy/dsh-j-space.svg?color=blue)](https://www.npmjs.com/package/@anonyjcy/dsh-j-space)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**简体中文** | [English Version](README.en.md)

> **J-Space Cognition Suite SV1** 原生 DeepSeek Harness (DSH) Agent Preset 预设与独立 Cordis 插件包。  
> 注入内部表征认知路由、持久控制器（`control.py`）、工作区状态外化账本（`.jspace/`）与自适应检验，全面释放大语言模型推理潜能。

---

> **当前适配：DSH 0.2.0，项目版本 1.2.2。** 通过原生 bundle patch 注册 `j-space` 预设，并对齐该版本 Web 应用的 `standard` 预设工具配置。默认面向加载了子代理模型选择设置插件的 Web profile；自定义或 headless profile 的宿主要求见下文。

### DSH 0.2.0 适配要点

- **1.2.0：原生预设注册**。通过 [cordis.patch.yml](./cordis.patch.yml) 中的 `@deepseek-ai/dsh-agent-preset` 声明注册预设，技能目录随包解析，无需额外部署。DSH 自 0.1.7 起不再扫描 `$DSH_HOME/.agent-presets/`，旧 CLI 复制文件的方式不能在 0.2.0 中注册预设。
- **1.2.1：补齐标准工具配置**。加入 `/goal` 命令和 `present` 交付工具，默认配置 `modelSelectionSettings: true`；插件管理工具行与标准预设一致，保持禁用。
- **1.2.2：对齐默认行为**。启用 `web_fetch`（同时保留 `web_search`），显式禁用 Ralph。保留 J-Space 专属 persona 与技能目录。

历史上的 DSH 0.1.5 persona schema 与 0.1.6 `dsh-workflow-ptc` 适配记录见 [CHANGELOG.md](./CHANGELOG.md)；它们不代表当前 1.2.x 仍支持所有旧版宿主。

## 🌟 项目简介

`dsh-j-space` 将 [J-Space Cognition Suite](https://github.com/Tiger3807861189/J-Space-Cognition-Suite)（SV1 发布版，延续 V3.7 演进路线）完整集成为 DeepSeek Harness 的一等公民 **Agent 预设 (Preset)**。

它不是粗暴的 Prompt 拼接，而是真正参与 Cordis **Agent Scope 生命周期隔离、多层认知路由、持久控制器、工作区状态外化账本（`.jspace/`）与自适应验证** 的完整体系，完全解耦并兼容任意大语言模型（DeepSeek-Chat、DeepSeek-Reasoner、Claude、GPT 等）。

### ✨ 核心特性
1. **即插即用（Zero-Config Preset）**：部署预设后，DeepSeek Harness 会话创建菜单自动出现 `J-Space Cognition Suite` 预设。
2. **全生命周期 Scope 隔离**：遵循 Cordis 作用域规范，工具和认知技能严格限定在 J-Space Agent 会话中，不污染其他预设。
3. **持久控制器与状态外化（Active Control & Ledger）**：包含 SV1 的持久控制器（`control.py`）、宿主适配器（`host_bridge.py`）以及轻量级账本（`jspace.py`），在任务工作区（`cwd`）维护 `.jspace/`，实现目标跟踪、接缝审计（Seam）、自检断言、代码语义地图与断点恢复。
4. **全面扩展的 13 大认知与工程模块**：除原版的容量控制、深层推理、定向聚焦等模块外，SV1 引入了 `cyber`（安全分析）、`epistemics`（认识论与信念检验）、`orchestration`（多智能体编排）和 `repository`（代码仓库工程语义地图）。
5. **模型解耦与动态路由**：无缝适配各类基底模型，动态解析模型路由与工作区上下文。

---

## 📊 实验与评测数据报告（实测对比）

> 完整实测报告引自原作者测试发布：
> - 现行基准报告：[GLM-5.3-Flash-J-Space-Capability-Realization-Report](https://github.com/Tiger3807861189/GLM-5.3-Flash-J-Space-Capability-Realization-Report)
> - 早期对照报告（保留存档）：[DeepSeek-V4-J-Space-Capability-Realization-Report](https://github.com/Tiger3807861189/DeepSeek-V4-J-Space-Capability-Realization-Report)

### 🔬 评测一：GLM-5.3-Flash 实测对比（最新报告）

#### 1. 主基准测试准确率对比（Main Benchmark Table）

| Benchmark 基准测试 | GLM-5.3-Flash (基线) | GLM-5.3-Flash **+ J-Space V3.7/SV1**† | GLM-5.3 | Opus-5 | Fable 5.1 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **HLE (w/ tools)** | 55.3 | **59.2** | 62.5 | 64.7 | 65.0 |
| **Terminal Bench 2.1** | 84.3 | **88.8** | 88.2 | *89.1 | *91.4 |
| **DeepSWE v1.1** | 63.4 | **68.0** | 66.9 | 68.8 | 67.4 |
| **Agents' Last Exam** | 26.3 | **30.5** | 28.5 | 31.6 | — |
| **AutomationBench (Public)** | 48.8 | **51.1** | 48.2 | 50.3 | — |

*\* 注：Terminal Bench 2.1 的 Opus-5 与 Fable 5.1 为第三方独立测评，无官方数据。*  
*\† 为基于有限对照实验的估算值。*

#### 2. 速度与 Token 消耗效率对比 (GAIA 对照)

| 指标维度 | 提升比率 / 效果 |
| :--- | :---: |
| **运行速度 (Speed)** | **1.87×** |
| **Token 效率 (Token Efficiency)** | **1.41×** |

---

### 🔬 评测二：DeepSeek-V4-Flash 实测对比（历史存档）

- **评测基底**：`DeepSeek-V4-Flash-Vision-Exp`
- **运行环境**：DeepSeek Harness (标准模式)
- **评测方式**：对权威基准子集与同类型小集（Terminal-Bench 2.1 中 medium 20 / hard 10，DeepSWE 中 TypeScript 10 / Python 10 / Go 10 / JavaScript 2 / Rust 2，GAIA 中 level1 / level3 等）进行严格的 **有/无 J-Space 臂对照（A/B Testing）**，同模型、同环境、同采样参数，仅切换 J-Space 接入。
- **测算维度**：① 准确率（Accuracy）；② 墙钟与 token 效率（Wall-Clock & Token Efficiency）。

#### 1. 主基准测试准确率对比（Main Benchmark Table）

| Benchmark 基准测试 | DeepSeek V4-Flash (基线) | DeepSeek V4-Flash **+ J-Space V3.7** | GLM-5.3 | Kimi-K3 | Opus-4.8 | Fable 5 (w/ fallback) |
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
| **⭐ 综合均分 (Average)** | 56.99 | **58.61** | 64.54 | 60.96 | 58.33 | 62.13 |

*\* 注：HLE 数据未披露，沿用 DeepSeek V4-Flash-0731。综合均分覆盖六列均有值的 7 个项目行。*

#### 2. 速度与 Token 消耗效率对比（Speed & Token Efficiency）

| Benchmark 基准测试 | 墙钟时间比 τ | 提速幅度 | 输出 Token 变化 | 总 Token 变化 | **单位时间得分 (产出比)** | 每成功任务成本 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **HLE (w/o tools)** | *1.02 | −2% | −10% | +5% | **0.98×** | +5% |
| **HLE (w/ tools)** | 0.88 | **+14%** | −22% | +3% | **1.15×** | +2% |
| **Terminal Bench 2.1** | 0.79 | **+27%** | −28% | −3% | **1.29×** | **−5%** |
| **DeepSWE** | 0.78 | **+28%** | −28% | −3% | **1.34×** | **−7%** |
| **Toolathlon-Verified** | 0.86 | **+16%** | −25% | +2% | **1.19×** | +0% |
| **AutomationBench (Public)** | 0.76 | **+32%** | −31% | −5% | **1.41×** | **−12%** |

*\* 注：HLE (w/o tools) 的 τ=1.02 是**有意为正**（即单轮无工具任务下略微变慢），因为在单轮短任务中注入完整的技能条目是净开销；而在长链路、多轮工具交互任务中（如 Terminal Bench、DeepSWE、AutomationBench），J-Space 认知套件带来 **+14% ~ +32% 的大幅提速**、**降低 28%~31% 的输出 Token 冗余**，单位时间产出比提升高达 **1.15× ~ 1.41×**。*

---

## 🚀 安装（DSH 0.2.0）

### 方式一：通过 DSH 插件管理安装（推荐）

```bash
# 安装到实际使用的 Web profile，而不是任意项目的 node_modules
dsh plugin --profile web add @anonyjcy/dsh-j-space@latest
```

DSH 从包的 `dsh.bundle.patch` 字段加载 [cordis.patch.yml](./cordis.patch.yml)，由其中的声明注册 `j-space`。仅执行 `npm install` / `pnpm add` 到普通项目目录，并不会将预设注册到 DSH profile。

请确认安装的包版本为 **1.2.2 或更新版本**。若 npm 尚未发布对应版本，可使用下面的仓库安装方式。替换已安装的包后，重启当前 DSH Web 进程并新建会话；不要再执行旧版 `install` CLI 作为注册步骤。自定义 Web profile 请将命令中的 `web` 替换为实际 profile 名称。

### 方式二：安装本地仓库版本

```bash
git clone https://github.com/AnonyJcy/dsh-j-space.git
cd dsh-j-space

# 将当前包目录加入 Web profile
dsh plugin --profile web add "$PWD"
```

同样通过 bundle patch 注册预设；技能直接来自包内的 [preset/skills/j-space](./preset/skills/j-space/)，不需要复制到用户预设目录。

---

## 💡 使用方法

### 1. Web UI 界面
1. 打开 DeepSeek Harness Web 界面，点击 **New Session**（新建会话）。
2. 在 **Agent Preset** 下拉选单中，直接选择 **J-Space Cognition Suite**。
3. 选择任意兼容的模型（`deepseek-chat` / `deepseek-reasoner` 等）开始任务。

### 在 Web UI 中配置 spawn 子代理模型选择

自 **1.2.1** 起，J-Space 的 spawn 子代理已默认配置 `modelSelectionSettings: true`，无需再次添加该字段。这只是启用宿主设置接入，不等于自动允许 Agent 使用所有模型。

在 DSH Web 设置中打开 **插件 → Subagent → Model selection**，启用 **允许 Agent 为 Subagent 选择模型**，并从当前 DSH 模型目录勾选允许使用的路由。新建会话后生效。

模型路由由每个 DSH 部署自己的模型目录和授权列表决定；J-Space 不绑定任何提供方或模型 ID。新增模型后，在 Subagent 设置中勾选对应路由即可。fork 子代理按 DSH 设计继承父会话模型。

### 2. 自定义 / headless profile 的宿主要求

默认预设要求 Host 加载 `@deepseek-ai/dsh-tool-subagent/model-selection-settings`，DSH Web 应用 bundle 提供此插件。未加载该插件的宿主会导致预设挂载失败，而不是静默降级。

若要在这种宿主中使用，请显式补齐 Host 设置插件，或在自己的预设覆盖配置中移除 / 关闭 spawn 子代理的 `modelSelectionSettings` 字段。预设选择与启动参数应以所用 DSH profile 的文档为准，不能直接沿用旧版 `dsh --preset j-space` 示例。

### 3. 旧版独立 Cordis 插件（仅供迁移参考）

```yaml
- id: j-space-plugin
  name: '@anonyjcy/dsh-j-space'
  config:
    autoDeploy: true
```

这段配置仅调用旧版文件部署插件，不是 DSH 0.2.0 的预设注册方式。当前版本请使用上文的 bundle 安装方式。

---

## 🧩 核心架构与数据流

```mermaid
flowchart TD
    P[Profile 加载 bundle patch] --> R[注册 j-space 预设声明]
    R --> A[新建 Session]
    A --> B[选择 j-space 预设]
    B --> D[挂载预设工具与技能]
    D --> E[Agent Scope]
    E --> F1[Persona: J-Space SV1 认知系统]
    E --> F2[Tools: 完整编码与思考工具]
    E --> F3[Skill Filesystem: 挂载 skills/j-space/]
    E --> F4[J-Space Suite: SKILL.md, 13大模块, 7大参考, 控制器与适配脚本]
    E --> G[Session Model Route: 任意兼容模型]
    E --> H[Agent 运行 J-Space 认知闭环]
    H --> I[Task Workspace: 生成并维护 .jspace/ 账本与控制状态]
```

---

## 🛠️ 旧版文件部署 CLI（仅供迁移参考）

以下命令仍保留在包中，管理的是 `$DSH_HOME/.agent-presets/j-space`（默认 `~/.dsh/.agent-presets/j-space`）的旧版副本。`status` / `verify` 只检查这些文件，**不能用于确认 DSH 0.2.0 bundle 已加载或预设已注册**；请在当前 Web profile 的新建会话菜单确认预设是否出现。

```bash
node bin/cli.js install    # 安装 J-Space Preset 到 DSH 用户预设目录 (~/.dsh/.agent-presets/j-space)
node bin/cli.js uninstall  # 干净卸载 J-Space Preset
node bin/cli.js verify     # 校验已安装预设的套件完整性
node bin/cli.js status     # 查看当前安装状态与配置路径
```

---

## 📄 开源许可证

本项目基于 [MIT License](./LICENSE) 开源。J-Space 套件来源及原作者说明见 [上游项目](https://github.com/Tiger3807861189/J-Space-Cognition-Suite)。

## 维护 / Maintenance

版本变更见 [CHANGELOG.md](CHANGELOG.md)。
