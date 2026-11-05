# 《弹弓小队》— 方案设计（G2 设计与选型）

> 依据 skill：alipay-h5-program-generator（G2 设计与选型）
> 前序产物：`.agents/workflow/requirements.md`（G1，工作名《弹弓小队》）
> 工作目录：`/root/.agentix/agentic-dev/runs/DEV-966dcd0a-7905-11f1-9649-3b4281182f10-e31fa46a-94ab-4d5e-aa9f-47b26cd445c1/worktree`
> 本文为**已定稿方案**（2026-11-05 用户确认关键取舍：视觉=松木工坊、分享页=SSG+ISR、命名沿用《弹弓小队》+ 弹珠小队），据此进入 G3 编码。

---

## 0. 设计基调（一句话）

一款**「松木手作风」的弹弓物理休闲小游戏**：主角是原创「弹珠小队」（弹弓发射弹珠），目标是拆掉用木箱/玻璃/石头搭成的**软泥怪堡垒**；画面走「木匠工坊质感 + 高饱和场景主角」，关卡地图画成一条真实的「麻绳路径」串起 20 关——既把「关卡进阶」这件物理存在的事摆到界面上，也让产品一眼与满屏的糖果换皮小游戏区分开。

> 原创 IP 底线：不用「愤怒的小鸟/绿皮猪/Rovio」任何名称、角色、美术；发射物=**弹珠**，敌人=**软泥怪与方块堡垒**（详见 §6.2）。

---

## 1. URL 结构（A / B / C）

> 总原则：要被收录/被分享的页面 = 独立公网 URL + 可抓首屏（SSG/SSR 直出）；纯局内/结算 = noindex 功能页；浏览器→支付宝 = C 类引导。

| 屏（路径） | 类别 | 收录 | 说明 |
|---|---|---|---|
| `/` 首页 | **A** | ✓ sitemap | 公开聚合，SSG |
| `/levels` 关卡列表 | **A** | ✓ sitemap | 20 关 + 每日挑战，SSG |
| `/leaderboard` 排行榜 | **A** | ✓ sitemap | 公开总榜 SSG；我的名次 hydrate |
| `/share/:shareId` 分享落地 | **A** | ✓ sitemap（或按 shareId 动态出） | 成绩卡落地，SSG+ISR |
| `/guide/:slug` 攻略 | **A** | ✓ sitemap | 1 篇图文，SSG |
| `/play/:id` 游戏页 | **B** | ✗ noindex | Canvas 单局，CSR |
| `/result/:id` 结算页 | **B** | ✗ noindex | 得分/星级/分享，CSR |
| `/go-alipay` 打开支付宝引导 | **C** | ✗ noindex | 浏览器内 scheme landing 引导（见 §4.3） |

要点：

- **B 类不拦截浏览器**：`/play`、`/result` 双端可玩，仅 `robots noindex` + 不进 sitemap；**不用** AlipayGuard 的「请在支付宝中打开」拦截（它只该作用于“必须有支付宝能力才能用”的页面）。登录/提交成绩时才引导进支付宝。
- **C 类只有一个轻引导页** `/go-alipay?url=...`：浏览器用户在「打开支付宝继续/查看名次/分享」场景进入，自动尝试 scheme 唤起 + 手动按钮兜底（详见 §4.3）。
- **多步流程不进原生栈**：跨屏一律 `location`+`history.back()`（`container.popWindow`）；本期的「提交成绩→结算位次」天然是服务端/本机写回，不做前端多步状态机。

---

## 2. 渲染决策（逐页）

| 页面 | 决策 | 理由 |
|---|---|---|
| `/` 首页 | **SSG** | 公开聚合内容（Hero、玩法、星数、榜单预览）构建期即确定，无按请求动态；CDN 直发秒开 |
| `/levels` 关卡列表 | **SSG** | 20 关配置 + 章节目录是静态内容；`generateStaticParams` 一次性生成 |
| `/play/:id` | **CSR + noindex** | 局内交互（Canvas + Physics 懒加载）无 SEO 价值；`generateStaticParams` 预生成 20 关 + `daily`，`dynamicParams=false` 未知 id 直接 404 |
| `/result/:id` | **CSR + noindex** | 结算数据来自客户端本局状态（无登录态 SSR 可拼内容）；直开时回退关卡默认态 |
| `/leaderboard` | **SSG + CSR 增量** | 公开总榜为 mock 静态，SSG 直出 Top20；「我的名次/我的星级」为登录态，hydrate 后拉取 |
| `/share/:shareId` | **SSG + ISR**（推荐，选项见下） | 成绩卡可被收录、被爬虫抓，需可抓 HTML；shareId 持续新增，用 ISR 按需重生成，避免 SSR 每次冷计算 |
| `/guide/:slug` | **SSG** | 1 篇静态图文（JSON/Markdown 构建期注入） |
| `/go-alipay` | **CSR + noindex** | 纯客户端跳转引导页 |

### 分享落地页渲染：SSG + ISR（已确认）

| 选项 | 做法 | 优点 | 缺点 | 标注 |
|---|---|---|---|---|
| **A. SSG + ISR** | `generateStaticParams` 预生成占位，`dynamicParams=true` + `revalidate` 对全新 shareId 按需生成并缓存 | 无冷启动、可被爬虫、CDN 缓存 | 需 ISR 存储/回源策略 | **✅ 已定稿** |
| B. 纯 SSR | 每次访问服务端实时拼出成绩卡 HTML | 永远最新、实现最简 | 无 CDN 静态缓存、峰值成本高、首字节慢 | 备选（未采用） |

---

## 3. 容器能力（纯 H5 公开能力边界）

> 硬约束（不动摇）：**没有 `my.*`、`AlipayJSBridge.call(...)`、`ap.tradePay`、多 WebView、离线包、自定义分享**。全部能力 = Level 1 标准 Web + Level 2 开放平台服务端接口/scheme。业务页只调 `container/*` 薄封装，方法名与模板 `container.ts` 对齐。

### 3.1 wap.pay 支付（本期不接，仅预留）

- 形态：服务端用 `alipay-sdk` 生成 `alipay.trade.wap.pay` 支付 URL → 前端 `container.startPay(payServerUrl)` = `location.assign(url)`。
- 预留接口：`POST /api/pay/create`（§8.9），前端**绝不**持有私钥、**绝不自拼**支付参数。
- 本期：不实现、不写死任何前端支付代码；UI 上也不放付费按钮（变现后置）。

### 3.2 OAuth 授权（登录/提交成绩时触发）

- 默认路径：服务端构造 `publicAppAuthorize` 授权 URL → 前端 `container.redirectToAuth(authUrl)` 跳转 → 回跳页用 auth_code 换 uid（服务端 `alipay.system.oauth.*`）。
- 可选增强：`ap.getAuthCode` 半屏授权（源 `/mini/02xtl8`、`/open/01zsdu`）——**默认不引入**；仅当未来“不离开页面”授权有明确体验收益再评估，且包名/来源以 `open/08xgr7` 为准。
- 本期落地：登录入口只在「提交成绩到榜单 / 查看我的名次 / 分享成绩」出现；游客可玩 + 本机存档不受影响。

### 3.3 alipays scheme 唤起（浏览器 → 支付宝）

- `container.openPageInAlipay(targetUrl)`：
  - scheme = `alipays://platformapi/startapp?appId=20000067&url=<encodeURIComponent(本页URL)>`
  - landing = `https://render.alipay.com/p/s/i/?scheme=<encodeURIComponent(scheme)>` → `location.assign(landing)`
- 非 alipay.com 域名需开放平台白名单（上线前由你提供域名）。
- C 类 `/go-alipay` 用它做「自动唤起 + 手动点击兜底」引导页。

### 3.4 环境降级

- `isAlipayClient()`（UA/`AlipayJSBridge` 存在性判定，SSR 安全）**仅用于**：启用登录/提交成绩入口、给浏览器用户出降级提示。绝不据此调用任何容器 JSAPI，也不据此给爬虫出不同内容（反 cloaking）。
- 浏览器内降级规则：
  - 公开玩法照常可玩（游客 + 本机存档）。
  - 「查看我的名次 / 提交成绩」：浏览器内提示「登录后可同步与冲榜」+「在支付宝中打开」按钮（`/go-alipay`）。
  - B 类页不拦截、正常渲染。

---

## 4. SEO 方案

### 4.1 全局 head（进 SSR HTML，不用 JS 动态塞）

- `<html lang="zh-CN">`；`<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`。
- 站点名常量：`《弹弓小队》｜休闲弹弓物理小游戏`。
- 全局 `application/ld+json`：`WebSite`（name/url/description）+ `Organization`（name/logo）。
- 全局 `<link rel="icon">`（favicon）+ `<link rel="apple-touch-icon">`。

### 4.2 分页 head 契约（title / desc / canonical / OG）

canonical = og:url = 分享 URL = 公网 URL，**四处一致**。OG 图统一 `https://<域名>/images/og/og-default-1200x630.webp`（默认）+ 分页专项图。

| 页面 | title / desc 要点 | 结构化数据 |
|---|---|---|
| `/` | title「弹弓小队：弹弓物理休闲小游戏」；desc 含关键词「弹弓物理游戏、休闲小游戏、打发时间小游戏」；og 用 Hero 主视觉 | `WebSite` + `VideoGame`（name/genre/playMode/offers 预留） |
| `/levels` | title「弹弓小队 · 20 个关卡」；desc 概述 4 章节；og 用关卡地图图 | `ItemList`（20 个 ListItem，每项 name/position/url 指向 `/play/:id`） |
| `/leaderboard` | title「弹弓小队 · 排行榜」；desc 规则说明 | 无（公开总榜；登录态区块不清） |
| `/share/:shareId` | title「{昵称}在弹弓小队拿下 {score} 分 · {关卡名}」；desc 成绩+星级；og 用成绩卡封面 | `VideoGame`（含 score 扩展字段占位） |
| `/guide/:slug` | title「{攻略标题} · 弹弓小队」；desc=摘要 | `Article`（headline/abstract/image/datePublished） |
| B/C 类 | `robots: noindex,follow`，无 canonical/og 收录诉求 | 无 |

### 4.3 sitemap.xml / robots.txt

- `sitemap.xml`：仅含 A 类（`/`、`/levels`、`/leaderboard`、`/guide/:slug`、已有 shareId 的 `/share/:shareId`）。
- `robots.txt`：
  ```
  User-agent: *
  Allow: /
  Disallow: /play/
  Disallow: /result/
  Disallow: /go-alipay
  Disallow: /api/
  Sitemap: https://<域名>/sitemap.xml
  ```

### 4.4 分享双路径

- 外部分享（微信/QQ/浏览器）：靠上面 OG meta；用户点开命中 `/share/:shareId`。
- App 内分享：无 `setShareContent`，默认分享当前 URL；页内给「复制链接」按钮（`navigator.clipboard`）+ 引导。

---

## 5. 视觉设计

### 5.1 视觉方向（已定稿：B 松木工坊）

| 方向 | 配色 | 版式/氛围关键词 | 参考产品 | 优劣 | 标注 |
|---|---|---|---|---|---|
| A. 糖果竞技场 | 高饱和糖果色（草莓红+柠檬黄+薄荷绿）+ 粗描边圆润卡通 | 热闹、萌、即点即玩、金雕玉琢 | Duolingo、《荒野乱斗》、Candy Crush | 爽感强、上手即萌；但撞脸严重、差异化弱 | 未采用 |
| **B. 松木工坊（手作玩具）** | 暖白纸板/松木底 + 麻绳/软木质感 + 高饱和章节场景主角 | 手作温度、匠心、可收藏、弹弓皮筋橙红作主品牌 | 《分手厨房》的材质、皮克斯手作短片、《纪念碑谷》的克制构图 | 差异化强、与「弹弓=手作物件」语义自洽；爽感靠角色/碎块高饱和爆发补齐 | **✅ 已定稿** |
| C. 极简低多边形 | 莫兰迪低饱和 + 低多边形山体/建筑 | 安静、chill、禅意 | Alto 系列、Monument Valley | 气质高级；但弱化物理破坏爽感、与 idle game 情绪不符，且接近模板「暖米底」默认脸 | 未采用 |

**推荐 B 的理由**：弹弓、麻绳、木箱、玻璃本就是「手作玩具/工地材料」，用材质叙事比糖果色更贴合物理玩法；4 个章节（丛林/沙漠/雪地/城镇）正好提供高饱和的自然/城市颜料，避免模板化「暖米底」——底色是冷感的工坊纸板白，活泼全压在场景与角色上。

### 5.2 主题 Token（基于 AntD Mobile 主题变量）

| Token | 值 | 用途 |
|---|---|---|
| `--adm-color-primary` | `#FF5A36` | 弹弓皮筋橙红：主按钮、CTA、星、关键强调 |
| `--adm-color-success` | `#2E9E5B` | 三星/通关/成功 |
| `--adm-color-warning` | `#F7B733` | 每日挑战、能量条、提示 |
| `--adm-color-danger` | `#E5484D` | 失败/重试/错误态 |
| `--adm-color-text` | `#2B2A28` | 主文字（墨色，贴近松木热印） |
| `--adm-color-text-secondary` | `#6E6A62` | 次要文字 |
| `--adm-color-weak` | `#A8A29A` | 弱化/占位 |
| `--adm-color-border` | `#E3DBCB` | 分隔、卡片描边 |
| `--adm-color-background` | `#F6EFE3` | 松木纸板暖白底 |
| `--adm-font-size-main` | `15px`（px，经 postcss-pxtorem 适配） | 正文基准 |
| `--adm-radius-s/m/l` | `8 / 12 / 20px` | 卡片适中圆角，保留玩具感但不油腻 |
| `--adm-font-family` | 见 §5.3 | 全站字体 |

- **章节主题色**（用于关卡卡、章节图标、局内前景）：丛林 `#2E9E5B` / 沙漠 `#E9A23B` / 雪地 `#3D9BE9` / 城镇 `#C77B4A`。
- **局内材质色**：木箱 `#C98A5B`、玻璃 `#9BD8E8`(半透明)、石头 `#8B8D94`、铁块 `#5B6472`、软泥怪 `#7FD65A`。

### 5.3 字体

- **Display（标题/数字/星级）**：`得意黑（Smiley Sans）`（开源 OFL、粗黑斜体、游戏感强）——用于 Hero 标题、分数、关卡编号。
- **Body（正文/按钮）**：系统栈 `-apple-system, "PingFang SC", "HarmonyOS Sans SC", "MiSans", "Helvetica Neue", sans-serif`（不额外加载中文字体，控制包体）。
- Web 字体策略：display 字体走 `next/font`（本地子集 + `font-display: swap`），仅收「标题+数字」子集，避免大包体。
- **Type scale**（设计稿 375px 基准）：12/14/15/17/20/28/40px；分数大数字用 display 面。

### 5.4 间距与组件风格

- 间距基准 8px 栅格（8/12/16/24/32）；移动端优先，宽度 `vw/%`，内容区桌面 `max-width: 560px` 居中。
- 组件风格：卡片**暖白纸板底 + 1px `#E3DBCB` 描边 + 12px 圆角 + 轻微底部投影**（手作物件感）；主按钮橙红、胶囊圆角、≥44px 热区；列表项整行可点、`:active` 有压下反馈。
- **签名元素**：关卡地图 = 一条蜿蜒「麻绳」，节点是 20 颗「弹珠」；已通关=填充弹珠+星星，锁定=灰色绳结。这是全站记忆点（§6.2 `/levels`）。

---

## 6. 逐页线框与内容（含真实文案示例）

> 每个区块给：**从上到下 → 组件 → 真实内容 → 交互**；状态覆盖统一放 §7。`Chinese` 文案常量，全站统一词汇：发射按钮=「发射」、重开=「重开本关」、下一关=「下一关」、分享=「炫耀一下」。

### 6.1 首页 `/`

1. **顶部导航条**：左 = Logo（弹珠徽标 + 「弹弓小队」），右 = 「打开支付宝」文字按钮（浏览器时）+ 「攻略」入口。
   - 内容：Logo 徽标（SVG）+ 站名。
   - 交互：右按钮 → `/go-alipay` 或 `/guide/slingshot-tips`。
2. **Hero 主视觉**：16:9 插画 = 弹弓 + 待发弹珠 + 软泥怪堡垒剪影。
   - 内容：大标题「拖一拖，拉一拉，把堡垒一炮打趴！」+ 副标题「20 关物理弹弓 · 手机即玩 · 三星全收集」+ 主 CTA「开始游戏」+ 次 CTA「继续第 N 关」（有存档时）。
   - 交互：主 CTA → 有存档跳最近未满三星关卡，否则 `/levels`；Hero 图 LCP 预加载。
3. **玩法三步图解**：三张 mini 插画 + 文案（①拖拽瞄准 → ②松开发射 → ③摧毁目标拿星）。
   - 内容：三列 `Grid`，每列图标 + 短句。
4. **进度概览卡**：`20 关 × 3 星 = 60 星`，显示「已集 N/60 星」，进度条 + 通缉/收藏引导。
   - 内容：真实数字（本机存档聚合）。
   - 交互：点击 → `/levels`。
5. **排行榜 Top5 预览**：`List` 5 行（名次/昵称/头像/总星），footer「查看完整榜单」。
6. **分享/打开支付宝入口区**：分享卡文案「叫上好友来比一比」+「在支付宝中打开」按钮。
   - 交互：分享 → 复制链接/引导；支付宝 → `/go-alipay`。

### 6.2 关卡列表 `/levels`（签名页）

1. **吸顶进度栏**：左「第 X 章 · 共 N/60 星」，右星级 `ProgressBar`。
   - 交互：吸顶（§7.2）。
2. **章节 Tab 筛选**：`Tabs`（全部/丛林/沙漠/雪地/城镇）+ 每日挑战入口卡。
   - 内容：每日挑战卡 =「今日挑战 · 沙暴要塞」+ 日期 +「剩余可挑战」标记。
3. **麻绳关卡地图**（签名元素）：20 个关卡节点沿一条蜿蜒绳线串联，节点 = 弹珠圆点。
   - 内容：每节点显示编号 + 0~3 星；通关态=填充弹珠，锁定态=灰色绳结+🔒。
   - 交互：点击节点 → 对应卡片定位/进入 `/play/lv-XX`；锁定态点击 Toast「通关上一关解锁」。
4. **关卡卡片列表**：`Card`网格（桌面 2 列、手机 1 列），每卡 = 缩略图 + 编号 + 名称 + 星级 + 最优得分 + 锁定遮罩。
   - 内容示例：「LV-06 · 沙漠驿站 / ★★☆ / 最佳 4820」。
   - 交互：点卡 → `/play/lv-06`；锁定卡点击给解锁提示。

### 6.3 游戏页 `/play/:id`（CSR，Canvas 核心）

1. **顶部菜单条**：返回（⌫ 选关）、关卡名「LV-03 · 吊桥险路」、星级目标提示、音量开关、重开。
   - 交互：返回 = `history.back()`；重开 = `Dialog.confirm` 后重置本局；音量切换写 localStorage。
2. **Canvas 游戏区**：弹弓 + 弹珠 + 障碍堡垒 + 软泥怪；引擎 Matter.js 懒加载。
   - 交互：touch/mouse 拖拽 → 实时轨迹虚线预览 → 松开发射；桌面鼠标降级同逻辑。
3. **剩余弹珠/道具栏**：剩余弹珠×N + 道具（瞄准线/加速/额外弹珠，本期 Should）。
   - 内容：「弹珠 ×2 · 阿火」「瞄准线 1 次」。
   - 交互：点道具启用。
4. **局内反馈层**：得分飘字、碎块、通关/失败弹层（节流处理）。

### 6.4 结算页 `/result/:id`（CSR）

1. **得分揭示**：大数字分数（display 字体）+ 0~3 星逐个弹出（胜=入星动画，负=鼓励语）。
   - 内容：「4820 分 ★★★ 新纪录！」/「差一点点，再试一次」。
2. **成绩对比卡**：本关历史最优勾选 + 本局得分对比。
3. **荣誉/分享卡生成**：按钮「炫耀一下」→ 生成 `/share/:shareId` + 复制链接；成绩卡预览图（1200×630 og）。
4. **操作按钮组**：重玩本关 / 下一关 / 看排行榜。
   - 交互：下一关 → `/play/lv-N`；若已登录且达到提交分数，静默 `POST /api/score`。

### 6.5 排行榜 `/leaderboard`

1. **头部**：标题「全球排行榜」+ 规则说明折叠（`Collapse`）。
   - 内容：规则 = 「总星为主排序，分数为同星破平；得分=摧毁目标+剩余弹珠奖励」。
2. **我的名次卡**（登录态）：游客态显示「登录后查看我的名次」+「去登录」；登录后显示名次/总星/分数。
3. **公开总榜 Top20**：`List`（名次/头像/昵称/总星/分数），前三名金色/银/铜高亮。
4. **好友榜（预留）**：标签 + 空态占位。

### 6.6 分享落地 `/share/:shareId`

1. **成绩卡**：分享者昵称、得分/星级/关卡名、日期、封面图（og 图）。
   - 内容：「@弹弓大师老王 在《吊桥险路》拿下 4820 分 ★★★」。
2. **主 CTA**：「立即挑战」→ 跳对应 `/play/referer` 或首页续玩。
3. **打开支付宝引导**：浏览器 →「在支付宝中打开」`/go-alipay`；支付宝内 → 直接玩。
4. **相关关卡推荐**：3 张关卡卡。

### 6.7 攻略 `/guide/:slug`

1. **文章头**：标题、摘要、日期、封面图（16:9）。
   - 内容示例：标题「弹弓小队：从零到三星的通关手感」；摘要「力度、弹道与三星要点」。
2. **正文分节**：真实图文（弹弓力度/弹道预判/三星技巧/难度曲线），配 3~5 张示意图。
3. **适合关卡列表**：3~5 张关卡卡 + 「去挑战」。
4. **相关攻略/返回**：页脚返回首页/关卡列表。

---

## 7. 状态与体验细节

### 7.1 加载 / 骨架 / 空 / 错 / 重试

- **加载中**：SSG 页首屏真 HTML 直出，不闪骨架；hydrate 后拉登录态区块单独骨架（`Skeleton`）。CSR 页（`/play`、`/result`）进页面先出骨架（游戏区用「准备弹弓…」占位 + 引擎加载进度）。
- **空状态**：榜单空 → `Empty` +「还没有成绩，第一个上榜的人就是你」+ CTA 去玩；关卡/我的进度空 → 引导「开始第一关」。
- **错误/断网**：`ErrorBlock`「网络开小差了」+ 重试按钮；网络异常与 5xx 文案区分；弱网图片懒加载 + 占位色块。
- **未登录**：提交成绩/我的名次处 → 提示「登录后可同步与冲榜」+「去登录」（`Dialog` 确认后走 OAuth）。
- **无权限**：本机存储异常（隐私模式/空间满）→ 静默降级为「本局成绩不持久」+ 非阻断提示。
- **支付态（预留）**：未来 wap.pay 成功/失败/处理中分别 `Toast/Dialog`：处理中轮询、成功进结算、失败可重试 + 回上一屏兜底（本期不实现，仅预留文案位）。

### 7.2 微交互

- **转场**：页间整页加载（无原生转场）；首屏用淡入/上移 CSS 过渡减少「白感」；结算星星逐个弹性入（`prefers-reduced-motion` 关闭）。
- **Toast**：用 antd-mobile `Toast`——解锁提示、成绩提交「已上榜」、复制链接「已复制」；关键操作用 `Dialog.confirm`（重开、下一关放弃当前局）。
- **吸顶**：`/levels` 进度栏吸顶（`position: sticky` + 安全区）。
- **返回顶部**：`/levels`、`/leaderboard` 长页右下悬浮「回顶」按钮（滚过一屏出现）。
- **点击反馈/防抖**：可点元素 `:active` 态；提交成绩按钮防重复（提交即禁用）。
- **收藏/历史/继续**：浏览器无原生收藏，用**本机 localStorage 存档**承载「最近关卡/星星」；首页提供「继续第 N 关」入口 + 「最近玩过」列表。
- **分享引导**：结算/首页引导「炫耀一下」；App 内引导复制链接，浏览器引导 `openPageInAlipay`。
- **横竖屏**：游戏竖屏游玩（弹弓为主），横屏不崩（CSS 媒体查询适配）；桌面 `max-width` 居中 + 鼠标拖拽。
- **安全区**：顶部贴 `env(safe-area-inset-top)`、底部吸底栏 `padding-bottom: calc(env(safe-area-inset-bottom) + Npx)`。

---

## 8. 接口契约与 mock

> 统一约定：前缀 `/api`；成功壳 `{ ok: true, data: ... }`，失败 `{ ok: false, code, message }`；列表分页字段 `{ list, total }`。本期全部 **前端 mock + localStorage**，字段按「未来真实后端」设计。SSR 期 mock 不能抛错导致整页降级（try/catch 兜底返回静态数据）。

### 8.1 `GET /api/levels` — 关卡列表（公开）

字段：`id` / `name` / `chapter` / `chapterName` / `theme` / `stars`(0~3) / `bestScore` / `locked` / `thumbnail` / `marbles`(可用弹珠数组) / `targets`(目标数) / `unlockStars`(解锁累计星数)。

示例（截取 3 条，完整 20 条见下表）：

```json
{ "ok": true, "data": { "list": [
  { "id": "lv-01", "name": "第一关 · 丛林清晨", "chapter": "jungle", "chapterName": "丛林",
    "theme": "jungle", "stars": 3, "bestScore": 5120, "locked": false,
    "thumbnail": "/images/levels/jungle-01.webp",
    "marbles": [{ "type": "fire", "count": 3 }], "targets": 2, "unlockStars": 0 },
  { "id": "lv-02", "name": "第二关 · 藤蔓密林", "chapter": "jungle", "chapterName": "丛林",
    "theme": "jungle", "stars": 0, "bestScore": 0, "locked": false,
    "thumbnail": "/images/levels/jungle-02.webp",
    "marbles": [{ "type": "fire", "count": 3 }], "targets": 3, "unlockStars": 3 },
  { "id": "lv-06", "name": "第六关 · 沙漠驿站", "chapter": "desert", "chapterName": "沙漠",
    "theme": "desert", "stars": 2, "bestScore": 4820, "locked": false,
    "thumbnail": "/images/levels/desert-01.webp",
    "marbles": [{ "type": "fire", "count": 2 }, { "type": "thunder", "count": 1 }],
    "targets": 4, "unlockStars": 15 }
], "total": 20 } }
```

**20 关完整 mock 表**（`bestScore`/`stars` 为“示例已玩过的存档”，全新游客均为 0/未解锁）：

| id | name | chapter | theme | ⭐示例 | bestScore示例 | locked示例 |
|---|---|---|---|---|---|---|
| lv-01 | 第一关 · 丛林清晨 | 丛林 | jungle | 3 | 5120 | false |
| lv-02 | 第二关 · 藤蔓密林 | 丛林 | jungle | 0 | 0 | false |
| lv-03 | 第三关 · 吊桥险路 | 丛林 | jungle | 0 | 0 | false |
| lv-04 | 第四关 · 古树之巅 | 丛林 | jungle | 0 | 0 | false |
| lv-05 | 第五关 · 丛林大本营 | 丛林 | jungle | 0 | 0 | false |
| lv-06 | 第六关 · 沙漠驿站 | 沙漠 | desert | 2 | 4820 | false |
| lv-07 | 第七关 · 流沙陷阱 | 沙漠 | desert | 0 | 0 | false |
| lv-08 | 第八关 · 仙人掌谷 | 沙漠 | desert | 0 | 0 | false |
| lv-09 | 第九关 · 金字塔谜题 | 沙漠 | desert | 0 | 0 | false |
| lv-10 | 第十关 · 沙暴要塞 | 沙漠 | desert | 0 | 0 | false |
| lv-11 | 第十一关 · 雪原初临 | 雪地 | snow | 1 | 2360 | false |
| lv-12 | 第十二关 · 冰湖碎裂 | 雪地 | snow | 0 | 0 | false |
| lv-13 | 第十三关 · 松林木屋 | 雪地 | snow | 0 | 0 | false |
| lv-14 | 第十四关 · 雪崩隘口 | 雪地 | snow | 0 | 0 | false |
| lv-15 | 第十五关 · 冰川城堡 | 雪地 | snow | 0 | 0 | false |
| lv-16 | 第十六关 · 小镇屋顶 | 城镇 | town | 0 | 0 | false |
| lv-17 | 第十七关 · 谷仓围困 | 城镇 | town | 0 | 0 | false |
| lv-18 | 第十八关 · 集市闹市 | 城镇 | town | 0 | 0 | false |
| lv-19 | 第十九关 · 高塔危楼 | 城镇 | town | 0 | 0 | false |
| lv-20 | 第二十关 · 市政厅总攻 | 城镇 | town | 0 | 0 | false |

> 每章 5 关；解锁规则：累计星数达 `unlockStars` 解锁；缩略图同风格按主题复用前景，背景生成着色。

### 8.2 `GET /api/levels/:id` — 单关配置（公开）

字段：同 §8.1 关卡字段 + `obstacles`（堡垒材质布局）+ `autoSave`（是否启用本局存档）+ `isDaily`。

```json
{ "ok": true, "data": {
  "id": "lv-03", "name": "第三关 · 吊桥险路", "chapter": "jungle", "theme": "jungle",
  "marbles": [{ "type": "fire", "count": 3 }],
  "obstacles": [
    { "kind": "wood", "shape": "plank", "x": 320, "y": 210, "w": 90, "h": 12 },
    { "kind": "glass", "shape": "box", "x": 360, "y": 180, "w": 18, "h": 18 },
    { "kind": "slime", "x": 380, "y": 150, "r": 12 }
  ],
  "targets": 3, "isDaily": false, "autoSave": true } }
```

`id="daily"` 返回每日挑战：

```json
{ "ok": true, "data": { "id": "daily", "name": "今日挑战 · 沙暴要塞", "theme": "desert",
  "marbles": [{ "type": "fire", "count": 2 }, { "type": "thunder", "count": 1 }],
  "targets": 5, "isDaily": true, "date": "2026-11-05", "autoSave": false } }
```

### 8.3 `GET /api/leaderboard/top` — 公开总榜 Top20（公开）

字段：`rank` / `nickname` / `avatar`(emoji 或占位 URL) / `totalStars` / `score`。

```json
{ "ok": true, "data": { "list": [ { "rank": 1, "nickname": "弹弓大师老王", "avatar": "🏆", "totalStars": 60, "score": 1284000 } ] } }
```

**Top20 示例**：

| rank | nickname | avatar | totalStars | score |
|---|---|---|---|---|
| 1 | 弹弓大师老王 | 🏆 | 60 | 1284000 |
| 2 | 三颗星猎人 | ⭐ | 60 | 1250100 |
| 3 | 清晨的弹珠 | 🟠 | 59 | 1198000 |
| 4 | 阿火的应援团 | 🔥 | 57 | 1103200 |
| 5 | 软泥怪克星 | 🟢 | 55 | 1045000 |
| 6 | 星语心愿 | ✨ | 52 | 986000 |
| 7 | 一只小弹珠 | 🔵 | 48 | 874000 |
| 8 | 云端射手 | ☁️ | 46 | 812000 |
| 9 | 迷宫里的猫 | 🐱 | 44 | 765000 |
| 10 | 卡在第五关 | 😤 | 15 | 232000 |
| 11 | 首富不是梦 | 💰 | 14 | 218000 |
| 12 | 今天也要三星 | 🌟 | 13 | 201000 |
| 13 | 弹无虚发 | 🎯 | 12 | 187000 |
| 14 | 躺平打弹珠 | 🛋️ | 11 | 166000 |
| 15 | 桃子汽水 | 🍑 | 10 | 154000 |
| 16 | 老板别抓我摸鱼 | 🙈 | 9 | 132000 |
| 17 | 地铁里手滑 | 🚇 | 8 | 118000 |
| 18 | 只为通关 | 🎮 | 7 | 99000 |
| 19 | 星尘骑士 | 🌌 | 6 | 84000 |
| 20 | 我是来看攻略的 | 📖 | 5 | 70000 |

### 8.4 `POST /api/score` — 提交成绩（OAuth，本期 mock 写 localStorage）

字段：请求 `{ levelId, score, stars }`；响应 `{ rank, totalStars, isNewRecord }`。

```json
// 请求
{ "levelId": "lv-06", "score": 4820, "stars": 3 }
// 响应
{ "ok": true, "data": { "rank": 5, "totalStars": 57, "isNewRecord": true } }
```

```json
// 未登录降级（本机）
{ "ok": true, "data": { "rank": null, "totalStars": 3, "isNewRecord": true, "localOnly": true } }
```

### 8.5 `GET /api/me/rank` — 我的名次（OAuth）

字段：`me` = `{ nickname, avatar, totalStars, score, rank }`。

```json
{ "ok": true, "data": { "rank": 5, "nickname": "三颗星猎人", "avatar": "⭐", "totalStars": 57, "score": 1103200 } }
```

### 8.6 `POST /api/share` — 生成分享卡（mock 本地生成 shareId）

字段：请求 `{ levelId, score, stars }`；响应 `{ shareId, url, title, desc, ogImage }`。

```json
{ "ok": true, "data": { "shareId": "sh_8f3a_001", "url": "/share/sh_8f3a_001",
  "title": "三颗星猎人在弹弓小队拿下 4820 分 · 沙漠驿站",
  "desc": "3 星通关！快来挑战我", "ogImage": "/images/og/share-1200x630.webp" } }
```

### 8.7 `GET /api/share/:shareId` — 分享卡数据（公开）

字段：`shareId` / `nickname` / `levelId` / `levelName` / `score` / `stars` / `date` / `cover`。

```json
{ "ok": true, "data": { "shareId": "sh_8f3a_001", "nickname": "三颗星猎人", "levelId": "lv-06",
  "levelName": "第六关 · 沙漠驿站", "score": 4820, "stars": 3, "date": "2026-11-05",
  "cover": "/images/og/share-1200x630.webp" } }
```

### 8.8 `GET /api/guide/:slug` — 攻略内容（公开，1 篇）

字段：`slug` / `title` / `abstract` / `cover` / `date` / `sections[] {heading, body, image}` / `relatedLevels[]`。

```json
{ "ok": true, "data": { "slug": "slingshot-tips", "title": "弹弓小队：从零到三星的通关手感",
  "abstract": "力度、弹道预判与三星要点，一篇文章讲透。", "cover": "/images/guide/cover-16x9.webp",
  "date": "2026-11-01",
  "sections": [
    { "heading": "先学会看轨迹虚线", "body": "拖得越远弹力越大，虚线末端的落点就是你命中点；先瞄底部支撑，再考虑连锁倒塌。", "image": "/images/guide/aim-16x9.webp" },
    { "heading": "三星要点：省弹珠 + 速拆", "body": "剩余弹珠有分，一颗弹珠清场比三颗清场分数高一个量级；优先击打堡垒底角。", "image": "/images/guide/stars-16x9.webp" },
    { "heading": "不同材质的拆法", "body": "木头用撞、玻璃用穿、石头要垫高处让重力帮忙、铁块尽量避开只打软泥怪。", "image": "/images/guide/material-16x9.webp" }
  ],
  "relatedLevels": ["lv-01", "lv-03", "lv-06"] } }
```

### 8.9 `POST /api/pay/create` — 下单 wap.pay（预留，本期不实现）

字段（预留形状）：请求 `{ itemId, amount }`；响应 `{ payUrl }`（服务端生成 `alipay.trade.wap.pay` 跳转 URL）。前端收到后 `location.assign(payUrl)`。鉴权 = 服务端 + AppId + 私钥（**前端永不可见**）。

---

## 9. 图片资源方案

> 本步骤只列**需求清单**（不下载）；下载/生成由下一节点「图片素材采集」完成。全部资源本地存放 `public/images/<模块>/<文件名>`。来源站点仅从允许清单中选择；原创 IP 角色/徽标/拼版为「原创矢量绘制（不下载）」。格式：照片类 WebP，图标/矢量类 SVG（精灵图可导出 PNG）。

### 9.1 图片资源需求表

| 编号 | 页面/区块 | 用途 | 数量 | 尺寸比例·像素 | 格式 | 风格描述 | 建议搜索关键词（中/英） | 建议来源（仅限清单） | 加载策略 | 本地路径约定 |
|---|---|---|---|---|---|---|---|---|---|---|
| I-01 | 全局 App icon / favicon | 应用图标 + 站标 | 2 | icon 1024×1024；favicon 32/48/180 | SVG→PNG、ico | 原创「弹弓+弹珠」徽标，扁平圆润、高饱和、无描边 | 自绘（无搜索） | 原创矢量绘制 | preload(SVG 内联)/favicon link | public/images/global/app-icon.svg / favicon.png |
| I-02 | 全局 OG 默认图 | 分享/封面兜底 | 1 | **1200×630** | WebP | 游戏名+徽标+一句 tagline，信息前置 | 自绘拼版 | 原创矢量绘制 | og:image（进 head） | public/images/og/og-default-1200x630.webp |
| I-03 | `/` Hero 主视觉 | 首屏大图（LCP） | 1 | 16:9（宽 ≥1200） | WebP | 弹弓+待发弹珠+堡垒剪影，松木工坊质感、明快 | slingshot / catapult / play | Storyset（插画，可再着色） | **LCP 预加载**（next/image `priority`） | public/images/home/hero-16x9.webp |
| I-04 | `/levels` 关卡缩略图 | 20 关卡卡封面 | 20 | 16:9 | WebP | 按章节配色：丛林绿/沙漠黄/雪地蓝/城镇暖；低饱和背景+高饱和前景 | jungle / desert / snow covered mountain / small town（可按主题） | Unsplash / Pexels / Pixabay（实拍底图）+ Storyset 前景叠加 | next/image 懒加载（`lazy`） | public/images/levels/jungle-01.webp … town-05.webp |
| I-05 | `/levels` 章节图标 | 章节筛选/关卡卡标 | 4 | 1:1（≥96） | SVG | 丛林树/沙漠仙人掌/雪花/房屋，扁平单色可读 | tree / cactus / snowflake / home icon | Lucide / Tabler Icons（MIT） | 内联 SVG（随组件） | public/images/levels/chapter-*.svg |
| I-06 | 局内 `/play` 角色/道具 Sprite | 弹珠×3、弹弓、障碍（木/玻璃/石/铁）、软泥怪、道具 | 6~10 | 透明 PNG，1:1~2:1 | SVG→PNG | 原创扁平卡通、棱角障碍可「物理破碎」、软泥怪 Q 萌 | 自绘（无搜索）；道具图标可引 Lucide | 原创矢量绘制 + Lucide 道具图标 | 游戏模块懒加载时随包载入 | public/images/game/sprites/*.svg|png |
| I-07 | 局内 `/play` 背景图层 | 每章节横版背景 | 4~5 | 16:9 横版 | WebP | 扁平、低饱和背景、前景高饱和主体（与 I-04 同风格） | jungle horizon / desert dunes / snow valley / town skyline | Unsplash / Pexels / Wikimedia Commons | 游戏模块懒加载 | public/images/game/bg/jungle.webp 等 |
| I-08 | `/result` 结算插画 | 胜利/失败情绪 | 2 | 1:1 或 16:9 | WebP/SVG | 扁平卡通：庆祝/鼓励（弹珠欢呼 vs 弹珠垂头） | celebration / encouragement | Storyset / unDraw | 结算页懒加载 | public/images/result/win.png · lose.png |
| I-09 | `/leaderboard` 头像占位 | Top20 头像 | 20 | 1:1（≥64） | SVG/emoji | 统一占位风格（首字母徽章/emoji），避免真人肖像 | avatar placeholder / emoji face | Twemoji / Noto Emoji；或首字母 SVG 自绘 | 榜单列表懒加载 | public/images/avatar/a01.svg …（或 emoji 常量） |
| I-10 | `/share` 分享卡片封面 | 成绩卡 OG 图 | 1 | **1200×630** | WebP | og:image 标准、logo 清晰、成绩数字前置 | 自绘拼版（复用 I-02+I-06） | 原创矢量绘制 | og:image（进 `<head>`） | public/images/og/share-1200x630.webp |
| I-11 | `/guide` 攻略配图 | 教程示意（瞄准/三星/材质） | 3~5 | 16:9 | WebP/SVG | 教程示意图、箭头标注清晰、非「测试」 | tutorial / arrow diagram | unDraw / Open Peeps（示意图）+ 自绘箭头标注 | 攻略正文懒加载 | public/images/guide/aim-16x9.webp · stars · material |
| I-12 | 全局空态/弱网/引导 | 空状态插画、弱网、引导 | 4~6 | 1:1 或 4:3 | SVG | 扁平卡通、友好提示（查无成绩/断网/引导三步） | empty state / offline / onboarding | Storyset / unDraw | 按空态出现懒加载 | public/images/common/empty-*.svg · offline.svg |

### 9.2 加载策略总则

- LCP 元素（`/` Hero I-03、OG I-02/I-10）用 `next/image` `priority`/`fetchPriority="high"` 预加载；其余图片 `loading="lazy"` + `srcset`（1x/2x/3x 或 CDN 裁切）。
- 游戏引擎与 Sprite 全部随 `play` 组件**懒加载**，不计入首屏 bundle。
- 已约无图片需求的场景：无——本期各级页面均有图片/图标位（未发现「本次无需图片素材」的页面）。

---

## 10. 非功能落地要点（设计侧约束）

- 性能预算：LCP<2.5s、CLS<0.1、INP<200ms；首屏 JS<300KB(gzip)；Matter.js + Canvas 懒加载不阻塞首屏；图片全 WebP/SVG。
- 移动优先响应式：375 设计稿 + `postcss-pxtorem`；桌面 `max-width:560px` 居中 + 鼠标降级；安全区 `env(safe-area-inset-*)`；触摸热区 ≥44px。
- a11y：对比度达标（正文 `#2B2A28` on `#F6EFE3` ✓）、可缩放、焦点可达；游戏 Canvas 提供可访问替代文案（`aria-label` + 键盘重开/返回）。
- 合规：无 Rovio IP 名称/美术/音效；素材来源可追溯（原创 / 上表允许清单）。

---

## 11. 环境与工程边界（G3 前置确认）

- 本期为**重建 H5 工程**（当前工作目录是无关的 Tauri 壳项目 PakePlus，需按 skill 模板在干净 Next App Router 工程落地），目录/类型/env 边界以 `references/coding-standards.md` 为准。
- 公私区隔：`lib/api`（接口层）、`container/*`（能力层）、`components/*`（页面壳）；游戏核心 `game/*` 全部 `'use client'` + 懒加载；公开页面反 cloaking（爬虫与用户同一份 HTML）。
- 护栏脚本（后续 G4 跑）：`scripts/check-env.mjs` / `check-project.mjs` / `check-seo.mjs` / `check-build.mjs`。

---

## 12. 关键取舍结论（已确认定稿 → 进入 G3）

| # | 关键取舍 | 定稿结论 | 状态 |
|---|---|---|---|
| 1 | 视觉风格 | **B 松木工坊（手作玩具）** | ✅ 已确认 |
| 2 | 分享落地页渲染 | **SSG + ISR**（选项 A） | ✅ 已确认 |
| 3 | 原创角色命名 | 站名《弹弓小队》；主角=「弹珠小队」（阿火/阿冰/阿雷）；敌人=「软泥怪」 | ✅ 已确认（沿用） |

> 定稿时间：2026-11-05。URL 结构 7 屏、逐页渲染、mock 20 关 + 20 榜、图片资源 13 项均已按上述结论锁定，可据此进入 G3 编码与实现。