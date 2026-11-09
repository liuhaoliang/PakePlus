# 代码评审报告（cr_report · 第 3 轮）—— 弹弹鸟：鸟蛋保卫战

> 节点：代码评审（verify，第 3 轮——fix r2 已合入 `7f81043`，复核其 B3/I2 修复并全量回归）
> 采用技能：`code-review-skill`
> 审阅对象：`app/`（React 18 + TypeScript + Next.js 14 App Router + antd-mobile，独立子目录，39 个 TS/TSX 源文件 + globals.css + 配置）
> 输入：`.agents/workflow/requirements.md`（G1）、`.agents/workflow/design.md`（G2）、`.agents/workflow/assets_manifest.md`、`${spec_dir}/coding_summary.md`（**不存在**，以 `.agents/workflow/coding_summary.md` 副本 + `${spec_dir}/fix_summary.md`/`verify_report.md` 第 2 轮替代）
> 评审基准：当前工作区代码（`git status` 干净，与 HEAD `7f81043` 一致）；相对 CR r2 基准 `df9e7db` 的代码 delta = **仅 2 个文件**（`engine.ts` +4/-2、`LevelMap.client.tsx` +6/-3，`git diff df9e7db..HEAD --stat` 证实，其余为报告文件）

---

## 1. 评审结论（TL;DR）

**决策：✅ Approve（通过，可合入/进入下一节点）**

- **阻断项（blocking）：0**
- 重要项（important）：0（上轮 I2 已修复并核实）
- 轻微项（nit）/观察：6 项（继承 CR r2 §6，fix r2 已逐项给出有据暂缓，本轮复核暂缓理由依然成立，不阻断）
- **上轮阻断项 B3（引擎帧累加器重置条件写反）、重要项 I2（关卡地图星级渲染错误）全部核实修复有效**；第 1 轮 B1（星级阈值）/B2（支撑面判定）/I1（桥下猪）零回归。
- 独立行为复验 **25/25 PASS**（含修复前缺陷引擎负向对照，证明断言可检出缺陷）；`tsc --noEmit`、`next lint`、4 个护栏脚本、`next build` 全部 rc=0。

---

## 2. 覆盖范围与验证方法

| 维度 | 范围 | 结论 |
|---|---|---|
| 逐文件阅读 | 修复 delta 2 文件全文（`engine.ts` 466 行、`LevelMap.client.tsx` 99 行）+ `Stars.tsx`、`PlayClient.tsx`（450 行全）、`storage.ts`、`constants.ts`、`mock/data.ts`（布局/阈值/榜单段）+ 上轮 nit 涉及位复核 | 本轮针对性全读 ✅ |
| 未变更文件 | 其余 33 个 TS/TSX 自 CR r2 零变更（`git diff df9e7db..HEAD --stat` 仅 2 个代码文件），沿用 r1/r2 两轮全量通读结论 | 零差异 ✅ |
| 类型检查 | `tsc --noEmit`（strict + noUncheckedIndexedAccess） | rc=0，0 错误 ✅ |
| Lint | `next lint` | rc=0（No ESLint warnings or errors）✅ |
| 项目护栏 | `scripts/check-project.mjs` | rc=0（无禁止的容器/小程序/私有 API 遗址）✅ |
| SEO 护栏 | `scripts/check-seo.mjs` | rc=0（canonical/og 一致、无 cloaking）✅ |
| 发布门 | `scripts/check-build.mjs` | rc=0（env 边界安全、产物无私钥串）✅ |
| 能力矩阵 | `scripts/check-env.mjs` | rc=0 ✅ |
| 生产构建 | `next build`（本轮独立执行） | rc=0：60 个 `/level/[id]` SSG、9 个 API 路由、robots/sitemap 产出；`/levels` 133kB、`/play/[id]` 138kB、共享 chunk 87.2kB ✅ |
| 行为复验 | 独立脚本：TypeScript API 转译仓库真实 `constants.ts`/`mock/data.ts`/`engine.ts`/`Stars.tsx` 为 CJS 后执行，25 项断言（含缺陷引擎负向对照） | **25/25 PASS**，见 §3–§5 证据 |

> 审阅方式：不采信 fix_summary 自述，用转译后的真实源码重跑全部断言（含把修复行还原为缺陷行的负向对照引擎）。**视觉验证未执行**（当前路由无可视化能力）；引擎行为结论均来自确定性脚本实测，UI 呈现结论以 `react-dom/server` 静态渲染实测为准；真机高刷表现以物理步数计数为代理证据。

---

## 3. 🔴→✅ B3 修复复核 —— 引擎帧累加器重置条件（blocking 清零）

- **修复内容**（`app/src/game/engine.ts:229-231`，`7f81043`）：`if (steps < 6) this.acc = 0;` → `if (steps >= 6) this.acc = 0;`（+2 行注释）。采用 CR r2 首选方案：仅过载（单帧 6 步仍未消化完）时丢弃积压防死亡螺旋，正常帧保留不足一个物理步（16.6667ms）的余量继续累积。
- **逻辑推演复核**：`while (this.acc >= 1000/60 && steps < 6)` 消化整步后，正常帧（steps < 6）不再清零 `acc` → dt < 16.6667ms 的帧时间跨帧累积凑整成步，高刷屏不再丢帧；过载帧清零贴合原防死亡螺旋意图。两个候选方案（`steps >= 6` 清零 vs `Math.min(acc, 1000/60)` 收敛）在正常帧完全等价（while 循环必然已把 acc 消化至 < 1000/60），差异仅在过载帧，所选方案正确。
- **独立步数矩阵实证**（转译真实 `engine.ts`，插桩 `GameEngine.prototype.step` 计数，CR r2 §4 / verify r2 §5.2 验收标准逐项）：

| 帧距场景 | 验收标准 | 本轮实测 | 结果 |
|---|---|---|---|
| `update(1000/120)×2` [120Hz 精确] | ≥1 步 | **1 步** | ✅ |
| `update(8.33)×600` [120Hz 量化] | 长跑推进 | **299 步**（理想 299.9） | ✅ |
| `update(16)×4` [60Hz 整数量化] | ≥3 步 | **3 步** | ✅ |
| `update(16.666)×600` [60Hz 抖动] | 长跑推进 | **599 步**（理想 599.98） | ✅ |
| `update(17)×60` [60Hz 正常] | 正常 | **61 步**（理想 61.2） | ✅ |
| `update(33.3)×60` [30FPS] | 每帧 2 步 | 总 119 步，**帧 2–60 恒 2 步** | ✅ |
| `update(200)` 过载 | ≤6 步且无死亡螺旋 | **6 步且积压清零**；随后 `update(16)`→0 步、再 1 步（恢复推进） | ✅ |

- **行为链路全部在 `dt=8.33ms`（120Hz）驱动下复跑**（修复前该帧率物理零推进、永不结算）：

| 断言 | 结果 |
|---|---|
| A. 60 关开局支撑：`recomputeFalling` 后无 falling 猪；驱动 1s 后全部存活、无坠落、未终局 | 异常关卡 = **[]** ✅ |
| B. L1 拆承重平台（top=542）→ 猪坠落 → 落地 feet=**560.00**（ground）→ 存活；坠落过程 240 帧物理步=**119** | ✅ |
| C. L4 碎左玻璃（top=509）→ 左猪坠至木平台顶 feet=**542.00** 存活（落差 33px，冲击速度 ≈244 < FALL_DAMAGE_SPEED 320）；右猪零位移（<1e-9）且不受影响 | ✅ |
| E. L1 清猪 → win → 3★、score=**4000**、birdsUsed=0（`finished` 事件正确触发） | ✅ |

- **负向对照**（证明本轮断言可检出缺陷，非空转）：把修复行还原为缺陷行构造旧引擎——`update(8.33)×600` = **0 步**、`update(16.666)×600` = **0 步**，与 CR r2 / verify r2 实测基线完全一致。
- **结论**：B3 修复有效且最小（1 行条件反转 + 注释），过载保护语义保持，无副作用（持续过载帧丢弃 ~10ms/帧属防死亡螺旋的既定权衡，9 FPS 场景下可接受）。

---

## 4. 🟡→✅ I2 修复复核 —— 关卡地图星级渲染（important 清零）

- **修复内容**（`app/src/components/LevelMap.client.tsx:64-66`，`7f81043`）：渲染分支由 `"★★☆".slice(0, stars * 2)` 改为复用 `Stars` 组件（`<Stars count={stars} size={11} />`）；`starsOf` 返回类型收窄为 `0 | 1 | 2 | 3`（`storage.ts:9` `levelStars: Record<string, 0|1|2|3>`，写入方 `recordScore` 仅接受 `GameResult.stars` 同联合类型，收窄类型安全成立）。
- **静态渲染实证**（`react-dom/server` 渲染真实 `Stars.tsx` 转译产物）：gold(1)=1、gold(2)=2、gold(3)=3，总星数恒 3，`aria-label="${n} 星"` 正确——**1★/2★/3★ 完全可区分**，满足设计 §9「已 3 星格显示三颗金星」（#FFB400 金 + #E6D9C8 灰）。
- **负向对照**（JS 语义留档）：旧写法 `stars=1 → "★★"`（虚高一颗）、`stars=3 → "★★☆"`（与 2★ 完全相同）——本轮脚本复现一致，证明缺陷真实存在且已消除。
- **边界复核**：11px 字号三字符 + letterSpacing 1 在 4 列网格（移动端最窄 ~78px/格）下约 38px 宽，无溢出；`stars=0` 且已解锁时回落显示 `lv.name`（既有行为，未变）；嵌套 aria（cell aria-label + Stars aria-label）不产生冲突语义。
- **结论**：I2 修复正确，选择复用组件落实了设计的金星颜色与 aria 语义，无新问题。

---

## 5. 前轮修复回归 + 新问题扫描

### 5.1 第 1 轮修复（B1/B2/I1）—— 零回归 ✅

| 断言（本轮独立复算） | 结果 |
|---|---|
| B1 星级阈值：60 关 × 5 断言（1★ ≤ 猪分Σ / 3★ < 理论满分 / 阈值严格递增 / 清猪必得 ≥1★ / 满分必 3★） | 违规 = 0/0/0/0/0 ✅ |
| B2 开局支撑：60 关全部猪 `recomputeFalling` 后无 falling | 异常关卡 = [] ✅ |
| I1 桥下猪：被 60 关开局支撑断言覆盖 | ✅ |

### 5.2 修复 diff 边界审查（新问题扫描）—— 无新增问题 ✅

- `engine.ts` delta 仅 `update()` 尾部 1 行 + 注释：浮点残差（~1e-13/步）可忽略；`Math.min(dtMs, 200)` 截断与 6 步上限构成的双保险未变；`updateParticles` 用真实 dt 的既行为未变。
- `LevelMap.client.tsx` delta 为渲染分支替换 + import + 类型收窄：SSR 期 `save===null` 路径（全部可点、供 SEO 抓取 60 条链接）不受影响；未解锁分支（🔒 + sr-only 提示）不变。
- 调用链复核：`PlayClient.tsx:199-206` rAF 主循环 `eng.update(dt)` 与修复后的累加器语义匹配（任意刷新率下物理速率稳定 60 步/秒）。

### 5.3 CR r2 nit/观察项（6 项）—— 暂缓理由复核，维持不阻断 📚

| # | 项 | 本轮复核 | 处置 |
|---|---|---|---|
| 1 | 鸟无地面碰撞/顶点悬停（`engine.ts:240-252`） | 代码未变；结算兜底（出界/超时/低速）覆盖，边缘手感非功能失效 | ⏸ 暂缓（合理） |
| 2 | L60「下一关」死按钮（`nextLevelId(60)=60`，`data.ts:258-260`；`PlayClient.tsx:320` 仍渲染该 Link） | 代码未变；「重试本关」`location.reload` 兜底可用 | ⏸ 暂缓（需产品决策，合理） |
| 3 | 固定 0.45s 结算窗与布局耦合 | 代码未变；当前 60 关布局最大坠落 33px < 触发阈值，无实际影响 | ⏸ 暂缓（合理） |
| 4 | ~124KB 未引用素材随包发布（`public/images/{game,empty,ranking,share}` 23 文件） | 未变；已在 coding_summary §2.4/§5 文档化的兜底素材 | ⏸ 暂缓（合理，建议后续 README 标注） |
| 5 | 文案标点不统一（`MyRank`/`ShareFav` 半角逗号 ×4 处） | 未变，极轻微 | ⏸ 暂缓（合理） |
| 6 | `POST /api/orders` 未校验登录态 | 未变；预留接口返回占位订单，实接 wap.pay 前需补 uid 校验与金额白名单 | ⏸ 暂缓（合理） |

> 上述 6 项均为 CR r2 自评「不阻断」、fix r2 有据暂缓且本轮复核代码零变更——维持暂缓，不升级为阻断/重要项。

---

## 6. 亮点（praise）

- 🎉 **修复纪律好**：B3 一行条件反转 + 注释即达验收标准全绿，I2 复用 `Stars` 组件而非内联修补，顺带落实设计色值与 aria 语义；两个文件 +7/-3 行，零 scope 蔓延。
- 🎉 **可验证性**：引擎纯逻辑无 DOM 依赖，使本轮能在无浏览器环境下以确定性步数计数 + 静态渲染完成复核；fix r2 的自报数据（299/599/119 步、6/0/1 过载序列、4000 分 3★）与本轮独立实测**逐项一致**，可信。
- 🎉 全链路护栏保持绿色：tsc strict + noUncheckedIndexedAccess 零错误、lint 零警告、4 个护栏脚本与生产构建 rc=0；`/play` 动态路由 138kB、共享 chunk 87.2kB，性能预算（主 bundle ≤ 200KB）达标。
- 🎉 容器边界干净：无 `my.*`/`AlipayJSBridge`/`ap.tradePay` 遗址（check-project 实测），素材全原创自绘零署名义务（assets_manifest §汇总）。

---

## 7. 验证记录（本轮实际执行）

| 检查 | 命令 | 结果 |
|---|---|---|
| 类型检查 | `tsc --noEmit`（app/） | rc=0 ✅ |
| Lint | `next lint` | rc=0 ✅ |
| 能力矩阵 | `node scripts/check-env.mjs .` | rc=0 ✅ |
| 项目护栏 | `node scripts/check-project.mjs .` | rc=0 ✅ |
| SEO 护栏 | `node scripts/check-seo.mjs .` | rc=0 ✅ |
| 发布门 | `node scripts/check-build.mjs .` | rc=0 ✅ |
| 生产构建 | `next build` | rc=0（60 SSG + 9 API + robots/sitemap）✅ |
| B3 步数矩阵 | 独立断言 ×7（120Hz 精确/量化、60Hz 量化/抖动/正常、30FPS、过载） | 全部通过 ✅ |
| B3 行为链路 | A（60 关支撑）/B（L1 坍塌）/C（L4 坍塌）/E（结算）@dt=8.33ms | 全部通过 ✅ |
| B3 负向对照 | 缺陷引擎 `update(8.33/16.666)×600` | 0 步（可检出缺陷）✅ |
| B1 星级可达性 | 独立断言（60 关 × 5） | 零违规 ✅ |
| I2 渲染 | `react-dom/server` 静态渲染真实 `Stars` ×3 + 旧写法负向对照 | gold=n 全通过 ✅ |
| 源级断言 | engine 修复行在场/缺陷行不在；LevelMap 接线 Stars/缺陷切片不在 | 通过 ✅ |
| 视觉验证 | — | **未执行**（当前路由无可视化能力） |

运行环境：`/tmp/node-v20.18.0-linux-x64/bin/node`（v20.18.0）；独立脚本与转译产物均在 `/tmp/cr_r3/`，未触碰仓库（`git status` 保持干净）。

---

## 8. 结论与指标

| 指标 | 值 |
|---|---|
| **review_blocker_count** | **0** |
| important | 0 |
| nit/observation（暂缓，不阻断） | 6 |
| 上轮阻断/重要项回归 | 0（B3/I2 修复核实有效；B1/B2/I1 零回归） |
| 新引入问题 | 0 |

**决策：✅ Approve。** B3 与 I2 修复均通过独立行为实证（含负向对照），全部工具链与护栏检查绿色，修复范围最小且无副作用。剩余 6 项 nit 已有据暂缓，可作为后续批次处理（建议优先级：nit2 L60 死按钮产品决策 > nit4 素材标注 > nit5 文案）。残余风险：真机高刷（WKWebView/Android WebView）与 B 类页降级仍未经真机验证，建议在发布门前以步数计数实测数据为基线做一次真机抽验。

> 本报告写入 `${spec_dir}/cr_report.md`（任务指定交付路径，覆盖第 2 轮——r2 内容已随 `df9e7db` 入库），并同步副本至 `.agents/workflow/cr_report.md`；`review_blocker_count=0` 已写入 `${spec_dir}/run_context.json`（保留 `guard_blocker_count` 原值，该键属验收节点，由下轮护栏检查节点更新）。
