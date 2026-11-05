# 代码评审报告 —— 《弹弓小队》（原创弹弓物理 H5 小游戏）

> 评审节点：verify / 代码评审
> 采用技能：code-review-skill
> 评审范围：`src/` 全部变更（App Router 页面、游戏引擎、数据层、容器层、组件）＋ 根配置
> 前序产物对照：`requirements.md`（G1）、`design.md`（G2）、`coding_summary.md`、`assets_manifest.md`
> 评审方式：静态代码审查（逐文件通读 + 关键逻辑推演 + 需求逐项核对）
> 审查时间（UTC）：2026-11-05
>
> **总体结论：🔄 Request Changes**（blocker = 1，重要问题 = 3，可选建议若干）

---

## 0. 一句话结论

整体工程质量良好：分层清晰、类型严格、SSR/CSR 边界正确、反 cloaking 与 SEO 处理到位、物理引擎的 `isStatic→un-static` NaN 坑有意识地规避。但发现 **1 个会破坏核心存档正确性的确定性逻辑 bug**（失败局被误标记为「已通关」），另有 3 个重要问题与若干体验细节，需修复后复评。

---

## 1. 评审结论与严重度统计

| 严重度 | 数量 | 说明 |
|---|---|---|
| 🔴 blocking | **1** | 必须修复后才能合并 |
| 🟡 important | 3 | 应修复，如坚持保留需说明理由 |
| 🟢 nit / 💡 suggestion | 6 | 不影响合并的体验/健壮性建议 |

**review_blocker_count = 1**

---

## 2. 🔴 Blocking（必须修复）

### B-1 失败局被标记为「已通关」，污染本地进度与继续/榜单逻辑

- **位置**：`src/lib/storage.ts:32-42`（`recordResult`）＋ `src/components/ResultScreen.tsx:38-43`
- **现象**：
  `recordResult` 无条件写入 `cleared: true`，而 `ResultScreen` 仅以 `score > 0` 作为写入条件（不区分胜负）：

  ```ts
  // storage.ts
  map[levelId] = {
    stars: Math.max(stars, prev?.stars ?? 0),
    score: Math.max(score, prev?.score ?? 0),
    cleared: true,            // ← 失败局也置 true
  };
  ```

  ```ts
  // ResultScreen.tsx
  useEffect(() => {
    if (!recordedRef.current && score > 0 && level) {
      record(id, score, stars);   // ← 只有 score>0，未判 stars>0（胜）
      recordedRef.current = true;
    }
  }, [score, stars, id, level, record]);
  ```

- **后果**（实测推演，均为确定性行为）：
  1. 玩家打塌若干木块但未击倒全部软泥怪（失败、`stars=0`、`score>0`）→ 该关被写入 `cleared: true`、`stars: 0`。
  2. `HomeActions.tsx:13-19` 用「第一个 `!cleared` 的关卡」决定「开始/继续第 N 关」→ 失败过的关卡被跳过，续玩定位错乱。
  3. `LeaderboardPanel.tsx:12` 的「通关」计数虚高。
  4. `LevelsBoard.tsx:100` 会把失败关卡从「未通关」错显为「N 分」。
- **修复建议**：写入条件改为「仅胜利时落盘进度」——`ResultScreen` 侧 `if (score > 0 && stars > 0)`，或给 `recordResult` 增加 `cleared` 参数并传 `stars > 0`；`cleared` 语义必须等同于「通关（stars ≥ 1）」。

---

## 3. 🟡 Important（应修复）

### I-1 铁块耐久判定疑似写反（高速弹丸反而零伤害）

- **位置**：`src/game/engine.ts:299-311`（`applyImpact`）
- **现象**：

  ```ts
  const damage = force > 9 && d.blockKind === "iron" ? 0 : 1;
  ```

  弹珠命中触发条件是 `speed > 3`（`engine.ts:273/277`），因此：铁块在弹珠速度 `3~9` 时会扣 1 HP，而速度 `>9`（满力直击）反而扣 0 HP。与 `coding_summary.md§4` 宣称的「铁 4 击」以及「力度越大越有效」的直觉相反。
- **影响**：满力暴击被铁块弹开且零伤害，玩家体验与关卡数值设计（`levels.ts` 后期大量 `iron`）不一致。
- **修复建议**：明确铁块破坏规则并修正表达式，例如「铁块仅受高速（`force > 9`）伤害，`hp=4` 需 4 次暴击」：`const damage = d.blockKind === "iron" ? (force > 9 ? 1 : 0) : 1;`（具体阈值以设计为准，但方向不应是“越快越无效”）。

### I-2 `destroyTarget` 立即 `finish`，与「延时判定」注释矛盾，连锁坍塌分数不结算

- **位置**：`src/game/engine.ts:313-323`
- **现象**：注释写「延时判定，让最后一击的连锁反映出来」，但代码在 `targets.size === 0` 时**同步**调用 `finish(true)`，没有任何延时或“结算后置”：
  ```ts
  if (this.targets.size === 0 && !this.finished) {
    // 延时判定，让最后一击的连锁反映出来
    this.finish(true);
  }
  ```
- **影响**：最后一颗弹珠击倒最后一只软泥怪的同时引发的上层木块/石块连锁坍塌，将不会被纳入分数（`destroyBlock` 的 `+100` 来不及触发）；「剩余弹珠奖励」也只按 `queue.length`（不含在飞弹珠）结算，得分与视觉表现不一致。
- **修复建议**：把「胜负结算」与「分数收敛」分离——待短延时（如 800~1200ms 或“场上无可动体且仍在坍塌块停止”的稳态判定）后再 `finish`；或在 `finish` 前先结算所有 `blocks` 的剩余状态。

### I-3 分享卡对非法 `levelId` 缺乏校验，「立即挑战」导向 404

- **位置**：`src/lib/api.ts:58-81`（`decodeShare`）＋ `src/app/share/[shareId]/page.tsx:68`
- **现象**：`decodeShare` 只判断 `!levelId` 为空，不校验 `getLevel(levelId)` 是否存在；`levelName` 用 `level?.name ?? "某关"` 兜底。因此可手工构造 `shareId` 指向不存在的关卡：分享落地页正常渲染（显示「某关」），但 `ShareActions` 的「立即挑战」跳到 `/play/{invalidId}`，因 `play/[id]/page.tsx` `dynamicParams=false` 直接 404。
- **影响**：正常链路（App 内分享）不受影响；但可被恶意/分享链接变体触发，落地体验断裂。
- **修复建议**：`decodeShare` 中当 `getLevel(levelId)` 不存在时返回 `null`；分享落地、分享 CTA 仅接受合法关卡。

---

## 4. 🟢 Nit / 💡 Suggestion（不阻断）

| # | 位置 | 说明 |
|---|---|---|
| N-1 | `src/game/engine.ts:178` | HUD「剩余弹珠」显示 `queue.length`，未计入当前已上膛弹珠；开局即少 1，与 `PlayScreen` 初值不一致。建议显示「已上膛 + 队列」总数。 |
| N-2 | `src/components/ResultScreen.tsx:45-47` | `isNewRecord` 在 `record` 异步写入进度前渲染，首帧可能闪现错误的「新纪录」文案；建议用一次性计算或延迟到进度更新后判定。 |
| N-3 | `src/components/ResultScreen.tsx:58` | `history.replaceState` 把地址栏改成 `/share/:id` 但页面内容仍是结算页，URL 与视图不一致；建议改为「复制链接」不改变当前地址，或真正跳转到分享落地页。 |
| N-4 | `src/lib/api.ts:53-56` | `shareId` 无签名，`score/stars` 可被任意伪造（构造 999999 分分享卡）。展示类 mock 阶段可接受，但上真实榜单/分享前需改服务端签名。 |
| N-5 | `src/lib/levels.ts:190-191` | `DAILY_LEVEL` 连续两次 `buildLayout(99, 1, 5)` 生成再拆取 obstacles/targetDefs，属冗余计算；建议缓存一次结果。 |
| N-6 | `src/components/GoAlipayScreen.tsx:11-19` | `?url=` 参数未做白名单/同源校验即拼入 scheme 跳转（虽经 `encodeURIComponent` + `openPageInAlipay` 双重编码，非 JS 执行），建议校验为站内相对路径或 `SITE_URL` 前缀。 |

---

## 5. 需求/设计核对（高优先级抽样）

| 需求点（来自 requirements/design） | 现状 | 结论 |
|---|---|---|
| 20 关可玩 | `LEVELS` 20 关 + `generateStaticParams` 全部预生成 | ✅ |
| 三星评分 + 结算 | 引擎星级 + `ResultScreen` | ✅（但受 B-1 存档污染） |
| 可分享成绩卡 | `/share/:shareId` SSG+ISR + shareId 编解码 | ✅（受 I-3 影响） |
| 可看榜单 | `/leaderboard` + mock Top20 + 本机成绩 | ✅ |
| 游客本地存档 | `storage.ts` + `useProgress` | ✅（受 B-1 影响） |
| `/levels` 每日挑战入口卡（日期/主题/剩余标记） | **缺失**：`LevelsBoard` 只渲染 `LEVELS`，`DAILY_LEVEL` 无任何 UI 入口；但 `levels/page.tsx:45` 文案仍宣称「每日挑战即时刷新」 | ⚠️ **Should 级缺口**（见 §6 G-1） |
| 章节筛选、星级进度条、锁定态 | `LevelsBoard` 已实现 | ✅ |
| 反 cloaking、robots/sitemap 分类 | `container/index.ts`、`robots.ts`、`sitemap.ts` 分工明确 | ✅ |
| 无 `my.*`/AlipayJSBridge 依赖（仅探测）+ scheme 唤起 | `container/index.ts` 已遵守 | ✅ |

---

## 6. 其他观察（不计入 blocker）

### G-1 每日挑战入口缺失（⚠️ Should 级功能缺口，非 Must）

`requirements.md` 将每日挑战定为 **Should**（准入线是「≥20 关可玩/可分享/可看榜/游客可玩」，不含每日挑战），故不计为 blocking；但 `/levels` 屏幕规格（requirements 126/147、design 212-213）明确要求「每日挑战入口卡（日期、主题、剩余可挑战标记）」，当前 UI 完全缺失且页面文案仍在宣传该功能，属于**规格与实现不一致**。建议在 G4 或下一迭代补齐入口卡，或修正页面文案避免误导。

### G-2 验证环境说明

本审查节点运行环境中 `node`/`npm` 不在 PATH（`command -v node` 为空、`node_modules/.bin/tsc` 依赖 `#!/usr/bin/env node` 无法执行），因此**未能独立重跑** `next build`/`tsc --noEmit`。评审采纳 `coding_summary.md§8` 既有构建证据（`next build` 通过、53 静态页生成、素材引用 0 缺失），并以静态代码推演为主要验证手段。建议在具备 Node 运行时的环境复跑一次 `npm run build` 与 `npm run lint` 作为复评门禁。

### G-3 依赖安全提示（沿用 G3 已自报）

`next@15.2.4` 安装时告警 CVE-2025-66478，建议升级补丁版后回归（coding_summary §9-2 亦已记录）。

---

## 7. 亮点（值得保留）

- **分层与控制流干净**：`app/`（路由/SEO）↔ `components/`（壳层）↔ `game/engine.ts`（物理/渲染纯模块）↔ `lib/`（类型/常量/数据），职责边界清晰。
- **类型严格**：`strict` + `noUncheckedIndexedAccess` + `noEmit`，`LevelDetail/ProgressMap` 等 DTO 与服务端形状对齐（如未来真实后端可平移）。
- **防御性编码一致**：`storage.ts` 隐私模式静默降级、`encodeShareId/decodeShareId` 的 base64url + 异常兜底、`GameCanvas` 指针换算用 `Math.max(1, rect.width)` 防除零。
- **能力边界自律**：全程未引入 AlipayJSBridge 写操作/私有 RPC/多 WebView，反 cloaking 注释与实现一致。
- **Matter.js 已知坑规避**：`isStatic` 与 `setStatic` 的 NaN 问题被有意识地绕过，属对物理库行为的正确理解。

---

## 8. 修复后复评清单（Checklist）

- [ ] B-1：仅胜局写入 `cleared`（存档正确性回归：输 3 次 → `cleared` 仍为 false）
- [ ] I-1：铁块耐久判定方向修正，并与数值设计达成一致
- [ ] I-2：胜负结算与分数收敛分离，连锁坍塌分数可兑现
- [ ] I-3：`decodeShare` 校验关卡存在性
- [ ] （可选）G-1：补齐 `/levels` 每日挑战入口卡 或 修正误导文案
- [ ] （可选）N-1~N-6 按优先级处理
- [ ] 复跑 `npm run build` + `npm run lint`（需 Node 运行时）