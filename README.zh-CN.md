<div align="center">

# DSH Testkit

**为 DeepSeek Harness 插件提供确定性的真实宿主生命周期测试。**

[English](README.md) · [场景参考](docs/scenarios.md) · [架构](docs/architecture.md) · [参与贡献](docs/contributing.md)

[![CI](https://github.com/iiwish/dsh-testkit/actions/workflows/ci.yml/badge.svg)](https://github.com/iiwish/dsh-testkit/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/dsh-testkit?color=cb3837)](https://www.npmjs.com/package/dsh-testkit)
[![Node.js](https://img.shields.io/node/v/dsh-testkit)](package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-0b7285)](LICENSE)

</div>

DSH Testkit 会打包插件，在一次性环境中将其与精确版本的 DSH 一同安装，启动真实宿主，执行确定性能力探测，卸载插件，重启同一个 profile，并保留可复核的证据。整个过程不调用模型，也不需要模型 API Key。

```text
resolve -> install-dsh -> package -> install-plugin -> assemble -> boot -> register
        -> exercise -> update? -> uninstall -> reboot -> recover? -> cleanup
```

## 快速开始

运行要求：Node.js 22 或更高版本，以及 Docker。

```bash
pnpm add -D dsh-testkit
pnpm dsh-test init
pnpm dsh-test
```

如果 DSH bundle 位于仓库子目录，请把插件目录传给 `init`：

```bash
pnpm dsh-test init plugin/
pnpm dsh-test --config plugin/dsh-testkit.yaml
```

`init` 会离线识别最近的 Git worktree。导出的源码树没有 `.git` 元数据时，请显式传入 `--repo-root .`。它会读取 bundle 声明的 patch，并且只生成三个可审核文件：

- `<plugin-root>/dsh-testkit.yaml`：固定精确支持的 DSH 版本和自动识别的 row 预期
- `<repository-root>/.github/workflows/dsh-lifecycle.yml`：采用最小权限，并引用正确的插件与场景路径
- `<repository-root>/.agents/skills/dsh-testkit/SKILL.md`：让 coding agent 使用同一套发布门禁

根目录插件的 plugin root 与 repository root 相同，现有路径保持不变。请审核自动识别的 row，并且只添加插件契约能够证明的 service、tool、update 和 exercise 预期。重复运行 `init` 时字节保持不变；除非显式使用 `--force`，任一根目录中的冲突文件都会让命令在写入全部目标前停止。

Docker 是默认 runner。成功执行后，`.dsh-testkit/runs/` 中会生成 `report.json`、`junit.xml`、`report.md`、脱敏命令日志和各阶段证据。

当前 adapter 仅支持 `@deepseek-ai/dsh@0.1.0-rc.6`。未知版本会在创建 runner 之前以退出码 `4` 停止，避免把宿主版本漂移误报成插件故障。

## 它能证明什么

| 信号 | 测试方式 |
|---|---|
| 包完整性 | 本地目录必须经过 `npm pack`，软链接和未发布文件无法掩盖打包缺陷。 |
| 真实注册 | 配置 row 来自 DSH `--dump-config`；service 和 tool schema 来自进程内 Cordis probe。 |
| 确定性执行 | 基础 runtime probe 和声明的 tool 调用都经过真实 tool runtime，不依赖模型选择。 |
| 干净卸载 | 卸载后重启同一 profile，并检查 bundle、能力、进程、端口和归属路径残留。 |
| 可重复性 | `--suite full` 运行五次隔离尝试；语义结果不一致时返回 `flaky`。 |
| 观测边界 | 不可用的 observer 会明确披露；必需 observer 不可用时返回 `unsupported`，不会伪造通过。 |

它**不能**证明任意可执行代码是安全的，也不能证明插件生成的模型结果质量足够高。

## 选择正确的检查工具

这些工具彼此互补，而不是相互替代。

| 需求 | 合适的工具 |
|---|---|
| 快速静态检查、manifest 诊断、依赖建议 | [dsh-plugin-doctor](https://github.com/zoahdev/dsh-plugin-doctor) 或 plugin preflight check |
| 多个 bundle 在 assemble 前后发生冲突 | `dsh-composition-check` |
| 插件自身的单元逻辑 | 你的测试框架 |
| 在真实宿主验证安装、启动、执行、卸载、重启、恢复、残留与重复性 | **DSH Testkit** |

DSH Testkit 当前刻意让每个隔离生命周期只包含一个被测插件。只有真实案例证明“单插件生命周期测试 + composition check”无法复现某类故障时，才会扩展多插件状态归属和更新顺序的场景契约。

实用的发布门禁可以在每次提交运行 Doctor 做低成本预检，并在发布 PR 或 tag 上运行 DSH Testkit 验证打包产物的真实宿主生命周期。两者都不是安全认证。

## 场景即代码

在插件项目中创建 `dsh-testkit.yaml`：

```yaml
schemaVersion: 1
name: my-plugin-quick
subject:
  source: .
dsh:
  version: 0.1.0-rc.6
expect:
  boot: success
  rows: [tool-my-plugin]
  services: [myService]
  tools: [my_tool]
exercise:
  - tool: my_tool
    arguments:
      value: smoke
observers:
  filesystem: required
  process: preferred
  ports: preferred
  network: off
  canary: preferred
```

[场景参考](docs/scenarios.md)包含更新目标、预期失败、恢复、超时、observer 策略和单阶段重跑说明。

## CI 证据

`dsh-test init` 会使用固定的滚动主版本 tag 生成以下 workflow：

```yaml
- uses: iiwish/dsh-testkit/.github/actions/dsh-test@v0
  with:
    plugin: .
    dsh-version: 0.1.0-rc.6
```

Action 会发布 JUnit，并上传完整运行目录。artifact 名称、check 名称、输出路径和保留时间均可配置；artifact ID、URL 和 digest 可作为输出使用。由于 `actions/upload-artifact@v4+` 不支持 GHES，GitHub Enterprise Server 和其他 CI 可直接调用 CLI 并保留相同证据。

对于嵌套 bundle，生成的 workflow 仍位于仓库根目录，并使用 `plugin: ./plugin` 与 `config: plugin/dsh-testkit.yaml`；GitHub 不需要发现插件目录内部的 workflow。

稳定退出码为：`0` 通过、`1` 生命周期失败、`2` 输入无效、`3` 基础设施错误、`4` 能力不支持、`5` 结果不稳定。JSON Schema 发布在 `dsh-testkit/schemas/report-v1.json` 和 `dsh-testkit/schemas/scenario-v1.json`。

## Agent Skill

项目级 `.agents/skills/dsh-testkit/SKILL.md` 会告诉兼容的 coding agent 应在何时、如何初始化 Testkit，怎样选择 quick 或 full 生命周期覆盖，如何解释证据，以及如何守住 Docker 信任边界。它和 DSH 原生 bundle 在宿主提供可选 Skills service 时注册的 Skill 来自同一个类型化定义。

规范文件也随 npm 包发布，可通过 `dsh-testkit/skills/dsh-testkit/SKILL.md` 子路径访问。Skill 让 Agent 更稳定地使用 Testkit，但不会授予执行不受信任代码的权限，也不能替代人工审核或认证插件。

## DSH 原生工具

DSH Testkit 还提供一个可选的、由社区维护的 DSH-native Profile Bundle：

```bash
dsh plugin --profile web add dsh-testkit@0.3.1
dsh --profile web --dump-config
```

该 bundle 注册 `dsh_test`，它只是同一个生命周期引擎的薄 adapter。工具默认测试当前 workspace，要求 `confirm: true`，始终使用 Docker，忽略仓库中的隐式配置，拒绝 workspace 之外的路径，也不暴露 unsafe-local 执行和任意 CLI 参数。

当 DSH 已经健康运行时，这种入口更方便。外部 CLI 或 CI Action 仍应作为独立的恢复和发布门禁，因为宿主在 tool 注册前就启动失败时，宿主内工具无法诊断自己。

## 社区验证

维护者可以在明确确认信任边界后，对精确版本的公开插件运行 cohort：

```bash
pnpm exec dsh-test-community \
  --acknowledge-untrusted-code \
  --dsh 0.1.0-rc.6 \
  --plugin example-plugin@1.2.3 \
  --output /tmp/dsh-testkit-cohort
```

Runner 会从子进程中移除模型、npm、GitHub、云平台和 Docker registry 凭证。带名称的详细报告只保存在本地，另行生成不含插件身份的聚合摘要，用于负责任的公开报告。

[v0.2.1 社区验证报告](docs/community-validation.md)记录了样本选择方法、聚合证据、限制条件和由此形成的产品决策。

## 安全边界

插件是可执行代码：生命周期测试会运行 package script 和 runtime 代码。Docker 可以缩小默认影响范围，但它**不是经过强化的恶意代码沙箱**。测试未知代码时应使用一次性基础设施；绝不能对不受信任的插件使用 `--runner local --unsafe-local`。

原生工具需要访问 Docker daemon，并可能在 runner 内执行具有网络访问能力的 package script。确认执行是一项信任决策，不是安全认证。私有插件始终留在 CI runner；DSH Testkit 不依赖 SaaS，也不会上传源码或凭证。

更多信任边界见[架构说明](docs/architecture.md)，私密漏洞报告流程见[安全策略](SECURITY.md)。

## 参与贡献

高质量故障报告应包含精确插件版本、DSH 版本、失败阶段、`report.json` 和脱敏日志。请先阅读[贡献指南](docs/contributing.md)，再使用 lifecycle-failure issue 模板提交可复现的宿主行为。

可以在 DeepSeek Harness 官方 [Show & Tell 讨论](https://github.com/deepseek-ai/deepseek-harness/discussions/2038)了解项目并加入首批维护者协作。

DSH Testkit 是独立、非官方的社区项目，采用 [MIT License](LICENSE) 发布。
