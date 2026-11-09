# 验证报告（verify_report · 第 2 轮）—— 弹弹鸟：鸟蛋保卫战

> 节点：护栏与验收检查（verify / round 2）
> 采用技能：`alipay-h5-program-generator`（G4 测试验收门禁）
> 审阅对象：`app/`（React + TypeScript + Next.js App Router + antd-mobile，独立子目录；代码基准 = HEAD `df9e7db`，`git status` 干净，与代码评审第 2 轮完全同一快照）
> 输入：`.agents/workflow/design.md`（G2）、`.agents/workflow/assets_manifest.md`、`${spec_dir}/cr_report.md`（第 2 轮）、`${spec_dir}/fix_summary.md`（round 1 修复）；`${spec_dir}/coding_summary.md` **不存在**（任务输入已标注），以 `.agents/workflow/coding_summary.md` 副本替代
> 验证日期：2026-11-09（独立复验，不采信 fix_summary/cr_report 自述，全部以本轮实际执行为准）

---

## 1. 结论（TL;DR）

- 确定性护栏 **6/6 通过**：`check-env` / `check-project` / `check-seo` / `check-build` rc 均为 0，`tsc --noEmit` rc=0，`next build` rc=0（60 个 `/level/[id]` SSG 页全产出，9 个 API 路由、robots/sitemap 正常）。
- **上轮阻断项 B1（星级阈值）、B2（支撑面判定）与重要项 I1（桥下猪）：独立复验全部保持修复、零回归**（60 关 × 5 断言 + 开局支撑 + L1/L4 坍塌链路场景实测）。
- 承接代码评审第 2 轮：**B3（引擎帧累加器重置条件写反）独立实证确认仍存在**（CR r2 之后无修复轮，`git log` 证实 `df9e7db` 仅变更报告文件）。dt ≤ 16.666ms 的帧物理零推进：**120Hz 设备游戏完全冻结、永不结算；30FPS 恒半速慢动作**——Must 级核心玩法在目标受众主力机型（支付宝 WebView）上功能性失效，阻断 G4 出口准则。
- 重要项 I2（关卡地图星级渲染错误）确认存在；按第 1 轮口径（important 不计入 guard_blocker_count）。

**`guard_blocker_count = 1`**

| 严重度 | 编号 | 结论 | 位置 |
|---|---|---|---|
| 🔴 blocking | B3 | `update()` 帧累加器重置条件写反：`if (steps < 6) this.acc = 0` 把正常帧不足一步的余量清零 → dt≤16.666ms 物理零推进（120Hz 完全冻结、60Hz 整数量化帧丢弃、30FPS 半速）；全猪倒后 120Hz 永不结算 | `app/src/game/engine.ts:229`（调用链 `app/src/game/PlayClient.tsx:199-206` rAF `eng.update(dt)` 无补偿） |
| 🟡 important | I2 | 关卡地图星级渲染 `"★★☆".slice(0, stars * 2)`：1★ 显示两星、3★ 与 2★ 无法区分（满星成就不可见） | `app/src/components/LevelMap.client.tsx:64` |

---

## 2. 确定性护栏验证（本轮实际执行，rc 0/1）

运行环境：无系统 Node，复用 `/tmp/node-v20.18.0-linux-x64/bin/node`（v20.18.0），在 `app/` 目录实际执行。

| 检查 | 命令 | 结果 | 证据 |
|---|---|---|---|
| check-env | `node scripts/check-env.mjs .` | ✅ rc=0 | 能力矩阵边界正确（wap.pay/OAuth/scheme 可用；`my.*`/pushWindow/离线包判定不可用） |
| check-project | `node scripts/check-project.mjs .` | ✅ rc=0 | 「未发现禁止的容器/小程序/私有 API 调用遗址」 |
| check-seo | `node scripts/check-seo.mjs .` | ✅ rc=0 | 「canonical/og 一致、sitemap/robots 在场、无 cloaking 嫌疑」 |
| check-build | `node scripts/check-build.mjs .` | ✅ rc=0 | 「env 边界安全、(如已构建)产物无私钥串」 |
| 类型检查 | `node node_modules/typescript/bin/tsc --noEmit` | ✅ rc=0 | strict + noUncheckedIndexedAccess，0 错误 |
| 生产构建 | `node node_modules/next/dist/bin/next build` | ✅ rc=0 | `/` 142kB、`/levels` 133kB、`/me` 138kB、`/play/[id]` ƒ 138kB、`/leaderboard` ƒ SSR、`/level/[id]` ● SSG×60（`/level/1..3` + `[+57 more paths]`）、`/guide` ○、9 个 `/api/*` 路由、`robots.txt`/`sitemap.xml` 产出——与 design §2 渲染决策逐页一致 |

> 护栏脚本覆盖「禁用 API 遗址 / SEO 一致性 / 密钥边界」，属静态门禁，**不覆盖玩法时序正确性**——B3 正是静态门禁盲区（tsc/lint/build 均无法暴露），故以本轮行为复验兜底。

---

## 3. 验收复核

### 3.1 上轮修复回归（B1 / B2 / I1）—— 全部通过 ✅

独立脚本（TypeScript API 转译仓库真实 `constants.ts` / `mock/data.ts` / `game/engine.ts` 为 CJS 后执行，非复述旧结论）：

| 断言 | 结果 |
|---|---|
| A. B1 星级阈值：60 关 × 5 断言（1★ ≤ 猪分Σ / 3★ < 理论满分 / 阈值严格递增 / 清猪必得 ≥1★ / 满分必 3★） | **0 违规** ✅ |
| B. B2 开局支撑：60 关全部猪 `recomputeFalling` 后无 falling | **无支撑猪所在关卡 = []** ✅（含 I1 桥下猪、glassTower 玻璃托猪、stoneFort 猪王） |
| C1. L1 拆平台（真承重面）→ 猪坠落、落地、存活 | falling=true，落地 feetY=560.0 = ground 560，alive=true ✅ |
| C2. L4 碎左玻璃 → 左猪坠至木平台顶存活、右猪不受影响 | leftFalling=true / rightFalling=false，左猪落至 542.0 = 木平台顶 542，alive=true，右猪坐标零位移 ✅ |

**结论：第 1 轮的两个阻断项与一个重要项修复稳定，无回归。**

### 3.2 🔴 B3 —— 帧累加器重置条件写反（独立实证，确认未修复）

- **源码级**：`engine.ts:229` 仍为 `if (steps < 6) this.acc = 0;`（缺陷行在 CR r2 后未变更；`git show --stat df9e7db` 证实该提交仅改 3 个报告文件）。
- **机理复核**：`update()` 内 `while (acc >= 1000/60 && steps < 6)` 消化整步后，`if (steps < 6) this.acc = 0` 在**每一帧未触及 6 步上限时**（即全部正常帧）清空不足一个物理步（16.6667ms）的剩余时间——条件与本意（仅过载时丢弃积压防死亡螺旋）相反。
- **步数计数实证**（对 `GameEngine.prototype.step` 插桩计数，L1 引擎各跑 600 帧）：

| rAF 帧间隔 | 实测物理步数 | 理想步数 | 表现 |
|---|---|---|---|
| `dt=8.33ms`（120Hz ProMotion） | **0** | ≈299 | **完全冻结**（可瞄准，松手鸟永不飞） |
| `dt=16ms`（60Hz 整数量化） | **0** | ≈575 | 帧整帧丢弃 |
| `dt=16.666ms` | **0** | ≈599 | 帧整帧丢弃 |
| `dt=16.667ms` | 600 | ≈600 | 正常（1 步/帧） |
| `dt=17ms` | 600 | ≈612 | 基本正常（余量被丢） |
| `dt=33.3ms`（30FPS 弱机） | 600 | ≈1198 | **恒半速慢动作** |

- **端到端结算链实证**（L1 全部猪倒、`settleTimer=0.2s`）：
  - 120Hz：`update(8.33)×600`（约 5s）→ `isFinished()=false`——**永不结算**；
  - 60Hz：`update(17)×60`（约 1s）→ `isFinished()=true`，won=true，stars=3，score=4000——对照证明结算链本身正常，失效仅在帧率路径。
- **影响面**（对照 G1 非功能要求与目标容器）：支付宝 WebView 主力机型中 90/120/144Hz 设备完全不可玩；60Hz Android WebView 常见 16/17ms 交替量化约半数帧被丢弃（卡顿+慢动作）；30FPS 中端机恒半速。Must 级「弹弓发射核心玩法」在真实设备失效，**仍为阻断项**。

### 3.3 🟡 I2 —— 关卡地图星级渲染错误（确认未修复）

`LevelMap.client.tsx:64` 仍为 `"★★☆".slice(0, stars * 2)`。JS 语义实测：`stars=1 → "★★"`（虚高一颗）、`stars=2 → "★★☆"`、`stars=3 → "★★☆"`（**与 2★ 完全相同**）。数据层（storage/`levelStars`）、`/me` 页与结算弹层渲染正确，仅此一处错误；设计 §9「已 3 星格显示三颗金星」未满足。属重要项（三星评级激励的呈现缺陷），按口径不计入 guard_blocker_count。

### 3.4 testing-acceptance §1–9 其余项核对

| 验收项 | 状态 | 说明 |
|---|---|---|
| §1 单元/组件测试 | ⚠️ 未覆盖 | 仓库无测试框架与测试文件；本轮以独立脚本 8 项断言（转译真实源码执行）作为行为回归基线 |
| §2 接口/Mock | ✅ 源码核验 | 9 个 Route Handler 统一 `{code,message,data}` 包裹、SSR/CSR 同源 mock、好友榜 401 |
| §3 SEO 收录 | ✅ 护栏脚本 | check-seo rc=0；sitemap 只含 A 类、robots 屏蔽 `/play` `/me`、B 类 noindex |
| §4 分享 | ✅ 代码级 | OG/canonical 四处一致；App 内 URL+scheme；未臆造 `setShareContent` |
| §5 支付 e2e | ⚠️ 预留 | `pay-server.ts` wap.pay 占位、私钥仅服务端 env（check-build 通过）；真机未验 |
| §6 降级屏/B 类 | ✅ 代码级 | `AlipayGuard` 浏览器态降级 + scheme 唤起；真机未验 |
| §7 移动真机适配 | ❌ 受 B3 阻断 | 高刷真机（WKWebView/Android WebView 主力机型）核心玩法冻结，该项无法通过；待 B3 修复后真机复验 |
| §8 性能预算 | ✅ 构建级 | `/` 首屏 JS 142kB、`/play` 138kB、共享 chunk 87.2kB（本轮 build 实测）；未做真机 LCP/CLS/INP |
| §9 a11y | ⚠️ 未全验 | 热区/语义化/reduced-motion 代码级落地；未做 axe 扫描 |

### 3.5 素材清点（对照 assets_manifest.md）

`app/public/images/`：36 个文件 = **16 WebP + 19 SVG + CREDITS.md**，与清单「落盘 35 个（16 WebP + 19 SVG）」一致 ✅；占位图 0、需署名 0（全原创自绘）。注：`{game,empty,ranking,share}` 下 23 个素材当前代码零引用（`/play` 用 Canvas 程序化绘制），属已文档化的兜底素材（CR r2 nit4）。

---

## 4. 独立验证方法与证据

- **护栏与构建**：4 个脚本 + `tsc --noEmit` + `next build` 均在 `app/` 目录本轮实际执行，逐一捕获 rc（0/0/0/0/0/0）。
- **行为复验**：独立脚本 `/tmp/verify2/run_verify.mjs`（以 `app/node_modules/typescript` 的 transpileModule 把仓库真实 `constants.ts`/`mock/data.ts`/`engine.ts` 转为 CJS 后 require 执行），8 项断言：A/B1 阈值回归、B/B2 开局支撑、C1/C2 坍塌链路、D0/D1 B3 源码+步数实证、E B3 结算链、F I2 渲染语义——输出全数留档，rc=0。
- **变更确认**：`git status --short` 干净、`git log` 显示 `df9e7db`（CR r2）仅变更 3 个报告文件——即 B3/I2 所处代码与 CR r2 审阅基准零差异。
- **视觉验证未执行**（当前路由无可视化能力）：以代码级推演 + 确定性脚本实测 + 构建产物为准；真机高刷表现以 B3 步数实证为代理证据。

---

## 5. 残余风险与下一步

1. **B3 修复（一行，最小改动）**：`engine.ts:229` 改为 `if (steps >= 6) this.acc = 0;`（仅过载丢积压），或更稳妥的 `this.acc = Math.min(this.acc, 1000 / 60);`（最多留一步余量）。
2. **B3 修复验收标准（建议下轮 verify 执行）**：转译后断言——`update(8.33)×2 ≥ 1` 步；`update(16)×4 ≥ 3` 步；`update(33.3)` 每帧 2 步；60 关开局支撑、L1/L4 坍塌链路、清猪结算链在 `dt=8.33` 下全部复跑通过；`tsc`/`next lint` rc=0。本轮 D1/E 的实测值（0 步 / 永不结算）即修复前基线。
3. **I2 修复**：复用 `Stars` 组件，或 `"★".repeat(stars) + "☆".repeat(3 - stars)`；顺带核对 11px 字号下三字符宽度。
4. **补测与真机**：`update()` 帧率路径、`blockTopUnder/pigSupported` 单测化；B 类页降级/支付/OAuth/高刷真机核验（§7 当前被 B3 阻断）。
5. nit 6 项（CR r2 §6）可随后处理，不阻断。

---

## 6. 产物清点

- 生成：`.agents/changes/task-DEV-966dcd0a-7905-11f1-9649-3b4281182f10-39a41ec6-b29a-4b3f-8e55-9ddb600d6d6e/verify_report.md`（本文件，任务指定交付路径）；同步副本 `.agents/workflow/verify_report.md`。
- 写入：`.agents/changes/task-DEV-966dcd0a-7905-11f1-9649-3b4281182f10-39a41ec6-b29a-4b3f-8e55-9ddb600d6d6e/run_context.json` → `guard_blocker_count = 1`（`review_blocker_count=1` 为 CR r2 结论，保留）。
- 零仓库污染：独立复验脚本与构建日志位于 `/tmp/verify2*`，未触碰仓库源码与配置（本节点只读，仅生成报告与 run_context）。
