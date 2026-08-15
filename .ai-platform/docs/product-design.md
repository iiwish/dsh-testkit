# DSH Testkit Product Design Contract

Version: v0.3.0
Status: Confirmed
Source: 2026-08-14 至 2026-08-15 用户讨论、DSH 生态调研与竞品源码核查
Last updated: 2026-08-16
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

### US-006: DSH 用户在宿主内发起插件测试

As a DSH user, I want to invoke Testkit as a native DSH tool, so that I can test the current plugin workspace without leaving the DSH workflow.

Scenario:
1. 用户通过 `dsh plugin --profile <name> add dsh-testkit` 安装 DSH 原生 bundle 形态。
2. DSH 注册 `dsh_test` tool；用户明确确认后，tool 以当前 workspace 为默认输入。
3. Testkit 仍只通过 Docker runner 加载和执行被测插件，并返回 verdict、摘要和证据路径。

### US-007: AI 插件维护者获得可复核的社区与版本证据

As an AI-assisted plugin maintainer, I want one reproducible real-host gate across public plugins and DSH release candidates, so that generated code is judged by lifecycle evidence rather than the generating agent's confidence.

Scenario:
1. 维护者在不携带模型密钥、npm token 或用户 Docker 凭证的一次性环境中，对精确版本的社区插件运行 quick suite。
2. 公开报告仅声明已执行的环境、阶段、聚合 verdict 和发现类型；未复现并通知维护者的单一插件失败不做命名披露。
3. 新 DSH dist-tag 出现时，自动化先识别未支持版本，再在一次性 CI checkout 中运行 canary lifecycle matrix，不放宽已发布 CLI 的支持声明。

### US-008: 插件作者和开发 Agent 一键接入生命周期门禁

As a DSH plugin author or coding agent, I want one deterministic initialization command and a discoverable project skill, so that real-host lifecycle testing becomes part of the repository workflow before review and release.

Scenario:
1. 作者或 Agent 在已有 DSH bundle 仓库运行 `dsh-test init`。
2. Testkit 从 package manifest 和结构化 patch 中识别 bundle 与可确定的 row，不猜测 service 或 tool。
3. 命令生成声明式场景、GitHub Actions workflow 和项目级 `dsh-testkit` Skill；已有非等价文件不会被静默覆盖。
4. DSH 原生 bundle 在 `skills` service 可用时注册同一份运行时 Skill，使宿主内 Agent 能发现何时以及如何调用 `dsh_test`。

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
- FR-019: npm 包必须声明 DSH 规范的 `dsh.bundle.patch`，并通过 Cordis row 在 DSH profile 中注册 `dsh_test` tool。
- FR-020: `dsh_test` 必须复用同一个生命周期引擎，强制 Docker runner，不暴露 `--unsafe-local`、任意输出目录或可变来源开关。
- FR-021: `dsh_test` 必须要求显式执行确认，将本地输入限制在当前 workspace 的真实路径内，并把 DSH 取消信号传递到所拥有的 runner 进程。
- FR-022: tool 结果必须是有界的结构化值，至少包含退出码、verdict、运行目录、报告路径、摘要和诊断；完整证据保存在 Testkit 运行目录。
- FR-023: 英文 `README.md` 与简体中文 `README.zh-CN.md` 必须共享定位、支持版本、安装命令、生命周期、安全边界和文档入口。
- FR-024: README 必须明确区分 Testkit 与单元测试、plugin doctor/preflight 和 composition check，不抢占静态诊断或市场定位。
- FR-025: 社区验证工具必须只接受精确 npm 版本，强制 Docker，从子进程环境移除凭证，输出不包含插件名称的聚合报告，并保留本地详细证据供复核。
- FR-026: 仓库必须定期读取 npm 的 DSH `latest`/`next` dist-tag，并将未进入支持注册表的精确版本作为可机器消费的 canary matrix 输入。
- FR-027: Canary 可在一次性 CI checkout 中临时启用候选 DSH 版本并运行真实宿主测试，但不得修改发布包的支持列表或将 canary 通过宣称为正式支持。
- FR-028: v0.2.1 必须从受保护分支的 reviewed merge commit 发布，并验证 tag、GitHub Release、npm provenance、公共安装与 DSH bundle 运行身份。
- FR-029: CLI 必须提供 `dsh-test init [directory]`，只接受真实目录中的 DSH bundle，结构化读取 `package.json` 的 `dsh.bundle.patch` 并解析可确定的 patch row ID。
- FR-030: `init` 必须生成 `dsh-testkit.yaml`、`.github/workflows/dsh-lifecycle.yml` 和 `.agents/skills/dsh-testkit/SKILL.md`；相同内容重跑必须幂等，冲突内容必须在任何写入前失败，只有显式 `--force` 才可替换目标文件。
- FR-031: 生成场景必须固定精确受支持 DSH 版本、使用当前目录作为 subject、断言所有可确定 row，并保留空的 service/tool 集合而不是通过文本扫描猜测能力。
- FR-032: 生成 workflow 必须使用只读最小权限、固定 Node 主版本、稳定 `v0` Action 入口、同一场景文件和固定的 `DSH lifecycle` check 名称。
- FR-033: npm 包和仓库必须发布一个模型可调用的 `dsh-testkit` Skill；其 description 覆盖创建、修改、review、测试、发布和 install/boot/register/update/uninstall/reboot/cleanup/flaky 故障，正文说明 quick/full 选择、证据解释和安全边界。
- FR-034: DSH 原生 bundle 必须在可选 `skills` service 存在时注册与项目文件相同的 Skill 定义；service 缺失时 tool 仍可激活，不得把 `skills` 变成硬依赖。
- FR-035: `init` 不得安装依赖、运行插件、访问网络、改写 `package.json`/lockfile/`AGENTS.md` 或在目标根目录之外创建文件。
- FR-036: v0.3.0 必须发布并验证 Skill、scaffold 和原生注册；官方 Agent Skill 集成通过符合上游贡献政策的 Ideas 讨论推进，至少向一个公开插件模板提交可审核的一键接入 PR。

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
- NFR-013 Documentation parity: 发布检查必须同时验证两份 README 的当前版本、DSH 支持线、语言切换和安全声明。
- NFR-014 Responsible disclosure: 社区验证结果是环境绑定的兼容性证据，不是安全评级；命名失败披露必须先复现并给作者可操作证据。
- NFR-015 Onboarding: 在 warm 本地文件系统中，`init` 不访问网络且应在 2 秒内完成；成功输出必须列出 created、unchanged 和 replaced 文件以及下一条验证命令。
- NFR-016 Scaffold safety: 目标根目录、patch 和所有生成文件必须经过 containment 与 symlink 边界检查；一次冲突不得留下部分 scaffold。
- NFR-017 Skill efficiency: 模型目录 description 必须不超过 DSH 默认 500 字符限制，Skill 正文不超过 4 KiB，完整场景语法通过现有文档引用而不是复制。
- NFR-018 Compatibility: v0.3.0 不改变现有 root CLI、v1 scenario/report schema、退出码、Action 输入或生命周期 verdict 语义。

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

### v0.2 范围

- 保留 v0.1 CLI、Action、report schema 和生命周期语义。
- 将同一个 npm 包发布为 DSH 原生 Profile Bundle。
- 注册一个薄 `dsh_test` tool adapter，只负责安全参数收敛、Docker 调用、取消和结果投影。
- 使用真实 DSH profile 验证 bundle 安装、配置组装、tool 注册和确定性调用。

### v0.3 范围

- 保留 v0.2 的 CLI、Action、DSH tool 和 v1 schema 兼容性。
- 增加非交互、可幂等且拒绝隐式覆盖的 `dsh-test init`。
- 从 bundle manifest 与 patch 生成最小场景和 GitHub lifecycle workflow。
- 发布一份规范化 `dsh-testkit` Agent Skill，并同时提供项目文件与可选 DSH 运行时注册。
- 通过官方 Ideas 讨论和公开插件模板 PR 争取把生命周期测试放入插件开发默认路径。

### 后续候选

- macOS 和 Windows runner。
- 多 DSH 版本矩阵与首个失败版本定位。
- Catalog compatibility feed 和徽章数据源。
- 更强的网络、文件和系统调用 observer。
- 与现有静态扫描、故障注入和 MCP Conformance 工具组合。
- 基于真实采用证据改进 prerequisite profile 生成与模板生态集成。

## 8. 非目标

- 不定义跨 Harness 的插件、Skill 或 MCP 公共标准。
- 不把 Skill 路由测试扩张为模型质量或任务效果评测；只验证结构、发现、注册和明确的正负触发契约。
- 不宣称插件绝对安全，也不取代安全审计。
- 不复制 `dsh-plugin-check` 一类静态仓库扫描器。
- 不重复实现 MCP 协议 Conformance。
- 不建设插件市场、搜索、排行榜、SSO、审批门户或企业 Inventory。
- 不在 DSH tool adapter 中复制生命周期引擎、静态扫描器或包管理逻辑。
- 不允许 DSH tool adapter 直接在宿主进程加载被测插件或启用 unsafe local runner。
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
- bundle patch 缺失、位于仓库外、经过 symlink 逃逸、没有可确定 row，或采用当前 scaffold 不支持的结构。
- 目标 scaffold 文件部分存在、内容被维护者修改，或 `.github`/`.agents` 路径组件是 symlink。
- DSH profile 没有挂载 `skills` service；`dsh_test` 仍必须注册且运行时 Skill 明确不可用。

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
- 项目级 Agent Skill 使用 DSH 与主流 coding-agent 已采用的 `.agents/skills/<name>/SKILL.md` 结构；特定 Agent 的额外目录由模板或用户显式适配。

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
- SC-011: npm 安装包可被 DSH 标准 profile 命令识别为 bundle，且真实宿主能注册并调用 `dsh_test`。
- SC-012: tool 调用的被测插件执行只发生在 Docker 中，workspace 越界、本地 symlink 逃逸、缺少确认和取消均有自动化回归测试。
- SC-013: 至少 10 个精确版本的公开社区 bundle 在无凭证的 Docker cohort 中完成 quick suite，公开报告包含样本选择、环境、聚合 verdict 和首个失败阶段分布。
- SC-014: 英文和中文 README 经过版本/链接/安全契约检查，打包消费者可读取两份文档。
- SC-015: DSH dist-tag 发现器对“全部已支持”和“出现新候选”均有固定 fixture，新候选能启动真实宿主 canary matrix。
- SC-016: 多插件完整生命周期是否进入下一版本，必须以 10 插件 cohort 和社区失败类型为证据做明确 TDR，不以功能完整性直觉扩张。
- SC-017: 干净 bundle fixture 的 `dsh-test init` 在无网络条件下生成可解析的场景、workflow 和 Skill；第二次运行字节不变，冲突文件使整次操作零写入。
- SC-018: 单元测试、打包消费者和真实 DSH bundle E2E 分别证明 Skill 文件身份、项目级发现契约和可选运行时注册，且 `skills` 缺失不阻塞 `dsh_test`。
- SC-019: v0.3.0 发布后，官方 Ideas 区存在可直接采纳的 vendor-neutral Agent Skill 建议，至少一个公开插件模板 PR 使用 released `v0` Action 和生成场景。
- SC-020: 首批采用阶段以 5 个外部插件仓库运行 lifecycle Action、3 个持续 check 和至少 1 个上游/模板引用为目标；该 field metric 不阻塞 v0.3.0 发布。

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
- `npm pack` 的干净消费者可验证 bundle manifest、patch、Cordis 入口和 `dsh_test` schema。
- 真实 DSH profile 可安装打包后的 Testkit、观察 bundle layer，并对 healthy fixture 完成一次 `dsh_test` Docker 调用。
- `dsh-test init` 对合法 fixture 生成三个受控文件，对幂等重跑不改字节，对冲突与 symlink 路径在写入前失败。
- Agent Skill 的路由描述、正文大小、安全约束和生成文件通过契约测试，真实 DSH profile 可同时观察 `dsh_test` 和 `dsh-testkit` Skill。
- v0.3.0 公共 npm 包、GitHub Release、Show & Tell 更新、官方 Ideas 建议和插件模板 PR 均引用同一个发布身份。

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
- Q: 将 Testkit 做成 DSH 插件是否改变产品定位？
  A: 否。DSH bundle 是现有生命周期引擎的原生入口和分发形态，不是第二套测试实现，也不把项目扩张成市场或通用 Harness 契约。
- Q: v0.3.0 的 Agent Skill 是否替代 CLI 自解释和 CI？
  A: 否。Skill 负责在正确任务时路由并教授最小工作流；CLI help、结构化错误、`init` 和 required check 负责确定性执行。Skill 被发现前仍需要官方开发指引或插件模板提供入口。
- Q: 是否自动修改所有 Agent 的配置目录？
  A: 否。`init` 写入 DSH 与跨 Agent 使用的 `.agents/skills` 标准位置，不静默修改 `AGENTS.md`。特定 Agent 的额外目录适配由模板或用户显式选择。

## 15. 开放问题

None blocking product review. 技术栈、runner 后端、模块布局和首批 DSH adapter 版本属于 TDR 决策，在本 Product Design 获得明确批准后处理。

## 16. User Review Gate

- Approval: Approved on 2026-08-16
- Reviewer notes: 用户明确批准发布官方双语 Show & Tell、完成 v0.3.0 一键接入和 Agent Skill，并按官方贡献政策争取进入官方开发 Skill 与公开插件模板。既有 lifecycle、schema 和安全边界保持不变。
