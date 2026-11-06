# 编码实现总结（coding_summary）—— 弹弹鸟：鸟蛋保卫战

> 节点：编码实现（G3）
> 采用技能：`alipay-h5-program-generator`
> 输入：`.agents/workflow/requirements.md`（G1）、`.agents/workflow/design.md`（G2）、`.agents/workflow/assets_manifest.md`（素材）
> 交付物：`app/`（React + TypeScript + Next.js(App Router) + antd-mobile，独立子目录）

---

## 1. 概述（Overview）

按 G2 已定稿方案，在仓库根目录新建独立子目录 `app/`，实现「弹弹鸟：鸟蛋保卫战」支付宝第三方纯 H5 弹弓小鸟小游戏。核心形态为：**公网可收录 H5 + 支付宝 WebView 内嵌**，客户端只使用标准 Web（Level 1）+ 开放平台公开能力（服务端 wap.pay / OAuth / alipays scheme，Level 2），**不使用** `my.*`、`AlipayJSBridge` 容器 JSAPI、`ap.tradePay` 等小程序/私有能力。

关键模块与依赖关系：

- `app/src/lib/` — 领域类型、常量、mock 数据（60 关 / 22 条榜单 / 攻略 / FAQ）、接口层、服务端 pay/auth 预留、本地存档。
- `app/src/container/container.ts` — 容器抽象层（环境判定 / 多页导航 / scheme 唤起 / 分享 / 跨页状态）。
- `app/src/game/engine.ts` + `app/src/game/PlayClient.tsx` — 自研 2D 物理引擎与 Canvas 渲染（弹弓-抛射-碰撞-摧毁-重力坍塌）。
- `app/src/app/` — App Router 页面（7 页）+ 9 个 Route Handlers + `robots.ts` / `sitemap.ts`。
- `app/public/images/` — 复用素材采集节点产出的 35 个原创素材（从仓库根 `public/images` 拷贝迁入）。
- `app/scripts/` — skill 自带的 4 个确定性护栏脚本（check-env / check-project / check-seo / check-build）。

---

## 2. 规划与实现要点

### 2.1 页面与渲染决策（对应 design §2）

| 路径 | 类 | 渲染 | 落地 |
|---|---|---|---|
| `/` | A | SSG | `app/src/app/page.tsx` |
| `/levels` | A | SSG | `app/src/app/levels/page.tsx` |
| `/level/:id` | A | SSG + ISR(3600s) | `app/src/app/level/[id]/page.tsx`（`generateStaticParams` 60 页） |
| `/leaderboard` | A | SSR | `app/src/app/leaderboard/page.tsx`（`force-dynamic`） |
| `/guide` | A | SSG | `app/src/app/guide/page.tsx` |
| `/play/:id` | B | CSR + `noindex` | `app/src/app/play/[id]/page.tsx` |
| `/me` | B | CSR + `noindex` | `app/src/app/me/page.tsx` |

B 类页由 `AlipayGuard`（`app/src/components/AlipayGuard.tsx`）在非支付宝环境出「请在支付宝中打开」+ `alipays://` 唤起降级屏；页面 head 均 `robots: { index: false }`。

### 2.2 物理引擎（自研，替代 matter.js/planck.js）

为守住「游戏主 bundle 按路由懒加载 + 不引入重量级外部依赖」的预算，实现自研轻量 2D 物理引擎（`app/src/game/engine.ts`，纯逻辑、无 DOM）：

- 固定步长 1/60 积分器 + 重力、拖拽牵引（`MAX_DRAG=84`、`LAUNCH_POWER=9.6`）、抛射、圆-圆 / 圆-AABB 碰撞、反弹减速。
- 三种鸟能力：红鸟标准、黄鸟飞行中二段加速、蓝鸟重型冲击（分裂能力标注「预留」）。
- 结构破坏：木/石/玻璃块按材质有血量与击碎速度阈值；**受击/失支撑未碎的块与猪按重力坍塌**，落地速度超阈值扣血（实现「借力倒塌」）。
- 结算：击倒猪 +1000/1500、拆块 +200~400、剩余鸟每只 +1000；按 `targetScore/starScore` 计算 1~3 星。
- Canvas 程序化绘制背景/弹弓/三色小鸟/猪与猪王/材质块/瞄准虚线/粒子，全部命中即见、无图加载依赖。

### 2.3 容器能力边界（对应 design §3、container.md）

`app/src/container/container.ts` 统一封装，业务页只调人类可读 API：`isAlipayClient/isAlipayClientSSR`（仅环境分流，不 cloaking）、`openPage/goBack`、`openPageInAlipay`（scheme + `render.alipay.com` landing）、`shareLink/copyText`、`emitBus/onBus/onResume`。支付/OAuth 服务端预留于 `app/src/lib/pay-server.ts`（wap.pay 占位订单）与 `auth-server.ts`（publicAppAuthorize 占位），本期点击「复活」提示「即将上线」。

### 2.4 SEO（对应 design §4、ssr-seo-sharing）

- 每个 A 类页 `generateMetadata` 同时写 `alternates.canonical` 与 `openGraph`（canonical == og:url 一致）；`og:image` 本期用章节封面兜底（README 见 §5 偏离项）。
- `app/src/app/sitemap.ts` 只含 A 类（首页/关卡列表/榜单/攻略/60 个关卡页）；`robots.ts` `Disallow: /play`、`/me`。
- 结构化数据用 `app/src/components/JsonLd.tsx` 注入：首页 `VideoGame`、关卡列表 `ItemList`、关卡页 `VideoGame+BreadcrumbList`、榜单 `ItemList`、攻略 `Article+FAQPage`。
- 反 cloaking：公开内容用 mock 数据直出进 SSR HTML，不在服务端按 UA 减内容；`user-agent` 判定仅存在于 `container.ts`，不出现在任何 page 文件。

### 2.5 mock 与接口（对应 design §6）

`app/src/lib/mock/data.ts` 生成 **60 关**（3 章 × 20 关，确定性伪随机布局 + 每关 `layout`、3 星阈值、鸟序列、tips）、**22 条总分榜**、单关榜派生、4 篇攻略、6 条 FAQ。Route Handlers（`app/src/app/api/*`）与 SSR/CSR 共享同一份 mock，统一 `{code, message, data, page?}` 包裹；登录态接口（好友榜）mock 返回 401。

### 2.6 本地存档（对应 G1 Q4、cross-page-comm）

`app/src/lib/storage.ts` 以 localStorage `dandanniao:save:v1` 存星级/最高分/最近 20 条；`recordScore` 高分回填与 `isNewBest` 标记；`getUid` 生成游客 uid。OAuth 跨端同步为预留。

---

## 3. 产物清单（Execution）

- **工程配置**：`package.json`、`tsconfig.json`（strict + noUncheckedIndexedAccess + `@/*`）、`next.config.mjs`、`.eslintrc.json`、`.env.example`、`.gitignore`。
- **41 个 TS/TSX 源文件** 分布如上（全列于 `app/src/`）。
- **9 个 Route Handlers**：`levels`、`levels/[id]`、`leaderboard`、`leaderboard/friends`、`scores`、`me`、`orders`、`orders/[tradeNo]`、`orders/notify`。
- **素材迁移**：`app/public/images/**`（36 个文件，含 CREDITS.md）。
- **护栏脚本**：`app/scripts/check-*.mjs`（4 个）。

---

## 4. 验证结果（Verification）

> 本环境原生无 Node.js，通过下载官方 Linux 独立 Node v20.18.0 到 `/tmp` 完成真实构建验证（非模拟）。

| 检查 | 命令 | 结果 |
|---|---|---|
| 项目护栏 | `node scripts/check-project.mjs .` | ✅ rc=0，无禁用 API 遗址 |
| SEO 一致性 | `node scripts/check-seo.mjs .` | ✅ rc=0，canonical/og 一致、sitemap/robots 在场、无 cloaking 嫌疑 |
| 发布前门 | `node scripts/check-build.mjs .` | ✅ rc=0，env 边界安全、无私钥串 |
| 能力矩阵 | `node scripts/check-env.mjs .` | ✅ rc=0，能力边界打印正常 |
| 类型检查 | `npx tsc --noEmit` | ✅ 0 错误 |
| 生产构建 | `npm run build` | ✅ 成功，77 页静态生成（含 `/level/1..60`） |

构建产线关键输出：`/` 首屏 JS（First Load）≈ 142 kB、`/play/[id]` ≈ 138 kB、`/level/[id]` SSG 60 页、`/leaderboard` SSR（ƒ）、`/play` `/me` 为动态（ƒ/静态）并 `noindex`。

---

## 5. 对设计的偏离与说明（Deviation Log）

1. **物理引擎改用自研轻量实现**（而非 matter.js/planck.js）：守 bundle 预算、消除外部依赖与网络基建风险；黄/蓝鸟的分裂等高级能力标注「预留」。
2. **响应式采用 viewport + px + 断点/`max-width` 居中**（未接入 `postcss-pxtorem`）：避免耦合固定 375 基线；antd-mobile 组件以 px 输出在移动端仍等比缩放。多语言按 i18n 语义已抽离但本期未实做（仅中文）。
3. **关卡 og:image 未做「3 章底图 + 成绩卡模板」构建期合成 60 张**（design §7 IMG-27/47 属构建脚本范畴）：本期 `og:image` 以章节封面（`ch-forest/hill/cloud.webp`，1200×400）兜底，分享落地仍可出 `og:title`（含「第 X 关」挑战文案）。合成脚本列为后续。
4. **交互面板（临时精简）**：`/leaderboard` 只展示总分榜（单关最高榜已在各关卡页提供）；历史记录/榜单触底 `InfiniteScroll` 未接（22 条一次直出）；音效（Switch）为 UI 占位。均不影响核心玩法与收录目标。

---

## 6. 残余风险与下一步

- **真机核验**：支付宝 iOS WKWebView / Android WebView 内打开 `/play/:id`、`/me`、`openPageInAlipay` 唤起、Service Worker 生效性（无官方文档，待真机）。
- **支付/OAuth 实接**：需企业支付宝 AppId/应用私钥/回跳域名白名单（`pay-server.ts`/`auth-server.ts` 已留空实现，`ALIPAY_*` 服务端 env 注释占位）。
- **域名与上线**：`SITE_ORIGIN` 仍为占位 `https://dandanniao.example.com`，G5 发布前替换 canonical/og/sitemap 域名并做 CDN 灰度。
- **og 合成脚本 / pxtorem / i18n / 音效**：可按 §5 依次补齐，均有明确落点。
- 本项目与仓库内既有 PakePlus/Tauri 脚手架无关；交付物仅新增 `app/` 子目录，未改动其源码与配置。