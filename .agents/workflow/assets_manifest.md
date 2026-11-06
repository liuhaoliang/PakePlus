# 图片素材清单（assets_manifest）

> 节点：图片素材采集。对应 `design.md §7 图片资源方案` 与 `requirements.md §9 图片资源需求`。
> 落地路径遵循本节点指令 `public/images/<模块>/`（实现阶段如需并入 `app/` 子目录，按 `design.md §7` 迁移即可）。

## 采集策略说明

- **全部素材为原创自绘**（矢量 SVG 绘制，照片/插画位按设计表规格由同一套原创矢量稿本地合成为 WebP），不包含任何第三方图片、无水印、无人物肖像、无商标/品牌元素，规避 Rovio 角色与商标。
- 未使用外部图库照片：本环境对外网图库（Unsplash/Pexels/Pixabay 等）访问不可靠（TLS/连接失败）；且 `design.md §7` 总原则本就为「游戏 Sprite 与图标优先原创 SVG 自绘」「照片纹理/背景用免费图库 + 原创插画叠色」。故表内需要 WebP 的位全部按「原创插画合成」方式产出，许可更干净（自有版权，可商用，无需署名）。
- 头像色块（IMG-11~20）、瞄准虚线/粒子/结算底图（IMG-40）按设计为 CSS / Canvas 程序化，**无需落盘**；关卡 og 图（IMG-27）由章节底图 + 成绩卡模板在构建期合成 60 张，**本阶段不产出独立文件**。
- 文件名小写短横线；照片/插画为 WebP，图标与游戏 sprite 为 SVG；首屏 LCP 图（hero）14.5KB ≤ 100KB，其余单张全部 ≤ 200KB。

## 素材清单

| 图片位编号 | 页面 | 本地路径 | 来源站点 | 原始链接 | 作者 | 许可证 | 是否需署名 | 尺寸与体积 | 是否占位图 |
|---|---|---|---|---|---|---|---|---|---|
| IMG-01 | 首页 Hero / og:image | `public/images/home/hero.webp` | 原创自绘（本地合成） | 无 | 本项目原创（弹弹鸟） | 自有版权（可商用） | 否 | 1200×630 · 14.5 KB | 否 |
| IMG-02 | 首页三步玩法·瞄准 | `public/images/home/step-aim.svg` | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 96×96 · 1.1 KB | 否 |
| IMG-03 | 首页三步玩法·发射 | `public/images/home/step-launch.svg` | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 96×96 · 1.2 KB | 否 |
| IMG-04 | 首页三步玩法·摧毁 | `public/images/home/step-crush.svg` | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 96×96 · 0.9 KB | 否 |
| IMG-05 | 首页关卡精选 / 落地页头图 1（木塔） | `public/images/levels/card-1.webp` | 原创自绘（本地合成） | 无 | 本项目原创 | 自有版权（可商用） | 否 | 640×360 · 8.1 KB | 否 |
| IMG-06 | 首页关卡精选 2（石堡） | `public/images/levels/card-2.webp` | 原创自绘（本地合成） | 无 | 本项目原创 | 自有版权（可商用） | 否 | 640×360 · 7.5 KB | 否 |
| IMG-07 | 首页关卡精选 3（玻璃塔） | `public/images/levels/card-3.webp` | 原创自绘（本地合成） | 无 | 本项目原创 | 自有版权（可商用） | 否 | 640×360 · 8.2 KB | 否 |
| IMG-08 | 首页关卡精选 4（木石混合） | `public/images/levels/card-4.webp` | 原创自绘（本地合成） | 无 | 本项目原创 | 自有版权（可商用） | 否 | 640×360 · 9.1 KB | 否 |
| IMG-09 | 首页关卡精选 5（高塔） | `public/images/levels/card-5.webp` | 原创自绘（本地合成） | 无 | 本项目原创 | 自有版权（可商用） | 否 | 640×360 · 8.1 KB | 否 |
| IMG-10 | 首页关卡精选 6（石桥+玻璃） | `public/images/levels/card-6.webp` | 原创自绘（本地合成） | 无 | 本项目原创 | 自有版权（可商用） | 否 | 640×360 · 7.3 KB | 否 |
| IMG-11~20 | 首页/榜单/我的·头像色块 | 无需落盘（CSS `avatarColor` + 首字符） | — | — | — | — | — | — | — |
| IMG-21 | 关卡列表·章节封面（绿林） | `public/images/chapters/ch-forest.webp` | 原创自绘（本地合成） | 无 | 本项目原创 | 自有版权（可商用） | 否 | 1200×400 · 7.2 KB | 否 |
| IMG-22 | 关卡列表·章节封面（橙山） | `public/images/chapters/ch-hill.webp` | 原创自绘（本地合成） | 无 | 本项目原创 | 自有版权（可商用） | 否 | 1200×400 · 6.0 KB | 否 |
| IMG-23 | 关卡列表·章节封面（蓝天） | `public/images/chapters/ch-cloud.webp` | 原创自绘（本地合成） | 无 | 本项目原创 | 自有版权（可商用） | 否 | 1200×400 · 5.9 KB | 否 |
| IMG-24 | 关卡网格·锁定态图标 | `public/images/levels/icon-lock.svg`（内联备用） | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 32×32 · 0.3 KB | 否 |
| IMG-25 | 关卡网格·星级图标 | `public/images/levels/icon-star.svg`（内联备用） | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 32×32 · 0.3 KB | 否 |
| IMG-26 | 关卡网格·完成态图标 | `public/images/levels/icon-check.svg`（内联备用） | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 32×32 · 0.3 KB | 否 |
| IMG-27 | 落地页 + og（60 关分享卡） | 构建期由 3 章底图（IMG-21~23）+ 成绩卡模板（IMG-47）合成，不产出独立素材 | — | — | — | — | — | 1200×630（构建期生成） | 否 |
| IMG-28 | 游戏页·弹弓 | `public/images/game/slingshot.svg` | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 240×160 · 0.7 KB | 否 |
| IMG-29 | 游戏页·小红鸟 | `public/images/game/bird-red.svg` | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 80×80 · 0.9 KB | 否 |
| IMG-30 | 游戏页·小黄鸟 | `public/images/game/bird-yellow.svg` | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 80×80 · 0.9 KB | 否 |
| IMG-31 | 游戏页·小蓝鸟 | `public/images/game/bird-blue.svg` | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 80×80 · 0.9 KB | 否 |
| IMG-32 | 游戏页·普通猪 | `public/images/game/pig.svg` | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 80×80 · 0.8 KB | 否 |
| IMG-33 | 游戏页·猪王 | `public/images/game/pig-king.svg` | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 80×80 · 0.9 KB | 否 |
| IMG-34 | 游戏页·木块材质 | `public/images/game/block-wood.svg` | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 120×24 平铺 · 0.5 KB | 否 |
| IMG-35 | 游戏页·石块材质 | `public/images/game/block-stone.svg` | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 120×24 平铺 · 0.5 KB | 否 |
| IMG-36 | 游戏页·玻璃块材质 | `public/images/game/block-glass.svg` | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 120×24 平铺 · 0.5 KB | 否 |
| IMG-37 | 游戏页·天空层 | `public/images/game/bg-sky.webp` | 原创自绘（本地合成） | 无 | 本项目原创 | 自有版权（可商用） | 否 | 1920×1080 · 11.4 KB | 否 |
| IMG-38 | 游戏页·远山层 | `public/images/game/bg-hill.webp`（含透明通道） | 原创自绘（本地合成） | 无 | 本项目原创 | 自有版权（可商用） | 否 | 1920×1080 · 10.2 KB | 否 |
| IMG-39 | 游戏页·地面层 | `public/images/game/bg-ground.webp`（含透明通道） | 原创自绘（本地合成） | 无 | 本项目原创 | 自有版权（可商用） | 否 | 1920×1080 · 9.9 KB | 否 |
| IMG-40 | 游戏页·瞄准虚线/粒子/结算底图 | 无需落盘（Canvas 程序化） | — | — | — | — | — | — | — |
| IMG-41 | 排行榜·金牌徽章 | `public/images/ranking/badge-gold.svg` | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 40×40 · 1.3 KB | 否 |
| IMG-42 | 排行榜·银牌徽章 | `public/images/ranking/badge-silver.svg` | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 40×40 · 1.3 KB | 否 |
| IMG-43 | 排行榜·铜牌徽章 | `public/images/ranking/badge-bronze.svg` | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 40×40 · 1.3 KB | 否 |
| IMG-44 | 全站·空榜单插画 | `public/images/empty/empty-rank.webp` | 原创自绘（本地合成） | 无 | 本项目原创 | 自有版权（可商用） | 否 | 480×360 · 3.3 KB | 否 |
| IMG-45 | 全站·断网/离线插画 | `public/images/empty/error-offline.webp` | 原创自绘（本地合成） | 无 | 本项目原创 | 自有版权（可商用） | 否 | 480×360 · 3.4 KB | 否 |
| IMG-46 | 全站·新手引导插画 | `public/images/empty/guide-welcome.webp` | 原创自绘（本地合成） | 无 | 本项目原创 | 自有版权（可商用） | 否 | 480×360 · 5.2 KB | 否 |
| IMG-47 | 分享·成绩卡片模板底图 | `public/images/share/score-card-template.svg` | 原创自绘 | 无 | 本项目原创 | 自有版权（可商用） | 否 | 1200×630 · 5.0 KB | 否 |

## 汇总

- 落盘文件：**35 个**（16 个 WebP + 19 个 SVG），另有 4 类程序化/CSS 位（头像色块、关卡状态图标内联、关卡 og、Canvas 反馈）不落盘。
- 需署名素材：**0 个**（全部原创自绘，无需第三方署名）。
- 占位图：**0 个**（未使用 Lorem Picsum 等开发占位图）。
- 外部图库备案：本次因环境外网访问受限、且设计总原则优先原创自绘，实际未从他站下载任何图片；如后续需要实拍质感，可按 `design.md §7` 建议源（Unsplash / Pexels / Pixabay）补采并在本清单回填来源/作者/许可。