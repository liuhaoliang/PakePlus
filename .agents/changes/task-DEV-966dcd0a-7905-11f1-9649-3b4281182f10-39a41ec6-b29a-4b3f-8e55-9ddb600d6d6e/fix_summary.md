# 问题修复摘要（fix_summary · 第 2 轮）—— 弹弹鸟：鸟蛋保卫战

> 节点：问题修复（verify / round 2 修复，承接 CR r2 + 验收 r2）
> 采用技能：`receiving-code-review`（先核实、再实现、逐项验证；对暂缓项给出技术理由）
> 修复对象：代码评审第 2 轮 1 个阻断项 **B3**（引擎帧累加器重置条件写反）+ 1 个重要项 **I2**（关卡地图星级渲染错误）
> 输入：`${spec_dir}/cr_report.md`（第 2 轮）、`${spec_dir}/verify_report.md`（第 2 轮）、`.agents/workflow/assets_manifest.md`；两份报告在 change 目录与 `.agents/workflow/` 均有副本（任务输入标注「文件不存在」系流水线变量快照滞后，实际以磁盘内容为准，已按报告执行）
> 修复基准：HEAD `37a21a4`（验收 r2），代码与 CR r2 审阅快照零差异

---

## 1. 结论（TL;DR）

- **B3（blocking）已修复**：`engine.ts` `update()` 的帧时间累加器重置条件由 `if (steps < 6)` 反转为 `if (steps >= 6)`（一行代码 + 注释）。修复前 dt ≤ 16.666ms 的帧物理零推进（120Hz 设备完全冻结、60Hz 量化帧丢弃、30FPS 恒半速）；修复后按 CR r2 §4 验收标准逐项实测全部通过，且过载防死亡螺旋保护保持不变。
- **I2（important）已修复**：关卡地图星级渲染复用 `Stars` 组件（金星 #FFB400 + 灰星 + `aria-label`），1★/2★/3★ 可区分且与设计 §9「三颗金星」一致；`starsOf` 返回类型收窄为 `0 | 1 | 2 | 3` 以通过 strict 类型检查。
- **回归验证全绿**：独立行为复验脚本 **20/20 PASS**（含修复前引擎负向对照，复现冻结/永不结算基线以证明断言可检出缺陷）；`tsc --noEmit` rc=0、`next lint` rc=0、4 个护栏脚本 rc=0、`next build` rc=0（60 个 `/level/[id]` SSG 页全产出）。
- CR r2 的 6 个 nit/观察项不在本轮阻断范围（CR 明示「其余 nit 可随后处理」），逐项有据暂缓，见 §4。
- 视觉验证未执行（当前路由无可视化能力）；帧率结论以确定性步数计数实证为代理证据（插桩 `GameEngine.prototype.step`），渲染结论以 `react-dom/server` 静态渲染实测为准。

---

## 2. 🔴 B3 —— 引擎帧累加器重置条件写反（blocking）

### 2.1 核实（对照真实源码，非采信报告自述）

- `app/src/game/engine.ts:229`（修复前）确为 `if (steps < 6) this.acc = 0;`：`while (acc >= 1000/60 && steps < 6)` 消化整步后，**凡未触及 6 步上限的帧（即全部正常帧）**都会把不足一个物理步（16.6667ms）的剩余时间清零。
- 调用链核实：`PlayClient.tsx:199-206` rAF 主循环 `const dt = now - last; … eng.update(dt)`，dt 即真实帧间隔，无任何补偿路径——机理与影响面（支付宝 WebView 主力高刷机型）成立，确认为阻断项。
- 与 verify r2 §3.2 的独立实证一致（`update(8.33)×600` = 0 步；清猪后 120Hz 永不结算）。

### 2.2 实现（`app/src/game/engine.ts`，最小改动）

```diff
     this.updateParticles(dtMs / 1000);
-    if (steps < 6) this.acc = 0;
+    // 仅过载（单帧 6 步仍未消化完）时丢弃积压，防死亡螺旋；正常帧保留不足一步的余量继续累积，
+    // 否则 dt < 1000/60 的帧（>60Hz 高刷屏）时间被整帧丢弃，物理零推进（B3 修复）。
+    if (steps >= 6) this.acc = 0;
```

- 采用 CR r2 首选方案（`steps >= 6`，仅过载时丢弃积压）。两个候选方案仅在「过载帧」行为上有差异（清零 vs 收敛到一步余量）：while 循环在 `steps < 6` 时必然已把 `acc` 消化至 `< 1000/60`，故正常帧两者等价；过载帧清零更贴合原意图（防死亡螺旋），且 D1-7 证明过载后下一正常帧立即恢复推进。

### 2.3 复验（独立脚本，转译仓库真实 `constants.ts`/`mock/data.ts`/`engine.ts` 为 CJS 后执行，插桩 `step` 计数）

**步数矩阵（CR r2 §4 验收标准逐项）**：

| 帧距场景 | 验收标准 | 修复前实测 | 修复后实测 | 结果 |
|---|---|---|---|---|
| `update(1000/120)×2` [120Hz 精确] | ≥1 步 | — | **1 步** | ✅ |
| `update(8.33)×600` [120Hz 量化] | 长跑推进 | **0 步**（冻结） | **299 步**（理想 299.9） | ✅ |
| `update(16)×4` [60Hz 整数量化] | ≥3 步 | **0 步** | **3 步** | ✅ |
| `update(16.666)×600` [60Hz 抖动] | 长跑推进 | **0 步** | **599 步**（理想 599.98） | ✅ |
| `update(17)×60` [60Hz 正常] | 正常 | 600 步 | 61 步（理想 61.2） | ✅ |
| `update(33.3)` [30FPS] | 每帧 2 步 | 恒 1 步（半速慢动作） | frame1=1，frames2-60 全为 **2**（总 119/60 帧） | ✅ |
| `update(200)` 过载 | ≤6 步且无死亡螺旋 | — | 6 步且积压清零；随后 `update(16)`→0、再 1 步（恢复推进） | ✅ |

**行为链路全部在 `dt=8.33ms`（120Hz）驱动下复跑**：

| 断言 | 结果 |
|---|---|
| A. 60 关开局支撑：`recomputeFalling` 后无 falling 猪，驱动 1s 后全部存活、无坠落、未终局 | 异常关卡 = **[]** ✅ |
| B. L1 拆承重面（wood@542）→ 坠落 → 落地 feet=560.0（ground）→ 存活，240 帧物理步=119 | ✅ |
| C. L4 拆左猪支撑（glass@509）→ 左猪坠至木平台顶 542.0 存活；右猪零位移、不受影响 | ✅ |
| E-1. L1 清猪 → win → 3★、score=4000（修复前 120Hz 永不结算） | ✅ |
| E-2. 60Hz 对照（`update(17)×60`）：win、3★、score=4000，与 verify r2 基线一致 | ✅ |

**负向对照（把修复行还原为缺陷行构造旧引擎，证明断言可检出缺陷）**：旧引擎 `update(8.33)×600` = 0 步、`update(16)×4` = 0 步、`update(16.666)×600` = 0 步；L1 拆承重面后 240 帧零推进、猪仍在坠落且 y 零位移；清猪后 `update(8.33)×600` 仍未结算——与 CR r2 / verify r2 实测基线完全一致。

---

## 3. 🟡 I2 —— 关卡地图星级渲染错误（important）

### 3.1 核实

`LevelMap.client.tsx:64`（修复前）`"★★☆".slice(0, stars * 2)`：`"★★☆"` 为 3 字符串，`stars=1 → "★★"`（虚高一颗）、`stars=3 → "★★☆"`（与 2★ 完全相同），满星成就不可见——与 CR r2 §5 / verify r2 §3.3 的 JS 语义实证一致。数据层（storage/`levelStars`）、`/me` 页、结算弹层均正确，仅此一处渲染错误。

### 3.2 实现（`app/src/components/LevelMap.client.tsx`）

- 渲染分支改为复用 `Stars` 组件：`{open ? (stars > 0 ? <Stars count={stars} size={11} /> : lv.name) : "🔒"}`——金星数恒等于已得星数，同时满足设计 §9「已 3 星格显示三颗金星」（`#FFB400` 金 + `#E6D9C8` 灰）并带 `aria-label="${count} 星"` 无障碍标注；
- `starsOf` 返回类型由 `number` 收窄为 `0 | 1 | 2 | 3`（`levelStars` 值域即此联合类型，`?? 0` 兜底后类型不变），以通过 `Stars` 的 `count` prop strict 检查；
- 选择复用组件而非内联 `"★".repeat(stars) + "☆".repeat(3 - stars)`：两者均为 CR 认可方案，但组件方案额外落实设计的「金星」颜色与 aria 语义，且 `Stars` 此前全仓零使用（r1 nit 修复移除了首页最后一处引用），此处接线使其重新有真实调用方；
- 注释不复述旧缺陷代码字面量，保持「`slice(0, stars`」可 grep 性干净（首轮复验曾因注释复述缺陷表达式误报，已修正）。

### 3.3 复验

- `react-dom/server` 静态渲染 `Stars`（真实组件，转译自仓库源码）：gold(1)=1、gold(2)=2、gold(3)=3，总星数恒 3，`aria-label` 正确；旧逻辑 1★→`"★★"`、3★→`"★★☆"`（与 2★ 相同）作为对照留档 ✅
- 源级断言：`LevelMap.client.tsx` 含 `<Stars count={stars} size={11} />` 且不再含缺陷切片模式 ✅
- `tsc --noEmit`（strict + noUncheckedIndexedAccess）rc=0、`next build` rc=0（`/levels` 页 133kB 正常产出）✅

---

## 4. CR r2 nit/观察项处理（6 项，均非阻断，有据暂缓）

| # | 评审项（CR r2 §6） | 处理 | 理由 |
|---|---|---|---|
| 1 | 鸟无地面碰撞/顶点悬停（`engine.ts:240-252`） | ⏸ 暂缓 | 边缘手感问题非功能失效（CR 定级 nit）；当前结算兜底（出界/超时/低速）均已覆盖，改动需重新标定手感与计分平衡，超出本轮「阻断项最小修复」范围 |
| 2 | L60「下一关」死按钮（`nextLevelId(60)=60`） | ⏸ 暂缓 | 需产品决策（隐藏 vs 改「再玩一次/回地图」）；「重试本关」`location.reload` 兜底可用，不阻断核心玩法 |
| 3 | 固定 0.45s 结算窗与布局耦合 | ⏸ 暂缓 | 当前 60 关布局最大坠落 64px < 91px 阈值（verify 实测落地 0.38s），无实际触发；改为「全猪静止或超时」属防御性重构，留待布局变更时一并处理 |
| 4 | ~124KB 未引用素材随包发布 | ⏸ 暂缓 | 已在 coding_summary §2.4/§5 文档化的兜底素材（sprite 渲染预留）；删除会丢失后续接线能力，建议后续在 README/资产清单标注（文档事项） |
| 5 | 文案标点不统一（半角逗号 ×4 处） | ⏸ 暂缓 | 极轻微；与 nit2/3 批量文案整理时同批处理，避免本轮 diff 扩散 |
| 6 | `POST /api/orders` 未校验登录态 | ⏸ 暂缓 | 预留接口返回占位订单（设计已标记），实接 wap.pay 前需补 uid 校验与金额白名单——属支付实接工作项，CR 亦标注「可接受」 |

---

## 5. 回归验证记录（本轮实际执行）

运行环境：无系统 Node，复用 `/tmp/node-v20.18.0-linux-x64/bin/node`（v20.18.0），在 `app/` 目录实际执行。

| 检查 | 命令 | 结果 |
|---|---|---|
| 行为复验 | 独立脚本（TypeScript API 转译仓库真实 `constants.ts`/`mock/data.ts`/`engine.ts`/`Stars.tsx` 为 CJS 后执行，含修复前引擎负向对照） | **20/20 PASS**，见 §2.3/§3.3 |
| 类型检查 | `tsc --noEmit` | rc=0，0 错误（strict + noUncheckedIndexedAccess）✅ |
| Lint | `next lint` | rc=0（No ESLint warnings or errors）✅ |
| 能力矩阵 | `node scripts/check-env.mjs .` | rc=0 ✅ |
| 项目护栏 | `node scripts/check-project.mjs .` | rc=0 ✅（未发现禁止的容器/小程序/私有 API 调用遗址） |
| SEO 护栏 | `node scripts/check-seo.mjs .` | rc=0 ✅ |
| 发布前门 | `node scripts/check-build.mjs .` | rc=0 ✅ |
| 生产构建 | `next build` | rc=0 ✅（60 个 `/level/[id]` SSG 页全产出；`/` 142kB、`/levels` 133kB、`/play/[id]` ƒ 138kB、9 个 API 路由、robots/sitemap 正常，共享 chunk 87.2kB——与 verify r2 构建产物一致） |
| 上轮修复回归 | B1 星级阈值（E-1/E-2 结算 stars=3、score=4000 与基线一致）、B2 支撑判定（A/B/C 链路）、I1 桥下猪（A 覆盖） | 零回归 ✅ |
| 视觉验证 | — | **未执行**（当前路由无可视化能力）；以步数计数实证 + 静态渲染 + 构建产物为代理证据 |

---

## 6. 变更清单（文件级）

| 文件 | 变更 | 对应项 |
|---|---|---|
| `app/src/game/engine.ts` | `update()` 帧累加器重置条件 `steps < 6` → `steps >= 6`（+注释 2 行） | B3 |
| `app/src/components/LevelMap.client.tsx` | 星级渲染复用 `Stars` 组件（金星+aria）；`starsOf` 返回类型收窄 `0\|1\|2\|3`；新增 import；修复说明注释 | I2 |

合计 2 个文件，+7/-3 行。`git status` 仅含上述 2 个代码文件变更（未提交，工作区保留，遵守 Git 只读约束）。

---

## 7. 产物清点

- 生成：`.agents/changes/task-DEV-966dcd0a-7905-11f1-9649-3b4281182f10-39a41ec6-b29a-4b3f-8e55-9ddb600d6d6e/fix_summary.md`（任务指定交付路径，本文件第 2 轮，覆盖第 1 轮——r1 内容已随 `db97140` 入库）；同步副本 `.agents/workflow/fix_summary.md`。
- `run_context.json` 未改动：`review_blocker_count=1`/`guard_blocker_count=1` 为评审/验收节点写入的结论，本轮修复结果以本文件呈现，是否清零由复核节点裁定。
- 零仓库污染：独立复验脚本与转译产物位于 `/tmp`（`/tmp/fix3`、`/tmp/fix3work`），已随验证结束清理；仓库 `tmp/` 保持为空。
- 残余风险：真机高刷（WKWebView/Android WebView）实测仍未执行（无可视化/真机能力），以步数计数实证为代理证据；CR r2 nit 6 项待后续批次。
