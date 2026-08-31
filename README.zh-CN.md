<div align="center">

# DSH Testkit

**DeepSeek Harness 插件的真实宿主发布门禁。**

[English](README.md) · [场景参考](docs/scenarios.md) · [架构](docs/architecture.md) · [参与贡献](docs/contributing.md)

[![CI](https://github.com/iiwish/dsh-testkit/actions/workflows/ci.yml/badge.svg)](https://github.com/iiwish/dsh-testkit/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/dsh-testkit?color=cb3837)](https://www.npmjs.com/package/dsh-testkit)
[![Node.js](https://img.shields.io/node/v/dsh-testkit)](package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-0b7285)](LICENSE)

</div>

一个插件可能已经通过编译和单元测试，发布后却因为 tarball 缺文件、bundle 没有在 DSH 注册，或卸载后破坏 profile 而失败。DSH Testkit 补上这段验证空白：用用户实际安装的制品，对精确版本的真实 DSH 宿主执行生命周期，并保留维护者可以复核的证据。

整个过程不调用模型，也不需要模型 API Key。

## 一眼看懂

| 发布问题 | 一次隔离运行提供的证据 |
|---|---|
| 可发布制品能否安装并注册？ | `npm pack`、精确 DSH 安装、bundle assemble、配置 row、service 和 tool schema |
| 对外承诺的行为是否可用？ | 确定性 runtime probe、声明的 tool 调用、可选 loopback HTTP route 和显式 browser smoke |
| 用户能否干净移除它？ | 卸载、同 profile 重启、能力检查、归属路径残留、进程和端口 |

DSH Testkit 适合插件维护者、release PR 审核者、插件模板维护者，以及需要可复现宿主级故障报告的协作者。它的定位是发布门禁，不是另一套单元测试框架、静态 linter、模型输出评测或安全认证。

## 快速开始

运行要求：Node.js 22 或更高版本，以及 Docker。

```bash
pnpm add -D dsh-testkit
pnpm dsh-test init
pnpm dsh-test
```

如果 bundle 位于仓库子目录：

```bash
pnpm dsh-test init plugin/
pnpm dsh-test --config plugin/dsh-testkit.yaml
```

`dsh-test init` 离线运行，识别最近的 Git worktree，并生成三个可审核文件：

- `<plugin-root>/dsh-testkit.yaml`：固定精确 DSH 版本和自动识别的 row 预期
- `<repository-root>/.github/workflows/dsh-lifecycle.yml`：默认使用只读 token，并引用正确的嵌套路径
- `<repository-root>/.agents/skills/dsh-testkit/SKILL.md`：让兼容的 coding agent 使用同一发布门禁

导出的源码树没有 `.git` 时，请显式传入 `--repo-root .`。生成过程字节幂等，并在写入前检查全部目标；除非显式使用 `--force`，任一冲突都会停止全部写入。请审核检测到的 row，只添加插件契约明确承诺的 service、tool、exercise 和 update 行为。

Docker 是默认 runner。报告写入 `.dsh-testkit/runs/`，包括规范 `report.json`、CI 可消费的 `junit.xml`、便于阅读的 `report.md`、脱敏命令日志和有大小边界的阶段证据。

## 它在工具链中的位置

DSH 质量需要多种互补检查：

| 需求 | 合适的工具 |
|---|---|
| 作者侧 manifest、patch、build 和 pack 预检 | [dsh-plugin-doctor](https://github.com/zoahdev/dsh-plugin-doctor) |
| 用户侧 profile、session 和环境离线诊断 | [moonquake2004/dsh-doctor](https://github.com/moonquake2004/dsh-doctor) |
| 多个 bundle 在 composition 阶段发生冲突 | `dsh-composition-check` |
| 插件自身逻辑 | 你的单元和集成测试框架 |
| 打包制品在真实宿主上的安装、启动、行为、移除、恢复和残留 | **DSH Testkit** |

实用的流水线会在每次提交运行低成本静态检查，在 release PR 和 tag 上运行 DSH Testkit。Testkit 每个隔离生命周期只测试一个目标插件；多插件的状态归属和更新顺序仍属于 composition 问题。

## 生命周期

```text
resolve -> install-dsh -> package -> install-plugin -> assemble -> boot -> register
        -> exercise -> update? -> uninstall -> reboot -> recover? -> cleanup
```

当前 adapter 接受精确的 `@deepseek-ai/dsh` 版本：`0.1.1-rc.2`（默认）、`0.1.0-rc.8`、`0.1.0-rc.7` 和 `0.1.0-rc.6`。未知版本会在创建 runner 前以退出码 `4` 停止，避免把宿主漂移误报成插件故障。

官方 `dsh-v0.1.2-alpha.1` release 仍处于待发布 canary，因为 npm 没有对应包；`@deepseek-ai/dsh@0.1.2-alpha.2` 已可用，只进入一次性 canary matrix。两个 alpha 都不属于默认支持矩阵；正式支持仍需要经过审核的 adapter 变更与真实宿主证据。

### 通过意味着什么

- 报告中标识的同一个打包制品完成了所有必需阶段。
- row 来自 DSH `--dump-config`；service 和 tool schema 来自进程内 Cordis probe。
- 声明的 exercise 通过真实 tool runtime 执行，不依赖模型选择。
- 卸载后同一 profile 能重启，并且不存在目标 bundle、能力或可归属残留。
- 必需 observer 均可用；缺少必需覆盖时返回 `unsupported`，不会伪造通过。

通过不能证明任意可执行代码安全、模型输出质量良好，也不能证明未声明的行为有效。

## 场景即代码

`dsh-test init` 会生成一个小而明确的起始场景：

```yaml
schemaVersion: 1
name: my-plugin-quick
subject:
  source: .
dsh:
  version: 0.1.1-rc.2
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

本地目录类型的目标以只读方式挂载，复制到 runner 自己的可写根目录后再打包。存在 `prepare`、`prepack` 或 `postpack` 时，Testkit 会在副本中按照 `packageManager` 和 lockfile 恢复依赖，再执行 `npm pack`；原始 checkout 不会被修改。

检查公开 DSH web route 时，请设置 `profile: web` 并添加仅 Docker 可用的断言：

```yaml
profile: web
http:
  routes:
    - id: health
      path: /health
      expect:
        status: 200
        json:
          status: ok
          version: $subject.packageVersion
```

[场景参考](docs/scenarios.md)包含 `http.routes`、update 目标、预期失败和恢复、阶段重跑、observer 策略、覆盖整次尝试的 watchdog，以及显式 `dsh web` TurnStatus browser smoke。HTTP 和浏览器流量只访问 runner 分配的 `127.0.0.1`。缺少 Chromium 时返回 `unsupported`；已经存活但永久无响应的 DSH web 宿主或 watchdog 到期属于 host/infrastructure，不归为插件失败。

## 最小权限 CI

生成的 workflow 默认只需要只读 token，并显式写出该契约：

```yaml
permissions:
  contents: read

steps:
  - uses: iiwish/dsh-testkit/.github/actions/dsh-test@v0
    with:
      plugin: .
      dsh-version: 0.1.1-rc.2
      config: dsh-testkit.yaml
      publish-junit-check: 'false'
```

默认模式会把 JUnit annotation 写入 job，上传完整证据目录，并输出 artifact ID、URL、digest、报告路径和稳定退出码；它不会调用 Checks API。

受信任的 push 或 release workflow 可以选择发布命名 JUnit Check：

```yaml
permissions:
  contents: read
  checks: write

steps:
  - uses: iiwish/dsh-testkit/.github/actions/dsh-test@v0
    with:
      plugin: .
      dsh-version: 0.1.1-rc.2
      publish-junit-check: 'true'
```

不要在不受信任的 fork pull request 上启用该选项。项目引用的外部 Action 全部固定到不可变 commit；滚动 `v0` tag 是消费者兼容通道。GitHub Enterprise Server 和其他 CI 可以直接调用 CLI。

稳定退出码为：`0` 通过、`1` 生命周期失败、`2` 输入无效、`3` 基础设施错误、`4` 不支持、`5` 结果不稳定。已发布 schema 位于 `dsh-testkit/schemas/report-v1.json` 和 `dsh-testkit/schemas/scenario-v1.json`。

## 原生入口与 Agent Skill

项目级 Skill 和导出的 `dsh-testkit/skills/dsh-testkit/SKILL.md` 会告诉兼容 Agent 如何选择覆盖、解释证据并守住 Docker 边界。Skill 只指导使用，不授予信任，也不替代审核。

DSH Testkit 还提供可选的、由社区维护的 DSH Profile Bundle：

```bash
dsh plugin --profile web add dsh-testkit@0.4.1
dsh --profile web --dump-config
```

它注册 `dsh_test`，作为同一引擎的需确认、仅 Docker adapter。外部 CLI 或 CI Action 仍是独立恢复门禁，因为宿主内工具无法诊断发生在 tool 注册之前的宿主故障。

## 安全与信任边界

插件是可执行代码：生命周期会运行 package script 和 runtime 代码。Docker 通过只读根文件系统和源码挂载、一次性可写状态、移除 capabilities、资源限制和证据大小边界来缩小默认影响范围，但它**不是经过强化的恶意代码沙箱**。

测试未知代码时请使用一次性基础设施。绝不能对不受信任的插件使用 `--runner local --unsafe-local`。原生工具需要访问 Docker daemon，确认执行是一项信任决策，不是认证。私有插件源码始终留在 runner 上；DSH Testkit 不依赖 SaaS，只上传 CI workflow 明确配置的证据。

[架构说明](docs/architecture.md)记录完整信任边界；私密漏洞请按[安全策略](SECURITY.md)报告。

## 社区

[社区验证协议](docs/community-validation.md)定义了无凭证、精确版本的 cohort 运行和仅聚合公开报告。[dsh-shelf 案例](docs/case-study-dsh-shelf.md)说明为什么“安装成功”不足以证明真实宿主注册成功。[设计伙伴复测门禁](docs/design-partner-follow-up.md)记录不可变包基线，避免把只存在于源码的修复写成 package 复测结论。

有效的故障报告应包含精确插件版本、DSH 版本、失败阶段、`report.json` 和脱敏日志。请从[贡献指南](docs/contributing.md)开始，或加入 DeepSeek Harness 官方 [Show & Tell 讨论](https://github.com/deepseek-ai/deepseek-harness/discussions/2038)。

DSH Testkit 是独立、非官方的社区项目，采用 [MIT License](LICENSE) 发布。
