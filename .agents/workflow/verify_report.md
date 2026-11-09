# 验证报告（verify_report）—— 弹弹鸟：鸟蛋保卫战

> 节点：护栏与验收检查（verify / G4 护栏与验收）
> 采用技能：`alipay-h5-program-generator`（G4 测试验收门禁）
> 审阅对象：`app/`（React + TypeScript + Next.js App Router + antd-mobile，独立子目录）
> 输入：`.agents/workflow/requirements.md`（G1）、`.agents/workflow/design.md`（G2）、`.agents/workflow/coding_summary.md`（G3）、`.agents/workflow/cr_report.md`（代码评审）、`.agents/workflow/assets_manifest.md`（素材）
> 验证日期：2026-11-06（独立复验）

---

## 1. 结论（TL;DR）

- 确定性护栏脚本 **4/4 通过**（`check-env` / `check-project` / `check-seo` / `check-build`，rc 均为 0）。
- 类型检查 `tsc --noEmit` **rc=0**（strict + noUncheckedIndexedAccess，0 错误）。
- 功能验收存在 **2 个阻断项**（承接代码评审 B1、B2，经本次独立复核确认**仍未修复**），另有 1 个重要项（I1）未修复；阻断 G4「上生产前必过」出口准则（testing-acceptance §3/§8 相关闭环依赖其正确性）。

**`guard_blocker_count = 2`**

| 严重度 | 编号 | 结论 | 位置 |
|---|---|---|---|
| 🔴 blocking | B1 | 星级阈值全局失配：1 星 58/60 关不可达，2/3 星 60/60 关不可达 | `app/src/lib/mock/data.ts:204-208`、`app/src/lib/constants.ts:30-32`、`app/src/game/engine.ts:404-412` |
| 🔴 blocking | B2 | 猪支撑面判定取错（取最小 top 而非脚下最近承重面），架空猪整体坠地，"借力倒塌"玩法失效 | `app/src/game/engine.ts:300-317` |
| 🟡 important | I1 | `bridge()` 桥下猪初始悬空（脚 y=538、地面 y=560，差 22px），叠 B2 后必坠 | `app/src/lib/mock/data.ts:106` |

---

## 2. 护栏脚本验证（确定性 gate，rc 0/1）

运行环境：无系统 Node，复用 `/tmp/node-v20.18.0-linux-x64/bin/node`（v20.18.0），在 `app/` 目录实际执行。

| 脚本 | 命令 | 结果 | 证据 |
|---|---|---|---|
| check-env | `node scripts/check-env.mjs .` | ✅ rc=0 | 能力矩阵：wap.pay/OAuth/alipays scheme 可用；pushWindow/setShareContent/`my.*`/离线包判定「不可用」，边界正确 |
| check-project | `node scripts/check-project.mjs .` | ✅ rc=0 | 「未发现禁止的容器/小程序/私有 API 调用遗址」 |
| check-seo | `node scripts/check-seo.mjs .` | ✅ rc=0 | 「canonical/og 一致、sitemap/robots 在场、无 cloaking 嫌疑」 |
| check-build | `node scripts/check-build.mjs .` | ✅ rc=0 | 「env 边界安全、(如已构建)产物无私钥串」 |

类型/编译：`node node_modules/typescript/bin/tsc --noEmit` **rc=0**（0 错误，无回归）。

> 说明：护栏脚本覆盖「禁用 API 遗址 / SEO 一致性 / 密钥与产物边界」，属静态确定性门禁；**不覆盖玩法数值与物理正确性**，故下述功能缺陷需以验收复核兜底。

---

## 3. 验收复核（对应 testing-acceptance §1–9）

### 3.1 🔴 B1 —— 星级阈值全局失配（独立复算，确认未修复）

源码点位与代码评审一致、未发生变更：

- `data.ts:204`：`targetScore = 4000 + id * 160 + difficulty * 1000`
- `data.ts:205-208`：二/三星阈值 = `round(targetScore*1.6/100)*100`、`round(targetScore*2.4/100)*100`
- `constants.ts:30-32`：`BLOCK_SCORE {glass:200, wood:300, stone:400}`、`PIG_SCORE {normal:1000, king:1500}`、`BIRD_BONUS=1000`
- `engine.ts:404-412`：`finish()` 剩余鸟奖励 = `birdsLeft * BIRD_BONUS`（`:407-408`）；`computeStars` `:442-447`

本次以独立脚本 `/tmp/verify_stars.mjs`（逐字复刻 `data.ts` 的布局构造 `singleTower/twinTower/bridge/glassTower/stoneFort/buildLayout`、`birdsFor/difficultyFor` 与计分常量，确定性伪随机 `mulberry32(ctx=id*2654435761)`）对 60 关取「击毁全部块 + 击倒全部猪 + 仅用 1 只鸟」的理论最高分上界，与阈值比较，实测输出：

| 星级 | 不可达关数 | 结论 |
|---|---|---|
| 1 星（targetScore） | **58 / 60** | 阻断 |
| 2 星（starScore[0]） | **60 / 60** | 阻断 |
| 3 星（starScore[1]） | **60 / 60** | 阻断 |

抽样：第 1 关（single，5 块 1500 + 1 猪 1000 + 剩 2 鸟 2000）理论最高 **4500** < targetScore **5160**（二星 8300 / 三星 12400），完美通关仍 0 星；第 2、7 关（twin，11 块 + 2 猪 + 3 鸟，上界 **7300**）是 60 关中仅有的 2 个可达 1 星者，但 2 星均不可达。独立脚本输出的一致结论：`1星不可达 58/60、2星不可达 60/60、3星不可达 60/60`。

**影响**：结算（星级/分数）是 G1 Must 功能；现状「过关但永远 0 星」，星级激励与分享/榜单闭环失效。**仍为阻断项。**

### 3.2 🔴 B2 —— 猪支撑面判定取错（源码复核，确认未修复）

`engine.ts:306-317` 的 `blockTopUnder` 注释为「返回猪脚下最近的存活块顶面」，实现仍为：

```ts
const top = blk.y - blk.h / 2;
if (best === null || top < best) best = top; // 取最小 top ⇒ 顶梁/高块，而非脚下平台
```

`engine.ts:300-304` 的 `pigSupported` 仍以 `Math.abs(p.y + p.r - top) < 18` 判定。于是「猪站平台、头顶有顶梁/高块」的常规塔形结构被误判为无支撑；`recomputeFalling`（`afterSettle` `:289-291`、`breakBlock` `:375`、`damagePig` `:387` 触发）后所有架空猪 `falling=true` 并坠地。

**影响**：singleTower/twinTower/glassTower/bridge 等多数关卡的「拆支撑→借力倒塌」Must 玩法失效（猪整体沉底，塔堡形同虚设）。**仍为阻断项。**

### 3.3 🟡 I1 —— bridge 桥下猪初始悬空（源码复核，确认未修复）

`data.ts:106`：`pigs.push({ x: cx, y: g - 22 - pigR, ... })`，`g=560`、`pigR=22`（第 3 章为 24）⇒ 猪脚 y = `g - 22 = 538`、地面 560，脚下无块（横板 deck 在猪上方，中心 y = `g - pierH - 8 = 492`）。首次 `recomputeFalling` 即坠地，且叠加 B2 统一沉底。属关卡布局初始态错误，随 B2 一并处理。

### 3.4 §1–9 其余项核对

| 验收项（testing-acceptance） | 状态 | 说明 |
|---|---|---|
| §1 单元/组件测试 | ⚠️ 未覆盖 | 仓库无测试文件；`AlipayGuard`/引擎逻辑未单测化（B2 修复后需对 `blockTopUnder/pigSupported` 补单测） |
| §2 接口/Mock | ✅ 源码核验 | mock 数据无登录可拼、Route Handler 统一 `{code,message,data}` 包裹、好友榜 401 |
| §3 SEO 收录 | ✅ 护栏脚本 | check-seo rc=0；sitemap 只含 A 类、robots 屏蔽 `/play` `/me`、B 类 noindex |
| §4 分享 | ✅ 代码级 | OG/canonical 一致（check-seo）；App 内 URL+scheme；未臆造 `setShareContent` |
| §5 支付 e2e | ⚠️ 预留 | `pay-server.ts` wap.pay 占位、私钥仅服务端 env（check-build 校验通过）；真机未验 |
| §6 降级屏/B 类 | ✅ 代码级 | `AlipayGuard` 浏览器出「请在支付宝中打开」+ scheme 唤起；真机未验 |
| §7 移动真机适配 | ⏳ 待真机 | WKWebView/Android WebView 未实机核对 |
| §8 性能预算 | ⚠️ 构建级 | 首屏 JS ≈142kB、`/play` ≈138kB（G3 记录）；未做真机 LCP/CLS/INP 实测 |
| §9 a11y | ⚠️ 未全验 | 触控热区/键盘可达部分落地；未做 axe 扫描 |

---

## 4. 独立验证方法与证据

- **护栏脚本**：4 个脚本在 `app/` 目录实际执行，逐一捕获 rc（0/0/0/0）。
- **类型检查**：`tsc --noEmit` 实际执行，rc=0。
- **星级可达性**：独立脚本 `/tmp/verify_stars.mjs`（对 60 关逐字复刻布局/计分，取理论上界）实测输出：`1星不可达: 58/60、2星不可达: 60/60、3星不可达: 60/60`。
- **支撑/布局缺陷**：直接读取 `engine.ts:293-317`、`data.ts:62-108`、`data.ts:138-169` 源码，与评审结论逐行比对，确认逻辑未变更。
- **变更确认**：`git status --short` 工作区仅 `.agents/changes/.../run_context.json`（M）与 `.agents/workflow/verify_report.md`（??），`app/` 无未提交改动，即 B1/B2/I1 仍处于代码评审时的原始状态。

> 视觉验证未执行（当前路由无可视化能力），以代码级推演 + 数值核算 + 确定性脚本为准。

---

## 5. 残余风险与下一步

1. **B2 优先修复**：`blockTopUnder(x)` 应仅考虑「`blk.y - blk.h/2 >= 猪脚 y - 容差`」且与猪脚高度最接近的存活块顶面（取 `>=` 猪脚的顶面中最小者）。
2. **B1 修复**：以单关理论最高分为基准反推 `targetScore/starScore`，并对 60 关输出「理论最高分 vs 阈值」达标表作为回归门槛（≥ 1 星可达、3 星至少存在可行解）。
3. **I1 修复**：桥下猪置于地面（`y = g - pigR`）或补支撑块。
4. **补测**：`blockTopUnder/pigSupported` 单测化；B 类页降级/支付/OAuth 真机核验；WKWebView 下 Service Worker 生效性待真机。

---

## 6. 产物清点

- 生成：`.agents/changes/task-DEV-966dcd0a-7905-11f1-9649-3b4281182f10-39a41ec6-b29a-4b3f-8e55-9ddb600d6d6e/verify_report.md`（任务指定交付路径）；本文件为同步副本 `.agents/workflow/verify_report.md`
- 写入：`.agents/changes/task-DEV-966dcd0a-7905-11f1-9649-3b4281182f10-39a41ec6-b29a-4b3f-8e55-9ddb600d6d6e/run_context.json` → `guard_blocker_count = 2`
- 零临时产物残留：独立复算脚本位于 `/tmp`，未污染仓库。