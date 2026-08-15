# DSH Lifecycle Runner Research

Version: v0.1
Status: Current_Snapshot
Last updated: 2026-08-15
Source: DSH 官方文档、社区仓库源码和成熟插件生态官方测试文档

## 1. Naming Decision

### Selected Name

- Project: **DSH Testkit**
- Repository: `dsh-testkit`
- CLI: `dsh-test`
- npm candidate: `dsh-testkit`
- Tagline: `Real-host lifecycle testing for DSH plugins.`

截至 2026-08-15，`dsh-testkit` 未发现同名 GitHub 仓库，npm 包名查询也未返回已发布包。可用性检查不是名称预留，创建公开仓库和发布包时必须再次确认。

### Alternatives

| 名称 | 判断 |
|---|---|
| `dsh-plugin-test` | 最准确但更像命令描述，不利于承载 fixture SDK、runner 和 reporter |
| `dsh-lifecycle-testkit` | 范围准确但过长，CLI 和口头传播成本高 |
| `dsh-verify` | 已有同名 GitHub 仓库，并且 `verify` 容易暗示全面验证或认证 |
| `dsh-crucible` | 品牌感强但含义不直观，也不利于搜索 DSH plugin testing |
| `dsh-doctor` | 更像环境诊断和修复工具，不能表达发布产物生命周期测试 |

`DSH Testkit` 同时满足可检索、可解释、不过度承诺和可扩展四个条件。CLI 使用更短的 `dsh-test`，保持一次命令体验。

## 2. Direct DSH Landscape

以下为 2026-08-14 至 2026-08-15 源码快照：

| Project | Implemented | Boundary |
|---|---|---|
| [dsh-plugin-check](https://github.com/omdsh-dev/dsh-plugin-check) | 33 项 manifest、patch、构建陷阱和 Hub 静态检查 | 明确只读，不构建或执行被检查插件 |
| [dsh-suite](https://github.com/whyihaveyou/dsh-suite) | 目录、脚手架和 peer dependency comparison | `compat-check.mjs` 中 install 和 config assembly 标记为尚未实现 |
| [awesome-dsh-plugins](https://github.com/AdamPlatin123/awesome-dsh-plugins) | 自动发现、静态证据和少量运行记录 | 目录和证据分发层，不是通用 lifecycle runner |
| [dsh-tool-chaos](https://github.com/cyanseek/dsh-tool-chaos) | Tool pipeline deny、error、delay、abort 和 block | 测运行韧性，不测安装、更新、卸载和恢复 |
| [dsh-harness-ops](https://github.com/fakechris/dsh-harness-ops) | 实例快照、升级验证、watchdog 和 rollback | 面向 DSH 运维实例，不是插件作者发布 CI |
| [dsh-recovery-proof](https://github.com/dongsheng123132/dsh-recovery-proof) | 只读恢复证据验证 | 不创建 checkpoint 或执行恢复 |

当前没有发现完成 install、assemble、boot、register、exercise、update、uninstall、reboot、recover 和 residue 全链路的独立执行器。

## 3. Mature Ecosystem Evidence

| Ecosystem | Official Tool | Relevance |
|---|---|---|
| VS Code | [Testing Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension) | 下载指定 VS Code，在 Extension Development Host 中执行真实集成测试 |
| Grafana | [Plugin E2E](https://grafana.com/developers/plugin-tools/e2e-test-a-plugin/get-started) | 启动真实 Grafana，并在 CI 中测试支持版本矩阵 |
| JetBrains | [Plugin Verifier](https://plugins.jetbrains.com/docs/intellij/verifying-plugin-compatibility.html) | 在 CI 和 Marketplace 检查插件与多个 IDE build 的兼容性 |
| Jenkins | [Plugin Compatibility Tester](https://github.com/jenkinsci/plugin-compat-tester) | 生成插件相对 Jenkins Core 的兼容矩阵 |
| WordPress | [Plugin Check](https://github.com/WordPress/plugin-check) | 组合静态检查与宿主中的 runtime checks |

共同规律：宿主专用测试工具在生态规模和版本变化增加后成为插件作者、市场和宿主维护者共享的基础设施。成功形态通常是开源 CLI、脚手架默认测试和市场门禁，而不是独立 SaaS。

## 4. DSH-Specific Need

DSH [官方 README](https://github.com/deepseek-ai/deepseek-harness)明确说明当前为 Developer Preview，并会发生兼容性破坏。其[架构文档](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md)将运行实例定义为在 boot 时组合的插件树；插件向共享 Cordis context 注册 service、event 和 reversible effect。

官方[插件发布文档](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)表明，插件通过 `dsh plugin` 进入 profile，Git 安装和包管理生命周期可能执行代码。配置合法、peer range 匹配和源码静态检查都不能证明发布产物能真实安装、启动、卸载和恢复。

DSH Testkit 的机会来自三种关系：

1. 插件作者需要发布前真实宿主测试。
2. 市场和企业 Catalog 需要独立于作者声明的准入证据。
3. DSH 维护者需要树外插件发现生命周期回归。

## 5. Positioning Boundary

```text
Static Scanner -------- source and manifest risks
MCP Conformance ------- protocol behavior
Model/Skill Eval ------ probabilistic task quality
Chaos Tool ------------ tool pipeline resilience
DSH Testkit ----------- deterministic real-host plugin lifecycle
Catalog/Marketplace --- discovery, policy and distribution
```

项目可以调用相邻工具并汇总证据，但不复制其判断引擎。

## 6. Opportunity Test

项目从原型升级为长期独立开源项目，需要同时满足：

1. 对 10 个真实插件完成可复现运行。
2. 找到至少 3 个静态检查无法发现的生命周期问题。
3. 获得至少一个插件作者、目录、市场或 DSH 维护者的 CI 采用。
4. DSH 变化可以通过薄 adapter 维护。
5. 场景和 fixture 对 DSH 上游具有直接贡献价值。

未满足时，优先把有价值的用例贡献给 DSH，而不是扩张到市场、模型评测或通用 Harness 标准。

## 7. Enterprise Relationship

企业内部 DSH Catalog 是真实需求，但不是首版产品范围。合理关系是：

```text
Private Git + CI
      |
DSH Testkit lifecycle evidence
      |
Approved immutable artifact
      |
Enterprise Catalog release channel
      |
Product-specific DSH profile
```

Catalog 复用 Git、制品库、身份、签名和通用 Registry；DSH Testkit 只提供确定性的准入证据。

## 8. Primary Sources

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
- [DSH Architecture](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md)
- [DSH Plugin Publishing](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)
- [dsh-plugin-check](https://github.com/omdsh-dev/dsh-plugin-check)
- [dsh-suite compatibility source](https://github.com/whyihaveyou/dsh-suite/blob/main/scripts/compat-check.mjs)
- [VS Code extension testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [Grafana plugin E2E](https://grafana.com/developers/plugin-tools/e2e-test-a-plugin/ci)
- [JetBrains Plugin Verifier](https://plugins.jetbrains.com/docs/intellij/verifying-plugin-compatibility.html)
- [Jenkins Plugin Compatibility Tester](https://github.com/jenkinsci/plugin-compat-tester)
