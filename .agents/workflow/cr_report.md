# 代码评审报告（cr_report · 第 2 轮）—— 弹弹鸟：鸟蛋保卫战

> 节点：代码评审（verify，第 2 轮复核——上一轮评审的 B1/B2/I1 修复已合入 db97140 之后）
> 采用技能：`code-review-skill`
> 审阅对象：`app/`（React 18 + TypeScript + Next.js 14 App Router + antd-mobile，独立子目录，39 个 TS/TSX 源文件 + globals.css + 配置）
> 输入：`.agents/workflow/requirements.md`（G1）、`.agents/workflow/design.md`（G2）、`.agents/workflow/assets_manifest.md`、`${spec_dir}/coding_summary.md`（**不存在**，以 `.agents/workflow/coding_summary.md` 副本 + `${spec_dir}/fix_summary.md` 替代）
> 评审基准：当前工作区代码（`git status` 干净，与 db97140 一致）

---

## 1. 评审结论（TL;DR）

**决策：🔴 Request Changes（需修改后合入）**

- **阻断项（blocking）：1 个（本轮新发现，非上轮回归）**
- 重要项（important）：1 个（本轮新发现）
- 轻微项（nit）/观察：6 项
- **上轮阻断项 B1（星级阈值失配）、B2（猪支撑面判定）、重要项 I1（桥下猪悬空）全部核实修复有效**，nit 6 项修复亦逐一落地。

本轮发现的核心问题：**物理引擎 `update()` 的帧时间累加器重置条件写反**——`if (steps < 6) this.acc = 0` 在「未触及步数上限」的每一帧都把不足一个物理步的剩余时间清零。实测 `update(dt ≤ 16.666ms)` 连续 600 次物理零推进：**刷新率高于 60Hz 的设备（120Hz ProMotion iPhone / 90~144Hz Android，支付宝 WebView 目标受众的主力机型）游戏完全冻结**；60Hz 下因 rAF 时间戳抖动/整数量化（16/17ms 交替）约半数帧被丢弃，表现为卡顿与慢动作。这是 Must 级核心玩法在真实设备上的功能性失效，必须修复。

---

## 2. 覆盖范围与验证方法

| 维度 | 范围 | 结论 |
|---|---|---|
| 逐文件阅读 | `app/src/**` 全部 39 个 TS/TSX（9 Route Handler + 10 页面/路由 + 11 组件 + container + game×2 + lib×6）+ globals.css + next.config.mjs/.eslintrc.json | 本轮全量通读 ✅ |
| 类型检查 | `tsc --noEmit`（strict + noUncheckedIndexedAccess） | rc=0，0 错误 ✅ |
| 项目护栏 | `scripts/check-project.mjs` | rc=0 ✅ |
| SEO 护栏 | `scripts/check-seo.mjs` | rc=0 ✅ |
| 发布门 | `scripts/check-build.mjs` | rc=0 ✅ |
| 能力矩阵 | `scripts/check-env.mjs` | rc=0 ✅ |
| Lint | `next lint` | rc=0（No ESLint warnings or errors）✅ |
| 行为复验 | 独立脚本：TypeScript 转译仓库真实 `constants.ts`/`mock/data.ts`/`game/engine.ts` 为 CJS 后执行 60 关全量断言 + 引擎场景用例 | 见 §3/§4 证据 |
| 生产构建 | 本轮未重跑；引用 fix_summary 记录（`next build` rc=0，60 个 `/level/[id]` SSG 页产出），本轮代码与之零差异（git status 干净） | 引用值 ⚠️ |

> 审阅方式：逐文件阅读 + 上轮修复点独立复算（不采信 fix_summary 自述，用转译后的真实源码重跑断言）。**视觉验证未执行**（当前路由无可视化能力）；引擎行为结论均来自确定性脚本实测，UI 呈现类问题（如 §5 I2）以代码推演 + JS 语义实证为准。

---

## 3. 上轮修复复核（全部通过）

### 🔴→✅ B1 星级阈值（`app/src/lib/mock/data.ts:204-217` `scoreTargets()`）

独立复算 60 关（口径：`BLOCK_SCORE{glass:200,wood:300,stone:400}`、`PIG_SCORE{normal:1000,king:1500}`、`BIRD_BONUS=1000`）：

| 断言 | 结果 |
|---|---|
| 1★ 不可达（targetScore > 猪分Σ） | **0/60** ✅ |
| 3★ 超理论上界（starScore[1] ≥ 猪分Σ+块分Σ+奖励上限） | **0/60** ✅（裕量 ≥ 0.2×块分Σ + 0.35×奖励 − 取整 50 > 0，最小块分Σ=700 ⇒ 裕量 ≥ 90） |
| 阈值非严格递增（targetScore < star2 < star3） | 0/60 ✅ |
| 仅清空全部猪（得猪分Σ）星级 < 1 | 0/60 ✅（通关必得 ≥1★） |
| 理论满分星级 ≠ 3 | 0/60 ✅（完美通关必 3★） |

### 🔴→✅ B2 猪支撑面判定（`app/src/game/engine.ts:302-324`）

- `blockTopUnder(x, feetY)` 增加 `feetY` 参数并跳过 `top < feetY - SUPPORT_TOL` 的面（顶梁/高块顶面位于猪脚上方，不再误判为支撑），取满足条件的最高面——逻辑正确。
- **开局支撑 60 关全量断言：无支撑猪所在关卡 = []（空）** ✅（含 I1 的桥下猪、glassTower 玻璃托猪、stoneFort 猪王）。
- 场景推演（dt=17ms 实测，见 §4 说明）：L1 头顶顶梁/加高块 → 有支撑；拆掉上方两块仍支撑；拆平台（真承重面）→ 坠落 → 落到地面（脚 y=560.0）且存活（落差 22px < 摔伤阈值）✅。L4 打碎左玻璃 → 左猪坠落并落到木平台顶 542 且存活（落差 64px）、右猪不受影响 ✅。
- 落地检测/`pigSupported` 均已传 `p.y + p.r`，`SUPPORT_TOL=18` 与落地窗口 `top+20` 自洽 ✅。

### 🟡→✅ I1 桥下猪（`data.ts:106`）

`y = g - pigR` 站在桥下地面，被 60 关开局支撑断言覆盖 ✅。

### nit 修复落地核对（6/6）

| 项 | 位置 | 核对结果 |
|---|---|---|
| 首页精选卡星级误导 | `page.tsx:96` | 已改「3★ 目标」，`Stars` import 已移除 ✅ |
| 死代码 api.ts/useInAlipay.ts | 文件已不存在 | `find` 确认删除 ✅ |
| 蓝鸟文案对齐 | `engine.ts:200`、`data.ts GUIDES/FAQ`、`PlayClient.tsx:290` | 统一为「俯冲增速、冲击更强，分裂预留」✅ |
| pausedRef 渲染期写入 | `PlayClient.tsx:214-216` | 已移入 `useEffect` ✅ |
| 榜单 og:image 40×40 | `leaderboard/page.tsx:20` | 已改 `ch-hill.webp`（1200×400）✅ |
| twitter 元信息补全 | `layout.tsx:21-26` | title/description/images 齐全 ✅ |

---

## 4. 🔴 [blocking] B3 —— 引擎帧累加器重置条件写反：高刷新率设备游戏完全冻结

- **位置**：`app/src/game/engine.ts:219-230`（`update()`），关键行 `engine.ts:229`：

  ```ts
  update(dtMs: number): void {
    if (this.finished) return;
    let steps = 0;
    this.acc += Math.min(dtMs, 200);
    while (this.acc >= 1000 / 60 && steps < 6) {
      this.step(1 / 60);
      this.acc -= 1000 / 60;
      steps += 1;
    }
    this.updateParticles(dtMs / 1000);
    if (steps < 6) this.acc = 0;   // ← 缺陷：条件写反
  }
  ```

- **机理**：`if (steps < 6) this.acc = 0` 的本意应是「过载（一帧消化不完、触及 6 步上限）时丢弃积压防死亡螺旋」，但实际条件相反——**凡未触及步数上限的帧（即正常帧）都会把不足一个物理步（16.667ms）的剩余时间清零**。于是任何 `dt < 1000/60 = 16.6667ms` 的帧，其时间被整帧丢弃，累加器永远凑不满一个物理步。
- **调用链**：`PlayClient.tsx:199-206` rAF 主循环 `const dt = now - last; … eng.update(dt)`，dt 即真实帧间隔——无任何补偿路径，物理推进完全依赖该 `update()`。
- **实证**（转译仓库真实 `engine.ts` 执行，L1 拆承重面使猪进入坠落态后连调 `update(dt)` 600 次）：

  | rAF 帧间隔 | 物理推进 | 表现 |
  |---|---|---|
  | `dt=8.33ms`（120Hz） | **猪 y=516.0 不动，仍 falling** | **游戏完全冻结**（可拖拽瞄准，松手后鸟永远不飞、永不结算） |
  | `dt=16ms`（60Hz 时间戳量化到整 ms） | 同上不动 | 帧被整帧丢弃 |
  | `dt=16.666ms`（< 1000/60） | 同上不动 | 帧被整帧丢弃 |
  | `dt=16.667ms` | 正常（1 步/帧） | 正常 |
  | `dt=17ms` | 正常 | 正常 |
  | `dt=33.3ms`（30FPS） | 1 步/帧（剩余 16.63ms 被丢弃） | **半速慢动作** |

- **影响面（对照 G1 §10 非功能要求与目标容器）**：
  - **>60Hz 设备（120Hz ProMotion iPhone、90/120/144Hz Android 旗舰与大量中端机）＝ 支付宝 WebView 主要受众 → 游戏完全不可玩**。Must 级「弹弓发射核心玩法」在真实设备上失效。
  - 60Hz 设备：rAF 时间戳抖动或整 ms 量化（Android WebView 常见 16/17ms 交替）导致约半数帧被丢弃 → 有效物理速率降至 ~30 步/秒，卡顿 + 慢动作。
  - 30FPS 弱机（G1 预算「中端机稳定 ≥ 30FPS」）：恒半速慢动作。
  - 注意粒子 `updateParticles(dtMs/1000)` 用真实 dt 更新——冻结时爆炸粒子仍在飘，画面「有动画但物理冻结」，更易被误判为「卡了」而非死锁。
- **为何此前未被发现**：fix_summary 的行为复验脚本以 `update(16.67+)` 级别步长驱动（每帧必有 ≥1 步），恰好落在正常区间；`next build`/lint/tsc 均无法暴露时序问题；两轮均未做真机/浏览器视觉验证。
- **修复建议（最小改动）**：

  ```ts
  if (steps >= 6) this.acc = 0; // 仅过载时丢弃积压；正常帧保留不足一步的余量累积
  ```

  或更稳妥：`this.acc = Math.min(this.acc, 1000 / 60)`（永远最多留一步余量）。
- **修复验收标准（建议复核节点执行）**：转译后断言——`update(8.33)×2` 至少推进 1 步；`update(16)×4` 至少推进 3 步；`update(33.3)` 每帧 2 步；60 关开局支撑、L1/L4 坍塌链路、结算链路在 `dt=8.33` 下全部复跑通过；`tsc`/`next lint` rc=0。

---

## 5. 🟡 [important] I2 —— 关卡地图星级渲染错误：1★ 显示两星、3★ 与 2★ 无法区分

- **位置**：`app/src/components/LevelMap.client.tsx:64`

  ```tsx
  {open ? (stars > 0 ? "★★☆".slice(0, stars * 2) : lv.name) : "🔒"}
  ```

- **实证**（JS 语义，`"★★☆"` 为 3 字符串）：`stars=1 → "★★"`（虚高一颗）；`stars=2 → "★★☆"`（恰巧正确）；`stars=3 → "★★☆"`（**与 2★ 完全相同**）。
- **影响**：设计 §9 `/levels` 线框明确「已 3 星格显示三颗金星」。当前满星成就（三星评级是 Must 功能、复玩核心激励）在关卡地图上不可见，玩家会误以为未达成而反复重打；1★ 关卡被虚标为 2★。数据层（storage/`levelStars`）、`/me` 页（`"★".repeat(stars)`）、结算弹层均正确，仅此一处渲染错误。
- **建议**：复用 `Stars` 组件，或 `"★".repeat(stars) + "☆".repeat(3 - stars)`；顺带核对网格内字号 11px 下三字符的可用性。

---

## 6. 🟢 [nit] / 💡 [suggestion] / 📚 [learning]

1. **🐦 无地面碰撞与顶点悬停**（`engine.ts:240-252`）：小鸟与地面无碰撞反弹，高速落地的鸟穿透地面直至 `y > groundY+40` 才结算，且 `done` 鸟仍被绘制（`PlayClient.tsx:426-431`）——视觉上是「嵌进草地半截」。另外垂直向上发射时抛物线顶点速度为 0 < `SETTLE_SPEED`，鸟会在半空顶点直接「结算」消失。均为边缘手感问题，非功能失效。
2. **L60「下一关」是死按钮**：`nextLevelId(60)=60`（`data.ts:258-260`），通关第 60 关后结算层显示「下一关：第 60 关」，Link 软导航到 `/play/60`，`level` 为模块单例同一对象引用 → `useEffect [level]`（`PlayClient.tsx:212`）不会重跑，引擎停在终局状态，按钮点了没反应（「重试本关」可用 `location.reload` 兜底）。建议 `nextId === level.id` 时隐藏该按钮或改为「再玩一次/回关卡地图」。
3. **固定 0.45s 结算等待窗与布局耦合**（`engine.ts:249,277-288`）：猪坠落超过 ~91px 需 >0.45s，会在判定胜负时仍在空中（当前布局最大坠落 64px——glassTower 右猪 478→542，落地 0.38s，恰好安全）。布局若加高塔即成隐患，建议改为「所有猪 falling=false 或超时 2s 才结算」。
4. **~124KB 未引用素材随包发布**：`public/images/{game,empty,ranking,share}` 共 23 个文件在代码中 0 引用（`/play` 用 Canvas 程序化绘制、榜单用 CSS 徽章、og 用章节封面——偏离已在 coding_summary §2.4/§5 文档化）。属可接受的兜底素材，但建议在 README/资产清单标注「未接线」，或后续接入 sprite 渲染时启用。
5. **文案标点不统一**：`MyRank.client.tsx:24-25`、`ShareFav.client.tsx:29,44` 用半角逗号（「登录后上榜,跨端同步」），全站其余为全角。极轻微。
6. **`POST /api/orders` 未校验登录态**（`orders/route.ts`）：设计标记「登录态」，当前是返回占位订单的预留接口，可接受；实接 wap.pay 前需补 uid 校验与金额白名单。

📚 复核上轮 3 项「有据暂缓」（eslint.ignoreDuringBuilds / 服务端 unlockRule 校验 / collideBird 单块处理）：暂缓理由依然成立（lint 本轮实跑 rc=0；单机 localStorage 进度无服务端存储；碰撞窗口 44px > 最大步长 30px），维持暂缓，不升级。

---

## 7. 亮点（praise）

- 🎉 **上轮修复质量高**：B1 用内容推导阈值（通关必得星、满分必 3★ 有数学保证）；B2 的 `feetY` 过滤 + 取最近承重面是正确且最小的修法；nit 6 项全部落地且无回归（本轮全量复算通过）。
- 🎉 引擎纯逻辑无 DOM 依赖，事件回调驱动 UI，可测性好（本轮独立脚本正是受益者）。
- 🎉 容器边界干净：全仓无 `my.*`/`AlipayJSBridge.call`/`ap.tradePay` 遗址，`isAlipayClient` 仅做 UA/存在性判定，无 cloaking；4 个护栏脚本全绿。
- 🎉 SEO 结构完整：canonical==og:url 四处一致、sitemap 只含 A 类、B 类双保险（robots + noindex）、JSON-LD 齐全；globals.css 落实了 safe-area/44px 热区/prefers-reduced-motion。
- 🎉 TypeScript strict + noUncheckedIndexedAccess 零错误，死代码已清除。

---

## 8. 验证记录（本轮实际执行）

| 检查 | 命令 | 结果 |
|---|---|---|
| 类型检查 | `tsc --noEmit`（app/） | rc=0 ✅ |
| 能力矩阵 | `node scripts/check-env.mjs .` | rc=0 ✅ |
| 项目护栏 | `node scripts/check-project.mjs .` | rc=0 ✅ |
| SEO 护栏 | `node scripts/check-seo.mjs .` | rc=0 ✅ |
| 发布门 | `node scripts/check-build.mjs .` | rc=0 ✅ |
| Lint | `next lint` | rc=0 ✅ |
| B1 星级可达性 | 独立断言（转译真实源码，60 关 × 6 断言） | 全部通过 ✅ |
| B2 开局支撑 | 独立断言（60 关全部猪） | 全部通过 ✅ |
| B2 坍塌链路 | L1/L4 场景（dt=17ms 驱动） | 全部通过 ✅ |
| 结算链路 | 清猪 → win → ≥1★（dt=17ms） | 通过 ✅ |
| **B3 帧率实证** | `update(dt)` 扫描 {8.33,16,16.666,16.667,17,33.3}ms ×600 | **dt ≤ 16.666ms 物理零推进（阻断证据）** |
| 视觉验证 | — | **未执行**（当前路由无可视化能力） |

运行环境：`/tmp/node-v20.18.0-linux-x64/bin/node`（v20.18.0）；独立脚本与转译产物均在 `/tmp/crverify/`，未触碰仓库。

---

## 9. 结论与指标

| 指标 | 值 |
|---|---|
| **review_blocker_count** | **1**（B3：engine.ts `update()` 帧累加器重置条件写反，高刷屏游戏冻结） |
| important | 1（I2：LevelMap 星级渲染错误） |
| nit/observation | 6 |
| 上轮阻断项回归 | 0（B1/B2/I1 修复全部核实有效） |

**决策：🔴 Request Changes。** B3 为一行条件反转的最小修复（`steps < 6` → `steps >= 6`），修复后按 §4 验收标准复跑行为断言即可；I2 建议同批修复。其余 nit 可随后处理。

> 本报告写入 `${spec_dir}/cr_report.md`（任务指定交付路径），并同步副本至 `.agents/workflow/cr_report.md`；`review_blocker_count=1` 已写入 `${spec_dir}/run_context.json`（保留 guard_blocker_count 原值，该键属验收节点）。
