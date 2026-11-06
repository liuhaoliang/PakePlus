# 弹弹鸟：鸟蛋保卫战（原创弹弓小鸟 H5 小游戏）— 方案设计（G2）

> 角色：支付宝 H5 项目架构/设计负责人
> 依据：`alipay-h5-program-generator` skill 的 `references/architecture.md`、`tech-selection.md`、`container.md`、`ssr-seo-sharing.md`、`env-degradation.md`、`ux-interaction.md`、`responsive-cross-end.md`、`release-perf.md`、`cross-page-comm.md`、`pitfalls.md`；视觉方法来自 `frontend-design` skill。
> 输入：`.agents/workflow/requirements.md`（G1 需求细化，10 项澄清已确认）。
> 状态：**待用户确认关键取舍后定稿**（关键取舍见 §0，已分别标注推荐项）。

---

## 0. 关键取舍（请确认）

> 以下为本设计里影响面最大的 3 个决策。已标「（推荐）」。你确认（可 inline 指定选项）后我再把推荐项锁定为最终结论。

### 取舍 1 · 视觉风格方向（影响全局配色/版式/氛围）

| 选项 | 方向 | 说明 |
|---|---|---|
| **A（推荐）** | **暖阳牧场** | 天空渐变 + 草丛地面，橙/天蓝/草绿高饱和 + 奶油白底、圆角「毛绒」卡片、木纹细节；温暖、休闲、家庭友好，贴合「消遣/家长陪伴」受众，也最贴合 G1 已确认的「橙/绿/蓝高饱和卡通风」。 |
| B | **夜空竞技场** | 深空蓝黑底 + 霓虹青/朱红重点色，街机风、分数冲击感强；更贴合「竞技/炫耀」心智，但更冷、家庭友好度低，与 AntD Mobile 明亮组件反差大。 |
| C | **纸艺绘本** | 纸拼贴/纸板纹理 + 低饱和马卡龙色，故事书质感；独特但游戏动能弱，高饱和游戏反馈（爆炸/通关）与「绘本温柔感」冲突。 |

### 取舍 2 · 排行榜页 `/leaderboard` 渲染方式

| 选项 | 渲染 | 说明 |
|---|---|---|
| **A（推荐）** | **SSR** | 榜单按请求取 mock、实时性好、可抓 HTML 进 sitemap；单页服务端开销可接受（mock 场景极轻）。 |
| B | SSG + ISR（revalidate 300s） | 零请求开销，但榜单「实时感」下降，且本项目数据本来就在前端 mock，收益有限。 |
| C | CSR（noindex） | 实现最简，但丢掉收录，与 G1「榜单全文收录」结论冲突。 |

### 取舍 3 · 关卡 og:image 生成策略（分享落地卡片）

| 选项 | 策略 | 说明 |
|---|---|---|
| **A（推荐）** | **章节底图 + 成绩卡模板，构建期合成 60 张静态 og** | og 图进静态产物、URL 稳定、四套 meta 一致；60 关指向 3 张章节底图 + 1 张成绩卡模板合成，仅需 4 份素材即可覆盖 60 关。 |
| B | 每关 1 张独立手绘缩略图（60 张） | 观感最精致，但素材采集与维护成本 ×60，本期 mock 阶段不划算。 |
| C | 全站统一 1 张 og | 最省，但分享卡片无「关卡/分数」信息，裂变转化差，违背 G1 Q6。 |

---

## 1. URL 结构（A / B / C）

> 公开首页、关卡、榜单、攻略可索引可分享（A 类）；游戏页与「我的战绩」为 App 内功能页（B 类）；「请在支付宝中打开 + scheme 唤起」为引导路径（C 类）。每屏一条公网 URL，跨屏用 `location` + `history.back`，不用客户端全站多屏 SPA 路由。

站点 canonical 基域名：`https://dandanniao.example.com`（**占位**，G5 发布前替换为真实域名；本文件所有 URL 均基于它，`example.com` 为占位符）。

### A 类 · 公开可索引（SSR/SSG，进 sitemap）

| 路径 | 页面 | 用途 |
|---|---|---|
| `/` | 首页 | 品牌 Hero + 三步玩法 + 关卡精选 + 榜 Top10 + 分享引导 |
| `/levels` | 关卡地图 | 3 章 Tabs × 60 关网格 + 进度概览 |
| `/level/:id` | 关卡落地页（分享落地） | 关卡信息 + 关卡榜 + 开始挑战 CTA |
| `/leaderboard` | 排行榜 | 总分榜 / 单关榜，20+ 条 |
| `/guide` | 玩法攻略 | 玩法总述 + 技巧文章 3–5 篇 + FAQ |

`id` 为 1–60 的全局整数（章节由字段 `chapter` 分组），URL 形如 `/level/1`、`/play/1`。命名规范：路径一律小写单词、无嵌套；页面内锚点用 `#section-xxx`。

### B 类 · App 内功能页（CSR + `noindex`，robots 双保险屏蔽）

| 路径 | 页面 | 浏览器打开时 |
|---|---|---|
| `/play/:id` | 游戏关卡页 | AlipayGuard「请在支付宝中打开」降级屏（不渲染整页 CSR） |
| `/me` | 我的战绩 | 同上（个人数据，不收录） |

### C 类 · 引导（landing scheme）

不是独立页面，是 B 类页浏览器态降级屏上的「用支付宝打开」动作：`alipays://platformapi/startapp?appId=20000067&url=<encodeURIComponent(本页URL)>` → 经 `https://render.alipay.com/p/s/i/?scheme=<encodeURIComponent(scheme)>` 跳转（非 alipay.com 域名需在开放平台配白名单）。

### 导航与回退约定

- 「返回」一律 `history.back()`；`history.length <= 1` 时回退到 `/` 或指定路径（`/play` 无上级时退回 `/level/:id`，`/me` 无上级时退回 `/`）。
- `/play/:id` 结束时：结算「下一关」→ `location.assign('/play/' + nextId)`；「返回地图」→ `/levels`；「分享」→ 生成 `/level/:id` 分享 URL 复制。

---

## 2. 渲染决策（逐页 + 理由）

| 路径 | 分类 | 渲染 | 理由 |
|---|---|---|---|
| `/` | A | **SSG** | 首页聚合内容（Hero/三步/6 精选/Top10）低频变更，构建期预渲染可抓 HTML + CDN 直发，SEO 最优；hydrate 后客户端追加「我的进度概览」。 |
| `/levels` | A | **SSG** | 60 关是静态配置（mock），构建期生成；章节/星级/锁定态无登录即可拼出进 HTML。 |
| `/level/:id` | A | **SSG + ISR**（revalidate 3600s，推荐） | 关卡信息 + 榜单快照按 id 预生成 60 页；榜单是「次高频变更」内容，用 ISR 周期再生成保持相对新鲜，且 og:image 落静态产物。首次构建即准备好 `<title>/og:image` 供分享卡片使用。 |
| `/leaderboard` | A | **SSR**（推荐，见取舍 2） | 榜单按请求动态，进 sitemap 且 HTML 含真实榜单快照；登录态「我的排名」hydrate 后追加。 |
| `/guide` | A | **SSG** | 攻略文章与 FAQ 静态，构建期出完整正文（Article/FAQ 结构化数据）。 |
| `/play/:id` | B | **CSR + `noindex`** | 游戏核心是 Canvas + 物理引擎，需客户端运行、懒加载 bundle；无公开可抓内容；浏览器打开给 AlipayGuard 降级屏。 |
| `/me` | B | **CSR + `noindex`** | 纯个人数据，无公开/收录价值；未登录显示游客态。 |

补充约定：

- **反 cloaking**：公开 HTML 对爬虫/用户/支付宝内完全一致；`/play`、`/me` 之外不在服务端按 UA 减内容。`isAlipayClientSSR(ua)` 仅用于「不预取登录态数据」这类轻量分流，绝不改可见内容与 head。
- **首屏关键 CSS 内联 + 关键资源 preload**；物理引擎（planck.js）与游戏页面组件在 `/play` 路由级 code split，懒加载，不计入首屏 bundle（预算见 G1 §10）。
- **mock 层 SSR 友好**：接口用 **Next Route Handlers**（`app/api/*/route.ts`）+ 共享 `lib/mock/data.ts`，而非纯客户端 MSW——保证 SSR（榜单页）与 CSR 走同一份 mock，且 SSR 期 mock 不抛错致整页降级。

---

## 3. 容器能力（公开能力边界）

> 原则：在支付宝 WebView 内 ≠ 拥有小程序容器能力。只使用「开放平台服务端接口 + scheme」，前端默认零 SDK；**不得使用 `my.*`、`AlipayJSBridge.call(...)`、`ap.tradePay`**，不用 `AlipayJSBridge` 的容器 JSAPI（`pushWindow/popWindow/setTitle/setShareContent` 均不可用，直接不写）。

实现统一收敛在薄封装层 `src/container/*`（业务页只调人类可读 API）：

| 能力 | 方案 | 本期落地 |
|---|---|---|
| 支付 `wap.pay` | **服务端** `alipay.trade.wap.pay` 生成跳转 URL → 前端 `location.assign(url)`；结果异步通知走服务端 `/api/orders/notify`。**不用 `ap.tradePay`**（公网无第三方 H5 版，勿臆造）。 | 只预留 `/api/orders*` 接口与 mock，不实接（需企业 AppId/密钥，任务未提供）。复活/道具等支付入口本期点击弹 Dialog「支付功能即将上线」。 |
| OAuth 授权 | **服务端** `publicAppAuthorize` 跳转拿 `auth_code` → `alipay.system.oauth.token` 换 uid；可选增强 `ap.getAuthCode`（半屏，默认不引入）。 | 本期 mock uid（localStorage 游客 uid）；OAuth 链路只预留接口与跳转封装，不真配 AppId。 |
| alipays scheme 唤起 | `alipays://platformapi/startapp?appId=20000067&url=...` → `render.alipay.com/p/s/i/?scheme=...`（浏览器用户进支付宝）。 | 浏览器态 B 类页 / 首页「用支付宝打开」按钮实装（非 alipay.com 域名容白名单后生效）。 |
| 环境判定 | `isAlipayClient()`（UA 同步判定，SSR 安全）；`useInAlipay()` 钩子（SSR 返回 null，挂载后判定防闪烁）。 | 用于启用支付/授权入口、给浏览器降级。 |
| 环境降级 | B 类页 `AlipayGuard`：浏览器打开显示「请在支付宝中打开」+ 唤起按钮；支付宝内渲染正常内容。A 类页浏览器正常展示，仅拿不到登录态自然降级。 | `/play/:id`、`/me` 实装。 |
| 跨页/跨次状态 | 服务端持久化为主 + `localStorage` + `storage` 事件 + `visibilitychange` 兜底。 | 本地存档（`dandanniao:save:v1`）为主，OAuth 预留。 |

**明确不做（guardrail）**：原生多 WebView、原生标题栏、App 内自定义分享卡片、离线包秒开、客户端开关灰度、真机调试平台——均属小程序/私有栈，不在本路径。秒开 = SSR/SSG + CDN + HTTP 缓存 + 图片优化；灰度 = CDN 权重 + feature flag。

---

## 4. SEO 方案

### 4.1 meta / OG 约定（进 SSR HTML，不是 JS 动态塞）

公开可索引页统一模板（以 `/level/7` 为例）：

```html
<title>第 2 章·猪堡山 第 7 关「木塔危楼」 - 弹弹鸟：鸟蛋保卫战</title>
<meta name="description" content="第 2 章第 7 关，难度★★☆，最高分 18,240。拉满弹弓，击倒猪堡的全部小猪即可过关。" />
<link rel="canonical" href="https://dandanniao.example.com/level/7" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="弹弹鸟：鸟蛋保卫战" />
<meta property="og:url" content="https://dandanniao.example.com/level/7" />
<meta property="og:title" content="我第 7 关拿了 18,240 分，敢来挑战吗？弹弹鸟：鸟蛋保卫战" />
<meta property="og:description" content="拉满弹弓，击倒猪堡。第 2 章第 7 关，来和我一决高下。" />
<meta property="og:image" content="https://dandanniao.example.com/og/level-7.webp" />
<meta name="twitter:card" content="summary_large_image" />
```

- `canonical` = `og:url` = 分享 url = 公网 URL，**四处一致**。
- `og:image` 统一 `1200×630`；分享落地走 `/level/:id`，`og:title` 带「我第 X 关拿了 N 分」文案（G1 Q6）。
- 可抓内容（关卡名/难度/最高分/简介段落）**无登录**即可拼出；登录态「我的进度」hydrate 后追加。

### 4.2 sitemap.xml / robots.txt

- `sitemap.xml`：只含 A 类 5 屏 URL。60 个 `/level/:id` + `/`、`/levels`、`/leaderboard`、`/guide`（榜单/关卡列表的分页若用 query `?page=` 则一并列出，每页各自 canonical）。构建期生成 `sitemap.xml` 与 `sitemap-levels.xml`。
- `robots.txt`：允许抓取 A 类；`Disallow: /play`、`Disallow: /me`（B 类双保险）。同时 B 类页 head 里 `robots: noindex`。
- 站点级 `robots.txt` 引用 `sitemap.xml` 的 `Sitemap:` 行。

### 4.3 结构化数据（JSON-LD，进 SSR HTML）

| 页面 | 结构化类型 | 要点 |
|---|---|---|
| `/` | `VideoGame` + `WebSite` | 游戏名「弹弹鸟：鸟蛋保卫战」、`genre`、`operatingSystem: Web`、`gamePlatform: Web browser / Alipay`、`aggregateRating`（占位）、`author`（占位） |
| `/levels` | `ItemList` | `itemListElement` 60 项，每项 `name`（关卡名）→ `/level/:id` |
| `/level/:id` | `VideoGame` + `BreadcrumbList` | 该关作为 episode，含 `playMode`、难度、`url`；面包屑 首页→关卡地图→本关 |
| `/leaderboard` | `ItemList` | 我的/榜单条目 `ListItem`，`position`/`author`/`url` |
| `/guide` | `Article`（3–5 篇）+ `FAQPage` | 每篇技巧一个 `Article`；FAQ 用 `Question`/`AcceptedAnswer` 对接手风琴条目 |

---

## 5. 视觉设计

### 5.1 视觉方向备选（3 个差异化方向）

> 详细展开见 §0 取舍 1，这里给完整视觉定义。

**方向 A · 暖阳牧场（推荐）**
- 配色（named hex）：主橙 `#FF8A00`、天蓝 `#4FB4F0`、草绿 `#64C24E`、太阳黄 `#FFD23E`、暖奶油底 `#FFF6E5`、木棕 `#8A5A3B`、危险红 `#F05B5B`、正文墨 `#2B2320`、辅助灰 `#8C7A6B`。
- 版式：竖向单列为主（移动优先），桌面 `max-width: 560px` 居中；卡片圆角大（16px）、`4px` 柔和投影、黄光高光；天空渐变 hero + 草丛波峰 SVG 分割线作为「地面」。
- 氛围关键词：阳光、毛绒、轻快、亲子、休闲。
- 参考产品：蚂蚁庄园（支付宝内轻互动心智）、荒野乱斗（圆润 UI）、Duolingo（高饱和 + 圆角 + 玩感）、哈啰/朴朴类暖色移动页（可读性好）。
- 理由：最贴合 G1 Q8 已确认「橙/绿/蓝高饱和卡通风」+ Q2「家庭/消遣」受众；AntD Mobile 明亮组件体系改主题成本最低；高饱和暖色对「弹弓 → 爆炸 → 通关」的正反馈最自然。

**方向 B · 夜空竞技场**
- 配色：夜空墨蓝 `#14182B`、霓虹青 `#3CE3D6`、朱红 `#FF4D3D`、电黄 `#FFE14A`、雾灰 `#6E7A9A`。
- 版式：深色大块对比、斜切分割线、分数用大型等宽数码排印、扫描线/网格底纹。
- 氛围关键词：霓虹、街机、冲击、竞技、榜单。
- 参考产品：Geometry Dash、Brotato、霓虹街机 UI。

**方向 C · 纸艺绘本**
- 配色：纸白 `#FBFAF4`、黏土橙 `#E8A98A`、苔绿 `#A8BC8F`、鼠尾蓝 `#A7B8D4`、炭灰 `#4A4A4A`。
- 版式：纸板/纸拼贴纹理、撕边卡片、细描边插画、留白大。
- 氛围关键词：绘本、手作、温柔、故事、低刺激。
- 参考产品：纪念碑谷、绘本书 App。

---

### 5.2 主题 Token（AntD Mobile v5 主题变量映射）

| 语义 | 值 | AntD Mobile 变量 |
|---|---|---|
| 品牌主色 | `#FF8A00` | `--adm-color-primary` |
| 成功/通关绿 | `#64C24E` | `--adm-color-success` |
| 危险/猪红 | `#F05B5B` | `--adm-color-danger` |
| 警示/太阳黄 | `#FFD23E` | `--adm-color-warning` |
| 文字主 | `#2B2320` | `--adm-color-text` |
| 文字次 | `#8C7A6B` | `--adm-color-weak` |
| 背景 | `#FFF6E5` | `--adm-color-background` |
| 主字号 | 17px | `--adm-font-size-7`（正文） |
| 圆角 S/M/L | 8 / 12 / 16 | `--adm-radius-s/m/l` |
| 按钮圆角 | 999px（胶囊） | `--adm-button-border-radius-m` |
| 字体族 | 系统无衬线 | `--adm-font-family` |

### 5.3 字体

- 正文/UI：系统无衬线栈 `-apple-system, "PingFang SC", "HarmonyOS Sans SC", "MiSans", "Noto Sans SC", "Microsoft YaHei", sans-serif`。不引入 web font（守 bundle 预算），靠字重与字距区分层级。
- 展示标题（Hero 大标题/数字）：同一字体栈 + 「圆胖」处理——`font-weight: 800`、`letter-spacing: 0.01em`、柔和描边文字阴影（`text-shadow: 0 2px 0 rgba(255,255,255,.6)`）+ 品牌主橙色；游戏 Logo 词标用 **SVG 字标**（自绘「弹弹鸟」连字），不依赖字体文件。
- 「签名元素」（frontend-design 唯一记忆点）：把**弹弓的 Y 形分叉 + 拉满的皮筋**做成贯穿全站的图形语言——按钮 hover 微拉、Hero 插画、关卡锁定态、进度条端点、Loading 动效都用「皮筋拉满即释放」的形态，让品牌只凭形状就被记住。

### 5.4 间距与栅格

- 375px 设计稿；`postcss-pxtorem` 随视口等比（antd-mobile 官方 rem 方案），基准 root `font-size` 按 375 算。
- 8pt 网格：页边距 16px，卡片内边距 16px，区块间距 24px，紧凑列表 12px。
- 可点击元素热区 ≥ 44×44px；底部吸底栏加 `padding-bottom: calc(env(safe-area-inset-bottom) + 12px)`；顶部吸顶栏加 `env(safe-area-inset-top)`。

### 5.5 组件风格

- 按钮：主按钮胶囊、主橙填充白字；次按钮描边；关键 CTA 带「皮筋拉满」微缩放动效。危险/不可用用灰 + 禁用态。
- 卡片：16px 圆角 + 4px 柔和投影 + 1px 内描边高光，暖白/主题色插画头图。
- 榜单：金银铜名次徽章 + 头像色块 + 昵称 + 分数，触底加载。
- 图标：antd-mobile-icons + Lucide（详见 §7 图片来源），SVG 随设计稿等比，避免位图糊。
- 动效：`transform/opacity` 过渡（尊重 `prefers-reduced-motion`）；弹射/碰撞/爆炸粒子在 Canvas 内程序化绘制。

---

## 6. 接口契约与 mock

### 6.1 概览与通用约定

- mock 载体：Next Route Handlers（`app/api/*/route.ts`）+ 共享 `lib/mock/data.ts`（详情见 §2）。
- 统一响应包裹：

```ts
type ApiResp<T> = {
  code: 0;                       // 0 成功；非 0 见 message
  message: string;
  data: T;
  page?: { page: number; pageSize: number; total: number; hasMore: boolean };  // 仅列表类
};
```

- 鉴权：本期 mock uid（游客）。`Authorization` 头或 cookie `dandan_uid`（G5 前替换为 OAuth 换取的 uid）。登录态接口在 mock 层校验：无 uid 返回 `code: 401`。
- 列表键：一律用稳定业务 id，不用数组下标作 key。

| 方法 | 路径 | 用途 | 鉴权 | 本期 |
|---|---|---|---|---|
| GET | `/api/levels` | 60 关列表（分章） | 公开 | mock |
| GET | `/api/levels/:id` | 单关详情 + 布局 | 公开 | mock |
| GET | `/api/leaderboard?type=total\|level&levelId=7&page=1` | 榜单 | 公开 | mock |
| GET | `/api/leaderboard/friends` | 好友榜 | 登录态 | 预留 |
| POST | `/api/scores` | 提交单关分数/星级 | 登录态 | mock（写 localStorage 为源） |
| GET | `/api/me` | 我的进度/星级/历史 | 登录态 | mock（localStorage） |
| POST | `/api/orders` | 创建 wap.pay 订单 | 登录态 | **预留** |
| GET | `/api/orders/:tradeNo` | 查询订单/结果 | 登录态 | **预留** |
| POST | `/api/orders/notify` | 支付宝异步通知 | 服务端签名 | **预留（服务端）** |

### 6.2 字段契约与示例

#### `Level`（GET /api/levels、/api/levels/:id）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | number | 1–60 全局自增 |
| `chapter` | 1\|2\|3 | 章节号 |
| `chapterName` | string | 章节名 |
| `name` | string | 关卡短题（友好名） |
| `displayName` | string | 完整显示名 |
| `difficulty` | 1\|2\|3 | 1 星~3 星难度 |
| `targetScore` | number | 过关分数线 |
| `starScore` | [number, number] | [2 星阈值, 3 星阈值] |
| `availableBirds` | BirdType[] | `['red','red','yellow']` 等发射序列 |
| `tip` | string | 攻略提示一句话 |
| `unlockRule` | 'none' \| number | 'none'=首关可玩；数字=需先过该 id |
| `layout` | LevelLayout | 弹弓/猪/物块布局（见下） |

```ts
type BirdType = 'red' | 'yellow' | 'blue';   // 红-标准/黄-加速/蓝-分裂（蓝本期 Should 预留）
type LevelLayout = {
  slingshot: { x: number; y: number };
  groundY: number;
  pigs: { x: number; y: number; r: number; hp: number; tier: 'normal' | 'king' }[];
  blocks: { x: number; y: number; w: number; h: number; material: 'wood' | 'stone' | 'glass'; angle?: number }[];
};
```

示例（3 条）：

```jsonc
{ "id": 1, "chapter": 1, "chapterName": "小鸟出巢", "name": "破壳首飞", "displayName": "第 1 章·小鸟出巢 第 1 关", "difficulty": 1,
  "targetScore": 5000, "starScore": [8000, 12000], "availableBirds": ["red","red","red"],
  "tip": "先拖到虚线末端松手，瞄向最上方横梁，让木塔整体倒向小猪。", "unlockRule": "none",
  "layout": { "slingshot": { "x": 120, "y": 460 }, "groundY": 540,
    "pigs": [ { "x": 300, "y": 505, "r": 22, "hp": 1, "tier": "normal" } ],
    "blocks": [ { "x": 300, "y": 460, "w": 100, "h": 14, "material": "wood" },
                { "x": 262, "y": 430, "w": 14, "h": 56, "material": "wood" },
                { "x": 338, "y": 430, "w": 14, "h": 56, "material": "wood" } ] } }

{ "id": 7, "chapter": 1, "chapterName": "小鸟出巢", "name": "木塔危楼", "displayName": "第 1 章·小鸟出巢 第 7 关", "difficulty": 2,
  "targetScore": 9000, "starScore": [13000, 18000], "availableBirds": ["red","yellow","red"],
  "tip": "黄鸟飞行途中再点一下会加速，适合击穿玻璃层后砸到后排猪。", "unlockRule": 6,
  "layout": { "slingshot": { "x": 110, "y": 460 }, "groundY": 540,
    "pigs": [ { "x": 290, "y": 400, "r": 22, "hp": 1, "tier": "normal" },
              { "x": 340, "y": 400, "r": 22, "hp": 1, "tier": "normal" } ],
    "blocks": [ { "x": 290, "y": 470, "w": 120, "h": 14, "material": "stone" },
                { "x": 340, "y": 470, "w": 120, "h": 14, "material": "stone" },
                { "x": 315, "y": 424, "w": 14, "h": 80, "material": "glass" } ] } }

{ "id": 21, "chapter": 2, "chapterName": "猪堡山", "name": "双塔守望", "displayName": "第 2 章·猪堡山 第 1 关", "difficulty": 2,
  "targetScore": 12000, "starScore": [17000, 22000], "availableBirds": ["red","red","yellow","blue"],
  "tip": "两座塔中间横梁是突破口，先断梁再逐个击破。", "unlockRule": 20,
  "layout": { "slingshot": { "x": 120, "y": 470 }, "groundY": 550,
    "pigs": [ { "x": 280, "y": 500, "r": 24, "hp": 1, "tier": "king" },
              { "x": 320, "y": 500, "r": 22, "hp": 1, "tier": "normal" },
              { "x": 400, "y": 500, "r": 22, "hp": 1, "tier": "normal" } ],
    "blocks": [ { "x": 280, "y": 470, "w": 120, "h": 16, "material": "stone", "angle": 0 },
                { "x": 400, "y": 470, "w": 120, "h": 16, "material": "wood" },
                { "x": 340, "y": 430, "w": 120, "h": 14, "material": "wood" } ] } }
```

#### `LeaderboardEntry`（GET /api/leaderboard）

| 字段 | 类型 | 说明 |
|---|---|---|
| `rank` | number | 名次 |
| `uid` | string | 用户 id（mock） |
| `nickname` | string | 昵称 |
| `avatarColor` | string | 头像色块 |
| `totalScore` | number | 总分（type=total） |
| `cleared` | number | 通关数 |
| `maxLevelScore` | number | 单关最高分（type=level 时） |
| `levelId` | number | 关卡 id（type=level 时） |

示例（3 条）：

```jsonc
{ "rank": 1, "uid": "u_007", "nickname": "弹弹侠007", "avatarColor": "#FF8A00", "totalScore": 128540, "cleared": 60 }
{ "rank": 2, "uid": "u_088", "nickname": "酥酥不吃猪", "avatarColor": "#4FB4F0", "totalScore": 126120, "cleared": 59 }
{ "rank": 3, "uid": "u_102", "nickname": "蛋壳保卫队", "avatarColor": "#64C24E", "totalScore": 124880, "cleared": 58 }
```

**榜单 mock 约定：榜单列表类 ≥ 22 条**（昵称池 + 分数分布，总分 5.5w~12.8w，通关数 27~60）。完整数据文件 `lib/mock/data.ts` 落地时生成以下 22 条：

| # | 昵称 | 总分 | 通关数 | 色块 |
|---|---|---|---|---|
| 1 | 弹弹侠007 | 128,540 | 60 | #FF8A00 |
| 2 | 酥酥不吃猪 | 126,120 | 59 | #4FB4F0 |
| 3 | 蛋壳保卫队 | 124,880 | 58 | #64C24E |
| 4 | 拖把喵酱 | 118,300 | 55 | #F05B5B |
| 5 | 一棵松树 | 112,760 | 53 | #8A5A3B |
| 6 | 鸟蛋拆迁办 | 110,210 | 52 | #FFD23E |
| 7 | 小鹿撞撞 | 105,900 | 50 | #9C6ADE |
| 8 | 核桃侠 | 101,470 | 49 | #654321 |
| 9 | 蹦蹦兔酱 | 98,320 | 47 | #7EC8E3 |
| 10 | 燕麦小饼干 | 95,140 | 45 | #E5989B |
| 11 | 芝士就是力量 | 92,080 | 44 | #F4A261 |
| 12 | 日落飞行家 | 88,660 | 42 | #E76F51 |
| 13 | 果仁队长 | 85,730 | 41 | #6D597A |
| 14 | 猫头鹰不睡 | 82,540 | 39 | #2A9D8F |
| 15 | 弹弓手杰克 | 79,300 | 38 | #264653 |
| 16 | 洋葱圈圈 | 75,890 | 36 | #B8A1D9 |
| 17 | 第59颗蛋 | 73,120 | 35 | #D4A373 |
| 18 | 打工人也要玩 | 70,540 | 33 | #3A86FF |
| 19 | 番茄炒鸡蛋花 | 67,300 | 32 | #E63946 |
| 20 | 气泡水冒泡 | 64,110 | 30 | #00B4D8 |
| 21 | 森林小骑士 | 61,020 | 29 | #588157 |
| 22 | 星星掉进碗里 | 57,880 | 27 | #7B2CBF |

#### `Score`（POST /api/scores 请求体、GET /api/me 历史项）

| 字段 | 类型 | 说明 |
|---|---|---|
| `levelId` | number | 关卡 |
| `score` | number | 单局总分 |
| `stars` | 0\|1\|2\|3 | 结算星级 |
| `playedAt` | string | ISO 时间 |
| `isNewBest` | boolean | 是否刷新最高分 |

#### `MeProfile`（GET /api/me）

| 字段 | 类型 | 说明 |
|---|---|---|
| `uid` | string | mock 游客 uid 或 OAuth uid |
| `nickname` | string | 「游客 0427」或支付宝昵称 |
| `avatarColor` | string | 色块 |
| `cleared` | number | 通关数 |
| `totalStars` | number | 总星（0–180） |
| `bestTotal` | number | 历史最高单关分 |
| `levelStars` | Record<number, 0\|1\|2\|3> | 每关星级 |
| `recent` | Score[] | 最近 20 条历史（列表类 ≥20 条） |

示例：

```jsonc
{ "uid": "u_guest_0427", "nickname": "游客 0427", "avatarColor": "#FFD23E",
  "cleared": 12, "totalStars": 26, "bestTotal": 18400,
  "levelStars": { "1": 3, "2": 2, "3": 3, "4": 0 },
  "recent": [ { "levelId": 7, "score": 15200, "stars": 2, "playedAt": "2026-11-06T09:12:00Z", "isNewBest": false } ] }
```

#### 订单预留（POST /api/orders 等）

| 字段 | 类型 | 说明 |
|---|---|---|
| `tradeNo` | string | 平台交易号（mock 生成） |
| `amount` | string | 分字符串（如 "100"） |
| `subject` | string | 商品名，如「复活×3」 |
| `redirectUrl` | string | 前端 wap.pay 跳转 URL（**本期返回占位 + 提示「即将上线」**） |
| `status` | 'created'\|'paying'\|'paid'\|'failed' | 状态 |

---

## 7. 图片资源方案

> 本步骤只列**需求清单**，不下载；下载与裁剪由下一步「图片素材采集」节点执行。所有落地路径约定在 `app/public/images/<模块>/<文件名>`（交付物 `app/` 子目录，见 G1 §11）。
> 总原则：**游戏 Sprite 与图标优先原创 SVG 自绘**（规避 Rovio 版权 + 高 DPI 不变形 + 体积小）；照片纹理/背景用免费可商用图库；头像色块、瞄准虚线、粒子爆炸、结算底图用 **CSS/Canvas 程序化**，不占图片资源。

统一制式：

- 照片/插画场景图：**WebP**（`quality 80`，同步 `srcset` 出 1x/2x 裁切）；OG 图 **1200×630 WebP**。
- 图标/游戏 sprite：**SVG**（矢量，随设计稿等比）。
- 加载策略：LCP 元素 `next/image priority` + `preload`；首屏下方图片 `loading="lazy"` + 预留尺寸盒防 CLS；游戏 sprite 在 `/play` 挂载后按需加载，不进首屏 bundle；OG 图只在 meta 引用、不在页面 `<img>` 渲染。
- 命名：小写 + 连字符，如 `public/images/game/bird-red.svg`。

| 编号 | 页面/区块 | 用途 | 数量 | 尺寸比例与像素 | 格式 | 风格描述 | 建议搜索关键词（中/英） | 建议来源站点（仅限白名单） | 加载策略 | 本地存放路径约定 |
|---|---|---|---|---|---|---|---|---|---|---|
| IMG-01 | 首页 Hero / og:image | 首屏主视觉 + 全站 og 兜底 | 1 | 1200×630（16:10/约 1.9:1） | WebP | 弹弓 + 原创圆润小鸟 + 猪堡，阳光天空渐变色、暖橙高饱和卡通 | 「卡通 弹弓 小鸟 插画 / cartoon slingshot bird illustration」 | unDraw / Storyset（插画风格参考，调色至品牌橙蓝绿）+ 原创自绘 SVG 合成 | **LCP 预加载**（`priority` + `preload`） | `public/images/home/hero.webp` |
| IMG-02~04 | 首页 三步玩法 | 引导 icon（瞄准/发射/摧毁） | 3 | 1:1（96×96 起） | SVG | 扁平 + 轻描边，与皮筋图形语言一致 | 「aim / slingshot / break target」 | Lucide / Tabler Icons / unDraw；优先自绘 SVG | 内联 sprite，无网络请求 | `public/images/home/step-aim.svg`、`step-launch.svg`、`step-crush.svg` |
| IMG-05~10 | 首页 关卡精选 / `/level/:id` 头图 | 6 关缩略图 | 6 | 640×360（16:9） | WebP | 关卡场景快照（木塔/石堡/玻璃塔），与章节主色呼应 | 「卡通 关卡 场景 木质 城堡 / cartoon level wooden tower castle」 | Storyset / unDraw（Illustration，调色）+ 原创场景合成 | 首屏下方 `loading="lazy"` + 预留尺寸盒 | `public/images/levels/card-1.webp` … `card-6.webp` |
| IMG-11~20 | 首页/榜单/结算 | 头像色块 | 10 位（非必备素材） | 1:1（48×48） | — | 纯色圆角块 + 昵称首字母 | — | **推荐 CSS 渲染**（`avatarColor` + 首字符），不落盘图片；备选可选 Twemoji 头像 | 无网络请求 | 无需落盘（如备选用 SVG：`public/images/avatar/avatar-01.svg`） |
| IMG-21~23 | `/levels` 章节 Tab | 章节封面 | 3 | 3:1（1200×400） | WebP | 主题色场景：绿林·橙山·蓝天 | 「卡通 森林 / 山丘 / 天空 背景 / cartoon forest hill sky」 | Unsplash / Pexels（实拍做底）+ 原创插画叠色 | `loading="lazy"` | `public/images/chapters/ch-forest.webp`、`ch-hill.webp`、`ch-cloud.webp` |
| IMG-24~26 | `/levels` 关卡网格 | 锁定/星级/完成态图标 | 3 | 1:1（32×32） | SVG | 扁平：锁/星/对勾 | 「lock / star / check」 | antd-mobile-icons / Lucide / Heroicons | 内联（icon 组件，不落盘） | 如落盘：`public/images/levels/icon-lock.svg` 等 |
| IMG-27 | `/level/:id` + og | 关卡 og:image（60 关） | 由 3 章底图 + 模板合成（**非 60 张独立素材**） | 1200×630 | WebP | 章节底图 + 关卡名 + 分数条 | 「关卡 分享 卡片 / level share card」 | 章节底图（IMG-21~23）+ IMG-47 成绩卡模板，构建期合成 | 仅 meta 引用 | `public/images/og/level-{id}.webp`（构建期生成） |
| IMG-28 | `/play/:id` 玩法 | 弹弓 | 1 | 约 3:2（240×160） | SVG | 木质卡通，Y 形 + 皮筋 | 「弹弓 / slingshot」 | 原创自绘 SVG（unDraw 类风格无版权，调色） | `/play` 挂载后按需加载 | `public/images/game/slingshot.svg` |
| IMG-29~31 | `/play/:id` 角色 | 小鸟 sprite（红/黄/蓝） | 3 | 1:1（80×80） | SVG | 圆润可爱、大眼、短翅；红-标准/黄-加速/蓝-分裂 | 「卡通 圆润 小鸟 角色 / cartoon round bird character」 | Open Doodles / 原创自绘 SVG | `/play` 挂载后按需 | `public/images/game/bird-red.svg`、`bird-yellow.svg`、`bird-blue.svg` |
| IMG-32~33 | `/play/:id` 角色 | 猪 sprite（普通/猪王） | 2 | 1:1（80×80） | SVG | 圆润憨态、绿皮、猪王冠 | 「卡通 圆润 猪 角色 / cartoon round pig character」 | Open Doodles / 原创自绘 SVG | `/play` 挂载后按需 | `public/images/game/pig.svg`、`pig-king.svg` |
| IMG-34~36 | `/play/:id` 结构 | 木块/石块/玻璃块 | 3 | 1:1（按格缩放，基础 120×24 横/24×120 竖） | SVG | 材质纹理：木纹/石纹/半透明玻璃 | 「木块 / 石块 / 玻璃 材质 / wood stone glass block」 | 原创自绘 SVG（铺 tile 用 `pattern`） | `/play` 挂载后按需 | `public/images/game/block-wood.svg`、`block-stone.svg`、`block-glass.svg` |
| IMG-37~39 | `/play/:id` 背景 | 天空/远山/地面三层 | 3 | 16:9（1920×1080，裁 4 档） | WebP | 手绘渐变天空、剪影远山、草丛地面，视差层 | 「卡通 天空 渐变 / 剪影 山 / 草地 / sky gradient silhouette hill grass」 | Unsplash / Pexels（做底）+ 原创插画 | 天空层首位优先，远山/地面懒加载 | `public/images/game/bg-sky.webp`、`bg-hill.webp`、`bg-ground.webp` |
| IMG-40 | `/play/:id` 交互 | 瞄准虚线/粒子爆炸/结算底图 | 若干 | — | — | 轻量矢量反馈 | — | **Canvas 程序化绘制**（不落盘图片） | 无 | 无需落盘 |
| IMG-41~43 | `/leaderboard` | 金银铜名次徽章 | 3 | 1:1（40×40） | SVG | 金属质感圆徽 | 「medal gold silver bronze」 | Lucide（Medal）/ Tabler / 原创自绘 SVG | 内联 | `public/images/ranking/badge-gold.svg`、`badge-silver.svg`、`badge-bronze.svg` |
| IMG-44~46 | 全站细节体验 | 空态/加载/引导插画 | 3 | 4:3（480×360） | WebP（或 Storyset SVG） | 扁平卡通：空榜单、断网鸟、新手引导 | 「empty state / offline / onboarding illustration」 | Storyset / unDraw / Open Doodles | 按需加载 | `public/images/empty/empty-rank.webp`、`error-offline.webp`、`guide-welcome.webp` |
| IMG-47 | 分享 | 成绩卡片模板底图 | 1 | 1200×630 | SVG（底图）+ WebP（合成产物） | 高对比：分数大字 + 关卡 + 「敢来挑战吗」CTA | 「score share card template」 | 原创自绘 SVG 模板 | 构建期合成 og 时引用，不进页面 | `public/images/share/score-card-template.svg` |

### 7.1 无需图片素材的位（程序化/CSS）

| 位 | 实现 | 说明 |
|---|---|---|
| 头像色块（首页/榜单/我的） | CSS `avatarColor` + 首字母 | IMG-11~20 相关，省请求 |
| 瞄准虚线、粒子爆炸 | Canvas 绘制 | IMG-40 |
| 结算弹层底图/星级动画 | CSS 渐变 + antd-mobile | — |
| 按钮/导航图标 | antd-mobile-icons / Lucide 字体组件 | 内联，不落盘 |
| 关卡网格颜色格 | 主题色 CSS | — |

---

## 8. 视觉方向备选（详细对比，供 §0 取舍 1）

> 见 §5.1。推荐方向 A · 暖阳牧场。

## 9. 逐页线框与内容（本期 7 页）

> 区块自上而下排列；组件以 antd-mobile v5 命名；交互标注点击/滑动/下拉刷新/加载更多。

### `/` 首页（A，SSG）

1. **品牌吸顶栏**（`NavBar` 透明吸顶 → 滚动后白底）：左「弹弹鸟」字标（SVG），右「我的战绩」icon（`UserOutline`）→ `/me`。滚动吸顶（`position: sticky`）。
2. **Hero 主视觉**：天空渐变块 + IMG-01 插画 + 大标题「弹弹鸟·鸟蛋保卫战」（SVG 词标）+ 副标「拉满弹弓，守护最后一颗蛋」+ 主 CTA `Button`「开始游戏」（→ `/play/<下一未通关关>`, 新手 → `/play/1`）+ 小字「免登录 · 免费 · 无需下载」。登录态在 CTA 下补一行「已通关 X/60，继续 `第Y关`」(SSG 不含，hydrate 注入)。
3. **三步玩法**：三个 Step 卡（`Grid` 三列 / 移动端横滑），每卡 IMG-02~04 + 标题 + 一句：①「瞄准」拖动小鸟，拉满皮筋；②「松手」瞄准就绪，松手发射；③「摧毁」击倒猪堡，收复鸟蛋。
4. **关卡精选**：`Card` 横滑（`swiper` 或横向 `Swiper`），6 张 IMG-05~10，每卡缩略图 + 关名 + 3 星 + 最高分；点卡 → `/level/:id`；尾部「查看全部 60 关 →」→ `/levels`。
5. **排行榜 Top10**：`List` 前置「本周弹王」标题，10 条 `ListItem`（名次徽章 + 头像色块 + 昵称 + 总分）；底部「查看完整榜单 →」→ `/leaderboard`。
6. **分享/打开引导**（落地转化）：两枚次级 `Button`——A「用支付宝打开」仅浏览器显示，走 `openPageInAlipay(location.href)`；B「收藏本站」写 localStorage（`dandanniao:fav`），Toast「已收藏，下次从浏览记录进」。支付宝内则显示「分享给好友」→ 复制 URL + `navigator.share` 可用时调系统分享，Toast 引导。
7. **底部 Footer**：版权/备案占位 + 「本作为原创卡通，与 Rovio 无关联」说明 + 隐私占位链接。

### `/levels` 关卡地图（A，SSG）

1. **吸顶 NavBar**：返回（`history.back`，无上级 → `/`）+ 标题「关卡地图」。
2. **进度概览条**：`ProgressBar`「已通关 X/60 · 总星 Y/180」（hydrate 注入个人数据；SSG 先显「60 关等你挑战」）。
3. **章节 Tabs**（`Tabs`）：三章「第 1 章·小鸟出巢 / 第 2 章·猪堡山 / 第 3 章·云端天梯」，Tab 头用 IMG-21~23 封面缩略。
4. **关卡网格**：`Grid` 每章 20 格，每格编号 + 迷你名 + ⭐⭐☆ 或锁 icon（IMG-24~26）。**交互**：已解锁格点按 → `/play/:id`；锁定格点按 → `Toast`「先通关第 N 关」。已 3 星格显示三颗金星 + 最佳分。
5. **底部激励语**：全部 3 星时显示「60 关全星！快上排行榜证明你」+「分享我的战绩」按钮。

### `/level/:id` 关卡落地页（A，SSG+ISR，分享落地）

1. **吸顶 NavBar**：返回（→ `/levels`）。
2. **关卡信息 Hero**：IMG（章节底图/精选图）+ `displayName` + 难度 `★★☆` + 我的最高分/星级（登录态）+ 一句话简介段落（**可抓 SEO 文本**）。
3. **关卡排行榜 Top**：`List` 10 条（名次徽章 + 头像色块 + 昵称 + `maxLevelScore`），数据 `/api/leaderboard?type=level&levelId=:id`。
4. **主 CTA 吸底栏**：`Button`「开始挑战」→ `/play/:id`（未解锁则禁用 + 提示）；次按钮「返回关卡列表」→ `/levels`。
5. **分享引导**：og meta 已在 head；页内「分享本关」→ 复制 `/level/:id?from=share` + Toast。

### `/leaderboard` 排行榜（A，SSR）

1. **吸顶 NavBar** + `Tabs`（总分榜 / 单关最高）。
2. **我的排名卡**：未登录 → 黄色提示卡「登录后上榜，跨端同步」+「支付宝一键登录」按钮（OAuth `publicAppAuthorize` 跳转，本期 mock uid）；登录后 → 我的名次/总分/通关数。
3. **榜单列表**：`List` + `InfiniteScroll`（触底加载下一批，20+ 条分页 pageSize=20），每条 `ListItem`：金银铜徽章（IMG-41~43，4 名后数字）+ 头像色块 + 昵称 + 总分/单关分。**交互**：下拉刷新 `PullToRefresh`；长列表悬浮「回到顶部」按钮；加载中 `Skeleton` 行占位。
4. **底部**：「分享我的成绩」按钮（生成 `/level/:bestLevelId` 分享 URL）。

### `/guide` 玩法攻略（A，SSG）

1. **吸顶 NavBar**。
2. **玩法总述**：标题 + 摘要段落 + IMG-01 复用配图 + 三步回顾。
3. **技巧文章**：3–5 篇 `Card` 文章（`Article` 结构化数据），每篇标题/摘要/正文段落/关键图（复用 IMG-02~04 与 IMG-44~46）；锚点导航滚动高亮。
4. **FAQ**：`Collapse` 手风琴 5–8 条（怎么三星? 黄鸟/蓝鸟怎么用? 断网能玩吗? 怎么登录同步? 付费吗?）。
5. **底部 CTA**：「去试试第一关」→ `/play/1`。

### `/play/:id` 游戏关卡页（B，CSR + noindex）

1. **顶部 HUD 吸顶**：暂停 `Button` + 分数（大字）+ 剩余小鸟 icon×N + 关卡名。横屏安全区留白。
2. **游戏 Canvas（核心区）**：全屏物理场景（box2d/planck.js），背景三层 IMG-37~39 视差；弹弓 IMG-28 + 当前小鸟 IMG-29~31 上膛；猪 IMG-32~33、木/石/玻璃块 IMG-34~36；拖拽牵引显示瞄准虚线（Canvas）、松手发射、击中判定、猪与结构倒塌、粒子爆炸（Canvas）。**交互**：单指拖拽牵引、黄鸟飞行中再点加速（预留）、蓝鸟点按分裂（预留）。游戏内单机无网可玩。
3. **结算弹层**（`Popup`）：星级 1–3 + 分数 + 最高分刷新标记 + 按钮「下一关」`/play/:nextId`、「重试」重载当前局、「分享成绩」→ 生成 `/level/:id` 分享 URL + Toast；「复活」按钮本期点按弹 `Dialog`「支付功能即将上线」（wap.pay 预留入口）。
4. **暂停弹层**：继续 / 重新开始 / 退出到 `/levels`（`history.back`）。
5. **浏览器降级屏**（`AlipayGuard`）：非支付宝环境**不渲染 CSR**，仅显示「请在支付宝中打开」+ 「用支付宝打开」唤起按钮。

### `/me` 我的战绩（B，CSR + noindex）

1. **吸顶 NavBar**：返回（→ `/`）+ 标题「我的战绩」。
2. **用户卡**：头像色块 + 昵称（游客态「游客 N」+「支付宝一键登录」按钮；登录态昵称+uid）+ 三枚数据（通关数 / 总星 / 最高单关分）。
3. **关卡星级明细**：60 格 mini `Grid`（1–3 金星或灰锁），点格 → `/level/:id`。
4. **历史记录**：`List` 最近 20 条（关卡名 + 分数 + 星级 + 时间），空态 `Empty` 引导「去关联卡玩一把」；触底 `InfiniteScroll`。
5. **设置区**：音效开关（`Switch`）、BGM 音量（`Slider`）、清除本地存档（`Dialog.confirm`）、关于与免责声明。
6. **底部**：登录/退出（OAuth 预留，本期 mock 切换游客态）。

---

## 10. 状态与体验细节

### 10.1 全状态覆盖

| 状态 | 表现 | 触发/说明 |
|---|---|---|
| 加载中（首屏） | SSG/SSG+ISR/SSR 真实 HTML 直出 = 最好的「loading」，不加骨架 | A 类页。首屏数据已在 HTML |
| 加载中（客户端拉取） | `Skeleton` 骨架行（榜单/我的进度/历史） | hydrate 后拉取的登录态/分页数据 |
| 加载中（游戏页） | `/play` 挂载：背景骨架 + 物理引擎懒加载进度条；Canvas 就绪后再合成场景 | 首关可进入 ≤3s（性能预算） |
| 空状态 | `Empty` + 插画 + 主操作按钮：榜单空「还没有人上榜，快来抢第一」→ 去玩 / 历史空「你的战绩会出现在这里」→ 去玩 / 精选无数据兜底 | 分页到尾「没有更多」 |
| 错误/网络异常 | `ErrorBlock`「网络开小差了」+「重试」按钮；`Toast` 区分「网络连接失败」与「服务开小差(5xx)」 | 接口失败；`/play` 单机不依赖网络仍可玩 |
| 未登录 | 游客态：本地存档可玩；榜「登录后上榜」；`/me` 游客卡 + 登录按钮 | OAuth 本期 mock uid |
| 无权限/未解锁 | 锁定格 `Toast`「先通关第 N 关」；「开始挑战」禁用态 | `/levels`、`/level/:id` |
| 支付成功/失败/处理中 | **本期预留**：复活点按 → `Dialog`「支付功能即将上线」；预留 `/api/orders` 返回 `status`（created/paying/paid/failed 对应 处理中 spinner/成功 Toast/失败回退 + 重试），实接后落地 | 不实接 wap.pay |

### 10.2 微交互与体验细节

- **转场**：页间整页加载（无原生转场），靠骨架/数据直出降低白屏；首屏用 CSS 淡入 + 上移 8px 进场；尊重 `prefers-reduced-motion`。
- **反馈 Toast**：收藏成功、分数已记录、已复制分享链接、解锁失败提示——统一 antd-mobile `Toast`，文案与按钮动词一致（「已收藏」「已复制」「已记录」）。
- **吸顶**：全站 `NavBar` 吸顶；`/play` HUD 吸顶；`/level/:id` 底部 CTA 吸底 + 安全区。
- **返回顶部**：`/leaderboard` 长列表悬浮「回到顶部」按钮。
- **分享引导**：结算页/我的/榜单三处「分享」统一生成 `/level/:id`（带 `?from=share`）URL；`navigator.share` 可用调系统分享，否则复制链接 + Toast；外部卡片靠 og meta，App 内无自定义分享 SDK。
- **收藏/历史**：首页「收藏本站」写 localStorage；`/me` 历史记录列表（分页）；跨次回访 `/` 顶部提示「继续第 Y 关」。
- **下拉刷新/加载更多**：`/leaderboard` 榜单 `PullToRefresh` + `InfiniteScroll`；列表类分页 pageSize=20。
- **点击反馈/防抖**：可点元素 `:active` 反馈或 antd-mobile `Button`/`ListItem` activeStyle；提交分数防重复（提交即禁用直到结果）；滚动监听节流/`rAF`。
- **弱网降级**：图片懒加载 + 占位盒；接口超时兜底文案 + 重试；`/play/:id` 单机可玩（物理/存档不走网络）。
- **无障碍周边**：语义化标签 + 热区 ≥44px + 颜色对比达标 + 图片 alt；Canvas 玩法提供文字替代说明（游戏核心 a11y 受限，已在 G1 说明）。

---

## 11. 残余待定项（不阻塞本阶段）

- 品牌名与 canonical 域（占位「弹弹鸟：鸟蛋保卫战」/ `https://dandanniao.example.com`，G5 前定稿）。
- 企业支付宝 AppId / 跳转域名白名单（支付与 scheme 唤起真实资质，G5 前补）。
- 上线时间与灰度节奏（G5 发布门确认）。
- 交付物 `app/`（React+TS+Next）为新建独立子目录，实现阶段（G3）落地目录结构；现有 worktree 内 PakePlus/Tauri 脚手架与本 H5 无关。

---

## 12. 决策定稿

> 以下 3 项关键取舍均为**用户已确认**（全部采纳推荐项），据此**定稿**；后续任一阶段如需变更可回改 §2 / §5 / §7：

1. **视觉风格方向**：A · 暖阳牧场（§0 取舍 1 / §5.1）。
2. **`/leaderboard` 渲染**：SSR（§0 取舍 2 / §2）。
3. **关卡 og:image 策略**：「3 章底图 + 成绩卡模板，构建期合成 60 张静态 og」（§0 取舍 3 / §7 IMG-27、IMG-47）。