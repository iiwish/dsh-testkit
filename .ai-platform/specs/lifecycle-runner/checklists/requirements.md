# DSH Testkit Requirements Checklist

Version: v0.3.0
Status: Completed
Source spec: `.ai-platform/docs/product-design.md`
Last updated: 2026-08-16

## Checklist Scope

- Feature: DSH lifecycle runner MVP
- Reviewed artifacts:
  - `.ai-platform/memory/constitution.md`
  - `.ai-platform/docs/product-design.md`
  - `.ai-platform/specs/lifecycle-runner/research.md`

## Requirement Quality Checks

- [x] 每个核心 user story 都有明确 actor、trigger、outcome。[Completeness]
- [x] 每个 `FR-*` 都能映射到验收标准或可执行验证。[Testability]
- [x] 定义了无效输入、安装失败、boot failure、partial registration、timeout、中断、卸载残留和 observer 缺失等状态。[Coverage]
- [x] 将 quick suite 性能预算、重复性和真实插件样本数量量化。[Clarity]
- [x] 声明了市场、跨 Harness 标准、模型评测、通用扫描器、包管理器和 Web UI 等非目标。[Scope]
- [x] 覆盖性能、可靠性、安全、隐私、可观测性、可移植性和 schema 稳定性。[NFR]
- [x] 统一使用 plugin、DSH version、runner、scenario、stage、observer 和 report 术语。[Consistency]
- [x] 产品审核没有 blocking open question，技术选型明确留给 TDR。[Readiness]
- [x] `pass` 的含义限定在版本、环境、场景和 observer coverage 内。[Safety]
- [x] 企业 Catalog 被定义为消费者而非首版功能。[Boundary]
- [x] DSH bundle 被定义为现有测试引擎的入口，而不是市场或第二套实现。[Scope]
- [x] DSH tool 明确要求确认、Docker 强制、workspace containment、取消传递和有界输出。[Safety]
- [x] FR-019 至 FR-022 均映射到 T006 的单元、契约、打包和真实宿主测试。[Traceability]
- [x] FR-023 至 FR-028 分别定义双语入口、工具边界、社区 cohort、DSH release watch/canary 和 trusted patch release。[Traceability]
- [x] 社区测试仅接受精确 npm 版本，明确无凭证环境、聚合披露与“不是安全评级”边界。[Safety]
- [x] Canary 只修改一次性 CI checkout，不改动发布包支持声明。[Release Safety]
- [x] `init` 的输入资格、生成文件、幂等、冲突、force、symlink、零网络和零 package-manifest 修改边界均有明确要求。[Safety]
- [x] 生成场景只使用结构化 manifest/patch 中可确定的 row，不从源码猜测 service/tool。[Evidence Integrity]
- [x] Agent Skill 定义了正负触发边界、quick/full 选择、证据解释、Docker 安全和非认证声明。[Completeness]
- [x] 项目 Skill 与 DSH runtime Skill 共享同一定义，且 `skills` service 保持可选。[Consistency]
- [x] “一键”和“快速”分别量化为一个 init 命令、无网络、2 秒预算、三个目标文件和下一条验证命令。[Clarity]
- [x] 上游目标遵守官方不接受外部 PR 的当前政策，模板集成以 released v0.3.0 为前置条件。[External Integration]
- [x] FR-029 至 FR-036、NFR-015 至 NFR-018 和 SC-017 至 SC-020 全部映射到 T008。[Traceability]

## Findings Summary

- Critical: 0.
- High: 2，均已解决。
- Medium: 4，均已解决或分配到 TDR。
- Low: 1，不阻塞规划。

## Resolution Notes

- High H-001: `FR-007` 原本要求统一枚举 command 和 event listener，但 DSH 没有为所有注册类型提供稳定公开枚举契约。v0.1 收敛到配置 row、Cordis service 和 tool schema；其余类型等待公开接口。
- High H-002: `FR-012` 原本会把所有文件、进程、端口、网络和 Secret canary 观测写成无条件保证，容易在 runner 缺少 observer 时产生假通过。需求改为 capability-aware，报告必须列出 coverage，缺少强断言能力时返回 `unsupported`。
- Medium M-001: DSH 没有独立的 CLI ready 事件。TDR 必须定义 probe artifact 作为 boot readiness 和 runtime assertion 信号。
- Medium M-002: local path 安装可能测试源码链接而非发布产物。TDR 必须规定本地目录先 `npm pack`，再从 tarball 安装。
- Low L-001: 公开仓库和 npm 名称尚未实际注册，发布前需要再次检查。
- Medium M-003: “Agent Skill”最初可能被理解为把 Markdown 放进 npm 即可被所有 Agent 自动发现。需求拆成项目 `.agents/skills`、可选 DSH runtime registration 和上游/template 分发三个边界。
- Medium M-004: 一键 scaffold 若自动修改依赖和 lockfile 会执行包管理器并扩大所有权。需求明确 init 只生成受控文件，安装依赖仍由用户选择的包管理器完成。

## Traceability Notes

- `US-001` 由 FR-001 至 FR-008、FR-013 至 FR-018 覆盖。
- `US-002` 由 FR-013 至 FR-016 和不可变身份 NFR 覆盖。
- `US-003` 由 FR-002、FR-015 和后续版本矩阵覆盖。
- `US-004` 由 NFR-003、NFR-004、NFR-011 和脱敏报告覆盖。
- `US-005` 由 FR-011、FR-017 和故障 fixture 覆盖。
- `US-008` 由 FR-029 至 FR-036、NFR-015 至 NFR-018 和 T008 覆盖。

## User Review Gate

- Approval: Completed under the user's 2026-08-16 instruction to create the goal and deliver Show & Tell, v0.3.0 onboarding, Agent Skill and upstream/template integration
- Reviewer notes: Critical/High findings are resolved; structured evidence, non-destructive ownership and optional runtime discovery remain explicit.
