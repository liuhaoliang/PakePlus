# 成本统计报表 · 需求澄清与设计文档

> 日期：2026-10-10
> 任务节点：需求澄清（clarify）
> 适用仓库：PakePlus（两个 worktree：分支 `-1` 与 `-2`，同步实现）

## 1. 需求概述

开发一个成本统计报表功能，用于统计企业各项成本支出情况：

- 新建「成本统计分析」页面与 **Dashboard**。
- 按**部门、项目、业务线、人员、月份、季度、年度**等维度展示与统计数据。
- 人力成本按角色区分：**开发、测试、产品、运维**。
- 项目成本含：**项目预算、实际消耗、预算占比、预计超支金额**。
- 支持**报表导出**。

## 2. 已确认决策

| 决策项 | 结论 |
|---|---|
| 技术形态 | 新增独立前端页，原生 HTML/CSS/JS，不引入框架 |
| 数据来源 | 新建本地持久化：Rust 侧 JSON 文件（方案 A） |
| 导出格式 | Excel（.xlsx），前端 SheetJS 生成 + `tauri-plugin-fs/dialog` 保存 |
| 人力成本口径 | 人员 × 工时 × 费率（费率按人员维护，计费存快照） |
| 时间维度 | 月/季/年：既作**筛选条件**、也作**聚合粒度** |
| 数据进入 | 录入 + 导入都支持（成本明细逐条录入，支持 Excel/CSV 导入） |
| 主数据维护 | 应用内维护页：部门/业务线/项目/人员/费率 增删改 |
| 数据规模 | 小规模，累计明细 < 1 万条 |
| 代码落点 | 两个 worktree（`-1`、`-2`）同步实现 |

## 3. 数据模型

持久化 JSON 结构（Rust 侧，数据文件位于应用数据目录）：

- `Department`：部门
  - `id`、`name`
- `BusinessLine`：业务线
  - `id`、`name`
- `Employee`：人员
  - `id`、`name`、`departmentId`、`businessLineId`、`role`（开发/测试/产品/运维）、`rate`（费率）
- `Project`：项目
  - `id`、`name`、`departmentId`、`businessLineId`、`budget`（项目预算）
- `CostEntry`：成本明细
  - `id`、`employeeId`、`projectId`、`month`（YYYY-MM）、`hours`（工时）、`rateSnapshot`（费率快照）

人力成本 = `hours × rateSnapshot`，在录入/导入时按当期人员费率写入快照，保证费率变动不回溯影响历史记录。

## 4. 统计口径

- 人力成本（按角色）：`CostEntry` 按关联 `Employee.role` 分组求和。
- 项目实际消耗 = 该项目下 `CostEntry` 人力成本之和。
- 预算占比 = 实际消耗 ÷ 项目预算。
- 预计超支金额 = 实际消耗 − 项目预算（超支为正，未超支为负/零）。

维度聚合：部门、项目、业务线、人员、月份、季度、年度；其中季度=月份区间聚合，年度=12 个月聚合，均支持作为筛选条件与聚合粒度交叉组合。

## 5. 技术架构

### 5.1 前端

- 新增 `src/cost-report/index.html`（原生 HTML/CSS/JS，单文件页 + 内联样式/脚本）。
- 页签：**Dashboard**、**统计分析**、**数据录入**、**导入**、**主数据维护**、**报表导出**。
- 与已有 `src/pppwd.html` 完全隔离、零侵入。
- 通过 Tauri `invoke` 调用后端命令；导出用 SheetJS 生成 .xlsx 后经 dialog 选择保存路径。

### 5.2 后端桥接（Rust）

- 新增 `src-tauri/src/cost/` 命令模块（如 `mod.rs`、`models.rs`、`store.rs`、`cmds.rs`）。
- 在 `src-tauri/src/lib.rs` 的 `generate_handler!` 中注册成本相关命令，沿用现有 `command::cmds` 模式。

### 5.3 持久化（方案 A：JSON 文件）

- Rust 侧读写应用数据目录下的成本数据文件（如 `cost_data.json`）。
- 聚合在内存完成：明细 < 1 万条时，全量载入后 JS 端聚合毫秒级完成，无原生编译依赖、易备份。

## 6. Tauri 命令契约（camelCase JSON）

- `list_master_data()` → 主数据全量（部门/业务线/项目/人员/费率）
- `save_department(name) / update_department(id, name) / delete_department(id)`（业务线/项目/人员同构）
- `save_employee(..., role, rate) / update_employee(...) / delete_employee(id)`
- `save_cost_entry(employeeId, projectId, month, hours)`（费率在 Rust 侧填快照）
- `import_cost_entries(records)` / `import_master_data(kind, records)`
- `query_aggregate(filters, groupBy, period)` → 聚合结果
- `export_report(filters, dimensions)` → 生成报表数据（前端转 xlsx）

## 7. 数据流

1. 主数据维护/录入/导入 → `invoke` → Rust 命令 → 写 JSON 文件。
2. Dashboard/统计分析 → `invoke(query_aggregate)` → Rust 读 JSON → 内存聚合 → 返回 JSON → 前端渲染图表/表格。
3. 导出 → 前端组装当前筛选结果 → SheetJS 生成 .xlsx → `tauri-plugin-dialog` 选路径 → 保存。

## 8. 双仓对齐点（Review 关注）

- 两仓 `src/cost-report/index.html`、`src-tauri/src/cost/` 模块、`lib.rs` 注册、JSON 数据结构**保持一致**。
- 命令入参/返回 JSON 契约（camelCase）两仓一致。
- `-1` 分支额外保留遗留 Java Maven(HelloWorld) 骨架，与本功能无耦合、不动；`-2` 分支为纯净基线。成本报表侧两仓无差异。

## 9. 验收标准

- 能维护部门/业务线/项目/人员/费率主数据（增删改）。
- 能逐条录入成本明细，并支持 Excel/CSV 导入。
- Dashboard 与统计分析页按 7 个维度正确聚合展示人力成本（分角色）与项目成本（预算/实际/占比/超支）。
- 月/季/年既可筛选也可作为聚合粒度。
- 报表可导出为 .xlsx。

## 10. 风险与边界

- SheetJS 需以本地资源方式引入（Tauri 桌面可能离线）；避免 CDN 依赖。
- 明细满 1 万条以内走全量内存聚合；超过阈值需切换 SQLite 方案（本版本不实现）。
- 费率快照机制保证历史成本不随费率调整漂移。
- 本期不含：多货币、权限/多用户、审批流、预算预警通知。