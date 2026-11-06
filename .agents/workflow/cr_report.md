# 代码评审报告（cr_report）—— 弹弹鸟：鸟蛋保卫战

> 节点：代码评审（verify）
> 采用技能：`code-review-skill`
> 审阅对象：`app/`（React + TypeScript + Next.js App Router + antd-mobile，独立子目录，41 个 TS/TSX 源文件 + 9 个 Route Handler）
> 输入：`.agents/workflow/requirements.md`（G1）、`.agents/workflow/design.md`（G2）、`.agents/workflow/coding_summary.md`（G3）、`.agents/workflow/assets_manifest.md`

---

## 1. 评审结论（TL;DR）

**决策：🔴 Request Changes（需修改后合入）**

- **阻断项（blocking）：2 个**
- 重要项（important）：1 个
- 轻微项（nit）+ 建议（suggestion）：若干

整体完成度高：工程结构清晰、类型安全（strict + noUncheckedIndexedAccess 0 错误）、SEO/容器能力边界/护栏脚本均达标、mock 数据真实贴近业务。但**核心玩法闭环存在两处功能性缺陷**：① 星级阈值全局失配导致星级结算功能在绝大多数关卡不可达成；② 猪的「支撑/坍塌」判定取错支撑面，导致架空的猪在首次结算/破块后整体坠落到地面，破坏「结构摧毁/借力倒塌」这一 Must 玩法。

---

## 2. 覆盖范围与验证方法

| 维度 | 范围 | 结论 |
|---|---|---|
| 类型/编译 | `app/` 全部 41 个 TS/TSX + 9 个 Route Handler | `tsc --noEmit` rc=0，0 错误 ✅ |
| 项目护栏 | `scripts/check-project.mjs`（禁用 API 遗址） | rc=0 ✅ |
| SEO 护栏 | `scripts/check-seo.mjs`（canonical/og 一致、sitemap/robots、无 cloaking） | rc=0 ✅ |
| 发布门 | `scripts/check-build.mjs`（env/密钥边界） | rc=0 ✅ |
| 能力矩阵 | `scripts/check-env.mjs` | rc=0 ✅ |
| 核心逻辑 | 物理引擎 `game/engine.ts`、`mock/data.ts` 计分/布局 | 独立核算脚本见 §4 |

> 审阅方式：逐文件阅读 `app/src/**`，重点核对物理引擎、关卡布局与计分、SEO/容器边界；对「星级可达性」用独立脚本复算 60 关理论最高分与阈值差，对支撑逻辑做了逐行推演。视觉验证未执行（当前路由无可视化能力），以代码级推演 + 数值核算为准。

---

## 3. 问题清单（按严重度）

### 🔴 [blocking] B1 —— 星级阈值全局失配，星级结算对绝大多数关卡不可达成

- 位置：`app/src/lib/mock/data.ts:204-208`（targetScore / starScore 公式）、`app/src/lib/constants.ts:30-32`（分值常量）、`app/src/game/engine.ts:407-409`（剩余鸟奖励）、`:368-377`（拆块计分）、`:379-393`（猪计分）。
- 现象：`targetScore = 4000 + id*160 + difficulty*1000`，二/三星阈值再 ×1.6 / ×2.4。而单关可得分数上限 = 全部存活块分值 + 全部猪分值 + (可用鸟数-1)×1000。
- 独立核算结果（对 60 关逐一取理论最高分，即「击毁全部块 + 击倒全部猪 + 仅用 1 只鸟」的上界）：
  - **1 星（targetScore）不可达：58 / 60 关**
  - **2 星不可达：60 / 60 关**
  - **3 星不可达：60 / 60 关**
- 具体示例：
  - 第 1 关：5 个木块（5×300=1500）+ 1 猪（1000）+ 剩余 2 鸟奖励（2000）= 理论最高 **4500**，而 targetScore = **5160**（二星 8300 / 三星 12400）。即使完美通关也只能 **0 星**。
  - 第 2、7 关（双塔 11 块 + 2 猪 + 2 鸟奖励，上界 7300）是仅有的 2 个可达 1 星的关卡，但二星仍不可达。
- 影响：`结算（星级/分数）` 是 G1 的 **Must** 功能。现状为「过关弹 🎉 但永远 0 星」，星级这一核心目标与分享/留存的激励闭环失效。
- 建议：以「单关理论最高分」为基准反推阈值（例如 targetScore ≈ 该关块/猪总分 × 系数 + 1~3 鸟奖励），并给全部 60 关做一次达标校验（≥ 可达成 1 星、3 星存在于至少一套可行解）。

### 🔴 [blocking] B2 —— 猪的支撑/坍塌判定取错支撑面，架空猪在首次结算/破块后整体坠落

- 位置：`app/src/game/engine.ts:306-317`（`blockTopUnder`）、`:300-304`（`pigSupported`）、`:293-298`（`recomputeFalling`，由 `afterSettle` `:289-291`、`breakBlock` `:375`、`damagePig` `:387` 触发）。
- 现象：`blockTopUnder` 的意图注释是「返回猪脚下最近的存活块顶面」，但实现取的是**水平重叠块中 top 最小（即最高、最靠近屏幕上方）的那一块**，未过滤「位于猪脚下方的面」：
  ```ts
  const top = blk.y - blk.h / 2;
  if (best === null || top < best) best = top; // 取最小 top ⇐ 顶梁/高块，而非脚下的平台
  ```
  `pigSupported` 再以 `Math.abs(p.y + p.r - top) < 18` 判定，于是「猪站在平台上、头顶还有顶梁/高块」的常规塔形结构被误判为「无支撑」。
- 逐行推演（第 1 关 singleTower）：猪脚 y=538，平台顶 542、顶梁顶 471、上方附加块顶 435。`blockTopUnder` 返回 435 → `|538-435|=103 ≥ 18` → `pigSupported=false` → 首次 `recomputeFalling`（第一只鸟落地/任一破块/击猪触发）后**所有架空猪 `falling=true` 并坠落到 groundY**。
- 影响：架空猪（singleTower/twinTower/glassTower/bridge，约占多数关卡）在游戏进行中**整体沉到地面**，塔/堡结构形同虚设，「拆支撑→借力倒塌」这一 Must 玩法（G1 功能池「碰撞摧毁 + 重力坍塌」、coding_summary §2.2 声称的能力）实际失效；且与注释声称的行为不符。
- 建议：`blockTopUnder(x, pig)` 应仅考虑「`blk.y - blk.h/2 >= 猪脚 y - 容差`」且与猪脚高度最接近的存活块顶面（或取 `>=` 猪脚的顶面中的最小值），使支撑判定对应「脚下最近承重面」。

### 🟡 [important] I1 —— `bridge()` 关卡猪初始悬空放置（叠加 B2 后必坠）

- 位置：`app/src/lib/mock/data.ts:106`，`pigs.push({ x: cx, y: g - 22 - pigR, ... })`。
- 现象：注释称「猪在桥下」，但猪脚为 `g-22≈538`、地面 `g=560`，猪被放在距地面 22px 的空中、脚下没有块支撑（横板在猪上方）。
- 影响：开局即呈现猪悬空；第一次 `recomputeFalling` 后落到地面（配合 B2 会统一沉底）。属关卡布局初始态错误。
- 建议：桥下猪按「站在地面上」放置（`y = g - pigR`），或在桥下补一块支撑。

### 🟢 [nit] / 💡 [suggestion]

1. **首页精选卡硬编码 2 星**（`app/src/app/page.tsx:97` `<Stars count={2} …/>`）：6 张精选卡恒显「★★☆」，与玩家真实进度无关，具误导性。建议改为难度标识或「3★ 目标」文案。
2. **死代码/未接线**：`app/src/lib/api.ts` 的 5 个 `api*` 函数与 `app/src/hooks/useInAlipay.ts` 全仓无引用（页面直接用 `mock/data`）。`api.ts` 服务端 `BASE = SITE_ORIGIN` 一旦被接到 server 组件会去请求占位域名。建议删除或补齐调用方。
3. **蓝鸟「重型冲击」未实现**：`engine.ts:207-211` 蓝鸟能力仅把速度 ×1.35，攻略/FAQ 文案称「更重、冲击力更大」，碰撞伤害仍只看速度阈值（`:357`）。与文案不一致，建议对齐或在下沉说明中标注（coding_summary 已声明「预留」，可接受但需文案一致）。
4. **`pausedRef.current = paused` 写在渲染体**（`app/src/game/PlayClient.tsx:214`）：功能可用但属 ref 写入渲染期的反模式，建议移入 `useEffect`。
5. **`next.config.mjs:7` `eslint.ignoreDuringBuilds: true`**：构建不跑 lint，风格/潜在错误防线后移，建议至少 CI 单独跑 `next lint`。
6. **榜单页 og:image 用 40×40 SVG**（`app/src/app/leaderboard/page.tsx:20`）：og:image 推荐 ≥1200×630，40×40 会被多数社交平台拒绝/裁切，建议改用章节封面兜底。
7. **`layout.tsx` twitter 元信息不完整**（仅 `card`，无 title/description/image）。
8. **客户端解锁可被直链绕过**：`/play/:id`、`/level/:id` 未在服务端校验 `unlockRule`，输入任意 id 即可直达（对休闲游戏可接受，列为提示）。
9. **`collideBird` 每步只处理一个块后 `return`**（`engine.ts:348`）：高速下存在轻微隧穿可能（当前最高速 ~13.4px/步 < 鸟半径，风险低），如需严谨可做连续穿透修正。

---

## 4. 验证记录

| 检查 | 命令 | 结果 |
|---|---|---|
| 类型检查 | `node_modules/.bin/tsc --noEmit` | rc=0，0 错误 |
| 项目护栏 | `node scripts/check-project.mjs .` | rc=0 ✅ |
| SEO 护栏 | `node scripts/check-seo.mjs .` | rc=0 ✅ |
| 发布前门 | `node scripts/check-build.mjs .` | rc=0 ✅ |
| 能力矩阵 | `node scripts/check-env.mjs .` | rc=0 ✅ |
| 星级可达性 | 独立核算脚本（复刻 `mock/data.ts` 计分与布局，取理论最高分） | 见 B1 数据 |

说明：星级可达性为**本次评审独立数值核算**（非仓库脚本），依据 `BLOCK_SCORE/PIG_SCORE/BIRD_BONUS` 与 `buildLayout`/`birdsFor` 的逐字复刻，对 60 关求「击毁全部块 + 击倒全部猪 + 最多剩鸟奖励」的理论上界；理论上界仍低于阈值即可严格证明该星级不可达。

---

## 5. 亮点（Praise）

- 容器抽象层边界干净：`container.ts` 明确「第三方纯 H5 不用 AlipayJSBridge 容器 JSAPI」，环境判定只用于分流、无 cloaking；护栏脚本实测通过。
- SEO 体系完整：A 类页 canonical/og 一致、sitemap 只收 A 类、robots 屏蔽 B 类、JSON-LD 结构化数据齐备且数据源可控（`JsonLd` 注入受控 mock，无外部注入）。
- 工程健壮性：`strict` + `noUncheckedIndexedAccess` 全量 0 错误；localStorage 读写均有 try/catch 与 SSR 判空；物理引擎纯逻辑与渲染解耦，可测性好。
- 版权合规意识：全程原创素材、主动规避 Rovio 商标，站内多处标注无关联声明。

---

## 6. 决策与后续

- **决策：🔴 Request Changes。`review_blocker_count = 2`（B1、B2）。**
- 建议修复顺序：先修 B2（支撑面判定，物理正确性），再修 B1（阈值重算 + 60 关达标校验），随后处理 I1 与各 nit。
- 修复后建议复查点：`blockTopUnder`/`pigSupported` 单测化；给 60 关输出一张「理论最高分 vs target/star 阈值」达标表作为回归门槛。