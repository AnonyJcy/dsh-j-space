# dsh-j-space

[![DSH Market 收录](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-zh.svg)](https://dsh.market/?q=AnonyJcy%2Fdsh-j-space)
[![npm](https://img.shields.io/npm/v/@anonyjcy/dsh-j-space.svg?color=blue)](https://www.npmjs.com/package/@anonyjcy/dsh-j-space)
[![license](https://img.shields.io/badge/license-MIT%20%2B%20Apache--2.0-green.svg)](<NOTICE.md>)

**简体中文** | [English](<README.en.md>)

在 DeepSeek Harness 中使用 [J-Space Cognition Suite](https://github.com/Tiger3807861189/J-Space-Cognition-Suite)。安装后，新建会话时选择 **J-Space Cognition Suite** 预设即可。

J-Space 提供一套拆解问题、分析仓库、记录任务进度和检查结果的方法。这个项目把它接入 DSH，保留原版的认知模块、控制器和工作区账本。模型、工具和权限沿用 DSH 的配置；需要多智能体协作时，使用 DSH 官方的「智能体团队」。

J-Space 本身由上游项目维护，这个仓库负责 DSH 适配。

## 安装

1.2.4 的验证环境是 **DSH 0.2.1-alpha.3 / Cordis 4.0.5-alpha.2**。下面固定使用这个 DSH 版本，不依赖 npm 标签的指向。旧的 `0.2.0-rc.2` 缺少本预设需要的定时工具，不能完整加载，请先升级。

```bash
# 已使用对应 DSH 版本时，可以跳过这一条
npm install -g @deepseek-ai/dsh@0.2.1-alpha.3

dsh plugin --profile web add @anonyjcy/dsh-j-space@1.2.4
```

已有 DSH 部署时，请在启动该部署的安装环境中升级，并先备份自定义配置。使用自定义 profile 的话，把 `web` 换成实际名称。

安装后重启 DSH Web，新建会话，在 **Agent Preset** 中选择 **J-Space Cognition Suite**。只在普通项目里安装 npm 包，不会把预设注册到 DSH；也不用再运行旧版 `install` 命令。

使用原版控制器或校验脚本需要 **Python 3.10+**。

<details>
<summary>从本地仓库安装</summary>

```bash
git clone https://github.com/AnonyJcy/dsh-j-space.git
cd dsh-j-space
dsh plugin --profile web add "$PWD"
```

DSH 通过 [bundle 配置](<cordis.patch.yml>) 注册预设，技能直接读取包内的 [技能目录](<preset/skills/j-space/>)，不用手动复制。

</details>

## 和官方智能体团队一起使用

需要团队功能时，在同一个 profile 安装官方插件：

```bash
dsh plugin --profile web add @deepseek-ai/dsh-experimental-agent-team-profile@0.2.1-alpha.3
```

创建成员、发消息、分配任务和管理成员生命周期，都交给官方插件。J-Space 预设不再单独注册 `subagent`、`fork` 和成员控制工具，也不会自动启用团队；只有用户明确要求时才创建团队。不装团队插件，也可以单智能体使用。

原版 [orchestration 模块](<preset/skills/j-space/modules/orchestration.md>) 仍然保留。它记录参与者的工作和验收依据，不是另一套团队管理器：成员各自读取源文件、二次考量和独立验收的要求没有删除。控制器里的 `agent add` / `retire` 也只是记账，不会创建或停止 DSH 成员。

`workflow` 继续用于用户明确要求的批量编排，其中的子任务不算官方团队成员。具体对应关系见 [DSH 适配说明](<preset/skills/j-space/integration/dsh.md>)。

## 从旧版升级

在同一个 profile 更新包，重启 DSH Web，再新建会话。

如果曾在 Web 编辑器中保存过 J-Space 的插件配置，请先备份，再重置该预设的覆盖配置，或手动移除旧的 `tool-subagent*`、Ralph 配置。否则，即使包已经更新，会话仍可能沿用旧的工具列表。官方团队层应放在 base / web 层之后加载。

已有的 `.jspace/control.json` 和任务记录不用删除。

[旧版 CLI](<bin/cli.js>) 仍随包保留，但只管理 `$DSH_HOME/.agent-presets/j-space` 中的文件副本。它的 `status` / `verify` 不能判断当前 DSH 是否已经注册预设；请以新建会话菜单为准。旧的独立 Cordis 部署插件也是文件复制用途，不是新版的注册方式。

版本变更见 [更新日志](<CHANGELOG.md>)。

## 原版内容与校验

当前使用上游 SV1 的固定提交 [b2023124](https://github.com/Tiger3807861189/J-Space-Cognition-Suite/tree/b2023124a1fa08278e3ee82aefa8ed9faeade995)。13 个模块、7 个参考文档，以及原版控制器、示例和完整重读流程都保留。

26 个原版技能文件中，25 个逐字节不变；只有 [技能入口](<preset/skills/j-space/SKILL.md>) 加入了一段可移除的 DSH 说明，另附一份 [适配说明](<preset/skills/j-space/integration/dsh.md>)。原文和校验信息保存在 [压缩归档](<vendor/j-space/canonical.tar.gz>) 与 [清单](<vendor/j-space/manifest.json>) 中。

这里的压缩用于保存和还原源文件，不会减少解压后送给模型的 token，也不会用摘要代替原文。原版的重复提示和定期完整重读方式没有改。

在已安装包的根目录运行以下命令，可以校验文件或还原归档：

```bash
python3 -B tools/upstream_integrity.py verify --runtime preset/skills/j-space --adapters vendor/j-space/adapters.json

# 输出目录必须尚不存在
python3 -B tools/upstream_integrity.py expand --output /tmp/j-space-original-restored
```

控制器仍需要智能体按协议调用；安装预设不会自动装上宿主事件拦截器。

## 开发与测试

下面的命令在完整仓库中执行。npm 包包含运行文件和 [校验工具](<tools/upstream_integrity.py>)，不包含本仓库的开发测试脚本。

```bash
pnpm install
pnpm run typecheck
pnpm test
pnpm run test:controller
pnpm run test:integrity
pnpm run test:lossless
pnpm run test:upstream
```

另行安装隔离的 DSH 宿主后，可以检查官方配置和真实安装流程：

```bash
pnpm run test:host /path/to/isolated-host/node_modules 0.2.1-alpha.3
pnpm run test:install /path/to/isolated-host/node_modules /absolute/plugin.tgz 0.2.1-alpha.3
```

安装测试只创建新的临时 profile，不会修改正在使用的配置。1.2.4 已验证原生安装、预设与技能加载，以及官方团队开关两种配置；没有做模型 A/B、真实团队对话、浏览器操作或定时投递测试。

## 相关评测

上游作者发布了 [GLM-5.3-Flash 报告](https://github.com/Tiger3807861189/GLM-5.3-Flash-J-Space-Capability-Realization-Report) 和 [DeepSeek-V4 报告](https://github.com/Tiger3807861189/DeepSeek-V4-J-Space-Capability-Realization-Report)。这些是上游实验，不是这份 DSH 适配的实测成绩；本项目没有复现其中的性能或 token 收益。

## 许可证

DSH 包装代码使用 [MIT](<LICENSE>)；上游编写的 J-Space 代码和文本使用 [Apache-2.0](<vendor/j-space/LICENSE>)。第三方引文和轨迹片段不包含在上述授权中，仍适用各自的权利与条款。来源和具体范围见 [NOTICE](<NOTICE.md>) 及 [上游第三方声明](<vendor/j-space/THIRD_PARTY_NOTICES.md>)。
