# 验证报告（verify_report · 第 3 轮）—— 弹弹鸟：鸟蛋保卫战

> 节点：护栏与验收检查（verify / round 3）
> 采用技能：`alipay-h5-program-generator`（G4 测试验收门禁，testing-acceptance.md §1–§10）
> 审阅对象：`app/`（React 18 + TypeScript + Next.js 14 App Router + antd-mobile，独立子目录；代码基准 = HEAD `ad717a5`，`git status` 干净，与代码评审第 3 轮完全同一快照）
> 输入：`.agents/workflow/design.md`（G2）、`.agents/workflow/assets_manifest.md`、`${spec_dir}/cr_report.md`（第 3 轮，Approve）、`${spec_dir}/fix_summary.md`（round 2 修复）；`${spec_dir}/coding_summary.md` **不存在**（任务输入已标注），以 `.agents/workflow/coding_summary.md` 副本替代
> 验证日期：2026-11-09（独立复验，不采信 fix_summary/cr_report 自述，全部以本轮实际执行为准）

---

## 1. 结论（TL;DR）

- 确定性护栏 **7/7 通过**：`check-env` / `check-project` / `check-seo` / `check-build` rc 均为 0，`tsc --noEmit` rc=0，`next lint` rc=0，`next build` rc=0（60 个 `/level/[id]` SSG 页全产出、9 个 API 路由、robots/sitemap 正常）。
- **上轮阻断项 B3（引擎帧累加器重置条件写反）与重要项 I2（关卡地图星级渲染错误）：独立复验确认修复有效、零回归**（51 项断言全过，含修复前缺陷引擎负向对照）。
- 第 1 轮阻断项 B1（星级阈值）、B2（支撑面判定）与重要项 I1（桥下猪）跨三轮保持稳定，零回归。
- testing-acceptance §3/§4/§6 构建产物级核验通过（sitemap 64 URL 无 B 类泄漏、robots 屏蔽 `/play` `/me`、`/me` noindex、A 类页无 noindex）。
- 残余 6 项 nit（继承 CR r2/r3，均有据暂缓）不计入 guard_blocker_count。

**`guard_blocker_count = 0`** —— G4 出口准则（护栏脚本 rc=0 + 行为验收通过）达成，可进入 G5 发布门。

| 严重度 | 编号 | 结论 |
|---|---|---|
| 🔴 blocking | — | **0**（B3 已修复并独立实证） |
| 🟡 important | — | **0**（I2 已修复并独立实证） |
| ⚪ nit/暂缓 | nit1–6 | 继承 CR r3 §5.3，不阻断 |

---

## 2. 确定性护栏验证（本轮实际执行，rc 0/1）

运行环境：无系统 Node，复用 `/tmp/node-v20.18.0-linux-x64/bin/node`（v20.18.0），在 `app/` 目录实际执行。

| 检查 | 命令 | 结果 | 证据 |
|---|---|---|---|
| check-env | `node scripts/check-env.mjs .` | ✅ rc=0 | 能力矩阵边界正确（wap.pay/OAuth/scheme 可用；`my.*`/pushWindow/离线包判定不可用） |
| check-project | `node scripts/check-project.mjs .` | ✅ rc=0 | 「未发现禁止的容器/小程序/私有 API 调用遗址」 |
| check-seo | `node scripts/check-seo.mjs .` | ✅ rc=0 | 「canonical/og 一致、sitemap/robots 在场、无 cloaking 嫌疑」 |
| check-build | `node scripts/check-build.mjs .` | ✅ rc=0 | 「env 边界安全、(如已构建)产物无私钥串」 |
| 类型检查 | `tsc --noEmit` | ✅ rc=0 | strict + noUncheckedIndexedAccess，0 错误 |
| Lint | `next lint` | ✅ rc=0 | 「No ESLint warnings or errors」 |
| 生产构建 | `next build` | ✅ rc=0 | `/` 142kB、`/levels` 133kB、`/me` 138kB、`/play/[id]` ƒ 138kB、`/leaderboard` ƒ SSR、`/level/[id]` ● SSG×60、`/guide` ○、9 个 `/api/*` 路由、`robots.txt`/`sitemap.xml` 产出——与 design §2 渲染决策逐页一致；共享 chunk 87.2kB（预算 ≤200kB 达标） |

### 2.1 SEO 产物抽查（构建产物级，testing-acceptance §3/§6）

| 断言 | 结果 |
|---|---|
| `sitemap.xml` 共 64 URL = 4 个 A 类页（`/`、`/levels`、`/leaderboard`、`/guide`）+ 60 个 `/level/:id` | ✅ |
| sitemap 不含 `/play`、`/me`（B 类不收录） | ✅（脚本断言 contains=false） |
| `robots.txt`：`Allow: /` + `Disallow: /play` + `Disallow: /me` + `Sitemap:` 行 | ✅ |
| `/me`（B 类）构建 HTML 含 `noindex` | ✅（me.html noindex 计数=1） |
| `/levels`（A 类）构建 HTML 无 `noindex` | ✅ |

> 护栏脚本覆盖「禁用 API 遗址 / SEO 一致性 / 密钥边界」，属静态门禁，不覆盖玩法时序正确性——B3 即静态门禁盲区，故本轮仍以行为复验兜底（见 §3）。

---

## 3. 行为复验（独立脚本，51/51 PASS）

方法：独立脚本 `/tmp/verify3/run_verify.mjs`（TypeScript API `transpileModule` 把仓库真实 `constants.ts` / `mock/data.ts` / `engine.ts` / `Stars.tsx` 转为 CJS 后 require 执行，插桩 `GameEngine.prototype.step` 计数；渲染用 `react-dom/server` 静态渲染真实 `Stars` 组件）。**不采信 fix_summary / cr_report 自述，全部重跑。**

### 3.1 🔴→✅ B3 修复复核（引擎帧累加器）

**步数矩阵（CR r2 §4 / verify r2 §5 验收标准逐项，本轮实测）**：

| 帧距场景 | 验收标准 | 本轮实测 | 结果 |
|---|---|---|---|
| `update(1000/120)×2` [120Hz 精确] | ≥1 步 | **1 步** | ✅ |
| `update(8.33)×600` [120Hz 量化] | 长跑推进 | **299 步**（理想 299.9） | ✅ |
| `update(16)×4` [60Hz 整数量化] | ≥3 步 | **3 步** | ✅ |
| `update(16.666)×600` [60Hz 抖动] | 长跑推进 | **599 步**（理想 599.98） | ✅ |
| `update(17)×60` [60Hz 正常] | 正常 | **61 步**（理想 61.2） | ✅ |
| `update(33.3)×60` [30FPS] | 每帧 2 步 | 总 119 步，帧 2–60 恒 2 步 | ✅ |
| `update(200)` 过载 | ≤6 步且无死亡螺旋 | **6 步且积压清零**；随后 `update(16)`→0 步、`update(17)`→1 步（恢复推进） | ✅ |

**行为链路全部在 `dt=8.33ms`（120Hz）驱动下复跑**（修复前该帧率物理零推进、永不结算）：

| 断言 | 结果 |
|---|---|
| D1. L1 拆承重平台（wood@top=542）→ 猪坠落 → 落地 feet=**560.00**（ground）→ 存活；坠落过程 27 帧 13 物理步 | ✅ |
| D2. L4 碎左猪支撑（glass@top=509）→ 左猪坠至木平台顶 feet=**542.00** 存活；右猪零位移（<1e-9）不受影响 | ✅ |
| D3. L1 清猪 → 27 帧内正常结算：win、3★、score=4000、`finished` 事件触发 | ✅ |

**负向对照**（把修复行还原为缺陷行构造旧引擎，证明断言可检出缺陷、非空转）：旧引擎 `update(8.33)×600` = **0 步**、`update(16.666)×600` = **0 步**——与 verify r2 / CR r2 实测基线完全一致。

**源级断言**：`engine.ts:231` 修复行 `if (steps >= 6) this.acc = 0;` 在场；缺陷行 `if (steps < 6) this.acc = 0;` 不在场 ✅。

### 3.2 🟡→✅ I2 修复复核（关卡地图星级渲染）

`react-dom/server` 静态渲染真实 `Stars.tsx`（转译产物）：

| 输入 | gold 星数 | gray 星数 | aria-label |
|---|---|---|---|
| stars=1 | 1 | 2 | `aria-label="1 星"` ✅ |
| stars=2 | 2 | 1 | `aria-label="2 星"` ✅ |
| stars=3 | 3 | 0 | `aria-label="3 星"` ✅ |

负向对照（旧写法 JS 语义留档）：`stars=1 → "★★"`（虚高一颗）、`stars=3 → "★★☆"`（与 2★ 完全相同）——缺陷真实存在且已被消除。

源级断言：`LevelMap.client.tsx:66` 接线 `<Stars count={stars} size={11} />` 在场；缺陷切片模式不在场 ✅。设计 §9「已 3 星格显示三颗金星」（#FFB400 金 + #E6D9C8 灰）满足。

### 3.3 前轮修复回归（B1 / B2 / I1）—— 零回归 ✅

| 断言（本轮独立复算） | 结果 |
|---|---|
| B1 星级阈值：60 关 × 5 断言（targetScore ≤ 猪分Σ / 3★ < 理论满分 / 阈值严格递增 / computeStars(猪分Σ)≥1 / computeStars(满分)=3） | 违规 = 0/0/0/0/0 ✅ |
| B2 开局支撑：60 关 `recomputeFalling` 后无 falling 猪；驱动 1s 后全部存活、未终局 | 异常关卡 = [] ✅ |
| I1 桥下猪：被 60 关开局支撑断言覆盖 | ✅ |

### 3.4 素材清点（对照 assets_manifest.md）

`app/public/images/`：36 个文件 = **16 WebP + 19 SVG + CREDITS.md**，与清单「落盘 35 个（16 WebP + 19 SVG）」一致 ✅；占位图 0、需署名 0（全原创自绘）。

### 3.5 testing-acceptance §1–§9 其余项核对

| 验收项 | 状态 | 说明 |
|---|---|---|
| §1 单元/组件测试 | ⚠️ 未覆盖 | 仓库无测试框架与测试文件；本轮以独立脚本 51 项断言（转译真实源码执行，含负向对照）作为行为回归基线 |
| §2 接口/Mock | ✅ 源码核验 | 9 个 Route Handler 统一 `{code,message,data}` 包裹、SSR/CSR 同源 mock、好友榜 401 |
| §3 SEO 收录 | ✅ 护栏 + 产物级 | check-seo rc=0；sitemap 64 URL 无 B 类、robots 屏蔽、B 类 noindex、A 类无 noindex（§2.1 抽查） |
| §4 分享 | ✅ 代码级 | OG/canonical 四处一致；App 内 URL+scheme；未臆造 `setShareContent` |
| §5 支付 e2e | ⚠️ 预留 | `pay-server.ts` wap.pay 占位、私钥仅服务端 env（check-build 通过）；真机未验 |
| §6 降级屏/B 类 | ✅ 代码级 + 产物级 | `AlipayGuard` 浏览器态降级 + scheme 唤起；noindex/robots 双保险实测；真机未验 |
| §7 移动真机适配 | ✅ 代码级 | B3 修复后高刷冻结问题消除（步数矩阵实证 120Hz 正常推进）；viewport/安全区/热区代码级落地；真机抽验留待 G5 |
| §8 性能预算 | ✅ 构建级 | `/` 首屏 JS 142kB、`/play` 138kB、共享 chunk 87.2kB（本轮 build 实测，≤200kB 预算达标）；未做真机 LCP/CLS/INP |
| §9 a11y | ⚠️ 未全验 | 热区/语义化/reduced-motion/Stars aria-label 代码级落地；未做 axe 扫描 |

---

## 4. 独立验证方法与证据

- **护栏与构建**：4 个脚本 + `tsc --noEmit` + `next lint` + `next build` 均在 `app/` 目录本轮实际执行，逐一捕获 rc（0/0/0/0/0/0/0）。
- **行为复验**：独立脚本 `/tmp/verify3/run_verify.mjs`，51 项断言全 PASS、rc=0（输出全数留档，见 §3 各表实测值）。
- **变更确认**：`git status --short` 干净；HEAD `ad717a5`（CR r3）仅变更 3 个报告文件，即本轮审阅代码与 fix r2 交付、CR r3 审阅基准零差异。
- **视觉验证未执行**（当前路由无可视化能力）：UI 呈现结论以 `react-dom/server` 静态渲染实测为准；引擎时序结论以确定性物理步数计数为代理证据；真机高刷/降级/支付留待 G5 发布门真机抽验。

---

## 5. 残余风险与下一步（G5 入口建议）

1. **真机抽验**（G5 发布前门）：高刷机型（iOS WKWebView / Android WebView 90/120Hz）实机确认弹弓手感与结算；B 类页浏览器降级 + alipays scheme 唤起真机核验；OG 卡片在微信/QQ/开放图谱调试器预览。
2. **支付/OAuth 实接**：`/api/orders` 预留接口需补 uid 校验与金额白名单（CR nit6）；企业 AppId/域名白名单/真实 canonical 域为 G5 前置条件（design §11）。
3. **补测**：`update()` 帧率路径、`blockTopUnder`/`pigSupported` 建议单测化入仓（当前以独立脚本为基线，脚本不在仓库内）。
4. **nit 6 项**（CR r3 §5.3，均有据暂缓）：L60 死按钮产品决策 > 未引用素材 README 标注 > 文案标点 > 其余。
5. 监控接入（Sentry/RUM）与灰度/回滚演练为 G5 门要求，尚未开始。

---

## 6. 产物清点

- 生成：`.agents/changes/task-DEV-966dcd0a-7905-11f1-9649-3b4281182f10-39a41ec6-b29a-4b3f-8e55-9ddb600d6d6e/verify_report.md`（本文件，任务指定交付路径，第 3 轮——r2 内容已随 `37a21a4` 入库）；同步副本 `.agents/workflow/verify_report.md`。
- 写入：`.agents/changes/task-DEV-966dcd0a-7905-11f1-9649-3b4281182f10-39a41ec6-b29a-4b3f-8e55-9ddb600d6d6e/run_context.json` → **`guard_blocker_count = 0`**（`review_blocker_count=0` 为 CR r3 结论，保持）。
- 零仓库污染：独立复验脚本位于 `/tmp/verify3/`，未触碰仓库源码与配置（本节点只读，仅生成报告与 run_context）。
