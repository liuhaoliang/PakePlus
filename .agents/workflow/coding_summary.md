# 编码实现总结 —— 《弹弓小队》（原创弹弓物理 H5 小游戏）

> 技能：alipay-h5-program-generator（G3 编码实现）
> 前序产物：`.agents/workflow/requirements.md`（G1）、`.agents/workflow/design.md`（G2）、`.agents/workflow/assets_manifest.md`（素材）
> 交付时间：2026-11-05（UTC）
> 结论：从无关的 Tauri 壳工程**重建**为干净 Next.js（App Router）纯 H5 工程，7 屏 + `/go-alipay` 全部落地，`next build` 通过。

---

## 1. 通览（Overview）

- **产品形态**：原创 IP「弹弓小队」——弹弓发射弹珠、物理拆堡垒、击倒软泥怪的关卡制休闲小游戏（不沿用「愤怒的小鸟 / Rovio」任何名称、角色、美术）。
- **技术栈**：React 19 + TypeScript(strict) + AntD Mobile v5（页面壳）+ Next 15.2.4（App Router，SSG/SSR/ISR）+ Matter.js（游戏物理核心）。
- **部署形态**：公网域名 + HTTPS + CDN；同一份 HTML 双身份（公网网页可收录 / 支付宝 WebView 内嵌）。
- **能力边界（硬约束已遵守）**：全程**无** `my.*`、`AlipayJSBridge` 容器 JSAPI（`pushWindow/setTitle/setShareContent`）、多 WebView、离线包、私有 RPC；无 `ap.tradePay`。能力 = 标准 Web + 开放平台服务端接口 / `alipays` scheme。
- **现有素材**：`public/images/**` 已由素材采集节点落盘（原创绘制 + Tabler/Lucide/Twemoji 许可素材），本节点直接引用，未热链第三方。

---

## 2. 工程落地（目录结构与文件清单）

依 skill 编码规范采用 `src/` 下的 A/B/C 分层：

```
src/
  app/                    # 路由（A 类 server 组件直出可抓 HTML；B/C 类 noindex）
    layout.tsx            # 全局 head / WebSite+Organization JSON-LD / viewport
    page.tsx              # / 首页（SSG）
    levels/page.tsx       # /levels 关卡列表（SSG）
    leaderboard/page.tsx  # /leaderboard 排行榜（SSG）
    guide/[slug]/page.tsx # /guide/:slug 攻略（SSG）
    share/[shareId]/page.tsx # /share/:shareId 分享落地（SSG+ISR, revalidate=300）
    play/[id]/page.tsx    # /play/:id 游戏页（B, SSG 壳 + CSR, dynamicParams=false）
    result/[id]/page.tsx  # /result/:id 结算页（B, noindex）
    go-alipay/page.tsx    # /go-alipay C 类引导页（noindex）
    robots.ts sitemap.ts not-found.tsx globals.css
  lib/                    # 类型/常量/20关/榜单/攻略/接口层/本地存档
    types.ts constants.ts levels.ts leaderboard.ts guide.ts api.ts storage.ts
  container/index.ts      # 容器抽象层（环境判定/scheme 唤起/支付授权跳转/复制）
  hooks/                  # useInAlipay / useProgress（SSR 安全）
  components/             # 页面壳 + 游戏壳 + 交互组件（*.tsx 均为 'use client'）
  game/engine.ts          # Matter.js 物理 + Canvas 渲染核心（纯模块）
根：
  package.json next.config.mjs tsconfig.json next-env.d.ts .eslintrc.cjs .prettierrc .env.example
```

> 遗留：原 Tauri 壳工程 `src-tauri/`、`src/pppwd.html` 等**未删除**（不属于本次交付范围、不参与构建）；仅替换了根 `package.json` 为 Next 工程。

---

## 3. 逐屏实现（7 屏 + C 类引导）

| 路径 | 类别 | 渲染 | 关键实现 |
|---|---|---|---|
| `/` | A | SSG | Hero LCP 图 + 三步图解 + 关卡总进度 + 榜单 Top5 预览 + 分享/打开支付宝入口；`VideoGame` JSON-LD；`HomeActions` 读本机进度给「开始/继续第 N 关」 |
| `/levels` | A | SSG | 吸顶进度条（真实本机 N/60 星）+ 章节筛选 + 20 关卡卡网格（锁定态、解锁 Toast）；`ItemList` JSON-LD |
| `/play/:id` | B | SSG 壳 + CSR | 顶部菜单（返回/重开/得分/剩余弹珠）+ Canvas 游戏区（Matter.js 懒加载于本路由 chunk）+ 拖拽轨迹预览 |
| `/result/:id` | B | noindex CSR | 得分/星级揭示 + 新纪录对比 + 重玩/下一关/排行榜 + 「炫耀一下」生成 `/share/:shareId` 并复制链接 |
| `/leaderboard` | A | SSG + CSR 增量 | 公开 Top20（金银铜高亮）+ 规则说明 + 「我的名次」本机成绩 + 登录同步引导 |
| `/share/:shareId` | A | SSG+ISR | 成绩卡（score 编入 shareId，URL 可回解）+ 立即挑战/复制链接/打开支付宝 + 相关关卡 |
| `/guide/:slug` | A | SSG | 1 篇真实图文攻略（3 节正文 + 示意图 + 适合关卡）+ `Article` JSON-LD |
| `/go-alipay` | C | CSR noindex | 自动 `alipays://platformapi/startapp` scheme 唤起 + 手动兜底 |

---

## 4. 游戏核心（`src/game/engine.ts`）

- **世界坐标** 1280×720；发射台左侧 `(170,560)`、地面 `y=660`、堡垒区 `x∈[780,1200]`。
- **物理**：Matter.js `Engine` 固定步长更新 + 自绘渲染；弹珠=发射物，木/玻璃/石头/铁块=可破坏障碍，软泥怪=目标。
- **交互**：Pointer 拖拽后拉（限拉 150px）→ 虚线轨迹预览 → 松开发射（`v=(anchor-pos)×0.16`）。
- **命中判定**：`collisionStart` 中弹珠命中（speed>3）破坏目标（1000 分）/障碍（按材质 hp 减血，木/玻璃 1 击、石头 2、铁 4），坠落压碎软泥怪、连锁坍塌。
- **至少规避一个已知坑**：瞄准阶段弹珠**先建为动态体再 `Body.setStatic(true)`**（发射时 `setStatic(false)` 复原质量），避免 `isStatic:true` 创建后直接 un-static 导致的 `position/speed = NaN`。
- **胜负/星级**：清空全部软泥怪=胜；胜利按「剩余弹珠比例」给 1~3 星，剩余弹珠另加 500 分/颗奖励。

---

## 5. 能力边界（`src/container/index.ts`）

- `isAlipayClient` / `isAlipayClientSSR`（仅用于环境分流，**不据此给爬虫减内容**，反 cloaking）。
- `openPageInAlipay`（`alipays://...startapp` → `render.alipay.com` landing）、`openPage`/`popWindow`（标准多页）。
- `startPay` / `redirectToAuth`（服务端建 URL、前端只跳转，本期支付未接入）预留接口形状。
- `copyText`（App 内分享 = 复制链接，无 `setShareContent`）。

---

## 6. 数据与存档

- **20 关 + 每日挑战**：`lib/levels.ts` 确定性生成布局（mulberry32 种子），字段完全符合 G1 §8（id/name/chapter/theme/marbles/targets/unlockStars/obstacles…）；解锁规则 `unlockStars=3×序号`。
- **榜单 Top20、攻略 1 篇**：静态 mock（`lib/leaderboard.ts`、`lib/guide.ts`）。
- **接口层** `lib/api.ts`：`{ ok, data }` 壳 + 列表 `{ list, total }`，SSR/CSR 同源、失败不整页降级；分享卡 `shareId` 用 base64url 编码 score/stars/level，可回解、可 ISR 生成。
- **进度** `lib/storage.ts`：localStorage 分级存档，历史最优合并，隐私模式/写失败静默降级为非阻断。

---

## 7. SEO / 性能 / 无障碍

- `<html lang="zh-CN">`、`viewport-fit=cover`；`canonical=og:url=公网 URL` 一处一致；OG 图走设计定稿的默认图/分享卡。
- `sitemap.xml` 仅 A 类；`robots.txt` 屏蔽 `/play/ /result/ /go-alipay /api/`。
- 首屏共享 JS ≈ 100 kB（< 300KB gzip 预算）；Matter.js 仅随 `/play` 路由 chunk 加载，不阻塞首页。
- 组件可点元素均用真 `button`/`a`、触控目标 ≥44px（热区）、`:focus-visible` 焦点、`aria-label`、`prefers-reduced-motion` 关闭动画；Canvas 提供 `role="img"` + 可访问文案。
- 响应式：移动优先 + 桌面 `max-width:640px` 居中；安全区 `env(safe-area-inset-*)`；游戏画布 `touch-action:none`。

---

## 8. 验证结果（可观测证据）

| 检查 | 命令 / 方式 | 结果 |
|---|---|---|
| 依赖安装 | `npm install`（npmmirror） | ✅ 355 包，55s |
| 生产构建 | `npx next build` | ✅ 通过（Compiled successfully / type-check OK） |
| 静态页生成 | 构建日志 | ✅ 53/53：`/`、`/levels`、`/leaderboard`、`/go-alipay`、`robots`、`sitemap` 静态；`/guide`、`/play(lv-01..daily,21页)`、`/result(21页)`、`/share`(ISR 5m) SSG |
| 物理库运行时 | `require('matter-js')` 冒烟：静态→发射→落地 | ✅ 修正后 `speed` 无 NaN，落地速度为有限值 |
| 素材引用 | 遍历 40 个引用路径 `fs.existsSync` | ✅ 0 缺失 |
| 视觉核验 | — | ⚠️ 本环境无图像/浏览器视觉通道，**未做**人工目视与真机交互检验 |

---

## 9. 已知限制与后续（G4 建议）

1. **真机/浏览器交互未验证**：本环境无浏览器视觉通道，弹弓手感、难度曲线、移动端触控需在 G4 用真机/模拟器核验（对应 `check-env.mjs` 探针）。
2. **Next 版本安全提示**：`next@15.2.4` 安装时告警 CVE-2025-66478，建议 G4 升级到补丁版后回归。
3. **音效为占位**：音量开关仅落地 localStorage 偏好，未接音频资源（需求为 Could 级）。
4. **法学/登录为预留**：`POST /api/pay/create`、OAuth 提交成绩均只留接口形状 + 前端跳转入口，本期不接（G1 已确认）。
5. **护栏脚本**：G4 需跑 skill 的 `scripts/check-env.mjs / check-project.mjs / check-seo.mjs / check-build.mjs`（本期未纳入构建门禁）。