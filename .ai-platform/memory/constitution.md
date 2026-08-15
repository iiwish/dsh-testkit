# DSH Testkit Project Constitution

Version: v0.1
Status: Confirmed
Last updated: 2026-08-15
Review: User authorized continuation after SSOT review on 2026-08-15

## 1. Purpose

本 Constitution 保护 DSH Testkit 作为开源测试基础设施的可信度。它适用于 CLI、runner、DSH adapter、场景、fixture、报告格式、CI 集成和项目文档。

项目的首要责任是提供真实、可复现、边界清楚的生命周期证据，而不是制造通过徽章或扩大功能范围。

## 2. Principles

### 2.1 Quality

- 报告事实，不制造认证。`pass` 只表示指定插件、DSH 版本、环境和场景集合通过。
- 失败必须归属到明确阶段：resolve、install、assemble、boot、register、exercise、update、uninstall、reboot、recover 或 cleanup。
- 错误输出必须包含可操作诊断、被测试版本和最小复现入口。
- 核心行为使用类型化状态和结构化事件，不用日志文本猜测生命周期状态。
- 优先使用 DSH 公开 CLI、profile 和配置接口；不可避免的内部探针必须隔离在版本 adapter 中。
- 不以增加检查数量代替真实宿主测试质量。

### 2.2 Architecture

- 核心由五个边界组成：scenario model、runner、DSH adapter、probe/observer、reporter。
- 通用 runner 不包含 DSH 版本特例；版本差异只进入 DSH adapter。
- 测试场景是声明式输入，执行结果是带 schema version 的结构化输出。
- 插件、宿主和测试工具版本共同构成结果身份，任何一项变化都产生新结果。
- 每次运行拥有独立的 DSH home、profile、workspace、端口和临时资源。
- 静态扫描、MCP Conformance 和故障注入工具通过 adapter 组合，不复制其引擎。

### 2.3 Testing

- 行为变更默认使用 RED-GREEN-REFACTOR。
- 每个生命周期阶段至少有一个成功 fixture 和一个失败 fixture。
- runner 必须用故意损坏的插件验证失败检测能力，不能只测试正常插件。
- 报告 schema、退出码和场景格式需要契约测试与向后兼容 fixture。
- DSH adapter 需要对当前支持版本运行集成测试；不能只 mock DSH。
- 修复真实插件问题时，先将最小复现沉淀为 fixture 或回归场景。
- TDD 例外仅限纯文档和机械格式调整，并在交付记录中说明。

### 2.4 UX And Accessibility

- CLI 是首要产品界面，默认支持非交互 CI 运行。
- 人类输出简洁，机器输出稳定；两者来自同一结构化结果，不维护两套判断逻辑。
- 错误信息先说明失败阶段和影响，再提供证据路径和建议动作。
- 颜色不是唯一状态信号；所有状态同时提供文字和退出码。
- CLI 在无 TTY、窄终端和禁用颜色环境中保持可读。

### 2.5 Performance And Reliability

- 所有外部操作都有独立、可配置的超时和取消路径。
- runner 被中断或宿主崩溃后仍应尽力收集证据并清理资源。
- 默认 quick suite 在 warm Linux CI runner 上以 10 分钟为执行预算；超时必须标记阶段而不是只报告全局失败。
- 重试只用于明确的基础设施瞬时故障，不得用重试掩盖确定性插件失败。
- 同一输入连续五次运行应产生一致 verdict；不一致被报告为 flaky，而不是择优取结果。

### 2.6 Security, Privacy, Compliance

- 被测试插件按不受信代码处理，默认只在一次性隔离 runner 中执行。
- 本机直接执行只能通过显式 `--unsafe-local` 类开关启用，并在报告中永久记录。
- baseline suite 不需要模型 API Key，也不得读取用户真实 Secret。
- 使用假 Secret、文件和网络 canary 观察副作用；通过结果不等于安全证明。
- 日志、环境和支持包在落盘前执行 Secret 脱敏。
- 安装脚本、子进程、端口、文件变化和网络访问属于必须保留的证据类别。
- 第三方源码和制品必须固定到 commit、版本或 digest；不以可变分支生成可复现通过记录。

## 3. Git And Review Policy

- 默认分支保持可运行，功能通过短生命周期分支和可审核 PR 进入。
- 功能 PR 必须关联需求 ID、测试证据和残余风险。
- 不在功能 PR 中混入无关重构、生成文件或大范围格式 churn。
- 报告 schema、场景 schema、退出码和插件执行边界的变更需要专门 review。
- 用户明确接受前，治理任务保持 `Needs_Review`，不得自行标记 `Accepted`。
- 发布前必须验证 clean install、quick suite、至少一个失败 fixture 和报告产物。

## 4. Change Process

- Constitution 变更先以 `Draft` 或 `Ready_For_User_Review` 提出，经用户明确批准后生效。
- 产品范围变化先修改 Product Design，不在 TDR、task 或代码中静默扩张。
- 对违反 Constitution 的临时方案，必须记录原因、影响、期限和退出条件。
- 稳定 schema 或 CLI 行为的破坏性变更需要迁移说明和显式版本升级。

## 5. Exceptions

None.

## User Review Gate

- Approval: Approved on 2026-08-15
- Reviewer notes: 用户批准项目名称，并明确要求 SSOT review 无阻塞问题后继续完成插件。Requirements Checklist 已处理所有 High findings。
