# DSH Testkit Product Design Contract

Version: v0.1
Status: Confirmed
Source: 2026-08-14 至 2026-08-15 用户讨论、DSH 生态调研与竞品源码核查
Last updated: 2026-08-15
Review: User authorized continuation after SSOT review on 2026-08-15

## 1. 产品定位

DSH Testkit 是面向 DeepSeek Harness 插件的开源真实宿主生命周期测试工具。它在一次性环境中执行插件的标准发布路径，并把安装、配置组装、启动、注册、最小调用、更新、卸载、重启、恢复和副作用转化为可复现证据。

它解决的核心问题是：静态合法、依赖范围看似兼容或作者本机可用，都不能证明插件发布产物能在指定 DSH 版本中可靠安装、运行和移除。

产品名为 **DSH Testkit**，仓库名为 `dsh-testkit`，CLI 为 `dsh-test`。名称不使用 `verify`、`certify` 或 `conformance`，避免把有限场景结果表达为官方认证。

## 2. 目标用户

- DSH 插件作者：在本地和 PR 中发现发布前生命周期故障。
- 社区目录和插件市场维护者：以相同执行标准决定收录、兼容标记和撤销。
- DSH 维护者：用树外真实插件发现宿主生命周期回归。
- 企业 DSH 平台团队：把测试结果作为内部 Catalog 的准入和升级门禁。

普通 DSH 终端用户不是首版直接用户，但会从更可靠的插件和可复现故障报告中受益。

## 3. User Stories And Scenarios

### US-001: 插件作者在发布前验证真实安装

As a DSH plugin author, I want to test the packed artifact against a real DSH version, so that I can catch failures that unit tests and repository linting miss.

Scenario:
1. 作者在插件仓库运行 `dsh-test . --dsh 0.1.0-rc.6`。
2. 工具打包或解析插件，在一次性 profile 中安装并启动 DSH。
3. 工具显示每个生命周期阶段的结果，并输出可供 CI 使用的报告。

### US-002: 市场维护者执行统一准入

As a plugin catalog maintainer, I want a machine-readable lifecycle verdict tied to immutable versions, so that catalog status does not depend on author self-declaration.

Scenario:
1. Catalog CI 把插件 commit、制品 digest 和目标 DSH 版本传入 Testkit。
2. Testkit 执行批准的场景集合。
3. Catalog 保存 JSON/JUnit 证据，并据此更新 pilot、compatible 或 blocked 状态。

### US-003: DSH 维护者定位宿主回归

As a DSH maintainer, I want to run representative external plugins across DSH builds, so that I can identify the first host version that breaks their lifecycle.

Scenario:
1. 维护者指定一组插件和多个 DSH 版本或 commit。
2. Testkit 为每个组合运行相同场景。
3. 结果矩阵指出首个失败版本和失败阶段。

### US-004: 企业平台团队控制内部发布

As an enterprise platform owner, I want the same test gate for private Git plugins, so that only reproducible, approved artifacts enter product profiles.

Scenario:
1. 私有仓库在 self-hosted CI runner 构建不可变制品。
2. Testkit 在企业隔离环境中运行，不上传源码和 Secret。
3. Catalog 只接收脱敏结果、版本身份和证据引用。

### US-005: 插件损坏时验证恢复路径

As a plugin user or maintainer, I want to know whether a failed plugin can be disabled or removed without rebuilding my environment, so that plugin failures remain recoverable.

Scenario:
1. Testkit 安装一个在 boot 或 registration 阶段故意失败的 fixture。
2. 工具执行预定义恢复动作。
3. DSH 再次启动，报告保留故障、恢复和残留证据。

## 4. 核心用户旅程

1. 用户提供本地目录、tarball、npm spec 或固定 Git ref。
2. 用户选择 DSH 版本和 suite；默认使用 quick suite。
3. Testkit 校验输入，创建隔离 runner、DSH home、profile 和 workspace。
4. Runner 解析并安装指定 DSH 和插件发布产物。
5. DSH adapter 执行配置组装、boot、注册探针和确定性最小调用。
6. Runner 执行更新、卸载、重启和恢复场景，并观察外部副作用。
7. Testkit 输出终端摘要、JSON、JUnit 和可选 Markdown 支持包。
8. CI 根据稳定退出码决定通过、失败、flaky、基础设施错误或不支持。

## 5. Functional Requirements

- FR-001: CLI 必须接受本地目录、tarball、npm package spec 和固定 Git ref 作为插件输入。
- FR-002: 用户必须能选择精确 DSH npm 版本或固定源码 commit；报告不得只记录 `latest`。
- FR-003: 每次运行必须创建独立的 DSH home、profile、workspace、端口和临时目录。
- FR-004: Testkit 必须通过 DSH 标准插件入口执行安装，并记录命令、退出状态、耗时和脱敏输出。
- FR-005: Testkit 必须执行配置组装检查，并验证目标 bundle 或 row 出现在有效配置中。
- FR-006: Testkit 必须启动真实 DSH 宿主，区分正常退出、boot failure、timeout 和 crash。
- FR-007: v0.1 场景必须能声明预期配置 row、Cordis service 和 tool schema，并通过配置输出或同进程确定性探针断言；command 和 event listener 只在 DSH 提供稳定公开枚举接口后进入范围。
- FR-008: baseline suite 必须在不调用模型的情况下完成至少一个最小能力 exercise。
- FR-009: Testkit 必须支持从旧插件版本更新到新版本，并检测旧配置或状态污染。
- FR-010: Testkit 必须卸载插件、重启相同 profile，并检查依赖、bundle layer、配置 row、进程、端口和文件残留。
- FR-011: Testkit 必须支持 boot failure 和 registration failure fixture，并验证禁用、移除或恢复路径。
- FR-012: Runner 必须记录 profile 和 workspace 文件变化、阶段边界的进程与监听端口快照，并在报告中声明 observer coverage。网络尝试和假 Secret canary 仅在 runner 提供对应 observer 时作为强断言；缺少 observer 必须标记 `unsupported`，不得默认为通过。
- FR-013: Testkit 必须输出带 schema version 的 JSON、JUnit XML、终端摘要和可选 Markdown 报告。
- FR-014: 场景必须采用声明式、可版本化格式，并支持项目内配置与 CLI 覆盖。
- FR-015: 每份结果必须包含插件版本、插件 digest 或 commit、DSH 版本或 commit、Testkit 版本、suite 版本、OS、架构、Node 版本和 runner 镜像身份。
- FR-016: CLI 必须提供稳定退出码，区分 test failure、flaky、unsupported、invalid input 和 infrastructure failure。
- FR-017: Runner 中断、超时或宿主崩溃后，Testkit 必须尽力收集阶段证据并清理临时资源。
- FR-018: 用户必须能重跑单个失败 case，并使用同一环境指纹生成复现命令。

## 6. Non-Functional Requirements

- NFR-001 Determinism: baseline suite 不依赖模型选择或外部生成式 API；相同输入连续五次应产生一致 verdict。
- NFR-002 Reproducibility: 所有通过和失败结果必须绑定不可变插件、宿主、suite 和 runner 身份。
- NFR-003 Isolation: 默认执行路径不得在用户主机进程中直接加载被测插件；不安全本机模式必须显式启用并记录。
- NFR-004 Security: Testkit 不读取真实用户 Secret；日志和支持包落盘前必须脱敏。
- NFR-005 Performance: quick suite 在 warm Linux CI runner 上以 10 分钟为预算，并显示分阶段耗时。
- NFR-006 Reliability: 中断和失败不得将测试 profile、子进程或监听端口遗留在宿主环境。
- NFR-007 Compatibility: DSH 版本差异封装在 adapter，报告 schema 不随单个 DSH 版本变化。
- NFR-008 Observability: 每个 case 必须记录开始、结束、阶段、断言、耗时和证据引用。
- NFR-009 Portability: 首版支持 Linux CI；架构不得阻止后续 macOS 和 Windows runner。
- NFR-010 Usability: 常规插件 quick suite 只要求插件路径和 DSH 版本，不要求用户编写测试代码。
- NFR-011 Offline support: 除获取显式依赖外，测试判断不依赖中央 SaaS；私有仓库可完全在 self-hosted runner 运行。
- NFR-012 Schema stability: 机器输出和退出码的破坏性变化必须升级 schema 或主版本并提供迁移说明。

## 7. 功能范围

### v0.1 范围

- Linux 一次性 runner。
- local、tarball、npm 和 pinned Git 输入。
- 指定精确 DSH npm 版本；固定源码 commit 和 nightly adapter 属于后续兼容入口。
- install、assemble、boot、register、exercise、update、uninstall、reboot、recover 和 cleanup 阶段。
- 正常、boot failure、registration failure、dirty uninstall 四类自有 fixture；observer fixture 用于证明支持的文件、进程、端口、网络和 canary 检测能力。
- quick suite、至少五次独立执行并检测 flaky 的 full suite、声明式自定义 case、单 case 重跑。
- 终端、JSON、JUnit 和 Markdown 输出。
- GitHub Action 和普通 CI 可调用的非交互 CLI。

### 后续候选

- macOS 和 Windows runner。
- 多 DSH 版本矩阵与首个失败版本定位。
- Catalog compatibility feed 和徽章数据源。
- 更强的网络、文件和系统调用 observer。
- 与现有静态扫描、故障注入和 MCP Conformance 工具组合。

## 8. 非目标

- 不定义跨 Harness 的插件、Skill 或 MCP 公共标准。
- 不测试模型质量、Skill 激活概率或任务效果。
- 不宣称插件绝对安全，也不取代安全审计。
- 不复制 `dsh-plugin-check` 一类静态仓库扫描器。
- 不重复实现 MCP 协议 Conformance。
- 不建设插件市场、搜索、排行榜、SSO、审批门户或企业 Inventory。
- 不成为新的包管理器；安装始终调用 DSH 和现有包管理入口。
- v0.1 不提供 Web UI。

## 9. Edge Cases

- 插件 manifest 合法，但打包产物遗漏入口、patch 或类型文件。
- Git 或 npm 安装触发 `prepare`、postinstall、网络访问或额外子进程。
- peer dependency 范围通过，但运行时存在两个 Cordis 副本或内部 API 漂移。
- 配置组装成功，但 boot 阶段同步或异步抛错。
- 插件已注册部分能力后失败，导致半完成状态。
- 插件最小调用完成，但留下进程、端口、定时器或文件。
- 更新失败后新旧版本混合，或 lockfile 与 profile layer 不一致。
- 卸载命令成功，但 bundle、row、依赖或持久状态仍然存在。
- 插件使默认 profile 无法启动，需要 safe profile 或外部禁用路径。
- 依赖下载、Registry 或网络暂时不可用，与确定性插件失败混淆。
- DSH 版本不受当前 adapter 支持。
- Runner 被 SIGINT、超时、磁盘不足或容器终止。
- 日志中包含 Secret、Token、企业路径或源码片段。

## 10. 约束与假设

- DSH 处于 Developer Preview，存在高频破坏性变更。
- 普通 DSH 插件属于可执行代码，安装脚本和宿主加载均可能产生本机副作用。
- 首版优先使用 DSH 公开 CLI、profile 和 dump-config 行为；必要内部探针必须版本隔离。
- baseline 测试只覆盖确定性宿主行为，不引入模型变量。
- 公开 CI 使用一次性 Linux runner；企业私有源码可使用相同 CLI 和 self-hosted runner。
- 项目采用 MIT License，与 DSH 和主要社区工具保持低摩擦兼容。
- 技术栈、模块布局和 runner 实现由 Product Design 批准后的 TDR 决定。

## 11. 数据与集成需求

- 插件源码目录、tarball、npm package spec 或固定 Git ref。
- DSH npm 版本、源码 commit 或预构建宿主入口。
- Node.js、DSH CLI 和可用的一次性 runner 后端。
- 可记录的临时文件系统、网络代理或 observer、进程树和端口信息。
- GitHub Actions、GitLab CI 或其他能执行 CLI 并读取 JUnit/JSON 的 CI。
- 可选的 Catalog 消费方只读取脱敏结果，不是 Testkit 的运行依赖。

## 12. Success Criteria

- SC-001: v0.1 能对至少 10 个真实社区插件完成 quick suite，并公开绑定版本的结果。
- SC-002: v0.1 复现至少 3 个静态扫描或普通单元测试无法发现的真实生命周期问题。
- SC-003: 至少一个外部插件作者、社区目录、市场或 DSH 维护者在 CI 中试用 Testkit。
- SC-004: 相同输入在同一 runner 连续五次运行的 verdict 一致率达到 100%；不一致均被标记为 flaky。
- SC-005: 所有故意损坏 fixture 都在预期阶段失败，且不会被误报为 infrastructure failure。
- SC-006: quick suite 的失败摘要能在首屏指出阶段、断言、目标版本和复现命令。
- SC-007: DSH 次版本变化可通过 adapter 修改吸收，不要求改动 scenario model 和 report schema。
- SC-008: runner 完成、失败或被中断后，不在测试宿主留下由本次运行创建且被当前 observer 覆盖的活动子进程、监听端口或可启动 profile；报告明确未覆盖的资源类型。
- SC-009: 至少一个企业私有 Git 仓库能在不上传源码和真实 Secret 的情况下运行相同 suite。
- SC-010: DSH 官方实现等价能力时，场景和 fixture 能被上游直接采用，而不是只能依赖项目私有服务。

## 13. 验收标准

- 从干净环境安装 CLI 后，一条命令可以对示例插件运行 quick suite。
- 正常 fixture 通过 install 至 cleanup 的全部阶段。
- boot failure、registration failure 和 dirty uninstall fixture 分别在预期阶段失败。
- 一次失败运行生成终端摘要、JSON、JUnit 和复现命令。
- JSON 报告包含 FR-015 定义的完整环境指纹。
- baseline suite 在没有模型 API Key 和真实 Secret 的环境中运行。
- 被中断运行完成可观察资源清理，并明确报告证据完整性与 observer coverage。
- GitHub Action 能将 JUnit 结果显示为 PR check，并保存支持包 artifact。
- 10 个真实插件测试结果中至少形成 3 个可提交给插件作者或 DSH 上游的可复现问题。

## 14. Clarifications

- Q: 项目是否以付费或商业化为目标？
  A: 否。目标是成为高影响力开源基础设施，采用和上游价值优先于收入。
- Q: 是否做跨 OpenAI、Anthropic、MCP 和 DSH 的统一契约？
  A: 否。首版只测试 DSH 自己可观察、确定性的插件生命周期。
- Q: 是否包含模型效果和 Skill 激活评测？
  A: 否。模型行为是非确定性评测问题，不属于 lifecycle verdict。
- Q: 企业插件市场是否属于本项目？
  A: 否。企业 Catalog 是真实需求和重要消费者，但首版 Testkit 不实现市场控制面。
- Q: DSH 官方吸收项目能力是否算失败？
  A: 否。进入官方脚手架、CI 或测试仓库是项目成功路径之一。
- Q: 为什么不直接扩展现有静态检查器？
  A: 真实宿主执行需要隔离 runner、生命周期状态机和恢复语义，与只读扫描器的安全模型和架构边界不同；Testkit 可以组合其结果而不复制规则。

## 15. 开放问题

None blocking product review. 技术栈、runner 后端、模块布局和首批 DSH adapter 版本属于 TDR 决策，在本 Product Design 获得明确批准后处理。

## 16. User Review Gate

- Approval: Approved on 2026-08-15
- Reviewer notes: 用户批准名称，并明确要求完成 SSOT review 后继续交付。Review 将不稳定的 command/event 枚举移出 v0.1，并把副作用断言改为 capability-aware，避免未观测即通过。
